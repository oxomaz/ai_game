/* ===========================================================
   Tiny World - js/ui.js
   화면에 보이는 모든 것: HUD · 퀘스트 · 메뉴 패널 · 알림 · 축하 연출
   =========================================================== */
window.TW = window.TW || {};
TW.UI = (function () {
  var $ = function (id) { return document.getElementById(id); };
  var el = {};
  var panel = null;          /* 지금 열려 있는 패널 id */
  var talkState = null;      /* 정령 대화 진행 상태 */
  var bannerTimer = null;

  function init() {
    ['title', 'game', 'hud', 'questBox', 'overlay', 'overlayCard', 'toasts', 'banner',
     'hudName', 'hudLv', 'barXp', 'txtXp', 'barEn', 'txtEn', 'hudTree', 'hudTreeIcon',
     'hudTreeStage', 'barTree', 'placebar', 'placeText', 'placeCancel', 'btnAction',
     'bottombar', 'confetti', 'spiritDot', 'titleBest', 'hudPlayer'].forEach(function (k) { el[k] = $(k); });

    el.overlayCard.addEventListener('click', onCardClick);
    el.overlay.addEventListener('click', function (e) {
      if (e.target === el.overlay) closePanel();
    });
    el.bottombar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var p = b.getAttribute('data-panel');
      TW.Audio.play('open');
      if (panel === p) closePanel(); else openPanel(p);
    });
    el.hudTree.addEventListener('click', function () { TW.Audio.play('open'); openPanel('tree'); });
    /* 퀘스트 칸: ❓ 는 힌트, 나머지를 누르면 접기/펴기 */
    el.questBox.addEventListener('click', function (e) {
      if (e.target.closest('[data-hint]')) {
        TW.Audio.play('open');
        TW.Help.show(true);
        return;
      }
      el.hud.classList.toggle('mini');
      TW.Audio.play('open');
      lastQuestHtml = '';
      renderQuests();
      TW.Map.resize();
    });
    /* 화면 위 ❓ 버튼 = 도움말 */
    var hb = document.getElementById('btnHelp');
    if (hb) hb.addEventListener('click', function () {
      TW.Audio.play('open');
      openPanel('help');
    });
    el.placeCancel.addEventListener('click', function () { TW.Building.cancelPlace(); });
  }

  /* ================= 알림 ================= */
  function toast(msg, icon) {
    var d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = '<span>' + (icon || '💬') + '</span><span>' + msg + '</span>';
    el.toasts.appendChild(d);
    setTimeout(function () {
      d.classList.add('out');
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 320);
    }, 2100);
    while (el.toasts.children.length > 3) el.toasts.removeChild(el.toasts.firstChild);
  }

  function eventBanner(title, icon, sub) {
    el.banner.innerHTML = '<div class="b-ic">' + icon + '</div><div class="b-tt">' + title + '</div>' +
      (sub ? '<div class="b-sb">' + sub + '</div>' : '');
    el.banner.classList.remove('hidden');
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { el.banner.classList.add('hidden'); }, 2600);
  }

  function confetti() {
    var box = el.confetti;
    box.classList.remove('hidden');
    box.innerHTML = '';
    var cols = ['#ff6b6b', '#ffd166', '#6ee7a0', '#6ec6ff', '#c9a7ff', '#ff9ecd'];
    for (var i = 0; i < 40; i++) {
      var i2 = document.createElement('i');
      i2.style.left = Math.random() * 100 + '%';
      i2.style.background = cols[i % cols.length];
      i2.style.animationDuration = (1.4 + Math.random() * 1.2) + 's';
      i2.style.animationDelay = (Math.random() * 0.5) + 's';
      box.appendChild(i2);
    }
    setTimeout(function () { box.classList.add('hidden'); box.innerHTML = ''; }, 3200);
  }

  /* ================= HUD ================= */
  function syncHud() {
    var s = TW.state;
    if (!s) return;
    el.hudName.textContent = s.name;
    el.hudLv.textContent = s.level;
    var need = TW.Player.xpNeed(s.level);
    el.barXp.style.width = Math.min(100, (s.xp / need) * 100) + '%';
    el.txtXp.textContent = 'XP ' + Math.floor(s.xp) + '/' + need;
    el.barEn.style.width = Math.min(100, (s.energy / s.energyMax) * 100) + '%';
    el.txtEn.textContent = '활동력 ' + s.energy + '/' + s.energyMax;
    var icons = ['', '🌰', '🌱', '🌳', '🌟'];
    el.hudTreeIcon.textContent = icons[s.tree.stage] || '🌳';
    el.hudTreeStage.textContent = TW.WorldTree.stageName();
    el.barTree.style.width = (TW.WorldTree.progress() * 100) + '%';

    /* 정령 알림 점: 아직 친구가 아닌 발견된 정령이 있으면 표시 */
    var pending = TW.SPIRIT_ORDER.some(function (k) {
      return TW.state.spirits[k].spawned && !TW.state.spirits[k].friend;
    });
    el.spiritDot.classList.toggle('hidden', !pending);

    /* 액션 버튼 라벨 */
    var t = TW.Game.target;
    var lab = '살펴보기', ic = '✋';
    if (TW.Building.placing) { lab = '여기 놓기'; ic = '📍'; }
    else if (!t) { lab = '가까이 가기'; ic = '👣'; }
    else if (t.kind === 'node') { lab = '모으기'; ic = TW.NODES[t.extra.t].icon; }
    else if (t.kind === 'building') { lab = TW.BUILDINGS[t.extra.type].action; ic = TW.BUILDINGS[t.extra.type].icon; }
    else if (t.kind === 'tree') { lab = '세계수'; ic = '🌟'; }
    else if (t.kind === 'spirit') { lab = '말 걸기'; ic = TW.SPIRITS[t.extra].icon; }
    else if (t.kind === 'portal') { lab = '문 보기'; ic = '🌀'; }
    el.btnAction.querySelector('.act-icon').textContent = ic;
    el.btnAction.querySelector('.act-label').textContent = lab;
    el.btnAction.classList.toggle('off', !t && !TW.Building.placing);
  }

  /* 퀘스트 칸은 내용이 "바뀔 때만" 다시 그린다.
     매번 innerHTML 을 새로 만들면 등장 애니메이션이 계속 재시작돼 깜빡거린다. */
  var lastQuestHtml = '';

  function renderQuests() {
    var list = TW.Quests.active();
    var html = '';
    if (!list.length) {
      html = '<div class="q-item q-ok"><span class="q-ic">🎉</span>' +
        '<span class="q-txt">모든 목표를 다 했어! 섬을 자유롭게 꾸며 보자.</span>' +
        '<button class="q-help" data-hint="1">❓</button></div>';
    }
    var mini = el.hud.classList.contains('mini');
    list.forEach(function (it, i) {
      var pct = Math.min(1, it.cur / it.need);
      html += '<div class="q-item' + (pct >= 1 ? ' q-ok' : '') + '">' +
        '<span class="q-ic">' + (i === 0 ? '📌' : '·') + '</span>' +
        '<span class="q-txt">' + it.q.title +
        (i === 0 && it.q.hint ? '<span class="q-hint">' + it.q.hint + '</span>' : '') +
        '</span>' +
        '<span class="q-num">' + it.cur + '/' + it.need + '</span>' +
        (i === 0 ? '<button class="q-help" data-hint="1">❓</button>' +
                   '<span class="q-fold">' + (mini ? '▾' : '▴') + '</span>' : '') +
        '</div>';
    });
    if (html === lastQuestHtml) return;     /* ← 깜빡임 방지 */
    lastQuestHtml = html;
    el.questBox.innerHTML = html;
  }

  /* ================= 축하 연출 ================= */
  function cheer(html) {
    panel = 'cheer';
    el.overlayCard.innerHTML = '<div class="cheer">' + html + '</div>';
    el.overlay.classList.remove('hidden');
  }

  function levelUp(ups) {
    var last = ups[ups.length - 1];
    var gifts = ups.map(function (u) { return '<div class="gift">Lv.' + u.level + ' — ' + u.text + '</div>'; }).join('');
    confetti();
    /* 놀이를 자주 끊지 않도록: 초반과 5레벨마다만 큰 축하창, 나머지는 배너 */
    var bigCheer = last.level <= 3 || last.level % 5 === 0;
    if (!bigCheer || (panel && panel !== 'cheer')) {
      eventBanner('레벨 ' + last.level + ' 달성!', '⭐', ups[0].text);
      ups.forEach(function (u, i) { setTimeout(function () { toast(u.text, '⭐'); }, 200 * (i + 1)); });
      return;
    }
    cheer('<div class="c-ic">⭐</div><h2>레벨 ' + last.level + ' 달성!</h2>' +
      '<p>계속 모으고 만들어 보자!</p><div class="gifts">' + gifts + '</div>' +
      '<button class="big-btn" data-act="close">좋아!</button>');
  }

  function questDone(q, r) {
    var lines = [];
    if (r.xp) lines.push('경험치 +' + r.xp);
    if (r.energy) lines.push('🌟 세계수 에너지 +' + r.energy);
    if (r.items) Object.keys(r.items).forEach(function (k) {
      lines.push(TW.ITEMS[k].icon + ' ' + TW.ITEMS[k].name + ' +' + r.items[k]);
    });
    eventBanner('목표 완료!', '✅', q.title);
    toast(r.msg || '잘했어!', '🎁');
    lines.forEach(function (l, i) {
      setTimeout(function () { toast(l, '➕'); }, 260 * (i + 1));
    });
    var p = TW.state.pos;
    TW.FX.burst(p.x, p.y - 0.5, '#ffe066', 18);
  }

  function treeGrowScene(stage, regionKey) {
    var icons = ['', '🌰', '🌱', '🌳', '🌟'];
    var extra = '';
    if (regionKey) {
      extra = '<div class="gift">🔓 ' + TW.REGIONS[regionKey].name + ' 지역이 열렸어!</div>';
    }
    if (stage >= 4) extra += '<div class="gift">🌀 다음 세계로 가는 문이 나타났어!</div>';
    confetti();
    cheer('<div class="c-ic">' + icons[stage] + '</div>' +
      '<h2>세계수가 자랐어!</h2>' +
      '<p><b>' + TW.WorldTree.STAGE_NAME[stage] + '</b> 단계가 되었어.</p>' +
      '<div class="gifts">' + extra + '</div>' +
      '<button class="big-btn" data-act="close">우와!</button>');
  }

  function pingSpirit(k) {
    eventBanner('반짝임을 발견했어!', '✨', TW.SPIRITS[k].where + '(으)로 가 보자');
  }

  /* ================= 건설 위치 고르기 바 ================= */
  function showPlaceBar(type) {
    el.placeText.textContent = TW.BUILDINGS[type].icon + ' ' + TW.BUILDINGS[type].name + ' — 하얀 칸을 눌러 놓아 보자!';
    el.placebar.classList.remove('hidden');
    syncHud();
  }
  function hidePlaceBar() { el.placebar.classList.add('hidden'); syncHud(); }

  /* ================= 패널 ================= */
  function openPanel(id) {
    panel = id;
    el.overlay.classList.remove('hidden');
    renderPanel();
    Array.prototype.forEach.call(el.bottombar.children, function (b) {
      b.classList.toggle('on', b.getAttribute('data-panel') === id);
    });
  }

  function closePanel() {
    panel = null;
    talkState = null;
    el.overlay.classList.add('hidden');
    el.overlayCard.innerHTML = '';
    Array.prototype.forEach.call(el.bottombar.children, function (b) { b.classList.remove('on'); });
  }

  function head(title, icon) {
    return '<div class="card-head"><span style="font-size:22px">' + icon + '</span><h2>' + title +
      '</h2><button class="x" data-act="close">✕</button></div>';
  }

  function renderPanel() {
    if (!panel) return;
    if (panel === 'inv') el.overlayCard.innerHTML = head('가방', '🎒') + invHtml();
    else if (panel === 'craft') el.overlayCard.innerHTML = head('제작', '🔨') + craftHtml();
    else if (panel === 'build') el.overlayCard.innerHTML = head('건설', '🏠') + buildHtml();
    else if (panel === 'spirits') el.overlayCard.innerHTML = head('정령', '🧚') + spiritsHtml();
    else if (panel === 'codex') el.overlayCard.innerHTML = head('도감', '📖') + codexHtml();
    else if (panel === 'settings') el.overlayCard.innerHTML = head('설정', '⚙️') + settingsHtml();
    else if (panel === 'tree') el.overlayCard.innerHTML = head('세계수', '🌟') + treeHtml();
    else if (panel === 'help') el.overlayCard.innerHTML = head('도움말', '❓') + helpHtml();
  }

  /* ---------- 도움말 ---------- */
  var helpOpen = 'now';         /* 펼쳐 놓은 항목 id */

  function helpFocus(id) {
    helpOpen = id;
    if (panel === 'help') renderPanel();
  }

  function helpHtml() {
    var c = TW.Help.current();
    var h = '<div class="card-body">';

    /* 지금 할 일 */
    h += '<div class="help-now' + (helpOpen === 'now' ? ' open' : '') + '">' +
      '<button class="help-head" data-act="helpTopic" data-id="now">' +
      '<span class="hh-ic">' + c.icon + '</span>' +
      '<span class="hh-tt">지금 할 일<em>' + c.title + '</em></span>' +
      '<span class="hh-ar">' + (helpOpen === 'now' ? '▲' : '▼') + '</span></button>';
    if (helpOpen === 'now') {
      h += '<div class="help-body">';
      if (c.cur !== undefined) {
        h += '<div class="chips"><span class="chip on">' + c.cur + ' / ' + c.need + ' 했어요</span></div>';
      }
      h += '<p class="help-text">' + esc(c.text).replace(/\n/g, '<br>') + '</p>';
      if (c.target) {
        h += '<button class="go" style="width:100%" data-act="guide">🧭 ' +
          esc(c.target.label) + ' 위치를 화살표로 알려 줘!</button>';
      } else if (c.panel) {
        h += '<button class="go alt" style="width:100%" data-act="goPanel" data-p="' + c.panel + '">' +
          TW.Help.panelName(c.panel) + ' 열기</button>';
      }
      h += '</div>';
    }
    h += '</div>';

    /* 주제별 설명 */
    TW.Help.TOPICS.forEach(function (t) {
      var open = helpOpen === t.id;
      h += '<div class="help-item' + (open ? ' open' : '') + '">' +
        '<button class="help-head" data-act="helpTopic" data-id="' + t.id + '">' +
        '<span class="hh-ic">' + t.icon + '</span>' +
        '<span class="hh-tt">' + t.title + '</span>' +
        '<span class="hh-ar">' + (open ? '▲' : '▼') + '</span></button>';
      if (open) {
        h += '<div class="help-body"><ul class="help-list">';
        t.lines.forEach(function (l) { h += '<li>' + bold(esc(l)) + '</li>'; });
        h += '</ul></div>';
      }
      h += '</div>';
    });

    h += '<button class="go alt" style="width:100%;margin-top:12px" data-act="howto">' +
      '🎬 처음 안내 다시 보기</button>';
    h += '</div>';
    return h;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function bold(s) {
    return s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  /* ---------- 가방 ---------- */
  function invHtml() {
    var s = TW.state, cap = TW.Player.invCap(s);
    var cats = [
      { k: 'res', t: '자원', ic: '🪵' },
      { k: 'seed', t: '씨앗', ic: '🌱' },
      { k: 'special', t: '특별 아이템', ic: '✨' }
    ];
    var h = '<div class="card-body">';
    h += '<p class="card-note">가방 ' + TW.Inv.total() + ' / ' + cap +
      ' · 종류별로 자동 정리돼요. 열매·버섯은 <b>먹기</b>를 누르면 활동력이 회복돼요.</p>';
    cats.forEach(function (c) {
      var keys = Object.keys(TW.ITEMS).filter(function (k) {
        return TW.ITEMS[k].cat === c.k && (s.inv[k] || 0) > 0;
      });
      if (!keys.length) return;
      h += '<div class="sec-title">' + c.ic + ' ' + c.t + '</div><div class="grid">';
      keys.forEach(function (k) {
        var it = TW.ITEMS[k];
        h += '<div class="cell"><span class="qt">' + s.inv[k] + '</span>' +
          '<div class="ic">' + it.icon + '</div><div class="nm">' + it.name + '</div>' +
          (TW.EDIBLE[k] ? '<button class="use" data-act="eat" data-item="' + k + '">먹기</button>' : '') +
          '</div>';
      });
      h += '</div>';
    });
    var tools = Object.keys(s.tools);
    h += '<div class="sec-title">🪓 도구</div>';
    if (!tools.length) h += '<p class="card-note">아직 도구가 없어요. 작업대를 만들고 도끼를 만들어 봐요!</p>';
    else {
      h += '<div class="grid">';
      tools.forEach(function (k) {
        var it = TW.ITEMS[k];
        h += '<div class="cell"><div class="ic">' + it.icon + '</div><div class="nm">' + it.name + '</div></div>';
      });
      h += '</div>';
    }
    if (!Object.keys(s.inv).length) h += '<p class="card-note">가방이 비었어요. 나무와 돌을 모아 봐요!</p>';
    h += '</div>';
    return h;
  }

  /* ---------- 제작 ---------- */
  function craftHtml() {
    var h = '<div class="card-body">';
    var near = TW.Craft.nearBuilding('workbench');
    h += '<p class="card-note">' + (near ? '작업대 옆이에요. 무엇을 만들까요?' :
      '⚠️ 도구를 만들려면 <b>작업대 옆</b>으로 가야 해요.') + '</p>';
    var act = TW.Craft.activeCraft();
    TW.RECIPES.forEach(function (r) {
      var out = TW.ITEMS[r.out];
      var can = TW.Craft.canMake(r);
      var costHtml = Object.keys(r.cost).map(function (k) {
        var have = TW.Inv.count(k), need = r.cost[k];
        var okc = have >= need;
        return '<span>' + TW.ITEMS[k].icon + (okc ? '<b>' : '<s>') + have + '/' + need + (okc ? '</b>' : '</s>') + '</span>';
      }).join(' &nbsp; ');
      var owned = out.cat === 'tool' && TW.state.tools[r.out];
      h += '<div class="row"><span class="r-ic">' + out.icon + '</span><span class="r-mid">' +
        '<div class="r-nm">' + out.name + (owned ? ' ✔' : '') + '</div>' +
        '<div class="r-sub">' + r.effect + '</div>' +
        '<div class="r-cost">' + costHtml + '</div>' +
        (act && act.id === r.id ? '<div class="prog"><i id="craftBar"></i></div>' : '') +
        '</span>' +
        '<button class="go' + (can.ok ? '' : ' no') + '" data-act="craft" data-id="' + r.id + '">' +
        (owned ? '있음' : can.ok ? '만들기' : '재료') + '</button></div>';
    });
    h += '</div>';
    return h;
  }

  function updateCraftBar(p) {
    var b = document.getElementById('craftBar');
    if (b) b.style.width = (p * 100) + '%';
  }

  /* ---------- 건설 ---------- */
  function buildHtml() {
    var s = TW.state;
    var h = '<div class="card-body"><p class="card-note">건물을 고르면 놓을 수 있는 칸이 하얗게 반짝여요. 그 칸을 누르면 완성!</p>';
    TW.BUILDING_ORDER.forEach(function (type) {
      var d = TW.BUILDINGS[type];
      var lvOk = s.level >= d.lvl;
      var matOk = TW.Inv.hasAll(d.cost);
      var count = s.buildings.filter(function (b) { return b.type === type; }).length;
      var costHtml = Object.keys(d.cost).map(function (k) {
        var have = TW.Inv.count(k), need = d.cost[k];
        return '<span>' + TW.ITEMS[k].icon + (have >= need ? '<b>' : '<s>') + have + '/' + need + (have >= need ? '</b>' : '</s>') + '</span>';
      }).join(' &nbsp; ');
      h += '<div class="row"><span class="r-ic">' + d.icon + '</span><span class="r-mid">' +
        '<div class="r-nm">' + d.name + (count ? ' <span class="chip on">' + count + '개</span>' : '') + '</div>' +
        '<div class="r-sub">' + d.desc + '</div>' +
        '<div class="r-cost">' + costHtml + '</div></span>' +
        (lvOk
          ? '<button class="go' + (matOk ? '' : ' no') + '" data-act="build" data-type="' + type + '">' + (matOk ? '짓기' : '재료') + '</button>'
          : '<button class="go no">Lv.' + d.lvl + '</button>') +
        '</div>';
    });
    h += '</div>';
    return h;
  }

  /* ---------- 정령 ---------- */
  function spiritsHtml() {
    var s = TW.state;
    var h = '<div class="card-body">';
    h += '<p class="card-note">일자리 ' + TW.Spirits.jobsUsed() + ' / ' + TW.Player.spiritSlots(s) +
      ' · 일을 맡기지 않은 정령은 나를 따라다녀요. 정령이 모으는 속도는 느리니 직접 탐험하는 게 더 빨라요!</p>';
    TW.SPIRIT_ORDER.forEach(function (k) {
      var def = TW.SPIRITS[k], sp = s.spirits[k];
      if (!sp.found && !sp.friend) {
        h += '<div class="row"><span class="r-ic">❓</span><span class="r-mid">' +
          '<div class="r-nm">아직 만나지 못한 정령</div>' +
          '<div class="r-sub">' + TW.SPIRIT_HINT[k] + '</div></span></div>';
        return;
      }
      h += '<div class="row"><span class="sp-face">' + def.icon + '</span><span class="r-mid">' +
        '<div class="r-nm">' + def.name + ' <span class="chip">Lv.' + sp.level + '</span></div>' +
        '<div class="r-sub">' + def.power + ' · ' + def.personality + '</div>' +
        '<div class="chips"><span class="chip">발견: ' + def.where + '</span>' +
        '<span class="chip' + (sp.bond >= 50 ? ' on' : '') + '">친밀도 ' + Math.floor(sp.bond) + '</span>' +
        (sp.friend ? '' : '<span class="chip">아직 친구 아님</span>') + '</div>';
      if (sp.friend) {
        h += '<div class="jobs"><button class="' + (!sp.job ? 'on' : '') + '" data-act="job" data-k="' + k + '" data-b="0">🚶 같이 다니기</button>';
        s.buildings.forEach(function (b) {
          var taken = TW.Spirits.jobAt(b.id);
          if (taken && taken !== k) return;
          h += '<button class="' + (sp.job === b.id ? 'on' : '') + '" data-act="job" data-k="' + k + '" data-b="' + b.id + '">' +
            TW.BUILDINGS[b.type].icon + ' ' + TW.BUILDINGS[b.type].name + '</button>';
        });
        if (!s.buildings.length) h += '<span class="chip">건물을 지으면 일을 맡길 수 있어요</span>';
        h += '</div>';
        if (sp.job) h += '<div class="r-sub" style="margin-top:4px">지금 하는 일: <b>' + def.job.label + '</b></div>';
      } else {
        h += '<div class="r-sub" style="margin-top:4px">' + def.where + '에서 기다리고 있어요. 선물: ' +
          TW.ITEMS[def.gift.item].icon + ' ' + def.gift.qty + '개</div>';
      }
      h += '</span></div>';
    });
    h += '</div>';
    return h;
  }

  /* ---------- 도감 ---------- */
  function codexStats() {
    var s = TW.state;
    var resKeys = Object.keys(TW.ITEMS).filter(function (k) { return TW.ITEMS[k].cat === 'res' || TW.ITEMS[k].cat === 'seed' || TW.ITEMS[k].cat === 'special'; });
    var toolKeys = Object.keys(TW.ITEMS).filter(function (k) { return TW.ITEMS[k].cat === 'tool'; });
    var bKeys = TW.BUILDING_ORDER.slice();
    var sKeys = TW.SPIRIT_ORDER.slice();
    var found = 0, total = 0;
    total += resKeys.length; found += resKeys.filter(function (k) { return s.codex.items[k]; }).length;
    total += toolKeys.length; found += toolKeys.filter(function (k) { return s.codex.items[k] || s.tools[k]; }).length;
    total += bKeys.length; found += bKeys.filter(function (k) { return s.codex.buildings[k]; }).length;
    total += sKeys.length; found += sKeys.filter(function (k) { return s.codex.spirits[k]; }).length;
    return { found: found, total: total, pct: Math.round((found / total) * 100), resKeys: resKeys, toolKeys: toolKeys, bKeys: bKeys, sKeys: sKeys };
  }

  function codexHtml() {
    var s = TW.state, st = codexStats();
    var h = '<div class="card-body">';
    h += '<div class="codex-top"><span style="font-size:34px">📖</span><div><div class="big">' + st.pct + '%</div>' +
      '<div class="r-sub">' + st.found + ' / ' + st.total + '개 발견</div></div></div>';

    h += '<div class="sec-title">🧚 정령</div><div class="grid">';
    st.sKeys.forEach(function (k) {
      var def = TW.SPIRITS[k], got = s.codex.spirits[k];
      h += '<div class="cell tap' + (got ? '' : ' lock') + '"' + (got ? ' data-act="codex" data-kind="spirit" data-k="' + k + '"' : '') + '>' +
        '<div class="ic">' + (got ? def.icon : '❓') + '</div><div class="nm">' + (got ? def.name : '???') + '</div></div>';
    });
    h += '</div>';

    h += '<div class="sec-title">🪵 자원</div><div class="grid">';
    st.resKeys.forEach(function (k) {
      var it = TW.ITEMS[k], got = s.codex.items[k];
      h += '<div class="cell tap' + (got ? '' : ' lock') + '"' + (got ? ' data-act="codex" data-kind="item" data-k="' + k + '"' : '') + '>' +
        '<div class="ic">' + (got ? it.icon : '❓') + '</div><div class="nm">' + (got ? it.name : '???') + '</div></div>';
    });
    h += '</div>';

    h += '<div class="sec-title">🪓 도구</div><div class="grid">';
    st.toolKeys.forEach(function (k) {
      var it = TW.ITEMS[k], got = s.codex.items[k] || s.tools[k];
      h += '<div class="cell tap' + (got ? '' : ' lock') + '"' + (got ? ' data-act="codex" data-kind="item" data-k="' + k + '"' : '') + '>' +
        '<div class="ic">' + (got ? it.icon : '❓') + '</div><div class="nm">' + (got ? it.name : '???') + '</div></div>';
    });
    h += '</div>';

    h += '<div class="sec-title">🏠 건물</div><div class="grid">';
    st.bKeys.forEach(function (k) {
      var d = TW.BUILDINGS[k], got = s.codex.buildings[k];
      h += '<div class="cell tap' + (got ? '' : ' lock') + '"' + (got ? ' data-act="codex" data-kind="building" data-k="' + k + '"' : '') + '>' +
        '<div class="ic">' + (got ? d.icon : '❓') + '</div><div class="nm">' + (got ? d.name : '???') + '</div></div>';
    });
    h += '</div></div>';
    return h;
  }

  function codexDetail(kind, k) {
    var ic, nm, lines = [];
    if (kind === 'spirit') {
      var d = TW.SPIRITS[k], sp = TW.state.spirits[k];
      ic = d.icon; nm = d.name;
      lines.push(d.desc);
      lines.push('성격: ' + d.personality);
      lines.push('능력: ' + d.power);
      lines.push('발견 장소: ' + d.where);
      lines.push('레벨 ' + sp.level + ' · 친밀도 ' + Math.floor(sp.bond));
      lines.push('성장 순서: ' + d.evo.join(' → '));
    } else if (kind === 'item') {
      var it = TW.ITEMS[k];
      ic = it.icon; nm = it.name;
      lines.push(it.desc);
      if (it.cat === 'tool') lines.push('도구 등급: ' + it.tier);
      else lines.push('가진 개수: ' + TW.Inv.count(k) + '개');
    } else {
      var b = TW.BUILDINGS[k];
      ic = b.icon; nm = b.name;
      lines.push(b.desc);
      lines.push('필요 레벨: ' + b.lvl);
      lines.push('정령 일자리: ' + b.spiritJob);
    }
    cheer('<div class="c-ic">' + ic + '</div><h2>' + nm + '</h2>' +
      lines.map(function (l) { return '<p>' + l + '</p>'; }).join('') +
      '<button class="big-btn" data-act="backCodex">닫기</button>');
  }

  /* ---------- 세계수 ---------- */
  function treeHtml() {
    var s = TW.state;
    var icons = ['', '🌰', '🌱', '🌳', '🌟'];
    var h = '<div class="card-body" style="text-align:center">';
    h += '<div style="font-size:64px">' + icons[s.tree.stage] + '</div>';
    h += '<div class="r-nm" style="font-size:19px">' + TW.WorldTree.stageName() + ' (' + s.tree.stage + '/4단계)</div>';
    if (s.tree.stage < 4) {
      h += '<p class="card-note">에너지 ' + s.tree.energy + ' / ' + TW.WorldTree.nextNeed() + ' 모으면 다음 단계!</p>';
      h += '<div class="prog"><i style="width:' + (TW.WorldTree.progress() * 100) + '%"></i></div>';
      var next = TW.WorldTree.UNLOCK[s.tree.stage + 1];
      if (next) h += '<p class="card-note">다음 단계 보상: 🔓 ' + TW.REGIONS[next].name + ' 열림</p>';
    } else {
      h += '<p class="card-note">세계수가 다 자랐어요! 섬이 빛나고 있어요 🌟</p>';
    }
    h += '<div class="sec-title" style="justify-content:center">🎁 에너지 주기</div>';
    h += '<p class="card-note">자원을 주면 세계수가 자라요. 퀘스트와 건물, 정령 친구도 에너지를 줘요.</p>';
    TW.OFFERINGS.forEach(function (o) {
      var it = TW.ITEMS[o.item];
      var have = TW.Inv.count(o.item);
      if (!have && !TW.state.codex.items[o.item]) return;
      var ok = have >= o.cost;
      h += '<div class="row"><span class="r-ic">' + it.icon + '</span><span class="r-mid" style="text-align:left">' +
        '<div class="r-nm">' + it.name + ' ' + o.cost + '개</div>' +
        '<div class="r-sub">에너지 +' + o.energy + ' · 지금 ' + have + '개 있음</div></span>' +
        '<button class="go' + (ok ? '' : ' no') + '" data-act="offer" data-item="' + o.item + '">주기</button></div>';
    });
    h += '</div>';
    return h;
  }

  /* ---------- 설정 ---------- */
  function settingsHtml() {
    var s = TW.state;
    var st = codexStats();
    var mins = Math.floor(s.stats.play / 60);
    var h = '<div class="card-body">';
    h += '<div class="set-row"><span><span class="lb">소리</span><br><span class="sb">채집·제작·축하 효과음</span></span>' +
      '<button class="toggle' + (s.settings.sound ? ' on' : '') + '" data-act="sound"></button></div>';
    h += '<div class="set-row"><span><span class="lb">플레이어 바꾸기</span><br><span class="sb">이름·캐릭터를 고를 수 있어요</span></span>' +
      '<button class="go alt" data-act="profile">고르기</button></div>';
    h += '<div class="sec-title">📊 내 섬</div>';
    h += '<div class="row"><span class="r-ic">🏝️</span><span class="r-mid">' +
      '<div class="r-sub">레벨 ' + s.level + ' · 섬 점수 ' + TW.islandScore() + '점</div>' +
      '<div class="r-sub">퀘스트 ' + TW.Quests.doneCount() + '/' + TW.QUESTS.length +
      ' · 정령 친구 ' + TW.Spirits.countFriends() + '/4 · 건물 ' + s.buildings.length + '개</div>' +
      '<div class="r-sub">도감 ' + st.pct + '% · 채집 ' + s.counters.gather_all + '번 · 놀이 시간 ' + mins + '분</div>' +
      '</span></div>';
    h += '<div class="sec-title">🧭 도움말</div>';
    h += '<div class="set-row"><span><span class="lb">게임 방법 · 막힐 때 보기</span>' +
      '<br><span class="sb">조작법 · 채집 · 제작 · 건설 · 정령 · 세계수</span></span>' +
      '<button class="go alt" data-act="help">❓ 열기</button></div>';
    h += '<div class="set-row"><span><span class="lb">처음 안내 다시 보기</span></span>' +
      '<button class="go alt" data-act="howto">보기</button></div>';
    h += '<div class="set-row"><span><span class="lb">시작 화면으로</span><br><span class="sb">진행은 자동으로 저장돼요</span></span>' +
      '<button class="go alt" data-act="totitle">나가기</button></div>';
    h += '<div class="sec-title">⚠️ 처음부터 다시</div>';
    h += '<p class="card-note">저장된 섬이 모두 사라져요. 정말 다시 시작할 때만 눌러요.</p>';
    h += '<button class="go warn" style="width:100%" data-act="reset1">저장 지우고 새로 시작</button>';
    if (!TW.Save.canStore()) h += '<p class="card-note">⚠️ 이 브라우저에서는 저장이 막혀 있어요. 창을 닫으면 진행이 사라져요.</p>';
    h += '</div>';
    return h;
  }

  /* ---------- 정령 대화 ---------- */
  function spiritDialog(k) {
    talkState = { k: k, i: 0 };
    panel = 'talk';
    el.overlay.classList.remove('hidden');
    drawTalk();
  }

  function drawTalk() {
    var k = talkState.k, def = TW.SPIRITS[k], sp = TW.state.spirits[k];
    var lastIdx = def.lines.length - 1;
    var line = def.lines[Math.min(talkState.i, lastIdx)];
    var isLast = talkState.i >= lastIdx;
    var g = def.gift, canGift = TW.Inv.has(g.item, g.qty);
    var h = '<div class="talk"><div class="t-face">' + def.icon + '</div>' +
      '<div class="t-nm">' + def.name + '</div>' +
      '<div class="t-bubble">' + line + '</div>';
    if (isLast) {
      h += '<div class="t-gift">선물: ' + TW.ITEMS[g.item].icon + ' ' + TW.ITEMS[g.item].name + ' ' + g.qty + '개 ' +
        '(지금 ' + TW.Inv.count(g.item) + '개)</div>';
      h += '<div class="row-btn">' +
        '<button class="big-btn' + (canGift ? '' : ' ghost') + '" data-act="gift">' + (canGift ? '🎁 선물 주기' : '아직 없어…') + '</button>' +
        '<button class="big-btn ghost" data-act="close">나중에</button></div>';
    } else {
      h += '<div class="row-btn"><button class="big-btn" data-act="next">다음 ▶</button></div>';
    }
    h += '</div>';
    el.overlayCard.innerHTML = h;
  }

  /* ---------- 튜토리얼 ---------- */
  var TUT = [
    { ic: '🏝️', t: '작은 섬에 도착했어!', p: '섬 가운데에 <b>세계수의 씨앗</b>이 잠들어 있어.<br>씨앗을 키워서 섬을 되살리자!',
      keys: ['방향키 / WASD 로 이동', '왼쪽 아래 패드로 이동(모바일)'] },
    { ic: '🌳', t: '먼저 나무와 돌을 모으자', p: '나무나 돌 <b>가까이 가면</b> 네모 표시가 생겨.<br>그때 모으기 버튼을 누르면 채집!',
      keys: ['스페이스 / E 키', '오른쪽 아래 큰 버튼'] },
    { ic: '🔨', t: '작업대를 짓고 도구를 만들자', p: '아래 <b>건설</b>에서 작업대를 고르고<br>하얗게 빛나는 칸을 누르면 완성!',
      keys: ['건설 🏠', '제작 🔨'] },
    { ic: '🧚', t: '정령을 만나 친구가 되자', p: '많이 채집하면 정령이 나타나.<br>좋아하는 선물을 주면 친구가 되어 도와줘!',
      keys: ['정령 🧚', '도감 📖'] },
    { ic: '🌟', t: '세계수를 키우면 새 지역이 열려!', p: '위쪽 <b>세계수 칸</b>을 눌러 에너지를 주자.<br>4단계까지 키우는 게 목표야!',
      keys: ['화면 위 🌱 버튼'] }
  ];
  var tutIdx = 0;

  function howto(fromTitle) {
    tutIdx = 0;
    panel = 'tut';
    el.overlay.classList.remove('hidden');
    drawTut(fromTitle);
  }
  function drawTut(fromTitle) {
    var t = TUT[tutIdx];
    var dots = TUT.map(function (_, i) { return '<i class="' + (i === tutIdx ? 'on' : '') + '"></i>'; }).join('');
    el.overlayCard.innerHTML = '<div class="tut"><div class="t-ic">' + t.ic + '</div>' +
      '<h2>' + t.t + '</h2><p>' + t.p + '</p>' +
      '<div class="keys">' + t.keys.map(function (k) { return '<span class="key">' + k + '</span>'; }).join('') + '</div>' +
      '<div class="dots">' + dots + '</div>' +
      '<button class="big-btn" data-act="tutNext" data-from="' + (fromTitle ? '1' : '') + '">' +
      (tutIdx === TUT.length - 1 ? '시작하기!' : '다음 ▶') + '</button>' +
      (tutIdx < TUT.length - 1 ? '<button class="big-btn ghost" data-act="close" style="margin-top:8px">건너뛰기</button>' : '') +
      '</div>';
  }

  /* ================= 카드 안 클릭 처리 ================= */
  function onCardClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');

    if (act === 'close') { TW.Audio.play('open'); closePanel(); return; }
    if (act === 'next') { talkState.i++; TW.Audio.play('open'); drawTalk(); return; }
    if (act === 'gift') {
      if (TW.Spirits.tryBefriend(talkState.k)) {
        var k = talkState.k;
        closePanel();
        setTimeout(function () {
          cheer('<div class="c-ic">' + TW.SPIRITS[k].icon + '</div><h2>' + TW.SPIRITS[k].name + ' 친구!</h2>' +
            '<p>' + TW.SPIRITS[k].thanks + '</p>' +
            '<div class="gifts"><div class="gift">' + TW.SPIRITS[k].power + '</div>' +
            '<div class="gift">정령 메뉴에서 일을 맡길 수 있어요</div></div>' +
            '<button class="big-btn" data-act="close">고마워!</button>');
        }, 60);
      } else {
        toast('선물이 아직 부족해! ' + TW.ITEMS[TW.SPIRITS[talkState.k].gift.item].name + '을 모아 오자.', '🎁');
      }
      return;
    }
    if (act === 'eat') { TW.Inv.eat(b.getAttribute('data-item')); return; }
    if (act === 'craft') { TW.Craft.start(b.getAttribute('data-id')); return; }
    if (act === 'build') { TW.Building.beginPlace(b.getAttribute('data-type')); return; }
    if (act === 'offer') { TW.WorldTree.offer(b.getAttribute('data-item')); return; }
    if (act === 'job') {
      var bid = parseInt(b.getAttribute('data-b'), 10);
      TW.Spirits.setJob(b.getAttribute('data-k'), bid === 0 ? null : bid);
      return;
    }
    if (act === 'codex') { codexDetail(b.getAttribute('data-kind'), b.getAttribute('data-k')); return; }
    if (act === 'backCodex') { openPanel('codex'); return; }
    if (act === 'sound') {
      TW.state.settings.sound = !TW.state.settings.sound;
      TW.Audio.setOn(TW.state.settings.sound);
      if (TW.state.settings.sound) TW.Audio.play('get');
      renderPanel();
      return;
    }
    if (act === 'profile') {
      if (window.JG && JG.openPicker) JG.openPicker();
      return;
    }
    if (act === 'howto') { howto(false); return; }
    if (act === 'helpTopic') {
      var id = b.getAttribute('data-id');
      helpOpen = (helpOpen === id) ? '' : id;
      TW.Audio.play('open');
      renderPanel();
      return;
    }
    if (act === 'guide') {
      var c2 = TW.Help.setGuideFromCurrent();
      closePanel();
      if (c2.target) {
        toast('화살표를 따라가 보자! → ' + c2.target.label, '🧭');
        TW.Audio.play('event');
      }
      return;
    }
    if (act === 'goPanel') { openPanel(b.getAttribute('data-p')); return; }
    if (act === 'help') { openPanel('help'); return; }
    if (act === 'totitle') { TW.Game.toTitle(); return; }
    if (act === 'reset1') {
      cheer('<div class="c-ic">⚠️</div><h2>정말 지울까요?</h2>' +
        '<p>지금까지 키운 섬이 모두 사라져요.<br>되돌릴 수 없어요.</p>' +
        '<button class="go warn" style="width:100%;margin-top:10px" data-act="reset2">네, 지우고 새로 시작</button>' +
        '<button class="big-btn ghost" style="margin-top:8px" data-act="close">아니요</button>');
      return;
    }
    if (act === 'reset2') { TW.Save.clear(); closePanel(); TW.Game.toTitle(true); return; }
    if (act === 'tutNext') {
      var fromTitle = b.getAttribute('data-from') === '1';
      tutIdx++;
      if (tutIdx >= TUT.length) {
        closePanel();
        if (TW.state) { TW.state.tutorial.done = true; }
        return;
      }
      drawTut(fromTitle);
      return;
    }
  }

  return {
    init: init, toast: toast, eventBanner: eventBanner, confetti: confetti,
    syncHud: syncHud, renderQuests: renderQuests, levelUp: levelUp, questDone: questDone,
    treeGrowScene: treeGrowScene, pingSpirit: pingSpirit,
    openPanel: openPanel, closePanel: closePanel, renderPanel: renderPanel,
    currentPanel: function () { return panel; },
    showPlaceBar: showPlaceBar, hidePlaceBar: hidePlaceBar,
    updateCraftBar: updateCraftBar, spiritDialog: spiritDialog,
    howto: howto, codexStats: codexStats, helpFocus: helpFocus, el: el
  };
})();

/* 퀘스트에서 쓰는 도감 진행률 */
TW.codexPercent = function () {
  try { return TW.UI.codexStats().pct; } catch (e) { return 0; }
};
