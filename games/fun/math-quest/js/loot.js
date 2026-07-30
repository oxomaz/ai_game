/* =====================================================================
 * loot.js — 보상 · 상자 · 희귀도 뽑기
 * ---------------------------------------------------------------------
 * 희귀도는 가중치(MQ.RARITY[].w)로 뽑는다.
 * 플레이어 레벨이 높을수록 좋은 게 나올 확률이 조금씩 오른다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  var L = MQ.Loot = {

    /* 희귀도 하나 뽑기. luck 이 크면 좋은 게 잘 나온다. minRar 는 최소 등급 보장 */
    rollRarity: function (lv, luck, minRar) {
      luck = luck || 1;
      var w = [], total = 0, i;
      for (i = 0; i < MQ.RARITY.length; i++) {
        if (minRar != null && i < minRar) { w.push(0); continue; }
        var bonus = 1 + (i > 0 ? (lv / 100) * i * 0.8 : 0);      // 레벨이 오르면 상위 등급 가중치 상승
        var v = MQ.RARITY[i].w * bonus * (i > 0 ? luck : 1);
        w.push(v); total += v;
      }
      var r = Math.random() * total;
      for (i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
      return minRar || 0;
    },

    /* 아이템 하나 뽑기 */
    rollItem: function (S, opt) {
      opt = opt || {};
      var rar = L.rollRarity(S.lv, opt.luck || 1, opt.minRar);
      var pool = [], i;
      for (i = 0; i < MQ.ITEMS.length; i++) if (MQ.ITEMS[i].rar === rar) pool.push(MQ.ITEMS[i]);
      // 그 등급이 비었으면 한 칸 아래로
      while (!pool.length && rar > 0) {
        rar--;
        for (i = 0; i < MQ.ITEMS.length; i++) if (MQ.ITEMS[i].rar === rar) pool.push(MQ.ITEMS[i]);
      }
      if (!pool.length) pool = MQ.ITEMS;

      // 아직 못 얻은 것을 조금 더 잘 뽑아준다(도감 채우는 재미)
      var fresh = [];
      for (i = 0; i < pool.length; i++) if (!S.inv.owned[pool[i].id]) fresh.push(pool[i]);
      var use = (fresh.length && Math.random() < 0.75) ? fresh : pool;
      return use[Math.floor(Math.random() * use.length)];
    },

    /* 상자 열기 → 결과 객체 */
    openChest: function (S, opt) {
      opt = opt || {};
      opt.luck = (opt.luck || 1) * (1 + (S.perks ? S.perks.luck * 0.06 : 0));
      var it = L.rollItem(S, opt);
      var got = MQ.P.gain(S, it.id);
      S.stats.chests = (S.stats.chests || 0) + 1;
      MQ.Snd.play(it.rar >= 2 ? 'rare' : 'item');
      return { item: it, dup: got.dup, rar: MQ.RARITY[it.rar] };
    },

    /* 전투 승리 보상 계산 */
    battleReward: function (S, ctx) {
      var mult = ctx.mult || 1;
      var g = MQ.P.gear(S);
      var exp = Math.round((14 + S.diff * 1.1) * mult * (ctx.expMod || 1) * g.exp);
      var gold = Math.round((9 + S.diff * 0.8) * mult * (ctx.goldMod || 1) * g.gold);
      var out = { exp: exp, gold: gold, gem: 0, chests: 0 };
      var chance = (ctx.dropMod || 1) * (ctx.boss ? 1 : 0.34);
      if (ctx.boss) out.chests = 1 + (Math.random() < 0.5 ? 1 : 0);
      if (Math.random() < chance) out.chests++;
      if (ctx.boss) out.gem = 1 + Math.floor(Math.random() * 2);
      else if (Math.random() < 0.05) out.gem = 1;
      if (ctx.perfect) { out.exp = Math.round(out.exp * 1.3); out.chests++; }
      return out;
    }
  };
})();
