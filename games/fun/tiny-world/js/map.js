/* ===========================================================
   Tiny World - js/map.js
   섬 그리기 · 카메라 · 충돌 · 타일 질문(무엇이 있나?)
   =========================================================== */
window.TW = window.TW || {};
TW.Map = (function () {
  var cv, ctx, S = 40, cam = { x: 0, y: 0 }, dpr = 1;
  var VW = 0, VH = 0;               /* 보이는 픽셀 크기 */
  var shakeOn = { x: 0, y: 0 };

  function init(canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    resize();
  }

  function resize() {
    if (!cv) return;
    var box = cv.parentNode.getBoundingClientRect();
    VW = Math.max(240, Math.floor(box.width));
    VH = Math.max(220, Math.floor(box.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.floor(VW * dpr);
    cv.height = Math.floor(VH * dpr);
    cv.style.width = VW + 'px';
    cv.style.height = VH + 'px';
    /* 타일 크기: 가로로 9칸, 세로로 12칸쯤 보이도록 (아이가 보기 쉽게 크게) */
    S = Math.max(30, Math.min(64, Math.floor(Math.min(VW / 9, VH / 12))));
  }

  /* ---------- 질문 함수들 ---------- */
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < TW.MAP.W && y < TW.MAP.H; }

  function regionLocked(x, y) {
    var r = TW.regionAt(x, y);
    var def = TW.REGIONS[r];
    if (!def || def.lock === 0) return null;
    return TW.state.regions[r] ? null : r;
  }

  function nodeAt(x, y) {
    var ns = TW.state.nodes;
    for (var i = 0; i < ns.length; i++) {
      if (ns[i].x === x && ns[i].y === y && ns[i].hp > 0) return ns[i];
    }
    return null;
  }

  function buildingAt(x, y) {
    var bs = TW.state.buildings;
    for (var i = 0; i < bs.length; i++) if (bs[i].x === x && bs[i].y === y) return bs[i];
    return null;
  }

  /* 세계수는 한 칸만 차지한다. 양옆(11·13열)은 북쪽으로 가는 길이므로 막지 않는다. */
  function isWorldTree(x, y) {
    var T = TW.MAP.tree;
    return x === T.x && y === T.y;
  }

  function isPortal(x, y) {
    return TW.state.tree.stage >= 4 && x === TW.MAP.portal.x && y === TW.MAP.portal.y;
  }

  function solidAt(x, y) {
    if (!inBounds(x, y)) return true;
    if (TW.terrainSolid(TW.terrainAt(x, y))) return true;
    if (regionLocked(x, y)) return true;
    if (isWorldTree(x, y)) return true;
    if (buildingAt(x, y)) return true;
    var n = nodeAt(x, y);
    if (n && TW.NODES[n.t].solid) return true;
    return false;
  }

  function canBuild(x, y) {
    if (!inBounds(x, y)) return false;
    var t = TW.terrainAt(x, y);
    if (t === 'water' || t === 'ocean' || t === 'path') return false;
    if (regionLocked(x, y)) return false;
    if (isWorldTree(x, y)) return false;
    if (buildingAt(x, y)) return false;
    if (nodeAt(x, y)) return false;
    /* 플레이어가 서 있는 칸에는 짓지 않는다 */
    var p = TW.state.pos;
    if (Math.floor(p.x) === x && Math.floor(p.y) === y) return false;
    /* 세계수 바로 앞 한 줄은 비워 둔다 */
    if (isWorldTree(x, y + 1)) return false;
    return true;
  }

  /* ---------- 자원 재생성 ---------- */
  function tickNodes(dt) {
    var ns = TW.state.nodes;
    for (var i = ns.length - 1; i >= 0; i--) {
      var n = ns[i];
      if (n.hp > 0) continue;
      if (n.rt > 0) {
        n.rt -= dt;
        if (n.rt <= 0) {
          if (TW.NODES[n.t].respawn > 0) { n.hp = TW.NODES[n.t].hp; n.rt = 0; }
          else ns.splice(i, 1);
        }
      } else ns.splice(i, 1);
    }
  }

  /* ---------- 상호작용 대상 찾기 ---------- */
  function nearestTarget() {
    var p = TW.state.pos, best = null, bd = 1e9;
    function consider(kind, x, y, extra) {
      var dx = (x + 0.5) - p.x, dy = (y + 0.5) - p.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1.45) return;
      if (d < bd) { bd = d; best = { kind: kind, x: x, y: y, extra: extra, dist: d }; }
    }
    var px = Math.floor(p.x), py = Math.floor(p.y);
    for (var dx = -2; dx <= 2; dx++) {
      for (var dy = -2; dy <= 2; dy++) {
        var x = px + dx, y = py + dy;
        if (!inBounds(x, y)) continue;
        if (isWorldTree(x, y)) consider('tree', x, y);
        if (isPortal(x, y)) consider('portal', x, y);
        var b = buildingAt(x, y);
        if (b) consider('building', x, y, b);
        var n = nodeAt(x, y);
        if (n) consider('node', x, y, n);
      }
    }
    /* 야생 정령 */
    TW.SPIRIT_ORDER.forEach(function (k) {
      var sp = TW.state.spirits[k];
      if (sp.spawned && !sp.friend) {
        var pos = TW.Spirits.posOf(k);
        var dx2 = pos.x - p.x, dy2 = pos.y - p.y;
        var d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d <= 1.6 && d < bd) { bd = d; best = { kind: 'spirit', x: Math.floor(pos.x), y: Math.floor(pos.y), extra: k, dist: d }; }
      }
    });
    return best;
  }

  /* ---------- 카메라 ---------- */
  function updateCamera() {
    var p = TW.state.pos;
    var tw = VW / S, th = VH / S;
    var cx = p.x - tw / 2, cy = p.y - th / 2;
    if (tw >= TW.MAP.W) cx = (TW.MAP.W - tw) / 2; else cx = Math.max(-0.5, Math.min(TW.MAP.W - tw + 0.5, cx));
    if (th >= TW.MAP.H) cy = (TW.MAP.H - th) / 2; else cy = Math.max(-0.5, Math.min(TW.MAP.H - th + 0.5, cy));
    cam.x = cx; cam.y = cy;
  }

  function screenToTile(sx, sy) {
    var r = cv.getBoundingClientRect();
    return {
      x: Math.floor((sx - r.left) / S + cam.x),
      y: Math.floor((sy - r.top) / S + cam.y)
    };
  }

  /* ---------- 그리기 ---------- */
  function render(t) {
    if (!ctx) return;
    var s = S;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VW, VH);

    /* 바다 배경 */
    ctx.fillStyle = '#3aa4d8';
    ctx.fillRect(0, 0, VW, VH);

    updateCamera();
    var sh = TW.FX.shakeAmount();
    shakeOn.x = sh ? (Math.random() - 0.5) * sh : 0;
    shakeOn.y = sh ? (Math.random() - 0.5) * sh : 0;
    ctx.save();
    ctx.translate(shakeOn.x, shakeOn.y);

    var x0 = Math.floor(cam.x) - 1, y0 = Math.floor(cam.y) - 1;
    var x1 = Math.ceil(cam.x + VW / s) + 1, y1 = Math.ceil(cam.y + VH / s) + 1;

    /* 1) 지형 */
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var px = Math.round((x - cam.x) * s), py = Math.round((y - cam.y) * s);
        var tt = TW.terrainAt(x, y);
        if (tt === 'ocean') continue;
        TW.Sprites.tile(ctx, tt, px, py, s, x, y, t);
      }
    }

    /* 2) 건설 가능 칸 표시 */
    if (TW.Building.placing) {
      for (var by = y0; by <= y1; by++) {
        for (var bx = x0; bx <= x1; bx++) {
          if (!canBuild(bx, by)) continue;
          var bpx = Math.round((bx - cam.x) * s), bpy = Math.round((by - cam.y) * s);
          ctx.globalAlpha = 0.35 + Math.sin(t * 4) * 0.12;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bpx + 2, bpy + 2, s - 4, s - 4);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#3fb950';
          ctx.lineWidth = 2;
          ctx.strokeRect(bpx + 2, bpy + 2, s - 4, s - 4);
        }
      }
    }

    /* 3) 그릴 것 모으기 (y 순서로 정렬해 앞뒤 겹침 처리) */
    var draws = [];
    TW.state.nodes.forEach(function (n) {
      if (n.hp <= 0) return;
      if (n.x < x0 - 1 || n.x > x1 + 1 || n.y < y0 - 1 || n.y > y1 + 1) return;
      draws.push({ y: n.y, z: 1, fn: function (px, py) {
        var shake = (TW.Gather.shakeId === n.id) ? Math.sin(t * 40) * 3 : 0;
        TW.Sprites.node(ctx, n.t, px, py, s, t, shake);
        if (n.t === 'iron' && TW.Inv.toolTier('pick') < 2) {
          ctx.globalAlpha = 0.85;
          ctx.font = (s * 0.34) + 'px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('🔒', px + s / 2, py + s * 0.28);
          ctx.globalAlpha = 1;
        }
      }, x: n.x });
    });
    TW.state.buildings.forEach(function (b) {
      draws.push({ y: b.y, z: 1, x: b.x, fn: function (px, py) {
        TW.Sprites.building(ctx, b.type, px, py, s, t, b.data);
        if (b.type === 'farm' && b.data && b.data.grown) {
          ctx.font = (s * 0.3) + 'px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('✨', px + s / 2, py + s * 0.2);
        }
        var occupant = TW.Spirits.jobAt(b.id);
        if (occupant) {
          ctx.font = (s * 0.26) + 'px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(TW.SPIRITS[occupant].icon, px + s * 0.82, py + s * 0.3);
        }
      } });
    });
    /* 세계수 */
    var T = TW.MAP.tree;
    draws.push({ y: T.y, z: 2, x: T.x, fn: function (px, py) {
      TW.Sprites.worldTree(ctx, px, py, s, TW.state.tree.stage, t);
    } });
    if (TW.state.tree.stage >= 4) {
      draws.push({ y: TW.MAP.portal.y, z: 2, x: TW.MAP.portal.x, fn: function (px, py) {
        TW.Sprites.portal(ctx, px, py, s, t);
      } });
    }
    /* 정령 */
    TW.SPIRIT_ORDER.forEach(function (k) {
      var sp = TW.state.spirits[k];
      if (!sp.spawned && !sp.friend) return;
      var pos = TW.Spirits.posOf(k);
      draws.push({ y: pos.y, z: 3, x: pos.x, fnPix: function () {
        var px = (pos.x - 0.5 - cam.x) * s, py = (pos.y - 0.7 - cam.y) * s;
        TW.Sprites.spirit(ctx, k, px, py, s, t, sp.friend ? 'ok' : 'new');
      } });
    });
    /* 플레이어 */
    var p = TW.state.pos;
    draws.push({ y: p.y, z: 4, x: p.x, fnPix: function () {
      var px = (p.x - 0.5 - cam.x) * s, py = (p.y - 0.8 - cam.y) * s;
      TW.Sprites.player(ctx, px, py, s, TW.state.dir, TW.Game.walkPhase, t, TW.Gather.acting);
    } });

    draws.sort(function (a, b) { return (a.y - b.y) || (a.z - b.z); });
    draws.forEach(function (d) {
      if (d.fnPix) { d.fnPix(); return; }
      var px = Math.round((d.x - cam.x) * s), py = Math.round((d.y - cam.y) * s);
      d.fn(px, py);
    });

    /* 4) 잠긴 지역 안개 */
    for (var fy = y0; fy <= y1; fy++) {
      for (var fx = x0; fx <= x1; fx++) {
        if (!regionLocked(fx, fy)) continue;
        var fpx = Math.round((fx - cam.x) * s), fpy = Math.round((fy - cam.y) * s);
        ctx.fillStyle = 'rgba(232,238,250,.90)';
        ctx.fillRect(fpx, fpy, s + 1, s + 1);
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        var w1 = Math.sin(t * 0.8 + fx * 0.7 + fy) * s * 0.12;
        TW.Sprites.circ(ctx, fpx + s * 0.35 + w1, fpy + s * 0.45, s * 0.30); ctx.fill();
        TW.Sprites.circ(ctx, fpx + s * 0.72 - w1, fpy + s * 0.62, s * 0.24); ctx.fill();
      }
    }
    /* 잠긴 지역 이름표 */
    ['forest', 'hill', 'mist'].forEach(function (rk) {
      if (TW.state.regions[rk]) return;
      var spot = rk === 'forest' ? { x: 5, y: 8 } : rk === 'hill' ? { x: 18, y: 8 } : { x: 12, y: 2 };
      if (spot.x < x0 || spot.x > x1 || spot.y < y0 || spot.y > y1) return;
      var lpx = (spot.x - cam.x) * s, lpy = (spot.y - cam.y) * s;
      ctx.textAlign = 'center';
      ctx.font = 'bold ' + Math.max(11, s * 0.30) + 'px "Nanum Gothic", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(70,80,110,.85)';
      ctx.fillText('🔒 ' + TW.REGIONS[rk].name, lpx, lpy);
      ctx.font = Math.max(9, s * 0.24) + 'px "Nanum Gothic", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(90,100,130,.8)';
      ctx.fillText('세계수 ' + TW.REGIONS[rk].lock + '단계', lpx, lpy + s * 0.36);
    });

    /* 5) 상호작용 안내 표시 */
    var tgt = nearestTarget();
    TW.Game.target = tgt;
    if (tgt && !TW.Building.placing) {
      var tpx = (tgt.x - cam.x) * s, tpy = (tgt.y - cam.y) * s;
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(tpx + 2, tpy + 2, s - 4, s - 4);
      ctx.setLineDash([]);
      var label = TW.Game.targetLabel(tgt);
      if (label) {
        ctx.font = 'bold ' + Math.max(11, s * 0.28) + 'px "Nanum Gothic", system-ui, sans-serif';
        ctx.textAlign = 'center';
        var w = ctx.measureText(label).width + 14;
        ctx.fillStyle = 'rgba(40,36,55,.82)';
        TW.Sprites.rr(ctx, tpx + s / 2 - w / 2, tpy - s * 0.55, w, s * 0.42, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(label, tpx + s / 2, tpy - s * 0.24);
      }
    }

    /* 6) 입자·글자 */
    TW.FX.draw(ctx, cam, s);
    ctx.restore();
  }

  return {
    init: init, resize: resize, render: render, tickNodes: tickNodes,
    solidAt: solidAt, nodeAt: nodeAt, buildingAt: buildingAt, canBuild: canBuild,
    regionLocked: regionLocked, isWorldTree: isWorldTree, isPortal: isPortal,
    nearestTarget: nearestTarget, screenToTile: screenToTile,
    cam: cam, tileSize: function () { return S; }, inBounds: inBounds
  };
})();
