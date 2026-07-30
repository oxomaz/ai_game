/* ===========================================================
   Tiny World - data/recipes.js
   제작법. cost 는 {아이템: 개수}, need 는 필요한 건물.
   =========================================================== */
window.TW = window.TW || {};

TW.RECIPES = [
  { id: 'axe_wood',   out: 'axe_wood',   qty: 1, cost: { wood: 5, stone: 2 },  need: 'workbench',
    time: 1.0, xp: 8,  effect: '나무 채집 +1개, 조금 더 빠르게' },
  { id: 'pick_wood',  out: 'pick_wood',  qty: 1, cost: { wood: 4, stone: 3 },  need: 'workbench',
    time: 1.0, xp: 8,  effect: '돌 채집 +1개, 조금 더 빠르게' },
  { id: 'axe_stone',  out: 'axe_stone',  qty: 1, cost: { wood: 4, stone: 8 },  need: 'workbench',
    time: 1.4, xp: 16, effect: '나무 채집 +2개, 많이 빠르게' },
  { id: 'pick_stone', out: 'pick_stone', qty: 1, cost: { wood: 4, stone: 10 }, need: 'workbench',
    time: 1.4, xp: 16, effect: '돌 +2개, 철광석 캐기 가능!' },
  { id: 'seed',       out: 'seed',       qty: 1, cost: { grass: 3 },           need: null,
    time: 0.6, xp: 3,  effect: '텃밭에 심을 씨앗 만들기' }
];

TW.RECIPE_BY_ID = {};
TW.RECIPES.forEach(function (r) { TW.RECIPE_BY_ID[r.id] = r; });
