/* =====================================================================
 * arith.js — 연산(calc) 문제 생성기 모음
 * 계약: js/gen/_CONTRACT.md
 * ===================================================================== */
(function () {
  'use strict';

  var MQ = window.MQ = window.MQ || {};
  var G = MQ.Gen;

  /* ================= 공통 도우미 ================= */

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function lcm(a, b) { return a / gcd(a, b) * b; }

  /* 조사 붙이기 (숫자를 한국어로 읽었을 때의 받침 기준) */
  var JONG = [1, 1, 0, 1, 0, 0, 1, 1, 1, 0]; /* 영일이삼사오육칠팔구 */
  function lastDigit(x) {
    var s = String(x);
    var m = /^(-?\d+)\/(\d+)$/.exec(s);
    if (m) s = m[1];                       /* 분수는 분자를 나중에 읽는다 */
    var mm = s.match(/(\d)(?!.*\d)/);
    return mm ? Number(mm[1]) : 0;
  }
  function jong(x) { return JONG[lastDigit(x)] === 1; }
  function EUL(x) { return x + (jong(x) ? '을' : '를'); }
  function EUN(x) { return x + (jong(x) ? '은' : '는'); }
  function IGA(x) { return x + (jong(x) ? '이' : '가'); }
  function IYO(x) { return x + (jong(x) ? '이에요' : '예요'); }
  function GWA(x) { return x + (jong(x) ? '과' : '와'); }
  function EURO(x) { var d = lastDigit(x); return x + (d === 0 || d === 3 || d === 6 ? '으로' : '로'); }

  /* 받아올림을 빼먹은 덧셈 (그럴듯한 실수) */
  function noCarryAdd(a, b) {
    var r = 0, p = 1;
    while (a > 0 || b > 0) {
      r += ((a % 10) + (b % 10)) % 10 * p;
      p *= 10; a = Math.floor(a / 10); b = Math.floor(b / 10);
    }
    return r;
  }
  /* 받아내림을 빼먹은 뺄셈 */
  function noBorrowSub(a, b) {
    var r = 0, p = 1;
    while (a > 0 || b > 0) {
      r += Math.abs((a % 10) - (b % 10)) * p;
      p *= 10; a = Math.floor(a / 10); b = Math.floor(b / 10);
    }
    return r;
  }

  /* 보기 4개 만들기
   * ans    : 정답 문자열
   * good   : 그럴듯한 오답 후보 (먼저 쓰인다)
   * filler : 모자랄 때 채울 후보
   * valf   : 값 비교 함수. 주면 "값이 같은 보기"를 걸러낸다. */
  function build4(ans, good, filler, R, valf) {
    var out = [String(ans)];
    var vals = [valf ? valf(String(ans)) : String(ans)];
    var i, j;
    function add(x) {
      if (x === null || x === undefined) return;
      var s = String(x);
      if (s === '' || s === 'undefined' || s === 'NaN' || s.indexOf('Infinity') >= 0) return;
      for (j = 0; j < out.length; j++) if (out[j] === s) return;
      var v = valf ? valf(s) : s;
      if (valf) { for (j = 0; j < vals.length; j++) if (vals[j] === v) return; }
      out.push(s); vals.push(v);
    }
    var g = R.shuffle(good || []);
    for (i = 0; i < g.length && out.length < 4; i++) add(g[i]);
    var f = R.shuffle(filler || []);
    for (i = 0; i < f.length && out.length < 4; i++) add(f[i]);
    var k = 1;
    while (out.length < 4 && k < 400) { add(String(Number(ans) + k * 7)); k++; }
    k = 1;
    while (out.length < 4) { out.push('보기' + k); k++; }
    return out;
  }

  /* 정답 근처 숫자들 (채우기용) */
  function numFill(ans, min) {
    var out = [], k;
    for (k = 1; k <= 14; k++) {
      out.push(ans + k);
      if (min == null || ans - k >= min) out.push(ans - k);
    }
    return out;
  }

  /* 숫자 정답용 보기 (min 보다 작은 오답은 버린다) */
  function pick4(ans, good, R, min) {
    var ok = [], i, v;
    for (i = 0; i < good.length; i++) {
      v = good[i];
      if (v === null || v === undefined) continue;
      if (typeof v === 'number' && (!isFinite(v) || Math.round(v) !== v)) continue;
      if (min != null && v < min) continue;
      ok.push(v);
    }
    return build4(String(ans), ok, numFill(ans, min), R);
  }

  /* 분수 문자열 */
  function fr(n, d) {
    if (d === 0) d = 1;
    var g = gcd(n, d);
    n = n / g; d = d / g;
    if (d === 1) return String(n);
    return n + '/' + d;
  }
  function fval(s) {
    var m = /^(-?\d+)\/(\d+)$/.exec(String(s));
    if (m) return Number(m[1]) / Number(m[2]);
    return Number(s);
  }
  function fracFill(n, d) {
    var out = [], i;
    for (i = 1; i <= 5; i++) {
      out.push(fr(n + i, d));
      if (n - i > 0) out.push(fr(n - i, d));
      out.push(fr(n, d + i));
      if (d - i > 1 && d - i > n) out.push(fr(n, d - i));
    }
    return out;
  }

  /* 소수 표기: 뒤의 0 제거 ('3.70' → '3.7', '4.0' → '4') */
  function fd(x, dec) {
    var s = (Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec)).toFixed(dec);
    if (s.indexOf('.') >= 0) { s = s.replace(/0+$/, ''); s = s.replace(/\.$/, ''); }
    if (s === '-0') s = '0';
    return s;
  }
  function decFill(ans, dec, R) {
    var out = [], k;
    for (k = 1; k <= 12; k++) {
      out.push(fd(ans + k / Math.pow(10, dec), dec + 1));
      if (ans - k / Math.pow(10, dec) > 0) out.push(fd(ans - k / Math.pow(10, dec), dec + 1));
    }
    return out;
  }

  /* 약분이 필요하면 한마디 덧붙인다 */
  function redNote(n, d, ans) {
    if (ans === n + '/' + d) return ' 해서 ' + IYO(ans) + '.';
    return ' → ' + n + '/' + d + ', 약분하면 ' + IYO(ans) + '.';
  }

  function degWord(n) { return n < 0 ? ('영하 ' + (-n) + '도') : (n + '도'); }
  function floorWord(n) { return n < 0 ? ('지하 ' + (-n) + '층') : (n + '층'); }

  /* ================= 1. 덧셈 ================= */
  G.register('add', { name: '덧셈', icon: '➕', skill: 'calc', minLv: 1, maxLv: 100 }, function (lv, R) {
    var a, b, c = 0, three = false;
    if (lv <= 4) { a = R.int(2, 9); b = R.int(2, 9); }
    else if (lv <= 10) { a = R.int(11, 49); b = R.int(2, 9); }
    else if (lv <= 18) { a = R.int(12, 49); b = R.int(11, 49); }
    else if (lv <= 25) { a = R.int(15, 89); b = R.int(12, 89); }
    else if (lv <= 35) { a = R.int(105, 499); b = R.int(12, 99); }
    else if (lv <= 45) { a = R.int(105, 499); b = R.int(105, 499); }
    else if (lv <= 58) { a = R.int(115, 899); b = R.int(115, 899); }
    else if (lv <= 70) { a = R.int(15, 89); b = R.int(15, 89); c = R.int(15, 89); three = true; }
    else if (lv <= 84) { a = R.int(1105, 4999); b = R.int(115, 999); }
    else { a = R.int(115, 899); b = R.int(115, 899); c = R.int(15, 99); three = true; }

    var ans = a + b + c;
    var text, good;
    if (three) {
      text = a + ' + ' + b + ' + ' + c + ' = ?';
      good = [a + b, b + c, ans + 10, ans - 10, ans + 1, noCarryAdd(a + b, c)];
      return {
        text: text,
        answer: String(ans),
        choices: pick4(ans, good, R, 1),
        explain: GWA(a) + ' ' + EUL(b) + ' 더한 다음 ' + EUL(c) + ' 더하면 ' + IYO(ans) + '.'
      };
    }
    if (lv <= 12 && R.chance(0.35)) text = '슬라임이 사과 ' + a + '개를 훔쳤어요. ' + b + '개를 더 훔치면 모두 몇 개?';
    else text = a + ' + ' + b + ' = ?';
    good = [noCarryAdd(a, b), ans + 10, ans - 10, ans + 1, ans - 1, a - b];
    return {
      text: text,
      answer: String(ans),
      choices: pick4(ans, good, R, 1),
      explain: a + '에 ' + EUL(b) + ' 더하면 ' + IYO(ans) + '. 받아올림 빠뜨리지 않기!'
    };
  });

  /* ================= 2. 뺄셈 ================= */
  G.register('sub', { name: '뺄셈', icon: '➖', skill: 'calc', minLv: 1, maxLv: 100 }, function (lv, R) {
    var a, b;
    if (lv <= 4) { a = R.int(5, 18); b = R.int(1, a - 1); }
    else if (lv <= 10) { a = R.int(21, 59); b = R.int(2, 9); }
    else if (lv <= 18) { a = R.int(25, 89); b = R.int(11, 24); }
    else if (lv <= 25) { a = R.int(41, 99); b = R.int(12, 39); }
    else if (lv <= 35) { a = R.int(120, 499); b = R.int(15, 99); }
    else if (lv <= 45) { a = R.int(210, 899); b = R.int(105, 199); }
    else if (lv <= 58) { a = R.int(310, 899); b = R.int(115, 299); }
    else if (lv <= 70) { a = R.int(1005, 4999); b = R.int(115, 899); }
    else if (lv <= 84) { a = R.int(2005, 8999); b = R.int(1005, 1999); }
    else { a = R.int(3005, 9899); b = R.int(1105, 2999); }

    var ans = a - b;
    var text;
    if (lv <= 12 && R.chance(0.35)) text = '골드 ' + a + '개가 있었는데 ' + b + '개를 썼어요. 남은 골드는?';
    else text = a + ' − ' + b + ' = ?';

    var good = [noBorrowSub(a, b), ans + 10, ans - 10, ans + 1, ans - 1, a + b];
    return {
      text: text,
      answer: String(ans),
      choices: pick4(ans, good, R, 0),
      explain: a + '에서 ' + EUL(b) + ' 빼면 ' + IYO(ans) + '. 받아내림 조심!'
    };
  });

  /* ================= 3. 곱셈 ================= */
  G.register('mul', { name: '곱셈', icon: '✖️', skill: 'calc', minLv: 5, maxLv: 100 }, function (lv, R) {
    var a, b;
    if (lv <= 12) { a = R.int(2, 9); b = R.int(2, 9); }
    else if (lv <= 20) { a = R.int(11, 29); b = R.int(2, 9); }
    else if (lv <= 30) { a = R.int(12, 49); b = R.int(3, 9); }
    else if (lv <= 45) { a = R.int(13, 99); b = R.int(3, 9); }
    else if (lv <= 60) { a = R.int(11, 29); b = R.int(11, 19); }
    else if (lv <= 75) { a = R.int(12, 49); b = R.int(11, 19); }
    else { a = R.int(13, 69); b = R.int(12, 29); }

    var ans = a * b;
    var text;
    if (lv <= 20 && R.chance(0.3)) text = '몬스터 ' + b + '마리가 각각 골드 ' + a + '개를 떨어뜨렸어요. 모두 몇 골드?';
    else text = a + ' × ' + b + ' = ?';

    var good = [a * (b - 1), a * (b + 1), ans - a, ans + b, ans + 10, ans - 10, a + b];
    return {
      text: text,
      answer: String(ans),
      choices: pick4(ans, good, R, 1),
      explain: EUL(a) + ' ' + b + '번 더하면 ' + IYO(ans) + '.'
    };
  });

  /* ================= 4. 나눗셈 (나누어떨어짐) ================= */
  G.register('div', { name: '나눗셈', icon: '➗', skill: 'calc', minLv: 8, maxLv: 100 }, function (lv, R) {
    var d, q;
    if (lv <= 14) { d = R.int(2, 5); q = R.int(2, 9); }
    else if (lv <= 25) { d = R.int(2, 9); q = R.int(2, 9); }
    else if (lv <= 40) { d = R.int(2, 9); q = R.int(4, 19); }
    else if (lv <= 58) { d = R.int(3, 9); q = R.int(6, 29); }
    else if (lv <= 75) { d = R.int(4, 12); q = R.int(6, 34); }
    else { d = R.int(6, 19); q = R.int(7, 39); }

    var a = d * q;
    var text;
    if (lv <= 20 && R.chance(0.3)) text = '보석 ' + a + '개를 상자 ' + d + '개에 똑같이 나눠 담으면 한 상자에 몇 개?';
    else text = a + ' ÷ ' + d + ' = ?';

    var good = [q + 1, q - 1, a - d, d, q + 10, q * 2];
    return {
      text: text,
      answer: String(q),
      choices: pick4(q, good, R, 1),
      explain: d + ' × ' + q + ' = ' + a + (jong(a) ? '이니까' : '니까') + ' 답은 ' + IYO(q) + '.'
    };
  });

  /* ================= 5. 나머지 있는 나눗셈 ================= */
  G.register('divmod', { name: '나머지있는나눗셈', icon: '🧩', skill: 'calc', minLv: 20, maxLv: 100 }, function (lv, R) {
    var d, q;
    if (lv <= 30) { d = R.int(3, 7); q = R.int(2, 9); }
    else if (lv <= 45) { d = R.int(3, 9); q = R.int(3, 15); }
    else if (lv <= 62) { d = R.int(4, 9); q = R.int(5, 25); }
    else if (lv <= 80) { d = R.int(4, 12); q = R.int(5, 30); }
    else { d = R.int(6, 17); q = R.int(6, 35); }

    var r = R.int(1, d - 1);
    var a = d * q + r;

    if (R.chance(0.5)) {
      return {
        text: a + ' ÷ ' + d + ' 의 나머지는?',
        answer: String(r),
        choices: pick4(r, [q, d - r, r + 1, r - 1, d], R, 0),
        explain: d + ' × ' + q + ' = ' + (d * q) + ' 이고 ' + a + '에서 ' + EUL(d * q) + ' 빼면 ' + IGA(r) + ' 남아요.'
      };
    }
    return {
      text: a + ' ÷ ' + d + ' 의 몫은?',
      answer: String(q),
      choices: pick4(q, [q + 1, q - 1, r, q + 10, d], R, 1),
      explain: d + '씩 ' + q + '번 덜어내면 ' + IGA(r) + ' 남아요. 그래서 몫은 ' + IYO(q) + '.'
    };
  });

  /* ================= 6. 혼합계산 ================= */
  G.register('mixed', { name: '혼합계산', icon: '🧮', skill: 'calc', minLv: 22, maxLv: 100 }, function (lv, R) {
    var a, b, c, d, e, ans, wrong, text, tip;

    var kinds;
    if (lv <= 32) kinds = [1, 2, 3];
    else if (lv <= 48) kinds = [1, 2, 3, 4, 5];
    else if (lv <= 66) kinds = [4, 5, 6, 7, 8];
    else if (lv <= 82) kinds = [5, 6, 7, 8, 9];
    else kinds = [6, 7, 9, 10];
    var kind = R.pick(kinds);

    if (kind === 1) {                      /* a + b × c */
      a = R.int(3, lv <= 40 ? 19 : 39); b = R.int(2, 9); c = R.int(2, 9);
      ans = a + b * c; wrong = (a + b) * c;
      text = a + ' + ' + b + ' × ' + c + ' = ?';
      tip = '곱셈 먼저! ' + b + '×' + c + '=' + (b * c) + ', 거기에 ' + EUL(a) + ' 더해요.';
    } else if (kind === 2) {               /* (a + b) × c */
      a = R.int(2, 12); b = R.int(2, 12); c = R.int(2, 9);
      ans = (a + b) * c; wrong = a + b * c;
      text = '(' + a + ' + ' + b + ') × ' + c + ' = ?';
      tip = '괄호 먼저! ' + a + '+' + b + '=' + (a + b) + ', 거기에 ' + EUL(c) + ' 곱해요.';
    } else if (kind === 3) {               /* a × b − c */
      a = R.int(3, 9); b = R.int(3, 9); c = R.int(2, Math.min(20, a * b - 1));
      ans = a * b - c; wrong = a * (b - c);
      text = a + ' × ' + b + ' − ' + c + ' = ?';
      tip = '곱셈 먼저! ' + a + '×' + b + '=' + (a * b) + ', 거기서 ' + EUL(c) + ' 빼요.';
    } else if (kind === 4) {               /* a + b × c − d */
      a = R.int(5, 30); b = R.int(2, 9); c = R.int(2, 9); d = R.int(2, 15);
      if (a + b * c - d < 1) d = 2;
      ans = a + b * c - d; wrong = (a + b) * c - d;
      text = a + ' + ' + b + ' × ' + c + ' − ' + d + ' = ?';
      tip = '곱셈 먼저 ' + (b * c) + ', 그다음 앞에서부터 더하고 빼면 ' + IYO(ans) + '.';
    } else if (kind === 5) {               /* (a + b) × c − d */
      a = R.int(2, 12); b = R.int(2, 12); c = R.int(2, 9); d = R.int(2, 20);
      ans = (a + b) * c - d; wrong = a + b * c - d;
      text = '(' + a + ' + ' + b + ') × ' + c + ' − ' + d + ' = ?';
      tip = '괄호 먼저 ' + (a + b) + ', 곱하면 ' + ((a + b) * c) + ', 빼면 ' + IYO(ans) + '.';
    } else if (kind === 6) {               /* a × b + c × d */
      a = R.int(3, 9); b = R.int(3, 9); c = R.int(3, 9); d = R.int(3, 9);
      ans = a * b + c * d; wrong = (a * b + c) * d;
      text = a + ' × ' + b + ' + ' + c + ' × ' + d + ' = ?';
      tip = '곱셈 두 개를 먼저! ' + GWA(a * b) + ' ' + EUL(c * d) + ' 더하면 ' + IYO(ans) + '.';
    } else if (kind === 7) {               /* a × (b + c) − d */
      a = R.int(3, 9); b = R.int(3, 15); c = R.int(2, 12); d = R.int(3, 25);
      ans = a * (b + c) - d; wrong = a * b + c - d;
      text = a + ' × (' + b + ' + ' + c + ') − ' + d + ' = ?';
      tip = '괄호 안 ' + EUL(b + c) + ' 먼저 구하고 ' + EUL(a) + ' 곱해요.';
    } else if (kind === 8) {               /* a + b ÷ c */
      c = R.int(2, 9); var q8 = R.int(2, 9); b = c * q8; a = R.int(3, 30);
      ans = a + q8; wrong = (a + b) / c;
      text = a + ' + ' + b + ' ÷ ' + c + ' = ?';
      tip = '나눗셈 먼저! ' + b + '÷' + c + '=' + q8 + ', 거기에 ' + EUL(a) + ' 더해요.';
    } else if (kind === 9) {               /* (a + b) ÷ c */
      c = R.int(2, 9); var q9 = R.int(3, 15); var s9 = c * q9;
      b = c * R.int(1, Math.max(1, q9 - 1)); a = s9 - b;
      ans = q9; wrong = a + b / c;
      text = '(' + a + ' + ' + b + ') ÷ ' + c + ' = ?';
      tip = '괄호 먼저 ' + s9 + ', ' + EURO(c) + ' 나누면 ' + IYO(q9) + '.';
    } else {                               /* a × (b − c) + d × e */
      a = R.int(3, 9); b = R.int(6, 15); c = R.int(2, 5); d = R.int(3, 9); e = R.int(3, 9);
      ans = a * (b - c) + d * e; wrong = a * b - c + d * e;
      text = a + ' × (' + b + ' − ' + c + ') + ' + d + ' × ' + e + ' = ?';
      tip = '괄호 먼저 ' + (b - c) + ', 곱셈 두 개 구한 뒤 더하면 ' + IYO(ans) + '.';
    }

    return {
      text: text,
      answer: String(ans),
      choices: pick4(ans, [wrong, ans + 1, ans - 1, ans + 10, ans - 10, ans + a], R, 0),
      explain: tip
    };
  });

  /* ================= 7. 빈칸 채우기 ================= */
  G.register('missing', { name: '빈칸채우기', icon: '⬜', skill: 'calc', minLv: 6, maxLv: 100 }, function (lv, R) {
    var forms;
    if (lv <= 12) forms = ['a+?', '?+a'];
    else if (lv <= 22) forms = ['a+?', '?+a', 'a-?', '?-a'];
    else if (lv <= 40) forms = ['a+?', 'a-?', '?-a', 'a*?'];
    else if (lv <= 65) forms = ['a+?', 'a-?', '?-a', 'a*?', '?/a', 'a/?'];
    else forms = ['a-?', '?-a', 'a*?', '?/a', 'a/?', '?*a'];
    var f = R.pick(forms);

    var hi = lv <= 12 ? 9 : lv <= 22 ? 40 : lv <= 40 ? 90 : lv <= 65 ? 400 : 900;
    var lo = lv <= 12 ? 2 : lv <= 22 ? 5 : lv <= 40 ? 11 : lv <= 65 ? 25 : 105;
    var a, x, c, text, tip;

    if (f === 'a+?' || f === '?+a') {
      a = R.int(lo, hi); x = R.int(lo, hi); c = a + x;
      text = (f === 'a+?') ? (a + ' + □ = ' + c) : ('□ + ' + a + ' = ' + c);
      tip = c + '에서 ' + EUL(a) + ' 빼면 □는 ' + IYO(x) + '.';
    } else if (f === 'a-?') {
      a = R.int(lo * 2 + 2, hi * 2); x = R.int(lo, Math.max(lo + 1, Math.floor(a / 2)));
      c = a - x;
      text = a + ' − □ = ' + c;
      tip = a + '에서 ' + EUL(c) + ' 빼면 □는 ' + IYO(x) + '.';
    } else if (f === '?-a') {
      a = R.int(lo, hi); c = R.int(lo, hi); x = a + c;
      text = '□ − ' + a + ' = ' + c;
      tip = c + '에 ' + EUL(a) + ' 더하면 □는 ' + IYO(x) + '.';
    } else if (f === 'a*?' || f === '?*a') {
      a = lv <= 40 ? R.int(2, 9) : R.int(3, 15);
      x = lv <= 40 ? R.int(2, 9) : R.int(3, 19);
      c = a * x;
      text = (f === 'a*?') ? (a + ' × □ = ' + c) : ('□ × ' + a + ' = ' + c);
      tip = EUL(c) + ' ' + EURO(a) + ' 나누면 □는 ' + IYO(x) + '.';
    } else if (f === '?/a') {
      a = R.int(2, 9); x = a * R.int(3, 19); c = x / a;
      text = '□ ÷ ' + a + ' = ' + c;
      tip = c + '에 ' + EUL(a) + ' 곱하면 □는 ' + IYO(x) + '.';
    } else {                                /* a ÷ □ = c */
      x = R.int(2, 9); var q = R.int(3, 19); a = x * q; c = q;
      text = a + ' ÷ □ = ' + c;
      tip = EUL(a) + ' ' + EURO(c) + ' 나누면 □는 ' + IYO(x) + '.';
    }

    var good = [c, a, c + a, Math.abs(c - a), x + 1, x - 1, x + 10];
    return {
      text: text,
      answer: String(x),
      choices: pick4(x, good, R, 1),
      explain: tip
    };
  });

  /* ================= 8. 분수 ================= */
  G.register('frac', { name: '분수', icon: '🍕', skill: 'calc', minLv: 30, maxLv: 100 }, function (lv, R) {
    var kinds;
    if (lv <= 42) kinds = ['add', 'sub', 'cmp'];
    else if (lv <= 55) kinds = ['add', 'sub', 'cmp', 'red'];
    else kinds = ['add', 'sub', 'red', 'add2', 'sub2'];
    var kind = R.pick(kinds);
    var d, a, b, ansN, ansD, ans, good, text, tip, k, d2, i;

    if (kind === 'add') {
      d = R.int(4, lv <= 50 ? 9 : 15);
      a = R.int(1, d - 2); b = R.int(1, d - 1 - a);
      ansN = a + b; ansD = d;
      ans = fr(ansN, ansD);
      text = a + '/' + d + ' + ' + b + '/' + d + ' = ?';
      tip = '분모는 그대로! 분자만 ' + a + '+' + b + '=' + ansN + redNote(ansN, d, ans);
      good = [fr(ansN, d + d), fr(a * b, d), fr(ansN + 1, d), fr(ansN, d + 1)];
    } else if (kind === 'sub') {
      d = R.int(4, lv <= 50 ? 9 : 15);
      a = R.int(2, d - 1); b = R.int(1, a - 1);
      ansN = a - b; ansD = d;
      ans = fr(ansN, ansD);
      text = a + '/' + d + ' − ' + b + '/' + d + ' = ?';
      tip = '분모는 그대로! 분자만 ' + a + '−' + b + '=' + ansN + redNote(ansN, d, ans);
      good = [fr(ansN, d - b > 1 ? d - b : d + d), fr(a + b, d), fr(ansN + 1, d), fr(ansN, d + 1)];
    } else if (kind === 'red') {
      var n0 = R.int(1, 6), m0 = R.int(n0 + 1, 9);
      var g0 = gcd(n0, m0); n0 = n0 / g0; m0 = m0 / g0;
      if (m0 < 2) { n0 = 2; m0 = 3; }
      k = R.int(2, lv <= 60 ? 5 : 8);
      ansN = n0; ansD = m0;
      ans = fr(n0, m0);
      text = (n0 * k) + '/' + (m0 * k) + ' 을 가장 간단한 분수로 나타내면?';
      tip = '분자와 분모를 똑같이 ' + EURO(k) + ' 나누면 ' + IGA(ans) + ' 돼요.';
      good = [fr(n0, m0 + 1), fr(n0 + 1, m0), fr(n0 * k - k, m0 * k), fr(n0, m0 * 2)];
    } else if (kind === 'cmp') {
      var same = R.chance(0.5);
      var list = [], vals = [];
      if (same) {                            /* 분모가 같으면 분자가 큰 쪽 */
        d = R.int(5, 12);
        var ns = R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].slice(0, d - 1), 4);
        for (i = 0; i < 4; i++) { list.push(ns[i] + '/' + d); vals.push(ns[i] / d); }
      } else {                               /* 분자가 같으면 분모가 작은 쪽 */
        var n1 = R.int(1, 3);
        var ds = R.sample([n1 + 1, n1 + 2, n1 + 3, n1 + 4, n1 + 5, n1 + 6, n1 + 7], 4);
        for (i = 0; i < 4; i++) { list.push(n1 + '/' + ds[i]); vals.push(n1 / ds[i]); }
      }
      var bi = 0;
      for (i = 1; i < 4; i++) if (vals[i] > vals[bi]) bi = i;
      ans = list[bi];
      var others = [];
      for (i = 0; i < 4; i++) if (i !== bi) others.push(list[i]);
      return {
        text: '다음 중 가장 큰 분수는?',
        sub: list.join(' &nbsp; '),
        answer: ans,
        choices: build4(ans, others, [], R, fval),
        explain: same
          ? ('분모가 같으면 분자가 큰 ' + IGA(ans) + ' 가장 커요.')
          : ('분자가 같으면 분모가 작은 ' + IGA(ans) + ' 가장 커요.')
      };
    } else if (kind === 'add2') {            /* 분모가 배수 관계 */
      d = R.int(2, 6); k = R.int(2, 4); d2 = d * k;
      a = R.int(1, d - 1); b = R.int(1, d2 - 1);
      if (a * k + b >= d2) { a = 1; b = R.int(1, Math.max(1, d2 - k - 1)); }
      ansN = a * k + b; ansD = d2;
      ans = fr(ansN, ansD);
      text = a + '/' + d + ' + ' + b + '/' + d2 + ' = ?';
      tip = a + '/' + d + '을 ' + (a * k) + '/' + d2 + '로 바꾸고 더하면 ' + IYO(ans) + '.';
      good = [fr(a + b, d2), fr(a + b, d + d2), fr(ansN + 1, d2), fr(ansN, d2 + 1)];
    } else {                                 /* 분모가 배수 관계 뺄셈 */
      d = R.int(2, 6); k = R.int(2, 4); d2 = d * k;
      a = R.int(1, d - 1); b = R.int(1, a * k - 1);
      ansN = a * k - b; ansD = d2;
      ans = fr(ansN, ansD);
      text = a + '/' + d + ' − ' + b + '/' + d2 + ' = ?';
      tip = a + '/' + d + '을 ' + (a * k) + '/' + d2 + '로 바꾸고 빼면 ' + IYO(ans) + '.';
      good = [fr(Math.abs(a - b), d2), fr(ansN + 1, d2), fr(ansN, d2 + 1), fr(a + b, d2)];
    }

    return {
      text: text,
      answer: ans,
      choices: build4(ans, good, fracFill(ansN, ansD), R, fval),
      explain: tip
    };
  });

  /* ================= 9. 분수와 곱셈 · 전체 구하기 ================= */
  G.register('frac2', { name: '분수와곱셈', icon: '🍰', skill: 'calc', minLv: 50, maxLv: 100 }, function (lv, R) {
    var kind = R.pick(lv <= 70 ? ['part', 'whole', 'times'] : ['part', 'whole', 'times', 'rest']);
    var d = R.int(2, lv <= 70 ? 6 : 9);
    var n = R.int(1, d - 1);
    var g = gcd(n, d); n = n / g; d = d / g;
    if (d < 2) { n = 1; d = 3; }
    var m = R.int(lv <= 70 ? 2 : 3, lv <= 70 ? 12 : 20);
    var total = d * m;

    if (kind === 'part') {
      var ans = m * n;
      return {
        text: total + '의 ' + n + '/' + d + ' 는 얼마?',
        answer: String(ans),
        choices: pick4(ans, [m, total - ans, total * n, ans + d, ans + 1, ans - 1], R, 1),
        explain: n === 1
          ? (EUL(total) + ' ' + EURO(d) + ' 나누면 ' + IYO(ans) + '.')
          : (EUL(total) + ' ' + EURO(d) + ' 나누면 ' + m + ', 그걸 ' + n + '번 모으면 ' + IYO(ans) + '.')
      };
    }
    if (kind === 'whole') {
      var part = m * n;
      return {
        text: '어떤 수의 ' + n + '/' + d + ' 가 ' + part + '예요. 어떤 수는?',
        answer: String(total),
        choices: pick4(total, [part * d, m, part + d, total - part, part * n], R, 1),
        explain: n === 1
          ? (part + '에 ' + EUL(d) + ' 곱하면 ' + IYO(total) + '.')
          : (EUL(part) + ' ' + EURO(n) + ' 나누면 ' + m + ', 거기에 ' + EUL(d) + ' 곱하면 ' + IYO(total) + '.')
      };
    }
    if (kind === 'times') {
      var t = R.int(2, d - 1 > 1 ? d - 1 : 2);
      var an = n * t, ad = d;
      var ansS = fr(an, ad);
      return {
        text: n + '/' + d + ' × ' + t + ' = ?',
        answer: ansS,
        choices: build4(ansS, [fr(n, d * t), fr(n + t, d), fr(an + 1, ad), fr(n * t, d * t + 1)], fracFill(an, ad), R, fval),
        explain: '분자에만 ' + EUL(t) + ' 곱해서 ' + IYO(ansS) + '.'
      };
    }
    /* rest : 남은 양 */
    var used = m * n;
    var left = total - used;
    return {
      text: '물약 ' + total + '개 중 ' + n + '/' + d + ' 를 썼어요. 남은 물약은?',
      answer: String(left),
      choices: pick4(left, [used, m, total - m, left + 1, left - 1], R, 0),
      explain: '쓴 건 ' + used + '개니까 ' + total + '−' + used + '=' + left + '개가 남아요.'
    };
  });

  /* ================= 10. 소수 ================= */
  G.register('dec', { name: '소수', icon: '🔟', skill: 'calc', minLv: 34, maxLv: 100 }, function (lv, R) {
    var kinds;
    if (lv <= 45) kinds = ['add', 'sub', 'cmp', 'x10'];
    else if (lv <= 70) kinds = ['add', 'sub', 'cmp', 'x10', 'x01'];
    else kinds = ['add', 'sub', 'x10', 'x01', 'cmp'];
    var kind = R.pick(kinds);
    var dec = lv <= 55 ? 1 : 2;
    var P = Math.pow(10, dec);
    var ai, bi, ans, good, i;

    function fmtAll(list, dd) {
      var o = [], j;
      for (j = 0; j < list.length; j++) o.push(fd(list[j], dd));
      return o;
    }

    if (kind === 'add') {
      ai = R.int(dec === 1 ? 11 : 105, dec === 1 ? 189 : 1890);
      bi = R.int(dec === 1 ? 11 : 105, dec === 1 ? 189 : 1890);
      ans = (ai + bi) / P;
      good = [(ai + bi + P) / P, (ai + bi - P) / P, (ai + bi) / (P * 10), (ai + bi + 1) / P];
      return {
        text: fd(ai / P, dec) + ' + ' + fd(bi / P, dec) + ' = ?',
        answer: fd(ans, dec),
        choices: build4(fd(ans, dec), fmtAll(good, dec + 1), decFill(ans, dec, R), R, Number),
        explain: '소수점 자리를 맞춰서 더하면 ' + IYO(fd(ans, dec)) + '.'
      };
    }
    if (kind === 'sub') {
      ai = R.int(dec === 1 ? 60 : 600, dec === 1 ? 199 : 1990);
      bi = R.int(dec === 1 ? 11 : 105, ai - 5);
      ans = (ai - bi) / P;
      good = [(ai - bi + P) / P, (ai - bi - P) / P, (ai + bi) / P, (ai - bi + 1) / P];
      return {
        text: fd(ai / P, dec) + ' − ' + fd(bi / P, dec) + ' = ?',
        answer: fd(ans, dec),
        choices: build4(fd(ans, dec), fmtAll(good, dec + 1), decFill(ans, dec, R), R, Number),
        explain: '소수점 자리를 맞춰서 빼면 ' + IYO(fd(ans, dec)) + '.'
      };
    }
    if (kind === 'x10') {
      ai = R.int(dec === 1 ? 12 : 105, dec === 1 ? 989 : 9890);
      var v = ai / P;
      ans = v * 10;
      return {
        text: fd(v, dec) + ' 의 10배는?',
        answer: fd(ans, dec + 1),
        choices: build4(fd(ans, dec + 1), [fd(v * 100, dec), fd(v / 10, dec + 2), fd(v + 10, dec), fd(ans + 1, dec)],
          decFill(ans, dec, R), R, Number),
        explain: '10배 하면 소수점이 오른쪽으로 한 칸! ' + IYO(fd(ans, dec + 1)) + '.'
      };
    }
    if (kind === 'x01') {
      ai = R.int(dec === 1 ? 12 : 105, dec === 1 ? 989 : 9890);
      var v2 = ai / P;
      ans = v2 / 10;
      return {
        text: fd(v2, dec) + ' 의 0.1배는?',
        answer: fd(ans, dec + 2),
        choices: build4(fd(ans, dec + 2), [fd(v2 * 10, dec), fd(v2 / 100, dec + 3), fd(v2 - 0.1, dec + 1), fd(ans * 100, dec)],
          decFill(ans, dec + 1, R), R, Number),
        explain: '0.1배 하면 소수점이 왼쪽으로 한 칸! ' + IYO(fd(ans, dec + 2)) + '.'
      };
    }
    /* cmp : 가장 큰 소수 고르기 */
    var base = R.int(1, 8);
    var pool = [], seen = {};
    var cands = R.shuffle([base + 0.9, base + 0.85, base + 0.5, base + 0.45, base + 0.09, base + 0.75, base + 0.7, base + 0.125]);
    for (i = 0; i < cands.length && pool.length < 4; i++) {
      var s = fd(cands[i], 3);
      if (seen[s]) continue;
      seen[s] = 1; pool.push(s);
    }
    var bi2 = 0;
    for (i = 1; i < 4; i++) if (Number(pool[i]) > Number(pool[bi2])) bi2 = i;
    var best = pool[bi2], oth = [];
    for (i = 0; i < 4; i++) if (i !== bi2) oth.push(pool[i]);
    return {
      text: '다음 중 가장 큰 수는?',
      sub: pool.join(' &nbsp; '),
      answer: best,
      choices: build4(best, oth, [], R, Number),
      explain: '소수점 바로 뒷자리부터 차례로 비교하면 ' + IGA(best) + ' 가장 커요.'
    };
  });

  /* ================= 11. 약수와 배수 ================= */
  G.register('factor', { name: '약수와배수', icon: '🔍', skill: 'calc', minLv: 40, maxLv: 100 }, function (lv, R) {
    var kind = R.pick(lv <= 60 ? ['gcd', 'lcm', 'notdiv'] : ['gcd', 'lcm', 'notdiv', 'count']);
    var hi = lv <= 55 ? 9 : lv <= 75 ? 14 : 20;
    var a, b, i;

    if (kind === 'gcd') {
      var g = R.int(2, lv <= 60 ? 8 : 12);
      var p = R.int(2, hi), q = R.int(2, hi);
      if (p === q) q = q + 1;
      a = g * p; b = g * q;
      var ansg = gcd(a, b);
      return {
        text: GWA(a) + ' ' + b + '의 최대공약수는?',
        answer: String(ansg),
        choices: pick4(ansg, [lcm(a, b), ansg * 2, ansg + 1, ansg - 1, Math.min(a, b)], R, 1),
        explain: GWA(a) + ' ' + EUL(b) + ' 함께 나눌 수 있는 가장 큰 수는 ' + IYO(ansg) + '.'
      };
    }
    if (kind === 'lcm') {
      a = R.int(2, lv <= 60 ? 9 : 15); b = R.int(2, lv <= 60 ? 9 : 15);
      if (a === b) b = b + 1;
      var ansl = lcm(a, b);
      return {
        text: GWA(a) + ' ' + b + '의 최소공배수는?',
        answer: String(ansl),
        choices: pick4(ansl, [a * b, gcd(a, b), ansl * 2, ansl + a, ansl - b], R, 1),
        explain: a + '의 배수이면서 ' + b + '의 배수인 가장 작은 수는 ' + IYO(ansl) + '.'
      };
    }
    if (kind === 'count') {
      var base = R.pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 45, 48, 60, 72, 100]);
      var cnt = 0;
      for (i = 1; i <= base; i++) if (base % i === 0) cnt++;
      return {
        text: base + '의 약수는 모두 몇 개?',
        answer: String(cnt),
        choices: pick4(cnt, [cnt - 1, cnt + 1, cnt - 2, cnt + 3], R, 1),
        explain: EUL(base) + ' 나누어떨어지게 하는 수를 세어 보면 ' + cnt + '개예요.'
      };
    }
    /* notdiv : 약수가 아닌 것 고르기 */
    var num = R.pick([12, 18, 20, 24, 30, 36, 40, 48, 60]);
    var divs = [];
    for (i = 2; i < num; i++) if (num % i === 0) divs.push(i);
    var good3 = R.sample(divs, 3);
    var bad = 0, guard = 0;
    while (guard++ < 300) {
      var cand = R.int(2, num - 1);
      if (num % cand !== 0) { bad = cand; break; }
    }
    if (!bad) bad = num - 1;
    return {
      text: num + '의 약수가 <b>아닌</b> 것은?',
      answer: String(bad),
      choices: build4(String(bad), [String(good3[0]), String(good3[1]), String(good3[2])], [], R),
      explain: num + ' ÷ ' + EUN(bad) + ' 딱 나누어떨어지지 않아요.'
    };
  });

  /* ================= 12. 단위 환산 ================= */
  G.register('unit', { name: '단위환산', icon: '📏', skill: 'calc', minLv: 26, maxLv: 100 }, function (lv, R) {
    var SETS = [
      { big: 'm', bj: '는', small: 'cm', sj: '는', se: '예요', k: 100 },
      { big: 'km', bj: '는', small: 'm', sj: '는', se: '예요', k: 1000 },
      { big: 'kg', bj: '은', small: 'g', sj: '은', se: '이에요', k: 1000 },
      { big: 'L', bj: '는', small: 'mL', sj: '는', se: '예요', k: 1000 },
      { big: '분', bj: '은', small: '초', sj: '는', se: '예요', k: 60 },
      { big: '시간', bj: '은', small: '분', sj: '은', se: '이에요', k: 60 }
    ];
    function sNi(u) { return u.se === '이에요' ? '이니까' : '니까'; }
    function sIga(u) { return u.se === '이에요' ? '이' : '가'; }
    var s = R.pick(SETS);
    var kind;
    if (lv <= 40) kind = R.pick(['b2s', 'mix']);
    else if (lv <= 65) kind = R.pick(['b2s', 'mix', 's2b']);
    else kind = R.pick(['mix', 's2b', 'dec']);

    var B = R.int(2, lv <= 45 ? 6 : 9);
    var Sm = R.int(1, s.k - 1);

    if (kind === 'b2s') {
      var ans1 = B * s.k;
      return {
        text: B + ' ' + s.big + s.bj + ' 몇 ' + s.small + '일까?',
        answer: String(ans1),
        choices: pick4(ans1, [ans1 * 10, Math.round(ans1 / 10), B + s.k, s.k, B * 10], R, 1),
        explain: '1 ' + s.big + s.bj + ' ' + s.k + ' ' + s.small + sNi(s) + ' ' + B + '배 하면 ' + ans1 + ' ' + s.small + s.se + '.'
      };
    }
    if (kind === 'mix') {
      var ans2 = B * s.k + Sm;
      return {
        text: B + ' ' + s.big + ' ' + Sm + ' ' + s.small + s.sj + ' 몇 ' + s.small + '일까?',
        answer: String(ans2),
        choices: pick4(ans2, [B * s.k, Sm + B, B * s.k * 10 + Sm, ans2 + s.k, ans2 - s.k], R, 1),
        explain: B + ' ' + s.big + ' = ' + (B * s.k) + ' ' + s.small + ', 여기에 ' + EUL(Sm) + ' 더하면 ' + IYO(ans2) + '.'
      };
    }
    if (kind === 's2b') {
      var r = R.int(1, s.k - 1);
      var tot = B * s.k + r;
      return {
        text: tot + ' ' + s.small + s.sj + ' 몇 ' + s.big + ' 몇 ' + s.small + '일까?',
        sub: s.big + ' 부분의 수를 고르세요.',
        answer: String(B),
        choices: pick4(B, [r, B + 1, B - 1, tot - B, s.k], R, 0),
        explain: EUL(tot) + ' ' + s.k + '씩 묶으면 ' + B + '묶음이고 ' + r + ' ' + s.small + sIga(s) + ' 남아요.'
      };
    }
    /* dec : 소수로 주어진 큰 단위 */
    var half = s.k === 60 ? 5 : R.pick([5, 25, 75, 2, 4, 6, 8]);
    var vB = B + half / (half >= 10 ? 100 : 10);
    var ans3 = Math.round(vB * s.k);
    return {
      text: fd(vB, 2) + ' ' + s.big + s.bj + ' 몇 ' + s.small + '일까?',
      answer: String(ans3),
      choices: pick4(ans3, [B * s.k, ans3 * 10, Math.round(ans3 / 10), ans3 + s.k], R, 1),
      explain: '1 ' + s.big + s.bj + ' ' + s.k + ' ' + s.small + sNi(s) + ' ' + fd(vB, 2) + '배 하면 ' + ans3 + ' ' + s.small + s.se + '.'
    };
  });

  /* ================= 13. 문장제 ================= */
  G.register('word', { name: '문장제', icon: '📖', skill: 'calc', minLv: 12, maxLv: 100 }, function (lv, R) {
    var kinds;
    if (lv <= 25) kinds = ['gold', 'potion', 'arrow'];
    else if (lv <= 45) kinds = ['gold', 'potion', 'arrow', 'chest', 'hp'];
    else if (lv <= 70) kinds = ['chest', 'hp', 'days', 'party'];
    else kinds = ['hp', 'days', 'party', 'chest'];
    var k = R.pick(kinds);
    var n, g, ans, a, b;

    if (k === 'gold') {
      n = lv <= 25 ? R.int(3, 9) : R.int(6, 19);
      g = lv <= 25 ? R.int(4, 12) : R.int(8, 30);
      ans = n * g;
      return {
        text: '슬라임 ' + n + '마리를 잡고 한 마리당 ' + g + '골드를 받았어요. 모두 몇 골드?',
        answer: String(ans),
        choices: pick4(ans, [n + g, ans - g, ans + g, n * (g - 1)], R, 1),
        explain: n + '마리 × ' + g + '골드 = ' + ans + '골드예요.'
      };
    }
    if (k === 'potion') {
      a = lv <= 25 ? R.int(20, 60) : R.int(80, 260);
      b = R.int(5, Math.floor(a / 2));
      ans = a - b;
      return {
        text: '물약 ' + a + '개 중 ' + b + '개를 마셨어요. 남은 물약은?',
        answer: String(ans),
        choices: pick4(ans, [a + b, noBorrowSub(a, b), ans + 10, ans - 1], R, 0),
        explain: a + '에서 ' + EUL(b) + ' 빼면 ' + ans + '개가 남아요.'
      };
    }
    if (k === 'arrow') {
      n = R.int(4, lv <= 25 ? 9 : 15);
      g = R.int(3, lv <= 25 ? 9 : 15);
      ans = n * g;
      return {
        text: '몬스터 ' + n + '마리에게 화살을 ' + g + '개씩 쏘려면 화살이 몇 개 필요할까?',
        answer: String(ans),
        choices: pick4(ans, [n + g, ans - n, ans + g, n * (g + 1)], R, 1),
        explain: n + ' × ' + g + ' = ' + ans + '개가 필요해요.'
      };
    }
    if (k === 'chest') {
      var box = R.int(3, lv <= 45 ? 8 : 12);
      var per = R.int(4, lv <= 45 ? 12 : 25);
      var tot = box * per;
      return {
        text: '보석 ' + tot + '개를 상자 ' + box + '개에 똑같이 나눠 담으면 한 상자에 몇 개?',
        answer: String(per),
        choices: pick4(per, [tot - box, box, per + 1, per - 1, per * 2], R, 1),
        explain: tot + ' ÷ ' + box + ' = ' + per + ', 한 상자에 ' + per + '개씩 담으면 돼요.'
      };
    }
    if (k === 'hp') {
      var hp = lv <= 45 ? R.int(50, 120) : R.int(200, 900);
      var dmg = lv <= 45 ? R.int(4, 12) : R.int(15, 60);
      var t = R.int(2, lv <= 45 ? 5 : 9);
      if (dmg * t >= hp) t = 2;
      if (dmg * t >= hp) dmg = Math.max(2, Math.floor(hp / 4));
      ans = hp - dmg * t;
      return {
        text: '체력 ' + hp + '인 용사가 ' + dmg + '씩 ' + t + '번 맞았어요. 남은 체력은?',
        answer: String(ans),
        choices: pick4(ans, [hp - dmg, hp - dmg - t, ans + dmg, ans - dmg], R, 0),
        explain: dmg + '×' + t + '=' + (dmg * t) + ' 만큼 깎이니까 ' + hp + '−' + (dmg * t) + '=' + IYO(ans) + '.'
      };
    }
    if (k === 'days') {
      var per2 = R.int(12, lv <= 70 ? 40 : 90);
      var day = R.int(4, lv <= 70 ? 9 : 15);
      var spend = R.int(10, per2 * day - 10);
      ans = per2 * day - spend;
      return {
        text: '하루에 ' + per2 + '골드씩 ' + day + '일 모아서 ' + spend + '골드짜리 검을 샀어요. 남은 골드는?',
        answer: String(ans),
        choices: pick4(ans, [per2 * day, per2 * day + spend, ans + 10, per2 - spend], R, 0),
        explain: per2 + '×' + day + '=' + (per2 * day) + ' 모았고 ' + EUL(spend) + ' 썼으니 ' + ans + '골드 남아요.'
      };
    }
    /* party : 나머지가 생기는 나눔 */
    var people = R.int(3, lv <= 70 ? 6 : 9);
    var each = R.int(4, lv <= 70 ? 15 : 30);
    var left = R.int(1, people - 1);
    var total = people * each + left;
    return {
      text: '보물 ' + total + '개를 ' + people + '명이 똑같이 나눠 가지면 몇 개가 남을까?',
      answer: String(left),
      choices: pick4(left, [each, people - left, left + 1, people], R, 0),
      explain: EUL(total) + ' ' + people + '명에게 나누면 ' + each + '개씩 가지고 ' + left + '개가 남아요.'
    };
  });

  /* ================= 14. 큰 수 비교 · 자릿값 ================= */
  G.register('bigcmp', { name: '큰수비교', icon: '🔢', skill: 'calc', minLv: 18, maxLv: 100 }, function (lv, R) {
    var kinds;
    if (lv <= 30) kinds = ['big', 'digit'];
    else if (lv <= 55) kinds = ['big', 'digit', 'place', 'build'];
    else kinds = ['digit', 'place', 'build', 'near'];
    var kind = R.pick(kinds);
    var len = lv <= 30 ? 3 : lv <= 55 ? 4 : lv <= 80 ? 5 : 6;
    var i;
    var NAMES = { 1: '일', 10: '십', 100: '백', 1000: '천', 10000: '만', 100000: '십만' };

    function rnum(L) {
      var s = String(R.int(1, 9));
      for (var t = 1; t < L; t++) s += String(R.int(0, 9));
      return Number(s);
    }

    if (kind === 'big') {
      var base = rnum(len);
      var list = [base], seen = {};
      seen[base] = 1;
      var guard = 0;
      while (list.length < 4 && guard++ < 300) {
        var v = base + R.int(-1, 1) * Math.pow(10, R.int(0, len - 1)) + R.int(-9, 9);
        if (v <= 0 || String(v).length !== len || seen[v]) continue;
        seen[v] = 1; list.push(v);
      }
      while (list.length < 4) {
        var v2 = base + list.length * 111;
        if (String(v2).length !== len) v2 = base - list.length * 111;
        if (v2 > 0 && String(v2).length === len && !seen[v2]) { seen[v2] = 1; list.push(v2); }
        else base = rnum(len);
      }
      var bi = 0;
      for (i = 1; i < 4; i++) if (list[i] > list[bi]) bi = i;
      var ansB = String(list[bi]), othB = [];
      for (i = 0; i < 4; i++) if (i !== bi) othB.push(String(list[i]));
      return {
        text: '다음 중 가장 큰 수는?',
        sub: list.join(' &nbsp; '),
        answer: ansB,
        choices: build4(ansB, othB, [], R, Number),
        explain: '자릿수가 같으면 맨 앞자리부터 비교해요. ' + IGA(ansB) + ' 가장 커요.'
      };
    }

    if (kind === 'digit') {
      var num1 = rnum(len);
      var ds1 = String(num1).split('');
      var pos1 = R.int(0, len - 1);
      var pv1 = Math.pow(10, len - 1 - pos1);
      var dg = Number(ds1[pos1]);
      var others = [];
      for (i = 0; i < len; i++) if (Number(ds1[i]) !== dg) others.push(String(ds1[i]));
      return {
        text: num1 + ' 에서 ' + NAMES[pv1] + '의 자리 숫자는?',
        answer: String(dg),
        choices: build4(String(dg), others, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], R),
        explain: '오른쪽에서부터 일·십·백… 세어 보면 ' + NAMES[pv1] + '의 자리는 ' + IYO(dg) + '.'
      };
    }

    if (kind === 'place') {
      /* 숫자가 겹치지 않게 만들어 "어느 3?" 헷갈림을 없앤다 */
      var dl = R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], len);
      var num2 = Number(dl.join(''));
      var pos2 = R.int(0, len - 1);
      var pv2 = Math.pow(10, len - 1 - pos2);
      var d2 = dl[pos2];
      var val = d2 * pv2;
      return {
        text: num2 + ' 에서 ' + IGA(d2) + ' 나타내는 값은?',
        answer: String(val),
        choices: pick4(val, [d2, pv2, val * 10, Math.round(val / 10), val + pv2], R, 1),
        explain: EUN(d2) + ' ' + NAMES[pv2] + '의 자리에 있으니 ' + d2 + ' × ' + pv2 + ' = ' + EUL(val) + ' 나타내요.'
      };
    }

    if (kind === 'build') {
      var u = len >= 5 ? [10000, 1000, 100] : [1000, 100, 10];
      var c1 = R.int(1, 9), c2 = R.int(1, 9), c3 = R.int(1, 9);
      var made = c1 * u[0] + c2 * u[1] + c3 * u[2];
      return {
        text: u[0] + '이 ' + c1 + '개, ' + u[1] + '이 ' + c2 + '개, ' + u[2] + '이 ' + c3 + '개인 수는?',
        answer: String(made),
        choices: pick4(made, [c1 * u[0] + c2 * u[1], made * 10, Math.round(made / 10), c1 + c2 + c3, made + u[2]], R, 1),
        explain: c1 + '·' + c2 + '·' + EUL(c3) + ' 자리에 맞춰 놓으면 ' + IYO(made) + '.'
      };
    }

    /* near : ~보다 얼마 큰/작은 수 */
    var num3 = rnum(len);
    var step = Math.pow(10, R.int(1, Math.min(3, len - 1)));
    var up = R.chance(0.5);
    var res = up ? num3 + step : num3 - step;
    if (res <= 0) { up = true; res = num3 + step; }
    return {
      text: num3 + ' 보다 ' + step + ' ' + (up ? '큰' : '작은') + ' 수는?',
      answer: String(res),
      choices: pick4(res, [up ? num3 - step : num3 + step, num3, res + step, res + 1], R, 1),
      explain: num3 + ' 에서 ' + EUL(step) + ' ' + (up ? '더하면 ' : '빼면 ') + IYO(res) + '.'
    };
  });

  /* ================= 15. 음수 ================= */
  G.register('neg', { name: '음수', icon: '🌡️', skill: 'calc', minLv: 62, maxLv: 100 }, function (lv, R) {
    var kind = R.pick(lv <= 80 ? ['temp', 'floor', 'calc'] : ['temp', 'floor', 'calc', 'cmp', 'diff']);
    var hi = lv <= 80 ? 12 : 25;
    var a, b, ans, i;

    if (kind === 'temp') {
      a = -R.int(1, hi);
      b = R.int(1, hi + 8);
      ans = a + b;
      return {
        text: '아침 기온이 ' + degWord(a) + '였는데 낮에 ' + b + '도 올랐어요. 낮 기온은?',
        answer: String(ans),
        choices: pick4(ans, [a - b, -a + b, -ans, ans + 1, ans - 1], R),
        explain: degWord(a) + '에서 ' + b + '도 오르면 ' + degWord(ans) + '예요.'
      };
    }
    if (kind === 'floor') {
      a = -R.int(1, 6);
      var move = R.chance(0.65) ? R.int(1, 10) : -R.int(1, 3);
      ans = a + move;
      if (ans === 0) { ans = move > 0 ? 1 : -1; move = ans - a; }
      if (move === 0) { move = 1; ans = a + 1; }
      return {
        text: floorWord(a) + '(' + a + '층)에서 엘리베이터를 타고 ' + Math.abs(move) + '층 ' + (move > 0 ? '올라갔어요' : '내려갔어요') + '. 지금은 몇 층?',
        answer: String(ans),
        choices: pick4(ans, [a - move, -ans, ans + 1, ans - 1, -a + Math.abs(move)], R),
        explain: a + '층에서 ' + (move > 0 ? '+' : '') + move + '층 하면 ' + floorWord(ans) + '이에요.'
      };
    }
    if (kind === 'calc') {
      var form = R.pick(['np', 'pn', 'nn']);
      if (form === 'np') {
        a = -R.int(2, hi); b = R.int(2, hi + 5); ans = a + b;
        return negOut(a + ' + ' + b, ans, a, b, R, a + '에서 수직선을 오른쪽으로 ' + b + '칸 가면 ' + IYO(ans) + '.');
      }
      if (form === 'pn') {
        a = R.int(2, hi); b = R.int(a + 1, hi + 12); ans = a - b;
        return negOut(a + ' − ' + b, ans, a, b, R, a + '에서 ' + EUL(b) + ' 빼면 0을 지나 ' + IGA(ans) + ' 돼요.');
      }
      a = -R.int(2, hi); b = R.int(2, hi); ans = a - b;
      return negOut(a + ' − ' + b, ans, a, b, R, '음수에서 또 빼니까 더 작아져서 ' + IYO(ans) + '.');
    }
    if (kind === 'cmp') {
      var list = [], seen = {}, v, guard = 0;
      while (list.length < 4 && guard++ < 300) {
        v = R.int(-hi, 6);
        if (seen[v]) continue;
        seen[v] = 1; list.push(v);
      }
      while (list.length < 4) { v = -hi - list.length; if (!seen[v]) { seen[v] = 1; list.push(v); } }
      var bi = 0;
      for (i = 1; i < 4; i++) if (list[i] < list[bi]) bi = i;
      var small = String(list[bi]), oth = [];
      for (i = 0; i < 4; i++) if (i !== bi) oth.push(String(list[i]));
      return {
        text: '다음 중 가장 작은 수는?',
        sub: list.join(' &nbsp; '),
        answer: small,
        choices: build4(small, oth, [], R, Number),
        explain: '음수는 −가 붙은 숫자가 클수록 더 작아요. 그래서 ' + IGA(small) + ' 가장 작아요.'
      };
    }
    /* diff : 두 기온의 차 */
    a = -R.int(1, hi); b = R.int(1, hi + 5);
    ans = b - a;
    return {
      text: '어제는 ' + degWord(a) + ', 오늘은 ' + degWord(b) + '예요. 기온 차는 몇 도?',
      answer: String(ans),
      choices: pick4(ans, [b + a, Math.abs(b + a), ans + 1, ans - 1], R, 1),
      explain: degWord(a) + '에서 0도까지 ' + (-a) + '도, 거기서 ' + b + '도 더 올라가니까 모두 ' + ans + '도예요.'
    };
  });

  function negOut(expr, ans, a, b, R, tip) {
    return {
      text: expr + ' = ?',
      answer: String(ans),
      choices: pick4(ans, [-ans, ans + 1, ans - 1, a - b, a + b], R),
      explain: tip
    };
  }

})();
