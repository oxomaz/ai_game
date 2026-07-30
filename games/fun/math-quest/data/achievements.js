/* =====================================================================
 * data/achievements.js — 업적(100개 이상) · 일일미션 · 주간미션 · 시즌
 * ---------------------------------------------------------------------
 * 업적 하나: { id, emoji, name, desc, check(S) → true/false, gold, gem }
 * check 는 세이브 상태 S 를 받아 달성 여부만 판단한다(부작용 금지).
 * 새 업적은 ACH.push(A(...)) 한 줄이면 끝.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};
  var ACH = [];

  function A(id, emoji, name, desc, check, gold, gem) {
    ACH.push({ id: id, emoji: emoji, name: name, desc: desc, check: check, gold: gold || 50, gem: gem || 0 });
  }
  /* 단계형 업적을 한 번에 만든다 */
  function tier(prefix, emoji, name, unit, get, steps, gold) {
    for (var i = 0; i < steps.length; i++) (function (n, i) {
      A(prefix + n, emoji, name + ' ' + (i + 1), name + ' — ' + n + unit,
        function (S) { return get(S) >= n; }, (gold || 40) * (i + 1), i >= 3 ? 1 : 0);
    })(steps[i], i);
  }

  var st = function (S) { return S.stats || {}; };

  /* ---------- 문제 풀이 ---------- */
  tier('solve', '📚', '문제 사냥꾼', '문제', function (S) { return st(S).solved || 0; }, [10, 50, 100, 300, 1000, 3000], 40);
  tier('correct', '✅', '정답 수집가', '정답', function (S) { return st(S).correct || 0; }, [10, 100, 500, 1500, 5000], 50);
  tier('streak', '🔥', '연속 정답', '연속', function (S) { return st(S).maxStreak || 0; }, [5, 10, 20, 30, 50, 100], 60);
  tier('combo', '💥', '콤보 마스터', '콤보', function (S) { return st(S).maxCombo || 0; }, [5, 10, 20, 40], 60);
  tier('fast', '⚡', '번개 풀이', '문제를 3초 안에', function (S) { return st(S).fast || 0; }, [10, 50, 200, 500], 50);
  tier('perfect', '🌟', '무패 승리', '판을 한 번도 안 틀리고', function (S) { return st(S).perfect || 0; }, [1, 5, 20, 50], 60);

  /* ---------- 성장 ---------- */
  tier('lv', '⭐', '레벨업', '레벨 달성', function (S) { return S.lv || 1; }, [5, 10, 20, 30, 50, 70, 100], 80);
  tier('gold', '💰', '부자', '골드 모으기', function (S) { return st(S).goldEarned || 0; }, [500, 3000, 10000, 50000], 60);
  tier('gem', '💎', '보석 수집', '보석 모으기', function (S) { return st(S).gemEarned || 0; }, [5, 20, 60, 150], 80);

  /* ---------- 전투 ---------- */
  tier('mon', '👾', '몬스터 사냥', '마리 물리치기', function (S) { return st(S).mons || 0; }, [10, 50, 200, 500, 1000], 50);
  tier('boss', '👑', '보스 사냥꾼', '보스 처치', function (S) { return st(S).bosses || 0; }, [1, 3, 8, 20], 120);
  tier('dg', '🗝️', '던전 탐험가', '던전 클리어', function (S) { return st(S).dungeons || 0; }, [1, 5, 20, 50], 70);

  /* ---------- 수집 ---------- */
  tier('item', '🎁', '수집가', '종류의 아이템', function (S) { return Object.keys((S.codex && S.codex.item) || {}).length; }, [5, 15, 30, 45, 62], 70);
  tier('mdex', '📕', '몬스터 도감', '종류의 몬스터 기록', function (S) { return Object.keys((S.codex && S.codex.mon) || {}).length; }, [5, 20, 40, 56], 70);
  tier('tdex', '🧠', '문제 도감', '종류의 문제 경험', function (S) { return Object.keys((S.codex && S.codex.type) || {}).length; }, [10, 25, 40, 56], 70);

  /* ---------- 능력 분야별 ---------- */
  (function () {
    var names = { calc: '연산', shape: '도형', logic: '논리', pattern: '추리', prob: '확률' };
    var icons = { calc: '➕', shape: '📐', logic: '🧩', pattern: '🔢', prob: '🎲' };
    for (var k in names) (function (k) {
      tier('sk-' + k, icons[k], names[k] + ' 수련', '문제 맞히기',
        function (S) { var b = st(S).bySkill || {}; return (b[k] && b[k].ok) || 0; }, [20, 100, 400, 1000], 60);
      A('mst-' + k, icons[k], names[k] + ' 마스터', names[k] + ' 능력치를 Lv10 이상으로',
        function (S) { return (S.skillLv && S.skillLv[k] || 1) >= 10; }, 300, 2);
    })(k);
  })();

  /* ---------- 지역 ---------- */
  (function () {
    for (var i = 0; i < MQ.REGIONS.length; i++) (function (i) {
      var r = MQ.REGIONS[i];
      A('rg-' + r.id, r.emoji, r.name + ' 정복', r.name + '의 보스를 물리쳤어요',
        function (S) { return !!(S.bossCleared && S.bossCleared[i]); }, 200 + i * 50, i >= 4 ? 2 : 1);
    })(i);
  })();
  A('rg-all', '🏆', '세계 정복', '모든 지역의 보스를 물리쳤어요',
    function (S) { var n = 0, c = S.bossCleared || {}; for (var k in c) if (c[k]) n++; return n >= MQ.REGIONS.length; }, 3000, 20);

  /* ---------- 희귀도 ---------- */
  (function () {
    var want = [[1, '희귀', '🔵'], [2, '영웅', '🟣'], [3, '전설', '🟡'], [4, '신화', '🔴']];
    for (var i = 0; i < want.length; i++) (function (w) {
      A('rar-' + w[0], w[2], w[1] + ' 발견', w[1] + ' 등급 아이템을 처음 얻었어요',
        function (S) {
          var c = (S.codex && S.codex.item) || {};
          for (var id in c) { var it = MQ.ITEM[id]; if (it && it.rar >= w[0]) return true; }
          return false;
        }, 150 * w[0], w[0]);
    })(want[i]);
  })();

  /* ---------- 습관 ---------- */
  tier('day', '📅', '꾸준함', '일 동안 플레이', function (S) { return Object.keys(st(S).days || {}).length; }, [2, 5, 10, 30, 100], 80);
  tier('dm', '🎯', '일일미션', '개 완료', function (S) { return st(S).dailyDone || 0; }, [1, 5, 20, 60], 60);
  tier('wm', '🗓️', '주간미션', '개 완료', function (S) { return st(S).weeklyDone || 0; }, [1, 4, 12], 150);

  /* ---------- 특별 ---------- */
  A('first-blood', '🩸', '첫 승리', '처음으로 몬스터를 물리쳤어요', function (S) { return (st(S).mons || 0) >= 1; }, 30);
  A('full-gear', '🧰', '완전 무장', '7칸을 모두 장비로 채웠어요', function (S) {
    var e = (S.inv && S.inv.equipped) || {}, n = 0;
    for (var i = 0; i < MQ.SLOTS.length; i++) if (e[MQ.SLOTS[i].key]) n++;
    return n >= MQ.SLOTS.length;
  }, 400, 3);
  A('comeback', '💖', '기사회생', '체력 10% 이하에서 이겼어요', function (S) { return !!(st(S).comeback); }, 300, 2);
  A('nohint', '🧘', '맨손 승부', '도움 없이 보스를 이겼어요', function (S) { return !!(st(S).cleanBoss); }, 400, 2);
  A('night', '🌙', '올빼미', '밤 9시 이후에 플레이했어요', function (S) { return !!(st(S).night); }, 100);
  A('morning', '🌅', '아침형 용사', '아침 7시 이전에 플레이했어요', function (S) { return !!(st(S).morning); }, 100);
  A('lucky7', '🍀', '행운의 7', '한 판에서 상자를 3개 이상 얻었어요', function (S) { return (st(S).maxChest || 0) >= 3; }, 200, 1);
  A('scholar', '🎓', '만능 학자', '5개 분야를 모두 100문제 이상 맞혔어요', function (S) {
    var b = st(S).bySkill || {}, ids = MQ.SKILL_IDS;
    for (var i = 0; i < ids.length; i++) if (!b[ids[i]] || b[ids[i]].ok < 100) return false;
    return true;
  }, 1000, 5);
  A('season1', '🏅', '시즌 참가자', '시즌 보상을 한 번 받았어요', function (S) { return (st(S).seasonRewards || 0) >= 1; }, 200, 1);
  A('hardcore', '💀', '심연을 본 자', '시련의 심연 던전을 클리어했어요', function (S) { return !!(st(S).abyss); }, 500, 3);
  A('speedrun', '🏃', '전광석화', '한 판을 60초 안에 클리어했어요', function (S) { return !!(st(S).speedrun); }, 250, 1);
  A('collector', '🗃️', '도감 완성', '아이템 도감을 100% 채웠어요',
    function (S) { return Object.keys((S.codex && S.codex.item) || {}).length >= MQ.ITEMS.length; }, 5000, 30);

  MQ.ACH = ACH;
  MQ.ACH_MAP = {};
  for (var a = 0; a < ACH.length; a++) MQ.ACH_MAP[ACH[a].id] = ACH[a];

  /* =====================================================================
   * 미션 — 매일/매주 무작위로 뽑힌다
   * mk(id, 이모지, 문구, 목표수, 진행도계산(델타 이벤트 기반))
   * kind: 'solve'|'correct'|'skill'|'battle'|'boss'|'dungeon'|'streak'|'fast'|'chest'
   * ===================================================================== */
  MQ.MISSION_POOL = [
    { id: 'm-solve', emoji: '📝', kind: 'solve', text: '문제 {n}개 풀기', goals: [15, 25, 40] },
    { id: 'm-correct', emoji: '✅', kind: 'correct', text: '정답 {n}개 맞히기', goals: [10, 20, 35] },
    { id: 'm-calc', emoji: '➕', kind: 'skill', skill: 'calc', text: '연산 문제 {n}개 맞히기', goals: [8, 15, 25] },
    { id: 'm-shape', emoji: '📐', kind: 'skill', skill: 'shape', text: '도형 문제 {n}개 맞히기', goals: [4, 8, 12] },
    { id: 'm-logic', emoji: '🧩', kind: 'skill', skill: 'logic', text: '논리 문제 {n}개 맞히기', goals: [4, 8, 12] },
    { id: 'm-pattern', emoji: '🔢', kind: 'skill', skill: 'pattern', text: '추리 문제 {n}개 맞히기', goals: [4, 8, 12] },
    { id: 'm-prob', emoji: '🎲', kind: 'skill', skill: 'prob', text: '확률 문제 {n}개 맞히기', goals: [3, 6, 10] },
    { id: 'm-battle', emoji: '⚔️', kind: 'battle', text: '전투 {n}번 승리', goals: [3, 6, 10] },
    { id: 'm-boss', emoji: '👑', kind: 'boss', text: '보스 {n}번 처치', goals: [1, 2] },
    { id: 'm-dungeon', emoji: '🗝️', kind: 'dungeon', text: '던전 {n}번 클리어', goals: [1, 2, 3] },
    { id: 'm-streak', emoji: '🔥', kind: 'streak', text: '{n}연속 정답 만들기', goals: [8, 12, 20] },
    { id: 'm-fast', emoji: '⚡', kind: 'fast', text: '3초 안에 {n}문제 맞히기', goals: [5, 10, 18] },
    { id: 'm-chest', emoji: '🎁', kind: 'chest', text: '보물상자 {n}개 열기', goals: [2, 4, 7] }
  ];

  /* 시즌 — 4주마다 바뀐다 */
  MQ.SEASONS = [
    { id: 1, name: '새싹 시즌', emoji: '🌱', color: '#7bd88f' },
    { id: 2, name: '불꽃 시즌', emoji: '🔥', color: '#ff8a5c' },
    { id: 3, name: '얼음 시즌', emoji: '❄️', color: '#4cc9f0' },
    { id: 4, name: '별빛 시즌', emoji: '✨', color: '#b892ff' }
  ];
  /* 시즌 패스 보상 (누적 시즌 점수) */
  MQ.SEASON_PASS = [
    { at: 100, gold: 200 }, { at: 300, gem: 2 }, { at: 600, gold: 600 },
    { at: 1000, gem: 5 }, { at: 1600, item: 2 }, { at: 2500, gem: 10 }, { at: 4000, item: 3 }
  ];
})();
