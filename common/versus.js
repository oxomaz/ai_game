/* ═══════════════════════════════════════════════════════════════
   versus.js — jerry-games 공용 온라인 대결 라이브러리
   방 만들기 → 방 코드 공유 → 친구가 코드 입력 → 실시간 대결

   서버 없이 P2P(WebRTC)로 연결한다. 연결 중개만 PeerJS 공개 서버를 쓴다.
   게임 쪽에서 쓰는 함수는 아래 4개면 충분하다.

     Versus.open({...})     대결 로비 열기
     Versus.setScore(n)     내 점수 알리기 (상단 VS바가 갱신됨)
     Versus.finish(n)       내 게임 끝 — 둘 다 끝나면 승패 화면
     Versus.send(obj)       게임별 임의 메시지 보내기 → 상대의 onData로 도착

   Versus.seeded(fn)  안에서 만든 것은 양쪽이 100% 똑같이 생성된다.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var PEERJS_LOCAL = 'peerjs.min.js';                                   // 같은 common/ 폴더
  var PEERJS_CDN = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';  // 예비용
  var CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 I,O,0,1 제외
  var PREFIX = 'jerrygames';

  var V = {
    on: false,        // 대결 모드로 플레이 중인가
    isHost: false,
    code: '',
    myName: '나',
    oppName: '친구',
    myScore: 0,
    oppScore: 0,
    seed: 0,
    settings: null,
    _peer: null,
    _conn: null,
    _opts: null,
    _myDone: false,
    _oppDone: false,
    _oppFinal: 0,
    _rng: null
  };

  /* ── 시드 난수 (양쪽이 똑같은 결과를 만들기 위해) ── */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* fn 안에서 쓰는 Math.random 을 시드 난수로 바꿔치기 →
     호스트와 참가자가 완전히 똑같은 문제/맵을 만든다. */
  V.seeded = function (fn) {
    if (!V.on || !V._rng) return fn();
    var real = Math.random;
    Math.random = V._rng;
    try { return fn(); } finally { Math.random = real; }
  };
  /* 라운드마다 시드를 다시 맞춘다 (양쪽 호출 순서만 같으면 됨) */
  V.reseed = function (extra) {
    V._rng = mulberry32((V.seed ^ ((extra || 0) * 2654435761)) >>> 0);
  };

  /* ── 스타일 ── */
  function injectCSS() {
    if (document.getElementById('vsCSS')) return;
    var s = document.createElement('style');
    s.id = 'vsCSS';
    s.textContent = [
      '#vsLobby{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;',
      'background:rgba(52,46,66,.62);backdrop-filter:blur(6px);padding:18px;',
      'font-family:inherit;-webkit-tap-highlight-color:transparent}',
      '#vsLobby.on{display:flex}',
      '.vs-card{background:#fff;border-radius:26px;padding:24px 22px;width:min(420px,100%);',
      'box-shadow:0 18px 50px rgba(40,32,60,.3);color:#4a4258;text-align:center;max-height:92vh;overflow:auto}',
      '.vs-card h3{margin:0 0 4px;font-size:22px;font-weight:900}',
      '.vs-card p.sub{margin:0 0 16px;font-size:13px;font-weight:700;color:#8a83a0;line-height:1.6}',
      '.vs-in{width:100%;box-sizing:border-box;border:2px solid #e7e2f2;border-radius:16px;padding:13px 14px;',
      'font-size:16px;font-weight:800;font-family:inherit;color:#4a4258;outline:none;text-align:center;background:#faf8ff}',
      '.vs-in:focus{border-color:#a99cff}',
      '.vs-in.code{letter-spacing:.22em;text-transform:uppercase;font-size:24px;font-weight:900}',
      '.vs-btns{display:flex;gap:10px;margin-top:14px}',
      '.vs-btn{flex:1;border:0;cursor:pointer;border-radius:18px;padding:14px;font-weight:900;font-size:15px;',
      'font-family:inherit;box-shadow:0 4px 0 rgba(74,66,88,.16);transition:.12s}',
      '.vs-btn:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(74,66,88,.16)}',
      '.vs-btn.pri{background:linear-gradient(150deg,#7f8bff,#b58cff);color:#fff}',
      '.vs-btn.go{background:linear-gradient(150deg,#3ecf8e,#5fd3c4);color:#fff}',
      '.vs-btn.sec{background:#efeaf6;color:#4a4258}',
      '.vs-btn[disabled]{opacity:.45;cursor:default}',
      '.vs-code{font-size:42px;font-weight:900;letter-spacing:.18em;color:#6b5ce7;margin:6px 0 2px;',
      'font-variant-numeric:tabular-nums}',
      '.vs-note{font-size:12.5px;font-weight:700;color:#8a83a0;line-height:1.7;background:#f7f4ff;',
      'border-radius:14px;padding:11px 13px;margin-top:12px;text-align:left}',
      '.vs-wait{font-size:14px;font-weight:800;color:#7a6fd0;margin-top:12px}',
      '.vs-wait::after{content:"";display:inline-block;width:1em;text-align:left;animation:vsDot 1.2s steps(4) infinite}',
      '@keyframes vsDot{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}',
      '.vs-err{color:#e0446a;font-size:13px;font-weight:800;margin-top:10px;min-height:18px}',
      /* 상단 VS 바 */
      '#vsBar{position:fixed;top:0;left:0;right:0;z-index:8000;display:none;',
      'gap:8px;align-items:center;padding:6px 10px;font-family:inherit;',
      'background:linear-gradient(90deg,rgba(127,139,255,.96),rgba(181,140,255,.96));color:#fff;',
      'box-shadow:0 3px 12px rgba(60,50,90,.22)}',
      '#vsBar.on{display:flex}',
      '.vs-side{flex:1;display:flex;align-items:center;gap:7px;font-weight:900;font-size:14px;min-width:0}',
      '.vs-side.r{justify-content:flex-end}',
      '.vs-side .nm{opacity:.9;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:9em}',
      '.vs-side .sc{background:rgba(255,255,255,.24);border-radius:11px;padding:2px 10px;font-size:16px;',
      'font-variant-numeric:tabular-nums;min-width:2.2em}',
      '.vs-side .sc.up{animation:vsPop .4s ease-out}',
      '@keyframes vsPop{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}',
      '.vs-mid{font-weight:900;font-size:13px;opacity:.95;letter-spacing:.06em}',
      '.vs-done{font-size:11px;background:rgba(255,255,255,.3);border-radius:8px;padding:1px 6px}',
      'body.vs-playing{padding-top:34px}',
      /* 결과 */
      '#vsResult{position:fixed;inset:0;z-index:9100;display:none;align-items:center;justify-content:center;',
      'background:rgba(52,46,66,.66);backdrop-filter:blur(6px);padding:18px;font-family:inherit}',
      '#vsResult.on{display:flex}',
      '.vs-rt{font-size:30px;font-weight:900;margin:0 0 10px}',
      '.vs-sc{display:flex;gap:10px;margin:14px 0 4px}',
      '.vs-sc div{flex:1;background:#f4f1fb;border-radius:16px;padding:12px 8px}',
      '.vs-sc b{display:block;font-size:26px;font-weight:900}',
      '.vs-sc small{font-size:12px;font-weight:800;color:#8a83a0}',
      '@media(max-width:420px){.vs-side .nm{max-width:5em}.vs-code{font-size:34px}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── DOM ── */
  function el(id) { return document.getElementById(id); }

  function buildDOM() {
    if (el('vsLobby')) return;
    var d = document.createElement('div');
    d.id = 'vsLobby';
    d.innerHTML =
      '<div class="vs-card" id="vsPane"></div>';
    document.body.appendChild(d);

    var bar = document.createElement('div');
    bar.id = 'vsBar';
    bar.innerHTML =
      '<div class="vs-side"><span class="nm" id="vsMeName">나</span><span class="sc" id="vsMeSc">0</span></div>' +
      '<div class="vs-mid">VS</div>' +
      '<div class="vs-side r"><span class="sc" id="vsOpSc">0</span><span class="nm" id="vsOpName">친구</span></div>';
    document.body.appendChild(bar);

    var r = document.createElement('div');
    r.id = 'vsResult';
    r.innerHTML = '<div class="vs-card" id="vsResPane"></div>';
    document.body.appendChild(r);
  }

  function pane(html) { el('vsPane').innerHTML = html; el('vsLobby').classList.add('on'); }
  function closeLobby() { el('vsLobby').classList.remove('on'); }
  function err(msg) { var e = el('vsErr'); if (e) e.textContent = msg || ''; }

  function randCode() {
    var s = '';
    for (var i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return s;
  }
  function roomId(code) { return PREFIX + '-' + (V._opts.game || 'g') + '-' + code; }

  /* ── PeerJS 로드 ── */
  /* 기본은 PeerJS 공개 중개서버. window.VERSUS_SERVER 를 정의하면 그쪽을 쓴다(테스트용). */
  function peerOpts() {
    var o = { debug: 0 };
    if (global.VERSUS_SERVER) for (var k in global.VERSUS_SERVER) o[k] = global.VERSUS_SERVER[k];
    return o;
  }

  function myDir() {
    var s = document.currentScript;
    if (!s) {
      var all = document.getElementsByTagName('script');
      for (var i = all.length - 1; i >= 0; i--) {
        if (/versus\.js/.test(all[i].src)) { s = all[i]; break; }
      }
    }
    return s ? s.src.replace(/[^/]*$/, '') : '';
  }
  var BASE = myDir();

  function loadPeer(cb) {
    if (global.Peer) return cb();
    grab(BASE + PEERJS_LOCAL, function (ok) {
      if (ok) return cb();
      grab(PEERJS_CDN, function (ok2) {
        cb(ok2 ? null : new Error('연결 프로그램을 불러오지 못했어요. 인터넷을 확인해 주세요.'));
      });
    });
  }
  function grab(src, done) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { done(!!global.Peer); };
    s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }

  /* ══════════ 화면들 ══════════ */

  function screenHome() {
    var saved = '';
    try { saved = localStorage.getItem('vsName') || ''; } catch (e) { }
    pane(
      '<h3>🎮 친구랑 대결</h3>' +
      '<p class="sub">한 명이 <b>방을 만들고</b>, 방 코드를 친구에게 알려주세요.<br>친구가 코드를 넣으면 바로 대결이 시작돼요!</p>' +
      '<input class="vs-in" id="vsName" maxlength="8" placeholder="내 이름 (예: 재희)" value="' + esc(saved) + '">' +
      '<div class="vs-btns"><button class="vs-btn pri" id="vsMake">방 만들기</button>' +
      '<button class="vs-btn go" id="vsJoin">방 참여하기</button></div>' +
      '<div class="vs-err" id="vsErr"></div>' +
      '<div class="vs-btns"><button class="vs-btn sec" id="vsCancel">← 돌아가기</button></div>'
    );
    el('vsMake').onclick = function () { saveName(); doHost(); };
    el('vsJoin').onclick = function () { saveName(); screenJoin(); };
    el('vsCancel').onclick = function () { cleanup(); closeLobby(); if (V._opts.onCancel) V._opts.onCancel(); };
  }

  function saveName() {
    var v = (el('vsName') && el('vsName').value || '').trim().slice(0, 8);
    V.myName = v || '나';
    try { localStorage.setItem('vsName', V.myName); } catch (e) { }
  }

  function screenJoin() {
    pane(
      '<h3>방 참여하기</h3>' +
      '<p class="sub">친구가 알려준 <b>4글자 방 코드</b>를 넣어주세요.</p>' +
      '<input class="vs-in code" id="vsCodeIn" maxlength="4" placeholder="ABCD" autocomplete="off">' +
      '<div class="vs-btns"><button class="vs-btn go" id="vsGo">입장!</button></div>' +
      '<div class="vs-err" id="vsErr"></div>' +
      '<div class="vs-btns"><button class="vs-btn sec" id="vsBack">← 뒤로</button></div>'
    );
    var input = el('vsCodeIn');
    input.focus();
    input.oninput = function () { this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
    input.onkeydown = function (e) { if (e.key === 'Enter') el('vsGo').click(); };
    el('vsGo').onclick = function () {
      var c = input.value.trim().toUpperCase();
      if (c.length !== 4) return err('4글자를 정확히 넣어주세요.');
      doGuest(c);
    };
    el('vsBack').onclick = screenHome;
  }

  function screenHosting(code) {
    pane(
      '<h3>방을 만들었어요!</h3>' +
      '<p class="sub">아래 <b>방 코드</b>를 친구에게 알려주세요.</p>' +
      '<div class="vs-code">' + code + '</div>' +
      '<div class="vs-btns"><button class="vs-btn sec" id="vsCopy">📋 코드 복사</button></div>' +
      '<div class="vs-wait">친구를 기다리는 중</div>' +
      '<div class="vs-note">친구는 같은 게임을 열고 <b>친구랑 대결 → 방 참여하기</b>에서 이 코드를 넣으면 돼요.</div>' +
      '<div class="vs-err" id="vsErr"></div>' +
      '<div class="vs-btns"><button class="vs-btn sec" id="vsBack">← 취소</button></div>'
    );
    el('vsCopy').onclick = function () {
      var t = this;
      try {
        navigator.clipboard.writeText(code);
        t.textContent = '✅ 복사됨!';
        setTimeout(function () { t.textContent = '📋 코드 복사'; }, 1400);
      } catch (e) { err('복사가 안 되면 직접 불러주세요: ' + code); }
    };
    el('vsBack').onclick = function () { cleanup(); screenHome(); };
  }

  function screenConnecting(msg) {
    pane(
      '<h3>연결하는 중…</h3>' +
      '<p class="sub">' + esc(msg || '잠깐만 기다려 주세요') + '</p>' +
      '<div class="vs-wait">연결 중</div>' +
      '<div class="vs-err" id="vsErr"></div>' +
      '<div class="vs-btns"><button class="vs-btn sec" id="vsBack">← 취소</button></div>'
    );
    el('vsBack').onclick = function () { cleanup(); screenHome(); };
  }

  /* 양쪽 다 연결됨 — 호스트만 시작 버튼 */
  function screenReady() {
    var extra = V._opts.settingsHTML ? V._opts.settingsHTML() : '';
    pane(
      '<h3>✅ ' + esc(V.oppName) + ' 님 입장!</h3>' +
      '<p class="sub">' + esc(V.myName) + '  <b>VS</b>  ' + esc(V.oppName) + '</p>' +
      extra +
      (V.isHost
        ? '<div class="vs-btns"><button class="vs-btn go" id="vsStart">대결 시작!</button></div>' +
        '<div class="vs-note">방장인 ' + esc(V.myName) + ' 님이 시작 버튼을 누르면 둘 다 <b>똑같은 문제</b>로 동시에 시작해요.</div>'
        : '<div class="vs-wait">방장이 시작하기를 기다리는 중</div>') +
      '<div class="vs-err" id="vsErr"></div>' +
      '<div class="vs-btns"><button class="vs-btn sec" id="vsBack">← 나가기</button></div>'
    );
    if (V.isHost) {
      el('vsStart').onclick = function () {
        this.disabled = true;
        var seed = (Math.random() * 4294967296) >>> 0;
        var settings = V._opts.getSettings ? V._opts.getSettings() : null;
        send({ t: 'start', seed: seed, settings: settings });
        beginMatch(seed, settings);
      };
    }
    el('vsBack').onclick = function () { leave(); };
  }

  /* ══════════ 연결 ══════════ */

  function doHost() {
    screenConnecting('방을 만드는 중');
    loadPeer(function (e) {
      if (e) return err(e.message);
      tryHost(0);
    });
  }

  function tryHost(attempt) {
    if (attempt > 4) return err('방을 만들지 못했어요. 잠시 뒤 다시 해보세요.');
    var code = randCode();
    var peer = new global.Peer(roomId(code), peerOpts());
    V._peer = peer;
    V.isHost = true;
    V.code = code;
    var settled = false;

    peer.on('open', function () {
      settled = true;
      screenHosting(code);
    });
    peer.on('connection', function (conn) {
      if (V._conn && V._conn.open) { try { conn.close(); } catch (e) { } return; }
      hookConn(conn);
    });
    peer.on('error', function (er) {
      if (!settled && er && String(er.type) === 'unavailable-id') {
        try { peer.destroy(); } catch (e) { }
        return tryHost(attempt + 1); // 코드가 겹쳤다 → 다시 뽑는다
      }
      handlePeerError(er);
    });
  }

  function doGuest(code) {
    screenConnecting('방 ' + code + ' 로 들어가는 중');
    loadPeer(function (e) {
      if (e) return err(e.message);
      var peer = new global.Peer(null, peerOpts());
      V._peer = peer;
      V.isHost = false;
      V.code = code;
      var timer = setTimeout(function () {
        err('방을 찾지 못했어요. 코드를 다시 확인해 주세요.');
        cleanup();
        setTimeout(screenJoin, 60);
      }, 12000);
      peer.on('open', function () {
        var conn = peer.connect(roomId(code), { reliable: true });
        conn.on('open', function () { clearTimeout(timer); });
        hookConn(conn);
      });
      peer.on('error', function (er) { clearTimeout(timer); handlePeerError(er); });
    });
  }

  function handlePeerError(er) {
    var type = er && er.type;
    var msg = '연결에 문제가 생겼어요.';
    if (type === 'peer-unavailable') msg = '그 방 코드는 없어요. 다시 확인해 주세요.';
    else if (type === 'network' || type === 'server-error') msg = '인터넷 연결을 확인해 주세요.';
    else if (type === 'browser-incompatible') msg = '이 브라우저는 대결을 지원하지 않아요. 크롬을 써주세요.';
    err(msg);
    cleanup();
    setTimeout(function () { if (el('vsLobby').classList.contains('on')) screenHome(); }, 900);
  }

  function hookConn(conn) {
    V._conn = conn;
    conn.on('open', function () {
      send({ t: 'hello', name: V.myName });
    });
    conn.on('data', function (m) { onMessage(m); });
    conn.on('close', function () { onOppGone(); });
    conn.on('error', function () { onOppGone(); });
  }

  function send(obj) {
    try { if (V._conn && V._conn.open) V._conn.send(obj); } catch (e) { }
  }

  function onMessage(m) {
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
      case 'hello':
        V.oppName = (m.name || '친구').slice(0, 8);
        if (V.isHost) send({ t: 'hello', name: V.myName }); // 답인사
        screenReady();
        break;
      case 'start':
        beginMatch(m.seed, m.settings);
        break;
      case 'score':
        V.oppScore = m.n | 0;
        paintBar(false, true);
        break;
      case 'done':
        V._oppDone = true;
        V._oppFinal = m.n | 0;
        V.oppScore = m.n | 0;
        paintBar(false, true);
        maybeResult();
        break;
      case 'bye':
        onOppGone(true);
        break;
      case 'again':
        if (!V.isHost) return;
        break;
      default:
        if (V._opts && V._opts.onData) V._opts.onData(m);
    }
  }

  function onOppGone(clean) {
    if (!V.on && !el('vsLobby').classList.contains('on')) return;
    if (V.on && !V._myDone) {
      showResult(clean ? (esc(V.oppName) + ' 님이 나갔어요') : '상대와 연결이 끊겼어요', true);
    } else if (!V.on) {
      err('상대가 나갔어요.');
      cleanup();
      setTimeout(screenHome, 500);
    }
  }

  /* ══════════ 대결 진행 ══════════ */

  function beginMatch(seed, settings) {
    V.on = true;
    V.seed = seed >>> 0;
    V.settings = settings;
    V.myScore = 0; V.oppScore = 0;
    V._myDone = false; V._oppDone = false; V._oppFinal = 0;
    V.reseed(0);
    closeLobby();
    el('vsResult').classList.remove('on');
    el('vsMeName').textContent = V.myName;
    el('vsOpName').textContent = V.oppName;
    el('vsBar').classList.add('on');
    document.body.classList.add('vs-playing');
    paintBar();
    if (V._opts.onStart) V._opts.onStart({
      isHost: V.isHost, seed: V.seed, settings: settings,
      myName: V.myName, oppName: V.oppName
    });
  }

  function paintBar(popMe, popOpp) {
    var a = el('vsMeSc'), b = el('vsOpSc');
    if (!a) return;
    a.textContent = V.myScore + (V._myDone ? ' ✔' : '');
    b.textContent = (V._oppDone ? '✔ ' : '') + V.oppScore;
    if (popMe) bump(a);
    if (popOpp) bump(b);
  }
  function bump(n) { n.classList.remove('up'); void n.offsetWidth; n.classList.add('up'); }

  function maybeResult() {
    if (V._myDone && V._oppDone) showResult();
  }

  function showResult(reason, oppLeft) {
    V.on = false;
    el('vsBar').classList.remove('on');
    document.body.classList.remove('vs-playing');
    var me = V.myScore, op = V.oppScore;
    var title, emoji;
    if (oppLeft) { title = '대결 중단'; emoji = '😢'; }
    else if (me > op) { title = '이겼다!'; emoji = '🏆'; }
    else if (me < op) { title = '아깝다!'; emoji = '💪'; }
    else { title = '무승부!'; emoji = '🤝'; }

    /* 온라인 대결 전적을 서버에 기록한다 (상대가 중간에 나간 판은 세지 않는다).
       게임 10종이 모두 이 함수를 거치므로 여기 한 곳이면 충분하다. */
    if (!oppLeft && global.Records && global.Records.versus) {
      try {
        var gid = V._opts.game || '';
        var map = (global.JG && global.JG.SERVER_KEY) || {};
        global.Records.versus(map[gid] || gid,
          me > op ? 'win' : (me < op ? 'lose' : 'draw'), V.oppName);
      } catch (e) { /* 기록 실패가 게임을 막지 않는다 */ }
    }

    el('vsResPane').innerHTML =
      '<div class="vs-rt">' + emoji + ' ' + title + '</div>' +
      '<p class="sub">' + (reason ? esc(reason) : esc(V.myName) + ' vs ' + esc(V.oppName)) + '</p>' +
      '<div class="vs-sc">' +
      '<div><b style="color:#6b5ce7">' + me + '</b><small>' + esc(V.myName) + '</small></div>' +
      '<div><b style="color:#ef6f97">' + op + '</b><small>' + esc(V.oppName) + '</small></div>' +
      '</div>' +
      '<div class="vs-btns">' +
      (oppLeft ? '' : '<button class="vs-btn go" id="vsAgain">한 판 더!</button>') +
      '<button class="vs-btn sec" id="vsOut">나가기</button></div>';
    el('vsResult').classList.add('on');

    if (el('vsAgain')) el('vsAgain').onclick = function () {
      el('vsResult').classList.remove('on');
      V._myDone = false; V._oppDone = false;
      V.myScore = 0; V.oppScore = 0;
      if (V._conn && V._conn.open) screenReady();
      else { cleanup(); screenHome(); }
    };
    el('vsOut').onclick = function () { leave(); };
  }

  function leave() {
    send({ t: 'bye' });
    var cb = V._opts && V._opts.onLeave;
    cleanup();
    el('vsResult').classList.remove('on');
    closeLobby();
    el('vsBar').classList.remove('on');
    document.body.classList.remove('vs-playing');
    V.on = false;
    if (cb) cb();
  }

  function cleanup() {
    try { if (V._conn) V._conn.close(); } catch (e) { }
    try { if (V._peer) V._peer.destroy(); } catch (e) { }
    V._conn = null; V._peer = null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ══════════ 게임이 쓰는 공개 API ══════════ */

  V.open = function (opts) {
    V._opts = opts || {};
    injectCSS();
    buildDOM();
    V.on = false;
    V._myDone = false; V._oppDone = false;
    screenHome();
  };

  V.setScore = function (n) {
    V.myScore = n | 0;
    paintBar(true, false);
    send({ t: 'score', n: V.myScore });
  };

  V.finish = function (n) {
    if (!V.on || V._myDone) return;
    if (n != null) V.myScore = n | 0;
    V._myDone = true;
    paintBar();
    send({ t: 'done', n: V.myScore });
    if (!V._oppDone) {
      // 상대가 아직 하는 중 — 기다린다는 안내
      el('vsMeSc').textContent = V.myScore + ' ✔';
    }
    maybeResult();
  };

  V.send = function (obj) {
    if (!obj || typeof obj !== 'object') return;
    send(obj);
  };

  V.active = function () { return V.on; };
  V.leave = leave;

  /* 자동 테스트용 훅 — 실제 대결 없이 승패 화면 로직만 돌려볼 수 있다 */
  V._showResult = showResult;

  global.Versus = V;
})(window);
