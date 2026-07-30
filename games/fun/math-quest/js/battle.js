/* =====================================================================
 * battle.js — 전투(게임의 심장)
 * ---------------------------------------------------------------------
 * 정답 = 공격, 오답/시간초과 = 피격.
 * 콤보가 쌓이면 데미지와 경험치가 커지고 5콤보마다 필살기가 터진다.
 * 문제를 "푸는" 화면이 아니라 "때리는" 화면이 되도록 연출이 붙어 있다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};
  var B = null;                 // 현재 전투 상태
  var raf = 0;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var COMBO_TIERS = [[20, 10], [12, 5], [8, 3], [5, 2], [3, 1.5]];
  function comboExpMult(c) {
    for (var i = 0; i < COMBO_TIERS.length; i++) if (c >= COMBO_TIERS[i][0]) return COMBO_TIERS[i][1];
    return 1;
  }

  var Battle = MQ.Battle = {

    active: function () { return !!B; },
    state: function () { return B; },

    /* ---------------------------------------------------------------
     * 전투 시작
     * opt = { kind:'stage'|'boss'|'dungeon', region, stage, title,
     *         monsters:[{emoji,name,hp,atk,key,q}], mod:{}, onEnd:fn }
     * --------------------------------------------------------------- */
    start: function (opt) {
      var S = MQ.S;
      MQ.Prog.ensureMissions(S);
      var mod = opt.mod || {};
      B = {
        opt: opt, mod: mod, kind: opt.kind,
        list: opt.monsters, mi: -1, mon: null,
        hp: (S.hp == null ? MQ.P.hpMax(S) : Math.min(S.hp, MQ.P.hpMax(S))),
        hpMax: MQ.P.hpMax(S),
        combo: 0, maxCombo: 0, wrong: 0, asked: 0, right: 0,
        shield: MQ.P.gear(S).shield, usedHelp: false, revived: false,
        t0: Date.now(), qStart: 0, limit: 0, p: null, locked: false,
        chests: 0, expGain: 0, goldGain: 0, gemGain: 0, drops: [],
        fifty: null, hinted: false, ended: false
      };
      if (B.hp <= 0) B.hp = B.hpMax;
      MQ.UI.show('battle');
      MQ.Bgm.play(opt.kind === 'boss' ? 'boss' : opt.kind === 'dungeon' ? 'dungeon' : 'battle');
      $('btTitle').textContent = opt.title || '전투';
      $('btMod').innerHTML = mod.label ? '<span class="mod-chip">' + esc(mod.label) + '</span>' : '';
      Battle.nextMonster();
    },

    nextMonster: function () {
      B.mi++;
      if (B.mi >= B.list.length) return Battle.finish(true);
      var m = B.list[B.mi];
      var qNeed = m.q || 4;
      /* 장비가 좋으면 조금 더 빨리 잡히되, 한 방에 끝나지는 않게 체력을 같이 올린다 */
      var ratio = Math.min(3, MQ.P.atk(MQ.S) / MQ.P.baseAtk(MQ.S.lv));
      var hp = Math.round(qNeed * 100 * (m.hp || 1) * (1 + (ratio - 1) * 0.72));
      B.mon = {
        emoji: m.emoji, name: m.name, key: m.key || m.name, boss: !!m.boss,
        hpMax: hp, hp: hp, unit: Math.max(1, Math.round(hp / qNeed)),
        atk: m.atk || 1, q: qNeed
      };
      MQ.Prog.seeMonster(MQ.S, B.mon.key);
      MQ.Snd.play(B.mon.boss ? 'boss' : 'open');
      MQ.UI.paintBattleHeads(B);
      MQ.FX.monsterEnter($('btMon'), B.mon.boss);
      Battle.nextQuestion();
    },

    /* ---------- 다음 문제 ---------- */
    nextQuestion: function () {
      var S = MQ.S;
      var r = MQ.REGIONS[B.opt.region != null ? B.opt.region : S.region];
      var p = MQ.Diff.pick(S, {
        regionSkills: B.mod.skill ? [B.mod.skill] : (r ? r.skills : null),
        skill: B.mod.skill || null,
        diffMod: (B.mod.diff || 0) + (B.mon.boss ? 3 : 0),
        choices: B.mod.choices || 4
      });
      B.p = p;
      B.limit = MQ.Diff.timeFor(S, p, B.mod);
      B.qStart = Date.now();
      B.locked = false; B.fifty = null; B.hinted = false;
      MQ.UI.paintQuestion(B);
      Battle.tick();
    },

    /* ---------- 남은 시간 막대 ---------- */
    tick: function () {
      cancelAnimationFrame(raf);
      var warned = false;
      function loop() {
        if (!B || B.ended) return;
        var left = B.limit - (Date.now() - B.qStart) / 1000;
        var ratio = Math.max(0, left / B.limit);
        var bar = $('btTimeFill');
        if (bar) {
          bar.style.width = (ratio * 100) + '%';
          bar.className = 'bt-time-fill' + (ratio < 0.28 ? ' danger' : ratio < 0.55 ? ' warn' : '');
        }
        var num = $('btTimeNum');
        if (num) num.textContent = Math.max(0, Math.ceil(left)) + '초';
        if (!warned && ratio < 0.28) { warned = true; MQ.Snd.play('tick'); }
        if (left <= 0) { Battle.answer(null, true); return; }
        raf = requestAnimationFrame(loop);
      }
      loop();
    },

    /* ---------- 답 고르기 ---------- */
    answer: function (choice, timeout) {
      if (!B || B.locked || B.ended) return;
      B.locked = true;
      cancelAnimationFrame(raf);
      var S = MQ.S;
      var ms = Date.now() - B.qStart;
      var ok = !timeout && choice === B.p.answer;
      B.asked++;

      MQ.Prog.answer(S, { type: B.p.type, skill: B.p.skill, ok: ok, ms: ms, limit: B.limit, lv: B.p.lv });

      if (ok) Battle.onCorrect(ms, choice);
      else Battle.onWrong(timeout, choice);
    },

    onCorrect: function (ms, choice) {
      var S = MQ.S;
      B.right++;
      B.combo++;
      if (B.combo > B.maxCombo) B.maxCombo = B.combo;
      if (B.combo > (S.stats.maxCombo || 0)) S.stats.maxCombo = B.combo;

      var crit = Math.random() < MQ.P.crit(S);
      var ulti = B.combo > 0 && B.combo % 5 === 0;
      var cm = 1 + Math.min(12, B.combo) * 0.12 * (B.mod.combo || 1);
      var ratio = Math.min(3, MQ.P.atk(S) / MQ.P.baseAtk(S.lv));
      var dmg = 100 * ratio * cm * (crit ? 2 : 1) * (ulti ? 3 : 1);
      dmg = Math.round(dmg);
      B.mon.hp = Math.max(0, B.mon.hp - dmg);

      MQ.UI.markChoice(choice, true);
      MQ.Snd.play(ulti ? 'ulti' : crit ? 'crit' : 'correct');
      MQ.FX.hitMonster($('btMon'), ulti ? 'ulti' : crit ? 'crit' : 'hit');
      MQ.FX.float($('btStage'), (ulti ? '필살기! ' : crit ? '치명타! ' : '') + '-' + dmg, ulti ? 'ulti' : crit ? 'crit' : 'dmg');
      if (B.combo >= 3) MQ.FX.combo($('btCombo'), B.combo, comboExpMult(B.combo));
      MQ.UI.paintBattleHeads(B);

      var expM = comboExpMult(B.combo) * (B.mod.exp || 1);
      B.expGain += Math.round((3 + S.diff * 0.25) * expM);
      B.goldGain += Math.round((2 + S.diff * 0.16) * (B.mod.gold || 1));

      setTimeout(function () {
        if (!B || B.ended) return;
        if (B.mon.hp <= 0) return Battle.monsterDown();
        Battle.nextQuestion();
      }, 620);
    },

    onWrong: function (timeout, choice) {
      var S = MQ.S;
      B.combo = 0; B.wrong++;
      MQ.UI.markChoice(choice, false, B.p.answer);

      var blocked = false;
      if (B.shield > 0) { B.shield--; blocked = true; }
      var dmg = 0;
      if (!blocked) {
        var regionIdx = B.opt.region != null ? B.opt.region : 0;
        var def = MQ.P.def(S);
        dmg = Math.round(B.mon.atk * (7 + regionIdx * 2.6) * (B.mon.boss ? 1.5 : 1) * (B.mod.dmgTaken || 1) * (1 - def / (def + 70)));
        dmg = Math.max(3, dmg);
        B.hp = Math.max(0, B.hp - dmg);
      }
      MQ.Snd.play(blocked ? 'open' : 'wrong');
      MQ.FX.shake($('btPlayerCard'));
      MQ.FX.float($('btStage'), blocked ? '🛡️ 막았다!' : '-' + dmg, blocked ? 'shield' : 'hurt');
      MQ.UI.paintBattleHeads(B);
      MQ.UI.showExplain(B.p);

      setTimeout(function () {
        if (!B || B.ended) return;
        if (B.hp <= 0) return Battle.playerDown();
        Battle.nextQuestion();
      }, 1750);
    },

    monsterDown: function () {
      var S = MQ.S;
      MQ.Snd.play('win');
      MQ.FX.defeat($('btMon'));
      MQ.Prog.event(S, B.mon.boss ? 'boss' : 'mon', 1);
      if (!B.mon.boss) MQ.Prog.mission(S, 'battle', 0);
      setTimeout(function () {
        if (!B || B.ended) return;
        Battle.nextMonster();
      }, 900);
    },

    playerDown: function () {
      var S = MQ.S;
      if (!B.revived && MQ.P.count(S, 'revive') > 0) {
        MQ.P.use(S, 'revive');
        B.revived = true;
        B.hp = Math.round(B.hpMax * 0.5);
        MQ.Snd.play('levelup');
        MQ.FX.float($('btStage'), '💖 부활!', 'ulti');
        MQ.UI.paintBattleHeads(B);
        setTimeout(function () { if (B && !B.ended) Battle.nextQuestion(); }, 1100);
        return;
      }
      Battle.finish(false);
    },

    /* ---------- 전투 아이템 ---------- */
    useItem: function (id) {
      if (!B || B.locked || B.ended) return;
      var S = MQ.S;
      if (!MQ.P.count(S, id)) return;
      if (id === 'hint') {
        if (B.hinted) return;
        MQ.P.use(S, id); B.hinted = true; B.usedHelp = true;
        MQ.UI.showHint(B.p);
      } else if (id === 'fifty') {
        if (B.fifty) return;
        MQ.P.use(S, id); B.usedHelp = true;
        var wrongs = [];
        for (var i = 0; i < B.p.shuffled.length; i++) if (B.p.shuffled[i] !== B.p.answer) wrongs.push(B.p.shuffled[i]);
        wrongs = MQ.R.shuffle(wrongs).slice(0, Math.max(1, wrongs.length - 1));
        B.fifty = wrongs;
        MQ.UI.dimChoices(wrongs);
      } else if (id === 'time') {
        MQ.P.use(S, id); B.usedHelp = true;
        B.qStart += 10000;
      } else if (id === 'shield') {
        MQ.P.use(S, id); B.usedHelp = true;
        B.shield++;
        MQ.FX.float($('btStage'), '🛡️ 보호막!', 'shield');
      } else if (id === 'potion') {
        MQ.P.use(S, id);
        B.hp = B.hpMax;
        MQ.FX.float($('btStage'), '💗 체력 회복!', 'shield');
        MQ.UI.paintBattleHeads(B);
      }
      MQ.Snd.play('tap');
      MQ.UI.paintBattleItems(B);
      MQ.Game.save();
    },

    /* ---------- 도망 ---------- */
    flee: function () {
      if (!B) return;
      B.ended = true;
      cancelAnimationFrame(raf);
      MQ.S.hp = B.hp;
      MQ.Diff.update(MQ.S, MQ.REGIONS[MQ.S.region] ? MQ.REGIONS[MQ.S.region].diff : null);
      MQ.Game.save();
      B = null;
      MQ.UI.show('map');
    },

    /* ---------- 끝 ---------- */
    finish: function (win) {
      if (!B || B.ended) return;
      B.ended = true;
      cancelAnimationFrame(raf);
      var S = MQ.S, o = B.opt;
      var perfect = win && B.wrong === 0;
      var secs = Math.round((Date.now() - B.t0) / 1000);

      var res = { win: win, exp: 0, gold: 0, gem: 0, items: [], levelUps: 0, ach: [], perfect: perfect, secs: secs, combo: B.maxCombo };

      if (win) {
        var rw = MQ.Loot.battleReward(S, {
          mult: (o.kind === 'boss' ? 3.4 : o.kind === 'dungeon' ? 1.7 : 1) * (1 + B.list.length * 0.15),
          boss: o.kind === 'boss', perfect: perfect,
          expMod: B.mod.exp || 1, goldMod: B.mod.gold || 1, dropMod: B.mod.drop || 1
        });
        res.exp = B.expGain + rw.exp;
        res.gold = B.goldGain + rw.gold;
        res.gem = rw.gem;
        for (var i = 0; i < rw.chests; i++) {
          var c = MQ.Loot.openChest(S, { luck: (B.mod.rare || 1) });
          res.items.push(c);
          MQ.Prog.mission(S, 'chest', 1);
        }
        if (rw.chests > (S.stats.maxChest || 0)) S.stats.maxChest = rw.chests;
        if (perfect) S.stats.perfect = (S.stats.perfect || 0) + 1;
        if (B.hp / B.hpMax <= 0.1) S.stats.comeback = 1;
        if (o.kind === 'boss' && !B.usedHelp) S.stats.cleanBoss = 1;
        if (secs <= 60 && o.kind !== 'boss') S.stats.speedrun = 1;

        res.levelUps = MQ.P.addExp(S, res.exp);
        MQ.P.addGold(S, res.gold);
        if (res.gem) MQ.P.addGem(S, res.gem);
        MQ.Prog.event(S, 'battle', 1);
        if (o.kind === 'dungeon') {
          MQ.Prog.event(S, 'dungeon', 1);
          if (B.mod.id === 'hard') S.stats.abyss = 1;
        }

        // 스테이지 클리어 기록
        if (o.kind === 'stage') S.cleared[o.region + '-' + o.stage] = 1;
        if (o.kind === 'boss') {
          S.bossCleared[o.region] = 1;
          S.cleared[o.region + '-' + o.stage] = 1;
        }
        if (o.kind !== 'dungeon' && o.region === S.region && o.stage >= S.stage) S.stage = Math.min(MQ.REGIONS[o.region].stages - 1, o.stage + 1);
        S.hp = B.hpMax;                      // 이기면 체력 회복(부담 없이 다음 판)
      } else {
        S.hp = Math.round(MQ.P.hpMax(S) * 0.6);
        MQ.Snd.play('lose');
      }

      MQ.Diff.update(S, MQ.REGIONS[o.region != null ? o.region : S.region] ? MQ.REGIONS[o.region != null ? o.region : S.region].diff : null);
      res.ach = MQ.Prog.checkAch(S);
      MQ.Game.save();

      var bb = B; B = null;
      MQ.UI.showResult(res, bb, o);
    }
  };

  MQ.comboExpMult = comboExpMult;
})();
