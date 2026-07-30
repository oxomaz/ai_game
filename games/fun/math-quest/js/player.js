/* =====================================================================
 * player.js — 레벨·경험치·능력치·장비 보너스 계산
 * ---------------------------------------------------------------------
 * "지금 내 캐릭터가 얼마나 센가"는 전부 여기서 계산한다.
 * 화면·전투는 이 함수들만 부른다(밸런스는 이 파일만 고치면 된다).
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  var P = MQ.P = {

    /* 다음 레벨까지 필요한 경험치 */
    need: function (lv) { return Math.round(35 + lv * 22 + Math.pow(lv, 1.6)); },

    /* 장비에서 오는 합계 */
    gear: function (S) {
      var g = { atk: 0, def: 0, hp: 0, exp: 1, gold: 1, crit: 0, time: 0, shield: 0 };
      var eq = (S.inv && S.inv.equipped) || {};
      for (var slot in eq) {
        var it = MQ.ITEM[eq[slot]];
        if (!it) continue;
        g.atk += it.atk; g.def += it.def;
        var b = it.bonus || {};
        if (b.hp) g.hp += b.hp;
        if (b.exp) g.exp *= b.exp;
        if (b.gold) g.gold *= b.gold;
        if (b.crit) g.crit += b.crit;
        if (b.time) g.time += b.time;
        if (b.shield) g.shield += b.shield;
      }
      return g;
    },

    baseAtk: function (lv) { return 8 + lv * 1.5; },
    atk: function (S) { return P.baseAtk(S.lv) + P.gear(S).atk + (S.perks ? S.perks.atk * 2 : 0); },
    def: function (S) { return P.gear(S).def + (S.perks ? S.perks.def * 2 : 0); },
    hpMax: function (S) { return Math.round(60 + S.lv * 7 + P.gear(S).hp + (S.perks ? S.perks.hp * 10 : 0)); },
    crit: function (S) { return Math.min(0.6, 0.05 + P.gear(S).crit + (S.skillLv.calc - 1) * 0.005); },

    /* 능력치(분야) 레벨업에 필요한 경험 */
    skillNeed: function (lv) { return 8 + lv * 6; },

    /* 분야 문제를 맞히면 그 분야 능력치가 오른다 */
    addSkillExp: function (S, skill, n) {
      if (!S.skillExp[skill] && S.skillExp[skill] !== 0) { S.skillExp[skill] = 0; S.skillLv[skill] = 1; }
      S.skillExp[skill] += n;
      var ups = 0;
      while (S.skillExp[skill] >= P.skillNeed(S.skillLv[skill])) {
        S.skillExp[skill] -= P.skillNeed(S.skillLv[skill]);
        S.skillLv[skill]++; ups++;
        if (ups > 30) break;
      }
      return ups;
    },

    /* 경험치 추가 → 레벨업 횟수 반환 */
    addExp: function (S, n) {
      S.exp += n;
      var ups = 0;
      while (S.exp >= P.need(S.lv) && S.lv < 200) {
        S.exp -= P.need(S.lv);
        S.lv++; S.sp++; ups++;
        if (ups > 50) break;
      }
      return ups;
    },

    addGold: function (S, n) { n = Math.max(0, Math.round(n)); S.gold += n; S.stats.goldEarned += n; return n; },
    addGem: function (S, n) { n = Math.max(0, Math.round(n)); S.gem += n; S.stats.gemEarned += n; return n; },

    /* 등급 이름 — 학년이 아니라 실력 등급 */
    rank: function (diff) {
      var T = [[10, 'Easy', '#7bd88f'], [22, 'Normal', '#4cc9f0'], [36, 'Hard', '#ffd166'],
      [50, 'Expert', '#ff8a5c'], [64, 'Master', '#b892ff'], [78, 'Grand Master', '#f72585'],
      [90, 'Legend', '#ffd166'], [999, 'Mythic', '#ff4d6d']];
      for (var i = 0; i < T.length; i++) if (diff <= T[i][0]) return { name: T[i][1], color: T[i][2], idx: i };
      return { name: 'Mythic', color: '#ff4d6d', idx: 7 };
    },

    /* 지금 열려 있는 지역 수 */
    unlockedRegions: function (S) {
      var n = 0;
      for (var i = 0; i < MQ.REGIONS.length; i++) if (S.lv >= MQ.REGIONS[i].unlock) n = i + 1;
      return Math.max(1, n);
    },

    /* 장비 착용/해제 */
    equip: function (S, itemId) {
      var it = MQ.ITEM[itemId];
      if (!it || !S.inv.owned[itemId]) return false;
      S.inv.equipped[it.slot] = itemId;
      return true;
    },
    unequip: function (S, slot) { delete S.inv.equipped[slot]; },

    /* 아이템 획득 — 이미 있으면 조각(골드)으로 */
    gain: function (S, itemId) {
      var it = MQ.ITEM[itemId];
      if (!it) return null;
      var dup = !!S.inv.owned[itemId];
      S.inv.owned[itemId] = (S.inv.owned[itemId] || 0) + 1;
      S.codex.item[itemId] = S.codex.item[itemId] || Date.now();
      if (dup) P.addGold(S, 40 * (it.rar + 1));
      else if (!S.inv.equipped[it.slot]) S.inv.equipped[it.slot] = itemId;   // 빈 칸이면 자동 장착
      return { item: it, dup: dup };
    },

    /* 소모품 개수 */
    count: function (S, id) { return S.inv.items[id] || 0; },
    use: function (S, id) {
      if ((S.inv.items[id] || 0) <= 0) return false;
      S.inv.items[id]--; return true;
    },
    give: function (S, id, n) { S.inv.items[id] = (S.inv.items[id] || 0) + (n || 1); }
  };
})();
