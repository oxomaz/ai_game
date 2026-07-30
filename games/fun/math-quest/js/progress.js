/* =====================================================================
 * progress.js — 기록 · 도감 · 업적 · 일일/주간 미션 · 시즌
 * ---------------------------------------------------------------------
 * 게임 중에 일어나는 모든 일은 MQ.Prog.* 로 흘러 들어와 여기서만 기록된다.
 * (통계를 한 곳에 모아야 부모 대시보드와 업적이 어긋나지 않는다)
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  function bump(o, k, n) { o[k] = (o[k] || 0) + (n || 1); }

  var Prog = MQ.Prog = {

    /* ---------- 문제 한 개 결과 ---------- */
    answer: function (S, r) {
      var st = S.stats;
      bump(st, 'solved');
      var day = st.days[MQ.today()] || (st.days[MQ.today()] = { n: 0, ok: 0, ms: 0 });
      day.n++; day.ms += r.ms || 0;

      var bs = st.bySkill[r.skill] || (st.bySkill[r.skill] = { n: 0, ok: 0, ms: 0 });
      bs.n++; bs.ms += r.ms || 0;
      var bt = st.byType[r.type] || (st.byType[r.type] = { n: 0, ok: 0 });
      bt.n++;
      S.codex.type[r.type] = S.codex.type[r.type] || Date.now();

      if (r.ok) {
        bump(st, 'correct'); bs.ok++; bt.ok++; day.ok++;
        st.streak = (st.streak || 0) + 1;
        if (st.streak > (st.maxStreak || 0)) st.maxStreak = st.streak;
        if ((r.ms || 9999) <= 3000) bump(st, 'fast');
        MQ.P.addSkillExp(S, r.skill, 1);
      } else {
        st.streak = 0;
      }
      MQ.Diff.record(S, { t: r.type, s: r.skill, ok: !!r.ok, ms: r.ms, limit: r.limit, lv: r.lv });
      Prog.mission(S, r.ok ? 'correct' : null, 1);
      if (r.ok) {
        Prog.mission(S, 'solveOnly', 1);
        Prog.mission(S, 'skill:' + r.skill, 1);
        if ((r.ms || 9999) <= 3000) Prog.mission(S, 'fast', 1);
        if (st.streak >= 1) Prog.missionMax(S, 'streak', st.streak);
      }
      Prog.mission(S, 'solve', 1);
      Prog.season(S, r.ok ? 3 : 1);
    },

    /* ---------- 그 밖의 사건 ---------- */
    event: function (S, kind, n) {
      var st = S.stats;
      n = n || 1;
      /* 사건 이름 → 통계 칸 이름 (여기가 어긋나면 업적이 영영 안 달린다) */
      var STAT = { mon: 'mons', boss: 'bosses', battle: 'battles', dungeon: 'dungeons', chest: 'chests' };
      bump(st, STAT[kind] || kind, n);
      Prog.mission(S, kind, n);
      if (kind === 'boss') Prog.season(S, 120 * n);
      if (kind === 'battle') Prog.season(S, 20 * n);
      if (kind === 'dungeon') Prog.season(S, 80 * n);
    },
    seeMonster: function (S, key) { S.codex.mon[key] = S.codex.mon[key] || Date.now(); },

    /* ---------- 업적 ---------- */
    checkAch: function (S) {
      var got = [];
      for (var i = 0; i < MQ.ACH.length; i++) {
        var a = MQ.ACH[i];
        if (S.badges[a.id]) continue;
        var ok = false;
        try { ok = !!a.check(S); } catch (e) { ok = false; }
        if (ok) {
          S.badges[a.id] = Date.now();
          MQ.P.addGold(S, a.gold);
          if (a.gem) MQ.P.addGem(S, a.gem);
          Prog.season(S, 40);
          got.push(a);
        }
      }
      return got;
    },
    achCount: function (S) { var n = 0; for (var k in S.badges) if (S.badges[k]) n++; return n; },

    /* =====================================================================
     * 미션
     * ===================================================================== */
    rollMissions: function (S, kind) {
      var pool = MQ.R.shuffle(MQ.MISSION_POOL);
      var count = kind === 'daily' ? 4 : 3;
      var list = [], i = 0;
      while (list.length < count && i < pool.length) {
        var m = pool[i++];
        if (kind === 'weekly' && m.kind === 'streak') { /* 주간에도 허용 */ }
        var gi = kind === 'weekly' ? m.goals.length - 1 : MQ.R.int(0, Math.max(0, m.goals.length - 2));
        /* 연속 정답은 "한 번에 이어서" 하는 것이라 주간이라고 곱하면 불가능해진다 */
        var scale = (kind === 'weekly' && m.kind !== 'streak') ? 3 : 1;
        var goal = m.goals[gi] * scale;
        list.push({
          id: m.id, emoji: m.emoji, kind: m.kind, skill: m.skill || null,
          text: m.text.replace('{n}', goal), goal: goal, prog: 0, done: false, taken: false,
          gold: (kind === 'weekly' ? 400 : 90) + goal * (kind === 'weekly' ? 6 : 3),
          gem: kind === 'weekly' ? 3 : 0
        });
      }
      return list;
    },

    ensureMissions: function (S) {
      var d = MQ.today(), w = MQ.weekKey();
      if (!S.daily || S.daily.date !== d) S.daily = { date: d, list: Prog.rollMissions(S, 'daily') };
      if (!S.weekly || S.weekly.week !== w) S.weekly = { week: w, list: Prog.rollMissions(S, 'weekly') };
      if (!S.season || S.season.key !== Prog.seasonKey()) S.season = { key: Prog.seasonKey(), pt: 0, taken: [] };
    },

    /* 미션 진행도 올리기. key 는 'solve'|'correct'|'skill:calc'|'battle'|... */
    mission: function (S, key, n) {
      if (!key) return;
      var lists = [S.daily && S.daily.list, S.weekly && S.weekly.list];
      for (var l = 0; l < lists.length; l++) {
        var list = lists[l]; if (!list) continue;
        for (var i = 0; i < list.length; i++) {
          var m = list[i];
          if (m.done) continue;
          var match = (m.kind === key) || (key.indexOf('skill:') === 0 && m.kind === 'skill' && m.skill === key.slice(6));
          if (!match) continue;
          m.prog = Math.min(m.goal, m.prog + n);
          if (m.prog >= m.goal) m.done = true;
        }
      }
    },
    /* 최고값형(연속 정답) */
    missionMax: function (S, key, v) {
      var lists = [S.daily && S.daily.list, S.weekly && S.weekly.list];
      for (var l = 0; l < lists.length; l++) {
        var list = lists[l]; if (!list) continue;
        for (var i = 0; i < list.length; i++) {
          var m = list[i];
          if (m.done || m.kind !== key) continue;
          m.prog = Math.max(m.prog, Math.min(m.goal, v));
          if (m.prog >= m.goal) m.done = true;
        }
      }
    },
    claim: function (S, kind, idx) {
      var box = kind === 'weekly' ? S.weekly : S.daily;
      if (!box) return null;
      var m = box.list[idx];
      if (!m || !m.done || m.taken) return null;
      m.taken = true;
      MQ.P.addGold(S, m.gold);
      if (m.gem) MQ.P.addGem(S, m.gem);
      bump(S.stats, kind === 'weekly' ? 'weeklyDone' : 'dailyDone');
      Prog.season(S, kind === 'weekly' ? 300 : 80);
      return m;
    },
    pendingRewards: function (S) {
      var n = 0, i;
      if (S.daily) for (i = 0; i < S.daily.list.length; i++) if (S.daily.list[i].done && !S.daily.list[i].taken) n++;
      if (S.weekly) for (i = 0; i < S.weekly.list.length; i++) if (S.weekly.list[i].done && !S.weekly.list[i].taken) n++;
      return n;
    },

    /* =====================================================================
     * 시즌 — 4주마다 바뀐다
     * ===================================================================== */
    seasonKey: function () {
      var epoch = Date.UTC(2026, 0, 5);                    // 기준 월요일
      var weeks = Math.floor((Date.now() - epoch) / (7 * 864e5));
      return Math.floor(weeks / 4);
    },
    seasonInfo: function () {
      var k = Prog.seasonKey();
      var s = MQ.SEASONS[k % MQ.SEASONS.length];
      return { key: k, no: k + 1, name: s.name, emoji: s.emoji, color: s.color };
    },
    season: function (S, pt) {
      if (!S.season || S.season.key !== Prog.seasonKey()) S.season = { key: Prog.seasonKey(), pt: 0, taken: [] };
      S.season.pt += pt;
    },
    seasonClaimable: function (S) {
      var out = [];
      for (var i = 0; i < MQ.SEASON_PASS.length; i++) {
        var p = MQ.SEASON_PASS[i];
        if (S.season.pt >= p.at && S.season.taken.indexOf(i) < 0) out.push(i);
      }
      return out;
    },
    claimSeason: function (S, i) {
      var p = MQ.SEASON_PASS[i];
      if (!p || S.season.pt < p.at || S.season.taken.indexOf(i) >= 0) return null;
      S.season.taken.push(i);
      var got = { gold: 0, gem: 0, items: [] };
      if (p.gold) got.gold = MQ.P.addGold(S, p.gold);
      if (p.gem) got.gem = MQ.P.addGem(S, p.gem);
      if (p.item) for (var k = 0; k < 1; k++) got.items.push(MQ.Loot.openChest(S, { minRar: p.item }).item);
      bump(S.stats, 'seasonRewards');
      return got;
    }
  };
})();
