/* ===========================================================
   Tiny World - js/spirits.js
   정령 발견 · 친구 되기 · 일 배치 · 친밀도
   =========================================================== */
window.TW = window.TW || {};
TW.Spirits = (function () {
  var pos = {};      /* 화면에 보이는 정령 위치 (저장하지 않음) */
  var timers = {};   /* 자동 수집 타이머 */
  var checkAcc = 0;

  function ensurePos(k) {
    if (!pos[k]) {
      var sp = TW.SPIRITS[k].spot;
      pos[k] = { x: sp.x + 0.5, y: sp.y + 0.5 };
    }
    return pos[k];
  }
  function posOf(k) { return ensurePos(k); }

  function jobAt(buildingId) {
    var found = null;
    TW.SPIRIT_ORDER.forEach(function (k) {
      if (TW.state.spirits[k].job === buildingId) found = k;
    });
    return found;
  }

  function buildingOf(k) {
    var id = TW.state.spirits[k].job;
    if (!id) return null;
    var b = null;
    TW.state.buildings.forEach(function (x) { if (x.id === id) b = x; });
    return b;
  }

  function jobsUsed() {
    return TW.SPIRIT_ORDER.filter(function (k) { return TW.state.spirits[k].job; }).length;
  }

  /* ---------- 발견 조건 확인 ---------- */
  function checkUnlock() {
    var s = TW.state;
    TW.SPIRIT_ORDER.forEach(function (k) {
      var sp = s.spirits[k];
      if (sp.spawned || sp.friend) return;
      var fn = TW.SPIRIT_UNLOCK[k];
      if (!fn || !fn(s)) return;
      sp.spawned = true;
      sp.found = true;
      ensurePos(k);
      TW.Audio.play('event');
      TW.UI.toast(TW.SPIRITS[k].where + '에 무언가 반짝여! 찾아가 보자', '✨');
      TW.UI.pingSpirit(k);
      TW.Quests.check();
    });
  }

  /* ---------- 친구 만들기 ---------- */
  function tryBefriend(k) {
    var sp = TW.state.spirits[k], def = TW.SPIRITS[k];
    var g = def.gift;
    if (!TW.Inv.has(g.item, g.qty)) {
      TW.Audio.play('error');
      return false;
    }
    TW.Inv.remove(g.item, g.qty);
    sp.friend = true;
    sp.found = true;
    sp.bond = 10;
    TW.state.codex.spirits[k] = true;
    TW.Audio.play('spirit');
    TW.Player.addXp(TW.state, 45);
    TW.WorldTree.addEnergy(3, '정령 친구');
    var pp = ensurePos(k);
    TW.FX.burst(pp.x, pp.y, def.color2, 26);
    TW.FX.floatText(pp.x, pp.y - 1, def.icon + ' ' + def.name + ' 친구가 됐어!', '#fff3b0', true);
    TW.UI.confetti();
    TW.Quests.check();
    TW.submitScore();
    return true;
  }

  /* ---------- 친밀도 ---------- */
  function gainBond(k, amount) {
    var sp = TW.state.spirits[k];
    if (!sp.friend) return;
    sp.bond = Math.min(100, sp.bond + amount);
    sp.xp += amount;
    var need = 18 * sp.level;
    while (sp.xp >= need) {
      sp.xp -= need;
      sp.level++;
      need = 18 * sp.level;
      TW.Audio.play('level');
      TW.UI.toast(TW.SPIRITS[k].name + ' 레벨 ' + sp.level + '! 일을 더 잘하게 됐어', TW.SPIRITS[k].icon);
      TW.FX.burst(pos[k] ? pos[k].x : TW.state.pos.x, pos[k] ? pos[k].y : TW.state.pos.y, TW.SPIRITS[k].color2, 14);
    }
  }

  function gainBondNearby(amount) {
    var p = TW.state.pos;
    TW.SPIRIT_ORDER.forEach(function (k) {
      var sp = TW.state.spirits[k];
      if (!sp.friend) return;
      var pp = ensurePos(k);
      var d = Math.sqrt(Math.pow(pp.x - p.x, 2) + Math.pow(pp.y - p.y, 2));
      if (d <= 5 || sp.job) gainBond(k, amount);
    });
  }

  /* ---------- 일 배치 ---------- */
  function setJob(k, buildingId) {
    var s = TW.state, sp = s.spirits[k];
    if (!sp.friend) return false;
    if (buildingId === null) { sp.job = null; TW.UI.renderPanel(); return true; }
    if (jobAt(buildingId)) {
      TW.UI.toast('그 자리엔 이미 다른 정령이 있어!', '🙃');
      return false;
    }
    if (!sp.job && jobsUsed() >= TW.Player.spiritSlots(s)) {
      TW.Audio.play('error');
      TW.UI.toast('일자리가 꽉 찼어! 정령 쉼터를 지어 볼까?', '🏕️');
      return false;
    }
    sp.job = buildingId;
    s.counters.jobs_set++;
    timers[k] = 0;
    TW.Audio.play('open');
    TW.UI.toast(TW.SPIRITS[k].name + '이(가) 일을 시작했어!', TW.SPIRITS[k].icon);
    TW.Quests.check();
    TW.UI.renderPanel();
    return true;
  }

  /* ---------- 능력치 ---------- */
  function hasWorkingJob(k) {
    var sp = TW.state.spirits[k];
    return !!(sp && sp.friend && sp.job && buildingOf(k));
  }
  function craftSpeed() { return hasWorkingJob('ember') ? 0.35 : 1; }
  function farmSpeed() { return hasWorkingJob('drop') ? 1.8 : 1; }

  /* ---------- 매 프레임 ---------- */
  function update(dt, t) {
    checkAcc += dt;
    if (checkAcc >= 0.8) { checkAcc = 0; checkUnlock(); }

    var p = TW.state.pos;
    TW.SPIRIT_ORDER.forEach(function (k, idx) {
      var sp = TW.state.spirits[k];
      if (!sp.spawned && !sp.friend) return;
      var pp = ensurePos(k);
      var tx, ty;
      if (!sp.friend) {
        /* 야생 정령: 자기 자리에서 살랑살랑 */
        var spot = TW.SPIRITS[k].spot;
        tx = spot.x + 0.5 + Math.sin(t * 0.7 + idx) * 0.35;
        ty = spot.y + 0.5 + Math.cos(t * 0.9 + idx) * 0.25;
      } else if (sp.job && buildingOf(k)) {
        var b = buildingOf(k);
        tx = b.x + 0.5 + Math.cos(t * 0.9 + idx * 2) * 0.85;
        ty = b.y + 0.9 + Math.sin(t * 1.1 + idx * 2) * 0.5;
      } else {
        /* 동행: 플레이어를 따라다닌다 */
        var a = idx * 1.7 + t * 0.6;
        tx = p.x + Math.cos(a) * 1.0;
        ty = p.y + Math.sin(a) * 0.7 - 0.2;
      }
      pp.x += (tx - pp.x) * Math.min(1, dt * 3.4);
      pp.y += (ty - pp.y) * Math.min(1, dt * 3.4);

      /* 자동 수집 */
      if (sp.friend && sp.job && buildingOf(k)) {
        var job = TW.SPIRITS[k].job;
        if (job.type === 'gather') {
          timers[k] = (timers[k] || 0) + dt;
          var every = Math.max(10, job.every - (sp.level - 1) * 2);
          if (timers[k] >= every) {
            timers[k] = 0;
            var got = TW.Inv.add(job.item, job.amount);
            if (got > 0) {
              TW.FX.floatText(pp.x, pp.y - 0.6, TW.ITEMS[job.item].icon + ' +' + got, '#dff7c0');
              TW.FX.burst(pp.x, pp.y, TW.SPIRITS[k].color2, 5);
              TW.Audio.play('pick');
              gainBond(k, 0.6);
              TW.UI.syncHud();
            }
          }
        }
      }
    });
  }

  function countFriends() {
    return TW.SPIRIT_ORDER.filter(function (k) { return TW.state.spirits[k].friend; }).length;
  }

  return {
    posOf: posOf, jobAt: jobAt, buildingOf: buildingOf, jobsUsed: jobsUsed,
    setJob: setJob, tryBefriend: tryBefriend, gainBond: gainBond,
    gainBondNearby: gainBondNearby, craftSpeed: craftSpeed, farmSpeed: farmSpeed,
    update: update, checkUnlock: checkUnlock, countFriends: countFriends,
    resetPositions: function () { pos = {}; timers = {}; }
  };
})();
