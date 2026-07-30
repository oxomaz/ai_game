/* =====================================================================
 * ui.js — 화면 그리기 전부
 * ---------------------------------------------------------------------
 * 화면은 index.html 의 <section class="screen"> 을 갈아 끼우는 방식.
 * 규칙 계산은 하지 않고, 데이터 → HTML 변환만 한다.
 *
 * 이 파일의 약속:
 *  - 모든 화면 맨 위에는 "여기가 무엇을 하는 곳인지" 한 줄 설명(helpLine)이 있다.
 *  - 누를 수 있는 것(아이템·장비·몬스터·문제유형·업적·상점)은 누르면
 *    무엇인지 설명해 주는 카드(UI.sheet)가 뜬다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function pct(a, b) { return Math.max(0, Math.min(100, b ? a / b * 100 : 0)); }

  var cur = 'title';
  var mapReady = false;

  /* 화면마다 위에 붙는 안내 한 줄 */
  var HELP = {
    map: '⚔️ 길 위의 칸을 눌러 몬스터와 싸워요. 이기면 다음 칸으로 한 걸음 나아가요.',
    bag: '🎒 장비를 누르면 무엇이 좋아지는지 알려줘요. 좋은 걸 골라 끼면 더 세져요.',
    codex: '📖 만난 몬스터·모은 아이템·풀어 본 문제가 여기 모여요. 눌러서 자세히 보세요.',
    quest: '🎯 미션을 끝내면 골드와 보석을 받아요. 오늘 것과 이번 주 것이 따로 있어요.',
    shop: '🛒 골드로 도우미를 사요. 전투 중에 힘들 때 쓰면 큰 도움이 돼요.'
  };
  function helpLine(k) { return '<p class="help-line">' + HELP[k] + '</p>'; }

  var UI = MQ.UI = {

    /* ---------------- 화면 전환 ---------------- */
    show: function (name, opt) {
      opt = opt || {};
      var list = document.querySelectorAll('.screen');
      for (var i = 0; i < list.length; i++) list[i].classList.toggle('on', list[i].id === 'sc-' + name);
      cur = name;
      document.body.classList.toggle('in-battle', name === 'battle');
      document.body.classList.toggle('in-map', name === 'map');
      var nav = $('nav');
      if (nav) nav.classList.toggle('hidden', name === 'battle' || name === 'title' || name === 'assess');
      var tabs = document.querySelectorAll('#nav button');
      for (var j = 0; j < tabs.length; j++) tabs[j].classList.toggle('on', tabs[j].getAttribute('data-go') === name);

      if (name === 'map') UI.paintMap(opt.walk !== false);
      if (name === 'bag') UI.paintBag();
      if (name === 'codex') UI.paintCodex();
      if (name === 'quest') UI.paintQuests();
      if (name === 'shop') UI.paintShop();
      UI.paintHud();
      UI.music();
      window.scrollTo(0, 0);
    },
    current: function () { return cur; },

    /* 화면에 맞는 배경음악 */
    music: function () {
      try {
        if (!MQ.Bgm) return;
        var kind = MQ.Battle && MQ.Battle.active() && MQ.Battle.state() ? MQ.Battle.state().kind : null;
        MQ.Bgm.play(MQ.Bgm.forScreen(cur, MQ.S ? MQ.S.region : 0, kind));
      } catch (e) { }
    },

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
        (S.sp > 0 ? '<span class="sp-dot">✨' + S.sp + '</span>' : '') +
        '<div class="xp"><i style="width:' + pct(S.exp, need) + '%"></i></div>' +
        '</div></div>' +
        '<div class="hud-r">' +
        '<span class="pill">💰 ' + S.gold + '</span>' +
        '<span class="pill">💎 ' + S.gem + '</span>' +
        '<button class="pill ghost" id="btnMenu" title="설정">⚙️</button>' +
        '</div>';
      var b = $('btnMenu'); if (b) b.onclick = UI.menu;
      var badge = $('navQuestDot');
      if (badge) badge.classList.toggle('on', MQ.Prog.pendingRewards(MQ.S) > 0);
    },

    /* =====================================================================
     * 지도 — 세계지도 위를 걸어 다닌다
     * ===================================================================== */
    paintMap: function (walk) {
      var S = MQ.S;

      /* 지역 칩 */
      var open = MQ.P.unlockedRegions(S), html = '';
      for (var i = 0; i < MQ.REGIONS.length; i++) {
        var r = MQ.REGIONS[i], lock = i >= open;
        html += '<button class="rg' + (i === S.region ? ' on' : '') + (lock ? ' lock' : '') + '" data-rg="' + i + '">' +
          '<span class="rg-e">' + r.emoji + '</span><span class="rg-n">' + esc(r.name) + '</span>' +
          (lock ? '<span class="rg-l">🔒 Lv' + r.unlock + '</span>' : '') + '</button>';
      }
      $('regionStrip').innerHTML = html;
      var rgs = document.querySelectorAll('#regionStrip .rg');
      for (var a = 0; a < rgs.length; a++) rgs[a].onclick = function () {
        var i = +this.getAttribute('data-rg');
        if (i >= MQ.P.unlockedRegions(MQ.S)) {
          UI.sheet('<div class="sh-head"><span class="sh-e">🔒</span><div><b>' + esc(MQ.REGIONS[i].name) + '</b>' +
            '<i>Lv ' + MQ.REGIONS[i].unlock + ' 부터 갈 수 있어요</i></div></div>' +
            '<p class="sh-p">' + esc(MQ.REGIONS[i].desc) + '</p>' +
            '<p class="sh-p">지금 레벨은 <b>Lv ' + MQ.S.lv + '</b> 이에요. 앞 지역에서 조금만 더 모험하면 열려요!</p>');
          MQ.Snd.play('wrong'); return;
        }
        MQ.S.region = i;
        var st = 0;
        while (st < MQ.REGIONS[i].stages - 1 && MQ.S.cleared[i + '-' + st]) st++;
        MQ.S.stage = st;
        MQ.Snd.play('tap'); MQ.Game.save();
        MQ.World.lookAt(i);
        UI.paintMap(false);
        UI.music();
      };

      /* 캔버스 지도 */
      if (!mapReady) {
        MQ.World.attach($('worldCv'), UI.pickNode);
        mapReady = true;
        MQ.World.goto(S.region, S.stage, false);
      } else {
        MQ.World.refresh();
        MQ.World.goto(S.region, S.stage, !!walk);
      }

      /* 아래 버튼 + 능력치 */
      var b2 = '<div class="map-actions">' +
        '<button class="big-btn primary" id="btnFight">⚔️ 모험 계속하기</button>' +
        '<button class="big-btn" id="btnDungeon">🗝️ 랜덤 던전</button></div>' +
        helpLine('map');

      b2 += '<h3 class="sec">🧠 내 능력치 <small>문제를 맞힌 분야가 자라요</small></h3><div class="skill-strip">';
      for (var k = 0; k < MQ.SKILL_IDS.length; k++) {
        var sk = MQ.SKILL_IDS[k], m = MQ.SKILLS[sk];
        var lvv = S.skillLv[sk] || 1, ex = S.skillExp[sk] || 0, nd = MQ.P.skillNeed(lvv);
        b2 += '<button class="sk" data-skill="' + sk + '"><span class="sk-i">' + m.icon + '</span>' +
          '<b>' + esc(m.name) + '</b><span class="sk-lv">Lv' + lvv + '</span>' +
          '<div class="sk-bar"><i style="width:' + pct(ex, nd) + '%;background:' + m.color + '"></i></div></button>';
      }
      b2 += '</div>';
      $('mapBody').innerHTML = b2;

      $('btnFight').onclick = function () { MQ.Game.startStage(MQ.S.region, MQ.S.stage); };
      $('btnDungeon').onclick = function () { MQ.Game.dungeonPick(); };
      var sks = document.querySelectorAll('#mapBody .sk');
      for (var s2 = 0; s2 < sks.length; s2++) sks[s2].onclick = function () { UI.skillDetail(this.getAttribute('data-skill')); };

      UI.showNodeCard(null);
    },

    /* 지도에서 칸을 눌렀을 때 — 설명 카드 */
    pickNode: function (nd, canGo) {
      MQ.Snd.play('tap');
      UI.showNodeCard(nd, canGo);
    },

    showNodeCard: function (nd, canGo) {
      var box = $('nodeCard');
      if (!nd) {
        var S0 = MQ.S, r0 = MQ.REGIONS[S0.region];
        box.className = 'node-card';
        box.innerHTML = '<div class="nc-i">' + r0.emoji + '</div>' +
          '<div class="nc-b"><b>' + esc(r0.name) + ' · ' + (S0.stage + 1) + '단계</b>' +
          '<i>' + esc(r0.desc) + '</i></div>' +
          '<button class="nc-go" id="ncGo">도전 ▶</button>';
        var g0 = $('ncGo'); if (g0) g0.onclick = function () { MQ.Game.startStage(MQ.S.region, MQ.S.stage); };
        return;
      }
      var r = MQ.REGIONS[nd.region];
      var done = !!MQ.S.cleared[nd.region + '-' + nd.stage];
      var title, desc, icon;
      if (nd.region >= MQ.P.unlockedRegions(MQ.S)) {
        icon = '🔒'; title = r.name + ' · 아직 잠김';
        desc = 'Lv ' + r.unlock + ' 이 되면 이 지역으로 갈 수 있어요.';
      } else if (nd.boss) {
        icon = r.boss.emoji; title = r.name + ' 보스 · ' + r.boss.name;
        desc = '문제 ' + r.boss.q + '개를 연속으로 이겨야 해요. 실수하면 크게 아파요!' + (done ? ' (이미 물리쳤어요)' : '');
      } else {
        icon = done ? '⭐' : '⚔️';
        var mons = Math.min(3, 1 + Math.floor(nd.stage / 4)), qq = 5 + Math.floor(nd.stage / 3);
        title = r.name + ' · ' + (nd.stage + 1) + '단계';
        desc = '몬스터 ' + mons + '마리 · 한 마리에 문제 약 ' + qq + '개' + (done ? ' · 이미 깬 곳이에요' : '');
      }
      box.className = 'node-card on' + (canGo ? '' : ' locked');
      box.innerHTML = '<div class="nc-i">' + icon + '</div>' +
        '<div class="nc-b"><b>' + esc(title) + '</b><i>' + esc(desc) + '</i></div>' +
        (canGo ? '<button class="nc-go" id="ncGo">도전 ▶</button>' : '<span class="nc-lock">🔒</span>');
      var g = $('ncGo');
      if (g) g.onclick = function () { MQ.Game.startStage(nd.region, nd.stage); };
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
      $('btQMeta').innerHTML = '<span class="q-type">' + p.icon + ' ' + esc(p.typeName) + '</span>' +
        '<span class="q-rank" style="color:' + MQ.P.rank(p.lv).color + '">' + MQ.P.rank(p.lv).name + '</span>';
      $('btQText').innerHTML = p.text;
      $('btQSub').innerHTML = p.sub || '';
      $('btQSub').classList.toggle('hidden', !p.sub);
      $('btQSvg').innerHTML = p.svg || '';
      $('btQSvg').classList.toggle('hidden', !p.svg);
      $('btExplain').className = 'bt-explain hidden';
      $('btExplain').innerHTML = '';

      var html = '';
      for (var i = 0; i < p.shuffled.length; i++) {
        html += '<button class="choice" data-c="' + esc(p.shuffled[i]) + '">' + esc(p.shuffled[i]) + '</button>';
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
        html += '<button class="sk-btn' + (n ? '' : ' empty') + '" data-it="' + ids[i] + '" title="' + esc(it.name + ' — ' + it.desc) + '">' +
          it.emoji + '<span>' + n + '</span><u>' + esc(it.name) + '</u></button>';
      }
      var box = $('btSkills');
      box.innerHTML = html;
      var bs = box.querySelectorAll('.sk-btn');
      for (var j = 0; j < bs.length; j++) bs[j].onclick = function () {
        var id = this.getAttribute('data-it');
        var it = MQ.SHOP_MAP[id];
        if (!MQ.P.count(MQ.S, id)) {
          UI.sheet('<div class="sh-head"><span class="sh-e">' + it.emoji + '</span><div><b>' + esc(it.name) + '</b>' +
            '<i>지금 0개</i></div></div><p class="sh-p">' + esc(it.desc) + '</p>' +
            '<p class="sh-p">상점에서 <b>' + it.price + '💰</b> 에 살 수 있어요.</p>');
          return;
        }
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
            (res.levelUps > 1 ? ' (' + res.levelUps + '번)' : '') +
            '<small>가방에서 ✨스킬포인트를 쓸 수 있어요</small></div>';
        }
        if (res.items.length) {
          html += '<div class="res-items">';
          for (var i = 0; i < res.items.length; i++) {
            var c = res.items[i];
            html += '<button class="drop r' + c.item.rar + '" data-item="' + c.item.id + '">' +
              '<span class="d-e">' + c.item.emoji + '</span>' +
              '<b>' + esc(c.item.name) + '</b>' +
              '<i style="color:' + c.rar.color + '">' + c.rar.name + '</i>' +
              (c.dup ? '<u>중복 → 골드</u>' : '<u class="new">NEW</u>') + '</button>';
          }
          html += '</div><p class="res-tip">아이템을 눌러 보면 무슨 능력인지 알려줘요</p>';
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
        '<button class="big-btn ghost" id="rsMap">🗺️ 지도로</button></div>';
      html += '</div>';

      UI.modal(html, { wide: true, noClose: true });
      if (res.win) {
        MQ.Snd.play(res.levelUps ? 'levelup' : 'win');
        if (res.levelUps) MQ.FX.rain('⭐', 22);
        var best = 0;
        for (var q = 0; q < res.items.length; q++) best = Math.max(best, res.items[q].item.rar);
        if (best >= 3) { MQ.FX.rain('✨', 26); MQ.Snd.play('rare'); }
      }
      var drops = document.querySelectorAll('#modal .drop');
      for (var d2 = 0; d2 < drops.length; d2++) drops[d2].onclick = function () { UI.itemDetail(this.getAttribute('data-item'), true); };

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
      $('rsMap').onclick = function () { UI.closeModal(); UI.show('map', { walk: true }); };
    },

    /* =====================================================================
     * 가방
     * ===================================================================== */
    paintBag: function () {
      var S = MQ.S;
      var g = MQ.P.gear(S);
      var html = helpLine('bag');
      html += '<div class="stat-card">' +
        '<div class="st"><span>⚔️</span><b>' + Math.round(MQ.P.atk(S)) + '</b><i>공격</i></div>' +
        '<div class="st"><span>🛡️</span><b>' + Math.round(MQ.P.def(S)) + '</b><i>방어</i></div>' +
        '<div class="st"><span>❤️</span><b>' + MQ.P.hpMax(S) + '</b><i>체력</i></div>' +
        '<div class="st"><span>💥</span><b>' + Math.round(MQ.P.crit(S) * 100) + '%</b><i>치명타</i></div>' +
        '<div class="st"><span>⭐</span><b>×' + g.exp.toFixed(2) + '</b><i>경험치</i></div>' +
        '<div class="st"><span>💰</span><b>×' + g.gold.toFixed(2) + '</b><i>골드</i></div>' +
        '</div>' +
        '<p class="tiny-note">공격이 높으면 몬스터를 더 빨리 쓰러뜨리고, 방어가 높으면 틀려도 덜 아파요.</p>';

      html += '<div class="perk-box' + (S.sp > 0 ? ' has' : '') + '">' +
        '<div class="perk-h"><b>✨ 스킬포인트</b><i>남은 포인트 ' + S.sp + '개</i></div>' +
        '<p class="tiny-note">레벨이 오를 때마다 1개씩 생겨요. 한 번 올리면 계속 남아요.</p>' +
        '<div class="perk-grid">';
      var PERKS = [['atk', '⚔️', '공격력', '+2'], ['def', '🛡️', '방어력', '+2'], ['hp', '❤️', '체력', '+10'],
      ['time', '⏳', '문제 시간', '+0.6초'], ['luck', '🍀', '행운', '희귀 +6%']];
      for (var pi = 0; pi < PERKS.length; pi++) {
        var pk = PERKS[pi];
        html += '<button class="perk" data-perk="' + pk[0] + '"' + (S.sp > 0 ? '' : ' disabled') + '>' +
          '<span>' + pk[1] + '</span><b>' + pk[2] + '</b>' +
          '<i>Lv ' + (S.perks[pk[0]] || 0) + '</i><u>' + pk[3] + '</u></button>';
      }
      html += '</div></div>';

      html += '<h3 class="sec">🧍 지금 낀 장비 <small>눌러서 자세히 보기</small></h3><div class="slots">';
      for (var i = 0; i < MQ.SLOTS.length; i++) {
        var sl = MQ.SLOTS[i], it = MQ.ITEM[S.inv.equipped[sl.key]];
        html += '<button class="slot' + (it ? ' r' + it.rar : '') + '" data-slot="' + sl.key + '">' +
          '<span class="s-i">' + (it ? it.emoji : sl.icon) + '</span>' +
          '<b>' + (it ? esc(it.name) : '비어 있음') + '</b><i>' + sl.name + '</i></button>';
      }
      html += '</div>';

      html += '<h3 class="sec">🎒 가진 장비 <small>눌러서 끼우기</small></h3><div class="item-grid">';
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

      html += '<h3 class="sec">🧪 가진 도우미 <small>전투 중에 쓸 수 있어요</small></h3><div class="pot-grid">';
      for (var k = 0; k < MQ.SHOP.length; k++) {
        var sp = MQ.SHOP[k];
        if (sp.id === 'chest' || sp.id === 'bigchest') continue;
        html += '<button class="pot" data-shop="' + sp.id + '"><span>' + sp.emoji + '</span><b>' + esc(sp.name) + '</b>' +
          '<i>' + MQ.P.count(S, sp.id) + '개</i><u>' + esc(sp.desc) + '</u></button>';
      }
      html += '</div>';

      $('bagBody').innerHTML = html;

      var items = document.querySelectorAll('#bagBody .item');
      for (var m = 0; m < items.length; m++) items[m].onclick = function () { UI.itemDetail(this.getAttribute('data-item')); };
      var slots = document.querySelectorAll('#bagBody .slot');
      for (var s2 = 0; s2 < slots.length; s2++) slots[s2].onclick = function () { UI.slotDetail(this.getAttribute('data-slot')); };
      var pots = document.querySelectorAll('#bagBody .pot');
      for (var p3 = 0; p3 < pots.length; p3++) pots[p3].onclick = function () { UI.shopDetail(this.getAttribute('data-shop')); };
      var perks = document.querySelectorAll('#bagBody .perk');
      for (var p2 = 0; p2 < perks.length; p2++) perks[p2].onclick = function () {
        var k2 = this.getAttribute('data-perk');
        if (MQ.S.sp <= 0) {
          UI.sheet('<div class="sh-head"><span class="sh-e">✨</span><div><b>스킬포인트</b><i>지금 0개</i></div></div>' +
            '<p class="sh-p">레벨이 1 오를 때마다 1개씩 생겨요. 전투에서 이겨 경험치를 모으면 금방 올라가요!</p>');
          return;
        }
        MQ.S.sp--; MQ.S.perks[k2] = (MQ.S.perks[k2] || 0) + 1;
        if (k2 === 'hp') MQ.S.hp = MQ.P.hpMax(MQ.S);
        MQ.Snd.play('levelup'); MQ.FX.toast('능력이 올랐어요!');
        MQ.Game.save(); UI.paintBag(); UI.paintHud();
      };
    },

    /* ---------- 설명 카드들 ---------- */
    itemDetail: function (id, noEquip) {
      var it = MQ.ITEM[id]; if (!it) return;
      var S = MQ.S;
      var slot = null;
      for (var i = 0; i < MQ.SLOTS.length; i++) if (MQ.SLOTS[i].key === it.slot) slot = MQ.SLOTS[i];
      var eqd = S.inv.equipped[it.slot] === it.id;
      var cur2 = MQ.ITEM[S.inv.equipped[it.slot]];
      var have = !!S.inv.owned[it.id];

      var lines = [];
      if (it.atk) lines.push(['⚔️', '공격력', '+' + it.atk, '몬스터에게 주는 피해가 커져요']);
      if (it.def) lines.push(['🛡️', '방어력', '+' + it.def, '틀렸을 때 덜 아파요']);
      var b = it.bonus || {};
      if (b.hp) lines.push(['❤️', '최대 체력', '+' + b.hp, '더 여러 번 틀려도 버텨요']);
      if (b.exp) lines.push(['⭐', '경험치', '×' + b.exp, '레벨이 더 빨리 올라요']);
      if (b.gold) lines.push(['💰', '골드', '×' + b.gold, '돈이 더 많이 들어와요']);
      if (b.crit) lines.push(['💥', '치명타 확률', '+' + Math.round(b.crit * 100) + '%', '가끔 두 배로 때려요']);
      if (b.time) lines.push(['⏳', '문제 시간', '+' + b.time + '초', '생각할 시간이 늘어나요']);
      if (b.shield) lines.push(['🛡️', '보호막', '×' + b.shield, '판마다 한 번 공짜로 막아 줘요']);
      if (!lines.length) lines.push(['🧝', '겉모습', '', '능력은 없지만 멋있어요']);

      var html = '<div class="sh-head r' + it.rar + '"><span class="sh-e">' + it.emoji + '</span>' +
        '<div><b>' + esc(it.name) + '</b>' +
        '<i style="color:' + MQ.RARITY[it.rar].color + '">' + MQ.RARITY[it.rar].name + ' · ' + (slot ? slot.name : '') + '</i></div></div>';
      html += '<div class="sh-lines">';
      for (var l = 0; l < lines.length; l++) {
        html += '<div class="sh-line"><span>' + lines[l][0] + '</span><b>' + lines[l][1] + '</b>' +
          '<em>' + lines[l][2] + '</em><i>' + lines[l][3] + '</i></div>';
      }
      html += '</div>';

      if (cur2 && cur2.id !== it.id && have) {
        var dAtk = it.atk - cur2.atk, dDef = it.def - cur2.def;
        html += '<p class="sh-cmp">지금 낀 <b>' + esc(cur2.name) + '</b> 과 비교하면 ' +
          '공격 <b class="' + (dAtk >= 0 ? 'up' : 'dn') + '">' + (dAtk >= 0 ? '+' : '') + dAtk + '</b>, ' +
          '방어 <b class="' + (dDef >= 0 ? 'up' : 'dn') + '">' + (dDef >= 0 ? '+' : '') + dDef + '</b> 이에요.</p>';
      }
      if (!have) html += '<p class="sh-p">아직 없는 아이템이에요. 상자에서 나올 수 있어요!</p>';

      if (have && !noEquip) {
        html += '<div class="sh-btns">' +
          (eqd ? '<button class="big-btn ghost" id="shOff">벗기</button>'
            : '<button class="big-btn primary" id="shOn">이걸 끼우기</button>') + '</div>';
      }
      UI.sheet(html);
      var on1 = $('shOn'); if (on1) on1.onclick = function () {
        MQ.P.equip(MQ.S, it.id); MQ.Snd.play('item'); MQ.Game.save(); UI.closeModal(); UI.paintBag(); UI.paintHud();
      };
      var off = $('shOff'); if (off) off.onclick = function () {
        MQ.P.unequip(MQ.S, it.slot); MQ.Snd.play('tap'); MQ.Game.save(); UI.closeModal(); UI.paintBag(); UI.paintHud();
      };
    },

    slotDetail: function (key) {
      var sl = null, i;
      for (i = 0; i < MQ.SLOTS.length; i++) if (MQ.SLOTS[i].key === key) sl = MQ.SLOTS[i];
      var it = MQ.ITEM[MQ.S.inv.equipped[key]];
      if (it) return UI.itemDetail(it.id);
      var n = 0;
      for (var id in MQ.S.inv.owned) if (MQ.ITEM[id] && MQ.ITEM[id].slot === key) n++;
      UI.sheet('<div class="sh-head"><span class="sh-e">' + sl.icon + '</span><div><b>' + sl.name + ' 칸</b><i>비어 있어요</i></div></div>' +
        '<p class="sh-p">여기에 ' + sl.name + ' 을(를) 끼우면 더 세져요. 지금 가진 ' + sl.name + ' 은 <b>' + n + '개</b> 예요.</p>' +
        (n ? '<p class="sh-p">아래 <b>가진 장비</b> 에서 골라 눌러 보세요.</p>' : '<p class="sh-p">몬스터를 물리치고 상자를 열면 나와요!</p>'));
    },

    shopDetail: function (id) {
      var it = MQ.SHOP_MAP[id]; if (!it) return;
      var S = MQ.S;
      var price = it.gem ? (it.gem + ' 💎') : (it.price + ' 💰');
      var can = it.gem ? S.gem >= it.gem : S.gold >= it.price;
      UI.sheet('<div class="sh-head"><span class="sh-e">' + it.emoji + '</span><div><b>' + esc(it.name) + '</b>' +
        '<i>' + (id === 'chest' || id === 'bigchest' ? '한 번 쓰면 사라져요' : '지금 ' + MQ.P.count(S, id) + '개') + '</i></div></div>' +
        '<p class="sh-p">' + esc(it.desc) + '</p>' +
        '<p class="sh-p">값 <b>' + price + '</b>' + (can ? '' : ' — 아직 모자라요') + '</p>' +
        '<div class="sh-btns"><button class="big-btn ' + (can ? 'primary' : 'ghost') + '" id="shBuy">사기</button></div>');
      $('shBuy').onclick = function () { UI.closeModal(); UI.buy(id); };
    },

    skillDetail: function (sk) {
      var m = MQ.SKILLS[sk], S = MQ.S;
      var b = (S.stats.bySkill && S.stats.bySkill[sk]) || { n: 0, ok: 0 };
      var types = [], all = MQ.Gen.list();
      for (var i = 0; i < all.length; i++) if (all[i].skill === sk) types.push(all[i].icon + ' ' + all[i].name);
      UI.sheet('<div class="sh-head"><span class="sh-e">' + m.icon + '</span><div><b>' + m.name + ' 능력치</b>' +
        '<i style="color:' + m.color + '">Lv ' + (S.skillLv[sk] || 1) + '</i></div></div>' +
        '<p class="sh-p">이 분야 문제를 맞힐 때마다 조금씩 자라요. 지금까지 <b>' + b.n + '문제</b> 중 <b>' + b.ok + '개</b> 맞혔어요' +
        (b.n ? ' (' + Math.round(b.ok / b.n * 100) + '%)' : '') + '.</p>' +
        '<p class="sh-p"><b>이런 문제가 나와요</b><br><span class="sh-tags">' + esc(types.join(' · ')) + '</span></p>');
    },

    /* =====================================================================
     * 도감
     * ===================================================================== */
    paintCodex: function (tab) {
      var S = MQ.S;
      tab = tab || UI._codexTab || 'mon';
      UI._codexTab = tab;
      var html = helpLine('codex');
      html += '<div class="tabs">' +
        '<button data-t="mon" class="' + (tab === 'mon' ? 'on' : '') + '">👾 몬스터</button>' +
        '<button data-t="item" class="' + (tab === 'item' ? 'on' : '') + '">🎁 아이템</button>' +
        '<button data-t="type" class="' + (tab === 'type' ? 'on' : '') + '">🧠 문제</button>' +
        '<button data-t="ach" class="' + (tab === 'ach' ? 'on' : '') + '">🏅 업적</button>' +
        '</div>';

      var i, j;
      if (tab === 'mon') {
        var all = [];
        for (i = 0; i < MQ.REGIONS.length; i++) {
          for (j = 0; j < MQ.REGIONS[i].mons.length; j++) all.push({ m: MQ.REGIONS[i].mons[j], r: i });
          all.push({ m: MQ.REGIONS[i].boss, r: i, boss: 1 });
        }
        var seen = 0;
        for (i = 0; i < all.length; i++) if (S.codex.mon[all[i].m.name]) seen++;
        html += '<p class="dex-count">' + seen + ' / ' + all.length + ' 종 발견</p><div class="dex-grid">';
        for (i = 0; i < all.length; i++) {
          var f = !!S.codex.mon[all[i].m.name];
          html += '<button class="dex' + (f ? '' : ' unk') + (all[i].boss ? ' boss' : '') +
            '" data-mon="' + esc(all[i].m.name) + '" data-r="' + all[i].r + '">' +
            '<span class="d-e">' + (f ? all[i].m.emoji : '❔') + '</span>' +
            '<b>' + (f ? esc(all[i].m.name) : '???') + '</b>' +
            '<i>' + MQ.REGIONS[all[i].r].emoji + ' ' + esc(MQ.REGIONS[all[i].r].name) + '</i></button>';
        }
        html += '</div>';
      } else if (tab === 'item') {
        var have = Object.keys(S.codex.item).length;
        html += '<p class="dex-count">' + have + ' / ' + MQ.ITEMS.length + ' 종 수집</p><div class="dex-grid">';
        for (var k = 0; k < MQ.ITEMS.length; k++) {
          var it = MQ.ITEMS[k], f2 = !!S.codex.item[it.id];
          html += '<button class="dex r' + it.rar + (f2 ? '' : ' unk') + '" data-item="' + it.id + '">' +
            '<span class="d-e">' + (f2 ? it.emoji : '❔') + '</span>' +
            '<b>' + (f2 ? esc(it.name) : '???') + '</b>' +
            '<i style="color:' + MQ.RARITY[it.rar].color + '">' + MQ.RARITY[it.rar].name + '</i></button>';
        }
        html += '</div>';
      } else if (tab === 'type') {
        var types = MQ.Gen.list();
        var got = Object.keys(S.codex.type).length;
        html += '<p class="dex-count">' + got + ' / ' + types.length + ' 종 경험</p><div class="dex-grid">';
        for (var t = 0; t < types.length; t++) {
          var ty = types[t], f3 = !!S.codex.type[ty.id];
          var bt = (S.stats.byType && S.stats.byType[ty.id]) || { n: 0, ok: 0 };
          html += '<button class="dex' + (f3 ? '' : ' unk') + '" data-type="' + ty.id + '">' +
            '<span class="d-e">' + (f3 ? ty.icon : '❔') + '</span>' +
            '<b>' + (f3 ? esc(ty.name) : '???') + '</b>' +
            '<i style="color:' + MQ.SKILLS[ty.skill].color + '">' + MQ.SKILLS[ty.skill].name +
            (bt.n ? ' · ' + Math.round(bt.ok / bt.n * 100) + '%' : '') + '</i></button>';
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
      var dx = document.querySelectorAll('#codexBody .dex');
      for (var y = 0; y < dx.length; y++) dx[y].onclick = function () {
        if (this.getAttribute('data-item')) return UI.itemDetail(this.getAttribute('data-item'), true);
        if (this.getAttribute('data-type')) return UI.typeDetail(this.getAttribute('data-type'));
        UI.monDetail(this.getAttribute('data-mon'), +this.getAttribute('data-r'));
      };
    },

    monDetail: function (name, ri) {
      var S = MQ.S, r = MQ.REGIONS[ri], m = null, boss = false, i;
      for (i = 0; i < r.mons.length; i++) if (r.mons[i].name === name) m = r.mons[i];
      if (!m && r.boss.name === name) { m = r.boss; boss = true; }
      if (!m) return;
      var found = !!S.codex.mon[name];
      if (!found) {
        return UI.sheet('<div class="sh-head"><span class="sh-e">❔</span><div><b>아직 못 만난 몬스터</b>' +
          '<i>' + r.emoji + ' ' + esc(r.name) + '</i></div></div>' +
          '<p class="sh-p">이 지역에서 모험하다 보면 만날 수 있어요!</p>');
      }
      var hpTxt = m.hp >= 1.4 ? '아주 튼튼해요' : m.hp >= 1.1 ? '조금 튼튼해요' : '보통이에요';
      var atkTxt = m.atk >= 1.7 ? '아주 아프게 때려요' : m.atk >= 1.3 ? '조금 아프게 때려요' : '약하게 때려요';
      UI.sheet('<div class="sh-head' + (boss ? ' r3' : '') + '"><span class="sh-e">' + m.emoji + '</span>' +
        '<div><b>' + esc(m.name) + '</b><i>' + r.emoji + ' ' + esc(r.name) + (boss ? ' · 보스' : '') + '</i></div></div>' +
        '<div class="sh-lines">' +
        '<div class="sh-line"><span>❤️</span><b>체력</b><em>' + m.hp.toFixed(1) + '배</em><i>' + hpTxt + '</i></div>' +
        '<div class="sh-line"><span>⚔️</span><b>공격력</b><em>' + m.atk.toFixed(1) + '배</em><i>' + atkTxt + '</i></div>' +
        (boss ? '<div class="sh-line"><span>🎯</span><b>도전</b><em>' + m.q + '문제</em><i>연속으로 이겨야 해요</i></div>' : '') +
        '</div>' +
        '<p class="sh-p">이 지역에서는 <b>' + r.skills.map(function (s) { return MQ.SKILLS[s].name; }).join(' · ') +
        '</b> 문제가 자주 나와요.</p>');
    },

    typeDetail: function (id) {
      var ty = MQ.Gen.types[id]; if (!ty) return;
      var S = MQ.S;
      var bt = (S.stats.byType && S.stats.byType[id]) || { n: 0, ok: 0 };
      var sample = null;
      try { sample = ty.fn(Math.max(ty.minLv, Math.min(ty.maxLv, S.diff)), MQ.R); } catch (e) { }
      var html = '<div class="sh-head"><span class="sh-e">' + ty.icon + '</span><div><b>' + esc(ty.name) + '</b>' +
        '<i style="color:' + MQ.SKILLS[ty.skill].color + '">' + MQ.SKILLS[ty.skill].name + ' 분야</i></div></div>';
      html += '<p class="sh-p">' + (bt.n ? '지금까지 <b>' + bt.n + '문제</b> 중 <b>' + bt.ok + '개</b> 맞혔어요 (' +
        Math.round(bt.ok / bt.n * 100) + '%).' : '아직 만나 본 적 없는 문제예요.') + '</p>';
      if (sample) {
        html += '<div class="sh-sample"><div class="ss-t">이런 문제예요</div>' +
          (sample.svg ? '<div class="q-svg">' + sample.svg + '</div>' : '') +
          '<div class="ss-q">' + sample.text + '</div>' +
          (sample.sub ? '<div class="ss-sub">' + sample.sub + '</div>' : '') +
          '<div class="ss-a">정답 <b>' + esc(sample.answer) + '</b></div>' +
          '<div class="ss-e">' + esc(sample.explain) + '</div></div>';
      }
      UI.sheet(html);
    },

    /* =====================================================================
     * 미션 · 시즌
     * ===================================================================== */
    paintQuests: function () {
      var S = MQ.S;
      MQ.Prog.ensureMissions(S);
      var si = MQ.Prog.seasonInfo();
      var html = helpLine('quest');
      html += '<div class="season" style="border-color:' + si.color + '">' +
        '<div class="se-h"><span>' + si.emoji + '</span><b>' + esc(si.name) + '</b>' +
        '<i>시즌 ' + si.no + ' · ' + S.season.pt + '점</i></div>' +
        '<p class="tiny-note">문제를 풀고 미션을 끝낼 때마다 시즌 점수가 올라요. 4주마다 새 시즌이 시작돼요.</p>' +
        '<div class="pass">';
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
        var idx = +this.getAttribute('data-sp');
        var got = MQ.Prog.claimSeason(MQ.S, idx);
        if (!got) {
          var pass = MQ.SEASON_PASS[idx];
          UI.sheet('<div class="sh-head"><span class="sh-e">🎁</span><div><b>시즌 보상</b><i>' + pass.at + '점 필요</i></div></div>' +
            '<p class="sh-p">지금 <b>' + MQ.S.season.pt + '점</b> 이에요. ' +
            (MQ.S.season.taken.indexOf(idx) >= 0 ? '이미 받은 보상이에요.' : '<b>' + Math.max(0, pass.at - MQ.S.season.pt) + '점</b> 만 더 모으면 받을 수 있어요!') + '</p>');
          return;
        }
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
      var html = helpLine('shop') + '<div class="shop-grid">';
      for (var i = 0; i < MQ.SHOP.length; i++) {
        var it = MQ.SHOP[i];
        var price = it.gem ? (it.gem + ' 💎') : (it.price + ' 💰');
        var can = it.gem ? S.gem >= it.gem : S.gold >= it.price;
        html += '<div class="buy' + (can ? '' : ' no') + '">' +
          '<span class="b-e">' + it.emoji + '</span><b>' + esc(it.name) + '</b>' +
          '<i>' + esc(it.desc) + '</i><u>' + price + '</u>' +
          '<em>' + (it.id === 'chest' || it.id === 'bigchest' ? '&nbsp;' : '가진 개수 ' + MQ.P.count(S, it.id)) + '</em>' +
          '<div class="buy-btns"><button class="buy-go" data-buy="' + it.id + '">사기</button>' +
          '<button class="buy-info" data-info="' + it.id + '">?</button></div></div>';
      }
      html += '</div>';
      $('shopBody').innerHTML = html;
      var bs = document.querySelectorAll('#shopBody .buy-go');
      for (var j = 0; j < bs.length; j++) bs[j].onclick = function () { UI.buy(this.getAttribute('data-buy')); };
      var inf = document.querySelectorAll('#shopBody .buy-info');
      for (var k = 0; k < inf.length; k++) inf[k].onclick = function () { UI.shopDetail(this.getAttribute('data-info')); };
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
          '<small>' + (c.dup ? '이미 있어서 골드로 바꿨어요' : '새 아이템이에요!') + '</small>' +
          '<div class="sh-btns"><button class="big-btn ghost" id="cdInfo">어떤 아이템인지 보기</button></div></div>');
        var ci = $('cdInfo'); if (ci) ci.onclick = function () { UI.itemDetail(c.item.id, true); };
        if (c.item.rar >= 3) MQ.FX.rain('✨', 20);
      } else {
        MQ.P.give(S, id, 1);
        MQ.Snd.play('coin');
        MQ.FX.toast(it.emoji + ' ' + it.name + ' 을(를) 샀어요!');
      }
      var got = MQ.Prog.checkAch(S);
      for (var g = 0; g < got.length; g++) MQ.FX.toast('🏅 ' + got[g].name, 'ach');
      MQ.Game.save();
      if (cur === 'shop') UI.paintShop();
      if (cur === 'bag') UI.paintBag();
      UI.paintHud();
    },

    /* =====================================================================
     * 공용 모달 · 설명 카드 · 메뉴
     * ===================================================================== */
    modal: function (html, opt) {
      opt = opt || {};
      var wrap = $('modal');
      wrap.className = opt.sheet ? 'sheet-mode' : '';
      wrap.innerHTML = '<div class="modal-box' + (opt.wide ? ' wide' : '') + (opt.sheet ? ' sheet' : '') + '">' +
        (opt.noClose ? '' : '<button class="mo-x" id="moX">✕</button>') + html + '</div>';
      wrap.classList.add('on');
      var x = $('moX');
      if (x) x.onclick = UI.closeModal;
      wrap.onclick = opt.noClose ? null : function (e) { if (e.target === wrap) UI.closeModal(); };
    },
    /* 아래에서 올라오는 설명 카드 */
    sheet: function (html) { MQ.Snd.play('open'); UI.modal(html, { sheet: true }); },
    closeModal: function () { var w = $('modal'); w.classList.remove('on'); w.innerHTML = ''; },

    menu: function () {
      var S = MQ.S;
      var html = '<h2>⚙️ 설정</h2><div class="menu-list">' +
        '<button data-m="sound">' + (MQ.Snd.isOn() ? '🔊 효과음 켜짐' : '🔇 효과음 꺼짐') + '</button>' +
        '<button data-m="bgm">' + (MQ.Bgm.isOn() ? '🎵 배경음악 켜짐' : '🎵 배경음악 꺼짐') + '</button>' +
        '<button data-m="how">❓ 게임 방법</button>' +
        '<button data-m="parent">👨‍👩‍👧 보호자 보기</button>' +
        '<button data-m="hub">🏠 게임 목록으로 나가기</button>' +
        '<button data-m="reset">🗑️ 처음부터 다시</button>' +
        '</div><p class="menu-note">기록은 이 기기에 자동으로 저장돼요.</p>';
      UI.modal(html);
      var bs = document.querySelectorAll('#modal .menu-list button');
      for (var i = 0; i < bs.length; i++) bs[i].onclick = function () {
        var m = this.getAttribute('data-m');
        if (m === 'sound') { MQ.Snd.setOn(!MQ.Snd.isOn()); S.settings.sound = MQ.Snd.isOn(); MQ.Game.save(); UI.menu(); }
        else if (m === 'bgm') { MQ.Bgm.setOn(!MQ.Bgm.isOn()); S.settings.bgm = MQ.Bgm.isOn(); MQ.Game.save(); UI.music(); UI.menu(); }
        else if (m === 'how') UI.howTo();
        else if (m === 'parent') UI.parent();
        else if (m === 'hub') { MQ.Game.save(); location.href = '../../../'; }
        else if (m === 'reset') UI.confirmReset();
      };
    },

    howTo: function () {
      UI.modal('<h2>❓ 게임 방법</h2>' +
        '<ul class="how">' +
        '<li>⚔️ <b>정답을 고르면 몬스터를 때려요.</b> 틀리면 내가 맞아요.</li>' +
        '<li>🔥 <b>연속으로 맞히면 콤보!</b> 5콤보마다 필살기가 터지고 경험치가 ×2, ×3, ×5, ×10 으로 커져요.</li>' +
        '<li>🗺️ 지도에서 <b>칸을 하나 깰 때마다 캐릭터가 한 걸음</b> 앞으로 걸어가요. 지도는 옆으로 밀어서 둘러볼 수 있어요.</li>' +
        '<li>🎁 몬스터를 물리치면 상자가 나와요. 무기·펫·날개·탈것을 모아 더 세지세요.</li>' +
        '<li>🧠 문제는 스스로 난이도를 맞춰요. 잘 맞히면 어려워지고, 어려우면 쉬워져요.</li>' +
        '<li>🗝️ 랜덤 던전은 들어갈 때마다 규칙과 보상이 달라져요.</li>' +
        '<li>🚪 전투 중에 그만하고 싶으면 왼쪽 위 <b>✕ 나가기</b> 를 누르세요.</li>' +
        '</ul>');
    },

    confirmReset: function () {
      UI.modal('<h2>정말 처음부터 다시 할까요?</h2><p class="warn-p">레벨·아이템·업적이 모두 사라져요.</p>' +
        '<div class="res-btns"><button class="big-btn danger" id="doReset">네, 지울게요</button>' +
        '<button class="big-btn ghost" id="noReset">아니요</button></div>');
      $('doReset').onclick = function () { MQ.Save.clear(); location.reload(); };
      $('noReset').onclick = UI.closeModal;
    },

    /* 전투 중 나가기 */
    exitBattle: function () {
      UI.modal('<h2>🚪 나갈까요?</h2><p class="warn-p">지금 판에서 얻은 보상은 사라져요.</p>' +
        '<div class="res-btns">' +
        '<button class="big-btn primary" id="exStay">↩️ 계속 싸우기</button>' +
        '<button class="big-btn" id="exMap">🗺️ 지도로 나가기</button>' +
        '<button class="big-btn ghost" id="exHub">🏠 게임 목록으로</button>' +
        '</div>');
      $('exStay').onclick = UI.closeModal;
      $('exMap').onclick = function () { UI.closeModal(); MQ.Battle.flee(); };
      $('exHub').onclick = function () { MQ.Battle.flee(); MQ.Game.save(); location.href = '../../../'; };
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
