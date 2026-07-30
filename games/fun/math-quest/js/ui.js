/* =====================================================================
 * ui.js — 화면 그리기 전부
 * ---------------------------------------------------------------------
 * 화면은 index.html 에 있는 <section class="screen"> 들을 갈아 끼우는 방식.
 * 데이터 → HTML 변환만 하고, 게임 규칙은 건드리지 않는다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function pct(a, b) { return Math.max(0, Math.min(100, b ? a / b * 100 : 0)); }

  var cur = 'title';

  var UI = MQ.UI = {

    /* ---------------- 화면 전환 ---------------- */
    show: function (name) {
      var list = document.querySelectorAll('.screen');
      for (var i = 0; i < list.length; i++) list[i].classList.toggle('on', list[i].id === 'sc-' + name);
      cur = name;
      document.body.classList.toggle('in-battle', name === 'battle');
      var nav = $('nav');
      if (nav) nav.classList.toggle('hidden', name === 'battle' || name === 'title' || name === 'assess');
      var tabs = document.querySelectorAll('#nav button');
      for (var j = 0; j < tabs.length; j++) tabs[j].classList.toggle('on', tabs[j].getAttribute('data-go') === name);
      if (name === 'map') UI.paintMap();
      if (name === 'bag') UI.paintBag();
      if (name === 'codex') UI.paintCodex();
      if (name === 'quest') UI.paintQuests();
      if (name === 'shop') UI.paintShop();
      UI.paintHud();
      window.scrollTo(0, 0);
    },
    current: function () { return cur; },

    /* ---------------- 위쪽 상태바 ---------------- */
    paintHud: function () {
      var S = MQ.S; if (!S) return;
      var hud = $('hud'); if (!hud) return;
      var rk = MQ.P.rank(S.diff);
      var need = MQ.P.need(S.lv);
      hud.innerHTML =
        '<div class="hud-l">' +
        '<div class="hud-av">' + (MQ.ITEM[S.inv.equipped.skin] ? MQ.ITEM[S.inv.equipped.skin].emoji : '🧒') + '</div>' +
        '<div class="hud-lv">' +
        '<b>Lv ' + S.lv + '</b>' +
        '<span class="rank" style="color:' + rk.color + '">' + rk.name + '</span>' +
        '<div class="xp"><i style="width:' + pct(S.exp, need) + '%"></i></div>' +
        '</div></div>' +
        '<div class="hud-r">' +
        '<span class="pill">💰 ' + S.gold + '</span>' +
        '<span class="pill">💎 ' + S.gem + '</span>' +
        '<button class="pill ghost" id="btnMenu">⚙️</button>' +
        '</div>';
      var b = $('btnMenu'); if (b) b.onclick = UI.menu;
      var badge = $('navQuestDot');
      if (badge) badge.classList.toggle('on', MQ.Prog.pendingRewards(S) > 0);
    },

    /* =====================================================================
     * 지도
     * ===================================================================== */
    paintMap: function () {
      var S = MQ.S;
      var open = MQ.P.unlockedRegions(S);
      var html = '<div class="region-strip">';
      for (var i = 0; i < MQ.REGIONS.length; i++) {
        var r = MQ.REGIONS[i], lock = i >= open;
        html += '<button class="rg' + (i === S.region ? ' on' : '') + (lock ? ' lock' : '') + '" data-rg="' + i + '">' +
          '<span class="rg-e">' + r.emoji + '</span><span class="rg-n">' + esc(r.name) + '</span>' +
          (lock ? '<span class="rg-l">🔒 Lv' + r.unlock + '</span>' : '') + '</button>';
      }
      html += '</div>';

      var r2 = MQ.REGIONS[S.region];
      html += '<div class="region-head" style="background:linear-gradient(135deg,' + r2.sky[0] + ',' + r2.sky[1] + ')">' +
        '<div class="rh-e">' + r2.emoji + '</div>' +
        '<div><h2>' + esc(r2.name) + '</h2><p>' + esc(r2.desc) + '</p>' +
        '<span class="rh-tag">기준 난이도 ' + MQ.P.rank(r2.diff).name + '</span></div></div>';

      html += '<div class="stages">';
      for (var s = 0; s < r2.stages; s++) {
        var isBoss = (s === r2.stages - 1);
        var done = !!S.cleared[S.region + '-' + s];
        var canGo = s <= S.stage || done;
        html += '<button class="node' + (isBoss ? ' boss' : '') + (done ? ' done' : '') + (canGo ? '' : ' lock') + '" data-st="' + s + '">' +
          '<span class="node-i">' + (isBoss ? MQ.REGIONS[S.region].boss.emoji : (done ? '⭐' : (canGo ? '⚔️' : '🔒'))) + '</span>' +
          '<span class="node-t">' + (isBoss ? '보스' : (s + 1)) + '</span>' +
          '</button>';
      }
      html += '</div>';

      html += '<div class="map-actions">' +
        '<button class="big-btn primary" id="btnFight">⚔️ 모험 계속하기</button>' +
        '<button class="big-btn" id="btnDungeon">🗝️ 랜덤 던전</button>' +
        '</div>';

      html += '<div class="skill-strip">';
      for (var k = 0; k < MQ.SKILL_IDS.length; k++) {
        var sk = MQ.SKILL_IDS[k], m = MQ.SKILLS[sk];
        var lvv = S.skillLv[sk] || 1, ex = S.skillExp[sk] || 0, nd = MQ.P.skillNeed(lvv);
        html += '<div class="sk"><span class="sk-i">' + m.icon + '</span>' +
          '<b>' + esc(m.name) + '</b><span class="sk-lv">Lv' + lvv + '</span>' +
          '<div class="sk-bar"><i style="width:' + pct(ex, nd) + '%;background:' + m.color + '"></i></div></div>';
      }
      html += '</div>';

      $('mapBody').innerHTML = html;

      var rgs = document.querySelectorAll('#mapBody .rg');
      for (var a = 0; a < rgs.length; a++) rgs[a].onclick = function () {
        var i = +this.getAttribute('data-rg');
        if (i >= MQ.P.unlockedRegions(MQ.S)) {
          MQ.FX.toast('Lv ' + MQ.REGIONS[i].unlock + ' 이 되면 열려요!', 'warn'); MQ.Snd.play('wrong'); return;
        }
        MQ.S.region = i;
        if (MQ.S.stage >= MQ.REGIONS[i].stages) MQ.S.stage = 0;
        // 그 지역에서 가장 앞선 곳으로 커서 이동
        var st = 0;
        while (st < MQ.REGIONS[i].stages - 1 && MQ.S.cleared[i + '-' + st]) st++;
        MQ.S.stage = st;
        MQ.Snd.play('tap'); MQ.Game.save(); UI.paintMap();
      };
      var nodes = document.querySelectorAll('#mapBody .node');
      for (var b = 0; b < nodes.length; b++) nodes[b].onclick = function () {
        if (this.classList.contains('lock')) { MQ.FX.toast('앞 단계를 먼저 깨야 해요', 'warn'); return; }
        MQ.Game.startStage(MQ.S.region, +this.getAttribute('data-st'));
      };
      $('btnFight').onclick = function () { MQ.Game.startStage(MQ.S.region, MQ.S.stage); };
      $('btnDungeon').onclick = function () { MQ.Game.dungeonPick(); };
    },

    /* =====================================================================
     * 전투 화면
     * ===================================================================== */
    paintBattleHeads: function (B) {
      var S = MQ.S;
      var skin = MQ.ITEM[S.inv.equipped.skin];
      var pet = MQ.ITEM[S.inv.equipped.pet];
      $('btPlayerCard').innerHTML =
        '<div class="who"><span class="ava">' + (skin ? skin.emoji : '🧒') + '</span>' +
        (pet ? '<span class="pet">' + pet.emoji + '</span>' : '') +
        '<b>Lv ' + S.lv + '</b></div>' +
        '<div class="hpbar"><i style="width:' + pct(B.hp, B.hpMax) + '%"></i><span>' + B.hp + ' / ' + B.hpMax + '</span></div>' +
        (B.shield > 0 ? '<div class="shield-chip">🛡️ ×' + B.shield + '</div>' : '');

      var m = B.mon;
      $('btMonCard').innerHTML =
        '<div class="who"><b>' + esc(m.name) + '</b>' + (m.boss ? '<span class="boss-tag">BOSS</span>' : '') + '</div>' +
        '<div class="hpbar mon"><i style="width:' + pct(m.hp, m.hpMax) + '%"></i><span>' + Math.ceil(m.hp / (m.unit || 100)) + ' 남음</span></div>';
      $('btMon').textContent = m.emoji;
      $('btWave').textContent = (B.mi + 1) + ' / ' + B.list.length;
    },

    paintQuestion: function (B) {
      var p = B.p;
      var meta = '<span class="q-type">' + p.icon + ' ' + esc(p.typeName) + '</span>' +
        '<span class="q-rank" style="color:' + MQ.P.rank(p.lv).color + '">' + MQ.P.rank(p.lv).name + '</span>';
      $('btQMeta').innerHTML = meta;
      $('btQText').innerHTML = p.text;
      $('btQSub').innerHTML = p.sub || '';
      $('btQSub').classList.toggle('hidden', !p.sub);
      $('btQSvg').innerHTML = p.svg || '';
      $('btQSvg').classList.toggle('hidden', !p.svg);
      $('btExplain').className = 'bt-explain hidden';
      $('btExplain').innerHTML = '';

      var html = '';
      for (var i = 0; i < p.shuffled.length; i++) {
        html += '<button class="choice" data-c="' + esc(p.shuffled[i]) + '"><span class="ck">' +
          '⬢'.charAt(0) + '</span>' + esc(p.shuffled[i]) + '</button>';
      }
      var box = $('btChoices');
      box.className = 'bt-choices n' + p.shuffled.length;
      box.innerHTML = html;
      var bs = box.querySelectorAll('.choice');
      for (var j = 0; j < bs.length; j++) bs[j].onclick = function () {
        if (this.classList.contains('dim')) return;
        MQ.Snd.play('tap');
        MQ.Battle.answer(this.getAttribute('data-c'));
      };
      UI.paintBattleItems(B);
      $('btTimeFill').style.width = '100%';
    },

    markChoice: function (choice, ok, answer) {
      var bs = document.querySelectorAll('#btChoices .choice');
      for (var i = 0; i < bs.length; i++) {
        var v = bs[i].getAttribute('data-c');
        bs[i].classList.add('locked');
        if (v === choice) bs[i].classList.add(ok ? 'right' : 'wrong');
        if (!ok && answer != null && v === answer) bs[i].classList.add('right');
      }
    },
    dimChoices: function (list) {
      var bs = document.querySelectorAll('#btChoices .choice');
      for (var i = 0; i < bs.length; i++) if (list.indexOf(bs[i].getAttribute('data-c')) >= 0) bs[i].classList.add('dim');
    },
    showExplain: function (p) {
      var e = $('btExplain');
      e.className = 'bt-explain on';
      e.innerHTML = '<b>정답 ' + esc(p.answer) + '</b> · ' + esc(p.explain);
    },
    showHint: function (p) {
      var masked = String(p.explain).split(String(p.answer)).join('○○');
      var e = $('btExplain');
      e.className = 'bt-explain hint';
      e.innerHTML = '💡 ' + esc(masked);
    },
    paintBattleItems: function (B) {
      var S = MQ.S;
      var ids = ['hint', 'fifty', 'time', 'shield', 'potion'];
      var html = '';
      for (var i = 0; i < ids.length; i++) {
        var it = MQ.SHOP_MAP[ids[i]], n = MQ.P.count(S, ids[i]);
        html += '<button class="sk-btn' + (n ? '' : ' empty') + '" data-it="' + ids[i] + '">' +
          it.emoji + '<span>' + n + '</span></button>';
      }
      var box = $('btSkills');
      box.innerHTML = html;
      var bs = box.querySelectorAll('.sk-btn');
      for (var j = 0; j < bs.length; j++) bs[j].onclick = function () {
        var id = this.getAttribute('data-it');
        if (!MQ.P.count(MQ.S, id)) { MQ.FX.toast('상점에서 살 수 있어요', 'warn'); return; }
        MQ.Battle.useItem(id);
      };
    },

    /* =====================================================================
     * 결과
     * ===================================================================== */
    showResult: function (res, B, opt) {
      var S = MQ.S;
      var html = '<div class="res ' + (res.win ? 'win' : 'lose') + '">';
      html += '<h2>' + (res.win ? '🎉 승리!' : '💤 쓰러졌어요') + '</h2>';
      html += '<p class="res-sub">' + (res.win
        ? '문제 ' + B.right + '개 명중 · 최고 콤보 ' + res.combo + (res.perfect ? ' · <b class="gold">무패!</b>' : '')
        : '괜찮아요. 다시 도전하면 돼요!') + '</p>';

      if (res.win) {
        html += '<div class="res-rw">' +
          '<div class="rw"><span>⭐</span><b>+' + res.exp + '</b><i>경험치</i></div>' +
          '<div class="rw"><span>💰</span><b>+' + res.gold + '</b><i>골드</i></div>' +
          (res.gem ? '<div class="rw"><span>💎</span><b>+' + res.gem + '</b><i>보석</i></div>' : '') +
          '</div>';
        if (res.levelUps) {
          html += '<div class="res-lv">🎊 레벨 업! <b>Lv ' + S.lv + '</b>' +
            (res.levelUps > 1 ? ' (' + res.levelUps + '번)' : '') + '</div>';
        }
        if (res.items.length) {
          html += '<div class="res-items">';
          for (var i = 0; i < res.items.length; i++) {
            var c = res.items[i];
            html += '<div class="drop r' + c.item.rar + '">' +
              '<span class="d-e">' + c.item.emoji + '</span>' +
              '<b>' + esc(c.item.name) + '</b>' +
              '<i style="color:' + c.rar.color + '">' + c.rar.name + '</i>' +
              (c.dup ? '<u>중복 → 골드</u>' : '<u class="new">NEW</u>') + '</div>';
          }
          html += '</div>';
        }
      }
      if (res.ach && res.ach.length) {
        html += '<div class="res-ach">';
        for (var a = 0; a < res.ach.length; a++)
          html += '<div class="ach-pop">🏅 ' + esc(res.ach[a].name) + ' <span>' + esc(res.ach[a].desc) + '</span></div>';
        html += '</div>';
      }

      var rk = MQ.P.rank(S.diff);
      html += '<p class="res-diff">지금 난이도 <b style="color:' + rk.color + '">' + rk.name + '</b> (Lv ' + S.diff + ')</p>';
      html += '<div class="res-btns">' +
        (res.win ? '<button class="big-btn primary" id="rsNext">다음 판 ▶</button>' : '<button class="big-btn primary" id="rsRetry">🔁 다시 도전</button>') +
        '<button class="big-btn ghost" id="rsMap">지도로</button></div>';
      html += '</div>';

      UI.modal(html, { wide: true, noClose: true });
      if (res.win) {
        MQ.Snd.play(res.levelUps ? 'levelup' : 'win');
        if (res.levelUps) MQ.FX.rain('⭐', 22);
        var best = 0;
        for (var q = 0; q < res.items.length; q++) best = Math.max(best, res.items[q].item.rar);
        if (best >= 3) { MQ.FX.rain('✨', 26); MQ.Snd.play('rare'); }
      }
      var n = $('rsNext'); if (n) n.onclick = function () {
        UI.closeModal();
        if (opt.kind === 'dungeon') MQ.Game.dungeonPick();
        else MQ.Game.startStage(MQ.S.region, MQ.S.stage);
      };
      var r = $('rsRetry'); if (r) r.onclick = function () {
        UI.closeModal();
        if (opt.kind === 'dungeon') MQ.Game.dungeonPick();
        else MQ.Game.startStage(opt.region, opt.stage);
      };
      $('rsMap').onclick = function () { UI.closeModal(); UI.show('map'); };
    },

    /* =====================================================================
     * 가방(장비)
     * ===================================================================== */
    paintBag: function () {
      var S = MQ.S;
      var g = MQ.P.gear(S);
      var html = '<div class="stat-card">' +
        '<div class="st"><span>⚔️</span><b>' + Math.round(MQ.P.atk(S)) + '</b><i>공격</i></div>' +
        '<div class="st"><span>🛡️</span><b>' + Math.round(MQ.P.def(S)) + '</b><i>방어</i></div>' +
        '<div class="st"><span>❤️</span><b>' + MQ.P.hpMax(S) + '</b><i>체력</i></div>' +
        '<div class="st"><span>💥</span><b>' + Math.round(MQ.P.crit(S) * 100) + '%</b><i>치명타</i></div>' +
        '<div class="st"><span>⭐</span><b>×' + g.exp.toFixed(2) + '</b><i>경험치</i></div>' +
        '<div class="st"><span>💰</span><b>×' + g.gold.toFixed(2) + '</b><i>골드</i></div>' +
        '</div>';

      /* 스킬포인트로 올리는 영구 능력 */
      html += '<div class="perk-box' + (S.sp > 0 ? ' has' : '') + '">' +
        '<div class="perk-h"><b>✨ 스킬포인트</b><i>남은 포인트 ' + S.sp + '개</i></div>' +
        '<div class="perk-grid">';
      var PERKS = [['atk', '⚔️', '공격력', '+2'], ['def', '🛡️', '방어력', '+2'], ['hp', '❤️', '체력', '+10'],
      ['time', '⏳', '문제 시간', '+0.6초'], ['luck', '🍀', '행운', '희귀 확률 +6%']];
      for (var pi = 0; pi < PERKS.length; pi++) {
        var pk = PERKS[pi];
        html += '<button class="perk" data-perk="' + pk[0] + '"' + (S.sp > 0 ? '' : ' disabled') + '>' +
          '<span>' + pk[1] + '</span><b>' + pk[2] + '</b>' +
          '<i>Lv ' + (S.perks[pk[0]] || 0) + '</i><u>' + pk[3] + '</u></button>';
      }
      html += '</div></div>';

      html += '<div class="slots">';
      for (var i = 0; i < MQ.SLOTS.length; i++) {
        var sl = MQ.SLOTS[i], it = MQ.ITEM[S.inv.equipped[sl.key]];
        html += '<div class="slot' + (it ? ' r' + it.rar : '') + '" data-slot="' + sl.key + '">' +
          '<span class="s-i">' + (it ? it.emoji : sl.icon) + '</span>' +
          '<b>' + (it ? esc(it.name) : '비어 있음') + '</b><i>' + sl.name + '</i></div>';
      }
      html += '</div>';

      html += '<h3 class="sec">🎒 가진 장비</h3><div class="item-grid">';
      var owned = [];
      for (var id in S.inv.owned) if (MQ.ITEM[id]) owned.push(MQ.ITEM[id]);
      owned.sort(function (a, b) { return b.rar - a.rar; });
      if (!owned.length) html += '<p class="empty-note">아직 없어요. 몬스터를 물리치면 상자가 나와요!</p>';
      for (var j = 0; j < owned.length; j++) {
        var o = owned[j], eqd = S.inv.equipped[o.slot] === o.id;
        html += '<button class="item r' + o.rar + (eqd ? ' eq' : '') + '" data-item="' + o.id + '">' +
          '<span class="i-e">' + o.emoji + '</span><b>' + esc(o.name) + '</b>' +
          '<i style="color:' + MQ.RARITY[o.rar].color + '">' + MQ.RARITY[o.rar].name + '</i>' +
          '<u>' + (o.atk ? '⚔' + o.atk + ' ' : '') + (o.def ? '🛡' + o.def : '') + '</u>' +
          (eqd ? '<em>착용중</em>' : '') + '</button>';
      }
      html += '</div>';

      html += '<h3 class="sec">🧪 가진 아이템</h3><div class="pot-grid">';
      for (var k = 0; k < MQ.SHOP.length; k++) {
        var sp = MQ.SHOP[k], n = MQ.P.count(S, sp.id);
        if (sp.id === 'chest' || sp.id === 'bigchest') continue;
        html += '<div class="pot"><span>' + sp.emoji + '</span><b>' + esc(sp.name) + '</b><i>' + n + '개</i></div>';
      }
      html += '</div>';

      $('bagBody').innerHTML = html;
      var items = document.querySelectorAll('#bagBody .item');
      for (var m = 0; m < items.length; m++) items[m].onclick = function () {
        var it = MQ.ITEM[this.getAttribute('data-item')];
        if (MQ.S.inv.equipped[it.slot] === it.id) MQ.P.unequip(MQ.S, it.slot);
        else MQ.P.equip(MQ.S, it.id);
        MQ.Snd.play('tap'); MQ.Game.save(); UI.paintBag(); UI.paintHud();
      };
      var perks = document.querySelectorAll('#bagBody .perk');
      for (var p2 = 0; p2 < perks.length; p2++) perks[p2].onclick = function () {
        if (MQ.S.sp <= 0) { MQ.FX.toast('레벨을 올리면 포인트가 생겨요', 'warn'); return; }
        var k = this.getAttribute('data-perk');
        MQ.S.sp--; MQ.S.perks[k] = (MQ.S.perks[k] || 0) + 1;
        if (k === 'hp') MQ.S.hp = MQ.P.hpMax(MQ.S);
        MQ.Snd.play('levelup'); MQ.FX.toast('능력이 올랐어요!');
        MQ.Game.save(); UI.paintBag(); UI.paintHud();
      };
      var slots = document.querySelectorAll('#bagBody .slot');
      for (var s2 = 0; s2 < slots.length; s2++) slots[s2].onclick = function () {
        MQ.P.unequip(MQ.S, this.getAttribute('data-slot'));
        MQ.Snd.play('tap'); MQ.Game.save(); UI.paintBag(); UI.paintHud();
      };
    },

    /* =====================================================================
     * 도감
     * ===================================================================== */
    paintCodex: function (tab) {
      var S = MQ.S;
      tab = tab || UI._codexTab || 'mon';
      UI._codexTab = tab;
      var html = '<div class="tabs">' +
        '<button data-t="mon" class="' + (tab === 'mon' ? 'on' : '') + '">👾 몬스터</button>' +
        '<button data-t="item" class="' + (tab === 'item' ? 'on' : '') + '">🎁 아이템</button>' +
        '<button data-t="type" class="' + (tab === 'type' ? 'on' : '') + '">🧠 문제</button>' +
        '<button data-t="ach" class="' + (tab === 'ach' ? 'on' : '') + '">🏅 업적</button>' +
        '</div>';

      if (tab === 'mon') {
        var all = [], i, j;
        for (i = 0; i < MQ.REGIONS.length; i++) {
          for (j = 0; j < MQ.REGIONS[i].mons.length; j++) all.push({ m: MQ.REGIONS[i].mons[j], r: MQ.REGIONS[i] });
          all.push({ m: MQ.REGIONS[i].boss, r: MQ.REGIONS[i], boss: 1 });
        }
        var seen = 0;
        for (i = 0; i < all.length; i++) if (S.codex.mon[all[i].m.name]) seen++;
        html += '<p class="dex-count">' + seen + ' / ' + all.length + ' 종 발견</p><div class="dex-grid">';
        for (i = 0; i < all.length; i++) {
          var f = !!S.codex.mon[all[i].m.name];
          html += '<div class="dex' + (f ? '' : ' unk') + (all[i].boss ? ' boss' : '') + '">' +
            '<span class="d-e">' + (f ? all[i].m.emoji : '❔') + '</span>' +
            '<b>' + (f ? esc(all[i].m.name) : '???') + '</b>' +
            '<i>' + all[i].r.emoji + ' ' + esc(all[i].r.name) + '</i></div>';
        }
        html += '</div>';
      } else if (tab === 'item') {
        var have = Object.keys(S.codex.item).length;
        html += '<p class="dex-count">' + have + ' / ' + MQ.ITEMS.length + ' 종 수집</p><div class="dex-grid">';
        for (var k = 0; k < MQ.ITEMS.length; k++) {
          var it = MQ.ITEMS[k], f2 = !!S.codex.item[it.id];
          html += '<div class="dex r' + it.rar + (f2 ? '' : ' unk') + '">' +
            '<span class="d-e">' + (f2 ? it.emoji : '❔') + '</span>' +
            '<b>' + (f2 ? esc(it.name) : '???') + '</b>' +
            '<i style="color:' + MQ.RARITY[it.rar].color + '">' + MQ.RARITY[it.rar].name + '</i></div>';
        }
        html += '</div>';
      } else if (tab === 'type') {
        var types = MQ.Gen.list();
        var got = Object.keys(S.codex.type).length;
        html += '<p class="dex-count">' + got + ' / ' + types.length + ' 종 경험</p><div class="dex-grid">';
        for (var t = 0; t < types.length; t++) {
          var ty = types[t], f3 = !!S.codex.type[ty.id];
          var bt = (S.stats.byType && S.stats.byType[ty.id]) || { n: 0, ok: 0 };
          html += '<div class="dex' + (f3 ? '' : ' unk') + '">' +
            '<span class="d-e">' + (f3 ? ty.icon : '❔') + '</span>' +
            '<b>' + (f3 ? esc(ty.name) : '???') + '</b>' +
            '<i style="color:' + MQ.SKILLS[ty.skill].color + '">' + MQ.SKILLS[ty.skill].name +
            (bt.n ? ' · ' + Math.round(bt.ok / bt.n * 100) + '%' : '') + '</i></div>';
        }
        html += '</div>';
      } else {
        var done = MQ.Prog.achCount(S);
        html += '<p class="dex-count">' + done + ' / ' + MQ.ACH.length + ' 업적 달성</p><div class="ach-list">';
        for (var a = 0; a < MQ.ACH.length; a++) {
          var ac = MQ.ACH[a], has = !!S.badges[ac.id];
          html += '<div class="ach' + (has ? ' on' : '') + '">' +
            '<span class="a-e">' + (has ? ac.emoji : '🔒') + '</span>' +
            '<div><b>' + esc(ac.name) + '</b><i>' + esc(ac.desc) + '</i></div>' +
            '<u>' + (has ? '완료' : '💰' + ac.gold + (ac.gem ? ' 💎' + ac.gem : '')) + '</u></div>';
        }
        html += '</div>';
      }

      $('codexBody').innerHTML = html;
      var tb = document.querySelectorAll('#codexBody .tabs button');
      for (var z = 0; z < tb.length; z++) tb[z].onclick = function () {
        MQ.Snd.play('tap'); UI.paintCodex(this.getAttribute('data-t'));
      };
    },

    /* =====================================================================
     * 미션 · 시즌
     * ===================================================================== */
    paintQuests: function () {
      var S = MQ.S;
      MQ.Prog.ensureMissions(S);
      var si = MQ.Prog.seasonInfo();
      var html = '<div class="season" style="border-color:' + si.color + '">' +
        '<div class="se-h"><span>' + si.emoji + '</span><b>' + esc(si.name) + '</b>' +
        '<i>시즌 ' + si.no + ' · ' + S.season.pt + '점</i></div><div class="pass">';
      for (var i = 0; i < MQ.SEASON_PASS.length; i++) {
        var p = MQ.SEASON_PASS[i];
        var taken = S.season.taken.indexOf(i) >= 0;
        var can = S.season.pt >= p.at && !taken;
        var label = p.gold ? '💰' + p.gold : p.gem ? '💎' + p.gem : '🎁' + MQ.RARITY[p.item].name;
        html += '<button class="pass-i' + (taken ? ' taken' : can ? ' can' : '') + '" data-sp="' + i + '">' +
          '<b>' + label + '</b><i>' + p.at + '점</i></button>';
      }
      html += '</div></div>';

      html += UI._missionBlock(S.daily, 'daily', '🎯 오늘의 미션', '내일 아침에 새로 나와요');
      html += UI._missionBlock(S.weekly, 'weekly', '🗓️ 이번 주 미션', '월요일에 새로 나와요');

      $('questBody').innerHTML = html;
      var cs = document.querySelectorAll('#questBody .claim');
      for (var c = 0; c < cs.length; c++) cs[c].onclick = function () {
        var m = MQ.Prog.claim(MQ.S, this.getAttribute('data-kind'), +this.getAttribute('data-i'));
        if (m) {
          MQ.Snd.play('coin'); MQ.FX.toast('💰 ' + m.gold + (m.gem ? ' · 💎' + m.gem : '') + ' 받았어요!');
          var got = MQ.Prog.checkAch(MQ.S);
          for (var g = 0; g < got.length; g++) MQ.FX.toast('🏅 ' + got[g].name, 'ach');
          MQ.Game.save(); UI.paintQuests(); UI.paintHud();
        }
      };
      var sp = document.querySelectorAll('#questBody .pass-i');
      for (var s = 0; s < sp.length; s++) sp[s].onclick = function () {
        var got = MQ.Prog.claimSeason(MQ.S, +this.getAttribute('data-sp'));
        if (!got) { MQ.FX.toast('아직 점수가 모자라요', 'warn'); return; }
        MQ.Snd.play('rare'); MQ.FX.rain('✨', 16);
        MQ.FX.toast('시즌 보상을 받았어요!');
        MQ.Game.save(); UI.paintQuests(); UI.paintHud();
      };
    },
    _missionBlock: function (box, kind, title, note) {
      if (!box) return '';
      var html = '<h3 class="sec">' + title + ' <small>' + note + '</small></h3><div class="mis-list">';
      for (var i = 0; i < box.list.length; i++) {
        var m = box.list[i];
        html += '<div class="mis' + (m.taken ? ' taken' : m.done ? ' done' : '') + '">' +
          '<span class="m-e">' + m.emoji + '</span>' +
          '<div class="m-b"><b>' + esc(m.text) + '</b>' +
          '<div class="m-bar"><i style="width:' + pct(m.prog, m.goal) + '%"></i></div>' +
          '<i>' + m.prog + ' / ' + m.goal + '</i></div>' +
          (m.taken ? '<u>완료</u>' :
            m.done ? '<button class="claim" data-kind="' + kind + '" data-i="' + i + '">받기</button>' :
              '<u>💰' + m.gold + (m.gem ? ' 💎' + m.gem : '') + '</u>') +
          '</div>';
      }
      return html + '</div>';
    },

    /* =====================================================================
     * 상점
     * ===================================================================== */
    paintShop: function () {
      var S = MQ.S;
      var html = '<p class="shop-note">모험에 필요한 것들을 살 수 있어요.</p><div class="shop-grid">';
      for (var i = 0; i < MQ.SHOP.length; i++) {
        var it = MQ.SHOP[i];
        var price = it.gem ? (it.gem + ' 💎') : (it.price + ' 💰');
        var can = it.gem ? S.gem >= it.gem : S.gold >= it.price;
        html += '<button class="buy' + (can ? '' : ' no') + '" data-buy="' + it.id + '">' +
          '<span class="b-e">' + it.emoji + '</span><b>' + esc(it.name) + '</b>' +
          '<i>' + esc(it.desc) + '</i><u>' + price + '</u>' +
          '<em>' + (it.id === 'chest' || it.id === 'bigchest' ? '' : '가진 개수 ' + MQ.P.count(S, it.id)) + '</em></button>';
      }
      html += '</div>';
      $('shopBody').innerHTML = html;
      var bs = document.querySelectorAll('#shopBody .buy');
      for (var j = 0; j < bs.length; j++) bs[j].onclick = function () { UI.buy(this.getAttribute('data-buy')); };
    },
    buy: function (id) {
      var S = MQ.S, it = MQ.SHOP_MAP[id];
      if (!it) return;
      if (it.gem) {
        if (S.gem < it.gem) { MQ.FX.toast('보석이 모자라요', 'warn'); MQ.Snd.play('wrong'); return; }
        S.gem -= it.gem;
      } else {
        if (S.gold < it.price) { MQ.FX.toast('골드가 모자라요', 'warn'); MQ.Snd.play('wrong'); return; }
        S.gold -= it.price;
      }
      if (id === 'chest' || id === 'bigchest') {
        var c = MQ.Loot.openChest(S, id === 'bigchest' ? { minRar: 1, luck: 2.5 } : {});
        MQ.Prog.mission(S, 'chest', 1);
        UI.modal('<div class="drop-big r' + c.item.rar + '">' +
          '<span>' + c.item.emoji + '</span><h2>' + esc(c.item.name) + '</h2>' +
          '<p style="color:' + c.rar.color + '">' + c.rar.name + '</p>' +
          '<small>' + (c.dup ? '이미 있어서 골드로 바꿨어요' : '새 아이템이에요!') + '</small></div>');
        if (c.item.rar >= 3) MQ.FX.rain('✨', 20);
      } else {
        MQ.P.give(S, id, 1);
        MQ.Snd.play('coin');
        MQ.FX.toast(it.emoji + ' ' + it.name + ' 을(를) 샀어요!');
      }
      var got = MQ.Prog.checkAch(S);
      for (var g = 0; g < got.length; g++) MQ.FX.toast('🏅 ' + got[g].name, 'ach');
      MQ.Game.save(); UI.paintShop(); UI.paintHud();
    },

    /* =====================================================================
     * 공용 모달 · 메뉴
     * ===================================================================== */
    modal: function (html, opt) {
      opt = opt || {};
      var wrap = $('modal');
      wrap.innerHTML = '<div class="modal-box' + (opt.wide ? ' wide' : '') + '">' +
        (opt.noClose ? '' : '<button class="mo-x" id="moX">✕</button>') + html + '</div>';
      wrap.classList.add('on');
      var x = $('moX');
      if (x) x.onclick = UI.closeModal;
      if (!opt.noClose) wrap.onclick = function (e) { if (e.target === wrap) UI.closeModal(); };
      else wrap.onclick = null;
    },
    closeModal: function () { var w = $('modal'); w.classList.remove('on'); w.innerHTML = ''; },

    menu: function () {
      var S = MQ.S;
      var html = '<h2>⚙️ 설정</h2><div class="menu-list">' +
        '<button data-m="sound">' + (MQ.Snd.isOn() ? '🔊 소리 켜짐' : '🔇 소리 꺼짐') + '</button>' +
        '<button data-m="how">❓ 게임 방법</button>' +
        '<button data-m="parent">👨‍👩‍👧 보호자 보기</button>' +
        '<button data-m="reset">🗑️ 처음부터 다시</button>' +
        '</div><p class="menu-note">기록은 이 기기에 자동으로 저장돼요.</p>';
      UI.modal(html);
      var bs = document.querySelectorAll('#modal .menu-list button');
      for (var i = 0; i < bs.length; i++) bs[i].onclick = function () {
        var m = this.getAttribute('data-m');
        if (m === 'sound') { MQ.Snd.setOn(!MQ.Snd.isOn()); S.settings.sound = MQ.Snd.isOn(); MQ.Game.save(); UI.menu(); }
        else if (m === 'how') UI.howTo();
        else if (m === 'parent') UI.parent();
        else if (m === 'reset') UI.confirmReset();
      };
    },

    howTo: function () {
      UI.modal('<h2>❓ 게임 방법</h2>' +
        '<ul class="how">' +
        '<li>⚔️ <b>정답을 고르면 몬스터를 때려요.</b> 틀리면 내가 맞아요.</li>' +
        '<li>🔥 <b>연속으로 맞히면 콤보!</b> 5콤보마다 필살기가 터지고 경험치가 ×2, ×3, ×5, ×10 으로 커져요.</li>' +
        '<li>🎁 몬스터를 물리치면 상자가 나와요. 무기·펫·날개·탈것을 모아 더 세지세요.</li>' +
        '<li>🧠 문제는 스스로 난이도를 맞춰요. 잘 맞히면 어려워지고, 어려우면 쉬워져요.</li>' +
        '<li>🗺️ 레벨이 오르면 새 지역이 열려요. 마지막에는 우주까지!</li>' +
        '<li>🗝️ 랜덤 던전은 들어갈 때마다 규칙과 보상이 달라져요.</li>' +
        '</ul>');
    },

    confirmReset: function () {
      UI.modal('<h2>정말 처음부터 다시 할까요?</h2><p class="warn-p">레벨·아이템·업적이 모두 사라져요.</p>' +
        '<div class="res-btns"><button class="big-btn danger" id="doReset">네, 지울게요</button>' +
        '<button class="big-btn ghost" id="noReset">아니요</button></div>');
      $('doReset').onclick = function () { MQ.Save.clear(); location.reload(); };
      $('noReset').onclick = UI.closeModal;
    },

    /* ---------------- 보호자 대시보드(숨김) ---------------- */
    parent: function () {
      var S = MQ.S;
      var rep = MQ.Diff.report(S);
      var weak = MQ.Diff.weakTypes(S, 6);
      var days = S.stats.days || {}, keys = Object.keys(days).sort().slice(-7);
      var totalMin = 0, i;
      for (i = 0; i < keys.length; i++) totalMin += (days[keys[i]].ms || 0) / 60000;

      var html = '<h2>👨‍👩‍👧 보호자 보기</h2><p class="p-note">아이에게는 보이지 않는 화면이에요.</p>';
      html += '<div class="p-sum"><div><b>' + (S.stats.solved || 0) + '</b><i>푼 문제</i></div>' +
        '<div><b>' + (S.stats.solved ? Math.round(S.stats.correct / S.stats.solved * 100) : 0) + '%</b><i>정답률</i></div>' +
        '<div><b>Lv ' + S.diff + '</b><i>현재 난이도</i></div>' +
        '<div><b>' + Object.keys(days).length + '일</b><i>플레이한 날</i></div></div>';

      html += '<h3 class="sec">분야별 실력</h3><div class="p-bars">';
      for (i = 0; i < rep.length; i++) {
        var r = rep[i];
        html += '<div class="p-bar"><span>' + r.icon + ' ' + esc(r.name) + '</span>' +
          '<div class="pb"><i style="width:' + Math.round(r.acc * 100) + '%;background:' + r.color + '"></i></div>' +
          '<b>' + (r.n ? Math.round(r.acc * 100) + '%' : '–') + '</b>' +
          '<u>' + r.n + '문제 · Lv' + r.lv + (r.avgSec ? ' · 평균 ' + r.avgSec.toFixed(1) + '초' : '') + '</u></div>';
      }
      html += '</div>';

      if (weak.length) {
        html += '<h3 class="sec">더 연습하면 좋은 유형</h3><div class="p-weak">';
        for (i = 0; i < weak.length; i++)
          html += '<div class="pw"><span>' + weak[i].icon + '</span><b>' + esc(weak[i].name) + '</b>' +
            '<i>' + Math.round(weak[i].acc * 100) + '% (' + weak[i].n + '문제)</i></div>';
        html += '</div>';
      }

      html += '<h3 class="sec">최근 7일</h3><div class="p-days">';
      for (i = 0; i < keys.length; i++) {
        var d = days[keys[i]];
        html += '<div class="pd"><b>' + d.n + '</b><i>' + keys[i].slice(5) + '</i>' +
          '<u>' + (d.n ? Math.round(d.ok / d.n * 100) : 0) + '%</u></div>';
      }
      if (!keys.length) html += '<p class="empty-note">아직 기록이 없어요.</p>';
      html += '</div>';
      html += '<p class="p-note">최근 7일 플레이 시간 합계 약 ' + Math.round(totalMin) + '분.</p>';

      UI.modal(html, { wide: true });
    }
  };
})();
