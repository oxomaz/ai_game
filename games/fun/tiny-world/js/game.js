/* ===========================================================
   Tiny World - js/game.js
   게임 루프 · 이동 · 상호작용 연결 · 자동 저장
   =========================================================== */
window.TW = window.TW || {};
TW.Game = (function () {
  var api = { walkPhase: 0, paused: true, target: null };
  var last = 0, acc = 0, saveAcc = 0, running = false;
  var RADIUS = 0.32;

  /* ---------- 시작/종료 ---------- */
  function newGame() {
    var name = '탐험가';
    try { if (window.JG && JG.player) name = JG.player().name || name; } catch (e) { }
    TW.state = TW.Player.newState(name);
    TW.Spirits.resetPositions();
    TW.FX.clear();
    TW.Audio.setOn(TW.state.settings.sound);
    enter();
    TW.UI.howto(true);
    TW.Save.save(TW.state);
  }

  function continueGame() {
    var s = TW.Save.load();
    if (!s) { newGame(); return; }
    TW.state = migrate(s);
    TW.Spirits.resetPositions();
    TW.FX.clear();
    TW.Audio.setOn(TW.state.settings.sound);
    enter();
    TW.UI.toast('돌아왔어! 이어서 놀아 보자.', '🏝️');
  }

  /* 예전 저장이 새 버전에서도 열리도록 빈 항목을 채운다 */
  function migrate(s) {
    var base = TW.Player.newState(s.name || '탐험가');
    Object.keys(base).forEach(function (k) {
      if (s[k] === undefined || s[k] === null) s[k] = base[k];
    });
    Object.keys(base.counters).forEach(function (k) {
      if (typeof s.counters[k] !== 'number') s.counters[k] = 0;
    });
    TW.SPIRIT_ORDER.forEach(function (k) {
      if (!s.spirits[k]) s.spirits[k] = base.spirits[k];
    });
    ['items', 'nodes', 'spirits', 'buildings'].forEach(function (k) {
      if (!s.codex[k]) s.codex[k] = {};
    });
    if (!s.nodes || !s.nodes.length) s.nodes = TW.generateNodes();
    if (!s.regions) s.regions = base.regions;
    if (!s.settings) s.settings = base.settings;
    if (!s.stats) s.stats = base.stats;
    if (!s.tutorial) s.tutorial = { done: true };
    if (!s.nextBuildingId) {
      s.nextBuildingId = 1;
      s.buildings.forEach(function (b) { if (b.id >= s.nextBuildingId) s.nextBuildingId = b.id + 1; });
    }
    return s;
  }

  function enter() {
    document.getElementById('title').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    TW.Map.resize();
    api.paused = false;
    TW.UI.syncHud();
    TW.UI.renderQuests();
    TW.Quests.check();
    if (!running) { running = true; last = 0; requestAnimationFrame(frame); }
  }

  function toTitle(skipSave) {
    if (TW.state && !skipSave) TW.Save.save(TW.state);
    api.paused = true;
    TW.UI.closePanel();
    TW.Building.cancelPlace();
    document.getElementById('game').classList.add('hidden');
    document.getElementById('title').classList.remove('hidden');
    TW.Main.refreshTitle();
  }

  /* ---------- 이동 ---------- */
  function canStand(x, y) {
    var pts = [
      [x - RADIUS, y - RADIUS], [x + RADIUS, y - RADIUS],
      [x - RADIUS, y + RADIUS], [x + RADIUS, y + RADIUS]
    ];
    for (var i = 0; i < 4; i++) {
      if (TW.Map.solidAt(Math.floor(pts[i][0]), Math.floor(pts[i][1]))) return false;
    }
    return true;
  }

  function move(dt) {
    var v = TW.Input.moveVector();
    var s = TW.state;
    if (v.x === 0 && v.y === 0) { api.walkPhase += dt * 0.0; return; }
    var len = Math.sqrt(v.x * v.x + v.y * v.y);
    var sp = s.speed * dt;
    var nx = s.pos.x + (v.x / len) * sp;
    var ny = s.pos.y + (v.y / len) * sp;

    if (canStand(nx, s.pos.y)) s.pos.x = nx;
    if (canStand(s.pos.x, ny)) s.pos.y = ny;

    /* 바라보는 방향 */
    if (Math.abs(v.x) > Math.abs(v.y)) s.dir = v.x > 0 ? 3 : 2;
    else if (v.y !== 0) s.dir = v.y > 0 ? 0 : 1;

    api.walkPhase += dt;

    /* 잠긴 지역 앞에서 안내 */
    var fx = Math.floor(s.pos.x + (v.x / len) * 0.6), fy = Math.floor(s.pos.y + (v.y / len) * 0.6);
    var lockR = TW.Map.regionLocked(fx, fy);
    if (lockR && !api._lockMsg) {
      api._lockMsg = 2.5;
      TW.UI.toast(TW.REGIONS[lockR].name + '은 세계수가 ' + TW.REGIONS[lockR].lock + '단계가 되면 열려!', '🔒');
    }
  }

  /* ---------- 상호작용 ---------- */
  function interact(t) {
    if (!t) return;
    if (t.kind === 'node') { TW.Gather.gather(t.extra); return; }
    if (t.kind === 'building') { TW.Building.use(t.extra); return; }
    if (t.kind === 'tree') { TW.Audio.play('open'); TW.UI.openPanel('tree'); return; }
    if (t.kind === 'spirit') { TW.Audio.play('spirit'); TW.UI.spiritDialog(t.extra); return; }
    if (t.kind === 'portal') {
      TW.Audio.play('event');
      TW.UI.eventBanner('다음 세계로 가는 문!', '🌀', '문 너머 이야기는 다음 모험에서 계속돼요');
      return;
    }
  }

  function targetLabel(t) {
    if (!t) return '';
    if (t.kind === 'node') {
      var def = TW.NODES[t.extra.t];
      if (def.minTier > 0 && TW.Inv.toolTier(def.tool) < def.minTier) return '🔒 ' + def.name;
      return def.icon + ' ' + def.name;
    }
    if (t.kind === 'building') {
      var b = TW.BUILDINGS[t.extra.type];
      if (t.extra.type === 'farm') {
        var d = t.extra.data || {};
        if (d.grown) return '✨ 수확하기';
        if (d.state === 'empty') return '🌱 씨앗 심기';
        if (!d.watered) return '💧 물 주기';
        return '🌾 자라는 중';
      }
      return b.icon + ' ' + b.action;
    }
    if (t.kind === 'tree') return '🌟 세계수';
    if (t.kind === 'spirit') return '❓ 말 걸기';
    if (t.kind === 'portal') return '🌀 신비한 문';
    return '';
  }

  /* ---------- 루프 ---------- */
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    if (!TW.state) return;

    var t = ts / 1000;
    if (!api.paused) {
      if (api._lockMsg) api._lockMsg = Math.max(0, api._lockMsg - dt);
      if (!TW.UI.currentPanel()) move(dt);
      TW.Player.regen(TW.state, dt);
      TW.Gather.update(dt);
      TW.Craft.update(dt);
      TW.Building.update(dt);
      TW.Spirits.update(dt, t);
      TW.Map.tickNodes(dt);
      TW.Events.update(dt);
      TW.FX.update(dt);
      TW.state.stats.play += dt;

      /* 버튼을 누른 채로 있으면 계속 채집 */
      if (TW.Input.isActionHeld() && !TW.UI.currentPanel() && !TW.Building.placing) {
        var tg = api.target;
        if (tg && tg.kind === 'node' && TW.Gather.cooldown() <= 0) TW.Gather.gather(tg.extra);
      }

      /* HUD 는 0.2초마다 갱신 */
      acc += dt;
      if (acc >= 0.2) { acc = 0; TW.UI.syncHud(); TW.UI.renderQuests(); }

      /* 자동 저장 */
      saveAcc += dt;
      if (saveAcc >= 10) { saveAcc = 0; TW.Save.save(TW.state); }
    }
    TW.Map.render(t);
  }

  api.newGame = newGame;
  api.continueGame = continueGame;
  api.toTitle = toTitle;
  api.interact = interact;
  api.targetLabel = targetLabel;
  api.migrate = migrate;
  return api;
})();

/* ---------- 섬 점수 & 온라인 기록 ---------- */
TW.islandScore = function () {
  var s = TW.state;
  if (!s) return 0;
  var pct = 0;
  try { pct = TW.UI.codexStats().pct; } catch (e) { }
  return s.tree.stage * 150 + s.level * 30 + TW.Spirits.countFriends() * 80 +
    s.buildings.length * 15 + TW.Quests.doneCount() * 20 + pct * 3;
};

TW._lastSubmit = 0;
TW.submitScore = function () {
  try {
    if (!window.JG || !TW.state) return;
    var score = TW.islandScore();
    if (score <= TW._lastSubmit) return;
    TW._lastSubmit = score;
    JG.submit('tiny-world', { score: score, mode: '모험', unit: '점' });
    JG.awardAll({
      'tw-tool': !!(TW.state.tools.axe_wood || TW.state.tools.pick_wood),
      'tw-house': TW.state.counters.built_house > 0,
      'tw-spirit1': TW.Spirits.countFriends() >= 1,
      'tw-spirit4': TW.Spirits.countFriends() >= 4,
      'tw-tree4': TW.state.tree.stage >= 4,
      'tw-codex': TW.UI.codexStats().pct >= 100
    });
  } catch (e) { /* 기록 기능이 없어도 게임은 계속된다 */ }
};
