/* ═══════════════════════════════════════════════════════════════
   room.js — jerry-games 공용 "여럿이서 온라인" 라이브러리 (2~10명)

   versus.js 가 1:1 대결용이라면, 이쪽은 방 하나에 여러 명이 모이는 게임용이다.
   구조는 별(star) 모양 — 참가자는 전부 방장하고만 연결하고, 방장이 중계한다.
   그래서 게임 판정은 **방장이 전부 맡는(host-authoritative)** 방식을 쓴다.
   (달무티처럼 손패가 비밀인 게임은 시드 동기화 방식으로는 만들 수 없다.)

   게임 쪽에서 쓰는 API
     Room.open({...})        로비 열기
     Room.all(obj)           방장 → 전원에게
     Room.to(pid, obj)       방장 → 특정 참가자에게
     Room.send(obj)          참가자 → 방장에게
     Room.players            [{id,name,host}] 현재 방 인원
     Room.myId / Room.isHost / Room.active()
     Room.leave()            방 나가기
     Room.note(msg)          모두에게 짧은 알림 띄우기(선택)
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var PEERJS_LOCAL = 'peerjs.min.js';
  var PEERJS_CDN = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  var CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var PREFIX = 'jerrygames';

  var R = {
    on: false,
    isHost: false,
    code: '',
    myId: '',
    myName: '나',
    players: [],
    settings: null,
    _peer: null,
    _conns: {},      // 방장: pid -> conn
    _conn: null,     // 참가자: 방장과의 conn
    _opts: null,
    _seq: 0,
    _started: false,
    _hb: null,        // 심장박동 타이머
    _seenHost: 0
  };

  /* PeerJS 는 탭이 갑자기 닫혀도 close 이벤트가 늦거나 안 올 때가 있다.
     그래서 3초마다 살아있다는 신호를 주고받고, 12초 넘게 조용하면 끊긴 것으로 본다. */
  var HB_EVERY = 3000, HB_DEAD = 12000;

  function startHeartbeat() {
    stopHeartbeat();
    R._seenHost = Date.now();
    R._hb = setInterval(function () {
      var now = Date.now();
      if (R.isHost) {
        broadcast({ t: '_hb' });
        var dead = [];
        for (var pid in R._conns) {
          var c = R._conns[pid];
          if (!c) continue;
          if (!c.__seen) c.__seen = now;
          if (now - c.__seen > HB_DEAD) dead.push(c);
        }
        dead.forEach(hostDrop);   // 목록을 먼저 모으고 지운다(순회 중 삭제 금지)
      } else {
        sendHost({ t: '_hb' });
        if (R._seenHost && now - R._seenHost > HB_DEAD) onHostGone();
      }
    }, HB_EVERY);
  }
  function stopHeartbeat() { if (R._hb) clearInterval(R._hb); R._hb = null; }

  /* ────────────── 스타일 ────────────── */
  function injectCSS() {
    if (document.getElementById('rmCSS')) return;
    var s = document.createElement('style');
    s.id = 'rmCSS';
    s.textContent = [
      '#rmLobby{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;',
      'background:rgba(52,46,66,.62);backdrop-filter:blur(6px);padding:16px;font-family:inherit;',
      '-webkit-tap-highlight-color:transparent}',
      '#rmLobby.on{display:flex}',
      '.rm-card{background:#fff;border-radius:24px;padding:22px 20px;width:min(430px,100%);',
      'box-shadow:0 18px 50px rgba(40,32,60,.3);color:#4a4258;text-align:center;',
      'max-height:calc(var(--jg-vh,100vh) - 32px);overflow:auto}',
      '.rm-card h3{margin:0 0 4px;font-size:21px;font-weight:900}',
      '.rm-card p.sub{margin:0 0 14px;font-size:13px;font-weight:700;color:#8a83a0;line-height:1.6}',
      '.rm-in{width:100%;box-sizing:border-box;border:2px solid #e7e2f2;border-radius:15px;padding:12px 13px;',
      'font-size:16px;font-weight:800;font-family:inherit;color:#4a4258;outline:none;text-align:center;background:#faf8ff}',
      '.rm-in:focus{border-color:#a99cff}',
      '.rm-in.code{letter-spacing:.22em;text-transform:uppercase;font-size:24px;font-weight:900}',
      '.rm-btns{display:flex;gap:9px;margin-top:12px}',
      '.rm-btn{flex:1;border:0;cursor:pointer;border-radius:16px;padding:13px;font-weight:900;font-size:15px;',
      'font-family:inherit;box-shadow:0 4px 0 rgba(74,66,88,.16);transition:.12s}',
      '.rm-btn:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(74,66,88,.16)}',
      '.rm-btn.pri{background:linear-gradient(150deg,#7f8bff,#b58cff);color:#fff}',
      '.rm-btn.go{background:linear-gradient(150deg,#3ecf8e,#5fd3c4);color:#fff}',
      '.rm-btn.sec{background:#efeaf6;color:#4a4258}',
      '.rm-btn[disabled]{opacity:.45;cursor:default}',
      '.rm-code{font-size:40px;font-weight:900;letter-spacing:.18em;color:#6b5ce7;margin:4px 0 2px;',
      'font-variant-numeric:tabular-nums}',
      '.rm-note{font-size:12.5px;font-weight:700;color:#8a83a0;line-height:1.7;background:#f7f4ff;',
      'border-radius:13px;padding:10px 12px;margin-top:11px;text-align:left}',
      '.rm-err{color:#e0446a;font-size:13px;font-weight:800;margin-top:9px;min-height:18px}',
      '.rm-wait{font-size:13.5px;font-weight:800;color:#7a6fd0;margin-top:10px}',
      '.rm-wait::after{content:"";display:inline-block;width:1em;text-align:left;animation:rmDot 1.2s steps(4) infinite}',
      '@keyframes rmDot{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}',
      '.rm-list{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin:12px 0 4px}',
      '.rm-p{background:#f2eefc;border-radius:13px;padding:7px 11px;font-size:13.5px;font-weight:800;',
      'display:flex;align-items:center;gap:5px}',
      '.rm-p.host{background:#e7f7ef;color:#217a52}',
      '.rm-p.bot{background:#f0f2f6;color:#6a7180}',
      '.rm-cnt{font-size:13px;font-weight:800;color:#7a6fd0}',
      '#rmToast{position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top));',
      'z-index:9500;background:rgba(52,46,66,.92);color:#fff;font-weight:800;font-size:13.5px;',
      'padding:9px 15px;border-radius:14px;opacity:0;transition:.25s;pointer-events:none;font-family:inherit;',
      'max-width:90vw;text-align:center}',
      '#rmToast.on{opacity:1}',
      '@media(max-width:420px){.rm-code{font-size:33px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function el(id) { return document.getElementById(id); }

  function buildDOM() {
    if (el('rmLobby')) return;
    var d = document.createElement('div');
    d.id = 'rmLobby';
    d.innerHTML = '<div class="rm-card" id="rmPane"></div>';
    document.body.appendChild(d);
    var t = document.createElement('div');
    t.id = 'rmToast';
    document.body.appendChild(t);
  }

  function pane(html) { el('rmPane').innerHTML = html; el('rmLobby').classList.add('on'); }
  function closeLobby() { el('rmLobby').classList.remove('on'); }
  function err(msg) { var e = el('rmErr'); if (e) e.textContent = msg || ''; }

  var toastTimer = null;
  function toast(msg) {
    var t = el('rmToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function randCode() {
    var s = '';
    for (var i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return s;
  }
  function roomId(code) { return PREFIX + '-' + (R._opts.game || 'g') + '-' + code; }

  /* ────────────── PeerJS ────────────── */
  function peerOpts() {
    var o = { debug: 0 };
    /* window.VERSUS_SERVER / ROOM_SERVER 로 중개서버를 바꿔치기할 수 있다(테스트용) */
    var ov = global.ROOM_SERVER || global.VERSUS_SERVER;
    if (ov) for (var k in ov) o[k] = ov[k];
    return o;
  }

  function myDir() {
    var s = document.currentScript;
    if (!s) {
      var all = document.getElementsByTagName('script');
      for (var i = all.length - 1; i >= 0; i--) {
        if (/room\.js/.test(all[i].src)) { s = all[i]; break; }
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

  /* ────────────── 화면 ────────────── */

  function screenHome() {
    var saved = '';
    try { saved = localStorage.getItem('vsName') || ''; } catch (e) { }
    var o = R._opts;
    pane(
      '<h3>🌐 여럿이서 온라인</h3>' +
      '<p class="sub">한 명이 <b>방을 만들고</b> 방 코드를 알려주면,<br>친구들이 코드를 넣고 들어와요. ' +
      '(최대 ' + o.max + '명)</p>' +
      '<input class="rm-in" id="rmName" maxlength="8" placeholder="내 이름 (예: 재희)" value="' + esc(saved) + '">' +
      '<div class="rm-btns"><button class="rm-btn pri" id="rmMake">방 만들기</button>' +
      '<button class="rm-btn go" id="rmJoin">방 참여하기</button></div>' +
      '<div class="rm-err" id="rmErr"></div>' +
      '<div class="rm-btns"><button class="rm-btn sec" id="rmCancel">← 돌아가기</button></div>'
    );
    el('rmMake').onclick = function () { saveName(); doHost(); };
    el('rmJoin').onclick = function () { saveName(); screenJoin(); };
    el('rmCancel').onclick = function () {
      cleanup(); closeLobby();
      if (R._opts.onCancel) R._opts.onCancel();
    };
  }

  function saveName() {
    var v = (el('rmName') && el('rmName').value || '').trim().slice(0, 8);
    R.myName = v || '나';
    try { localStorage.setItem('vsName', R.myName); } catch (e) { }
  }

  function screenJoin() {
    pane(
      '<h3>방 참여하기</h3>' +
      '<p class="sub">친구가 알려준 <b>4글자 방 코드</b>를 넣어주세요.</p>' +
      '<input class="rm-in code" id="rmCodeIn" maxlength="4" placeholder="ABCD" autocomplete="off">' +
      '<div class="rm-btns"><button class="rm-btn go" id="rmGo">입장!</button></div>' +
      '<div class="rm-err" id="rmErr"></div>' +
      '<div class="rm-btns"><button class="rm-btn sec" id="rmBack">← 뒤로</button></div>'
    );
    var input = el('rmCodeIn');
    input.focus();
    input.oninput = function () { this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
    input.onkeydown = function (e) { if (e.key === 'Enter') el('rmGo').click(); };
    el('rmGo').onclick = function () {
      var c = input.value.trim().toUpperCase();
      if (c.length !== 4) return err('4글자를 정확히 넣어주세요.');
      doGuest(c);
    };
    el('rmBack').onclick = screenHome;
  }

  function screenConnecting(msg) {
    pane(
      '<h3>연결하는 중…</h3>' +
      '<p class="sub">' + esc(msg || '잠깐만 기다려 주세요') + '</p>' +
      '<div class="rm-wait">연결 중</div>' +
      '<div class="rm-err" id="rmErr"></div>' +
      '<div class="rm-btns"><button class="rm-btn sec" id="rmBack">← 취소</button></div>'
    );
    el('rmBack').onclick = function () { cleanup(); screenHome(); };
  }

  /* 대기실 — 방장/참가자 공용. 인원이 바뀔 때마다 다시 그린다. */
  function screenRoom() {
    var o = R._opts;
    var n = R.players.length;
    var extra = (R.isHost && o.settingsHTML) ? o.settingsHTML() : '';
    var list = R.players.map(function (p) {
      return '<span class="rm-p' + (p.host ? ' host' : '') + '">' +
        (p.host ? '👑 ' : '🙂 ') + esc(p.name) + (p.id === R.myId ? ' <b>(나)</b>' : '') + '</span>';
    }).join('');

    pane(
      '<h3>' + (R.isHost ? '방을 만들었어요!' : '입장했어요!') + '</h3>' +
      (R.isHost
        ? '<p class="sub">아래 <b>방 코드</b>를 친구들에게 알려주세요.</p><div class="rm-code">' + R.code + '</div>' +
        '<div class="rm-btns"><button class="rm-btn sec" id="rmCopy">📋 코드 복사</button></div>'
        : '<p class="sub">방 코드 <b>' + R.code + '</b> · 방장이 시작하기를 기다려요</p>') +
      '<div class="rm-cnt">참가자 ' + n + '명</div>' +
      '<div class="rm-list">' + list + '</div>' +
      (R.isHost ? extra : '') +
      (R.isHost
        ? '<div class="rm-btns"><button class="rm-btn go" id="rmStart"' +
        (n >= (o.min || 1) ? '' : ' disabled') + '>시작하기</button></div>' +
        (n >= (o.min || 1) ? '' : '<div class="rm-note">사람이 ' + (o.min || 1) + '명 이상 모이면 시작할 수 있어요.' +
          (o.canFill ? ' (또는 빈 자리를 컴퓨터로 채워서 바로 시작)' : '') + '</div>')
        : '<div class="rm-wait">기다리는 중</div>') +
      '<div class="rm-err" id="rmErr"></div>' +
      '<div class="rm-btns"><button class="rm-btn sec" id="rmOut">← 나가기</button></div>'
    );

    if (el('rmCopy')) el('rmCopy').onclick = function () {
      var t = this;
      try {
        navigator.clipboard.writeText(R.code);
        t.textContent = '✅ 복사됨!';
        setTimeout(function () { t.textContent = '📋 코드 복사'; }, 1400);
      } catch (e) { err('복사가 안 되면 직접 불러주세요: ' + R.code); }
    };
    if (el('rmStart')) el('rmStart').onclick = function () {
      this.disabled = true;
      var st = o.getSettings ? o.getSettings() : null;
      var chk = o.validate ? o.validate(st, R.players.length) : null;
      if (chk) { this.disabled = false; return err(chk); }
      R.settings = st;
      broadcast({ t: '_go', settings: st, players: R.players });
      begin(st);
    };
    el('rmOut').onclick = function () { leave(); };
    if (R.isHost && o.onLobbyDraw) o.onLobbyDraw();
  }

  /* ────────────── 연결 ────────────── */

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
    R._peer = peer;
    R.isHost = true;
    R.code = code;
    R.myId = 'h';
    R.players = [{ id: 'h', name: R.myName, host: true }];
    var settled = false;

    peer.on('open', function () { settled = true; screenRoom(); startHeartbeat(); });
    peer.on('connection', function (conn) { hostAccept(conn); });
    peer.on('error', function (er) {
      if (!settled && er && String(er.type) === 'unavailable-id') {
        try { peer.destroy(); } catch (e) { }
        return tryHost(attempt + 1);
      }
      handlePeerError(er);
    });
  }

  function hostAccept(conn) {
    conn.on('open', function () {
      if (R._started) { try { conn.send({ t: '_no', why: 'started' }); conn.close(); } catch (e) { } return; }
      if (R.players.length >= R._opts.max) { try { conn.send({ t: '_no', why: 'full' }); conn.close(); } catch (e) { } return; }
      /* 이름은 _hi 로 온다 */
    });
    conn.on('data', function (m) { hostOnMessage(conn, m); });
    conn.on('close', function () { hostDrop(conn); });
    conn.on('error', function () { hostDrop(conn); });
  }

  function hostOnMessage(conn, m) {
    if (!m || typeof m !== 'object') return;
    conn.__seen = Date.now();
    if (m.t === '_hb') return;
    if (m.t === '_hi') {
      if (conn.__pid) return;
      if (R._started) { try { conn.send({ t: '_no', why: 'started' }); conn.close(); } catch (e) { } return; }
      if (R.players.length >= R._opts.max) { try { conn.send({ t: '_no', why: 'full' }); conn.close(); } catch (e) { } return; }
      var pid = 'p' + (++R._seq);
      conn.__pid = pid;
      conn.__seen = Date.now();
      R._conns[pid] = conn;
      var nm = String(m.name || '친구').slice(0, 8);
      /* 이름이 겹치면 뒤에 숫자를 붙인다 */
      var base = nm, k = 2;
      while (R.players.some(function (p) { return p.name === nm; })) nm = base + k++;
      R.players.push({ id: pid, name: nm, host: false });
      try { conn.send({ t: '_you', id: pid, name: nm, code: R.code }); } catch (e) { }
      broadcast({ t: '_roster', players: R.players });
      screenRoom();
      toast(nm + ' 님 입장!');
      if (R._opts.onRoster) R._opts.onRoster(R.players);
      return;
    }
    if (!conn.__pid) return;
    if (m.t === '_bye') { hostDrop(conn); return; }
    if (R._opts.onData) R._opts.onData(m, conn.__pid);
  }

  function hostDrop(conn) {
    var pid = conn.__pid;
    if (!pid || !R._conns[pid]) return;
    delete R._conns[pid];
    var gone = null;
    R.players = R.players.filter(function (p) {
      if (p.id === pid) { gone = p; return false; }
      return true;
    });
    if (!gone) return;
    if (R._started) {
      broadcast({ t: '_left', id: pid, name: gone.name });
      toast(gone.name + ' 님이 나갔어요');
      if (R._opts.onPeerLeave) R._opts.onPeerLeave(pid, gone.name);
    } else {
      broadcast({ t: '_roster', players: R.players });
      screenRoom();
      toast(gone.name + ' 님이 나갔어요');
      if (R._opts.onRoster) R._opts.onRoster(R.players);
    }
  }

  function doGuest(code) {
    screenConnecting('방 ' + code + ' 로 들어가는 중');
    loadPeer(function (e) {
      if (e) return err(e.message);
      var peer = new global.Peer(null, peerOpts());
      R._peer = peer;
      R.isHost = false;
      R.code = code;
      var timer = setTimeout(function () {
        err('방을 찾지 못했어요. 코드를 다시 확인해 주세요.');
        cleanup();
        setTimeout(screenJoin, 60);
      }, 12000);
      peer.on('open', function () {
        var conn = peer.connect(roomId(code), { reliable: true });
        R._conn = conn;
        conn.on('open', function () {
          clearTimeout(timer);
          try { conn.send({ t: '_hi', name: R.myName }); } catch (e) { }
          startHeartbeat();
        });
        conn.on('data', function (m) { guestOnMessage(m); });
        conn.on('close', function () { onHostGone(); });
        conn.on('error', function () { onHostGone(); });
      });
      peer.on('error', function (er) { clearTimeout(timer); handlePeerError(er); });
    });
  }

  function guestOnMessage(m) {
    if (!m || typeof m !== 'object') return;
    R._seenHost = Date.now();
    if (m.t === '_hb') return;
    switch (m.t) {
      case '_you':
        R.myId = m.id;
        R.myName = m.name || R.myName;
        break;
      case '_roster':
        R.players = m.players || [];
        if (!R._started) screenRoom();
        if (R._opts.onRoster) R._opts.onRoster(R.players);
        break;
      case '_go':
        R.players = m.players || R.players;
        R.settings = m.settings;
        begin(m.settings);
        break;
      case '_left':
        R.players = R.players.filter(function (p) { return p.id !== m.id; });
        toast((m.name || '누군가') + ' 님이 나갔어요');
        if (R._opts.onPeerLeave) R._opts.onPeerLeave(m.id, m.name);
        break;
      case '_toast':
        toast(m.msg || '');
        break;
      case '_no':
        err(m.why === 'full' ? '방이 꽉 찼어요.' : '이미 게임이 시작된 방이에요.');
        cleanup();
        setTimeout(screenJoin, 900);
        break;
      case '_end':
        /* 방장이 방을 닫았다 */
        onHostGone(true);
        break;
      default:
        if (R._opts.onData) R._opts.onData(m, 'h');
    }
  }

  function onHostGone(clean) {
    if (!R.on && !el('rmLobby').classList.contains('on')) return;
    if (R.on) {
      R.on = false; R._started = false;
      cleanup();
      if (R._opts.onHostGone) R._opts.onHostGone();
      else { closeLobby(); toast('방장이 나가서 게임이 끝났어요'); }
    } else {
      err(clean ? '방장이 방을 닫았어요.' : '방장과 연결이 끊겼어요.');
      cleanup();
      setTimeout(screenHome, 700);
    }
  }

  function handlePeerError(er) {
    var type = er && er.type;
    var msg = '연결에 문제가 생겼어요.';
    if (type === 'peer-unavailable') msg = '그 방 코드는 없어요. 다시 확인해 주세요.';
    else if (type === 'network' || type === 'server-error') msg = '인터넷 연결을 확인해 주세요.';
    else if (type === 'browser-incompatible') msg = '이 브라우저는 온라인 대결을 지원하지 않아요. 크롬을 써주세요.';
    err(msg);
    cleanup();
    setTimeout(function () { if (el('rmLobby').classList.contains('on')) screenHome(); }, 900);
  }

  /* ────────────── 통신 ────────────── */

  function broadcast(obj) {
    for (var pid in R._conns) {
      try { if (R._conns[pid].open) R._conns[pid].send(obj); } catch (e) { }
    }
  }
  function sendTo(pid, obj) {
    var c = R._conns[pid];
    try { if (c && c.open) c.send(obj); } catch (e) { }
  }
  function sendHost(obj) {
    try { if (R._conn && R._conn.open) R._conn.send(obj); } catch (e) { }
  }

  /* ────────────── 시작/종료 ────────────── */

  function begin(settings) {
    R.on = true;
    R._started = true;
    R.settings = settings;
    closeLobby();
    if (R._opts.onStart) R._opts.onStart({
      isHost: R.isHost, myId: R.myId, myName: R.myName,
      players: R.players.slice(), settings: settings
    });
  }

  function leave() {
    var cb = R._opts && R._opts.onLeave;
    if (R.isHost) broadcast({ t: '_end' });
    else sendHost({ t: '_bye' });
    cleanup();
    closeLobby();
    R.on = false;
    R._started = false;
    if (cb) cb();
  }

  function cleanup() {
    stopHeartbeat();
    for (var pid in R._conns) { try { R._conns[pid].close(); } catch (e) { } }
    R._conns = {};
    try { if (R._conn) R._conn.close(); } catch (e) { }
    try { if (R._peer) R._peer.destroy(); } catch (e) { }
    R._conn = null; R._peer = null;
  }

  /* ────────────── 공개 API ────────────── */

  R.open = function (opts) {
    R._opts = opts || {};
    R._opts.max = Math.min(10, opts.max || 8);
    R._opts.min = opts.min || 2;
    injectCSS();
    buildDOM();
    R.on = false;
    R._started = false;
    R._seq = 0;
    R.players = [];
    screenHome();
  };

  R.all = function (obj) { if (R.isHost) broadcast(obj); };
  R.to = function (pid, obj) { if (R.isHost) sendTo(pid, obj); };
  R.send = function (obj) { if (!R.isHost) sendHost(obj); };
  R.note = function (msg) {
    toast(msg);
    if (R.isHost) broadcast({ t: '_toast', msg: msg });
  };
  R.toast = toast;
  R.active = function () { return R.on; };
  R.leave = leave;
  R.redrawLobby = function () { if (el('rmLobby') && el('rmLobby').classList.contains('on')) screenRoom(); };
  R.esc = esc;

  global.Room = R;
})(window);
