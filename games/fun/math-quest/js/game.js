/* =====================================================================
 * game.js — 게임 흐름(새 게임 · 실력측정 · 스테이지 · 보스 · 던전)
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var Game = MQ.Game = {

    /* ---------------- 저장 ---------------- */
    save: function () {
      if (!MQ.S) return;
      MQ.Save.save(MQ.S);
      Game.syncHub();
    },
    /* jerry-games 공용 기록판(있을 때만) */
    syncHub: function () {
      try {
        if (!window.JG || !JG.submit) return;
        var S = MQ.S;
        if (S._hubLv === S.lv && S._hubAch === MQ.Prog.achCount(S)) return;
        S._hubLv = S.lv; S._hubAch = MQ.Prog.achCount(S);
        JG.submit('math-quest', { score: S.lv, mode: '모험', unit: 'Lv' });
        JG.awardAll({
          'mq-start': (S.stats.solved || 0) >= 1,
          'mq-lv10': S.lv >= 10,
          'mq-lv30': S.lv >= 30,
          'mq-lv50': S.lv >= 50,
          'mq-boss': (S.stats.bosses || 0) >= 1,
          'mq-allboss': (function () { var n = 0; for (var k in S.bossCleared) if (S.bossCleared[k]) n++; return n >= MQ.REGIONS.length; })(),
          'mq-combo20': (S.stats.maxCombo || 0) >= 20,
          'mq-solve1000': (S.stats.solved || 0) >= 1000
        });
      } catch (e) { }
    },

    /* ---------------- 시작 ---------------- */
    boot: function () {
      var S = MQ.Save.load();
      MQ.S = S || MQ.newState();
      MQ.Prog.ensureMissions(MQ.S);
      var h = new Date().getHours();
      if (h >= 21) MQ.S.stats.night = 1;
      if (h < 7) MQ.S.stats.morning = 1;
      MQ.Snd.setOn(MQ.S.settings.sound !== false);
      MQ.Bgm.setOn(MQ.S.settings.bgm !== false);
      return !!S;
    },

    newGame: function () {
      MQ.S = MQ.newState();
      MQ.Prog.ensureMissions(MQ.S);
      Game.save();
      Game.assess();
    },

    /* ---------------- 실력측정(5문제) ---------------- */
    assess: function () {
      var idx = 0, results = [], p = null, t0 = 0;
      MQ.UI.show('assess');

      function draw() {
        if (idx >= MQ.Diff.ASSESS.length) return done();
        p = MQ.Gen.make(MQ.Diff.ASSESS[idx], {});
        t0 = Date.now();
        $('asStep').textContent = (idx + 1) + ' / ' + MQ.Diff.ASSESS.length;
        $('asBar').style.width = (idx / MQ.Diff.ASSESS.length * 100) + '%';
        $('asQ').innerHTML = p.text;
        $('asSub').innerHTML = p.sub || '';
        $('asSvg').innerHTML = p.svg || '';
        $('asSvg').classList.toggle('hidden', !p.svg);
        var html = '';
        for (var i = 0; i < p.shuffled.length; i++) html += '<button class="choice" data-c="' + esc(p.shuffled[i]) + '">' + esc(p.shuffled[i]) + '</button>';
        html += '<button class="choice skip" data-c="__skip">잘 모르겠어요</button>';
        $('asChoices').innerHTML = html;
        var bs = $('asChoices').querySelectorAll('.choice');
        for (var j = 0; j < bs.length; j++) bs[j].onclick = function () {
          var v = this.getAttribute('data-c');
          var ok = v === p.answer;
          MQ.Snd.play(ok ? 'correct' : 'tap');
          this.classList.add(ok ? 'right' : 'wrong');
          results.push(ok);
          MQ.Prog.answer(MQ.S, { type: p.type, skill: p.skill, ok: ok, ms: Date.now() - t0, limit: 60, lv: p.lv });
          idx++;
          setTimeout(draw, 380);
        };
      }
      function done() {
        MQ.S.diff = MQ.Diff.fromAssess(results);
        MQ.S.assessed = true;
        MQ.S.recent = [];                       // 측정 기록은 적응형 창에 넣지 않는다
        Game.save();
        var rk = MQ.P.rank(MQ.S.diff);
        MQ.UI.show('map');
        MQ.UI.modal('<div class="assess-done"><span>🎖️</span><h2>출발 등급 ' +
          '<b style="color:' + rk.color + '">' + rk.name + '</b></h2>' +
          '<p>딱 맞는 곳에서 시작해요. 잘 맞히면 바로 더 어려워져요!</p>' +
          '<button class="big-btn primary" id="asGo">모험 시작 ▶</button></div>', { noClose: true });
        $('asGo').onclick = function () { MQ.UI.closeModal(); Game.startStage(0, 0); };
        MQ.Snd.play('levelup');
        MQ.FX.rain('🎉', 16);
      }
      draw();
    },

    /* ---------------- 스테이지 ---------------- */
    startStage: function (region, stage) {
      var S = MQ.S;
      var r = MQ.REGIONS[region];
      if (!r) return;
      if (S.lv < r.unlock) { MQ.FX.toast('Lv ' + r.unlock + ' 부터 갈 수 있어요', 'warn'); return; }
      stage = Math.max(0, Math.min(r.stages - 1, stage));
      S.region = region;
      var isBoss = stage === r.stages - 1;
      var list = [], i;

      if (isBoss) {
        list.push({ emoji: r.boss.emoji, name: r.boss.name, key: r.boss.name, hp: r.boss.hp, atk: r.boss.atk, q: r.boss.q, boss: true });
      } else {
        var n = Math.min(3, 1 + Math.floor(stage / 4));
        var q = 5 + Math.floor(stage / 3);
        for (i = 0; i < n; i++) {
          var m = r.mons[Math.floor(Math.random() * r.mons.length)];
          list.push({ emoji: m.emoji, name: m.name, key: m.name, hp: m.hp, atk: m.atk, q: q });
        }
      }
      MQ.Battle.start({
        kind: isBoss ? 'boss' : 'stage', region: region, stage: stage,
        title: r.emoji + ' ' + r.name + ' · ' + (isBoss ? '보스' : (stage + 1) + '단계'),
        monsters: list, mod: {}
      });
    },

    /* ---------------- 랜덤 던전 ---------------- */
    dungeonPick: function () {
      var picks = MQ.R.shuffle(MQ.DUNGEONS).slice(0, 3);
      var html = '<h2>🗝️ 던전 고르기</h2><p class="dg-note">들어갈 때마다 다른 방이 나와요. 하나를 고르세요!</p><div class="dg-list">';
      for (var i = 0; i < picks.length; i++) {
        html += '<button class="dg" data-d="' + picks[i].id + '">' +
          '<span class="dg-e">' + picks[i].emoji + '</span>' +
          '<b>' + esc(picks[i].name) + '</b><i>' + esc(picks[i].desc) + '</i></button>';
      }
      html += '</div>';
      MQ.UI.modal(html, { wide: true });
      var bs = document.querySelectorAll('#modal .dg');
      for (var j = 0; j < bs.length; j++) bs[j].onclick = function () {
        var id = this.getAttribute('data-d'), d = null;
        for (var k = 0; k < MQ.DUNGEONS.length; k++) if (MQ.DUNGEONS[k].id === id) d = MQ.DUNGEONS[k];
        MQ.UI.closeModal();
        Game.startDungeon(d);
      };
    },

    startDungeon: function (d) {
      var S = MQ.S;
      var open = MQ.P.unlockedRegions(S);
      var list = [], n = 4;
      for (var i = 0; i < n; i++) {
        var r = MQ.REGIONS[Math.floor(Math.random() * open)];
        var m = r.mons[Math.floor(Math.random() * r.mons.length)];
        list.push({ emoji: m.emoji, name: m.name, key: m.name, hp: m.hp * 0.9, atk: m.atk, q: 3 + i });
      }
      var mod = {};
      for (var k in d.mod) mod[k] = d.mod[k];
      mod.id = d.id;
      mod.label = d.emoji + ' ' + d.name;
      MQ.Battle.start({
        kind: 'dungeon', region: S.region, stage: -1,
        title: d.emoji + ' ' + d.name, monsters: list, mod: mod
      });
    }
  };
})();
