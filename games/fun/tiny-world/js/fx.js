/* ===========================================================
   Tiny World - js/fx.js
   떠오르는 글자 · 반짝이 입자 · 화면 연출
   좌표는 모두 타일 단위(월드 좌표)다.
   =========================================================== */
window.TW = window.TW || {};
TW.FX = (function () {
  var floats = [], parts = [], shakes = 0;

  function floatText(x, y, text, color, big) {
    floats.push({ x: x, y: y, text: text, color: color || '#fff', life: 1.2, t: 0, big: !!big });
    if (floats.length > 30) floats.shift();
  }
  function burst(x, y, color, n) {
    for (var i = 0; i < (n || 8); i++) {
      var a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.6;
      parts.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.8,
        life: 0.5 + Math.random() * 0.4, t: 0, color: color || '#ffe066', r: 1.5 + Math.random() * 2
      });
    }
    if (parts.length > 200) parts.splice(0, parts.length - 200);
  }
  function shake(amount) { shakes = Math.min(6, shakes + (amount || 3)); }

  function update(dt) {
    for (var i = floats.length - 1; i >= 0; i--) {
      var f = floats[i]; f.t += dt; f.y -= dt * 0.9;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (var j = parts.length - 1; j >= 0; j--) {
      var p = parts[j]; p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += dt * 3.2;
      if (p.t >= p.life) parts.splice(j, 1);
    }
    if (shakes > 0) shakes = Math.max(0, shakes - dt * 14);
  }

  function draw(ctx, cam, s) {
    parts.forEach(function (p) {
      var a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc((p.x - cam.x) * s, (p.y - cam.y) * s, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    floats.forEach(function (f) {
      var a = 1 - f.t / f.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.textAlign = 'center';
      ctx.font = 'bold ' + (f.big ? 20 : 15) + 'px "Nanum Gothic", system-ui, sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(35,30,45,.75)';
      ctx.strokeText(f.text, (f.x - cam.x) * s, (f.y - cam.y) * s);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, (f.x - cam.x) * s, (f.y - cam.y) * s);
    });
    ctx.globalAlpha = 1;
  }

  return {
    floatText: floatText, burst: burst, shake: shake,
    update: update, draw: draw,
    shakeAmount: function () { return shakes; },
    clear: function () { floats = []; parts = []; shakes = 0; }
  };
})();
