/*!
 * jerry-games 기록 라이브러리 (common/records.js)
 * ---------------------------------------------------------------------------
 * 게임에서 이렇게 씁니다.
 *
 *   <script src="../../../common/records.js"></script>
 *
 *   await Records.submit('jump-map', 1234);          // 점수 보내기(최고점 자동 갱신)
 *   Records.showBoard('jump-map');                    // 랭킹 창 띄우기
 *   Records.note('math-speed', [{q:'7×8', a:'56', my:'54'}]);   // 오답노트
 *   Records.versus('set', 'win', '상대이름');          // 대결 전적
 *
 * 원칙
 *  - 서버가 죽어도, 인터넷이 끊겨도 게임은 그대로 돌아간다. 모든 함수는 실패해도 던지지 않는다.
 *  - 못 보낸 기록은 localStorage 큐에 쌓아 두었다가 다음에 자동 재전송한다.
 *  - localStorage 가 막힌 환경에서는 메모리 저장으로 자동 대체된다.
 */
(function (global) {
  'use strict';

  // ── 저장소 (localStorage 실패 시 메모리) ───────────────────────────────
  var mem = {};
  var store = {
    get: function (k) {
      try {
        var v = global.localStorage.getItem(k);
        return v === null ? (k in mem ? mem[k] : null) : v;
      } catch (e) {
        return k in mem ? mem[k] : null;
      }
    },
    set: function (k, v) {
      mem[k] = v;
      try {
        global.localStorage.setItem(k, v);
      } catch (e) {
        /* 무시 */
      }
    },
  };

  // ── 서버 주소 ──────────────────────────────────────────────────────────
  // window.RECORDS_API 로 덮어쓸 수 있다 (로컬 테스트용).
  var host = global.location ? global.location.hostname : '';
  var API =
    global.RECORDS_API ||
    (/^(localhost|127\.0\.0\.1)$/.test(host) || /\.vercel\.app$/.test(host)
      ? '/api'
      : 'https://jerry-games.vercel.app/api');

  var TIMEOUT = 6000;
  var QKEY = 'jg_queue_v1';
  var PKEY = 'jg_pid_v1';
  var NKEY = 'jg_name_v1';

  // ── 플레이어 신원 ──────────────────────────────────────────────────────
  function makePid() {
    var s = '';
    var abc = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var buf = null;
    try {
      buf = new Uint8Array(16);
      global.crypto.getRandomValues(buf);
    } catch (e) {
      buf = null;
    }
    for (var i = 0; i < 16; i++) {
      var n = buf ? buf[i] : Math.floor(Math.random() * 256);
      s += abc[n % abc.length];
    }
    return s;
  }

  var pid = store.get(PKEY);
  if (!pid || !/^[A-Za-z0-9_-]{8,22}$/.test(pid)) {
    pid = makePid();
    store.set(PKEY, pid);
  }

  /* ── 프로필(플레이어)별 신원 ────────────────────────────────────────────
     common/profile.js 의 플레이어마다 서버 ID(pid)를 따로 발급한다.
     같은 태블릿에서 형제가 번갈아 해도 온라인 기록이 섞이지 않는다.
     맨 처음 프로필에는 기존 pid 를 그대로 물려줘서 예전 기록이 이어진다. */
  var PMAP = 'jg_pid_map_v1';
  var profileId = '';           // 현재 프로필 id ('' 이면 기기 공용 pid)
  function pidMap() {
    try { return JSON.parse(store.get(PMAP) || '{}') || {}; } catch (e) { return {}; }
  }
  function pidFor(id) {
    var map = pidMap();
    var v = map[id];
    if (!v || !/^[A-Za-z0-9_-]{8,22}$/.test(v)) {
      // 첫 프로필은 기기 pid 를 물려받는다 (그 전에 쌓인 기록 유지)
      v = Object.keys(map).length ? makePid() : pid;
      map[id] = v;
      store.set(PMAP, JSON.stringify(map));
    }
    return v;
  }
  function nameKey() { return profileId ? NKEY + ':' + profileId : NKEY; }

  /* profile.js 가 호출한다. 플레이어를 바꾸면 여기부터 다른 사람 기록이 된다. */
  function useProfile(id, name) {
    if (!id) return pid;
    profileId = String(id);
    pid = pidFor(profileId);
    Records.pid = pid;
    if (name) {
      var n = String(name).trim().slice(0, 12);
      if (n && n !== store.get(nameKey())) {
        store.set(nameKey(), n);
        send('/me', { pid: pid, name: n });   // 서버 쪽 표시 이름도 맞춰 둔다
      }
    }
    return pid;
  }

  function getName() {
    return store.get(nameKey()) || '';
  }
  function setName(n) {
    n = String(n || '')
      .trim()
      .slice(0, 12);
    if (!n) return getName();
    store.set(nameKey(), n);
    send('/me', { pid: pid, name: n });
    return n;
  }

  // ── 통신 ───────────────────────────────────────────────────────────────
  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) {
          done = true;
          resolve(null);
        }
      }, ms);
      promise.then(
        function (v) {
          if (!done) {
            done = true;
            clearTimeout(timer);
            resolve(v);
          }
        },
        function () {
          if (!done) {
            done = true;
            clearTimeout(timer);
            resolve(null);
          }
        }
      );
    });
  }

  function get(path) {
    return withTimeout(
      fetch(API + path, { method: 'GET' }).then(function (r) {
        return r.ok ? r.json() : null;
      }),
      TIMEOUT
    );
  }

  function send(path, body) {
    return withTimeout(
      fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(function (r) {
        // 4xx = 데이터가 잘못된 것 → 다시 보내도 소용없으니 성공으로 친다(큐에서 버림)
        if (r.status >= 400 && r.status < 500) return { ok: false, drop: true };
        return r.ok ? r.json() : null;
      }),
      TIMEOUT
    );
  }

  // ── 실패한 요청 큐 ─────────────────────────────────────────────────────
  function queue() {
    try {
      return JSON.parse(store.get(QKEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function saveQueue(q) {
    store.set(QKEY, JSON.stringify(q.slice(-100)));
  }
  function enqueue(path, body) {
    var q = queue();
    q.push({ p: path, b: body });
    saveQueue(q);
  }

  var flushing = false;
  function flush() {
    if (flushing) return Promise.resolve();
    var q = queue();
    if (!q.length) return Promise.resolve();
    flushing = true;
    var left = [];
    return q
      .reduce(function (chain, item) {
        return chain.then(function () {
          return send(item.p, item.b).then(function (res) {
            if (!res) left.push(item); // 아직 실패 → 다음에 다시
          });
        });
      }, Promise.resolve())
      .then(function () {
        saveQueue(left);
        flushing = false;
      });
  }

  // ── 공개 API ───────────────────────────────────────────────────────────
  function submit(game, score, meta) {
    var body = {
      pid: pid,
      name: getName() || '이름없음',
      game: game,
      score: Math.floor(Number(score) || 0),
      meta: meta,
    };
    return send('/scores', body).then(function (res) {
      if (!res) enqueue('/scores', body);
      return res;
    });
  }

  function note(game, items) {
    if (!items || !items.length) return Promise.resolve(null);
    var body = { pid: pid, game: game, items: items };
    return send('/notes', body).then(function (res) {
      if (!res) enqueue('/notes', body);
      return res;
    });
  }

  function versus(game, result, opp) {
    var body = {
      pid: pid,
      name: getName() || '이름없음',
      game: game,
      result: result,
      opp: opp,
    };
    return send('/versus', body).then(function (res) {
      if (!res) enqueue('/versus', body);
      return res;
    });
  }

  function top(game, limit) {
    return get(
      '/scores?game=' +
        encodeURIComponent(game) +
        '&limit=' +
        (limit || 20) +
        '&pid=' +
        pid
    );
  }

  function myRecord() {
    return get('/me?pid=' + pid);
  }
  function myNotes(game) {
    return get('/notes?pid=' + pid + (game ? '&game=' + encodeURIComponent(game) : ''));
  }
  function clearNotes(game) {
    return send('/notes', { pid: pid, game: game, clear: true });
  }

  // ── 이름 물어보기 (한 번만) ────────────────────────────────────────────
  function ask(title, initial) {
    return new Promise(function (resolve) {
      var wrap = document.createElement('div');
      wrap.style.cssText =
        'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);' +
        'display:flex;align-items:center;justify-content:center;padding:20px;' +
        'font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
      wrap.innerHTML =
        '<div style="background:#fff;border-radius:16px;padding:22px;max-width:320px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.3)">' +
        '<div style="font-weight:800;font-size:17px;margin-bottom:6px">' +
        title +
        '</div>' +
        '<div style="font-size:12.5px;color:#5f6368;margin-bottom:14px">랭킹에 표시될 이름이에요. 나중에 바꿀 수 있어요.</div>' +
        '<input id="jgn" maxlength="12" placeholder="예: 재희" style="width:100%;padding:11px 12px;font-size:16px;border:2px solid #e0e3e7;border-radius:10px;outline:none;box-sizing:border-box">' +
        '<button id="jgok" style="width:100%;margin-top:12px;padding:12px;font-size:15px;font-weight:800;color:#fff;background:#4285F4;border:0;border-radius:10px;cursor:pointer">확인</button>' +
        '</div>';
      document.body.appendChild(wrap);
      var input = wrap.querySelector('#jgn');
      input.value = initial || '';
      setTimeout(function () {
        input.focus();
      }, 50);
      function done() {
        var v = input.value.trim().slice(0, 12);
        if (!v) {
          input.style.borderColor = '#EA4335';
          return;
        }
        document.body.removeChild(wrap);
        resolve(v);
      }
      wrap.querySelector('#jgok').addEventListener('click', done);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') done();
      });
    });
  }

  function ensureName() {
    var n = getName();
    if (n) return Promise.resolve(n);
    return ask('랭킹에 쓸 이름을 정해 주세요').then(function (v) {
      return setName(v);
    });
  }
  function changeName() {
    return ask('이름 바꾸기', getName()).then(function (v) {
      return setName(v);
    });
  }

  // ── 랭킹 창 ────────────────────────────────────────────────────────────
  function showBoard(game, opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.45);' +
      'display:flex;align-items:center;justify-content:center;padding:20px;' +
      'font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;max-width:360px;width:100%;max-height:80vh;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.3)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
      '<div style="font-weight:800;font-size:17px">🏆 ' +
      (opts.title || '전체 랭킹') +
      '</div>' +
      '<button id="jgx" style="border:0;background:#f1f3f4;border-radius:8px;width:30px;height:30px;font-size:16px;cursor:pointer">✕</button>' +
      '</div><div id="jgb" style="font-size:14px;color:#5f6368">불러오는 중…</div></div>';
    document.body.appendChild(wrap);
    var close = function () {
      if (wrap.parentNode) document.body.removeChild(wrap);
    };
    wrap.querySelector('#jgx').addEventListener('click', close);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) close();
    });

    top(game, opts.limit || 20).then(function (res) {
      var box = wrap.querySelector('#jgb');
      if (!box) return;
      if (!res || !res.ok) {
        box.innerHTML =
          '기록 서버에 연결하지 못했어요.<br>인터넷을 확인하고 다시 열어 주세요.';
        return;
      }
      if (!res.top.length) {
        box.innerHTML = '아직 기록이 없어요. 첫 번째 기록의 주인공이 되어 보세요!';
        return;
      }
      var medal = ['🥇', '🥈', '🥉'];
      var html =
        '<table style="width:100%;border-collapse:collapse;font-size:14px;color:#202124">';
      res.top.forEach(function (t) {
        html +=
          '<tr style="' +
          (t.me ? 'background:#e8f0fe;font-weight:800;' : '') +
          'border-bottom:1px solid #f1f3f4">' +
          '<td style="padding:8px 4px;width:38px">' +
          (medal[t.rank - 1] || t.rank) +
          '</td>' +
          '<td style="padding:8px 4px">' +
          esc(t.name) +
          (t.me ? ' <span style="color:#4285F4">(나)</span>' : '') +
          '</td>' +
          '<td style="padding:8px 4px;text-align:right">' +
          t.score.toLocaleString() +
          '</td></tr>';
      });
      html += '</table>';
      if (res.mine && !res.top.some(function (t) { return t.me; }))
        html +=
          '<div style="margin-top:10px;padding:9px;background:#e8f0fe;border-radius:9px;font-size:13px">' +
          '내 기록 — ' +
          res.mine.rank +
          '위 / ' +
          res.total +
          '명 중 · ' +
          res.mine.score.toLocaleString() +
          '점</div>';
      box.innerHTML = html;
    });
    return close;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ── 시작 시 밀린 큐 재전송 ─────────────────────────────────────────────
  if (global.addEventListener) {
    global.addEventListener('online', flush);
    global.addEventListener('load', function () {
      setTimeout(flush, 1500);
    });
  }

  global.Records = {
    pid: pid,
    api: API,
    useProfile: useProfile,
    name: getName,
    setName: setName,
    ensureName: ensureName,
    changeName: changeName,
    submit: submit,
    note: note,
    versus: versus,
    top: top,
    me: myRecord,
    notes: myNotes,
    clearNotes: clearNotes,
    showBoard: showBoard,
    flush: flush,
    pending: function () {
      return queue().length;
    },
  };
})(window);
