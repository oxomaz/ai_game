/* =====================================================================
 * bgm.js — 배경음악 (파일 없이 Web Audio 로 직접 연주한다)
 * ---------------------------------------------------------------------
 * 지역마다 다른 곡이 흐르고, 전투·보스는 또 다른 곡으로 바뀐다.
 * 곡 = 음계 + 화음 진행 + 리듬. 같은 곡은 매번 같게, 하지만 마디마다
 * 조금씩 다르게 연주되어 오래 들어도 덜 지루하다.
 *
 * 새 곡 추가: TRACKS 에 한 덩어리 추가하고 MQ.Bgm.play('아이디') 로 부른다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  /* 음이름 → 주파수 (A4 = 440Hz) */
  function hz(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  /* 음계 (반음 간격) */
  var SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    penta: [0, 2, 4, 7, 9],
    pentaMin: [0, 3, 5, 7, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    whole: [0, 2, 4, 6, 8, 10]
  };

  /* ---------------------------------------------------------------
   * 곡 정의
   *  root   : 으뜸음(MIDI 번호). 60 = 가온다
   *  scale  : 위 SCALES 중 하나
   *  bpm    : 빠르기
   *  chords : 화음 진행(음계의 몇 번째 음에서 시작하는지)
   *  lead   : 멜로디 음색 / bass : 저음 음색
   *  density: 멜로디가 촘촘한 정도(0~1)
   *  swing  : 셋잇단 느낌
   * --------------------------------------------------------------- */
  var TRACKS = {
    /* 시작 화면 — 설레는 느낌 */
    title: { root: 62, scale: 'major', bpm: 96, chords: [0, 4, 5, 3], lead: 'triangle', bass: 'sine', density: .5, vol: .9 },

    /* 지역 8곡 */
    plain: { root: 60, scale: 'major', bpm: 104, chords: [0, 3, 4, 0], lead: 'triangle', bass: 'sine', density: .55 },
    slime: { root: 57, scale: 'dorian', bpm: 96, chords: [0, 5, 3, 4], lead: 'triangle', bass: 'sine', density: .5 },
    ice: { root: 64, scale: 'penta', bpm: 80, chords: [0, 5, 3, 4], lead: 'sine', bass: 'sine', density: .38, bell: true },
    pyramid: { root: 57, scale: 'pentaMin', bpm: 100, chords: [0, 0, 3, 4], lead: 'square', bass: 'triangle', density: .55, swing: true },
    library: { root: 62, scale: 'lydian', bpm: 74, chords: [0, 4, 2, 5], lead: 'sine', bass: 'sine', density: .34, bell: true },
    city: { root: 55, scale: 'minor', bpm: 124, chords: [0, 5, 3, 4], lead: 'square', bass: 'sawtooth', density: .72 },
    dragon: { root: 53, scale: 'pentaMin', bpm: 112, chords: [0, 3, 5, 4], lead: 'sawtooth', bass: 'sawtooth', density: .62 },
    space: { root: 66, scale: 'whole', bpm: 88, chords: [0, 3, 1, 4], lead: 'sine', bass: 'triangle', density: .4, bell: true },

    /* 전투 */
    battle: { root: 57, scale: 'minor', bpm: 132, chords: [0, 0, 5, 4], lead: 'square', bass: 'sawtooth', density: .7, drums: true },
    boss: { root: 50, scale: 'pentaMin', bpm: 144, chords: [0, 4, 3, 0], lead: 'sawtooth', bass: 'sawtooth', density: .8, drums: true, vol: 1.1 },
    dungeon: { root: 59, scale: 'dorian', bpm: 128, chords: [0, 2, 5, 4], lead: 'square', bass: 'triangle', density: .66, drums: true }
  };

  var ctx = null, master = null, on = true, cur = null, timer = 0;
  var step = 0, nextTime = 0, curGain = null, seed = 1;

  function rnd() { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646; }

  function ac() {
    if (ctx) return ctx;
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.16;          // 배경음악은 효과음보다 작게
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function note(freq, t, dur, type, vol, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function drum(t, kind, dest) {
    var n = Math.floor(ctx.sampleRate * 0.14);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, kind === 'kick' ? 6 : 2);
    var s = ctx.createBufferSource(); s.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = kind === 'kick' ? 'lowpass' : 'highpass';
    f.frequency.value = kind === 'kick' ? 160 : 5200;
    var g = ctx.createGain(); g.gain.value = kind === 'kick' ? 0.5 : 0.12;
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t);
    if (kind === 'kick') note(70, t, 0.12, 'sine', 0.4, dest);
  }

  /* 한 스텝(16분음표) 연주 */
  function playStep(T, s, t, dest) {
    var sc = SCALES[T.scale], oct = 12;
    var bar = Math.floor(s / 16) % T.chords.length;
    var deg = T.chords[bar];
    var inBar = s % 16;

    // 베이스 — 마디 앞과 8번째 스텝
    if (inBar === 0 || inBar === 8) {
      var bn = T.root - oct + sc[deg % sc.length] + (deg >= sc.length ? oct : 0);
      note(hz(bn), t, inBar === 0 ? 0.5 : 0.32, T.bass, 0.16, dest);
    }
    // 화음 패드 — 마디 앞
    if (inBar === 0) {
      for (var c = 0; c < 3; c++) {
        var cn = T.root + sc[(deg + c * 2) % sc.length] + (Math.floor((deg + c * 2) / sc.length) * oct);
        note(hz(cn), t, 1.2, 'sine', 0.05, dest);
      }
    }
    // 드럼
    if (T.drums) {
      if (inBar % 8 === 0) drum(t, 'kick', dest);
      if (inBar % 4 === 2) drum(t, 'hat', dest);
    }
    // 멜로디
    var beat = (inBar % 4 === 0) ? 1 : (inBar % 2 === 0 ? .6 : .3);
    if (rnd() < T.density * beat) {
      var idx = deg + Math.floor(rnd() * 5) + (rnd() < .3 ? sc.length : 0);
      var mn = T.root + oct + sc[idx % sc.length] + Math.floor(idx / sc.length) * oct;
      var dur = (rnd() < .25 ? 0.5 : 0.22);
      note(hz(mn), t, dur, T.lead, 0.075, dest);
      if (T.bell && rnd() < .3) note(hz(mn + 12), t + 0.04, dur, 'sine', 0.04, dest);
    }
  }

  function scheduler() {
    if (!ctx || !cur) return;
    var T = TRACKS[cur.id];
    var spb = 60 / T.bpm / 4;                  // 16분음표 길이
    while (nextTime < ctx.currentTime + 0.35) {
      var t = nextTime;
      if (T.swing && step % 2 === 1) t += spb * 0.18;
      playStep(T, step, t, cur.gain);
      step++;
      nextTime += spb;
    }
  }

  var Bgm = MQ.Bgm = {
    tracks: TRACKS,

    /* 곡 바꾸기 (같은 곡이면 아무것도 안 함) */
    play: function (id) {
      if (!on) { cur = cur && cur.id === id ? cur : { id: id, gain: null }; return; }
      if (!TRACKS[id]) return;
      var c = ac(); if (!c) return;
      try { if (c.state === 'suspended') c.resume(); } catch (e) { }
      if (cur && cur.id === id && cur.gain) return;

      // 이전 곡 부드럽게 줄이기
      if (cur && cur.gain) Bgm._fadeOut(cur.gain);

      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime((TRACKS[id].vol || 1), c.currentTime + 1.2);
      g.connect(master);
      cur = { id: id, gain: g };
      seed = 1234 + id.length * 77;
      step = 0;
      nextTime = c.currentTime + 0.08;
      clearInterval(timer);
      timer = setInterval(scheduler, 90);
      scheduler();
    },

    _fadeOut: function (g) {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        setTimeout(function () { try { g.disconnect(); } catch (e) { } }, 900);
      } catch (e) { }
    },

    stop: function () {
      clearInterval(timer); timer = 0;
      if (cur && cur.gain) Bgm._fadeOut(cur.gain);
      cur = null;
    },

    current: function () { return cur ? cur.id : null; },
    isOn: function () { return on; },
    setOn: function (v) {
      on = !!v;
      if (!on) { var id = cur ? cur.id : null; Bgm.stop(); cur = id ? { id: id, gain: null } : null; }
      else if (cur) { var keep = cur.id; cur = null; Bgm.play(keep); }
    },
    /* 화면에 맞는 곡을 골라 준다 */
    forScreen: function (screen, regionIdx, kind) {
      if (screen === 'title') return 'title';
      if (screen === 'battle') return kind === 'boss' ? 'boss' : kind === 'dungeon' ? 'dungeon' : 'battle';
      var r = MQ.REGIONS[regionIdx || 0];
      return (r && TRACKS[r.id]) ? r.id : 'plain';
    }
  };

  /* 탭이 숨겨지면 음악을 멈춘다(배터리·예의) */
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    try { if (document.visibilityState === 'hidden') ctx.suspend(); else if (on) ctx.resume(); } catch (e) { }
  });
})();
