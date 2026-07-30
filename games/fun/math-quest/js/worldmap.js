/* =====================================================================
 * worldmap.js — 세계지도 (canvas)
 * ---------------------------------------------------------------------
 * 지역 8곳이 왼쪽에서 오른쪽으로 이어진 하나의 긴 세계지도.
 * 스테이지를 깰 때마다 내 캐릭터가 길을 따라 다음 칸으로 "걸어가고",
 * 카메라가 그 뒤를 따라간다. 손으로 밀어서 지도를 둘러볼 수도 있다.
 *
 * 좌표는 "월드 좌표"(RW × H)로 계산하고, 그릴 때만 카메라·배율을 적용한다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  var RW = 1150;     // 지역 하나의 가로 길이(월드 좌표)
  var H = 520;      // 지도 세로 길이(월드 좌표)

  var cv = null, ctx = null, dpr = 1;
  var viewW = 0, viewH = 0, scale = 1;
  var cam = { x: 0, target: 0 };
  var nodes = [];    // {region, stage, x, y, boss}
  var decos = [];    // {x, y, ch, size}
  var hero = { x: 0, y: 0, at: -1, walk: null, bob: 0 };
  var raf = 0, dragging = null, moved = 0, onPick = null, built = false;

  function lcg(seed) { var s = seed || 1; return function () { s = (s * 48271) % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------------------------------------------------------------
   * 노드·장식 위치 계산 (한 번만)
   * --------------------------------------------------------------- */
  function build() {
    nodes = []; decos = [];
    for (var i = 0; i < MQ.REGIONS.length; i++) {
      var r = MQ.REGIONS[i], n = r.stages;
      var x0 = i * RW + 110, span = RW - 220;
      for (var s = 0; s < n; s++) {
        var t = n === 1 ? 0 : s / (n - 1);
        nodes.push({
          region: i, stage: s, boss: s === n - 1,
          x: x0 + t * span,
          y: H * 0.52 + Math.sin(t * 5.2 + i * 1.7) * H * 0.20 + Math.cos(t * 2.6 + i) * H * 0.07
        });
      }
      /* 장식 — 길에서 멀리 떨어진 곳에만 */
      var rnd = lcg(1000 + i * 137);
      var mine = nodes.filter(function (nd) { return nd.region === i; });
      for (var d = 0; d < 46; d++) {
        var px = i * RW + rnd() * RW, py = 60 + rnd() * (H - 120), ok = true;
        for (var k = 0; k < mine.length; k++) {
          if (Math.abs(mine[k].x - px) < 70 && Math.abs(mine[k].y - py) < 70) { ok = false; break; }
        }
        if (!ok) continue;
        decos.push({ x: px, y: py, ch: r.deco[Math.floor(rnd() * r.deco.length)], size: 20 + rnd() * 22, region: i });
      }
    }
    built = true;
  }

  function nodeIndex(region, stage) {
    for (var i = 0; i < nodes.length; i++) if (nodes[i].region === region && nodes[i].stage === stage) return i;
    return 0;
  }
  function totalW() { return MQ.REGIONS.length * RW; }

  /* ---------------------------------------------------------------
   * 그리기
   * --------------------------------------------------------------- */
  function resize() {
    if (!cv) return;
    var box = cv.parentNode.getBoundingClientRect();
    viewW = Math.max(200, box.width);
    viewH = Math.max(180, box.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(viewW * dpr);
    cv.height = Math.round(viewH * dpr);
    cv.style.width = viewW + 'px';
    cv.style.height = viewH + 'px';
    scale = viewH / H;
    clampCam();
  }
  function clampCam() {
    var maxX = Math.max(0, totalW() - viewW / scale);
    cam.target = Math.max(0, Math.min(maxX, cam.target));
    cam.x = Math.max(0, Math.min(maxX, cam.x));
  }
  function w2s(x) { return (x - cam.x) * scale; }

  function edgeTop(x) { return H * 0.16 + Math.sin(x / 190) * 20 + Math.sin(x / 470) * 12; }
  function edgeBot(x) { return H * 0.90 + Math.cos(x / 210) * 18 + Math.sin(x / 520) * 10; }

  function roundedLand(g, i) {
    /* 지역 하나의 땅덩어리 — 위아래로 물결치는 띠 */
    var r = MQ.REGIONS[i], x0 = i * RW, x1 = x0 + RW;
    var top = H * 0.16, bot = H * 0.90;
    /* 파도는 절대 좌표로 계산해야 지역 경계에서 땅이 딱 맞물린다 */
    g.beginPath();
    g.moveTo(w2s(x0), edgeTop(x0) * scale);
    for (var x = x0; x <= x1; x += 30) g.lineTo(w2s(x), edgeTop(x) * scale);
    g.lineTo(w2s(x1), edgeTop(x1) * scale);
    for (var x2 = x1; x2 >= x0; x2 -= 30) g.lineTo(w2s(x2), edgeBot(x2) * scale);
    g.lineTo(w2s(x0), edgeBot(x0) * scale);
    g.closePath();
    var grd = g.createLinearGradient(0, top * scale, 0, bot * scale);
    grd.addColorStop(0, r.ground[0]);
    grd.addColorStop(1, r.ground[1]);
    g.fillStyle = grd;
    g.fill();
    /* 해안선 — 위아래만 그린다(지역 경계에 세로줄이 생기지 않게) */
    g.strokeStyle = 'rgba(255,255,255,.22)';
    g.lineWidth = 3;
    g.beginPath();
    for (var e = x0; e <= x1; e += 30) g.lineTo(w2s(e), edgeTop(e) * scale);
    g.stroke();
    g.beginPath();
    for (var e2 = x0; e2 <= x1; e2 += 30) g.lineTo(w2s(e2), edgeBot(e2) * scale);
    g.stroke();
  }

  function draw() {
    if (!ctx) return;
    var g = ctx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, viewW, viewH);

    var firstR = Math.max(0, Math.floor(cam.x / RW) - 1);
    var lastR = Math.min(MQ.REGIONS.length - 1, Math.floor((cam.x + viewW / scale) / RW) + 1);
    var openN = MQ.P.unlockedRegions(MQ.S);

    /* 바다(배경) */
    var sea = g.createLinearGradient(0, 0, 0, viewH);
    sea.addColorStop(0, '#12204d');
    sea.addColorStop(1, '#0a1330');
    g.fillStyle = sea;
    g.fillRect(0, 0, viewW, viewH);

    /* 물결 */
    g.strokeStyle = 'rgba(120,180,255,.13)';
    g.lineWidth = 2;
    for (var wv = 0; wv < 9; wv++) {
      var yy = (wv * 62 + 20) * scale;
      g.beginPath();
      for (var wx = 0; wx <= viewW; wx += 24) {
        g.lineTo(wx, yy + Math.sin((wx + cam.x * scale) / 42 + wv) * 3.5);
      }
      g.stroke();
    }

    /* 땅 + 장식 */
    for (var i = firstR; i <= lastR; i++) roundedLand(g, i);

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (var d = 0; d < decos.length; d++) {
      var dd = decos[d];
      if (dd.region < firstR || dd.region > lastR) continue;
      var sx = w2s(dd.x);
      if (sx < -60 || sx > viewW + 60) continue;
      g.globalAlpha = dd.region >= openN ? 0.28 : 0.92;
      g.font = (dd.size * scale) + 'px serif';
      g.fillText(dd.ch, sx, dd.y * scale);
    }
    g.globalAlpha = 1;

    /* 길 */
    var pathNodes = nodes.filter(function (n) { return n.region >= firstR && n.region <= lastR; });
    if (pathNodes.length > 1) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(60,40,20,.35)';
      g.lineWidth = 15 * scale;
      strokePath(g, pathNodes);
      g.strokeStyle = '#e8d5a8';
      g.lineWidth = 9 * scale;
      strokePath(g, pathNodes);
      g.setLineDash([2 * scale, 9 * scale]);
      g.strokeStyle = 'rgba(120,90,50,.45)';
      g.lineWidth = 3 * scale;
      strokePath(g, pathNodes);
      g.setLineDash([]);
    }

    /* 잠긴 지역 어둡게 */
    for (var lr = firstR; lr <= lastR; lr++) {
      if (lr < openN) continue;
      var lx = w2s(lr * RW), lw = RW * scale;
      g.fillStyle = 'rgba(4,6,20,.62)';
      g.fillRect(lx, 0, lw, viewH);
      g.fillStyle = '#e8ecff';
      g.font = 'bold ' + (26 * scale) + 'px sans-serif';
      g.fillText('🔒', lx + lw / 2, viewH * 0.42);
      g.font = 'bold ' + (20 * scale) + 'px sans-serif';
      g.fillText('Lv ' + MQ.REGIONS[lr].unlock + ' 에 열려요', lx + lw / 2, viewH * 0.55);
    }

    /* 지역 이름 깃발 */
    for (var ri = firstR; ri <= lastR; ri++) {
      var rr = MQ.REGIONS[ri];
      var left = w2s(ri * RW), right = w2s((ri + 1) * RW);
      if (right < 0 || left > viewW) continue;
      g.font = 'bold ' + (23 * scale) + 'px sans-serif';
      g.fillStyle = 'rgba(4,6,20,.55)';
      var tw = g.measureText(rr.emoji + ' ' + rr.name).width;
      /* 지역이 화면에 반만 보여도 이름표는 보이는 쪽 가운데에 둔다 */
      var cx = (Math.max(left, 0) + Math.min(right, viewW)) / 2;
      cx = Math.max(tw / 2 + 14 * scale, Math.min(viewW - tw / 2 - 14 * scale, cx));
      roundRect(g, cx - tw / 2 - 12 * scale, 12 * scale, tw + 24 * scale, 34 * scale, 12 * scale);
      g.fill();
      g.fillStyle = '#fff';
      g.fillText(rr.emoji + ' ' + rr.name, cx, 29 * scale);
    }

    /* 노드 */
    var S = MQ.S;
    for (var n = 0; n < nodes.length; n++) {
      var nd = nodes[n], x = w2s(nd.x), y = nd.y * scale;
      if (x < -70 || x > viewW + 70) continue;
      var done = !!S.cleared[nd.region + '-' + nd.stage];
      var open = nd.region < openN && (done || canEnter(nd));
      var rad = (nd.boss ? 30 : 23) * scale;

      g.beginPath(); g.arc(x, y + 4 * scale, rad, 0, 7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
      g.beginPath(); g.arc(x, y, rad, 0, 7);
      g.fillStyle = done ? '#3f8f52' : nd.boss ? '#8a2352' : open ? '#2b3573' : '#1a1f45';
      g.fill();
      g.lineWidth = 3 * scale;
      g.strokeStyle = done ? '#9df0b6' : nd.boss ? '#ff9dc4' : open ? '#ffd166' : 'rgba(255,255,255,.2)';
      g.stroke();

      g.font = (nd.boss ? 26 : 19) * scale + 'px serif';
      g.fillStyle = '#fff';
      g.fillText(nd.region >= openN ? '🔒' : nd.boss ? MQ.REGIONS[nd.region].boss.emoji : done ? '⭐' : open ? '⚔️' : '🔒',
        x, y + 1 * scale);

      if (!nd.boss) {
        g.font = 'bold ' + (12 * scale) + 'px sans-serif';
        g.fillStyle = 'rgba(255,255,255,.8)';
        g.fillText(String(nd.stage + 1), x, y + rad + 11 * scale);
      }
    }

    /* 내 캐릭터 */
    var skin = MQ.ITEM[S.inv.equipped.skin];
    var mount = MQ.ITEM[S.inv.equipped.mount];
    var hx = w2s(hero.x), hy = hero.y * scale - 46 * scale + Math.sin(hero.bob) * 3 * scale;
    /* 빛나는 발판 */
    g.beginPath();
    g.ellipse(hx, hero.y * scale + 6 * scale, 20 * scale, 7 * scale, 0, 0, 7);
    g.fillStyle = 'rgba(255,209,102,.35)'; g.fill();
    g.beginPath();
    g.ellipse(hx, hero.y * scale + 6 * scale, 13 * scale, 4.5 * scale, 0, 0, 7);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    /* 캐릭터 뒤에 밝은 원 — 배경과 섞이지 않게 */
    g.beginPath(); g.arc(hx, hy, 25 * scale, 0, 7);
    g.fillStyle = 'rgba(255,255,255,.20)'; g.fill();
    g.lineWidth = 3 * scale; g.strokeStyle = 'rgba(255,209,102,.9)'; g.stroke();
    if (mount) { g.font = (24 * scale) + 'px serif'; g.fillText(mount.emoji, hx + 20 * scale, hy + 12 * scale); }
    g.font = (34 * scale) + 'px serif';
    g.fillText(skin ? skin.emoji : '🧒', hx, hy + 2 * scale);
    /* "지금 여기" 말풍선 */
    if (!hero.walk) {
      var ph = hy - 30 * scale;
      g.font = 'bold ' + (13 * scale) + 'px sans-serif';
      var tw2 = g.measureText('지금 여기').width;
      g.fillStyle = 'rgba(255,209,102,.95)';
      roundRect(g, hx - tw2 / 2 - 8 * scale, ph - 11 * scale, tw2 + 16 * scale, 22 * scale, 9 * scale);
      g.fill();
      g.beginPath();
      g.moveTo(hx - 5 * scale, ph + 11 * scale); g.lineTo(hx + 5 * scale, ph + 11 * scale);
      g.lineTo(hx, ph + 18 * scale); g.closePath(); g.fill();
      g.fillStyle = '#3a2300';
      g.fillText('지금 여기', hx, ph);
    }

    g.textAlign = 'left';
  }

  function strokePath(g, pts) {
    g.beginPath();
    g.moveTo(w2s(pts[0].x), pts[0].y * scale);
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var mx = (a.x + b.x) / 2;
      g.quadraticCurveTo(w2s(a.x + (mx - a.x) * .6), a.y * scale, w2s(mx), (a.y + b.y) / 2 * scale);
      g.quadraticCurveTo(w2s(b.x - (b.x - mx) * .6), b.y * scale, w2s(b.x), b.y * scale);
    }
    g.stroke();
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /* 이 칸에 들어갈 수 있나 */
  function canEnter(nd) {
    var S = MQ.S;
    if (nd.region >= MQ.P.unlockedRegions(S)) return false;
    if (S.cleared[nd.region + '-' + nd.stage]) return true;
    if (nd.stage === 0) return true;
    return !!S.cleared[nd.region + '-' + (nd.stage - 1)];
  }

  /* ---------------------------------------------------------------
   * 애니메이션 루프
   * --------------------------------------------------------------- */
  function tick() {
    raf = 0;
    if (!cv || !cv.offsetParent) return;      // 화면이 숨겨져 있으면 멈춘다
    hero.bob += 0.08;

    if (hero.walk) {
      var w = hero.walk;
      w.t += 0.022;
      if (w.t >= 1) {
        hero.x = w.to.x; hero.y = w.to.y; hero.at = w.toIdx;
        hero.walk = null;
        if (w.done) w.done();
      } else {
        var e = w.t < .5 ? 2 * w.t * w.t : 1 - Math.pow(-2 * w.t + 2, 2) / 2;
        hero.x = w.from.x + (w.to.x - w.from.x) * e;
        hero.y = w.from.y + (w.to.y - w.from.y) * e - Math.sin(w.t * Math.PI) * 18;
      }
      cam.target = hero.x - (viewW / scale) / 2;
      clampCam();
    }
    cam.x += (cam.target - cam.x) * 0.12;
    if (Math.abs(cam.target - cam.x) < 0.3) cam.x = cam.target;
    draw();
    loop();
  }
  function loop() { if (!raf) raf = requestAnimationFrame(tick); }

  /* ---------------------------------------------------------------
   * 공개 API
   * --------------------------------------------------------------- */
  var World = MQ.World = {
    RW: RW, H: H,

    attach: function (canvas, pick) {
      cv = canvas; ctx = cv.getContext('2d'); onPick = pick;
      if (!built) build();
      resize();
      bindInput();
      window.addEventListener('resize', function () { resize(); draw(); });
      loop();
    },

    /* 화면이 다시 보일 때 */
    refresh: function () {
      if (!cv) return;
      resize();
      loop();
    },

    /* 캐릭터를 어떤 칸에 놓는다. animate=true 면 걸어간다 */
    goto: function (region, stage, animate, done) {
      if (!built) build();
      var idx = nodeIndex(region, stage);
      var to = nodes[idx];
      if (!to) return;
      if (!animate || hero.at < 0) {
        hero.x = to.x; hero.y = to.y; hero.at = idx; hero.walk = null;
        cam.target = to.x - (viewW / scale) / 2;
        cam.x = cam.target;
        clampCam();
      } else if (hero.at !== idx) {
        hero.walk = { from: { x: hero.x, y: hero.y }, to: to, toIdx: idx, t: 0, done: done };
        try { MQ.Snd.play('tap'); } catch (e) { }
      } else if (done) { done(); }
      loop();
    },

    /* 지역 하나를 화면 가운데로 */
    lookAt: function (region) {
      cam.target = region * RW + RW / 2 - (viewW / scale) / 2;
      clampCam();
      loop();
    },

    heroAt: function () { return hero.at >= 0 ? nodes[hero.at] : null; },
    walking: function () { return !!hero.walk; }
  };

  /* ---------------- 손가락·마우스 ---------------- */
  function bindInput() {
    cv.style.touchAction = 'pan-y';
    cv.addEventListener('pointerdown', function (e) {
      dragging = { x: e.clientX, camX: cam.x };
      moved = 0;
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragging.x;
      moved = Math.max(moved, Math.abs(dx));
      cam.target = dragging.camX - dx / scale;
      cam.x = cam.target;
      clampCam();
      loop();
    });
    function up(e) {
      if (!dragging) return;
      var wasDrag = moved > 8;
      dragging = null;
      if (wasDrag) return;
      /* 탭 → 노드 찾기 */
      var rect = cv.getBoundingClientRect();
      var mx = (e.clientX - rect.left) / scale + cam.x;
      var my = (e.clientY - rect.top) / scale;
      var best = null, bd = 1e9;
      for (var i = 0; i < nodes.length; i++) {
        var d = Math.pow(nodes[i].x - mx, 2) + Math.pow(nodes[i].y - my, 2);
        if (d < bd) { bd = d; best = nodes[i]; }
      }
      if (best && bd < 46 * 46 && onPick) onPick(best, canEnter(best));
    }
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', function () { dragging = null; });
    cv.addEventListener('wheel', function (e) {
      cam.target += (e.deltaY || e.deltaX) * 0.9;
      cam.x = cam.target;
      clampCam(); loop();
      e.preventDefault();
    }, { passive: false });
  }
})();
