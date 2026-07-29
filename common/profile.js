/* =========================================================================
   common/profile.js — 미니게임 공용 "플레이어 · 기록 · 배지" 라이브러리
   -------------------------------------------------------------------------
   모든 게임에서 이렇게 불러 씁니다 (games/<카테고리>/<게임>/index.html 기준):
       <script src="../../../common/profile.js"></script>

   ▸ 저장 위치는 이 브라우저의 localStorage 하나뿐입니다.
     (서버가 없으므로 다른 사람 / 다른 기기에는 보이지 않습니다.)
     localStorage가 막혀 있으면 자동으로 메모리 저장으로 대체되고,
     어떤 경우에도 예외를 던져 게임을 멈추지 않습니다.

   ▸ 주요 API
       JG.player()                      → {id,name,emoji}  현재 플레이어
       JG.players()                     → 전체 목록
       JG.mountChip(el)                 → 프로필 칩(이름+이모지) 붙이기. 누르면 전환/편집
       JG.openPicker()                  → 플레이어 선택/추가 창 직접 열기
       JG.submit(gameId, opts)          → 기록 저장. {best,isNewBest,prevBest,plays} 반환
                                          opts = {score, mode, lowerIsBetter, unit, label}
       JG.best(gameId, mode)            → 최고 기록(없으면 null)
       JG.recent(gameId, n)             → 최근 기록 배열
       JG.stat(gameId, key, add)        → 누적 카운터 (add 생략 시 조회)
       JG.award(badgeId)                → 배지 획득. 처음 얻은 거면 true + 토스트
       JG.badges()                      → 획득한 배지 id → 획득시각
       JG.toast(msg, emoji)             → 화면 위 알림
       JG.resultBox(el, info)           → 결과화면용 기록/배지 요약 HTML 그려주기
       JG.BADGES                        → 배지 카탈로그 {id:{emoji,title,desc,game}}
       JG.GAMES                         → 게임 id → 이름/이모지
       JG.on('change', fn)              → 플레이어가 바뀌면 호출
   ========================================================================= */
(function (global) {
  'use strict';

  var KEY = 'jerryGames_v1';
  var mem = null;            // localStorage가 막혔을 때 쓰는 메모리 대체 저장소
  var listeners = { change: [] };

  /* ---------------- 저장소 ---------------- */
  function blank() {
    return { activeId: null, profiles: [], data: {} };
  }
  function read() {
    if (mem) return mem;
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object' && Array.isArray(o.profiles)) return o;
      }
    } catch (e) {}
    return blank();
  }
  function write(db) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(db));
      mem = null;
    } catch (e) {
      mem = db;               // 저장 실패 → 이번 세션 동안만 메모리에 유지
    }
    return db;
  }

  /* ---------------- 게임 목록 ---------------- */
  var GAMES = {
    'math-speed':          { emoji: '⚡',  title: '연산 스피드 퀴즈', cat: 'study' },
    'times-table-shooter': { emoji: '🚀', title: '구구단 슈팅',      cat: 'study' },
    'word-cards':          { emoji: '🔤', title: '영단어 카드 퀴즈', cat: 'study' },
    'quiz-science':        { emoji: '🧠', title: '상식·과학 퀴즈',   cat: 'study' },
    'kkeutmalitgi':        { emoji: '🗣️', title: '끝말잇기',        cat: 'fun' },
    'hidden-object':       { emoji: '🔍', title: '숨은그림찾기',     cat: 'fun' },
    'set':                 { emoji: '🃏', title: 'SET 카드게임',     cat: 'fun' },
    'jump-map':            { emoji: '🏃', title: '점프맵 200',       cat: 'fun' },
    'subway-io':           { emoji: '🚇', title: '지하철 슬리더',    cat: 'fun' },
    'onitama':             { emoji: '🥷', title: '오니타마',         cat: 'fun' },
    'cooking-catch':       { emoji: '🍳', title: '요리조리 셰프',    cat: 'fun' }
  };

  /* ---------------- 배지 카탈로그 ---------------- */
  var BADGES = {
    /* 공통 */
    'first-play':   { emoji: '👋', title: '첫 발자국',     desc: '게임을 처음 끝까지 해봤어요',            game: '*' },
    'play-10':      { emoji: '🎮', title: '단골 손님',     desc: '게임을 10판 했어요',                     game: '*' },
    'play-50':      { emoji: '🏅', title: '게임 고수',     desc: '게임을 50판 했어요',                     game: '*' },
    'explorer-5':   { emoji: '🧭', title: '탐험가',        desc: '서로 다른 게임 5개를 해봤어요',          game: '*' },
    'explorer-all': { emoji: '🌟', title: '올라운더',      desc: '11개 게임을 전부 해봤어요',              game: '*' },

    /* 연산 스피드 퀴즈 */
    'ms-hit20':     { emoji: '➕', title: '계산 척척',     desc: '한 판에 20문제 맞히기',                  game: 'math-speed' },
    'ms-hit40':     { emoji: '🧮', title: '계산 기계',     desc: '한 판에 40문제 맞히기',                  game: 'math-speed' },
    'ms-combo15':   { emoji: '🔥', title: '15연속!',       desc: '15문제 연속으로 맞히기',                 game: 'math-speed' },
    'ms-perfect':   { emoji: '💯', title: '무결점 계산',   desc: '10문제 이상 풀고 하나도 안 틀리기',      game: 'math-speed' },
    'ms-hard':      { emoji: '🧗', title: '어려움 정복',   desc: '어려움 난이도에서 15문제 맞히기',        game: 'math-speed' },

    /* 구구단 슈팅 */
    'tt-score300':  { emoji: '🎯', title: '명사수',        desc: '한 판에 300점 넘기기',                   game: 'times-table-shooter' },
    'tt-score700':  { emoji: '🚀', title: '구구단 에이스', desc: '한 판에 700점 넘기기',                   game: 'times-table-shooter' },
    'tt-nomiss':    { emoji: '🛡️', title: '무피격',        desc: '목숨 하나도 안 잃고 20문제 맞히기',      game: 'times-table-shooter' },
    'tt-combo15':   { emoji: '⚡', title: '연속 격추',     desc: '15연속으로 맞히기',                      game: 'times-table-shooter' },

    /* 영단어 카드 */
    'wc-quiz18':    { emoji: '📖', title: '단어 부자',     desc: '퀴즈 20문제 중 18개 이상 맞히기',        game: 'word-cards' },
    'wc-perfect':   { emoji: '💯', title: '완벽한 암기',   desc: '퀴즈 한 판을 다 맞히기',                 game: 'word-cards' },
    'wc-total100':  { emoji: '🏆', title: '단어 100개',    desc: '영단어를 모두 합쳐 100개 맞히기',        game: 'word-cards' },
    'wc-topics':    { emoji: '🗂️', title: '주제 정복',     desc: '서로 다른 주제 5개를 풀어보기',          game: 'word-cards' },

    /* 상식·과학 퀴즈 */
    'qs-perfect':   { emoji: '💯', title: '박사님',        desc: '퀴즈 한 판을 다 맞히기',                 game: 'quiz-science' },
    'qs-total50':   { emoji: '🔬', title: '지식 수집가',   desc: '모두 합쳐 50문제 맞히기',                game: 'quiz-science' },
    'qs-topics':    { emoji: '🌍', title: '전 주제 도전',  desc: '6개 주제를 모두 한 번씩 풀어보기',       game: 'quiz-science' },
    'qs-streak10':  { emoji: '🔥', title: '10연속 정답',   desc: '10문제 연속 맞히기',                     game: 'quiz-science' },

    /* 끝말잇기 */
    'kk-win':       { emoji: '🗣️', title: '첫 승리',       desc: '컴퓨터를 이겼어요',                      game: 'kkeutmalitgi' },
    'kk-hard':      { emoji: '👑', title: '말싸움 왕',     desc: '어려움 컴퓨터를 이겼어요',               game: 'kkeutmalitgi' },
    'kk-chain15':   { emoji: '⛓️', title: '15단어 릴레이', desc: '한 판에 15단어 이상 잇기',               game: 'kkeutmalitgi' },

    /* 숨은그림찾기 */
    'ho-clear':     { emoji: '🔍', title: '매의 눈',       desc: '한 판을 끝까지 클리어',                  game: 'hidden-object' },
    'ho-fast':      { emoji: '⏱️', title: '순간포착',      desc: '30초 안에 클리어',                       game: 'hidden-object' },
    'ho-nomiss':    { emoji: '🎯', title: '한 번도 안 틀림', desc: '헛클릭 없이 클리어',                   game: 'hidden-object' },

    /* SET */
    'set-clear':    { emoji: '🃏', title: 'SET 발견',      desc: '한 판을 끝까지 완주',                    game: 'set' },
    'set-12':       { emoji: '🧠', title: '패턴 마스터',   desc: '한 판에 SET 12개 찾기',                  game: 'set' },
    'set-nohint':   { emoji: '💡', title: '힌트 없이',     desc: '힌트 없이 한 판 완주',                   game: 'set' },

    /* 점프맵 200 */
    'jm-10':        { emoji: '🏃', title: '10단계 돌파',   desc: '10단계까지 도달',                        game: 'jump-map' },
    'jm-30':        { emoji: '🧗', title: '30단계 돌파',   desc: '30단계까지 도달',                        game: 'jump-map' },
    'jm-60':        { emoji: '🔥', title: '60단계 돌파',   desc: '60단계까지 도달',                        game: 'jump-map' },
    'jm-100':       { emoji: '👑', title: '100단계 돌파',  desc: '100단계까지 도달',                       game: 'jump-map' },
    'jm-200':       { emoji: '🏆', title: '점프맵 정복',   desc: '200단계 클리어!',                        game: 'jump-map' },
    'jm-star30':    { emoji: '⭐', title: '별 수집가',     desc: '별 30개 모으기',                         game: 'jump-map' },

    /* 지하철 슬리더 */
    'sub-len20':    { emoji: '🚋', title: '20량 편성',     desc: '열차를 20량까지 늘리기',                 game: 'subway-io' },
    'sub-len40':    { emoji: '🚄', title: '40량 편성',     desc: '열차를 40량까지 늘리기',                 game: 'subway-io' },
    'sub-len70':    { emoji: '🚅', title: '70량 편성',     desc: '열차를 70량까지 늘리기',                 game: 'subway-io' },
    'sub-len100':   { emoji: '🏆', title: '100량 편성',    desc: '열차를 최대 100량까지 늘리기',           game: 'subway-io' },
    'sub-first':    { emoji: '🥇', title: '1위 달성',      desc: '순위표 1위에 오르기',                    game: 'subway-io' },

    /* 오니타마 */
    'oni-win':      { emoji: '🥷', title: '첫 승',         desc: '컴퓨터를 이겼어요',                      game: 'onitama' },
    'oni-hard':     { emoji: '👑', title: '고수 격파',     desc: '어려움 컴퓨터를 이겼어요',               game: 'onitama' },
    'oni-master':   { emoji: '🏯', title: '사범님',        desc: '오니타마 5승 달성',                      game: 'onitama' },

    /* 요리조리 셰프 */
    'ck-dish3':     { emoji: '🍳', title: '주방 입문',     desc: '한 판에 요리 3개 완성',                  game: 'cooking-catch' },
    'ck-dish6':     { emoji: '👩‍🍳', title: '바쁜 셰프',     desc: '한 판에 요리 6개 완성',                  game: 'cooking-catch' },
    'ck-score200':  { emoji: '🏅', title: '200점 셰프',    desc: '한 판에 200점 넘기기',                   game: 'cooking-catch' },
    'ck-clean':     { emoji: '✨', title: '깔끔한 손맛',   desc: '실수 없이 요리 3개 완성',                game: 'cooking-catch' },
    'ck-total30':   { emoji: '🍽️', title: '요리 30접시',    desc: '모두 합쳐 요리 30개 완성',               game: 'cooking-catch' }
  };

  /* ---------------- 아바타 후보 ---------------- */
  var AVATARS = ['🦊','🐯','🐼','🐸','🦁','🐨','🐵','🐰','🐧','🦄','🐢','🦖','🐙','🦉','🐝','🐳','🚀','⚽','🎸','🍀','⭐','🍕','🤖','👾'];
  var COLORS  = ['#4285F4','#EA4335','#FBBC05','#34A853','#9334e6','#e8710a','#12b5cb','#d01884'];

  /* ---------------- 프로필 ---------------- */
  function uid() {
    return 'p' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  }
  function ensure(db) {
    if (!db.profiles.length) {
      var p = { id: uid(), name: '플레이어1', emoji: AVATARS[0], color: COLORS[0], created: Date.now() };
      db.profiles.push(p);
      db.activeId = p.id;
      write(db);
    }
    if (!db.activeId || !db.profiles.some(function (p) { return p.id === db.activeId; })) {
      db.activeId = db.profiles[0].id;
      write(db);
    }
    if (!db.data[db.activeId]) { db.data[db.activeId] = { records: {}, badges: {}, stats: {} }; write(db); }
    return db;
  }
  function player() {
    var db = ensure(read());
    return db.profiles.filter(function (p) { return p.id === db.activeId; })[0];
  }
  function players() { return ensure(read()).profiles.slice(); }
  function bucket(db) {
    var d = db.data[db.activeId];
    if (!d) { d = db.data[db.activeId] = { records: {}, badges: {}, stats: {} }; }
    if (!d.records) d.records = {};
    if (!d.badges) d.badges = {};
    if (!d.stats) d.stats = {};
    return d;
  }
  function addPlayer(name, emoji, color) {
    var db = ensure(read());
    var p = {
      id: uid(),
      name: (name || '플레이어').slice(0, 10),
      emoji: emoji || AVATARS[db.profiles.length % AVATARS.length],
      color: color || COLORS[db.profiles.length % COLORS.length],
      created: Date.now()
    };
    db.profiles.push(p);
    db.activeId = p.id;
    db.data[p.id] = { records: {}, badges: {}, stats: {} };
    write(db);
    fire('change');
    return p;
  }
  function updatePlayer(id, patch) {
    var db = ensure(read());
    db.profiles.forEach(function (p) {
      if (p.id === id) {
        if (patch.name != null) p.name = String(patch.name).slice(0, 10) || p.name;
        if (patch.emoji) p.emoji = patch.emoji;
        if (patch.color) p.color = patch.color;
      }
    });
    write(db);
    fire('change');
  }
  function removePlayer(id) {
    var db = ensure(read());
    if (db.profiles.length <= 1) return false;
    db.profiles = db.profiles.filter(function (p) { return p.id !== id; });
    delete db.data[id];
    if (db.activeId === id) db.activeId = db.profiles[0].id;
    write(db);
    fire('change');
    return true;
  }
  function setActive(id) {
    var db = ensure(read());
    if (!db.profiles.some(function (p) { return p.id === id; })) return;
    db.activeId = id;
    write(db);
    fire('change');
  }

  function fire(ev) {
    (listeners[ev] || []).forEach(function (f) { try { f(player()); } catch (e) {} });
  }
  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }

  /* ---------------- 온라인 순위표 다리 (common/records.js) ----------------
     기록은 항상 이 브라우저에 먼저 저장된다. 그 위에, 아래 표에 적힌
     "순위표 모드"로 플레이한 판만 온라인 순위표(api/ + Upstash)에도 올린다.
     서버는 게임당 순위표가 하나뿐이라, 난이도·주제가 뒤섞이면 순위가
     무의미해지기 때문이다. 인터넷이 없거나 서버 설정 전이면 조용히 실패하고
     records.js 가 큐에 담아 두었다가 다음 접속에 자동 재전송한다.
     ※ SET 은 기록이 '초'(작을수록 좋음)이고 서버 순위표는 큰 값이 이기는
        구조라 온라인 순위표에서는 제외한다(로컬 기록·배지는 그대로).      */
  var RANKED = {
    /* 순위표에 올릴 "대표 모드". 학습용 게임은 나이 4단계(6~7살·초1~2·초3~4·초5~6)가 생겨
       모드가 여러 개라, 그중 초3~4 설정 하나를 공식 기록으로 정했다. */
    'math-speed':          { re: /^덧셈·뺄셈·곱셈·나눗셈 · 초3~4 · 60초$/, label: '사칙연산 · 초3~4 · 60초' },
    'times-table-shooter': { re: /^초3~4 · 2·3·4·5·6·7·8·9단 · 보통$/,    label: '전체 단 · 초3~4 · 보통' },
    'word-cards':          { re: /^초3~4 · 전체 주제 · 영→뜻 · 20문제$/,  label: '전체 주제 · 초3~4 · 영→뜻 20문제' },
    'quiz-science':        { re: /^초3~4 · 전체 주제 · 20문제$/,          label: '전체 주제 · 초3~4 · 20문제' },
    'kkeutmalitgi':        { re: /^컴퓨터 · 보통$/,                       label: '컴퓨터 · 보통' },
    'hidden-object':       { re: /^보통.* · 5판 · 제한시간$/,             label: '보통 · 5판 · 제한시간' },
    'jump-map':            { re: /^혼자$/,                                label: '혼자 플레이' },
    'subway-io':           { re: /^혼자$/,                                label: '혼자 플레이' },
    'onitama':             { re: /^컴퓨터 · 보통$/,                       label: '컴퓨터 · 보통' },
    'cooking-catch':       { re: /^보통 · 60초$/,                         label: '보통 · 60초' }
  };

  /* records.js 를 옆 폴더에서 자동으로 불러온다 → 게임 파일은 손댈 필요 없음 */
  var myScript = (document.currentScript) || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var baseDir = (myScript && myScript.src) ? myScript.src.replace(/[^/]*$/, '') : '';
  function bindRecords() {
    if (!global.Records || !global.Records.useProfile) return;
    try { global.Records.useProfile(player().id, player().name); } catch (e) {}
  }
  function loadRecords() {
    if (global.Records) { bindRecords(); return; }
    if (!baseDir) return;
    try {
      if (document.querySelector('script[src*="records.js"]')) return; // 페이지가 이미 넣어둠
      var s = document.createElement('script');
      s.src = baseDir + 'records.js';
      s.async = true;
      s.onload = bindRecords;
      s.onerror = function () {};   // 없어도 게임은 그대로 돈다
      document.head.appendChild(s);
    } catch (e) {}
  }
  on('change', bindRecords);

  /* 로컬 gameId → 서버(api/_lib.js GAMES) 키가 다른 경우만 적어 둔다.
     끝말잇기는 폴더가 word-chain 으로 바뀌면서 서버 키도 'word-chain' 이 됐지만,
     로컬 기록·배지 키는 기존 'kkeutmalitgi' 를 그대로 쓴다(예전 기록 유지). */
  var SERVER_KEY = { 'kkeutmalitgi': 'word-chain' };

  /* 이 게임/모드가 온라인 순위표 대상인가 */
  function rankedInfo(gameId, mode) {
    var rk = RANKED[gameId];
    if (!rk) return { ranked: false, label: null };
    return { ranked: rk.re.test(String(mode)), label: rk.label };
  }

  /* ---------------- 기록 ---------------- */
  /* submit('math-speed', {score:120, mode:'보통 60초'}) */
  function submit(gameId, opts) {
    opts = opts || {};
    var score = Number(opts.score) || 0;
    var mode = opts.mode == null ? 'default' : String(opts.mode);
    var lower = !!opts.lowerIsBetter;
    var db = ensure(read());
    var d = bucket(db);
    var r = d.records[gameId] || (d.records[gameId] = { best: {}, recent: [], plays: 0 });
    r.plays = (r.plays || 0) + 1;
    var prev = (mode in r.best) ? r.best[mode] : null;
    var isNew = prev === null || (lower ? score < prev : score > prev);
    if (isNew) r.best[mode] = score;
    r.recent.unshift({ s: score, m: mode, t: Date.now(), u: opts.unit || '점' });
    if (r.recent.length > 20) r.recent.length = 20;
    r.lower = lower;
    r.unit = opts.unit || r.unit || '점';
    write(db);

    /* 공통 배지 자동 판정 */
    var totalPlays = 0, gamesPlayed = 0;
    Object.keys(d.records).forEach(function (g) {
      totalPlays += d.records[g].plays || 0;
      if ((d.records[g].plays || 0) > 0) gamesPlayed++;
    });
    var earned = [];
    if (award('first-play')) earned.push('first-play');
    if (totalPlays >= 10 && award('play-10')) earned.push('play-10');
    if (totalPlays >= 50 && award('play-50')) earned.push('play-50');
    if (gamesPlayed >= 5 && award('explorer-5')) earned.push('explorer-5');
    if (gamesPlayed >= Object.keys(GAMES).length && award('explorer-all')) earned.push('explorer-all');

    /* 온라인 순위표에도 올린다 (순위표 모드로 플레이한 판만) */
    var rk = rankedInfo(gameId, mode);
    var online = null;
    if (rk.ranked && global.Records && global.Records.submit) {
      try {
        bindRecords();
        online = global.Records.submit(SERVER_KEY[gameId] || gameId, Math.max(0, Math.round(score)), { mode: mode, unit: opts.unit || '점' });
      } catch (e) { online = null; }
    }

    return {
      best: r.best[mode], isNewBest: isNew, prevBest: prev, plays: r.plays, earned: earned,
      online: online, ranked: rk.ranked, rankedLabel: rk.label
    };
  }
  function best(gameId, mode) {
    var d = bucket(ensure(read()));
    var r = d.records[gameId];
    if (!r) return null;
    var m = mode == null ? 'default' : String(mode);
    return (m in r.best) ? r.best[m] : null;
  }
  function allBest(gameId) {
    var d = bucket(ensure(read()));
    var r = d.records[gameId];
    return r ? JSON.parse(JSON.stringify(r.best)) : {};
  }
  function recent(gameId, n) {
    var d = bucket(ensure(read()));
    var r = d.records[gameId];
    return r ? r.recent.slice(0, n || 5) : [];
  }
  function plays(gameId) {
    var d = bucket(ensure(read()));
    return (d.records[gameId] && d.records[gameId].plays) || 0;
  }
  /* 누적 카운터: stat('word-cards','correct', 3) → 3 더하고 합계 반환 */
  function stat(gameId, key, add) {
    var db = ensure(read());
    var d = bucket(db);
    var s = d.stats[gameId] || (d.stats[gameId] = {});
    if (add === undefined) return s[key] || 0;
    if (typeof add === 'object' && add && add.set !== undefined) s[key] = add.set;
    else s[key] = (s[key] || 0) + Number(add || 0);
    write(db);
    return s[key];
  }
  /* 집합형 카운터: 서로 다른 주제 몇 개를 해봤는지 등 */
  function statAdd(gameId, key, value) {
    var db = ensure(read());
    var d = bucket(db);
    var s = d.stats[gameId] || (d.stats[gameId] = {});
    var arr = s[key] || (s[key] = []);
    if (arr.indexOf(value) < 0) arr.push(value);
    write(db);
    return arr.length;
  }

  /* ---------------- 배지 ---------------- */
  function badges() { return JSON.parse(JSON.stringify(bucket(ensure(read())).badges)); }
  function hasBadge(id) { return !!bucket(ensure(read())).badges[id]; }
  function award(id) {
    if (!BADGES[id]) return false;
    var db = ensure(read());
    var d = bucket(db);
    if (d.badges[id]) return false;
    d.badges[id] = Date.now();
    write(db);
    var b = BADGES[id];
    toast('새 배지 ' + b.title + ' — ' + b.desc, b.emoji);
    return true;
  }
  /* 여러 개 한 번에: awardAll({'ms-hit20': hit>=20, 'ms-perfect': miss===0}) → 새로 얻은 id 배열 */
  function awardAll(map) {
    var got = [];
    Object.keys(map).forEach(function (id) { if (map[id] && award(id)) got.push(id); });
    return got;
  }

  /* ---------------- UI: 스타일 주입 ---------------- */
  var CSS = [
    '.jg-chip{display:inline-flex;align-items:center;gap:7px;background:#fff;border:2px solid #e0e3e7;',
      'border-radius:999px;padding:5px 12px 5px 6px;font:700 13px/1 inherit;color:#202124;cursor:pointer;',
      'font-family:inherit;max-width:100%;}',
    '.jg-chip:active{transform:scale(.97);}',
    '.jg-chip .jg-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
      'font-size:15px;background:#eef1f6;flex:0 0 auto;}',
    '.jg-chip .jg-nm{max-width:9em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.jg-chip .jg-sw{font-size:11px;color:#8a9099;}',
    '.jg-mask{position:fixed;inset:0;background:rgba(20,22,28,.55);z-index:99998;display:flex;',
      'align-items:center;justify-content:center;padding:16px;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));}',
    '.jg-modal{background:#fff;color:#202124;border-radius:18px;width:100%;max-width:400px;max-height:88vh;max-height:88dvh;',
      'overflow:auto;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.35);',
      'font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",-apple-system,sans-serif;',
      '-webkit-overflow-scrolling:touch;}',
    '.jg-modal h3{margin:0 0 4px;font-size:19px;}',
    '.jg-modal .jg-hint{margin:0 0 14px;font-size:12.5px;color:#5f6368;line-height:1.5;}',
    '.jg-plist{display:flex;flex-direction:column;gap:8px;margin-bottom:14px;}',
    '.jg-prow{display:flex;align-items:center;gap:10px;border:2px solid #e0e3e7;border-radius:13px;padding:9px 11px;cursor:pointer;background:#fff;}',
    '.jg-prow.on{border-color:#4285F4;background:#e8f0fe;}',
    '.jg-prow .jg-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:19px;background:#eef1f6;flex:0 0 auto;}',
    '.jg-prow .jg-nm{flex:1;font-weight:800;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.jg-prow .jg-sub{font-size:11.5px;color:#5f6368;font-weight:600;}',
    '.jg-x{border:none;background:#f1f3f6;color:#5f6368;border-radius:9px;padding:6px 9px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;white-space:nowrap;flex:0 0 auto;}',
    '.jg-x.edit{background:#e8f0fe;color:#1a5fd0;}',
    '.jg-x.del{background:#fdeceb;color:#c5372c;}',
    '.jg-form{border-top:1px solid #e0e3e7;padding-top:13px;}',
    '.jg-form.edit{border:2px solid #4285F4;border-radius:14px;padding:13px;background:#f6f9ff;}',
    '.jg-cols{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin-bottom:12px;}',
    '.jg-colb{aspect-ratio:1;border:2px solid #e0e3e7;border-radius:10px;cursor:pointer;padding:0;}',
    '.jg-colb.on{border-color:#202124;box-shadow:0 0 0 2px #fff inset;}',
    '.jg-prev{display:flex;align-items:center;gap:9px;background:#fff;border:2px dashed #cbd3dd;border-radius:12px;padding:9px 11px;margin-bottom:11px;}',
    '.jg-prev .jg-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto;}',
    '.jg-prev .jg-pn{font-weight:800;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.jg-lab{font-size:12px;font-weight:800;color:#5f6368;margin-bottom:6px;}',
    '.jg-in{width:100%;padding:11px;border:2px solid #e0e3e7;border-radius:11px;font-size:16px;font-family:inherit;font-weight:700;margin-bottom:10px;background:#fff;color:#202124;}',
    '.jg-avs{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin-bottom:12px;}',
    '.jg-avb{aspect-ratio:1;border:2px solid #e0e3e7;border-radius:10px;background:#fff;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}',
    '.jg-avb.on{border-color:#4285F4;background:#e8f0fe;}',
    '.jg-btn{width:100%;padding:13px;border:none;border-radius:12px;background:#4285F4;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;}',
    '.jg-btn.g{background:#fff;color:#5f6368;border:2px solid #e0e3e7;margin-top:8px;}',
    '.jg-toasts{position:fixed;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;',
      'align-items:center;pointer-events:none;width:calc(100% - 24px);max-width:360px;',
      'top:calc(10px + env(safe-area-inset-top));}',
    '.jg-toast{background:rgba(28,30,36,.95);color:#fff;border-radius:13px;padding:11px 15px;font:700 13.5px/1.45 inherit;',
      'box-shadow:0 8px 24px rgba(0,0,0,.3);display:flex;gap:9px;align-items:center;',
      'animation:jgIn .25s ease-out;font-family:inherit;width:100%;box-sizing:border-box;}',
    '.jg-toast .e{font-size:22px;flex:0 0 auto;}',
    '@keyframes jgIn{from{opacity:0;transform:translateY(-12px);}to{opacity:1;transform:none;}}',
    '.jg-fade{opacity:0;transition:opacity .35s;}',
    '.jg-res{border:2px solid #e0e3e7;border-radius:14px;padding:13px;background:#fff;color:#202124;font-family:inherit;}',
    '.jg-res .jg-rt{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:#5f6368;margin-bottom:9px;}',
    '.jg-res .jg-line{display:flex;justify-content:space-between;font-size:14px;padding:5px 0;color:#202124;}',
    '.jg-res .jg-line b{font-weight:800;}',
    '.jg-res .jg-nb{background:#fef7e0;color:#b06000;border-radius:9px;padding:7px 10px;font-size:13px;font-weight:800;text-align:center;margin-bottom:8px;}',
    '.jg-res .jg-bg{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;}',
    '.jg-res .jg-bd{background:#e6f4ea;color:#137333;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:800;}',
    '.jg-on{margin-top:9px;font-size:12px;font-weight:700;color:#5f6368;line-height:1.5;word-break:keep-all;}',
    '.jg-on.good{color:#1967d2;background:#e8f0fe;border-radius:9px;padding:7px 10px;font-weight:800;font-size:12.5px;}',
    '.jg-on.wait{opacity:.65;}'
  ].join('');

  var styled = false;
  function injectCSS() {
    if (styled) return;
    styled = true;
    try {
      var s = document.createElement('style');
      s.textContent = CSS;
      document.head.appendChild(s);
    } catch (e) {}
  }

  /* ---------------- UI: 토스트 ---------------- */
  var toastBox = null;
  function toast(msg, emoji) {
    try {
      injectCSS();
      if (!toastBox || !toastBox.isConnected) {
        toastBox = document.createElement('div');
        toastBox.className = 'jg-toasts';
        document.body.appendChild(toastBox);
      }
      var t = document.createElement('div');
      t.className = 'jg-toast';
      t.innerHTML = '<span class="e"></span><span class="m"></span>';
      t.querySelector('.e').textContent = emoji || '🏅';
      t.querySelector('.m').textContent = msg;
      toastBox.appendChild(t);
      setTimeout(function () {
        t.classList.add('jg-fade');
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
      }, 3200);
    } catch (e) {}
  }

  /* ---------------- UI: 프로필 칩 ---------------- */
  function chipHTML(p) {
    return '<span class="jg-av" style="background:' + shade(p.color) + '">' + p.emoji + '</span>' +
           '<span class="jg-nm">' + esc(p.name) + '</span><span class="jg-sw">▾</span>';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shade(hex) {
    if (!hex) return '#eef1f6';
    try {
      var n = parseInt(hex.slice(1), 16);
      var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      return 'rgba(' + r + ',' + g + ',' + b + ',.16)';
    } catch (e) { return '#eef1f6'; }
  }
  /* 지정한 요소 안에 프로필 칩을 그린다. el이 없으면 아무것도 안 함. */
  function mountChip(el, opts) {
    injectCSS();
    if (typeof el === 'string') el = document.getElementById(el) || document.querySelector(el);
    if (!el) return null;
    opts = opts || {};
    function render() {
      var p = player();
      el.innerHTML = '';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'jg-chip';
      b.innerHTML = chipHTML(p);
      b.onclick = function (e) { e.preventDefault(); openPicker(); };
      el.appendChild(b);
    }
    on('change', render);
    render();
    return render;
  }

  /* ---------------- UI: 플레이어 선택 창 ---------------- */
  var picking = false;
  function openPicker() {
    if (picking) return;
    picking = true;
    injectCSS();
    var db = ensure(read());
    var mask = document.createElement('div');
    mask.className = 'jg-mask';
    var editing = null;               // 편집 중인 프로필 id (null이면 새로 만들기)
    var pickEmoji = AVATARS[db.profiles.length % AVATARS.length];
    var pickColor = COLORS[db.profiles.length % COLORS.length];
    var typedName = '';               // 입력칸에 지금 쳐 넣은 이름 (다시 그려도 안 날아가게 보관)

    function close() { picking = false; if (mask.parentNode) mask.parentNode.removeChild(mask); }

    /* 아바타·색을 고를 때는 화면을 통째로 다시 그리지 않는다.
       (다시 그리면 입력칸에 쓰던 이름이 날아가서 "이름이 안 바뀐다"는 문제가 났었다) */
    function paintPick() {
      mask.querySelectorAll('.jg-avb').forEach(function (b) {
        b.classList.toggle('on', b.dataset.av === pickEmoji);
      });
      mask.querySelectorAll('.jg-colb').forEach(function (b) {
        b.classList.toggle('on', b.dataset.col === pickColor);
      });
      var pa = mask.querySelector('.jg-prev .jg-av');
      if (pa) { pa.textContent = pickEmoji; pa.style.background = shade(pickColor); }
      var pn = mask.querySelector('.jg-prev .jg-pn');
      if (pn) pn.textContent = typedName || '이름을 적어 주세요';
    }

    function draw() {
      var cur = player();
      var ps = players();
      var rows = ps.map(function (p) {
        var d = ensure(read()).data[p.id] || {};
        var nb = d.badges ? Object.keys(d.badges).length : 0;
        var np = 0;
        if (d.records) Object.keys(d.records).forEach(function (g) { np += d.records[g].plays || 0; });
        return '<div class="jg-prow' + (p.id === cur.id ? ' on' : '') + '" data-id="' + p.id + '">' +
          '<span class="jg-av" style="background:' + shade(p.color) + '">' + p.emoji + '</span>' +
          '<span class="jg-nm">' + esc(p.name) + '<div class="jg-sub">' + np + '판 · 배지 ' + nb + '개</div></span>' +
          '<button class="jg-x edit" data-edit="' + p.id + '">✏️ 고치기</button>' +
          (ps.length > 1 ? '<button class="jg-x del" data-del="' + p.id + '">삭제</button>' : '') +
          '</div>';
      }).join('');

      var target = editing ? ps.filter(function (p) { return p.id === editing; })[0] : null;

      mask.innerHTML = '<div class="jg-modal">' +
        '<h3>👤 플레이어</h3>' +
        '<p class="jg-hint">이름을 눌러 <b>플레이어를 바꾸고</b>, <b>✏️ 고치기</b>를 누르면 이름·캐릭터·색을 바꿀 수 있어요. ' +
          '기록과 배지는 플레이어별로 따로 쌓이고, 이름을 바꿔도 그대로 남아요.</p>' +
        '<div class="jg-plist">' + rows + '</div>' +
        '<div class="jg-form' + (target ? ' edit' : '') + '" id="jgForm">' +
          '<div class="jg-lab">' + (target ? '✏️ ' + esc(target.name) + ' 님 고치기' : '➕ 새 플레이어 만들기') + '</div>' +
          '<div class="jg-prev"><span class="jg-av"></span><span class="jg-pn"></span></div>' +
          '<div class="jg-lab">이름</div>' +
          '<input class="jg-in" id="jgName" maxlength="10" placeholder="이름 (10자까지)" value="' + esc(typedName) + '">' +
          '<div class="jg-lab">캐릭터 고르기</div>' +
          '<div class="jg-avs">' + AVATARS.map(function (a) {
            return '<button class="jg-avb" data-av="' + a + '">' + a + '</button>';
          }).join('') + '</div>' +
          '<div class="jg-lab">색 고르기</div>' +
          '<div class="jg-cols">' + COLORS.map(function (c) {
            return '<button class="jg-colb" data-col="' + c + '" style="background:' + c + '"></button>';
          }).join('') + '</div>' +
          '<button class="jg-btn" id="jgSave">' + (target ? '💾 저장하기' : '새 플레이어 추가') + '</button>' +
          (target ? '<button class="jg-btn g" id="jgCancel">취소</button>' : '') +
          '<button class="jg-btn g" id="jgClose">닫기</button>' +
        '</div></div>';

      mask.querySelectorAll('.jg-prow').forEach(function (row) {
        row.addEventListener('click', function (e) {
          var t = e.target;
          if (t.dataset && t.dataset.edit) {
            var p = players().filter(function (x) { return x.id === t.dataset.edit; })[0];
            if (!p) return;
            editing = p.id; typedName = p.name; pickEmoji = p.emoji; pickColor = p.color || COLORS[0];
            draw();
            var inp = mask.querySelector('#jgName');
            if (inp) { try { inp.focus(); inp.select(); } catch (err) {} }
            var f = mask.querySelector('#jgForm');
            if (f && f.scrollIntoView) { try { f.scrollIntoView({ block: 'nearest' }); } catch (err) {} }
            return;
          }
          if (t.dataset && t.dataset.del) {
            if (removePlayer(t.dataset.del)) { resetForm(); draw(); }
            return;
          }
          setActive(row.dataset.id);
          close();
        });
      });
      mask.querySelectorAll('.jg-avb').forEach(function (b) {
        b.addEventListener('click', function () { pickEmoji = b.dataset.av; paintPick(); });
      });
      mask.querySelectorAll('.jg-colb').forEach(function (b) {
        b.addEventListener('click', function () { pickColor = b.dataset.col; paintPick(); });
      });
      var nameIn = mask.querySelector('#jgName');
      nameIn.addEventListener('input', function () { typedName = nameIn.value; paintPick(); });

      var save = mask.querySelector('#jgSave');
      save.addEventListener('click', function () {
        var nm = (nameIn.value || '').trim();
        if (target) {
          updatePlayer(target.id, { name: nm || target.name, emoji: pickEmoji, color: pickColor });
          toast((nm || target.name) + ' 님으로 바꿨어요', pickEmoji);
          resetForm(); draw();
        } else {
          if (!nm) { nameIn.focus(); return; }
          addPlayer(nm, pickEmoji, pickColor);
          close();
        }
      });
      var cancel = mask.querySelector('#jgCancel');
      if (cancel) cancel.addEventListener('click', function () { resetForm(); draw(); });
      mask.querySelector('#jgClose').addEventListener('click', close);
      paintPick();
    }

    /* 편집을 끝내고 '새 플레이어 만들기' 상태로 되돌린다 */
    function resetForm() {
      var n = players().length;
      editing = null; typedName = '';
      pickEmoji = AVATARS[n % AVATARS.length];
      pickColor = COLORS[n % COLORS.length];
    }

    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    draw();
    document.body.appendChild(mask);
  }

  /* ---------------- UI: 결과화면 요약 박스 ---------------- */
  /* JG.resultBox(el, {gameId:'math-speed', res: submit결과, unit:'점', extra:[['맞힌 문제','12개']]}) */
  function resultBox(el, info) {
    injectCSS();
    if (typeof el === 'string') el = document.getElementById(el) || document.querySelector(el);
    if (!el) return;
    info = info || {};
    var res = info.res || {};
    var unit = info.unit || '점';
    var p = player();
    var g = GAMES[info.gameId] || { emoji: '🎮', title: '게임' };
    var html = '<div class="jg-res">';
    html += '<div class="jg-rt"><span class="jg-av" style="width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:' + shade(p.color) + '">' + p.emoji + '</span>' + esc(p.name) + '님의 기록</div>';
    if (res.isNewBest) html += '<div class="jg-nb">🎉 최고 기록 경신!' + (res.prevBest != null ? ' (이전 ' + res.prevBest + unit + ')' : '') + '</div>';
    if (info.score != null) html += '<div class="jg-line"><span>이번 기록</span><b>' + info.score + unit + '</b></div>';
    if (res.best != null) html += '<div class="jg-line"><span>내 최고 기록</span><b>' + res.best + unit + '</b></div>';
    if (res.plays != null) html += '<div class="jg-line"><span>지금까지 플레이</span><b>' + res.plays + '판</b></div>';
    (info.extra || []).forEach(function (row) {
      html += '<div class="jg-line"><span>' + esc(row[0]) + '</span><b>' + esc(row[1]) + '</b></div>';
    });
    var got = (info.badges || []).concat(res.earned || []).filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (got.length) {
      html += '<div class="jg-bg">' + got.map(function (id) {
        var b = BADGES[id]; return b ? '<span class="jg-bd">' + b.emoji + ' ' + b.title + '</span>' : '';
      }).join('') + '</div>';
    }
    html += '<div class="jg-on" id="jgOn"></div>';
    html += '</div>';
    el.innerHTML = html;

    /* 온라인 순위표 한 줄 (있을 때만) */
    var line = el.querySelector('#jgOn');
    if (!line) return;
    if (res.ranked && res.online) {
      line.className = 'jg-on wait';
      line.textContent = '🌐 온라인 순위표에 올리는 중…';
      res.online.then(function (r) {
        if (r && r.ok && r.rank) {
          line.className = 'jg-on good';
          line.textContent = '🌐 온라인 순위 ' + r.rank + '위 / ' + r.total + '명 중' + (r.isBest ? ' · 내 최고 기록!' : '');
        } else {
          line.className = 'jg-on';
          line.textContent = '🌐 지금은 순위표에 못 올렸어요. 인터넷이 연결되면 자동으로 올라가요.';
        }
      }, function () {
        line.className = 'jg-on';
        line.textContent = '🌐 지금은 순위표에 못 올렸어요. 인터넷이 연결되면 자동으로 올라가요.';
      });
    } else if (res.rankedLabel) {
      line.className = 'jg-on';
      line.textContent = '🌐 온라인 순위표는 「' + res.rankedLabel + '」 모드에서 올라가요';
    } else {
      line.style.display = 'none';
    }
  }

  /* ---------------- 문제 랜덤화 도우미 ---------------- */
  /* 최근에 낸 문제를 피해서 뽑는 큐. 학습 게임에서 씁니다.
     var bag = JG.shuffleBag(items, 0.4);  bag.next()  → 매번 다른 순서로 한 바퀴씩 */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function shuffleBag(items) {
    var pool = [];
    var lastOfPrev = null;
    function refill() {
      pool = shuffle(items);
      // 직전 바퀴의 마지막 문제가 새 바퀴 첫 문제로 연달아 나오지 않게
      if (lastOfPrev != null && pool.length > 1 && pool[0] === lastOfPrev) {
        var t = pool[0]; pool[0] = pool[1]; pool[1] = t;
      }
    }
    refill();
    return {
      next: function () {
        if (!pool.length) refill();
        var v = pool.shift();
        if (!pool.length) lastOfPrev = v;
        return v;
      },
      left: function () { return pool.length; },
      reset: refill
    };
  }
  /* 최근 N개를 기억했다가 겹치지 않게 뽑아주는 필터 */
  function recentFilter(size) {
    var q = [];
    return {
      ok: function (key) { return q.indexOf(key) < 0; },
      push: function (key) { q.push(key); if (q.length > size) q.shift(); },
      /* pick(makeFn, keyFn, tries) — 겹치지 않는 걸 뽑을 때까지 최대 tries번 시도 */
      pick: function (makeFn, keyFn, tries) {
        var v, k, n = tries || 12;
        for (var i = 0; i < n; i++) {
          v = makeFn();
          k = keyFn ? keyFn(v) : v;
          if (q.indexOf(k) < 0) break;
        }
        q.push(k);
        if (q.length > size) q.shift();
        return v;
      }
    };
  }

  /* ---------------- 모바일 화면 높이 보정 ---------------- */
  /* iOS 사파리 주소창 때문에 100vh가 화면보다 큰 문제 → --jg-vh 를 쓰면 정확함 */
  function setupVH() {
    function apply() {
      try {
        var h = (global.visualViewport && global.visualViewport.height) || global.innerHeight;
        document.documentElement.style.setProperty('--jg-vh', h + 'px');
      } catch (e) {}
    }
    apply();
    try {
      global.addEventListener('resize', apply);
      global.addEventListener('orientationchange', function () { setTimeout(apply, 250); });
      if (global.visualViewport) global.visualViewport.addEventListener('resize', apply);
    } catch (e) {}
  }

  /* ---------------- 시작 ---------------- */
  function boot() {
    injectCSS();
    setupVH();
    loadRecords();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.JG = {
    GAMES: GAMES, BADGES: BADGES, AVATARS: AVATARS,
    player: player, players: players, addPlayer: addPlayer,
    updatePlayer: updatePlayer, removePlayer: removePlayer, setActive: setActive,
    on: on,
    submit: submit, best: best, allBest: allBest, recent: recent, plays: plays,
    stat: stat, statAdd: statAdd,
    badges: badges, hasBadge: hasBadge, award: award, awardAll: awardAll,
    toast: toast, mountChip: mountChip, openPicker: openPicker, resultBox: resultBox,
    shuffle: shuffle, shuffleBag: shuffleBag, recentFilter: recentFilter,
    RANKED: RANKED, rankedInfo: rankedInfo, SERVER_KEY: SERVER_KEY,
    _read: read, _write: write, _reset: function () { mem = null; try { global.localStorage.removeItem(KEY); } catch (e) {} }
  };
})(window);
