/* =====================================================================
 * save.js — 게임 상태(세이브) 정의 · 저장 · 불러오기
 * ---------------------------------------------------------------------
 * localStorage 키 하나(mathQuest_v1)에 전부 넣는다.
 * 저장이 막힌 환경(사생활 보호 모드 등)에서도 게임은 그냥 돌아간다(메모리 폴백).
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};
  var KEY = 'mathQuest_v1';
  var VER = 1;
  var mem = null;         // localStorage 가 막혔을 때 쓰는 메모리 저장소
  var canLS = (function () {
    try { localStorage.setItem('__mq', '1'); localStorage.removeItem('__mq'); return true; } catch (e) { return false; }
  })();

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function weekKey() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));   // 그 주 월요일
    return d.getFullYear() + '-W' + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
  }
  MQ.today = today;
  MQ.weekKey = weekKey;

  MQ.newState = function () {
    return {
      v: VER,
      created: Date.now(),
      lv: 1, exp: 0, gold: 120, gem: 0, sp: 0,
      hp: null,                       // null 이면 가득 채움
      diff: 6,                        // 지금 문제 난이도(적응형)
      assessed: false,                // 실력측정 완료 여부
      region: 0, stage: 0,
      cleared: {}, bossCleared: {},
      inv: { equipped: {}, owned: {}, items: { hint: 3, fifty: 2, time: 2, shield: 1, revive: 0, potion: 2, chest: 0, bigchest: 0 } },
      perks: { atk: 0, def: 0, hp: 0, time: 0, luck: 0 },   // 스킬포인트로 올리는 영구 능력
      skillLv: { calc: 1, shape: 1, logic: 1, pattern: 1, prob: 1 },
      skillExp: { calc: 0, shape: 0, logic: 0, pattern: 0, prob: 0 },
      recent: [],                     // 최근 40문제 기록 {t:유형, s:분야, ok, ms, lv}
      badges: {},                     // 업적 id → 달성 시각
      codex: { mon: {}, item: {}, type: {} },
      stats: {
        solved: 0, correct: 0, streak: 0, maxStreak: 0, maxCombo: 0, fast: 0, perfect: 0,
        mons: 0, bosses: 0, dungeons: 0, battles: 0, goldEarned: 0, gemEarned: 0,
        chests: 0, maxChest: 0, dailyDone: 0, weeklyDone: 0, seasonRewards: 0,
        bySkill: {}, byType: {}, days: {}, playMs: 0
      },
      daily: null, weekly: null,
      season: { key: null, pt: 0, taken: [] },
      settings: { sound: true, bgm: true, bigText: false }
    };
  };

  /* 옛 세이브에 빠진 칸을 채운다 */
  MQ.migrate = function (S) {
    var d = MQ.newState(), k;
    if (!S || typeof S !== 'object') return d;
    for (k in d) if (S[k] === undefined) S[k] = d[k];
    for (k in d.stats) if (S.stats[k] === undefined) S.stats[k] = d.stats[k];
    for (k in d.skillLv) { if (S.skillLv[k] === undefined) S.skillLv[k] = 1; if (S.skillExp[k] === undefined) S.skillExp[k] = 0; }
    if (!S.inv.items) S.inv.items = d.inv.items;
    if (!S.inv.owned) S.inv.owned = {};
    if (!S.inv.equipped) S.inv.equipped = {};
    if (!S.codex.mon) S.codex.mon = {};
    if (!S.codex.item) S.codex.item = {};
    if (!S.codex.type) S.codex.type = {};
    if (!S.perks) S.perks = d.perks;
    for (k in d.perks) if (S.perks[k] === undefined) S.perks[k] = 0;
    if (!S.settings) S.settings = d.settings;
    S.v = VER;
    return S;
  };

  MQ.Save = {
    exists: function () { return !!MQ.Save.raw(); },
    raw: function () {
      try { return canLS ? localStorage.getItem(KEY) : mem; } catch (e) { return mem; }
    },
    load: function () {
      var s = MQ.Save.raw();
      if (!s) return null;
      try { return MQ.migrate(JSON.parse(s)); } catch (e) { return null; }
    },
    save: function (S) {
      var s;
      try { s = JSON.stringify(S); } catch (e) { return false; }
      mem = s;
      if (!canLS) return false;
      try { localStorage.setItem(KEY, s); return true; } catch (e) { return false; }
    },
    clear: function () {
      mem = null;
      try { if (canLS) localStorage.removeItem(KEY); } catch (e) { }
    }
  };
})();
