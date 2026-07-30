/* =====================================================================
 * main.js — 시작 버튼 연결 · 모바일 화면 높이 보정
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};
  function $(id) { return document.getElementById(id); }

  function vh() {
    var h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    document.documentElement.style.setProperty('--mq-vh', h + 'px');
  }

  function boot() {
    vh();
    window.addEventListener('resize', vh);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', vh);

    var had = MQ.Game.boot();

    /* 공용 플레이어 칩 (jerry-games 허브가 있을 때만) */
    try { if (window.JG && JG.mountChip) JG.mountChip('jgChip'); } catch (e) { }
    try {
      if (window.JG && JG.best) {
        var b = JG.best('math-quest', '모험');
        if (b) $('titleBest').textContent = '내 최고 기록  Lv ' + b;
      }
    } catch (e) { }

    if (had) {
      var c = $('btnContinue');
      c.classList.remove('hidden');
      c.textContent = '▶ 이어하기 (Lv ' + MQ.S.lv + ')';
      c.onclick = function () {
        MQ.Snd.unlock(); MQ.Snd.play('tap');
        if (!MQ.S.assessed) return MQ.Game.assess();
        MQ.UI.show('map');
      };
      $('btnNew').textContent = '🌱 처음부터 다시';
    }

    $('btnNew').onclick = function () {
      MQ.Snd.unlock(); MQ.Snd.play('tap');
      if (had) {
        MQ.UI.modal('<h2>지금 기록을 지우고 새로 시작할까요?</h2>' +
          '<p class="warn-p">레벨 ' + MQ.S.lv + ' 과 모은 아이템이 모두 사라져요.</p>' +
          '<div class="res-btns"><button class="big-btn danger" id="nwYes">네</button>' +
          '<button class="big-btn ghost" id="nwNo">아니요</button></div>');
        $('nwYes').onclick = function () { MQ.UI.closeModal(); MQ.Save.clear(); MQ.Game.newGame(); };
        $('nwNo').onclick = MQ.UI.closeModal;
      } else {
        MQ.Game.newGame();
      }
    };
    $('btnHow').onclick = function () { MQ.Snd.unlock(); MQ.UI.howTo(); };
    $('btExit').onclick = function () { MQ.UI.exitBattle(); };

    /* 브라우저 뒤로가기 = 나가기 */
    try { history.pushState({ mq: 1 }, ''); } catch (e) { }
    window.addEventListener('popstate', function () {
      try { history.pushState({ mq: 1 }, ''); } catch (e) { }
      if (document.getElementById('modal').classList.contains('on')) { MQ.UI.closeModal(); return; }
      if (MQ.Battle.active()) { MQ.UI.exitBattle(); return; }
      if (MQ.UI.current() !== 'map' && MQ.UI.current() !== 'title') { MQ.UI.show('map'); return; }
      MQ.FX.toast('한 번 더 누르면 게임 목록으로 나가요', 'warn');
      if (MQ.UI._backOnce) { location.href = '../../../'; }
      MQ.UI._backOnce = true;
      setTimeout(function () { MQ.UI._backOnce = false; }, 2000);
    });

    var tabs = document.querySelectorAll('#nav button');
    for (var i = 0; i < tabs.length; i++) tabs[i].onclick = function () {
      MQ.Snd.play('tap');
      MQ.UI.show(this.getAttribute('data-go'));
    };

    /* 키보드로도 답할 수 있게 (1~4) */
    document.addEventListener('keydown', function (e) {
      if (!MQ.Battle.active()) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) {
        var bs = document.querySelectorAll('#btChoices .choice');
        if (bs[n - 1]) bs[n - 1].click();
      }
    });

    document.addEventListener('pointerdown', function once() {
      MQ.Snd.unlock();
      MQ.UI.music();          // 첫 터치에서 배경음악도 깨운다(모바일 정책)
      document.removeEventListener('pointerdown', once);
    });

    /* 플레이 시간 기록 */
    var last = Date.now();
    setInterval(function () {
      var now = Date.now(), d = now - last; last = now;
      if (d < 30000 && MQ.S && MQ.S.stats && document.visibilityState !== 'hidden') {
        var day = MQ.S.stats.days[MQ.today()];
        if (day) day.ms = (day.ms || 0) + d;
      }
    }, 10000);

    /* 창을 닫아도 저장 */
    window.addEventListener('pagehide', function () { try { MQ.Game.save(); } catch (e) { } });
    setInterval(function () { try { MQ.Game.save(); } catch (e) { } }, 20000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
