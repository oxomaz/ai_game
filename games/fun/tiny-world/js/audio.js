/* ===========================================================
   Tiny World - js/audio.js
   Web Audio API 로 효과음을 직접 만든다(외부 음원 파일 없음).
   =========================================================== */
window.TW = window.TW || {};
TW.Audio = (function () {
  var ctx = null, on = true, master = null;

  function ready() {
    if (!on) return false;
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.28;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    } catch (e) { return false; }
  }

  function tone(freq, dur, type, vol, delay, slideTo) {
    if (!ready()) return;
    try {
      var t0 = ctx.currentTime + (delay || 0);
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) { /* 소리가 안 나도 게임은 계속된다 */ }
  }

  function noise(dur, vol, hp) {
    if (!ready()) return;
    try {
      var len = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 600;
      var g = ctx.createGain(); g.gain.value = vol || 0.3;
      src.connect(f); f.connect(g); g.connect(master);
      src.start();
    } catch (e) { }
  }

  var SFX = {
    step:    function () { tone(180, 0.05, 'sine', 0.12); },
    chop:    function () { noise(0.14, 0.35, 400); tone(160, 0.10, 'triangle', 0.25, 0, 90); },
    mine:    function () { noise(0.12, 0.30, 1200); tone(300, 0.08, 'square', 0.16, 0, 160); },
    pick:    function () { tone(880, 0.07, 'sine', 0.22); tone(1320, 0.06, 'sine', 0.14, 0.05); },
    get:     function () { tone(660, 0.08, 'triangle', 0.25); tone(990, 0.10, 'triangle', 0.18, 0.07); },
    craft:   function () { tone(392, 0.1, 'square', 0.16); tone(523, 0.1, 'square', 0.16, 0.09); tone(659, 0.16, 'square', 0.18, 0.18); },
    build:   function () { tone(220, 0.12, 'triangle', 0.25); tone(330, 0.12, 'triangle', 0.22, 0.1); tone(523, 0.22, 'triangle', 0.22, 0.2); },
    quest:   function () { tone(659, 0.12, 'sine', 0.25); tone(880, 0.12, 'sine', 0.25, 0.1); tone(1174, 0.24, 'sine', 0.22, 0.2); },
    level:   function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.26, i * 0.09); }); },
    spirit:  function () { [784, 988, 1174, 1568].forEach(function (f, i) { tone(f, 0.22, 'sine', 0.22, i * 0.08); }); },
    tree:    function () { [392, 523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.35, 'sine', 0.24, i * 0.11); }); },
    error:   function () { tone(200, 0.12, 'sawtooth', 0.14, 0, 120); },
    open:    function () { tone(520, 0.07, 'sine', 0.14); },
    plant:   function () { tone(300, 0.10, 'sine', 0.2, 0, 460); },
    watering:function () { noise(0.28, 0.16, 1800); },
    rain:    function () { noise(0.6, 0.10, 900); },
    event:   function () { tone(1046, 0.12, 'sine', 0.2); tone(1318, 0.18, 'sine', 0.18, 0.1); },
    heal:    function () { tone(523, 0.14, 'sine', 0.2); tone(784, 0.2, 'sine', 0.18, 0.12); }
  };

  return {
    play: function (name) { var f = SFX[name]; if (f && on) f(); },
    setOn: function (v) { on = !!v; if (on) ready(); },
    isOn: function () { return on; },
    unlock: function () { ready(); }
  };
})();
