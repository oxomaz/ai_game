/* ===========================================================
   Tiny World - js/building.js
   건설(빈 타일 고르기) · 건물 기능 · 텃밭 성장
   =========================================================== */
window.TW = window.TW || {};
TW.Building = (function () {
  var api = { placing: null };

  function unlocked(type) { return TW.state.level >= TW.BUILDINGS[type].lvl; }

  function beginPlace(type) {
    if (!unlocked(type)) {
      TW.Audio.play('error');
      TW.UI.toast('레벨 ' + TW.BUILDINGS[type].lvl + '이 되면 지을 수 있어!', '🔒');
      return;
    }
    if (!TW.Inv.hasAll(TW.BUILDINGS[type].cost)) {
      TW.Audio.play('error');
      TW.UI.toast('재료가 부족해!', '🙃');
      return;
    }
    api.placing = type;
    TW.UI.closePanel();
    TW.UI.showPlaceBar(type);
    TW.Audio.play('open');
  }

  function cancelPlace() {
    api.placing = null;
    TW.UI.hidePlaceBar();
  }

  function place(x, y) {
    var type = api.placing;
    if (!type) return false;
    if (!TW.Map.canBuild(x, y)) {
      TW.Audio.play('error');
      TW.UI.toast('여기엔 지을 수 없어. 빈 땅을 골라 봐!', '🚧');
      return false;
    }
    var def = TW.BUILDINGS[type];
    if (!TW.Inv.payAll(def.cost)) {
      TW.Audio.play('error');
      TW.UI.toast('재료가 부족해!', '🙃');
      cancelPlace();
      return false;
    }
    var s = TW.state;
    var b = { id: s.nextBuildingId++, type: type, x: x, y: y, data: {} };
    if (type === 'farm') b.data = { state: 'empty', t: 0, watered: false, grown: false };
    if (type === 'house') b.data = { restCd: 0 };
    s.buildings.push(b);
    s.counters.built++;
    s.counters['built_' + type] = (s.counters['built_' + type] || 0) + 1;
    s.codex.buildings[type] = true;

    TW.Audio.play('build');
    TW.FX.burst(x + 0.5, y + 0.5, '#ffd166', 18);
    TW.FX.floatText(x + 0.5, y - 0.2, def.icon + ' ' + def.name + ' 완성!', '#ffe98a', true);
    TW.FX.shake(3);
    TW.Player.addXp(s, def.xp);
    if (def.energy) TW.WorldTree.addEnergy(def.energy, '건물 완성');
    cancelPlace();
    TW.Quests.check();
    TW.UI.syncHud();
    return true;
  }

  /* ---------- 건물 사용 ---------- */
  function use(b) {
    var s = TW.state;
    if (b.type === 'house') {
      if (s.energy >= s.energyMax) { TW.UI.toast('힘이 가득해! 신나게 탐험하자.', '💪'); return; }
      s.energy = s.energyMax;
      TW.Audio.play('heal');
      TW.FX.floatText(b.x + 0.5, b.y - 0.2, '활동력 가득! 💚', '#7ed957', true);
      TW.FX.burst(b.x + 0.5, b.y + 0.3, '#a8f0b0', 14);
      TW.UI.syncHud();
      return;
    }
    if (b.type === 'workbench') { TW.UI.openPanel('craft'); return; }
    if (b.type === 'storage') { TW.UI.openPanel('inv'); return; }
    if (b.type === 'nest') { TW.UI.openPanel('spirits'); return; }
    if (b.type === 'farm') { useFarm(b); return; }
  }

  function useFarm(b) {
    var d = b.data;
    if (d.state === 'empty') {
      if (!TW.Inv.has('seed', 1)) {
        TW.Audio.play('error');
        TW.UI.toast('씨앗이 없어! 풀을 캐면 나올 때가 있어.', '🌱');
        return;
      }
      TW.Inv.remove('seed', 1);
      d.state = 'planted'; d.t = 0; d.watered = false; d.grown = false;
      TW.state.counters.planted++;
      TW.Audio.play('plant');
      TW.FX.floatText(b.x + 0.5, b.y - 0.2, '🌱 씨앗을 심었어!', '#b8f2a0');
      TW.Player.addXp(TW.state, 5);
      TW.Quests.check();
      return;
    }
    if (d.grown) {
      var qty = 2 + Math.floor(Math.random() * 2);
      TW.Inv.add('berry', qty);
      if (Math.random() < 0.5) TW.Inv.add('seed', 1);
      d.state = 'empty'; d.t = 0; d.watered = false; d.grown = false;
      TW.state.counters.harvested++;
      TW.Audio.play('get');
      TW.FX.floatText(b.x + 0.5, b.y - 0.2, '🍓 +' + qty + ' 수확!', '#ffd0d8', true);
      TW.FX.burst(b.x + 0.5, b.y + 0.3, '#ff9ecd', 12);
      TW.Player.addXp(TW.state, 12);
      TW.Spirits.gainBondNearby(1);
      TW.Quests.check();
      return;
    }
    if (!d.watered) {
      if (!TW.Inv.has('water', 1)) {
        TW.Audio.play('error');
        TW.UI.toast('물이 없어! 연못에서 물을 퍼 오자.', '💧');
        return;
      }
      TW.Inv.remove('water', 1);
      d.watered = true;
      TW.state.counters.water_given++;
      TW.Audio.play('watering');
      TW.FX.floatText(b.x + 0.5, b.y - 0.2, '💧 물을 줬어!', '#bfeaff');
      TW.FX.burst(b.x + 0.5, b.y + 0.3, '#8ad7ff', 10);
      TW.Player.addXp(TW.state, 4);
      TW.Quests.check();
      return;
    }
    var left = Math.max(1, Math.ceil((TW.FARM_GROW - d.t)));
    TW.UI.toast('자라고 있어! ' + left + '초쯤 더 기다려 줘.', '🌾');
  }

  /* ---------- 텃밭 성장 ---------- */
  function update(dt) {
    var speed = TW.Spirits.farmSpeed() * (TW.Events.raining() ? 2 : 1);
    TW.state.buildings.forEach(function (b) {
      if (b.type !== 'farm') return;
      var d = b.data;
      if (!d || d.state === 'empty' || d.grown) return;
      d.t += dt * (d.watered ? speed : speed * 0.3);
      if (d.t >= TW.FARM_GROW) {
        d.grown = true; d.state = 'ready';
        TW.FX.floatText(b.x + 0.5, b.y - 0.3, '✨ 다 자랐어!', '#ffe98a');
        TW.Audio.play('event');
      }
    });
  }

  api.beginPlace = beginPlace;
  api.cancelPlace = cancelPlace;
  api.place = place;
  api.use = use;
  api.update = update;
  api.unlocked = unlocked;
  return api;
})();
