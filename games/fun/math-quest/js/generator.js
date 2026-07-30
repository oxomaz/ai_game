/* =====================================================================
 * generator.js — 문제 유형 등록소 + 문제 뽑기
 * ---------------------------------------------------------------------
 * 모든 문제 생성기(js/gen/*.js)는 여기 등록된다.
 * 게임은 MQ.Gen.make(lv, opt) 한 줄로 문제를 받는다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  /* ---------- 난수 도우미 ---------- */
  function makeR(seed) {
    // seed 를 주면 재현 가능한 난수(랜덤 던전에서 사용)
    var s = seed == null ? Math.floor(Math.random() * 2147483647) : (seed | 0) || 1;
    function next() { s = (s * 48271) % 2147483647; return (s - 1) / 2147483646; }
    var R = {
      next: next,
      int: function (a, b) { if (b == null) { b = a; a = 0; } return a + Math.floor(next() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      chance: function (p) { return next() < p; },
      shuffle: function (arr) {
        var a = arr.slice(), i, j, t;
        for (i = a.length - 1; i > 0; i--) { j = Math.floor(next() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
      },
      sample: function (arr, n) { return R.shuffle(arr).slice(0, n); }
    };
    return R;
  }
  MQ.makeR = makeR;
  MQ.R = makeR(); // 전역 기본 난수

  /* ---------- 보기 만들기 도우미 ---------- */
  MQ.mkChoices = function (ans, R, opt) {
    opt = opt || {};
    var dec = opt.dec || 0;
    var pow = Math.pow(10, dec);
    var spread = opt.spread || Math.max(2, Math.round(Math.abs(ans) * 0.25));
    function fmt(n) { return dec ? (Math.round(n * pow) / pow).toFixed(dec) : String(Math.round(n)); }
    var seen = {}, out = [], a = fmt(ans);
    seen[a] = 1; out.push(a);
    var guard = 0;
    while (out.length < 4 && guard++ < 300) {
      var d = ans + (R.int(1, spread)) * (R.chance(0.5) ? 1 : -1);
      if (opt.min != null && d < opt.min) continue;
      if (opt.max != null && d > opt.max) continue;
      var s = fmt(d);
      if (seen[s]) continue;
      seen[s] = 1; out.push(s);
    }
    var k = 1;
    while (out.length < 4) { var s2 = fmt(ans + spread + k * 3); if (!seen[s2]) { seen[s2] = 1; out.push(s2); } k++; }
    return out;
  };

  /* 문자열 정답 + 오답 후보 → 중복 없는 4개 */
  MQ.uniq4 = function (answer, cands, R) {
    var seen = {}, out = [String(answer)];
    seen[String(answer)] = 1;
    var list = R ? R.shuffle(cands) : cands;
    for (var i = 0; i < list.length && out.length < 4; i++) {
      var s = String(list[i]);
      if (seen[s] || s === '' || s === 'undefined') continue;
      seen[s] = 1; out.push(s);
    }
    var k = 1;
    var alt = ['?', '없음', '모두 다름', '알 수 없음'];
    while (out.length < 4) { var s2 = alt[k - 1] || (String(answer) + k); if (!seen[s2]) { seen[s2] = 1; out.push(s2); } k++; }
    return out;
  };

  /* ---------- 등록소 ---------- */
  var TYPES = {};   // id → {id, name, icon, skill, minLv, maxLv, fn}
  var ORDER = [];

  MQ.Gen = {
    types: TYPES,
    order: ORDER,

    register: function (id, meta, fn) {
      if (TYPES[id]) { console.warn('[MQ] 중복 문제 유형:', id); return; }
      TYPES[id] = {
        id: id,
        name: meta.name || id,
        icon: meta.icon || '❓',
        skill: meta.skill || 'calc',
        minLv: meta.minLv || 1,
        maxLv: meta.maxLv || 100,
        fn: fn
      };
      ORDER.push(id);
    },

    /* 이 레벨에서 나올 수 있는 유형들 */
    pool: function (lv, filter) {
      var out = [], i, t;
      for (i = 0; i < ORDER.length; i++) {
        t = TYPES[ORDER[i]];
        if (lv < t.minLv || lv > t.maxLv) continue;
        if (filter && filter.skill && t.skill !== filter.skill) continue;
        if (filter && filter.only && filter.only.indexOf(t.id) < 0) continue;
        if (filter && filter.exclude && filter.exclude.indexOf(t.id) >= 0) continue;
        out.push(t);
      }
      if (!out.length) { // 안전망: 레벨 밖이면 전체에서
        for (i = 0; i < ORDER.length; i++) out.push(TYPES[ORDER[i]]);
      }
      return out;
    },

    /* 문제 하나 만들기
     * opt: { skill, only, exclude, R, recent(최근 낸 유형 id 배열) } */
    make: function (lv, opt) {
      opt = opt || {};
      var R = opt.R || MQ.R;
      lv = Math.max(1, Math.min(100, Math.round(lv)));
      var pool = MQ.Gen.pool(lv, opt);

      // 최근에 낸 유형은 뽑힐 확률을 낮춘다(같은 문제 반복 방지)
      var recent = opt.recent || [];
      var fresh = [];
      for (var i = 0; i < pool.length; i++) if (recent.indexOf(pool[i].id) < 0) fresh.push(pool[i]);
      var use = fresh.length >= 3 ? fresh : pool;

      var t = R.pick(use);
      var p = null;
      try {
        p = t.fn(lv, R);
      } catch (e) {
        console.warn('[MQ] 문제 생성 실패:', t.id, e);
      }
      if (!p || !p.choices || p.choices.length !== 4) {
        // 어떤 생성기가 터져도 게임은 멈추지 않는다
        var a = R.int(2, 9), b = R.int(2, 9);
        p = {
          text: a + ' + ' + b + ' = ?',
          answer: String(a + b),
          choices: MQ.mkChoices(a + b, R, { spread: 4, min: 0 }),
          explain: a + '에 ' + b + '을(를) 더하면 ' + (a + b) + '이에요.'
        };
        t = TYPES['add'] || t;
      }
      p.type = t.id;
      p.typeName = t.name;
      p.icon = t.icon;
      p.skill = t.skill;
      p.lv = lv;
      p.shuffled = R.shuffle(p.choices);
      return p;
    },

    /* 유형 목록(도감용) */
    list: function () {
      var out = [];
      for (var i = 0; i < ORDER.length; i++) out.push(TYPES[ORDER[i]]);
      return out;
    }
  };

  /* 능력치 이름 */
  MQ.SKILLS = {
    calc: { name: '연산', icon: '➕', color: '#ffd166' },
    shape: { name: '도형', icon: '📐', color: '#4cc9f0' },
    logic: { name: '논리', icon: '🧩', color: '#b892ff' },
    pattern: { name: '추리', icon: '🔢', color: '#7bd88f' },
    prob: { name: '확률', icon: '🎲', color: '#f72585' }
  };
  MQ.SKILL_IDS = ['calc', 'shape', 'logic', 'pattern', 'prob'];
})();
