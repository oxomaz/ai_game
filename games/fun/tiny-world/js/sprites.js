/* ===========================================================
   Tiny World - js/sprites.js
   그림 담당. 캔버스에 직접 그리는 오리지널 도형 아트.
   나중에 이미지 파일로 바꾸고 싶으면 이 파일만 고치면 된다.
   모든 함수는 (ctx, px, py, s, t) 를 받는다.
     px,py = 타일 왼쪽 위 픽셀 좌표, s = 타일 크기, t = 시간(초)
   =========================================================== */
window.TW = window.TW || {};
TW.Sprites = (function () {
  function rr(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
  function fill(ctx, c) { ctx.fillStyle = c; ctx.fill(); }

  function eyes(ctx, cx, cy, r, blink, dark) {
    ctx.fillStyle = dark || '#2b2b3a';
    if (blink) {
      ctx.fillRect(cx - r - 1.5, cy, 3.2, 1.4);
      ctx.fillRect(cx + r - 1.6, cy, 3.2, 1.4);
    } else {
      circ(ctx, cx - r, cy, 1.7); ctx.fill();
      circ(ctx, cx + r, cy, 1.7); ctx.fill();
      ctx.fillStyle = '#fff';
      circ(ctx, cx - r + 0.6, cy - 0.6, 0.6); ctx.fill();
      circ(ctx, cx + r + 0.6, cy - 0.6, 0.6); ctx.fill();
    }
  }
  function smile(ctx, cx, cy, w) {
    ctx.strokeStyle = 'rgba(60,40,40,.75)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(cx, cy, w, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  function shadow(ctx, cx, by, w) {
    ctx.fillStyle = 'rgba(0,0,0,.13)';
    ctx.beginPath();
    ctx.ellipse(cx, by, w, w * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---------- 지형 ---------- */
  var TERRAIN = {
    grass:  ['#8ed86b', '#83cf61'],
    forest: ['#59b166', '#4da65b'],
    hill:   ['#bdb2a0', '#b3a795'],
    mist:   ['#93a9da', '#8aa1d4'],
    sand:   ['#f3e3b3', '#eddaa6'],
    path:   ['#d8bd8e', '#d1b483'],
    water:  ['#63c4ec', '#4fb7e6'],
    ocean:  ['#3aa4d8', '#3399cf']
  };

  function tile(ctx, type, px, py, s, x, y, t) {
    var c = TERRAIN[type] || TERRAIN.grass;
    var alt = ((x + y) % 2) === 0;
    ctx.fillStyle = alt ? c[0] : c[1];
    ctx.fillRect(px, py, s + 1, s + 1);

    if (type === 'grass' || type === 'forest') {
      ctx.fillStyle = 'rgba(255,255,255,.10)';
      var h = ((x * 7 + y * 13) % 5);
      if (h < 2) {
        ctx.fillRect(px + s * 0.2, py + s * 0.55, 2, 4);
        ctx.fillRect(px + s * 0.7, py + s * 0.3, 2, 4);
      }
    } else if (type === 'hill') {
      ctx.fillStyle = 'rgba(120,105,85,.22)';
      if (((x * 5 + y * 3) % 4) === 0) {
        circ(ctx, px + s * 0.35, py + s * 0.6, s * 0.09); ctx.fill();
        circ(ctx, px + s * 0.7, py + s * 0.35, s * 0.07); ctx.fill();
      }
    } else if (type === 'water') {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      var w = Math.sin(t * 2 + x * 1.3 + y) * 2;
      ctx.fillRect(px + s * 0.2 + w, py + s * 0.35, s * 0.3, 2);
      ctx.fillRect(px + s * 0.55 - w, py + s * 0.65, s * 0.25, 2);
    } else if (type === 'mist') {
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      if (((x + y) % 3) === 0) { circ(ctx, px + s * 0.5, py + s * 0.5, s * 0.16); ctx.fill(); }
    } else if (type === 'sand') {
      ctx.fillStyle = 'rgba(200,170,110,.30)';
      if (((x * 3 + y * 7) % 3) === 0) ctx.fillRect(px + s * 0.4, py + s * 0.5, 3, 2);
    }
  }

  /* ---------- 자원 ---------- */
  function tree(ctx, px, py, s, t, shakeAmt) {
    var cx = px + s / 2, sway = Math.sin(t * 1.4 + px) * 0.8 + (shakeAmt || 0);
    shadow(ctx, cx, py + s * 0.9, s * 0.28);
    ctx.fillStyle = '#8a5a3b';
    ctx.fillRect(cx - s * 0.07, py + s * 0.55, s * 0.14, s * 0.35);
    ctx.fillStyle = '#3f8f4a';
    circ(ctx, cx + sway, py + s * 0.42, s * 0.30); ctx.fill();
    ctx.fillStyle = '#57ad5c';
    circ(ctx, cx - s * 0.13 + sway, py + s * 0.34, s * 0.21); ctx.fill();
    circ(ctx, cx + s * 0.14 + sway, py + s * 0.37, s * 0.19); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    circ(ctx, cx - s * 0.10 + sway, py + s * 0.26, s * 0.07); ctx.fill();
  }
  function goldtree(ctx, px, py, s, t) {
    var cx = px + s / 2, sway = Math.sin(t * 2.2 + px) * 1.2;
    shadow(ctx, cx, py + s * 0.9, s * 0.28);
    ctx.fillStyle = '#a97b3d';
    ctx.fillRect(cx - s * 0.07, py + s * 0.55, s * 0.14, s * 0.35);
    ctx.fillStyle = '#f2c141';
    circ(ctx, cx + sway, py + s * 0.42, s * 0.31); ctx.fill();
    ctx.fillStyle = '#ffe07a';
    circ(ctx, cx - s * 0.12 + sway, py + s * 0.33, s * 0.20); ctx.fill();
    circ(ctx, cx + s * 0.15 + sway, py + s * 0.36, s * 0.18); ctx.fill();
    sparkle(ctx, cx, py + s * 0.35, s, t);
  }
  function rock(ctx, px, py, s, t, shakeAmt) {
    var cx = px + s / 2 + (shakeAmt || 0);
    shadow(ctx, px + s / 2, py + s * 0.85, s * 0.26);
    ctx.fillStyle = '#8d949c';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.28, py + s * 0.82);
    ctx.lineTo(cx - s * 0.20, py + s * 0.42);
    ctx.lineTo(cx + s * 0.02, py + s * 0.30);
    ctx.lineTo(cx + s * 0.26, py + s * 0.48);
    ctx.lineTo(cx + s * 0.28, py + s * 0.82);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b6bdc4';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.18, py + s * 0.46);
    ctx.lineTo(cx + s * 0.02, py + s * 0.33);
    ctx.lineTo(cx + s * 0.10, py + s * 0.52);
    ctx.closePath(); ctx.fill();
  }
  function iron(ctx, px, py, s, t, shakeAmt) {
    rock(ctx, px, py, s, t, shakeAmt);
    var cx = px + s / 2 + (shakeAmt || 0);
    ctx.fillStyle = '#f5d76e';
    circ(ctx, cx - s * 0.10, py + s * 0.60, s * 0.055); ctx.fill();
    circ(ctx, cx + s * 0.09, py + s * 0.52, s * 0.05); ctx.fill();
    circ(ctx, cx + s * 0.02, py + s * 0.72, s * 0.045); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    circ(ctx, cx - s * 0.11, py + s * 0.58, s * 0.02); ctx.fill();
  }
  function starrock(ctx, px, py, s, t, shakeAmt) {
    rock(ctx, px, py, s, t, shakeAmt);
    var cx = px + s / 2 + (shakeAmt || 0);
    ctx.fillStyle = '#c9a7ff';
    star(ctx, cx, py + s * 0.55, s * 0.16, 5);
    ctx.fill();
    sparkle(ctx, cx, py + s * 0.5, s, t);
  }
  function bush(ctx, px, py, s, t, shakeAmt) {
    var cx = px + s / 2 + (shakeAmt || 0);
    ctx.fillStyle = '#63bd6a';
    circ(ctx, cx, py + s * 0.68, s * 0.20); ctx.fill();
    circ(ctx, cx - s * 0.15, py + s * 0.74, s * 0.14); ctx.fill();
    circ(ctx, cx + s * 0.15, py + s * 0.74, s * 0.14); ctx.fill();
    ctx.strokeStyle = '#3f8f4a'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, py + s * 0.72); ctx.lineTo(cx - s * 0.05, py + s * 0.46);
    ctx.moveTo(cx, py + s * 0.72); ctx.lineTo(cx + s * 0.10, py + s * 0.50);
    ctx.stroke();
  }
  function berry(ctx, px, py, s, t, shakeAmt) {
    var cx = px + s / 2 + (shakeAmt || 0);
    shadow(ctx, px + s / 2, py + s * 0.88, s * 0.2);
    ctx.fillStyle = '#4e9c57';
    circ(ctx, cx, py + s * 0.55, s * 0.27); ctx.fill();
    ctx.fillStyle = '#ff5d73';
    circ(ctx, cx - s * 0.10, py + s * 0.52, s * 0.065); ctx.fill();
    circ(ctx, cx + s * 0.09, py + s * 0.60, s * 0.065); ctx.fill();
    circ(ctx, cx + s * 0.01, py + s * 0.43, s * 0.055); ctx.fill();
    ctx.fillStyle = '#8a5a3b';
    ctx.fillRect(cx - 1.2, py + s * 0.74, 2.4, s * 0.14);
  }
  function mushroom(ctx, px, py, s, t, shakeAmt) {
    var cx = px + s / 2 + (shakeAmt || 0);
    ctx.fillStyle = '#f5efdd';
    ctx.fillRect(cx - s * 0.06, py + s * 0.62, s * 0.12, s * 0.22);
    ctx.fillStyle = '#ef6f6c';
    ctx.beginPath();
    ctx.ellipse(cx, py + s * 0.62, s * 0.21, s * 0.16, 0, Math.PI, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    circ(ctx, cx - s * 0.07, py + s * 0.55, s * 0.035); ctx.fill();
    circ(ctx, cx + s * 0.08, py + s * 0.58, s * 0.03); ctx.fill();
  }
  function flower(ctx, px, py, s, t, shakeAmt) {
    var cx = px + s / 2 + (shakeAmt || 0), cy = py + s * 0.58;
    ctx.strokeStyle = '#4e9c57'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx, py + s * 0.86); ctx.lineTo(cx, cy); ctx.stroke();
    var cols = ['#ff9ecd', '#ffd166', '#c9a7ff', '#8ad7ff'];
    ctx.fillStyle = cols[Math.abs(Math.round(px + py)) % 4];
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * Math.PI * 2 + t * 0.3;
      circ(ctx, cx + Math.cos(a) * s * 0.11, cy + Math.sin(a) * s * 0.11, s * 0.075);
      ctx.fill();
    }
    ctx.fillStyle = '#fff3b0';
    circ(ctx, cx, cy, s * 0.06); ctx.fill();
  }
  function rainbowf(ctx, px, py, s, t) {
    var cx = px + s / 2, cy = py + s * 0.56;
    ctx.strokeStyle = '#4e9c57'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(cx, py + s * 0.88); ctx.lineTo(cx, cy); ctx.stroke();
    var cols = ['#ff6b6b', '#ffa24d', '#ffe066', '#6ee7a0', '#6ec6ff', '#c9a7ff'];
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2 + t;
      ctx.fillStyle = cols[i];
      circ(ctx, cx + Math.cos(a) * s * 0.13, cy + Math.sin(a) * s * 0.13, s * 0.08);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    circ(ctx, cx, cy, s * 0.06); ctx.fill();
    sparkle(ctx, cx, cy, s, t);
  }
  function water(ctx, px, py, s, t) {
    var cx = px + s / 2, cy = py + s * 0.55 + Math.sin(t * 2 + px) * 1.5;
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    circ(ctx, cx, cy, s * 0.13); ctx.fill();
    ctx.fillStyle = '#eaf9ff';
    circ(ctx, cx - s * 0.04, cy - s * 0.04, s * 0.05); ctx.fill();
  }
  function chest(ctx, px, py, s, t) {
    var cx = px + s / 2, bob = Math.sin(t * 3) * 1.2;
    shadow(ctx, cx, py + s * 0.86, s * 0.26);
    ctx.fillStyle = '#b5793c';
    rr(ctx, cx - s * 0.26, py + s * 0.48 + bob, s * 0.52, s * 0.34, 4); ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, cx - s * 0.26, py + s * 0.40 + bob, s * 0.52, s * 0.14, 5); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(cx - s * 0.05, py + s * 0.46 + bob, s * 0.10, s * 0.16);
    sparkle(ctx, cx, py + s * 0.4, s, t);
  }

  function star(ctx, cx, cy, r, n) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var rr2 = i % 2 ? r * 0.45 : r;
      var a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      var x = cx + Math.cos(a) * rr2, y = cy + Math.sin(a) * rr2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  function sparkle(ctx, cx, cy, s, t) {
    for (var i = 0; i < 3; i++) {
      var ph = (t * 1.5 + i * 0.66) % 1;
      var a = (i / 3) * Math.PI * 2 + t;
      ctx.globalAlpha = 1 - ph;
      ctx.fillStyle = '#fff8c9';
      star(ctx, cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3 - ph * s * 0.2, s * 0.07 * (1 - ph * 0.5), 4);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var NODE_DRAW = {
    tree: tree, rock: rock, bush: bush, berry: berry, mushroom: mushroom,
    iron: iron, flower: flower, water: water, goldtree: goldtree,
    rainbowf: rainbowf, starrock: starrock, chest: chest
  };

  /* ---------- 세계수 ---------- */
  function worldTree(ctx, px, py, s, stage, t) {
    var cx = px + s / 2, base = py + s * 0.95;
    shadow(ctx, cx, base, s * (0.4 + stage * 0.12));
    var sway = Math.sin(t * 0.9) * (1 + stage * 0.5);
    /* 어릴 때는 눈에 잘 안 띄므로 반짝임과 이름표로 알려 준다 */
    if (stage <= 2) {
      ctx.globalAlpha = 0.30 + Math.sin(t * 2.4) * 0.12;
      ctx.fillStyle = '#fff6b8';
      circ(ctx, cx, base - s * 0.35, s * 0.55); ctx.fill();
      ctx.globalAlpha = 1;
      sparkle(ctx, cx, base - s * 0.5, s, t);
      ctx.textAlign = 'center';
      ctx.font = 'bold ' + Math.max(10, s * 0.26) + 'px "Nanum Gothic", system-ui, sans-serif';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.strokeText('세계수', cx, base + s * 0.3);
      ctx.fillStyle = '#4a7a3f';
      ctx.fillText('세계수', cx, base + s * 0.3);
    }
    if (stage <= 1) {
      ctx.fillStyle = '#c8a06a';
      ctx.beginPath(); ctx.ellipse(cx, base - s * 0.18, s * 0.17, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e6c894';
      ctx.beginPath(); ctx.ellipse(cx - s * 0.05, base - s * 0.24, s * 0.07, s * 0.10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5fbf6a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx, base - s * 0.38); ctx.lineTo(cx + sway, base - s * 0.62); ctx.stroke();
      ctx.fillStyle = '#7fd98a';
      ctx.beginPath(); ctx.ellipse(cx + sway + s * 0.08, base - s * 0.64, s * 0.10, s * 0.05, -0.5, 0, Math.PI * 2); ctx.fill();
    } else if (stage === 2) {
      ctx.fillStyle = '#9a6b45';
      ctx.fillRect(cx - s * 0.07, base - s * 0.7, s * 0.14, s * 0.7);
      ctx.fillStyle = '#5fbf6a';
      circ(ctx, cx + sway, base - s * 0.9, s * 0.32); ctx.fill();
      ctx.fillStyle = '#8ada90';
      circ(ctx, cx - s * 0.2 + sway, base - s * 0.82, s * 0.20); ctx.fill();
      circ(ctx, cx + s * 0.22 + sway, base - s * 0.86, s * 0.18); ctx.fill();
    } else if (stage === 3) {
      ctx.fillStyle = '#8a5f3d';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.16, base);
      ctx.lineTo(cx - s * 0.09, base - s * 1.1);
      ctx.lineTo(cx + s * 0.09, base - s * 1.1);
      ctx.lineTo(cx + s * 0.16, base);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4faa5a';
      circ(ctx, cx + sway, base - s * 1.35, s * 0.48); ctx.fill();
      ctx.fillStyle = '#69c974';
      circ(ctx, cx - s * 0.36 + sway, base - s * 1.20, s * 0.30); ctx.fill();
      circ(ctx, cx + s * 0.38 + sway, base - s * 1.24, s * 0.28); ctx.fill();
      ctx.fillStyle = '#9ce8a4';
      circ(ctx, cx - s * 0.08 + sway, base - s * 1.52, s * 0.22); ctx.fill();
    } else {
      var glow = 0.55 + Math.sin(t * 2) * 0.2;
      ctx.globalAlpha = glow * 0.5;
      ctx.fillStyle = '#fff3a8';
      circ(ctx, cx, base - s * 1.5, s * 1.15); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#9a6f4a';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.20, base);
      ctx.lineTo(cx - s * 0.11, base - s * 1.25);
      ctx.lineTo(cx + s * 0.11, base - s * 1.25);
      ctx.lineTo(cx + s * 0.20, base);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#46a86f';
      circ(ctx, cx + sway, base - s * 1.55, s * 0.58); ctx.fill();
      ctx.fillStyle = '#65d18c';
      circ(ctx, cx - s * 0.45 + sway, base - s * 1.38, s * 0.34); ctx.fill();
      circ(ctx, cx + s * 0.47 + sway, base - s * 1.42, s * 0.32); ctx.fill();
      ctx.fillStyle = '#c9f7d4';
      circ(ctx, cx - s * 0.1 + sway, base - s * 1.82, s * 0.26); ctx.fill();
      for (var i = 0; i < 6; i++) {
        var a = t * 0.8 + i;
        ctx.fillStyle = '#fff6b8';
        star(ctx, cx + Math.cos(a) * s * (0.7 + i * 0.05), base - s * 1.5 + Math.sin(a * 1.3) * s * 0.5, s * 0.09, 4);
        ctx.fill();
      }
    }
  }

  function portal(ctx, px, py, s, t) {
    var cx = px + s / 2, cy = py + s * 0.5;
    ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.2;
    ctx.fillStyle = '#c9a7ff';
    ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.32, s * 0.46, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f4ecff';
    ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.20, s * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    sparkle(ctx, cx, cy, s, t);
  }

  /* ---------- 건물 ---------- */
  function building(ctx, type, px, py, s, t, data) {
    var cx = px + s / 2;
    shadow(ctx, cx, py + s * 0.92, s * 0.34);
    if (type === 'house') {
      ctx.fillStyle = '#f6e2c0';
      rr(ctx, cx - s * 0.32, py + s * 0.42, s * 0.64, s * 0.48, 4); ctx.fill();
      ctx.fillStyle = '#e2735b';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.40, py + s * 0.44);
      ctx.lineTo(cx, py + s * 0.10);
      ctx.lineTo(cx + s * 0.40, py + s * 0.44);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a5a3b';
      rr(ctx, cx - s * 0.11, py + s * 0.58, s * 0.22, s * 0.32, 3); ctx.fill();
      ctx.fillStyle = '#ffd166';
      circ(ctx, cx + s * 0.05, py + s * 0.74, s * 0.02); ctx.fill();
      ctx.fillStyle = '#9fd8f5';
      rr(ctx, cx + s * 0.14, py + s * 0.50, s * 0.14, s * 0.14, 2); ctx.fill();
    } else if (type === 'workbench') {
      ctx.fillStyle = '#b5793c';
      rr(ctx, cx - s * 0.34, py + s * 0.44, s * 0.68, s * 0.16, 3); ctx.fill();
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(cx - s * 0.28, py + s * 0.60, s * 0.09, s * 0.30);
      ctx.fillRect(cx + s * 0.19, py + s * 0.60, s * 0.09, s * 0.30);
      ctx.fillStyle = '#c9d1d8';
      ctx.save();
      ctx.translate(cx - s * 0.06, py + s * 0.36);
      ctx.rotate(-0.5);
      ctx.fillRect(0, 0, s * 0.06, s * 0.20);
      ctx.restore();
      ctx.fillStyle = '#8d949c';
      circ(ctx, cx + s * 0.16, py + s * 0.36, s * 0.08); ctx.fill();
    } else if (type === 'storage') {
      ctx.fillStyle = '#cf9a54';
      rr(ctx, cx - s * 0.32, py + s * 0.40, s * 0.64, s * 0.50, 5); ctx.fill();
      ctx.fillStyle = '#b5793c';
      ctx.fillRect(cx - s * 0.32, py + s * 0.60, s * 0.64, s * 0.06);
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(cx - s * 0.04, py + s * 0.40, s * 0.08, s * 0.50);
      ctx.fillStyle = '#ffd166';
      circ(ctx, cx, py + s * 0.64, s * 0.05); ctx.fill();
    } else if (type === 'farm') {
      ctx.fillStyle = '#a9793f';
      rr(ctx, cx - s * 0.36, py + s * 0.40, s * 0.72, s * 0.50, 4); ctx.fill();
      ctx.fillStyle = '#8a5f2f';
      for (var i = 0; i < 3; i++) ctx.fillRect(cx - s * 0.32, py + s * 0.48 + i * s * 0.14, s * 0.64, s * 0.05);
      var st = (data && data.state) || 'empty';
      if (st !== 'empty') {
        var grow = (data && data.grown) ? 1 : 0.45;
        ctx.strokeStyle = '#4faa5a'; ctx.lineWidth = 2;
        for (var k = 0; k < 3; k++) {
          var gx = cx - s * 0.20 + k * s * 0.20;
          ctx.beginPath();
          ctx.moveTo(gx, py + s * 0.80);
          ctx.lineTo(gx + Math.sin(t + k) * 1.5, py + s * 0.80 - s * 0.28 * grow);
          ctx.stroke();
          if (data && data.grown) {
            ctx.fillStyle = '#ff5d73';
            circ(ctx, gx, py + s * 0.80 - s * 0.30, s * 0.06); ctx.fill();
          }
        }
        if (st === 'planted') {
          ctx.fillStyle = 'rgba(255,255,255,.8)';
          ctx.font = 'bold ' + (s * 0.3) + 'px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('💧', cx, py + s * 0.35);
        }
      }
    } else if (type === 'nest') {
      ctx.fillStyle = '#f0d9a8';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.38, py + s * 0.88);
      ctx.lineTo(cx, py + s * 0.22);
      ctx.lineTo(cx + s * 0.38, py + s * 0.88);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7fc98a';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.20, py + s * 0.88);
      ctx.lineTo(cx, py + s * 0.48);
      ctx.lineTo(cx + s * 0.20, py + s * 0.88);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd166';
      star(ctx, cx, py + s * 0.20, s * 0.10, 5); ctx.fill();
    }
  }

  /* ---------- 플레이어 ---------- */
  function player(ctx, px, py, s, dir, walk, t, acting) {
    var cx = px + s / 2, bob = Math.sin(walk * 9) * (s * 0.03);
    shadow(ctx, cx, py + s * 0.90, s * 0.22);
    /* 몸 */
    ctx.fillStyle = '#5b8def';
    rr(ctx, cx - s * 0.16, py + s * 0.50 + bob, s * 0.32, s * 0.30, 4); ctx.fill();
    /* 팔 */
    ctx.fillStyle = '#f6cfa8';
    var swing = acting ? Math.sin(t * 18) * s * 0.10 : Math.sin(walk * 9) * s * 0.05;
    circ(ctx, cx - s * 0.20, py + s * 0.60 + bob + swing, s * 0.055); ctx.fill();
    circ(ctx, cx + s * 0.20, py + s * 0.60 + bob - swing, s * 0.055); ctx.fill();
    /* 다리 */
    ctx.fillStyle = '#3c6ac9';
    var lg = Math.sin(walk * 9) * s * 0.05;
    ctx.fillRect(cx - s * 0.12, py + s * 0.78 + bob + lg, s * 0.09, s * 0.12);
    ctx.fillRect(cx + s * 0.03, py + s * 0.78 + bob - lg, s * 0.09, s * 0.12);
    /* 머리 */
    ctx.fillStyle = '#f6cfa8';
    circ(ctx, cx, py + s * 0.38 + bob, s * 0.19); ctx.fill();
    /* 모자 */
    ctx.fillStyle = '#4caf6d';
    ctx.beginPath();
    ctx.ellipse(cx, py + s * 0.30 + bob, s * 0.24, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, py + s * 0.25 + bob, s * 0.15, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    /* 얼굴 (뒤를 볼 때는 안 그린다) */
    if (dir !== 1) {
      var off = dir === 2 ? -s * 0.04 : dir === 3 ? s * 0.04 : 0;
      var blink = (Math.floor(t * 1.1) % 7) === 0;
      eyes(ctx, cx + off, py + s * 0.40 + bob, s * 0.062, blink);
      smile(ctx, cx + off, py + s * 0.42 + bob, s * 0.05);
      ctx.fillStyle = 'rgba(255,140,140,.35)';
      circ(ctx, cx + off - s * 0.11, py + s * 0.44 + bob, s * 0.035); ctx.fill();
      circ(ctx, cx + off + s * 0.11, py + s * 0.44 + bob, s * 0.035); ctx.fill();
    }
  }

  /* ---------- 정령 ---------- */
  function spirit(ctx, key, px, py, s0, t, mood) {
    var sp = TW.SPIRITS[key];
    var s = s0 * 1.35;                     /* 정령은 눈에 잘 띄게 조금 크게 */
    px -= (s - s0) / 2; py -= (s - s0) * 0.6;
    var cx = px + s / 2;
    var float = Math.sin(t * 2 + key.length) * s * 0.05;
    var cy = py + s * 0.48 + float;
    shadow(ctx, cx, py + s * 0.88, s * 0.18);
    /* 광채 */
    ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.1;
    ctx.fillStyle = sp.color2;
    circ(ctx, cx, cy, s * 0.30); ctx.fill();
    ctx.globalAlpha = 1;

    if (key === 'leaf') {
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 0.17, s * 0.20, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2f7d3c'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx - s * 0.10, cy + s * 0.10); ctx.lineTo(cx + s * 0.10, cy - s * 0.12); ctx.stroke();
      ctx.fillStyle = '#8ada90';
      ctx.beginPath();
      ctx.ellipse(cx + s * 0.13, cy - s * 0.18, s * 0.09, s * 0.045, -0.6, 0, Math.PI * 2); ctx.fill();
    } else if (key === 'rock') {
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.19, cy + s * 0.14);
      ctx.lineTo(cx - s * 0.14, cy - s * 0.12);
      ctx.lineTo(cx + s * 0.06, cy - s * 0.19);
      ctx.lineTo(cx + s * 0.19, cy + s * 0.02);
      ctx.lineTo(cx + s * 0.14, cy + s * 0.16);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.color2;
      circ(ctx, cx - s * 0.06, cy - s * 0.06, s * 0.05); ctx.fill();
    } else if (key === 'drop') {
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.24);
      ctx.quadraticCurveTo(cx + s * 0.20, cy + s * 0.06, cx, cy + s * 0.20);
      ctx.quadraticCurveTo(cx - s * 0.20, cy + s * 0.06, cx, cy - s * 0.24);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      circ(ctx, cx - s * 0.06, cy + s * 0.02, s * 0.04); ctx.fill();
    } else {
      var fl = Math.sin(t * 9) * s * 0.02;
      ctx.fillStyle = '#ff6b3d';
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.26 - fl);
      ctx.quadraticCurveTo(cx + s * 0.19, cy + s * 0.04, cx, cy + s * 0.19);
      ctx.quadraticCurveTo(cx - s * 0.19, cy + s * 0.04, cx, cy - s * 0.26 - fl);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd28a';
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.10);
      ctx.quadraticCurveTo(cx + s * 0.10, cy + s * 0.06, cx, cy + s * 0.16);
      ctx.quadraticCurveTo(cx - s * 0.10, cy + s * 0.06, cx, cy - s * 0.10);
      ctx.closePath(); ctx.fill();
    }
    var blink2 = (Math.floor(t * 1.3 + key.length) % 8) === 0;
    eyes(ctx, cx, cy + s * 0.01, s * 0.055, blink2, '#33333f');
    smile(ctx, cx, cy + s * 0.03, s * 0.045);
    if (mood === 'new') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + (s * 0.42) + 'px system-ui';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#f2a33c'; ctx.lineWidth = 3;
      var qy = py - s * 0.05 + Math.sin(t * 4) * 3;
      ctx.strokeText('?', cx, qy);
      ctx.fillText('?', cx, qy);
      sparkle(ctx, cx, cy, s, t);
    }
  }

  return {
    tile: tile, node: function (ctx, type, px, py, s, t, shake) {
      (NODE_DRAW[type] || tree)(ctx, px, py, s, t, shake || 0);
    },
    worldTree: worldTree, portal: portal, building: building,
    player: player, spirit: spirit, star: star, sparkle: sparkle,
    rr: rr, circ: circ
  };
})();
