/* ===========================================================
   Tiny World - js/worldTree.js
   세계수. 이 게임에서 가장 큰 목표이자 가장 큰 보상.
   =========================================================== */
window.TW = window.TW || {};
TW.WorldTree = (function () {

  var NEED = [0, 8, 26, 58];       /* 2·3·4단계가 되는 데 필요한 누적 에너지 */
  var STAGE_NAME = ['', '씨앗', '작은 새싹', '어린 나무', '빛나는 나무'];
  var UNLOCK = { 2: 'forest', 3: 'hill', 4: 'mist' };

  function needFor(stage) { return NEED[stage] || 0; }
  function nextNeed() { return TW.state.tree.stage >= 4 ? 0 : NEED[TW.state.tree.stage]; }

  function addEnergy(n, reason) {
    var s = TW.state;
    s.tree.energy += n;
    s.counters.tree_energy += n;
    var T = TW.MAP.tree;
    TW.FX.floatText(T.x + 0.5, T.y - 0.5, '🌟 에너지 +' + n, '#ffe98a');
    checkGrow();
    TW.Quests.check();
    TW.UI.syncHud();
  }

  function checkGrow() {
    var s = TW.state, grew = false;
    while (s.tree.stage < 4 && s.tree.energy >= NEED[s.tree.stage]) {
      s.tree.stage++;
      grew = true;
      var rk = UNLOCK[s.tree.stage];
      if (rk) s.regions[rk] = true;
      TW.UI.treeGrowScene(s.tree.stage, rk);
      TW.Audio.play('tree');
      TW.FX.shake(5);
      var T = TW.MAP.tree;
      TW.FX.burst(T.x + 0.5, T.y - 1, '#fff3a8', 40);
    }
    if (grew) {
      TW.Spirits.checkUnlock();
      TW.submitScore();
    }
  }

  /* 아이템을 바쳐 에너지를 얻는다 */
  function offer(item) {
    var rule = null;
    TW.OFFERINGS.forEach(function (o) { if (o.item === item) rule = o; });
    if (!rule) return false;
    if (!TW.Inv.has(item, rule.cost)) {
      TW.Audio.play('error');
      TW.UI.toast(TW.ITEMS[item].name + ' ' + rule.cost + '개가 필요해!', '🙃');
      return false;
    }
    TW.Inv.remove(item, rule.cost);
    TW.Audio.play('get');
    TW.Player.addXp(TW.state, 4);
    addEnergy(rule.energy, '봉헌');
    TW.Spirits.gainBondNearby(0.5);
    TW.UI.renderPanel();
    return true;
  }

  function stageName() { return STAGE_NAME[TW.state.tree.stage] || ''; }

  function progress() {
    var s = TW.state;
    if (s.tree.stage >= 4) return 1;
    var prev = NEED[s.tree.stage - 1] || 0;
    var need = NEED[s.tree.stage];
    return Math.max(0, Math.min(1, (s.tree.energy - prev) / (need - prev)));
  }

  return {
    addEnergy: addEnergy, offer: offer, checkGrow: checkGrow,
    stageName: stageName, progress: progress, nextNeed: nextNeed, needFor: needFor,
    STAGE_NAME: STAGE_NAME, UNLOCK: UNLOCK
  };
})();
