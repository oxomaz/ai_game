/* ===========================================================
   Tiny World - js/main.js
   시작 화면 연결 · 창 크기 변화 · 앱 시작점
   =========================================================== */
window.TW = window.TW || {};
TW.Main = (function () {

  function refreshTitle() {
    var has = TW.Save.has();
    document.getElementById('btnContinue').classList.toggle('hidden', !has);
    var best = '';
    try {
      if (window.JG && JG.best) {
        var b = JG.best('tiny-world', '모험');
        if (typeof b === 'number' && b > 0) best = '🏆 내 최고 섬 점수: ' + b + '점';
      }
    } catch (e) { }
    if (!best && has) {
      var s = TW.Save.load();
      if (s) best = '🏝️ 저장된 섬: Lv.' + s.level + ' · 세계수 ' + s.tree.stage + '단계';
    }
    document.getElementById('titleBest').textContent = best;
  }

  function init() {
    TW.UI.init();
    TW.Input.init();
    TW.Map.init(document.getElementById('cv'));

    try { if (window.JG && JG.mountChip) JG.mountChip('jgChip'); } catch (e) { }

    document.getElementById('btnNew').addEventListener('click', function () {
      TW.Audio.unlock(); TW.Audio.play('open');
      if (TW.Save.has()) {
        if (!window.confirm('저장된 섬이 있어요. 새로 시작하면 지금 섬이 사라져요. 새 게임을 시작할까요?')) return;
      }
      TW.Save.clear();
      TW.Game.newGame();
    });
    document.getElementById('btnContinue').addEventListener('click', function () {
      TW.Audio.unlock(); TW.Audio.play('open');
      TW.Game.continueGame();
    });
    document.getElementById('btnHowTo').addEventListener('click', function () {
      TW.Audio.unlock(); TW.Audio.play('open');
      TW.UI.howto(true);
    });

    window.addEventListener('resize', function () { TW.Map.resize(); });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { TW.Map.resize(); });
    }
    window.addEventListener('orientationchange', function () {
      setTimeout(function () { TW.Map.resize(); }, 250);
    });

    /* 창을 닫거나 탭을 옮길 때 저장 */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && TW.state) TW.Save.save(TW.state);
    });
    window.addEventListener('pagehide', function () { if (TW.state) TW.Save.save(TW.state); });

    /* 플레이어를 바꾸면 이름을 반영 */
    try {
      if (window.JG && JG.on) {
        JG.on('change', function () {
          if (TW.state && JG.player) { TW.state.name = JG.player().name; TW.UI.syncHud(); }
          refreshTitle();
        });
      }
    } catch (e) { }

    refreshTitle();
  }

  return { init: init, refreshTitle: refreshTitle };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', TW.Main.init);
} else {
  TW.Main.init();
}
