/* ===========================================================
   Tiny World - js/help.js
   도움말 · 힌트 · 길안내 화살표
   "설명을 읽지 않아도 알 수 있게" 가 원칙이지만,
   막혔을 때는 언제든 도움을 받을 수 있어야 한다.
   =========================================================== */
window.TW = window.TW || {};
TW.Help = (function () {
  var guide = null;        /* {x, y, label, until} 길안내 목표 */
  var idle = 0;            /* 아무 진행이 없는 시간(초) */
  var lastAuto = 0;        /* 마지막 자동 힌트 이후 시간 */
  var IDLE_LIMIT = 40;     /* 이만큼 아무 일도 없으면 살짝 알려 준다 */

  /* 뭔가 진척이 있었다 → 자동 힌트 타이머를 되돌린다 */
  function mark() { idle = 0; }

  /* ---------- 길안내 목표 찾기 ---------- */
  function nearestNode(type) {
    var p = TW.state.pos, best = null, bd = 1e9;
    TW.state.nodes.forEach(function (n) {
      if (n.hp <= 0 || n.t !== type) return;
      if (TW.Map.regionLocked(n.x, n.y)) return;
      var d = Math.sqrt(Math.pow(n.x + 0.5 - p.x, 2) + Math.pow(n.y + 0.5 - p.y, 2));
      if (d < bd) { bd = d; best = n; }
    });
    return best ? { x: best.x + 0.5, y: best.y + 0.5, label: TW.NODES[type].name } : null;
  }

  function resolve(g) {
    if (!g) return null;
    if (g.kind === 'node') return nearestNode(g.t);
    if (g.kind === 'worldtree') {
      var T = TW.MAP.tree;
      return { x: T.x + 0.5, y: T.y + 1.2, label: '세계수' };
    }
    if (g.kind === 'spirit') {
      var sp = TW.state.spirits[g.k];
      if (sp && sp.spawned && !sp.friend) {
        var pp = TW.Spirits.posOf(g.k);
        return { x: pp.x, y: pp.y, label: TW.SPIRITS[g.k].name };
      }
      return null;
    }
    if (g.kind === 'building') {
      var found = null;
      TW.state.buildings.forEach(function (b) { if (b.type === g.t && !found) found = b; });
      if (found) return { x: found.x + 0.5, y: found.y + 0.6, label: TW.BUILDINGS[g.t].name };
      return null;
    }
    return null;   /* panel 안내는 지도 목표가 없다 */
  }

  /* 지금 목표에 대한 안내 문구 + 지도 목표 */
  function current() {
    var list = TW.Quests.active();
    if (!list.length) {
      return {
        title: '모든 목표를 다 했어!',
        text: '이제 섬을 마음대로 꾸며 보자. 건물을 더 짓고, 정령에게 일을 맡기고,\n' +
              '도감의 ❓ 를 채우러 새로운 곳을 돌아다녀도 좋아!',
        target: null, panel: null, icon: '🎉'
      };
    }
    var q = list[0].q;
    var g = q.guide;
    var target = resolve(g);
    if (!target && g && g.fallback) target = resolve(g.fallback);
    var panel = null;
    if (g && g.kind === 'panel') panel = g.p;
    if (!target && g && g.fallback && g.fallback.kind === 'panel') panel = g.fallback.p;
    return {
      title: q.title,
      text: q.help || q.hint || '',
      target: target, panel: panel, icon: '📌',
      cur: list[0].cur, need: list[0].need
    };
  }

  /* ---------- 힌트 보여주기 ---------- */
  function show(fromButton) {
    var c = current();
    idle = 0;
    lastAuto = 0;
    if (c.target) {
      guide = { x: c.target.x, y: c.target.y, label: c.target.label, until: 30 };
    } else {
      guide = null;
    }
    if (fromButton) {
      TW.UI.openPanel('help');
      TW.UI.helpFocus('now');
    } else {
      TW.UI.toast(c.target ? ('화살표를 따라가 보자 → ' + c.target.label)
                           : (c.panel ? '아래 ' + panelName(c.panel) + ' 버튼을 눌러 봐!' : c.title), '💡');
    }
    return c;
  }

  function panelName(p) {
    return ({ inv: '🎒 가방', craft: '🔨 제작', build: '🏠 건설',
              spirits: '🧚 정령', codex: '📖 도감', settings: '⚙️ 설정' })[p] || p;
  }

  /* ---------- 매 프레임 ---------- */
  function update(dt) {
    if (guide) {
      guide.until -= dt;
      /* 목표에 거의 도착했으면 안내를 끈다 */
      var p = TW.state.pos;
      if (Math.sqrt(Math.pow(guide.x - p.x, 2) + Math.pow(guide.y - p.y, 2)) < 1.6) guide = null;
      else if (guide.until <= 0) guide = null;
    }
    if (TW.UI.currentPanel()) { idle = 0; return; }
    idle += dt;
    lastAuto += dt;
    if (idle >= IDLE_LIMIT && lastAuto >= IDLE_LIMIT) {
      idle = 0; lastAuto = 0;
      var c = current();
      TW.Audio.play('open');
      TW.UI.toast('뭘 해야 할지 모르겠으면 ❓ 를 눌러 봐!', '💡');
      setTimeout(function () {
        if (!TW.UI.currentPanel()) TW.UI.toast(c.title, '📌');
      }, 1400);
      if (c.target) guide = { x: c.target.x, y: c.target.y, label: c.target.label, until: 25 };
    }
  }

  /* ---------- 도움말 화면 내용 ---------- */
  var TOPICS = [
    { id: 'move', icon: '🕹️', title: '움직이기',
      lines: ['**PC** — 방향키 또는 W·A·S·D 로 움직여.',
              '**휴대폰·태블릿** — 화면 왼쪽 아래 동그란 화살표 4개를 누르고 있으면 움직여.',
              '가고 싶은 곳으로 걸어가면 돼. 떨어지거나 죽는 건 없으니 마음껏 돌아다녀!'] },
    { id: 'gather', icon: '✋', title: '자원 모으기 (채집)',
      lines: ['나무·돌·풀 **옆으로 걸어가면** 하얀 네모 표시가 생겨. 그게 "이제 캘 수 있어"라는 뜻이야.',
              '그때 오른쪽 아래 **큰 버튼**(PC는 스페이스 또는 E)을 누르면 캐져.',
              '버튼을 **꾹 누르고 있으면** 계속 캘 수 있어.',
              '캘 때마다 활동력이 1 줄어. 활동력은 5초에 1씩 저절로 차고, 집에서 쉬면 가득 차.',
              '🍓 열매나 🍄 버섯은 가방에서 **먹기**를 누르면 활동력이 돌아와.',
              '💧 물은 활동력을 쓰지 않아!'] },
    { id: 'tool', icon: '🪓', title: '도구 만들기',
      lines: ['도구는 **작업대 옆**에서만 만들 수 있어. 작업대를 먼저 지어야 해.',
              '작업대 옆에서 채집 버튼을 누르거나, 아래 🔨 **제작**을 눌러 봐.',
              '도구는 **저절로 제일 좋은 게 쓰여.** 따로 고르거나 꺼낼 필요가 없어.',
              '도끼는 나무를, 곡괭이는 돌을 더 많이·더 빨리 캐게 해 줘.',
              '🔒 표시가 붙은 철광석은 **돌 곡괭이**가 있어야 캘 수 있어.'] },
    { id: 'build', icon: '🏠', title: '건물 짓기',
      lines: ['아래 🏠 **건설**을 누르고, 짓고 싶은 건물의 "짓기"를 눌러.',
              '그러면 지도에 **놓을 수 있는 칸이 하얗게 반짝여.** 그 칸을 누르면 완성!',
              '"Lv.3" 이라고 쓰여 있으면 레벨이 더 필요하다는 뜻이야.',
              '🛠️ 작업대 = 도구 만들기 · 🏠 작은 집 = 쉬기 · 📦 창고 = 가방 늘리기',
              '🌾 텃밭 = 씨앗 심기 · 🏕️ 정령 쉼터 = 정령 일자리 늘리기',
              '건물 옆에 가서 버튼을 누르면 그 건물을 쓸 수 있어.'] },
    { id: 'farm', icon: '🌾', title: '텃밭 가꾸기',
      lines: ['🌿 풀숲을 캐면 🌱 씨앗이 나올 때가 있어. (풀 3개로 씨앗을 만들 수도 있어)',
              '텃밭 옆에서 버튼을 누르면 → **씨앗 심기** → **물 주기** → 기다리기 → **수확!**',
              '물은 왼쪽 아래 **연못가**에서 퍼 올 수 있어.',
              '다 자라면 ✨ 표시가 떠. 그때 누르면 열매를 얻어.',
              '비가 오는 날이나 💧 물방울 정령이 도와주면 훨씬 빨리 자라!'] },
    { id: 'spirit', icon: '🧚', title: '정령과 친구되기',
      lines: ['정령은 **뽑기로 얻는 게 아니야.** 조건을 채우면 섬에 나타나.',
              '나타나면 ❓ 표시가 뜨고, 아래 🧚 버튼에도 빨간 점이 생겨.',
              '정령 옆으로 가서 버튼을 누르면 이야기를 해. 정령이 **좋아하는 선물**을 말해 줄 거야.',
              '선물을 가방에 들고 다시 말을 걸면 **친구**가 돼!',
              '정령을 잡거나 싸우는 건 없어. 무서운 것도 없어.',
              '친구가 된 정령은 🧚 정령 화면에서 **건물에 일을 맡길** 수 있어. 그냥 같이 다녀도 돼.',
              '정령이 자원을 모아 오는 건 아주 느려. **내가 직접 캐는 게 훨씬 빨라!**'] },
    { id: 'tree', icon: '🌟', title: '세계수 키우기 (제일 큰 목표)',
      lines: ['섬 가운데 흙길을 따라 올라가면 🌰 **세계수**가 있어.',
              '세계수 옆에서 버튼을 누르거나, **화면 맨 위 세계수 칸**을 눌러도 창이 열려.',
              '자원을 주면 **에너지**가 쌓이고, 에너지가 모이면 세계수가 자라!',
              '🌸 꽃 1개 = 1 · 🪵 나무 3개 = 1 · 🪙 철광석 1개 = 3 · ☄️ 별돌 1개 = 6',
              '2단계 → 작은 숲이 열려 · 3단계 → 바위 언덕이 열려 · 4단계 → 새로운 세계의 문!',
              '퀘스트를 끝내고 건물을 짓고 정령과 친구가 될 때도 에너지를 받아.'] },
    { id: 'stuck', icon: '🤔', title: '이럴 때는 어떻게 해요?',
      lines: ['**"활동력이 없어요"** → 집에서 쉬거나, 가방에서 🍓 열매·🍄 버섯을 먹어. 가만히 있어도 저절로 차.',
              '**"가방이 꽉 찼어요"** → 📦 창고를 지으면 150개 더 담을 수 있어. 세계수에 자원을 줘도 줄어들어.',
              '**"씨앗이 없어요"** → 🌿 풀숲을 캐 봐. 제작에서 풀 3개로 씨앗을 만들 수도 있어.',
              '**"철광석이 안 캐져요"** → 🔒 표시야. 작업대에서 **돌 곡괭이**를 먼저 만들자.',
              '**"안개 때문에 못 가요"** → 세계수를 더 키우면 열려. 안개 위에 몇 단계가 필요한지 쓰여 있어.',
              '**"정령이 안 나타나요"** → 🧚 정령 화면에 나타나는 방법이 적혀 있어. 조건을 채우면 꼭 나타나!',
              '**"저장은 되나요?"** → 10초마다 저절로 저장돼. 다음에 **이어하기**를 누르면 그대로 이어져.'] }
  ];

  return {
    mark: mark, update: update, show: show, current: current,
    TOPICS: TOPICS, panelName: panelName,
    guide: function () { return guide; },
    clearGuide: function () { guide = null; },
    setGuideFromCurrent: function () {
      var c = current();
      guide = c.target ? { x: c.target.x, y: c.target.y, label: c.target.label, until: 30 } : null;
      return c;
    }
  };
})();
