/* ===========================================================
   Tiny World - js/crafting.js
   제작. 작업대 옆에서만 도구를 만들 수 있다.
   불씨 정령이 일하고 있으면 제작이 훨씬 빠르다.
   =========================================================== */
window.TW = window.TW || {};
TW.Craft = (function () {
  var active = null;   /* {id, t, dur} */

  /* 근처에 특정 건물이 있는지 */
  function nearBuilding(type) {
    var p = TW.state.pos;
    return TW.state.buildings.some(function (b) {
      if (b.type !== type) return false;
      var dx = (b.x + 0.5) - p.x, dy = (b.y + 0.5) - p.y;
      return Math.sqrt(dx * dx + dy * dy) <= 2.0;
    });
  }

  function canMake(r) {
    if (r.need && !nearBuilding(r.need)) return { ok: false, why: TW.BUILDINGS[r.need].name + ' 옆으로 가자!' };
    if (!TW.Inv.hasAll(r.cost)) return { ok: false, why: '재료가 부족해' };
    if (r.out && TW.ITEMS[r.out].cat === 'tool' && TW.state.tools[r.out]) return { ok: false, why: '이미 가지고 있어' };
    if (active) return { ok: false, why: '만들고 있어…' };
    return { ok: true };
  }

  function start(id) {
    var r = TW.RECIPE_BY_ID[id];
    if (!r) return false;
    var c = canMake(r);
    if (!c.ok) { TW.Audio.play('error'); TW.UI.toast(c.why, '🙃'); return false; }
    TW.Inv.payAll(r.cost);
    var speed = TW.Spirits.craftSpeed();      /* 불씨 정령 효과 */
    active = { id: id, t: 0, dur: Math.max(0.25, r.time * speed) };
    TW.Audio.play('open');
    TW.UI.renderPanel();
    return true;
  }

  function update(dt) {
    if (!active) return;
    active.t += dt;
    if (active.t >= active.dur) {
      var r = TW.RECIPE_BY_ID[active.id];
      active = null;
      TW.Inv.add(r.out, r.qty);
      TW.state.counters.crafted++;
      TW.Player.addXp(TW.state, r.xp);
      TW.Audio.play('craft');
      var p = TW.state.pos;
      TW.FX.floatText(p.x, p.y - 1, TW.ITEMS[r.out].icon + ' ' + TW.ITEMS[r.out].name + ' 완성!', '#ffe98a', true);
      TW.FX.burst(p.x, p.y - 0.5, '#ffe066', 16);
      TW.Spirits.gainBondNearby(1);
      TW.Quests.check();
      TW.UI.syncHud();
      TW.UI.renderPanel();
    } else {
      if (TW.UI.currentPanel() === 'craft') TW.UI.updateCraftBar(active.t / active.dur);
    }
  }

  return {
    start: start, update: update, canMake: canMake, nearBuilding: nearBuilding,
    activeCraft: function () { return active; }
  };
})();
