/* ===========================================================
   Tiny World - js/player.js
   플레이어 상태 만들기 · 경험치 · 레벨업 보상 · 활동력
   =========================================================== */
window.TW = window.TW || {};
TW.Player = (function () {

  /* 레벨 n → n+1 로 가는 데 필요한 경험치 */
  function xpNeed(level) { return Math.round(28 + (level - 1) * 22 + Math.pow(level, 1.7)); }

  var LEVEL_REWARDS = [
    { kind: 'energy', amount: 10, text: '최대 활동력 +10' },
    { kind: 'inv',    amount: 60, text: '가방 용량 +60' },
    { kind: 'speed',  amount: 0.06, text: '이동 속도 조금 빨라짐' },
    { kind: 'energy', amount: 10, text: '최대 활동력 +10' },
    { kind: 'slot',   amount: 1,  text: '정령 일자리 +1' },
    { kind: 'inv',    amount: 60, text: '가방 용량 +60' },
    { kind: 'speed',  amount: 0.06, text: '이동 속도 조금 빨라짐' }
  ];

  function newState(name) {
    var s = {
      v: 1,
      name: name || '탐험가',
      level: 1, xp: 0,
      energy: 40, energyMax: 40,
      speed: 4.3, invMax: 220, extraSlots: 0,
      pos: { x: TW.MAP.start.x + 0.5, y: TW.MAP.start.y + 0.5 },
      dir: 0,
      inv: {},
      tools: {},
      buildings: [],
      nodes: TW.generateNodes(),
      spirits: {},
      quests: { done: {}, rewarded: {} },
      tree: { stage: 1, energy: 0 },
      codex: { items: {}, nodes: {}, spirits: {}, buildings: {} },
      counters: {
        got_wood: 0, got_stone: 0, got_iron: 0,
        gather_tree: 0, gather_stone: 0, gather_all: 0,
        tree_energy: 0, water_given: 0, planted: 0, harvested: 0,
        crafted: 0, built: 0, jobs_set: 0, events: 0,
        built_workbench: 0, built_house: 0, built_storage: 0, built_farm: 0, built_nest: 0
      },
      regions: { plain: true, forest: false, hill: false, mist: false },
      settings: { sound: true },
      stats: { play: 0, started: Date.now() },
      tutorial: { done: false },
      nextBuildingId: 1,
      lastSave: 0
    };
    TW.SPIRIT_ORDER.forEach(function (k) {
      s.spirits[k] = { found: false, friend: false, level: 1, xp: 0, bond: 0, job: null, spawned: false, evo: 0 };
    });
    /* 도감: 시작 지역에서 바로 보이는 것들은 자동으로 열어 준다 */
    return s;
  }

  function addXp(s, amount, silent) {
    s.xp += amount;
    /* 뭔가 진척이 있었다는 신호 → 자동 힌트 타이머를 되돌린다 */
    if (window.TW && TW.Help) TW.Help.mark();
    var ups = [];
    while (s.xp >= xpNeed(s.level)) {
      s.xp -= xpNeed(s.level);
      s.level++;
      var r = LEVEL_REWARDS[(s.level - 2) % LEVEL_REWARDS.length];
      if (r.kind === 'energy') { s.energyMax += r.amount; s.energy = s.energyMax; }
      else if (r.kind === 'inv') { s.invMax += r.amount; }
      else if (r.kind === 'speed') { s.speed = Math.round((s.speed * (1 + r.amount)) * 100) / 100; }
      else if (r.kind === 'slot') { s.extraSlots += r.amount; }
      ups.push({ level: s.level, text: r.text });
    }
    if (ups.length && !silent) {
      TW.Audio.play('level');
      TW.UI.levelUp(ups);
      TW.Quests.check();
      TW.submitScore();
    }
    TW.UI.syncHud();
    return ups;
  }

  function spendEnergy(s, amount) {
    if (s.energy < amount) return false;
    s.energy -= amount;
    return true;
  }

  function regen(s, dt) {
    /* 5초에 1씩 자동 회복 */
    s._eAcc = (s._eAcc || 0) + dt;
    while (s._eAcc >= 5) {
      s._eAcc -= 5;
      if (s.energy < s.energyMax) s.energy++;
    }
  }

  /* 정령 일자리 수: 기본 1 + 정령쉼터*2 + 레벨 보상 */
  function spiritSlots(s) {
    var nests = s.buildings.filter(function (b) { return b.type === 'nest'; }).length;
    return 1 + nests * 2 + s.extraSlots;
  }

  function invCap(s) {
    var st = s.buildings.filter(function (b) { return b.type === 'storage'; }).length;
    return s.invMax + st * TW.BUILDINGS.storage.capacity;
  }

  return {
    newState: newState, addXp: addXp, xpNeed: xpNeed,
    spendEnergy: spendEnergy, regen: regen,
    spiritSlots: spiritSlots, invCap: invCap,
    rewards: LEVEL_REWARDS
  };
})();
