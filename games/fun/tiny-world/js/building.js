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
    /* 그 사이 지형이 바뀌었을 수도 있으니 마지막으로 한 번 더 계산한다 */
    TW.Map.invalidateChoke();
    if (!TW.Map.canBuild(x, y)) {
      TW.Audio.play('error');
      /* 왜 안 되는지 알려 준다 */
      if (TW.Map.isChokePoint(x, y)) {
        TW.UI.toast('여기에 지으면 길이 막혀! 다른 곳에 지어 보자.', '🚧');
      } else {
        TW.UI.toast('여기엔 지을 수 없어. 빈 땅을 골라 봐!', '🚧');
      }
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
    TW.Map.invalidateChoke();
    TW.Quests.check();
    TW.UI.syncHud();
    return true;
  }

  /* ---------- 건물 부수기 (재료는 전부 돌려준다) ----------
     실수로 지었거나, 예전 판에서 건물에 둘러싸여 갇혔을 때 빠져나오는 길. */
  function demolish(id) {
    var s = TW.state;
    var i = -1;
    for (var k = 0; k < s.buildings.length; k++) if (s.buildings[k].id === id) { i = k; break; }
    if (i < 0) return false;
    var b = s.buildings[i], def = TW.BUILDINGS[b.type];

    /* 정령이 일하던 건물이면 일자리를 비워 준다 */
    Object.keys(s.spirits).forEach(function (key) {
      if (s.spirits[key].job === b.id) s.spirits[key].job = null;
    });

    s.buildings.splice(i, 1);
    Object.keys(def.cost).forEach(function (item) { TW.Inv.add(item, def.cost[item]); });

    TW.Audio.play('build');
    TW.FX.burst(b.x + 0.5, b.y + 0.5, '#d9cdb4', 16);
    TW.FX.floatText(b.x + 0.5, b.y - 0.2, def.name + ' 정리! 재료를 돌려받았어', '#ffe98a', true);
    TW.Map.invalidateChoke();
    TW.UI.toast(def.icon + ' ' + def.name + ' 을 부수고 재료를 돌려받았어!', '🧰');
    TW.UI.syncHud();
    return true;
  }

  /* ---------- 갇혔는지 확인하고 도와주기 ----------
     예전 판에서 이미 갇힌 채로 저장된 경우를 위한 안전장치. */
  function trapped() {
    return TW.Map.reachableCount(14) < 12;
  }

  /* 갇혔으면 주변 건물을 하나 부숴서 길을 연다. 건물이 없으면 밖으로 옮겨 준다. */
  function rescue() {
    var s = TW.state;
    var px = Math.floor(s.pos.x), py = Math.floor(s.pos.y);
    var best = null, bd = 1e9;
    s.buildings.forEach(function (b) {
      var d = Math.abs(b.x - px) + Math.abs(b.y - py);
      if (d < bd) { bd = d; best = b; }
    });
    if (best && bd <= 3) { demolish(best.id); return 'demolish'; }
    var spot = TW.Map.nearestOpenOutside();
    if (spot) {
      s.pos.x = spot.x; s.pos.y = spot.y;
      TW.Map.invalidateChoke();
      TW.FX.burst(spot.x, spot.y, '#a8e6ff', 18);
      TW.UI.toast('밖으로 데려왔어! 이제 다시 돌아다닐 수 있어.', '🚪');
      return 'move';
    }
    return null;
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
  api.demolish = demolish;
  api.trapped = trapped;
  api.rescue = rescue;
  return api;
})();
