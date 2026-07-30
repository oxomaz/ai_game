/* ===========================================================
   Tiny World - js/events.js
   작은 랜덤 사건. 손해는 없고, 발견하면 반가운 보너스만 준다.
   =========================================================== */
window.TW = window.TW || {};
TW.Events = (function () {
  var next = 40 + Math.random() * 30;
  var rainT = 0;

  function freeTileNear(px, py, radius, wantRegion) {
    var tries = 0;
    while (tries < 300) {
      tries++;
      var x = Math.round(px + (Math.random() * 2 - 1) * radius);
      var y = Math.round(py + (Math.random() * 2 - 1) * radius);
      if (!TW.Map.inBounds(x, y)) continue;
      var r = TW.regionAt(x, y);
      if (wantRegion && r !== wantRegion) continue;
      if (TW.Map.regionLocked(x, y)) continue;
      var t = TW.terrainAt(x, y);
      if (t === 'water' || t === 'ocean' || t === 'path' || t === 'sand') continue;
      if (TW.Map.nodeAt(x, y) || TW.Map.buildingAt(x, y) || TW.Map.isWorldTree(x, y)) continue;
      if (Math.floor(TW.state.pos.x) === x && Math.floor(TW.state.pos.y) === y) continue;
      return { x: x, y: y };
    }
    return null;
  }

  function spawnTemp(type, count, life) {
    var made = 0, p = TW.state.pos;
    for (var i = 0; i < count; i++) {
      var spot = freeTileNear(p.x, p.y, 7);
      if (!spot) continue;
      var n = {
        id: 100000 + Math.floor(Math.random() * 800000),
        t: type, x: spot.x, y: spot.y, hp: TW.NODES[type].hp, rt: 0, exp: life
      };
      TW.state.nodes.push(n);
      TW.FX.burst(spot.x + 0.5, spot.y + 0.5, '#fff3a8', 12);
      made++;
    }
    return made;
  }

  var LIST = [
    { key: 'gold', weight: 3, run: function () {
        if (!spawnTemp('goldtree', 1, 80)) return false;
        TW.UI.eventBanner('황금빛 나무가 나타났어!', '🌟', '반짝이는 나무를 찾아 캐 보자');
        return true;
      } },
    { key: 'rainbow', weight: 3, run: function () {
        if (!spawnTemp('rainbowf', 3, 90)) return false;
        TW.UI.eventBanner('무지개가 떴어!', '🌈', '희귀한 무지개꽃이 피어났어');
        return true;
      } },
    { key: 'meteor', weight: 2, run: function () {
        if (!spawnTemp('starrock', 1, 120)) return false;
        TW.UI.eventBanner('유성이 떨어졌어!', '☄️', '별돌은 세계수가 아주 좋아해');
        TW.FX.shake(4);
        return true;
      } },
    { key: 'chest', weight: 3, run: function () {
        if (!spawnTemp('chest', 1, 100)) return false;
        TW.UI.eventBanner('보물상자를 발견했어!', '🎁', '섬 어딘가에 상자가 나타났어');
        return true;
      } },
    { key: 'rain', weight: 3, run: function () {
        rainT = 50;
        TW.UI.eventBanner('비가 내려!', '🌧️', '텃밭이 두 배로 빨리 자라');
        TW.Audio.play('rain');
        return true;
      } },
    { key: 'gift', weight: 3, run: function () {
        var friends = TW.SPIRIT_ORDER.filter(function (k) { return TW.state.spirits[k].friend; });
        if (!friends.length) return false;
        var k = friends[Math.floor(Math.random() * friends.length)];
        var pool = ['wood', 'stone', 'berry', 'flower', 'seed', 'mushroom'];
        var item = pool[Math.floor(Math.random() * pool.length)];
        var qty = 2 + Math.floor(Math.random() * 3);
        TW.Inv.add(item, qty);
        TW.Spirits.gainBond(k, 2);
        TW.UI.eventBanner(TW.SPIRITS[k].name + '이 선물을 가져왔어!', TW.SPIRITS[k].icon,
          TW.ITEMS[item].icon + ' ' + TW.ITEMS[item].name + ' ' + qty + '개');
        TW.Audio.play('get');
        return true;
      } }
  ];

  function pick() {
    var total = 0;
    LIST.forEach(function (e) { total += e.weight; });
    var r = Math.random() * total;
    for (var i = 0; i < LIST.length; i++) {
      r -= LIST[i].weight;
      if (r <= 0) return LIST[i];
    }
    return LIST[0];
  }

  function update(dt) {
    if (rainT > 0) rainT -= dt;
    /* 임시 자원 만료 */
    var ns = TW.state.nodes;
    for (var i = ns.length - 1; i >= 0; i--) {
      if (ns[i].exp) {
        ns[i].exp -= dt;
        if (ns[i].exp <= 0) ns.splice(i, 1);
      }
    }
    /* 다음 사건 */
    next -= dt;
    if (next <= 0) {
      next = 55 + Math.random() * 55;
      for (var tries = 0; tries < 4; tries++) {
        var ev = pick();
        if (ev.run()) { TW.state.counters.events++; TW.Audio.play('event'); break; }
      }
    }
  }

  return {
    update: update,
    raining: function () { return rainT > 0; },
    rainLeft: function () { return Math.max(0, Math.ceil(rainT)); },
    forceNext: function () { next = 0.1; }
  };
})();
