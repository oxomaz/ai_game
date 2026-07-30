/* ===========================================================
   Tiny World - js/quests.js
   퀘스트: 순서대로 열리고 한 번에 최대 3개를 보여 준다.
   조건을 만족하면 자동으로 완료되고 보상이 바로 나온다.
   =========================================================== */
window.TW = window.TW || {};
TW.Quests = (function () {
  var MAX_ACTIVE = 3;
  var busy = false;

  /* 화면에 보여줄 퀘스트 목록 */
  function active() {
    var s = TW.state, out = [];
    for (var i = 0; i < TW.QUESTS.length && out.length < MAX_ACTIVE; i++) {
      var q = TW.QUESTS[i];
      if (s.quests.done[q.id]) continue;
      var pr = q.prog(s);
      out.push({ q: q, cur: pr[0], need: pr[1] });
    }
    return out;
  }

  function doneCount() {
    return Object.keys(TW.state.quests.done).length;
  }

  function check() {
    if (busy) return;
    busy = true;
    var s = TW.state, changed = false;
    /* 앞에서부터 훑어 조건을 만족한 퀘스트를 완료 처리 */
    for (var pass = 0; pass < 4; pass++) {
      var list = active(), any = false;
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (it.cur < it.need) continue;
        complete(it.q);
        any = true; changed = true;
      }
      if (!any) break;
    }
    busy = false;
    if (changed) { TW.UI.syncHud(); TW.submitScore(); }
    TW.UI.renderQuests();
  }

  function complete(q) {
    var s = TW.state;
    if (s.quests.done[q.id]) return;
    s.quests.done[q.id] = 1;
    var r = q.reward || {};
    if (r.xp) TW.Player.addXp(s, r.xp);
    if (r.items) Object.keys(r.items).forEach(function (k) { TW.Inv.add(k, r.items[k]); });
    TW.Audio.play('quest');
    TW.UI.questDone(q, r);
    if (r.energy) TW.WorldTree.addEnergy(r.energy, '퀘스트');
  }

  return { active: active, check: check, doneCount: doneCount, total: TW.QUESTS.length };
})();
