/* =====================================================================
 * difficulty.js — 적응형 난이도 엔진
 * ---------------------------------------------------------------------
 * "조금 어렵지만 풀 수 있는" 상태를 계속 유지하는 것이 이 파일의 목표.
 * 최근 20문제의 정답률 + 푸는 데 걸린 시간을 보고 난이도를 스스로 조절한다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  var WINDOW = 20;      // 몇 문제를 보고 판단할지
  var KEEP = 40;      // 기록을 몇 개까지 들고 있을지

  /* 분야별로 생각할 시간이 다르다 */
  var TIME_FACTOR = { calc: 1, pattern: 1.35, shape: 1.3, prob: 1.35, logic: 1.6 };

  var D = MQ.Diff = {

    /* 실력측정용 계단 (학년이 아니라 난이도 계단이다) */
    ASSESS: [5, 14, 26, 40, 58],

    /* 문제 하나에 주는 시간(초) */
    timeFor: function (S, p, mod) {
      var base = 26 - p.lv * 0.09;
      base *= (TIME_FACTOR[p.skill] || 1);
      base += MQ.P.gear(S).time + (S.perks ? S.perks.time * 0.6 : 0);
      if (mod && mod.time) base *= mod.time;
      if (p.svg || p.sub) base += 4;      // 그림·표를 읽는 시간
      return Math.max(7, Math.round(base));
    },

    /* 문제 뽑기 — 지역이 좋아하는 분야에 살짝 가중치를 준다 */
    pick: function (S, opt) {
      opt = opt || {};
      var recent = [];
      for (var i = Math.max(0, S.recent.length - 6); i < S.recent.length; i++) recent.push(S.recent[i].t);

      var skill = opt.skill || null;
      if (!skill && opt.regionSkills && opt.regionSkills.length && Math.random() < 0.55) {
        skill = opt.regionSkills[Math.floor(Math.random() * opt.regionSkills.length)];
      }
      var lv = Math.max(1, Math.min(100, Math.round((opt.lv != null ? opt.lv : S.diff) + (opt.diffMod || 0))));
      var p = MQ.Gen.make(lv, { skill: skill, recent: recent, R: opt.R });
      if (opt.choices && opt.choices < 4) {
        // 어둠의 회랑: 보기를 줄인다(정답은 항상 남긴다)
        var keep = [p.answer], pool = [];
        for (var j = 0; j < p.shuffled.length; j++) if (p.shuffled[j] !== p.answer) pool.push(p.shuffled[j]);
        while (keep.length < opt.choices && pool.length) keep.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        p.shuffled = MQ.R.shuffle(keep);
      }
      return p;
    },

    /* 결과 한 건 기록 */
    record: function (S, rec) {
      S.recent.push(rec);
      while (S.recent.length > KEEP) S.recent.shift();
    },

    /* 최근 성적 요약 */
    summary: function (S) {
      var n = Math.min(WINDOW, S.recent.length);
      if (!n) return { n: 0, acc: 0, fast: 0 };
      var ok = 0, ratio = 0;
      for (var i = S.recent.length - n; i < S.recent.length; i++) {
        var r = S.recent[i];
        if (r.ok) ok++;
        ratio += Math.min(2, (r.ms || 8000) / ((r.limit || 20) * 1000));
      }
      return { n: n, acc: ok / n, fast: ratio / n };   // fast 가 작을수록 빨리 푼 것
    },

    /* 난이도 자동 조절 — 전투가 끝날 때, 그리고 5문제마다 부른다 */
    update: function (S, baseline) {
      var s = D.summary(S);
      if (s.n < 6) return 0;

      var acc = s.acc, delta = 0;
      if (acc >= 0.95) delta = s.fast < 0.45 ? 3 : 2;        // 아주 잘 맞히고 빠르다 → 크게 올린다
      else if (acc >= 0.85) delta = s.fast < 0.55 ? 2 : 1;
      else if (acc >= 0.72) delta = 0;                       // 딱 좋은 구간 → 유지
      else if (acc >= 0.55) delta = -1;
      else if (acc >= 0.4) delta = -2;
      else delta = -3;

      // 너무 오래 걸리면(시간에 쫓기면) 정답률이 높아도 조금만 올린다
      if (s.fast > 0.8 && delta > 1) delta = 1;

      var before = S.diff;
      S.diff = Math.max(1, Math.min(100, S.diff + delta));

      // 지역 기준선에서 너무 멀어지지 않게 (지역이 곧 이야기의 난이도다)
      if (baseline != null) {
        var lo = Math.max(1, baseline - 24), hi = Math.min(100, baseline + 22);
        S.diff = Math.max(lo, Math.min(hi, S.diff));
      }
      return S.diff - before;
    },

    /* 실력측정 결과 → 시작 난이도 */
    fromAssess: function (results) {
      // results: [true/false, ...] ASSESS 와 같은 순서
      var last = -1;
      for (var i = 0; i < results.length; i++) if (results[i]) last = i;
      var ok = 0;
      for (var j = 0; j < results.length; j++) if (results[j]) ok++;
      if (last < 0) return 3;                       // 다 틀림 → 아주 쉬운 곳부터
      var base = D.ASSESS[last];
      if (ok === results.length) base += 8;         // 다 맞음 → 조금 더 위에서 시작
      else if (ok >= results.length - 1) base += 3;
      return Math.max(3, Math.min(80, Math.round(base)));
    },

    /* 부모 대시보드용 — 분야별 정답률 */
    report: function (S) {
      var out = [], ids = MQ.SKILL_IDS;
      for (var i = 0; i < ids.length; i++) {
        var k = ids[i], b = (S.stats.bySkill && S.stats.bySkill[k]) || { n: 0, ok: 0, ms: 0 };
        out.push({
          skill: k, name: MQ.SKILLS[k].name, icon: MQ.SKILLS[k].icon, color: MQ.SKILLS[k].color,
          n: b.n || 0, ok: b.ok || 0, acc: b.n ? b.ok / b.n : 0,
          avgSec: b.n ? (b.ms || 0) / b.n / 1000 : 0, lv: S.skillLv[k] || 1
        });
      }
      return out;
    },

    /* 부모 대시보드용 — 유형별(약한 순) */
    weakTypes: function (S, n) {
      var out = [], t = S.stats.byType || {};
      for (var id in t) {
        var v = t[id];
        if (!v.n || v.n < 4) continue;
        var meta = MQ.Gen.types[id];
        out.push({ id: id, name: meta ? meta.name : id, icon: meta ? meta.icon : '❓', n: v.n, ok: v.ok, acc: v.ok / v.n });
      }
      out.sort(function (a, b) { return a.acc - b.acc; });
      return out.slice(0, n || 6);
    }
  };
})();
