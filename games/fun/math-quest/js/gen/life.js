/* =====================================================================
 * life.js — 생활 속 수학: 시계 · 달력 · 확률 · 경우의 수 · 평균 · 비율 · 빠르기 · 돈 · 그래프 · 수 추리
 * 계약: js/gen/_CONTRACT.md  (순수 ES5, IIFE, MQ.Gen.register 만 사용)
 * ===================================================================== */
(function () {
  'use strict';

  var MQ = window.MQ;

  /* ------------------------------------------------------------------
   * 공용 도우미
   * ---------------------------------------------------------------- */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }

  /* 기약분수 문자열. 분모가 1이면 정수로. */
  function frac(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    if (d === 1) return String(n);
    return n + '/' + d;
  }

  /* 분수 정답용 보기 4개 */
  function fracChoices(n, d, R, extra) {
    var ans = frac(n, d);
    var cand = [];
    var i;
    if (extra) for (i = 0; i < extra.length; i++) cand.push(extra[i]);
    if (n + 1 < d) cand.push(frac(n + 1, d));
    if (n - 1 > 0) cand.push(frac(n - 1, d));
    if (d - n > 0 && d - n < d) cand.push(frac(d - n, d));
    cand.push(frac(1, d));
    cand.push(frac(n, d + 1));
    cand.push(frac(n * 2, d));
    cand.push(frac(1, Math.max(2, d - 1)));
    cand.push(frac(2, Math.max(3, d)));
    cand.push(frac(1, d + 2));
    cand.push(frac(3, d + 4));
    var out = [];
    for (i = 0; i < cand.length; i++) {
      var s = cand[i];
      if (s === ans) continue;
      if (s.indexOf('/') < 0) continue;      // 정수 보기는 제외(분수 문제니까)
      out.push(s);
    }
    return MQ.uniq4(ans, out, R);
  }

  /* 받침 있는지 — 조사(이/가, 은/는) 고르기용 */
  var DIGIT_JONG = [1, 1, 0, 1, 0, 0, 1, 1, 1, 0]; // 영 일 이 삼 사 오 육 칠 팔 구
  function hasJong(s) {
    s = String(s);
    var ch = s.charAt(s.length - 1);
    var c = ch.charCodeAt(0);
    if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 !== 0;
    if (ch >= '0' && ch <= '9') return DIGIT_JONG[c - 48] === 1;
    return false;
  }
  /* 단어 + 알맞은 조사 */
  function J(word, a, b) { return word + (hasJong(word) ? a : b); }
  /* ~이에요 / ~예요 */
  function E(word) { return J(String(word), '이에요.', '예요.'); }

  /* 시각 문자열 '3:40' */
  function tstr(h, m) {
    h = ((h % 12) + 12) % 12; if (h === 0) h = 12;
    return h + ':' + pad2(m);
  }
  /* 분 단위 값(0~719) → '3:40' */
  function mm2str(t) {
    t = ((t % 720) + 720) % 720;
    return tstr(Math.floor(t / 60), t % 60);
  }
  /* 걸린 시간 표기 */
  function dur(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return m + '분';
    if (m === 0) return h + '시간';
    return h + '시간 ' + m + '분';
  }

  var DOW = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysIn(y, m) { return (m === 2 && isLeap(y)) ? 29 : MDAYS[m - 1]; }

  /* ------------------------------------------------------------------
   * 시계 SVG (viewBox 0 0 200 140)
   * 시침 = (시%12)*30 + 분*0.5 도, 분침 = 분*6 도, 12시가 위
   * ---------------------------------------------------------------- */
  function px(v) { return Math.round(v * 10) / 10; }

  function clockSVG(h, m) {
    var cx = 100, cy = 70, r = 55;
    var s = '<svg viewBox="0 0 200 140">';
    s += '<circle cx="100" cy="70" r="55" fill="none" style="stroke:#4cc9f0;stroke-width:3"/>';
    var i, a, x1, y1, x2, y2;
    for (i = 0; i < 12; i++) {
      a = i * 30 * Math.PI / 180;
      var o1 = r - 3, o2 = (i % 3 === 0) ? r - 12 : r - 8;
      x1 = cx + o1 * Math.sin(a); y1 = cy - o1 * Math.cos(a);
      x2 = cx + o2 * Math.sin(a); y2 = cy - o2 * Math.cos(a);
      s += '<line x1="' + px(x1) + '" y1="' + px(y1) + '" x2="' + px(x2) + '" y2="' + px(y2) +
        '" style="stroke:#4cc9f0;stroke-width:' + ((i % 3 === 0) ? 3 : 2) + '"/>';
    }
    /* 12 · 3 · 6 · 9 숫자 */
    var nums = [[12, 0], [3, 90], [6, 180], [9, 270]];
    for (i = 0; i < nums.length; i++) {
      a = nums[i][1] * Math.PI / 180;
      var nx = cx + (r - 22) * Math.sin(a), ny = cy - (r - 22) * Math.cos(a);
      s += '<text x="' + px(nx) + '" y="' + px(ny + 5) + '" font-size="14" fill="#e8ecff" text-anchor="middle">' + nums[i][0] + '</text>';
    }
    /* 시침 */
    var ha = ((h % 12) * 30 + m * 0.5) * Math.PI / 180;
    s += '<line x1="100" y1="70" x2="' + px(cx + 28 * Math.sin(ha)) + '" y2="' + px(cy - 28 * Math.cos(ha)) +
      '" style="stroke:#ffd166;stroke-width:3;stroke-linecap:round"/>';
    /* 분침 */
    var ma = (m * 6) * Math.PI / 180;
    s += '<line x1="100" y1="70" x2="' + px(cx + 42 * Math.sin(ma)) + '" y2="' + px(cy - 42 * Math.cos(ma)) +
      '" style="stroke:#f72585;stroke-width:2;stroke-linecap:round"/>';
    s += '<circle cx="100" cy="70" r="3" fill="#ffd166"/>';
    s += '</svg>';
    return s;
  }

  /* ------------------------------------------------------------------
   * clock — 시계 읽기 (calc, minLv 6)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('clock', {
    name: '시계 읽기', icon: '🕒', skill: 'calc', minLv: 6, maxLv: 100
  }, function (lv, R) {
    var step;
    if (lv < 12) step = 30;
    else if (lv < 20) step = 15;
    else if (lv < 40) step = 5;
    else step = 1;
    var h = R.int(1, 12);
    var m = R.int(0, Math.floor(59 / step)) * step;
    if (m > 59) m = 55;

    /* lv 20 이상에서 가끔 "정각까지 몇 분?" */
    if (lv >= 20 && R.chance(0.25)) {
      if (m === 0) m = step === 1 ? R.int(1, 59) : step;
      var left = 60 - m;
      var lc = [], dl = [5, -5, 10, 1, -1, 15, 20, 2, 3], q;
      for (q = 0; q < dl.length; q++) {
        var cv = left + dl[q];
        if (cv > 0 && cv <= 59 && cv !== left) lc.push(cv + '분');
      }
      if (60 - left > 0 && 60 - left !== left) lc.push((60 - left) + '분');
      return {
        text: '시계를 봐! 다음 정각까지 몇 분 남았을까?',
        svg: clockSVG(h, m),
        answer: left + '분',
        choices: MQ.uniq4(left + '분', lc, R),
        explain: '지금은 ' + tstr(h, m) + '. 60 - ' + m + ' = ' + left + '분 남았어요.'
      };
    }

    var ans = tstr(h, m);
    var cands = [
      tstr(h + 1, m), tstr(h - 1, m),
      tstr(h, (m + 5) % 60), tstr(h, (m + 55) % 60),
      tstr(h, (m + 30) % 60), tstr(h + 1, (m + 5) % 60),
      tstr(h, (m + 10) % 60), tstr(h + 2, m)
    ];
    return {
      text: R.chance(0.5) ? '지금 몇 시 몇 분일까?' : '마을 시계탑이야. 지금 시각은?',
      svg: clockSVG(h, m),
      answer: ans,
      choices: MQ.uniq4(ans, cands, R),
      explain: '짧은 바늘은 ' + (((h % 12) === 0) ? 12 : (h % 12)) + '시를 지났고, 긴 바늘은 ' + m + '분을 가리켜요. 그래서 ' + ans + '.'
    };
  });

  /* ------------------------------------------------------------------
   * clockadd — 시간 계산 (calc, minLv 22)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('clockadd', {
    name: '시간 계산', icon: '⏳', skill: 'calc', minLv: 22, maxLv: 100
  }, function (lv, R) {
    var step = lv < 30 ? 5 : (lv < 50 ? 5 : 1);
    var h = R.int(1, 12), m = R.int(0, Math.floor(59 / step)) * step;
    var start = (h % 12) * 60 + m;
    var mode = R.int(0, 2);
    if (lv < 30) mode = R.int(0, 1);

    var gap;
    if (lv < 30) gap = R.pick([10, 15, 20, 30, 45]);
    else if (lv < 55) gap = R.pick([25, 35, 40, 45, 50, 55, 70, 90]);
    else gap = R.int(20, 190);

    if (mode === 0) {
      var t2 = start + gap;
      var ans = mm2str(t2);
      return {
        text: '지금 <b>' + mm2str(start) + '</b>. ' + dur(gap) + ' 뒤는 몇 시 몇 분?',
        answer: ans,
        choices: MQ.uniq4(ans, [mm2str(t2 + 60), mm2str(t2 - 60), mm2str(t2 + 5), mm2str(t2 - 10), mm2str(t2 + 30), mm2str(start + 100)], R),
        explain: mm2str(start) + '에서 ' + dur(gap) + ' 지나면 ' + E(ans)
      };
    }
    if (mode === 1) {
      var t3 = start + gap;
      var ansd = dur(gap);
      var c = [dur(gap + 10), dur(gap + 60), dur(Math.max(5, gap - 10)), dur(gap + 5), dur(Math.max(5, gap - 30)), dur(gap + 15)];
      return {
        text: '용사가 <b>' + mm2str(start) + '</b>에 출발해 <b>' + mm2str(t3) + '</b>에 도착했어. 걸린 시간은?',
        answer: ansd,
        choices: MQ.uniq4(ansd, c, R),
        explain: mm2str(start) + '부터 ' + mm2str(t3) + '까지는 ' + E(ansd)
      };
    }
    var t4 = start - gap;
    var ansb = mm2str(t4);
    return {
      text: '지금 <b>' + mm2str(start) + '</b>. ' + dur(gap) + ' 전은 몇 시 몇 분?',
      answer: ansb,
      choices: MQ.uniq4(ansb, [mm2str(t4 + 60), mm2str(t4 - 60), mm2str(start + gap), mm2str(t4 + 10), mm2str(t4 - 5), mm2str(t4 + 30)], R),
      explain: mm2str(start) + '에서 ' + dur(gap) + ' 거꾸로 가면 ' + E(ansb)
    };
  });

  /* ------------------------------------------------------------------
   * cal — 달력 (calc, minLv 28)
   * ---------------------------------------------------------------- */
  function calTable(startDow, dim) {
    var s = '<table style="border-collapse:collapse;margin:0 auto;font-size:13px">';
    s += '<tr>';
    var i;
    for (i = 0; i < 7; i++) s += '<th style="padding:2px 6px;color:#9fb0ff">' + DOW[i].charAt(0) + '</th>';
    s += '</tr><tr>';
    for (i = 0; i < startDow; i++) s += '<td></td>';
    var col = startDow;
    for (var d = 1; d <= dim; d++) {
      s += '<td style="padding:2px 6px;text-align:center">' + d + '</td>';
      col++;
      if (col === 7 && d < dim) { s += '</tr><tr>'; col = 0; }
    }
    while (col > 0 && col < 7) { s += '<td></td>'; col++; }
    s += '</tr></table>';
    return s;
  }

  MQ.Gen.register('cal', {
    name: '달력', icon: '📅', skill: 'calc', minLv: 28, maxLv: 100
  }, function (lv, R) {
    var mode = R.int(0, lv < 40 ? 2 : (lv < 55 ? 3 : 4));

    if (mode === 0) {
      /* 그 달의 날수 */
      var mo = R.pick([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      var dim = MDAYS[mo - 1];
      return {
        text: '<b>' + mo + '월</b>은 며칠까지 있을까?',
        answer: dim + '일',
        choices: ['28일', '29일', '30일', '31일'],
        explain: mo + '월은 ' + dim + '일까지 있어요.'
      };
    }

    if (mode === 1) {
      /* 요일 더하기 */
      var d0 = R.int(0, 6);
      var add = lv < 40 ? R.int(3, 20) : R.int(10, 70);
      var d1 = (d0 + add) % 7;
      return {
        text: '오늘이 <b>' + DOW[d0] + '</b>이야. <b>' + add + '일</b> 뒤는 무슨 요일?',
        answer: DOW[d1],
        choices: MQ.uniq4(DOW[d1], [DOW[(d1 + 1) % 7], DOW[(d1 + 6) % 7], DOW[(d1 + 3) % 7], DOW[(d1 + 5) % 7], DOW[(d1 + 2) % 7]], R),
        explain: add + '을 7로 나눈 나머지는 ' + (add % 7) + '. ' + DOW[d0] + '에서 ' + (add % 7) + '칸 가면 ' + E(DOW[d1])
      };
    }

    if (mode === 2) {
      /* 달력 표 보고 요일 맞히기 */
      var st = R.int(0, 6);
      var dm = R.pick([28, 30, 31]);
      var day = R.int(8, dm);
      var w = (st + day - 1) % 7;
      return {
        text: '이 달 <b>' + day + '일</b>은 무슨 요일일까?',
        sub: calTable(st, dm),
        answer: DOW[w],
        choices: MQ.uniq4(DOW[w], [DOW[(w + 1) % 7], DOW[(w + 6) % 7], DOW[(w + 4) % 7], DOW[(w + 2) % 7], DOW[(w + 5) % 7]], R),
        explain: '1일이 ' + DOW[st] + '이니까 ' + day + '일은 ' + E(DOW[w])
      };
    }

    if (mode === 3) {
      /* 몇 번째 무슨 요일은 며칠? */
      var st2 = R.int(0, 6);
      var dm2 = R.pick([28, 30, 31]);
      var target = R.int(0, 6);
      var first = ((target - st2) + 7) % 7 + 1;   // 그 달 첫 target 요일
      var nth = R.int(1, 3);
      var dayN = first + (nth - 1) * 7;
      if (dayN > dm2) { nth = 1; dayN = first; }
      var nthName = ['첫째', '둘째', '셋째'][nth - 1];
      return {
        text: '이 달의 <b>' + nthName + ' ' + DOW[target] + '</b>은 며칠일까?',
        sub: calTable(st2, dm2),
        answer: dayN + '일',
        choices: MQ.uniq4(dayN + '일', [(dayN + 7) + '일', (dayN - 7) + '일', (dayN + 1) + '일', (dayN - 1) + '일', (dayN + 14) + '일'], R),
        explain: '첫 ' + DOW[target] + '이 ' + first + '일이니까 ' + nthName + '는 ' + E(dayN + '일')
      };
    }

    /* mode 4: 윤년 2월 */
    var yr = R.pick([1996, 2000, 2004, 2008, 2012, 2016, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2028, 2030, 2100]);
    var d2 = daysIn(yr, 2);
    return {
      text: '<b>' + yr + '년 2월</b>은 며칠까지 있을까?',
      answer: d2 + '일',
      choices: ['28일', '29일', '30일', '31일'],
      explain: yr + '년은 ' + (isLeap(yr) ? '윤년이라 2월이 29일' : '윤년이 아니라 2월이 28일') + '까지예요.'
    };
  });

  /* ------------------------------------------------------------------
   * prob1 — 확률 기초 (prob, minLv 36)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('prob1', {
    name: '확률', icon: '🎲', skill: 'prob', minLv: 36, maxLv: 100
  }, function (lv, R) {
    if (R.chance(0.5)) {
      /* 주머니 속 구슬 — 브루트포스로 세기 */
      var names = ['빨강', '파랑', '노랑'];
      var cnt = [R.int(1, 5), R.int(1, 5), lv < 50 ? 0 : R.int(1, 4)];
      var bag = [], i, j;
      for (i = 0; i < 3; i++) for (j = 0; j < cnt[i]; j++) bag.push(i);
      var total = bag.length;
      if (total < 3) { bag.push(0); cnt[0]++; total++; }
      var pickIdx = R.int(0, cnt[2] > 0 ? 2 : 1);
      var hit = 0;
      for (i = 0; i < total; i++) if (bag[i] === pickIdx) hit++;
      if (hit === total) { bag.push(pickIdx === 0 ? 1 : 0); cnt[pickIdx === 0 ? 1 : 0]++; total++; }
      var desc = [];
      for (i = 0; i < 3; i++) if (cnt[i] > 0) desc.push(names[i] + ' 구슬 ' + cnt[i] + '개');
      var ans = frac(hit, total);
      var extra = [];
      for (i = 0; i < 3; i++) if (i !== pickIdx && cnt[i] > 0) extra.push(frac(cnt[i], total));
      extra.push(frac(total - hit, total));
      return {
        text: '주머니에 ' + desc.join(', ') + '가 있어. 하나 꺼낼 때 <b>' + names[pickIdx] + '</b>일 확률은?',
        answer: ans,
        choices: fracChoices(hit, total, R, extra),
        explain: '전체 ' + total + '개 중 ' + J(names[pickIdx], '이', '가') + ' ' + hit + '개니까 ' + hit + '/' + total + ' = ' + E(ans)
      };
    }

    /* 주사위 — 1~6 브루트포스 */
    var evs = [
      { t: '짝수', f: function (v) { return v % 2 === 0; } },
      { t: '홀수', f: function (v) { return v % 2 === 1; } },
      { t: '4보다 큰 수', f: function (v) { return v > 4; } },
      { t: '3보다 작은 수', f: function (v) { return v < 3; } },
      { t: '3의 배수', f: function (v) { return v % 3 === 0; } },
      { t: '1', f: function (v) { return v === 1; } },
      { t: '2 이상 5 이하', f: function (v) { return v >= 2 && v <= 5; } }
    ];
    var ev = R.pick(evs);
    var c = 0;
    for (var v = 1; v <= 6; v++) if (ev.f(v)) c++;
    var a2 = frac(c, 6);
    return {
      text: '주사위 한 개를 굴렸어. <b>' + ev.t + '</b>' + (hasJong(ev.t) ? '이' : '가') + ' 나올 확률은?',
      answer: a2,
      choices: fracChoices(c, 6, R, [frac(6 - c, 6), frac(1, 6)]),
      explain: '눈 6가지 중 ' + c + '가지가 맞으니까 ' + c + '/6 = ' + E(a2)
    };
  });

  /* ------------------------------------------------------------------
   * prob2 — 확률 비교 (prob, minLv 64)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('prob2', {
    name: '확률 비교', icon: '⚖️', skill: 'prob', minLv: 64, maxLv: 100
  }, function (lv, R) {
    var LB = ['ㄱ', 'ㄴ', 'ㄷ'];
    var hit = [], tot = [], i, guard = 0;
    var best, ties;
    do {
      hit = []; tot = [];
      for (i = 0; i < 3; i++) {
        var h = R.int(1, 6), o = R.int(1, 6);
        hit.push(h); tot.push(h + o);
      }
      best = 0; ties = 0;
      for (i = 1; i < 3; i++) if (hit[i] * tot[best] > hit[best] * tot[i]) best = i;
      for (i = 0; i < 3; i++) if (hit[i] * tot[best] === hit[best] * tot[i]) ties++;
      guard++;
    } while (ties !== 1 && guard < 200);
    if (ties !== 1) { hit = [3, 1, 1]; tot = [4, 4, 8]; best = 0; }

    var desc = [];
    for (i = 0; i < 3; i++) {
      desc.push('<b>' + LB[i] + '</b> 상자: 당첨 ' + hit[i] + '개 / 전체 ' + tot[i] + '개');
    }
    var ans = LB[best] + ' 상자';
    return {
      text: '어느 상자에서 뽑아야 당첨이 가장 잘 나올까?',
      sub: desc.join(' &nbsp; '),
      answer: ans,
      choices: MQ.uniq4(ans, [LB[0] + ' 상자', LB[1] + ' 상자', LB[2] + ' 상자', '모두 같다'], R),
      explain: '당첨 확률은 ' + frac(hit[0], tot[0]) + ', ' + frac(hit[1], tot[1]) + ', ' + frac(hit[2], tot[2]) + '. ' + LB[best] + '이 가장 커요.'
    };
  });

  /* ------------------------------------------------------------------
   * count1 — 경우의 수(곱의 법칙) (prob, minLv 32)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('count1', {
    name: '경우의 수', icon: '👕', skill: 'prob', minLv: 32, maxLv: 100
  }, function (lv, R) {
    var sets = [
      { a: '티셔츠', b: '바지', act: '입는' },
      { a: '모자', b: '망토', act: '갖추는' },
      { a: '검', b: '방패', act: '드는' },
      { a: '빵', b: '음료', act: '고르는' }
    ];
    var s = R.pick(sets);
    var three = lv >= 50 && R.chance(0.5);
    var n1 = R.int(2, lv < 45 ? 5 : 7);
    var n2 = R.int(2, lv < 45 ? 5 : 7);
    var n3 = three ? R.int(2, 4) : 1;

    /* 브루트포스로 세기 */
    var cnt = 0, i, j, k;
    for (i = 0; i < n1; i++) for (j = 0; j < n2; j++) for (k = 0; k < n3; k++) cnt++;

    var txt;
    if (three) {
      txt = s.a + ' ' + n1 + '가지, ' + s.b + ' ' + n2 + '가지, 신발 ' + n3 + '가지야. 모두 ' + s.act + ' 방법은 몇 가지?';
    } else {
      txt = s.a + ' ' + n1 + '가지와 ' + s.b + ' ' + n2 + '가지가 있어. 하나씩 ' + s.act + ' 방법은 몇 가지?';
    }
    return {
      text: txt,
      answer: String(cnt) + '가지',
      choices: MQ.uniq4(cnt + '가지', [(n1 + n2 + n3 - (three ? 0 : 1)) + '가지', (cnt + n1) + '가지', (cnt - n2) + '가지', (cnt + 2) + '가지', (cnt * 2) + '가지', (cnt + 1) + '가지'], R),
      explain: (three ? (n1 + ' × ' + n2 + ' × ' + n3) : (n1 + ' × ' + n2)) + ' = ' + cnt + '가지예요.'
    };
  });

  /* ------------------------------------------------------------------
   * count2 — 경우의 수 심화 (prob, minLv 56)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('count2', {
    name: '경우의 수 심화', icon: '🔀', skill: 'prob', minLv: 56, maxLv: 100
  }, function (lv, R) {
    var mode = R.int(0, 2);

    if (mode === 0) {
      /* 줄 세우기 — 브루트포스 순열 세기 */
      var n = lv < 70 ? R.int(3, 4) : R.int(3, 5);
      var used = [], cnt = 0;
      (function perm(depth) {
        if (depth === n) { cnt++; return; }
        for (var i = 0; i < n; i++) {
          if (used[i]) continue;
          used[i] = 1; perm(depth + 1); used[i] = 0;
        }
      })(0);
      return {
        text: '용사 <b>' + n + '명</b>을 한 줄로 세우는 방법은 몇 가지?',
        answer: cnt + '가지',
        choices: MQ.uniq4(cnt + '가지', [(cnt / n) + '가지', (cnt * 2) + '가지', (cnt + n) + '가지', (n * n) + '가지', (cnt - n) + '가지', (cnt + 6) + '가지'], R),
        explain: n + '명이면 ' + n + ' × ' + (n - 1) + ' × … × 1 = ' + cnt + '가지예요.'
      };
    }

    if (mode === 1) {
      /* 뽑기(조합) — 브루트포스 */
      var m = R.int(4, lv < 70 ? 6 : 8);
      var r = R.int(2, 3);
      if (r >= m) r = 2;
      var c = 0, i, j, k;
      if (r === 2) {
        for (i = 0; i < m; i++) for (j = i + 1; j < m; j++) c++;
      } else {
        for (i = 0; i < m; i++) for (j = i + 1; j < m; j++) for (k = j + 1; k < m; k++) c++;
      }
      return {
        text: '동료 <b>' + m + '명</b> 중 <b>' + r + '명</b>을 뽑는 방법은 몇 가지? (순서 상관없음)',
        answer: c + '가지',
        choices: MQ.uniq4(c + '가지', [(c * 2) + '가지', (c + m) + '가지', (m * r) + '가지', (c - 1) + '가지', (c + 1) + '가지', (c * r) + '가지'], R),
        explain: m + '명 중 ' + r + '명을 고르는 경우는 모두 ' + c + '가지예요.'
      };
    }

    /* 세 자리 수 만들기 — 브루트포스 */
    var pool = R.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], lv < 70 ? 4 : 5);
    var withZero = false, q;
    for (q = 0; q < pool.length; q++) if (pool[q] === 0) withZero = true;
    var made = 0, a, b, cc;
    for (a = 0; a < pool.length; a++) {
      if (pool[a] === 0) continue;
      for (b = 0; b < pool.length; b++) {
        if (b === a) continue;
        for (cc = 0; cc < pool.length; cc++) {
          if (cc === a || cc === b) continue;
          made++;
        }
      }
    }
    var sorted = pool.slice().sort(function (x, y) { return x - y; });
    return {
      text: '숫자 카드 <b>' + sorted.join(', ') + '</b>로 서로 다른 <b>세 자리 수</b>는 몇 개 만들 수 있을까?',
      answer: made + '개',
      choices: MQ.uniq4(made + '개', [(made + 6) + '개', (made - 6) + '개', (pool.length * pool.length * pool.length) + '개', (made + 12) + '개', (made - 12) + '개', (made + 1) + '개'], R),
      explain: (withZero ? '맨 앞에 0은 못 오니까 ' : '') + '모두 ' + made + '개예요.'
    };
  });

  /* ------------------------------------------------------------------
   * dice — 두 주사위 눈의 합 (prob, minLv 46)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('dice', {
    name: '주사위의 합', icon: '🎯', skill: 'prob', minLv: 46, maxLv: 100
  }, function (lv, R) {
    var s = R.int(3, 11);
    var cnt = 0, a, b;
    for (a = 1; a <= 6; a++) for (b = 1; b <= 6; b++) if (a + b === s) cnt++;

    if (lv >= 62 && R.chance(0.5)) {
      var ans = frac(cnt, 36);
      return {
        text: '주사위 두 개를 굴렸어. 눈의 합이 <b>' + s + '</b>일 확률은?',
        answer: ans,
        choices: fracChoices(cnt, 36, R, [frac(cnt, 12), frac(cnt + 1, 36), frac(1, 6)]),
        explain: '전체 36가지 중 합이 ' + s + '인 경우가 ' + cnt + '가지라 ' + cnt + '/36 = ' + E(ans)
      };
    }
    return {
      text: '주사위 두 개의 눈의 합이 <b>' + s + '</b>' + (hasJong(String(s)) ? '이' : '가') + ' 되는 경우는 몇 가지?',
      answer: cnt + '가지',
      choices: MQ.uniq4(cnt + '가지', [(cnt + 1) + '가지', (cnt - 1) + '가지', (cnt + 2) + '가지', (cnt * 2) + '가지', (12 - cnt) + '가지', (cnt + 3) + '가지'], R),
      explain: '(1,' + (s - 1) + ')처럼 짝을 모두 세면 ' + cnt + '가지예요.'
    };
  });

  /* ------------------------------------------------------------------
   * avg — 평균 (calc, minLv 42)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('avg', {
    name: '평균', icon: '📊', skill: 'calc', minLv: 42, maxLv: 100
  }, function (lv, R) {
    var n = lv < 55 ? R.int(3, 4) : R.int(4, 5);
    var mean = lv < 55 ? R.int(6, 20) : R.int(20, 60);
    var spread = Math.max(2, Math.min(8, Math.floor(mean / 3)));
    var nums, sum, last, i, guard = 0;
    do {
      nums = []; sum = 0;
      for (i = 0; i < n - 1; i++) {
        var v = mean + R.int(-spread, spread);
        if (v < 1) v = 1;
        nums.push(v); sum += v;
      }
      last = mean * n - sum;
      guard++;
    } while ((last < 1 || last > mean + spread * 2) && guard < 100);
    if (last < 1) { last = 1; nums[0] = nums[0] + (mean * n - sum - 1); if (nums[0] < 1) nums[0] = 1; }
    nums.push(last);
    sum = 0;
    for (i = 0; i < n; i++) sum += nums[i];
    mean = sum / n;
    if (mean !== Math.floor(mean)) {   /* 안전망: 항상 정수 평균 */
      var fix = Math.ceil(sum / n) * n - sum;
      nums[n - 1] += fix; sum += fix; last = nums[n - 1];
      mean = sum / n;
    }

    var unit = R.pick(['점', '개', '마리']);
    if (R.chance(0.5) || lv < 50) {
      return {
        text: '점수가 ' + nums.join(', ') + (hasJong(String(nums[n - 1])) ? '이야' : '야') + '. 평균은?',
        answer: String(mean),
        choices: MQ.mkChoices(mean, R, { spread: Math.max(2, Math.round(mean * 0.2)), min: 0 }),
        explain: '모두 더하면 ' + sum + ', ' + n + '로 나누면 ' + E(mean)
      };
    }
    /* 빠진 값 구하기 */
    var hidden = nums[n - 1];
    var shown = nums.slice(0, n - 1);
    return {
      text: n + '번 사냥해서 평균 <b>' + mean + '</b>' + unit + '을 잡았어. ' + shown.join(', ') + '이면 마지막은?',
      answer: String(hidden),
      choices: MQ.mkChoices(hidden, R, { spread: Math.max(2, Math.round(Math.abs(hidden) * 0.25)), min: 0 }),
      explain: '전체 합은 ' + mean + ' × ' + n + ' = ' + sum + '. 여기서 ' + (sum - hidden) + '을 빼면 ' + E(hidden)
    };
  });

  /* ------------------------------------------------------------------
   * ratio — 비율·백분율 (calc, minLv 54)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('ratio', {
    name: '비율과 %', icon: '％', skill: 'calc', minLv: 54, maxLv: 100
  }, function (lv, R) {
    var mode = R.int(0, 2);

    if (mode === 0) {
      /* ~의 몇 % */
      var p = R.pick([10, 20, 25, 30, 40, 50, 60, 75]);
      var base = R.pick([200, 400, 500, 800, 1000, 1200, 1600, 2000]);
      var val = base * p / 100;
      return {
        text: '<b>' + base + '골드</b>의 <b>' + p + '%</b>는 몇 골드?',
        answer: val + '골드',
        choices: MQ.uniq4(val + '골드', [(val + base / 10) + '골드', (val * 2) + '골드', (base - val) + '골드', (val / 2) + '골드', (val + 100) + '골드'], R),
        explain: base + ' × ' + p + ' ÷ 100 = ' + val + '골드예요.'
      };
    }

    if (mode === 1) {
      /* 할인가 */
      var d = R.pick([10, 20, 25, 30, 40, 50]);
      var price = R.pick([400, 600, 800, 1000, 1200, 2000, 2400]);
      var off = price * d / 100;
      var pay = price - off;
      return {
        text: '<b>' + price + '골드</b>짜리 물약을 <b>' + d + '% 할인</b>하면 얼마?',
        answer: pay + '골드',
        choices: MQ.uniq4(pay + '골드', [off + '골드', (price - off / 2) + '골드', (pay - 100) + '골드', (pay + 100) + '골드', (price + off) + '골드'], R),
        explain: '할인액은 ' + off + '골드. ' + price + ' - ' + off + ' = ' + pay + '골드예요.'
      };
    }

    /* 몇 %인가 */
    var tot = R.pick([20, 25, 40, 50, 80, 100, 200]);
    var part = Math.round(tot * R.pick([0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75]));
    if (part === 0) part = Math.round(tot / 4);
    var pct = Math.round(part * 100 / tot);
    return {
      text: '몬스터 <b>' + tot + '마리</b> 중 <b>' + part + '마리</b>를 잡았어. 몇 %?',
      answer: pct + '%',
      choices: MQ.uniq4(pct + '%', [(100 - pct) + '%', (pct + 10) + '%', (pct - 10) + '%', (pct * 2) + '%', (pct + 5) + '%'], R),
      explain: part + ' ÷ ' + tot + ' × 100 = ' + pct + '%예요.'
    };
  });

  /* ------------------------------------------------------------------
   * speed — 빠르기 (calc, minLv 60)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('speed', {
    name: '빠르기', icon: '🐉', skill: 'calc', minLv: 60, maxLv: 100
  }, function (lv, R) {
    var who = R.pick(['드래곤', '늑대', '전령 새', '마법 화살']);
    var v = R.pick([3, 4, 5, 6, 8, 10, 12, 15, 20]);
    var t = R.pick([4, 5, 6, 8, 10, 12, 15, 20]);
    var d = v * t;
    var mode = R.int(0, 2);

    if (mode === 0) {
      return {
        text: J(who, '이', '가') + ' <b>초속 ' + v + 'm</b>로 <b>' + t + '초</b> 움직였어. 몇 m 갔을까?',
        answer: d + 'm',
        choices: MQ.uniq4(d + 'm', [(d + v) + 'm', (d - v) + 'm', (v + t) + 'm', (d * 2) + 'm', (d + 10) + 'm', (d - 10) + 'm'], R),
        explain: '거리 = 속력 × 시간 = ' + v + ' × ' + t + ' = ' + d + 'm예요.'
      };
    }
    if (mode === 1) {
      return {
        text: J(who, '이', '가') + ' <b>' + d + 'm</b>를 <b>' + t + '초</b>에 갔어. 초속 몇 m?',
        answer: '초속 ' + v + 'm',
        choices: MQ.uniq4('초속 ' + v + 'm', ['초속 ' + (v + 1) + 'm', '초속 ' + (v - 1) + 'm', '초속 ' + (v * 2) + 'm', '초속 ' + t + 'm', '초속 ' + (v + 5) + 'm', '초속 ' + (v + 2) + 'm'], R),
        explain: '속력 = 거리 ÷ 시간 = ' + d + ' ÷ ' + t + ' = 초속 ' + v + 'm예요.'
      };
    }
    return {
      text: J(who, '이', '가') + ' <b>초속 ' + v + 'm</b>로 <b>' + d + 'm</b>를 갔어. 몇 초 걸렸을까?',
      answer: t + '초',
      choices: MQ.uniq4(t + '초', [(t + 1) + '초', (t - 1) + '초', (t * 2) + '초', v + '초', (t + 5) + '초', (t + 2) + '초'], R),
      explain: '시간 = 거리 ÷ 속력 = ' + d + ' ÷ ' + v + ' = ' + t + '초예요.'
    };
  });

  /* ------------------------------------------------------------------
   * money — 물건값과 거스름돈 (calc, minLv 10)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('money', {
    name: '상점 계산', icon: '💰', skill: 'calc', minLv: 10, maxLv: 100
  }, function (lv, R) {
    var items = [['빨간 물약', 30], ['파란 물약', 50], ['나무 검', 70], ['가죽 방패', 60], ['빵', 20], ['밧줄', 40]];
    var it = R.pick(items);
    var unit, n, total;

    if (lv < 20) {
      unit = it[1];
      n = R.int(2, 4);
      total = unit * n;
      return {
        text: J(it[0], '은', '는') + ' <b>' + unit + '골드</b>. ' + n + '개 사면 얼마?',
        answer: total + '골드',
        choices: MQ.uniq4(total + '골드', [(total + unit) + '골드', (total - unit) + '골드', (unit + n) + '골드', (total + 10) + '골드', (total - 10) + '골드'], R),
        explain: unit + ' × ' + n + ' = ' + total + '골드예요.'
      };
    }

    if (lv < 40 || R.chance(0.5)) {
      /* 거스름돈 */
      unit = it[1] * (lv < 40 ? 1 : R.int(2, 9));
      n = R.int(2, 4);
      total = unit * n;
      var payList = [100, 200, 500, 1000, 2000, 5000];
      var pay = 0;
      for (var i = 0; i < payList.length; i++) if (payList[i] > total) { pay = payList[i]; break; }
      if (!pay) pay = Math.ceil((total + 1) / 1000) * 1000;
      var chg = pay - total;
      return {
        text: it[0] + '(' + unit + '골드) ' + n + '개를 사고 <b>' + pay + '골드</b>를 냈어. 거스름돈은?',
        answer: chg + '골드',
        choices: MQ.uniq4(chg + '골드', [(chg + 10) + '골드', (chg - 10) + '골드', total + '골드', (chg + 100) + '골드', (pay - unit) + '골드', (chg + 50) + '골드'], R),
        explain: '물건값 ' + total + '골드. ' + pay + ' - ' + total + ' = ' + chg + '골드예요.'
      };
    }

    /* 두 종류 사기 */
    var it2 = R.pick(items);
    var g2 = 0;
    while (it2 === it && g2++ < 20) it2 = R.pick(items);
    var u1 = it[1] * R.int(2, 8), u2 = it2[1] * R.int(2, 8);
    var n1 = R.int(2, 5), n2 = R.int(2, 5);
    total = u1 * n1 + u2 * n2;
    return {
      text: it[0] + ' ' + u1 + '골드 ' + n1 + '개, ' + it2[0] + ' ' + u2 + '골드 ' + n2 + '개. 모두 얼마?',
      answer: total + '골드',
      choices: MQ.uniq4(total + '골드', [(total + u1) + '골드', (total - u2) + '골드', (u1 * n2 + u2 * n1) + '골드', (total + 100) + '골드', (total - 100) + '골드'], R),
      explain: u1 + '×' + n1 + ' + ' + u2 + '×' + n2 + ' = ' + total + '골드예요.'
    };
  });

  /* ------------------------------------------------------------------
   * graph — 표와 그래프 읽기 (pattern, minLv 24)
   * ---------------------------------------------------------------- */
  var BARCOL = ['#ffd166', '#4cc9f0', '#f72585', '#7bd88f'];

  function barSVG(labels, vals) {
    var i, max = 0;
    for (i = 0; i < vals.length; i++) if (vals[i] > max) max = vals[i];
    if (max <= 0) max = 1;
    var base = 112, top = 22, span = base - top;
    var s = '<svg viewBox="0 0 200 140">';
    s += '<line x1="18" y1="' + base + '" x2="190" y2="' + base + '" style="stroke:#4cc9f0;stroke-width:2"/>';
    var w = 26, gap = (172 - vals.length * w) / (vals.length + 1);
    for (i = 0; i < vals.length; i++) {
      var x = 18 + gap + i * (w + gap);
      var h = Math.round(span * vals[i] / max);
      if (h < 4) h = 4;
      s += '<path d="M' + px(x) + ',' + base + ' L' + px(x) + ',' + px(base - h) +
        ' L' + px(x + w) + ',' + px(base - h) + ' L' + px(x + w) + ',' + base + ' Z" fill="' + BARCOL[i % 4] + '"/>';
      s += '<text x="' + px(x + w / 2) + '" y="' + px(base - h - 5) + '" font-size="14" fill="#e8ecff" text-anchor="middle">' + vals[i] + '</text>';
      s += '<text x="' + px(x + w / 2) + '" y="' + (base + 17) + '" font-size="14" fill="#e8ecff" text-anchor="middle">' + labels[i] + '</text>';
    }
    s += '</svg>';
    return s;
  }

  MQ.Gen.register('graph', {
    name: '그래프 읽기', icon: '📈', skill: 'pattern', minLv: 24, maxLv: 100
  }, function (lv, R) {
    var setList = [
      { title: '몬스터를 잡은 수', labels: ['슬', '박', '늑', '용'], full: ['슬라임', '박쥐', '늑대', '용'] },
      { title: '모은 보석 수', labels: ['빨', '파', '초', '노'], full: ['빨강', '파랑', '초록', '노랑'] },
      { title: '요일별 훈련 시간', labels: ['월', '화', '수', '목'], full: ['월요일', '화요일', '수요일', '목요일'] }
    ];
    var st = R.pick(setList);
    var hi = lv < 40 ? 9 : (lv < 70 ? 20 : 40);
    var vals = [], seen = {}, guard = 0;
    while (vals.length < 4 && guard++ < 500) {
      var v = R.int(1, hi);
      if (seen[v]) continue;
      seen[v] = 1; vals.push(v);
    }
    while (vals.length < 4) vals.push(vals.length + 1);

    var i, maxI = 0, minI = 0, sum = 0;
    for (i = 0; i < 4; i++) { sum += vals[i]; if (vals[i] > vals[maxI]) maxI = i; if (vals[i] < vals[minI]) minI = i; }

    var mode = R.int(0, lv < 40 ? 1 : 2);
    var svg = barSVG(st.labels, vals);

    if (mode === 0) {
      return {
        text: '<b>' + st.title + '</b> — 가장 많은 건?',
        svg: svg,
        answer: st.full[maxI],
        choices: MQ.uniq4(st.full[maxI], [st.full[0], st.full[1], st.full[2], st.full[3]], R),
        explain: J(st.full[maxI], '이', '가') + ' ' + vals[maxI] + '로 가장 많아요.'
      };
    }
    if (mode === 1) {
      var d = vals[maxI] - vals[minI];
      return {
        text: '<b>' + st.title + '</b> — 가장 많은 것과 가장 적은 것의 차이는?',
        svg: svg,
        answer: String(d),
        choices: MQ.mkChoices(d, R, { spread: Math.max(2, Math.round(d * 0.5) + 1), min: 0 }),
        explain: vals[maxI] + ' - ' + vals[minI] + ' = ' + E(d)
      };
    }
    return {
      text: '<b>' + st.title + '</b> — 모두 합하면?',
      svg: svg,
      answer: String(sum),
      choices: MQ.mkChoices(sum, R, { spread: Math.max(3, Math.round(sum * 0.2)), min: 0 }),
      explain: vals.join(' + ') + ' = ' + E(sum)
    };
  });

  /* ------------------------------------------------------------------
   * logicnum — 수 추리 (pattern, minLv 50)
   * ---------------------------------------------------------------- */
  MQ.Gen.register('logicnum', {
    name: '수 추리', icon: '🕵️', skill: 'pattern', minLv: 50, maxLv: 100
  }, function (lv, R) {
    var mode = R.int(0, lv < 65 ? 1 : 2);
    var big, small, sum, diff;

    if (mode === 0) {
      /* 합과 차 */
      var hi = lv < 65 ? 30 : 80;
      small = R.int(2, hi);
      diff = R.int(2, hi) ;
      if (diff % 2 !== 0) diff += 1;
      big = small + diff;
      if ((big + small) % 2 !== 0) { big += 1; diff += 1; }
      sum = big + small;
      var askBig = R.chance(0.5);
      var ans = askBig ? big : small;
      return {
        text: '두 수의 합은 <b>' + sum + '</b>, 차는 <b>' + diff + '</b>' + (hasJong(String(diff)) ? '이야' : '야') + '. ' + (askBig ? '큰 수' : '작은 수') + '는?',
        answer: String(ans),
        choices: MQ.mkChoices(ans, R, { spread: Math.max(3, Math.round(ans * 0.3) + 1), min: 0 }),
        explain: '(합 + 차) ÷ 2 = ' + big + '이 큰 수, 남은 ' + small + '이 작은 수예요.'
      };
    }

    if (mode === 1) {
      /* 역산 */
      var x = R.int(3, lv < 65 ? 20 : 60);
      var mul = R.int(2, lv < 65 ? 5 : 9);
      var add = R.int(1, lv < 65 ? 20 : 50);
      var res = x * mul + add;
      return {
        text: '어떤 수에 <b>' + mul + '</b>을 곱하고 <b>' + add + '</b>을 더했더니 <b>' + res + '</b>이 됐어. 어떤 수는?',
        answer: String(x),
        choices: MQ.mkChoices(x, R, { spread: Math.max(2, Math.round(x * 0.4) + 1), min: 0 }),
        explain: res + ' - ' + add + ' = ' + (res - add) + ', ' + (res - add) + ' ÷ ' + mul + ' = ' + E(x)
      };
    }

    /* 합과 배수 관계 */
    var k = R.int(2, 4);
    small = R.int(3, 30);
    big = small * k;
    sum = big + small;
    var askB = R.chance(0.5);
    var an2 = askB ? big : small;
    return {
      text: '두 수의 합은 <b>' + sum + '</b>이고 큰 수는 작은 수의 <b>' + k + '배</b>야. ' + (askB ? '큰 수' : '작은 수') + '는?',
      answer: String(an2),
      choices: MQ.mkChoices(an2, R, { spread: Math.max(3, Math.round(an2 * 0.3) + 1), min: 0 }),
      explain: '작은 수를 1묶음으로 보면 모두 ' + (k + 1) + '묶음. ' + sum + ' ÷ ' + (k + 1) + ' = ' + small + '이 작은 수예요.'
    };
  });

})();
