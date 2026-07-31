/* ===========================================================
   Tiny World - js/gathering.js
   채집. 버튼을 누르면 바로 반응하고, 도구가 좋으면 더 많이 나온다.
   =========================================================== */
window.TW = window.TW || {};
TW.Gather = (function () {
  var cd = 0;                 /* 다음 채집까지 남은 시간 */
  var api = { acting: false, shakeId: 0 };

  function update(dt) {
    if (cd > 0) {
      cd -= dt;
      if (cd <= 0) { api.acting = false; api.shakeId = 0; }
    }
  }

  function toolBonus(def) {
    if (!def.tool) return { amount: 0, speed: 1 };
    var tier = TW.Inv.toolTier(def.tool);
    if (tier <= 0) return { amount: 0, speed: 1 };
    if (tier === 1) return { amount: 1, speed: 0.8 };
    return { amount: 2, speed: 0.6 };
  }

  function gather(node) {
    if (cd > 0) return false;
    var s = TW.state, def = TW.NODES[node.t];

    /* 아직 열리지 않은 지역의 자원은 캘 수 없다.
       (안개 너머로 손만 뻗어 캐지던 문제) */
    var lockR = TW.Map.regionLocked(node.x, node.y);
    if (lockR) {
      TW.Audio.play('error');
      TW.UI.toast(TW.REGIONS[lockR].name + '은 세계수가 ' + TW.REGIONS[lockR].lock +
        '단계가 되면 열려!', '🔒');
      return false;
    }

    /* 도구 등급 확인 */
    if (def.minTier > 0 && TW.Inv.toolTier(def.tool) < def.minTier) {
      TW.Audio.play('error');
      TW.UI.toast(def.lockMsg || '더 좋은 도구가 필요해!', '🔒');
      return false;
    }
    /* 활동력 */
    var cost = node.t === 'water' ? 0 : 1;
    if (cost > 0 && s.energy < cost) {
      TW.Audio.play('error');
      TW.UI.toast('활동력이 없어! 집에서 쉬거나 열매를 먹자.', '😮‍💨');
      return false;
    }
    if (cost > 0) s.energy -= cost;

    var bonus = toolBonus(def);
    api.acting = true;
    api.shakeId = node.id;
    cd = 0.3 * bonus.speed;

    /* 소리 */
    if (def.tool === 'axe') TW.Audio.play('chop');
    else if (def.tool === 'pick') TW.Audio.play('mine');
    else TW.Audio.play('pick');

    /* 획득 */
    var gained = [];
    def.drops.forEach(function (d) {
      if (d.chance !== undefined && Math.random() > d.chance) return;
      var base = d.min + Math.floor(Math.random() * (d.max - d.min + 1));
      var qty = base + (d.item === def.drops[0].item ? bonus.amount : 0);
      var got = TW.Inv.add(d.item, qty);
      if (got > 0) gained.push({ item: d.item, qty: got });
    });

    /* 경험치 · 카운터 */
    TW.state.codex.nodes[node.t] = true;
    s.counters.gather_all++;
    if (node.t === 'tree' || node.t === 'goldtree') s.counters.gather_tree++;
    if (node.t === 'rock' || node.t === 'iron' || node.t === 'starrock') s.counters.gather_stone++;
    TW.Player.addXp(s, def.xp);

    /* 연출 */
    var fx = node.x + 0.5, fy = node.y + 0.2;
    gained.forEach(function (g, i) {
      TW.FX.floatText(fx, fy - i * 0.35, TW.ITEMS[g.item].icon + ' +' + g.qty, '#fff8d6');
    });
    TW.FX.floatText(fx + 0.5, fy + 0.3, '+' + def.xp, '#b8f2a0');
    TW.FX.burst(fx, node.y + 0.5, node.t === 'rock' || node.t === 'iron' ? '#cfd6dd' : '#a8e6a1', 7);

    /* 자원 소모 */
    if (def.respawn !== 0 || def.hp < 90) {
      if (node.t !== 'water') {
        node.hp--;
        if (node.hp <= 0) {
          node.rt = def.respawn > 0 ? def.respawn : 0.01;
          TW.FX.burst(fx, node.y + 0.5, '#ffe066', 12);
        }
      }
    }

    /* 정령 친밀도: 함께 있으면 조금씩 오른다 */
    TW.Spirits.gainBondNearby(0.4);

    TW.Quests.check();
    TW.UI.syncHud();
    return true;
  }

  api.update = update;
  api.gather = gather;
  api.cooldown = function () { return cd; };
  return api;
})();
