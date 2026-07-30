/* =====================================================================
 * audio.js — WebAudio 로 그때그때 만들어 내는 효과음 (파일 없음)
 * MQ.Snd.play('correct') 처럼 부른다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};
  var ctx = null, on = true, master = null;

  function ac() {
    if (ctx) return ctx;
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.28;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  /* 음 하나 */
  function tone(freq, t0, dur, type, vol, slideTo) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  /* 노이즈(타격·폭발) */
  function noise(t0, dur, vol, freq) {
    var c = ac(); if (!c) return;
    var n = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(); s.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1400;
    var g = c.createGain(); g.gain.value = vol || 0.25;
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t0);
  }

  var SND = {
    tap: function (t) { tone(520, t, 0.06, 'square', 0.12); },
    correct: function (t) { tone(660, t, 0.09, 'triangle', 0.28); tone(880, t + 0.07, 0.14, 'triangle', 0.26); },
    wrong: function (t) { tone(220, t, 0.18, 'sawtooth', 0.22, 120); },
    hit: function (t) { noise(t, 0.16, 0.3, 1200); tone(160, t, 0.12, 'square', 0.18, 70); },
    crit: function (t) { noise(t, 0.22, 0.35, 2600); tone(300, t, 0.2, 'square', 0.25, 900); },
    ulti: function (t) {
      var f = [523, 659, 784, 1047, 1319];
      for (var i = 0; i < f.length; i++) tone(f[i], t + i * 0.055, 0.22, 'triangle', 0.3);
      noise(t + 0.28, 0.4, 0.35, 3000);
    },
    levelup: function (t) {
      var f = [523, 659, 784, 1047];
      for (var i = 0; i < f.length; i++) tone(f[i], t + i * 0.09, 0.3, 'triangle', 0.3);
    },
    item: function (t) { tone(880, t, 0.1, 'sine', 0.25); tone(1175, t + 0.08, 0.16, 'sine', 0.22); },
    rare: function (t) {
      var f = [784, 988, 1319, 1568, 2093];
      for (var i = 0; i < f.length; i++) tone(f[i], t + i * 0.07, 0.35, 'sine', 0.28);
    },
    boss: function (t) {
      tone(80, t, 0.9, 'sawtooth', 0.3, 55);
      tone(120, t + 0.1, 0.8, 'square', 0.16, 70);
      noise(t, 0.6, 0.2, 500);
    },
    win: function (t) {
      var f = [659, 784, 988, 1319];
      for (var i = 0; i < f.length; i++) tone(f[i], t + i * 0.1, 0.34, 'triangle', 0.3);
    },
    lose: function (t) {
      var f = [440, 392, 330, 262];
      for (var i = 0; i < f.length; i++) tone(f[i], t + i * 0.13, 0.36, 'triangle', 0.26);
    },
    coin: function (t) { tone(1050, t, 0.06, 'square', 0.18); tone(1400, t + 0.05, 0.09, 'square', 0.16); },
    open: function (t) { tone(440, t, 0.08, 'sine', 0.16); tone(660, t + 0.06, 0.12, 'sine', 0.16); },
    tick: function (t) { tone(1400, t, 0.03, 'square', 0.1); }
  };

  MQ.Snd = {
    play: function (name) {
      if (!on) return;
      var c = ac(); if (!c || !SND[name]) return;
      try { if (c.state === 'suspended') c.resume(); SND[name](c.currentTime + 0.001); } catch (e) { }
    },
    setOn: function (v) { on = !!v; },
    isOn: function () { return on; },
    /* 첫 터치에서 오디오를 깨운다(모바일 정책) */
    unlock: function () { var c = ac(); if (c && c.state === 'suspended') { try { c.resume(); } catch (e) { } } }
  };
})();
