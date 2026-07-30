/* =====================================================================
 * fx.js — 화면 연출(뜨는 숫자 · 흔들림 · 파티클 · 토스트)
 * 게임처럼 "때리는 느낌"을 만드는 곳.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var FX = MQ.FX = {

    /* 위로 떠오르는 글자 */
    float: function (host, text, kind) {
      if (!host) return;
      var e = el('div', 'fx-float ' + (kind || ''), text);
      e.style.left = (18 + Math.random() * 56) + '%';
      host.appendChild(e);
      setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 1200);
    },

    hitMonster: function (mon, kind) {
      if (!mon) return;
      mon.classList.remove('hit', 'crit', 'ulti');
      void mon.offsetWidth;
      mon.classList.add(kind || 'hit');
      FX.burst(mon, kind === 'ulti' ? 26 : kind === 'crit' ? 16 : 9, kind === 'ulti' ? '#ffd166' : '#ff6b8a');
      setTimeout(function () { mon.classList.remove(kind || 'hit'); }, 520);
    },

    shake: function (e) {
      if (!e) return;
      e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake');
      setTimeout(function () { e.classList.remove('shake'); }, 500);
      if (document.body) {
        document.body.classList.add('screen-shake');
        setTimeout(function () { document.body.classList.remove('screen-shake'); }, 320);
      }
    },

    defeat: function (mon) {
      if (!mon) return;
      FX.burst(mon, 30, '#ffd166');
      mon.classList.add('defeat');
      setTimeout(function () { mon.classList.remove('defeat'); }, 900);
    },

    monsterEnter: function (mon, boss) {
      if (!mon) return;
      mon.classList.remove('enter', 'boss-enter');
      void mon.offsetWidth;
      mon.classList.add(boss ? 'boss-enter' : 'enter');
    },

    combo: function (host, n, mult) {
      if (!host) return;
      host.innerHTML = '<span class="combo-n">' + n + '</span><span class="combo-x">COMBO</span>' +
        (mult > 1 ? '<span class="combo-mult">EXP ×' + mult + '</span>' : '');
      host.classList.remove('pop'); void host.offsetWidth; host.classList.add('pop');
      clearTimeout(host._t);
      host._t = setTimeout(function () { host.classList.remove('pop'); host.innerHTML = ''; }, 1600);
    },

    /* 작은 조각들이 튀는 효과 */
    burst: function (host, n, color) {
      if (!host) return;
      var box = host.parentNode || host;
      for (var i = 0; i < n; i++) {
        (function (i) {
          var p = el('i', 'fx-p');
          var a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 90;
          p.style.background = color || '#ffd166';
          p.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
          p.style.setProperty('--dy', (Math.sin(a) * d).toFixed(1) + 'px');
          p.style.animationDelay = (i * 6) + 'ms';
          box.appendChild(p);
          setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 900);
        })(i);
      }
    },

    /* 화면 위쪽에 잠깐 뜨는 알림 */
    toast: function (text, kind) {
      var host = document.getElementById('toasts');
      if (!host) return;
      var t = el('div', 'toast ' + (kind || ''), text);
      host.appendChild(t);
      setTimeout(function () { t.classList.add('out'); }, 2200);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2700);
    },

    /* 반짝이 비 (레벨업·전설템) */
    rain: function (emoji, n) {
      var host = document.getElementById('fxLayer');
      if (!host) return;
      for (var i = 0; i < (n || 18); i++) {
        (function (i) {
          var e = el('div', 'fx-rain', emoji || '✨');
          e.style.left = (Math.random() * 100) + '%';
          e.style.animationDelay = (Math.random() * 600) + 'ms';
          e.style.fontSize = (16 + Math.random() * 22) + 'px';
          host.appendChild(e);
          setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 2600);
        })(i);
      }
    }
  };
})();
