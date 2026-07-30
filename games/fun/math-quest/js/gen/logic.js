/* =====================================================================
 * logic.js — 규칙·추리·논리 문제 생성기
 * pattern: seq, pat, blank, matrix, path, maze
 * logic  : oddone, truth, order, cipher, weigh, river, match, iq
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ;

  /* ---------------- 공용 도우미 ---------------- */

  var NAMES = ['가온', '나래', '다온', '라온', '민서', '서준', '하윤', '지호', '유나', '태오'];

  function numChoices(ans, R, spread, min) {
    return MQ.mkChoices(ans, R, { spread: spread || 4, min: (min == null ? 0 : min) });
  }

  /* 문자열 보기 4개(정답 + 오답후보) */
  function strChoices(ans, cands, R) {
    return MQ.uniq4(ans, cands, R);
  }

  function rep(s, n) {
    var out = '', i;
    for (i = 0; i < n; i++) out += s;
    return out;
  }

  function tableHTML(rows) {
    var h = '<table style="border-collapse:collapse;margin:0 auto">', i, j;
    for (i = 0; i < rows.length; i++) {
      h += '<tr>';
      for (j = 0; j < rows[i].length; j++) {
        h += '<td style="border:1px solid #7a86b8;padding:3px 9px;text-align:center">' + rows[i][j] + '</td>';
      }
      h += '</tr>';
    }
    return h + '</table>';
  }

  function joinList(arr) { return arr.join('<br>'); }

  /* =====================================================================
   * 1. seq — 수열
   * ===================================================================== */
  MQ.Gen.register('seq', {
    name: '수열', icon: '🔢', skill: 'pattern', minLv: 4, maxLv: 100
  }, function (lv, R) {
    var terms = [], i, ans, why, n = 5;
    var kind;
    if (lv < 14) kind = R.pick(['add', 'add']);
    else if (lv < 26) kind = R.pick(['add', 'sub', 'add2']);
    else if (lv < 46) kind = R.pick(['mul', 'add2', 'sub']);
    else if (lv < 68) kind = R.pick(['mul', 'diff', 'fib']);
    else kind = R.pick(['diff', 'fib', 'linrec', 'square']);

    if (kind === 'add') {
      var a0 = R.int(1, lv < 14 ? 9 : 40), d = R.int(2, lv < 14 ? 5 : 12);
      for (i = 0; i < n + 1; i++) terms.push(a0 + d * i);
      why = d + '씩 커지는 수열이에요.';
    } else if (kind === 'sub') {
      var d2 = R.int(2, 9), start = d2 * (n + 2) + R.int(1, 20);
      for (i = 0; i < n + 1; i++) terms.push(start - d2 * i);
      why = d2 + '씩 작아지는 수열이에요.';
    } else if (kind === 'add2') {
      var b0 = R.int(1, 12), dd = R.int(2, 6);
      for (i = 0; i < n + 1; i++) terms.push(b0 + dd * i);
      why = dd + '씩 커지는 수열이에요.';
    } else if (kind === 'mul') {
      var r = R.pick([2, 2, 3]), c0 = R.int(1, r === 2 ? 5 : 3);
      n = 4;
      for (i = 0; i < n + 1; i++) terms.push(c0 * Math.pow(r, i));
      why = r + '배씩 커지는 수열이에요.';
    } else if (kind === 'diff') {
      /* 계차수열: 차이가 1,2,3,... 또는 2,4,6,... */
      var st = R.int(1, 9), d1 = R.int(1, 5), inc = R.int(1, 4), cur = st, gap = d1;
      terms.push(cur);
      for (i = 0; i < n; i++) { cur += gap; gap += inc; terms.push(cur); }
      why = '차이가 ' + d1 + '부터 ' + inc + '씩 커져요.';
    } else if (kind === 'fib') {
      var f1 = R.int(1, 6), f2 = R.int(2, 9);
      terms.push(f1); terms.push(f2);
      for (i = 2; i < n + 1; i++) terms.push(terms[i - 1] + terms[i - 2]);
      why = '앞의 두 수를 더하면 다음 수가 돼요.';
    } else if (kind === 'linrec') {
      var m = R.pick([2, 3]), p = R.int(1, 5), s0 = R.int(1, 4);
      n = 4;
      terms.push(s0);
      for (i = 1; i < n + 1; i++) terms.push(terms[i - 1] * m + p);
      why = '앞의 수에 ' + m + '을(를) 곱하고 ' + p + '을(를) 더해요.';
    } else {
      /* square: n*n + k */
      var k = R.int(0, 5), base = R.int(1, 3);
      n = 5;
      for (i = 0; i < n + 1; i++) { var t = base + i; terms.push(t * t + k); }
      why = '순서대로 제곱수에 ' + k + '을(를) 더한 수예요.';
    }

    ans = terms[terms.length - 1];
    var shown = terms.slice(0, terms.length - 1);

    return {
      text: shown.join(', ') + ', <b>?</b>',
      sub: '',
      answer: String(ans),
      choices: numChoices(ans, R, Math.max(2, Math.round(Math.abs(ans) * 0.2)), 0),
      explain: why + ' 그래서 다음은 ' + ans + '이에요.'
    };
  });

  /* =====================================================================
   * 2. pat — 모양 규칙 찾기
   * ===================================================================== */
  var PAT_POOL = ['🔺', '🔵', '⭐', '🟩', '🟣', '❤️', '🍎', '🌙', '🔶', '🐤'];

  MQ.Gen.register('pat', {
    name: '모양 규칙', icon: '🔺', skill: 'pattern', minLv: 1, maxLv: 40
  }, function (lv, R) {
    var cyc;
    if (lv < 7) cyc = 2;
    else if (lv < 16) cyc = 3;
    else if (lv < 28) cyc = R.pick([3, 4]);
    else cyc = 4;

    var syms = R.sample(PAT_POOL, Math.max(cyc, 4));
    var unit = syms.slice(0, cyc);

    /* 늘어나는 규칙(고급) */
    var seqArr = [], i, j;
    if (lv >= 22 && R.chance(0.35) && cyc >= 2) {
      /* A B A B B A B B B ... */
      var A = unit[0], B = unit[1];
      for (i = 1; i <= 4; i++) {
        seqArr.push(A);
        for (j = 0; j < i; j++) seqArr.push(B);
      }
      seqArr = seqArr.slice(0, 10);
      var idx = seqArr.length;
      /* 다음 항 계산: 규칙대로 계속 만들어 본다 */
      var full = [];
      for (i = 1; i <= 8; i++) { full.push(A); for (j = 0; j < i; j++) full.push(B); }
      var ansS = full[idx];
      return {
        text: seqArr.join('') + '<b>?</b>',
        sub: '다음에 올 모양은?',
        answer: ansS,
        choices: strChoices(ansS, syms, R),
        explain: A + ' 뒤에 ' + B + '가 하나씩 늘어나요. 다음은 ' + ansS + '예요.'
      };
    }

    var len = cyc * 3;
    for (i = 0; i < len; i++) seqArr.push(unit[i % cyc]);
    var ans = unit[len % cyc];

    return {
      text: seqArr.join('') + '<b>?</b>',
      sub: '다음에 올 모양은?',
      answer: ans,
      choices: strChoices(ans, syms, R),
      explain: unit.join('') + ' 가 반복돼요. 다음은 ' + ans + '예요.'
    };
  });

  /* =====================================================================
   * 3. blank — 표 빈칸 추론
   * ===================================================================== */
  MQ.Gen.register('blank', {
    name: '빈칸 추론', icon: '🟦', skill: 'pattern', minLv: 16, maxLv: 100
  }, function (lv, R) {
    var a, b, f, why;
    if (lv < 30) { a = R.int(2, 4); b = R.int(1, 9); }
    else if (lv < 55) { a = R.int(3, 7); b = R.int(1, 15); }
    else { a = R.int(4, 9); b = R.int(2, 30); }

    var mode = (lv >= 45 && R.chance(0.4)) ? 'sq' : 'lin';
    if (mode === 'sq') {
      f = function (x) { return x * x + b; };
      why = '(입력 × 입력) + ' + b;
    } else {
      f = function (x) { return a * x + b; };
      why = '(입력 × ' + a + ') + ' + b;
    }

    var xs = [], x0 = R.int(1, 4), step = R.int(1, 3), i;
    for (i = 0; i < 4; i++) xs.push(x0 + step * i);
    var hide = R.int(2, 3);

    var row1 = ['<b>들어간 수</b>'], row2 = ['<b>나온 수</b>'];
    for (i = 0; i < 4; i++) {
      row1.push(String(xs[i]));
      row2.push(i === hide ? '<b>?</b>' : String(f(xs[i])));
    }
    var ans = f(xs[hide]);

    return {
      text: '마법 상자의 규칙을 찾아 <b>?</b>를 구하라.',
      sub: tableHTML([row1, row2]),
      answer: String(ans),
      choices: numChoices(ans, R, Math.max(2, Math.round(ans * 0.2)), 0),
      explain: '규칙은 ' + why + ' 예요. ' + xs[hide] + ' → ' + ans + '.'
    };
  });

  /* =====================================================================
   * 4. matrix — 3×3 도형 행렬 추리
   * ===================================================================== */
  MQ.Gen.register('matrix', {
    name: '도형 행렬', icon: '🔳', skill: 'pattern', minLv: 44, maxLv: 100
  }, function (lv, R) {
    var use = (lv >= 62 && R.chance(0.45)) ? 'num' : 'latin';
    var i, j, rows = [];

    if (use === 'num') {
      /* 각 줄: 왼쪽 + 가운데 = 오른쪽  (또는 왼쪽 × 가운데 = 오른쪽) */
      var mul = R.chance(0.4);
      var grid = [];
      for (i = 0; i < 3; i++) {
        var p = R.int(2, mul ? 9 : 40), q = R.int(2, mul ? 9 : 40);
        grid.push([p, q, mul ? p * q : p + q]);
      }
      var ansN = grid[2][2];
      for (i = 0; i < 3; i++) {
        var r = [];
        for (j = 0; j < 3; j++) r.push((i === 2 && j === 2) ? '<b>?</b>' : String(grid[i][j]));
        rows.push(r);
      }
      return {
        text: '3×3 표의 규칙을 찾아 <b>?</b>를 구하라.',
        sub: tableHTML(rows),
        answer: String(ansN),
        choices: numChoices(ansN, R, Math.max(2, Math.round(ansN * 0.2)), 0),
        explain: '각 줄에서 앞의 두 수를 ' + (mul ? '곱하면' : '더하면') + ' 마지막 수가 돼요. ' +
          grid[2][0] + (mul ? ' × ' : ' + ') + grid[2][1] + ' = ' + ansN + '.'
      };
    }

    /* 라틴방진: 각 가로줄·세로줄에 세 모양이 한 번씩 */
    var syms = R.sample(['🔺', '🔵', '⭐', '🟩', '🟣', '🔶', '❤️'], 4);
    var s3 = syms.slice(0, 3);
    var shift = R.pick([1, 2]);
    var g = [];
    for (i = 0; i < 3; i++) {
      var row = [];
      for (j = 0; j < 3; j++) row.push(s3[(j + i * shift) % 3]);
      g.push(row);
    }
    var ansS = g[2][2];
    for (i = 0; i < 3; i++) {
      var rr = [];
      for (j = 0; j < 3; j++) rr.push((i === 2 && j === 2) ? '<b>?</b>' : g[i][j]);
      rows.push(rr);
    }
    return {
      text: '가로줄·세로줄마다 세 모양이 한 번씩! <b>?</b>는?',
      sub: tableHTML(rows),
      answer: ansS,
      choices: strChoices(ansS, syms, R),
      explain: '마지막 줄에 없는 모양은 ' + ansS + ' 하나뿐이에요.'
    };
  });

  /* =====================================================================
   * 5. oddone — 다른 것 하나
   * ===================================================================== */
  MQ.Gen.register('oddone', {
    name: '다른 하나', icon: '🙅', skill: 'logic', minLv: 10, maxLv: 100
  }, function (lv, R) {
    var hint, good = [], bad, guard = 0, i;

    function pickNums(test, lo, hi, cnt) {
      var out = [], seen = {}, g = 0;
      while (out.length < cnt && g++ < 800) {
        var v = R.int(lo, hi);
        if (!test(v) || seen[v]) continue;
        seen[v] = 1; out.push(v);
      }
      return out;
    }

    var kinds = ['even', 'mul5', 'mul3'];
    if (lv >= 24) kinds.push('fruit', 'animal');
    if (lv >= 40) kinds.push('mul4', 'square');
    if (lv >= 60) kinds.push('prime', 'cube');
    var kind = R.pick(kinds);

    if (kind === 'even') {
      hint = '짝수';
      good = pickNums(function (v) { return v % 2 === 0; }, 10, 60, 3);
      bad = 2 * R.int(6, 30) + 1;
    } else if (kind === 'mul5') {
      hint = '5의 배수';
      good = pickNums(function (v) { return v % 5 === 0 && v % 2 === 1; }, 15, 95, 3);
      bad = 0;
      guard = 0;
      while (guard++ < 500) { var b1 = 2 * R.int(8, 45) + 1; if (b1 % 5 !== 0) { bad = b1; break; } }
      if (!bad) bad = 27;
    } else if (kind === 'mul3') {
      hint = '3의 배수';
      good = pickNums(function (v) { return v % 3 === 0 && v % 2 === 0; }, 12, 90, 3);
      bad = 0;
      while (guard++ < 500) { var b2 = 2 * R.int(6, 45); if (b2 % 3 !== 0) { bad = b2; break; } }
      if (!bad) bad = 20;
    } else if (kind === 'mul4') {
      hint = '4의 배수';
      good = pickNums(function (v) { return v % 4 === 0; }, 12, 96, 3);
      bad = 0;
      while (guard++ < 500) { var b3 = 2 * R.int(6, 48); if (b3 % 4 !== 0) { bad = b3; break; } }
      if (!bad) bad = 18;
    } else if (kind === 'square') {
      hint = '제곱수';
      var sq = R.sample([4, 9, 16, 25, 36, 49, 64, 81, 100], 3);
      good = sq;
      bad = 0;
      while (guard++ < 500) {
        var b4 = R.int(5, 99), rt = Math.round(Math.sqrt(b4));
        if (rt * rt !== b4) { bad = b4; break; }
      }
      if (!bad) bad = 30;
    } else if (kind === 'prime') {
      hint = '소수';
      good = R.sample([11, 13, 17, 19, 23, 29, 31, 37, 41, 43], 3);
      bad = R.pick([21, 25, 27, 33, 35, 39, 49, 51, 55, 57]);
    } else if (kind === 'cube') {
      hint = '어떤 수를 세 번 곱한 수';
      good = R.sample([8, 27, 64, 125], 3);
      bad = R.pick([12, 30, 48, 100, 90, 36]);
    } else if (kind === 'fruit') {
      hint = '과일';
      good = R.sample(['🍎', '🍌', '🍇', '🍓', '🍑', '🍊'], 3);
      bad = R.pick(['🥕', '🥦', '🌽', '🥔']);
    } else {
      hint = '다리가 넷인 동물';
      good = R.sample(['🐶', '🐱', '🐴', '🐮', '🐷', '🐯'], 3);
      bad = R.pick(['🐦', '🐧', '🐟', '🐝']);
    }

    var items = R.shuffle(good.concat([bad])).map(function (v) { return String(v); });
    var ans = String(bad);
    /* 보기 4개 = 항목 4개 (모두 서로 다름) */
    var seen = {}, ok = true;
    for (i = 0; i < items.length; i++) { if (seen[items[i]]) ok = false; seen[items[i]] = 1; }
    if (!ok || items.length !== 4) {
      /* 안전망 */
      items = ['12', '18', '24', '25'];
      ans = '25'; hint = '3의 배수';
    }

    return {
      text: '넷 중 <b>하나만</b> 성질이 달라요. 어느 것?',
      sub: '힌트: 나머지 셋은 모두 <b>' + hint + '</b>',
      answer: ans,
      choices: items,
      explain: ans + ' 만 ' + hint + '가(이) 아니에요.'
    };
  });

  /* =====================================================================
   * 6. truth — 참말·거짓말
   * ===================================================================== */
  MQ.Gen.register('truth', {
    name: '참말 거짓말', icon: '🗣️', skill: 'logic', minLv: 48, maxLv: 100
  }, function (lv, R) {
    var guard = 0;
    var nSpeak = lv >= 72 ? 4 : 3;

    while (guard++ < 300) {
      var who = R.sample(NAMES, 4);
      var st = [], i, j;
      for (i = 0; i < nSpeak; i++) {
        var t = R.pick(['notme', 'is', 'not', 'not']);
        if (t === 'notme') st.push({ t: 'notme', s: i, j: i });
        else {
          j = R.int(0, 3);
          if (j === i) j = (i + 1) % 4;
          st.push({ t: t, s: i, j: j });
        }
      }
      var K = R.pick([1, nSpeak - 1]);

      var trueCount = function (c) {
        var n = 0, k;
        for (k = 0; k < st.length; k++) {
          var s = st[k], v;
          if (s.t === 'notme') v = (c !== s.s);
          else if (s.t === 'is') v = (c === s.j);
          else v = (c !== s.j);
          if (v) n++;
        }
        return n;
      };

      var hits = [];
      for (i = 0; i < 4; i++) if (trueCount(i) === K) hits.push(i);
      if (hits.length !== 1) continue;

      var c0 = hits[0];
      var lines = [];
      for (i = 0; i < st.length; i++) {
        var s2 = st[i], msg;
        if (s2.t === 'notme') msg = '나는 안 먹었어.';
        else if (s2.t === 'is') msg = who[s2.j] + '(이)가 먹었어.';
        else msg = who[s2.j] + '(은)는 안 먹었어.';
        lines.push('<b>' + who[i] + '</b>: ' + msg);
      }

      return {
        text: '누가 케이크를 먹었을까? (' + st.length + '명 중 <b>' + K + '명만 참말</b>)',
        sub: joinList(lines) + '<br>용의자: ' + who.join(', '),
        answer: who[c0],
        choices: R.shuffle(who.slice()),
        explain: who[c0] + '(이)가 범인일 때만 참말이 정확히 ' + K + '개가 돼요.'
      };
    }

    /* 안전망(항상 유일) */
    var w = ['가온', '나래', '다온', '라온'];
    return {
      text: '누가 케이크를 먹었을까? (3명 중 <b>1명만 참말</b>)',
      sub: '<b>가온</b>: 나는 안 먹었어.<br><b>나래</b>: 가온(이)가 먹었어.<br><b>다온</b>: 나래(은)는 안 먹었어.<br>용의자: 가온, 나래, 다온, 라온',
      answer: '나래',
      choices: R.shuffle(w),
      explain: '나래가 범인이면 참말은 가온의 말 하나뿐이에요.'
    };
  });

  /* =====================================================================
   * 7. order — 순서 추리
   * ===================================================================== */
  var PERMS4 = (function () {
    var out = [], a, b, c, d;
    for (a = 0; a < 4; a++) for (b = 0; b < 4; b++) for (c = 0; c < 4; c++) for (d = 0; d < 4; d++) {
      if (a === b || a === c || a === d || b === c || b === d || c === d) continue;
      out.push([a, b, c, d]);
    }
    return out;
  })();

  MQ.Gen.register('order', {
    name: '순서 추리', icon: '📶', skill: 'logic', minLv: 30, maxLv: 100
  }, function (lv, R) {
    var THEMES = [
      { t: '달리기 시합', head: '1등부터 4등까지', word: '빠른', ask: '등' },
      { t: '키 재기', head: '큰 사람부터', word: '큰', ask: '번째로 큰 사람' },
      { t: '나이 순서', head: '나이 많은 사람부터', word: '나이 많은', ask: '번째로 나이 많은 사람' }
    ];
    var TH = R.pick(THEMES);
    var who = R.sample(NAMES, 4);
    var nClue = lv >= 60 ? 3 : 3;
    var guard = 0;

    function posOf(perm, id) { var i; for (i = 0; i < 4; i++) if (perm[i] === id) return i; return -1; }

    while (guard++ < 400) {
      var secret = R.shuffle([0, 1, 2, 3]);
      var pos = [0, 0, 0, 0], i;
      for (i = 0; i < 4; i++) pos[secret[i]] = i;

      var clues = [], used = {}, g2 = 0;
      while (clues.length < nClue && g2++ < 200) {
        var kind = R.pick(['before', 'right', 'notfirst', 'notlast', 'gap']);
        var a = R.int(0, 3), b = R.int(0, 3);
        if (a === b) continue;
        var cl = null;
        if (kind === 'before' && pos[a] < pos[b]) cl = { k: 'before', a: a, b: b };
        else if (kind === 'right' && pos[a] + 1 === pos[b]) cl = { k: 'right', a: a, b: b };
        else if (kind === 'notfirst' && pos[a] !== 0) cl = { k: 'notfirst', a: a, b: a };
        else if (kind === 'notlast' && pos[a] !== 3) cl = { k: 'notlast', a: a, b: a };
        else if (kind === 'gap' && Math.abs(pos[a] - pos[b]) === 2 && pos[a] < pos[b]) cl = { k: 'gap', a: a, b: b };
        if (!cl) continue;
        var key = cl.k + '_' + cl.a + '_' + cl.b;
        if (used[key]) continue;
        used[key] = 1; clues.push(cl);
      }
      if (clues.length < nClue) continue;

      var ok = function (perm) {
        var k, c, pa, pb;
        for (k = 0; k < clues.length; k++) {
          c = clues[k];
          pa = posOf(perm, c.a); pb = posOf(perm, c.b);
          if (c.k === 'before' && !(pa < pb)) return false;
          if (c.k === 'right' && !(pa + 1 === pb)) return false;
          if (c.k === 'notfirst' && pa === 0) return false;
          if (c.k === 'notlast' && pa === 3) return false;
          if (c.k === 'gap' && !(pb - pa === 2)) return false;
        }
        return true;
      };

      var hits = [], p;
      for (i = 0; i < PERMS4.length; i++) if (ok(PERMS4[i])) hits.push(PERMS4[i]);
      if (hits.length !== 1) continue;

      var lines = [];
      for (i = 0; i < clues.length; i++) {
        var c2 = clues[i], A = who[c2.a], B = who[c2.b], s;
        if (c2.k === 'before') s = A + '(은)는 ' + B + '보다 ' + TH.word + ' 쪽이에요.';
        else if (c2.k === 'right') s = A + ' 바로 다음이 ' + B + '예요.';
        else if (c2.k === 'notfirst') s = A + '(은)는 첫 번째가 아니에요.';
        else if (c2.k === 'notlast') s = A + '(은)는 마지막이 아니에요.';
        else s = A + '와(과) ' + B + ' 사이에 한 명이 있어요. (' + A + '가 더 ' + TH.word + ' 쪽)';
        lines.push('· ' + s);
      }

      var askIdx = R.int(0, 3);
      var ansName = who[secret[askIdx]];
      var order = [];
      for (i = 0; i < 4; i++) order.push(who[secret[i]]);

      return {
        text: TH.t + '! ' + TH.head + ' 줄 세울 때 <b>' + (askIdx + 1) + '번째</b>는 누구?',
        sub: joinList(lines),
        answer: ansName,
        choices: R.shuffle(who.slice()),
        explain: '조건을 모두 만족하는 순서는 ' + order.join(' → ') + ' 하나뿐이에요.'
      };
    }

    /* 안전망: 완전한 순서를 주는 3개 조건 */
    var w2 = R.sample(NAMES, 4);
    return {
      text: '달리기 시합! 1등은 누구?',
      sub: '· ' + w2[0] + '(은)는 ' + w2[1] + '보다 빨라요.<br>· ' + w2[1] + '(은)는 ' + w2[2] + '보다 빨라요.<br>· ' + w2[2] + '(은)는 ' + w2[3] + '보다 빨라요.',
      answer: w2[0],
      choices: R.shuffle(w2.slice()),
      explain: '순서는 ' + w2.join(' → ') + ' 이므로 1등은 ' + w2[0] + '예요.'
    };
  });

  /* =====================================================================
   * 8. cipher — 암호
   * ===================================================================== */
  var AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var WORDS = ['CAT', 'DOG', 'SUN', 'BOX', 'CAP', 'MAP', 'PEN', 'HAT', 'CUP', 'BAG', 'FOX', 'JAM'];

  function shiftWord(w, k) {
    var out = '', i, p;
    for (i = 0; i < w.length; i++) {
      p = AL.indexOf(w.charAt(i));
      out += AL.charAt(((p + k) % 26 + 26) % 26);
    }
    return out;
  }

  MQ.Gen.register('cipher', {
    name: '암호 풀기', icon: '🔐', skill: 'logic', minLv: 36, maxLv: 100
  }, function (lv, R) {
    var mode;
    if (lv < 50) mode = R.pick(['num', 'caesar']);
    else if (lv < 70) mode = R.pick(['caesar', 'num', 'decode']);
    else mode = R.pick(['caesar', 'decode', 'sumcode']);

    if (mode === 'num') {
      /* A=1, B=2 ... 로 바꾸기 */
      var w = R.pick(WORDS);
      var code = '', i;
      for (i = 0; i < w.length; i++) code += String(AL.indexOf(w.charAt(i)) + 1);
      var cands = [], j;
      for (j = 0; j < WORDS.length; j++) {
        var o = '', k;
        for (k = 0; k < WORDS[j].length; k++) o += String(AL.indexOf(WORDS[j].charAt(k)) + 1);
        if (o !== code) cands.push(o);
      }
      return {
        text: 'A=1, B=2, C=3 … 규칙이면 <b>' + w + '</b> = ?',
        sub: '',
        answer: code,
        choices: strChoices(code, cands, R),
        explain: w.split('').map(function (ch) { return ch + '=' + (AL.indexOf(ch) + 1); }).join(', ') + ' 이므로 ' + code + '예요.'
      };
    }

    if (mode === 'sumcode') {
      /* 글자값을 모두 더하기 */
      var w2 = R.pick(WORDS), sum = 0, i2;
      for (i2 = 0; i2 < w2.length; i2++) sum += AL.indexOf(w2.charAt(i2)) + 1;
      return {
        text: 'A=1, B=2 … 일 때 <b>' + w2 + '</b>의 글자값을 모두 더하면?',
        sub: '',
        answer: String(sum),
        choices: numChoices(sum, R, 6, 1),
        explain: w2.split('').map(function (ch) { return String(AL.indexOf(ch) + 1); }).join(' + ') + ' = ' + sum + '.'
      };
    }

    var kk = lv < 55 ? R.int(1, 3) : R.int(2, 6);
    var word = R.pick(WORDS);
    var enc = shiftWord(word, kk);

    if (mode === 'decode') {
      var cands2 = [], m;
      for (m = 0; m < WORDS.length; m++) if (WORDS[m] !== word) cands2.push(WORDS[m]);
      return {
        text: '글자를 <b>' + kk + '칸 뒤로</b> 민 암호예요. <b>' + enc + '</b>의 원래 말은?',
        sub: 'A→' + AL.charAt(kk) + ', B→' + AL.charAt(kk + 1),
        answer: word,
        choices: strChoices(word, cands2, R),
        explain: enc + '의 각 글자를 ' + kk + '칸 앞으로 되돌리면 ' + word + '예요.'
      };
    }

    var cands3 = [], q;
    for (q = 1; q <= 8; q++) if (q !== kk) cands3.push(shiftWord(word, q));
    cands3.push(shiftWord(word, -kk));
    return {
      text: '글자를 <b>' + kk + '칸 뒤로</b> 밀어라. <b>' + word + '</b> → ?',
      sub: 'A→' + AL.charAt(kk) + ', B→' + AL.charAt(kk + 1) + ' 처럼요.',
      answer: enc,
      choices: strChoices(enc, cands3, R),
      explain: word.split('').map(function (ch) { return ch + '→' + shiftWord(ch, kk); }).join(', ') + ' 이므로 ' + enc + '예요.'
    };
  });

  /* =====================================================================
   * 9. weigh — 저울 균형
   * ===================================================================== */
  MQ.Gen.register('weigh', {
    name: '저울 균형', icon: '⚖️', skill: 'logic', minLv: 40, maxLv: 100
  }, function (lv, R) {
    var set = R.pick([
      ['🍎', '🍌', '🍈'], ['⭐', '🔵', '🔺'], ['🍓', '🍊', '🍉'], ['🐤', '🐰', '🐻']
    ]);
    var A = set[0], B = set[1], C = set[2];

    var b = R.int(2, lv < 60 ? 3 : 4);   /* B 1개 = A b개 */
    var c = R.int(2, lv < 60 ? 2 : 3);   /* C 1개 = B c개 */

    if (lv >= 70 && R.chance(0.5)) {
      /* 3단계: C 1개 = A (b*c)개, 물으면 C k개 */
      var k = R.int(2, 3);
      var ans3 = b * c * k;
      return {
        text: rep(A, b) + ' = ' + B + ' , ' + rep(B, c) + ' = ' + C + ' 일 때 ' + rep(C, k) + ' = ' + A + ' 몇 개?',
        sub: '같은 그림은 무게가 같아요.',
        answer: String(ans3),
        choices: numChoices(ans3, R, Math.max(2, Math.round(ans3 * 0.3)), 1),
        explain: C + ' 1개 = ' + B + ' ' + c + '개 = ' + A + ' ' + (b * c) + '개. ' + k + '개면 ' + ans3 + '개예요.'
      };
    }

    var ans = b * c;
    return {
      text: rep(A, b) + ' = ' + B + ' , ' + rep(B, c) + ' = ' + C + ' 일 때 ' + C + ' = ' + A + ' 몇 개?',
      sub: '같은 그림은 무게가 같아요.',
      answer: String(ans),
      choices: numChoices(ans, R, Math.max(2, Math.round(ans * 0.4)), 1),
      explain: C + ' 1개는 ' + B + ' ' + c + '개, ' + B + ' 1개는 ' + A + ' ' + b + '개니까 ' + b + '×' + c + '=' + ans + '개예요.'
    };
  });

  /* =====================================================================
   * 10. river — 강 건너기(최소 횟수)
   * ===================================================================== */
  MQ.Gen.register('river', {
    name: '강 건너기', icon: '🛶', skill: 'logic', minLv: 58, maxLv: 100
  }, function (lv, R) {
    var kind = R.pick(['classic', 'boat2', 'boat2']);

    if (kind === 'classic') {
      var trio = R.pick([
        ['🐺 늑대', '🐐 염소', '🥬 배추'],
        ['🦊 여우', '🐤 오리', '🌽 옥수수'],
        ['🐱 고양이', '🐭 쥐', '🧀 치즈']
      ]);
      var ans = 7;
      return {
        text: trio[0] + '·' + trio[1] + '·' + trio[2] + '를 배로 옮겨요. 배는 몇 번 건너야 할까?',
        sub: '배엔 나와 <b>하나만</b> 탈 수 있어요. ' + trio[0] + '+' + trio[1] + ', ' + trio[1] + '+' + trio[2] + '는 같이 두면 안 돼요. (돌아오는 것도 1번)',
        answer: '7',
        choices: MQ.uniq4('7', ['5', '6', '8', '9'], R),
        explain: '염소를 먼저 옮기고 되돌아오는 식으로 하면 최소 ' + ans + '번이에요.'
      };
    }

    var n = R.int(3, lv < 75 ? 4 : 6);
    var ans2 = 2 * n - 3;
    var who = R.pick(['모험가', '요정', '고블린', '용사']);
    return {
      text: who + ' ' + n + '명이 강을 건너요. 배는 최소 몇 번 움직일까?',
      sub: '배엔 <b>2명까지</b> 탈 수 있고, 배를 돌려보내려면 한 명이 다시 타고 와야 해요. (가는 것도 오는 것도 1번)',
      answer: String(ans2),
      choices: MQ.uniq4(String(ans2), [String(ans2 - 1), String(ans2 + 1), String(ans2 + 2), String(2 * n), String(n)], R),
      explain: '2명이 건너고 1명이 돌아오기를 반복해요. ' + n + '명이면 2×' + n + '−3 = ' + ans2 + '번이에요.'
    };
  });

  /* =====================================================================
   * 11. path — 최단거리 경로 수
   * ===================================================================== */
  MQ.Gen.register('path', {
    name: '길 찾기', icon: '🗺️', skill: 'pattern', minLv: 52, maxLv: 100
  }, function (lv, R) {
    var w, h;
    if (lv < 62) { w = R.int(2, 3); h = R.int(2, 3); }
    else if (lv < 78) { w = R.int(3, 4); h = R.int(2, 3); }
    else { w = R.int(3, 4); h = R.int(3, 4); }

    var block = null;
    if (lv >= 70 && R.chance(0.5) && w >= 2 && h >= 2) {
      block = { x: R.int(1, w - 1), y: R.int(1, h - 1) };
    }

    /* dp */
    var dp = [], x, y;
    for (y = 0; y <= h; y++) { dp.push([]); for (x = 0; x <= w; x++) dp[y].push(0); }
    dp[0][0] = 1;
    for (y = 0; y <= h; y++) {
      for (x = 0; x <= w; x++) {
        if (x === 0 && y === 0) continue;
        if (block && block.x === x && block.y === y) { dp[y][x] = 0; continue; }
        var v = 0;
        if (x > 0) v += dp[y][x - 1];
        if (y > 0) v += dp[y - 1][x];
        dp[y][x] = v;
      }
    }
    var ans = dp[h][w];
    if (ans < 2) { block = null; ans = dp[h][w] = 0; /* 재계산 */
      for (y = 0; y <= h; y++) for (x = 0; x <= w; x++) dp[y][x] = 0;
      dp[0][0] = 1;
      for (y = 0; y <= h; y++) for (x = 0; x <= w; x++) {
        if (x === 0 && y === 0) continue;
        var v2 = 0;
        if (x > 0) v2 += dp[y][x - 1];
        if (y > 0) v2 += dp[y - 1][x];
        dp[y][x] = v2;
      }
      ans = dp[h][w];
    }

    /* SVG */
    var cell = 30, ox = 16, oy = 16;
    var W = ox * 2 + w * cell, H = oy * 2 + h * cell;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
    var i;
    for (i = 0; i <= w; i++) {
      svg += '<line x1="' + (ox + i * cell) + '" y1="' + oy + '" x2="' + (ox + i * cell) + '" y2="' + (oy + h * cell) +
        '" style="stroke:#4cc9f0;stroke-width:2;opacity:.7"/>';
    }
    for (i = 0; i <= h; i++) {
      svg += '<line x1="' + ox + '" y1="' + (oy + i * cell) + '" x2="' + (ox + w * cell) + '" y2="' + (oy + i * cell) +
        '" style="stroke:#4cc9f0;stroke-width:2;opacity:.7"/>';
    }
    svg += '<circle cx="' + ox + '" cy="' + oy + '" r="5" fill="#7bd88f"/>';
    svg += '<circle cx="' + (ox + w * cell) + '" cy="' + (oy + h * cell) + '" r="5" fill="#f72585"/>';
    if (block) {
      svg += '<text x="' + (ox + block.x * cell) + '" y="' + (oy + block.y * cell + 5) + '" font-size="14" fill="#f72585" text-anchor="middle">✖</text>';
    }
    svg += '</svg>';

    return {
      text: '🟢에서 🔴까지 <b>오른쪽·아래로만</b> 갈 때 길은 몇 가지?' + (block ? ' (✖는 못 지나감)' : ''),
      sub: '',
      svg: svg,
      answer: String(ans),
      choices: numChoices(ans, R, Math.max(2, Math.round(ans * 0.35)), 1),
      explain: '각 점까지의 길 수를 더해 나가면 마지막 점은 ' + ans + '가지예요.'
    };
  });

  /* =====================================================================
   * 12. maze — 미로 최단 칸수
   * ===================================================================== */
  MQ.Gen.register('maze', {
    name: '미로', icon: '🌀', skill: 'pattern', minLv: 38, maxLv: 100
  }, function (lv, R) {
    var n = lv < 56 ? 4 : (lv < 78 ? 5 : 5);
    var attempt = 0, best = null;

    while (attempt++ < 60) {
      /* 벽 배열: vw[y][x] = (x,y)와 (x+1,y) 사이 벽, hw[y][x] = (x,y)와 (x,y+1) 사이 벽 */
      var vw = [], hw = [], y, x;
      for (y = 0; y < n; y++) {
        vw.push([]); hw.push([]);
        for (x = 0; x < n; x++) { vw[y].push(true); hw[y].push(true); }
      }
      var vis = [];
      for (y = 0; y < n; y++) { vis.push([]); for (x = 0; x < n; x++) vis[y].push(false); }

      /* 랜덤 DFS 로 완전미로 만들기 */
      var stack = [[0, 0]];
      vis[0][0] = true;
      while (stack.length) {
        var cur = stack[stack.length - 1], cx = cur[0], cy = cur[1];
        var nb = [];
        if (cx > 0 && !vis[cy][cx - 1]) nb.push([cx - 1, cy, 'L']);
        if (cx < n - 1 && !vis[cy][cx + 1]) nb.push([cx + 1, cy, 'R']);
        if (cy > 0 && !vis[cy - 1][cx]) nb.push([cx, cy - 1, 'U']);
        if (cy < n - 1 && !vis[cy + 1][cx]) nb.push([cx, cy + 1, 'D']);
        if (!nb.length) { stack.pop(); continue; }
        var pick = R.pick(nb);
        if (pick[2] === 'L') vw[cy][cx - 1] = false;
        if (pick[2] === 'R') vw[cy][cx] = false;
        if (pick[2] === 'U') hw[cy - 1][cx] = false;
        if (pick[2] === 'D') hw[cy][cx] = false;
        vis[pick[1]][pick[0]] = true;
        stack.push([pick[0], pick[1]]);
      }

      /* BFS */
      var dist = [];
      for (y = 0; y < n; y++) { dist.push([]); for (x = 0; x < n; x++) dist[y].push(-1); }
      dist[0][0] = 0;
      var q = [[0, 0]], qi = 0;
      while (qi < q.length) {
        var p = q[qi++], px = p[0], py = p[1], d = dist[py][px];
        if (px > 0 && !vw[py][px - 1] && dist[py][px - 1] < 0) { dist[py][px - 1] = d + 1; q.push([px - 1, py]); }
        if (px < n - 1 && !vw[py][px] && dist[py][px + 1] < 0) { dist[py][px + 1] = d + 1; q.push([px + 1, py]); }
        if (py > 0 && !hw[py - 1][px] && dist[py - 1][px] < 0) { dist[py - 1][px] = d + 1; q.push([px, py - 1]); }
        if (py < n - 1 && !hw[py][px] && dist[py + 1][px] < 0) { dist[py + 1][px] = d + 1; q.push([px, py + 1]); }
      }

      var gd = dist[n - 1][n - 1];
      if (gd < n) continue;             /* 너무 쉬우면 다시 */
      best = { vw: vw, hw: hw, d: gd };
      break;
    }

    if (!best) {
      /* 안전망: 벽 없는 격자 */
      var vw0 = [], hw0 = [], yy, xx;
      for (yy = 0; yy < n; yy++) {
        vw0.push([]); hw0.push([]);
        for (xx = 0; xx < n; xx++) { vw0[yy].push(xx === n - 1); hw0[yy].push(yy === n - 1); }
      }
      best = { vw: vw0, hw: hw0, d: 2 * (n - 1) };
    }

    /* SVG */
    var cs = 26, m = 10;
    var SZ = m * 2 + n * cs;
    var svg = '<svg viewBox="0 0 ' + SZ + ' ' + SZ + '">';
    var ST = 'style="stroke:#4cc9f0;stroke-width:3;stroke-linecap:round"';
    /* 바깥 테두리 */
    svg += '<line x1="' + m + '" y1="' + m + '" x2="' + (m + n * cs) + '" y2="' + m + '" ' + ST + '/>';
    svg += '<line x1="' + m + '" y1="' + (m + n * cs) + '" x2="' + (m + n * cs) + '" y2="' + (m + n * cs) + '" ' + ST + '/>';
    svg += '<line x1="' + m + '" y1="' + m + '" x2="' + m + '" y2="' + (m + n * cs) + '" ' + ST + '/>';
    svg += '<line x1="' + (m + n * cs) + '" y1="' + m + '" x2="' + (m + n * cs) + '" y2="' + (m + n * cs) + '" ' + ST + '/>';
    var yy2, xx2;
    for (yy2 = 0; yy2 < n; yy2++) {
      for (xx2 = 0; xx2 < n; xx2++) {
        if (xx2 < n - 1 && best.vw[yy2][xx2]) {
          svg += '<line x1="' + (m + (xx2 + 1) * cs) + '" y1="' + (m + yy2 * cs) + '" x2="' + (m + (xx2 + 1) * cs) + '" y2="' + (m + (yy2 + 1) * cs) + '" ' + ST + '/>';
        }
        if (yy2 < n - 1 && best.hw[yy2][xx2]) {
          svg += '<line x1="' + (m + xx2 * cs) + '" y1="' + (m + (yy2 + 1) * cs) + '" x2="' + (m + (xx2 + 1) * cs) + '" y2="' + (m + (yy2 + 1) * cs) + '" ' + ST + '/>';
        }
      }
    }
    svg += '<text x="' + (m + cs / 2) + '" y="' + (m + cs / 2 + 5) + '" font-size="14" fill="#7bd88f" text-anchor="middle">●</text>';
    svg += '<text x="' + (m + (n - 0.5) * cs) + '" y="' + (m + (n - 0.5) * cs + 5) + '" font-size="14" fill="#f72585" text-anchor="middle">★</text>';
    svg += '</svg>';

    var ansM = best.d;
    return {
      text: '미로에서 ●에서 ★까지 <b>최소 몇 칸</b> 움직일까? (위·아래·왼·오른쪽만)',
      sub: '',
      svg: svg,
      answer: String(ansM),
      choices: numChoices(ansM, R, Math.max(2, Math.round(ansM * 0.4)), 1),
      explain: '벽을 피해 가장 짧게 가면 ' + ansM + '칸이에요.'
    };
  });

  /* =====================================================================
   * 13. match — 성냥개비
   * ===================================================================== */
  /* (틀린식 a+b=c) → (성냥 1개 옮겨 만든 참인 식)
   * 검증된 변형만 사용: 5→9, 6→8, 3→9, 1→7, 4→9, 9→8 (+ 스틱 1개),
   * 그리고 3↔5 (같은 자리에서 옮기기). 부호 +→- 는 세로 막대를 떼어 씀. */
  var MATCH_PLUS = [
    { from: 5, to: 9 }, { from: 6, to: 8 }, { from: 3, to: 9 },
    { from: 1, to: 7 }, { from: 4, to: 9 }, { from: 9, to: 8 }
  ];

  MQ.Gen.register('match', {
    name: '성냥개비', icon: '🔥', skill: 'logic', minLv: 60, maxLv: 100
  }, function (lv, R) {
    var guard = 0, a, b, c, fixed, wrongEq, rightEq, why;

    if (R.chance(0.35)) {
      /* 3 ↔ 5 자리 옮기기 (부호 그대로 +) */
      var swap = R.chance(0.5) ? { f: 3, t: 5 } : { f: 5, t: 3 };
      guard = 0;
      while (guard++ < 200) {
        b = R.int(1, 9);
        c = swap.t + b;
        if (c > 9) continue;
        if (swap.f + b === c) continue;   /* 원래 식이 이미 맞으면 안 됨 */
        wrongEq = swap.f + ' + ' + b + ' = ' + c;
        rightEq = swap.t + ' + ' + b + ' = ' + c;
        why = swap.f + '의 성냥 1개를 옮기면 ' + swap.t + '이(가) 돼요.';
        break;
      }
      if (!rightEq) { wrongEq = '3 + 3 = 8'; rightEq = '5 + 3 = 8'; why = '3의 성냥 1개를 옮기면 5가 돼요.'; }
    } else {
      /* + 의 세로 막대를 떼어 앞 숫자에 붙이기 (+ → −) */
      guard = 0;
      while (guard++ < 200) {
        var pr = R.pick(MATCH_PLUS);
        a = pr.from; fixed = pr.to;
        b = R.int(1, 9);
        c = fixed - b;
        if (c < 0 || c > 9) continue;
        if (a + b === c) continue;        /* 원래 식이 맞으면 안 됨 */
        wrongEq = a + ' + ' + b + ' = ' + c;
        rightEq = fixed + ' − ' + b + ' = ' + c;
        why = '＋에서 세로 막대 1개를 빼서 ' + a + '에 붙이면 ' + fixed + ' − 가 돼요.';
        break;
      }
      if (!rightEq) { wrongEq = '5 + 7 = 2'; rightEq = '9 − 7 = 2'; why = '＋의 세로 막대를 5에 붙이면 9 − 가 돼요.'; }
    }

    /* 오답: 계산이 틀린 식들 */
    var wrongs = [], g2 = 0;
    var parts = rightEq.split(' ');
    var lhs = parseInt(parts[0], 10), op = parts[1], rhs = parseInt(parts[2], 10), res = parseInt(parts[4], 10);
    while (wrongs.length < 6 && g2++ < 400) {
      var na = lhs + R.int(-2, 2), nb = rhs + R.int(-2, 2), nc = res + R.int(-2, 2);
      var nop = R.chance(0.5) ? '+' : '−';
      if (na < 0 || na > 9 || nb < 0 || nb > 9 || nc < 0 || nc > 9) continue;
      var val = nop === '+' ? na + nb : na - nb;
      if (val === nc) continue;           /* 맞는 식이면 오답으로 못 씀 */
      var s = na + ' ' + nop + ' ' + nb + ' = ' + nc;
      if (s === rightEq || s === wrongEq) continue;
      wrongs.push(s);
    }
    wrongs.push('0 + 0 = 1'); wrongs.push('1 + 1 = 3'); wrongs.push('2 + 2 = 5');

    return {
      text: '성냥개비 <b>1개만</b> 옮겨서 맞는 식으로! <b>' + wrongEq + '</b>',
      sub: '어떤 식이 될까요?',
      answer: rightEq,
      choices: strChoices(rightEq, wrongs, R),
      explain: why + ' 그래서 ' + rightEq + ' 가 돼요.'
    };
  });

  /* =====================================================================
   * 14. iq — 숨은 연산 찾기
   * ===================================================================== */
  MQ.Gen.register('iq', {
    name: '숨은 규칙', icon: '💡', skill: 'logic', minLv: 54, maxLv: 100
  }, function (lv, R) {
    var RULES = [
      { f: function (a, b) { return a * b + a; }, s: '(a×b)+a' },
      { f: function (a, b) { return a * b + b; }, s: '(a×b)+b' },
      { f: function (a, b) { return a * b - a; }, s: '(a×b)−a' },
      { f: function (a, b) { return (a + b) * 2; }, s: '(a+b)×2' },
      { f: function (a, b) { return a * a + b; }, s: '(a×a)+b' },
      { f: function (a, b) { return a * b + a + b; }, s: '(a×b)+a+b' },
      { f: function (a, b) { return a * 3 + b * 2; }, s: '(a×3)+(b×2)' }
    ];
    if (lv >= 72) {
      RULES.push({ f: function (a, b) { return a * a - b; }, s: '(a×a)−b' });
      RULES.push({ f: function (a, b) { return (a + b) * (a + b); }, s: '(a+b)×(a+b)' });
    }
    var rule = R.pick(RULES);
    var sym = R.pick(['⭐', '❤️', '🔷', '♠️', '☂']);
    var nEx = lv >= 70 ? 3 : 2;

    var pairs = [], seen = {}, guard = 0;
    while (pairs.length < nEx + 1 && guard++ < 500) {
      var a = R.int(2, lv < 70 ? 7 : 9), b = R.int(1, lv < 70 ? 7 : 9);
      var key = a + '_' + b;
      if (seen[key]) continue;
      var v = rule.f(a, b);
      if (v < 1 || v > 200) continue;
      seen[key] = 1;
      pairs.push([a, b, v]);
    }
    if (pairs.length < nEx + 1) {
      pairs = [[3, 4, rule.f(3, 4)], [5, 2, rule.f(5, 2)], [6, 3, rule.f(6, 3)], [4, 5, rule.f(4, 5)]].slice(0, nEx + 1);
    }

    var ex = [], i;
    for (i = 0; i < nEx; i++) ex.push(pairs[i][0] + ' ' + sym + ' ' + pairs[i][1] + ' = ' + pairs[i][2]);
    var q = pairs[nEx];
    var ans = q[2];

    return {
      text: ex.join(' , ') + ' 일 때 <b>' + q[0] + ' ' + sym + ' ' + q[1] + ' = ?</b>',
      sub: sym + ' 안에 숨은 규칙을 찾아라!',
      answer: String(ans),
      choices: numChoices(ans, R, Math.max(3, Math.round(ans * 0.25)), 0),
      explain: '규칙은 a ' + sym + ' b = ' + rule.s + ' 예요. 그래서 ' + ans + '.'
    };
  });

})();
