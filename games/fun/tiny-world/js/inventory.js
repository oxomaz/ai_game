/* ===========================================================
   Tiny World - js/inventory.js
   가방. 종류별로 자동 정리되므로 옮기는 조작이 필요 없다.
   =========================================================== */
window.TW = window.TW || {};
TW.Inv = (function () {

  function count(item) { return TW.state.inv[item] || 0; }

  function total() {
    var s = TW.state, sum = 0;
    Object.keys(s.inv).forEach(function (k) {
      if (TW.ITEMS[k] && TW.ITEMS[k].cat !== 'tool') sum += s.inv[k];
    });
    return sum;
  }

  function space() { return Math.max(0, TW.Player.invCap(TW.state) - total()); }

  /* 넣을 수 있는 만큼만 넣고, 실제로 넣은 개수를 돌려준다 */
  function add(item, qty) {
    var s = TW.state;
    if (!TW.ITEMS[item]) return 0;
    if (TW.ITEMS[item].cat === 'tool') { s.tools[item] = true; discover(item); return 1; }
    var can = Math.min(qty, space());
    if (can <= 0) {
      TW.UI.toast('가방이 꽉 찼어! 창고를 지어 볼까?', '📦');
      return 0;
    }
    s.inv[item] = (s.inv[item] || 0) + can;
    discover(item);
    if (item === 'wood') s.counters.got_wood += can;
    if (item === 'stone') s.counters.got_stone += can;
    if (item === 'iron') s.counters.got_iron += can;
    return can;
  }

  function has(item, qty) { return count(item) >= qty; }

  function hasAll(costObj) {
    return Object.keys(costObj).every(function (k) { return count(k) >= costObj[k]; });
  }

  function remove(item, qty) {
    var s = TW.state;
    if (count(item) < qty) return false;
    s.inv[item] -= qty;
    if (s.inv[item] <= 0) delete s.inv[item];
    return true;
  }

  function payAll(costObj) {
    if (!hasAll(costObj)) return false;
    Object.keys(costObj).forEach(function (k) { remove(k, costObj[k]); });
    return true;
  }

  function discover(item) {
    var s = TW.state;
    if (!s.codex.items[item]) {
      s.codex.items[item] = true;
      if (TW.ITEMS[item] && TW.ITEMS[item].cat === 'special') {
        TW.UI.toast('도감에 새 항목! ' + TW.ITEMS[item].icon + ' ' + TW.ITEMS[item].name, '📖');
      }
    }
  }

  function eat(item) {
    var heal = TW.EDIBLE[item];
    if (!heal || !has(item, 1)) return false;
    var s = TW.state;
    if (s.energy >= s.energyMax) { TW.UI.toast('지금은 힘이 넘쳐! 나중에 먹자.', '💪'); return false; }
    remove(item, 1);
    s.energy = Math.min(s.energyMax, s.energy + heal);
    TW.Audio.play('heal');
    TW.FX.floatText(TW.state.pos.x, TW.state.pos.y - 0.6, '+' + heal + ' 활동력', '#7ed957');
    TW.UI.syncHud();
    TW.UI.renderPanel();
    return true;
  }

  /* 지금 들고 있는 가장 좋은 도구 (kind: 'axe' | 'pick') */
  function bestTool(kind) {
    var best = null;
    Object.keys(TW.state.tools).forEach(function (id) {
      var it = TW.ITEMS[id];
      if (it && it.kind === kind) { if (!best || it.tier > TW.ITEMS[best].tier) best = id; }
    });
    return best;
  }
  function toolTier(kind) {
    var b = bestTool(kind);
    return b ? TW.ITEMS[b].tier : 0;
  }

  return {
    count: count, add: add, remove: remove, has: has, hasAll: hasAll,
    payAll: payAll, total: total, space: space, discover: discover,
    eat: eat, bestTool: bestTool, toolTier: toolTier
  };
})();
