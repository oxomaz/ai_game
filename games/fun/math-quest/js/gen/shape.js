/* =====================================================================
 * shape.js — 도형·공간 문제 생성기 (skill: 'shape')
 * 순수 ES5. width=/height= 속성은 SVG 안에서 절대 쓰지 않는다(stroke-width 도 style 로).
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  var CY = '#4cc9f0', YE = '#ffd166', PK = '#f72585', GR = '#7bd88f', TX = '#e8ecff';

  /* ---------- SVG 도우미 ---------- */
  function svg(inner) { return '<svg viewBox="0 0 200 140">' + inner + '</svg>'; }
  function P(d, stroke, fill, w, extra) {
    return '<path d="' + d + '" style="fill:' + (fill || 'none') +
      ';stroke:' + (stroke || CY) + ';stroke-width:' + (w || 2.5) +
      ';stroke-linejoin:round;stroke-linecap:round' + (extra ? ';' + extra : '') + '"/>';
  }
  function L(x1, y1, x2, y2, stroke, w, extra) {
    return P('M' + r(x1) + ' ' + r(y1) + 'L' + r(x2) + ' ' + r(y2), stroke, 'none', w, extra);
  }
  function boxD(x, y, w, h) {
    return 'M' + r(x) + ' ' + r(y) + 'H' + r(x + w) + 'V' + r(y + h) + 'H' + r(x) + 'Z';
  }
  function T(x, y, s, anchor, color) {
    return '<text x="' + r(x) + '" y="' + r(y) + '" font-size="14" fill="' + (color || TX) +
      '" text-anchor="' + (anchor || 'middle') + '">' + s + '</text>';
  }
  function dot(x, y, color, rad) {
    return '<circle cx="' + r(x) + '" cy="' + r(y) + '" r="' + (rad || 5) + '" style="fill:' + (color || PK) + '"/>';
  }
  function r(n) { return Math.round(n * 10) / 10; }
  function polyD(pts) {
    var d = 'M' + r(pts[0][0]) + ' ' + r(pts[0][1]), i;
    for (i = 1; i < pts.length; i++) d += 'L' + r(pts[i][0]) + ' ' + r(pts[i][1]);
    return d + 'Z';
  }
  function regPoly(cx, cy, rad, n, rot) {
    var pts = [], i, a;
    for (i = 0; i < n; i++) {
      a = -Math.PI / 2 + (rot || 0) * Math.PI / 180 + i * 2 * Math.PI / n;
      pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
    }
    return pts;
  }
  function centroid(pts) {
    var sx = 0, sy = 0, i;
    for (i = 0; i < pts.length; i++) { sx += pts[i][0]; sy += pts[i][1]; }
    return [sx / pts.length, sy / pts.length];
  }
  function inward(pt, c, f) {
    return [pt[0] + (c[0] - pt[0]) * f, pt[1] + (c[1] - pt[1]) * f];
  }
  /* 밑변 길이 L, 두 밑각 A,B(도)인 삼각형 좌표 (화면에 맞게 축소) */
  function triPts(A, B) {
    var ta = Math.tan(A * Math.PI / 180), tb = Math.tan(B * Math.PI / 180);
    var Ln = 150, d = Ln * tb / (ta + tb), h = d * ta;
    if (h > 74) { var k = 74 / h; Ln = Ln * k; d = d * k; h = 74; }
    var x0 = 100 - Ln / 2;
    return [[x0, 116], [x0 + Ln, 116], [x0 + d, 116 - h]];
  }
  /* 입체(직육면체) 그림 */
  function isoBox(labW, labD, labH) {
    var x0 = 58, y0 = 112, w = 68, h = 54, dx = 22, dy = 18;
    var s = '';
    s += P(boxD(x0, y0 - h, w, h), CY, 'none', 2.5);
    s += P(polyD([[x0, y0 - h], [x0 + dx, y0 - h - dy], [x0 + w + dx, y0 - h - dy], [x0 + w, y0 - h]]), CY, 'none', 2.5);
    s += P(polyD([[x0 + w, y0], [x0 + w + dx, y0 - dy], [x0 + w + dx, y0 - h - dy], [x0 + w, y0 - h]]), CY, 'none', 2.5);
    s += T(x0 + w / 2, y0 + 20, labW, 'middle', YE);
    s += T(x0 - 6, y0 - h / 2 + 5, labH, 'end', YE);
    s += T(x0 + w + dx + 4, y0 - dy - 6, labD, 'start', YE);
    return svg(s);
  }

  /* =================================================================
   * 1. shname — 도형 이름·성질
   * ================================================================= */
  var SHAPES = [
    { n: 3, name: '삼각형' }, { n: 4, name: '사각형' }, { n: 5, name: '오각형' },
    { n: 6, name: '육각형' }, { n: 7, name: '칠각형' }, { n: 8, name: '팔각형' }
  ];

  MQ.Gen.register('shname', {
    name: '도형 이름', icon: '🔷', skill: 'shape', minLv: 1, maxLv: 100
  }, function (lv, R) {
    var top = lv < 10 ? 2 : (lv < 26 ? 3 : 5);
    var s = SHAPES[R.int(0, top)];
    var names = [], i;
    for (i = 0; i < SHAPES.length; i++) if (SHAPES[i].name !== s.name) names.push(SHAPES[i].name);
    var mode = R.int(0, 2);

    if (mode === 0) {
      return {
        text: '이 도형의 이름은?',
        svg: svg(P(polyD(regPoly(100, 72, 48, s.n, s.n === 4 ? 45 : 0)), CY, 'none', 2.5) +
          T(100, 132, '변 ' + s.n + '개', 'middle', YE)),
        answer: s.name,
        choices: MQ.uniq4(s.name, names, R),
        explain: '변이 ' + s.n + '개인 도형은 ' + s.name + '이에요.'
      };
    }
    if (mode === 1) {
      var ask = R.chance(0.5) ? '변' : '꼭짓점';
      return {
        text: '<b>' + s.name + '</b>의 ' + ask + '은 몇 개?',
        svg: svg(P(polyD(regPoly(100, 70, 48, s.n, s.n === 4 ? 45 : 0)), CY, 'none', 2.5)),
        answer: String(s.n),
        choices: MQ.mkChoices(s.n, R, { spread: 3, min: 3, max: 10 }),
        explain: s.name + '은 변도 ' + s.n + '개, 꼭짓점도 ' + s.n + '개예요.'
      };
    }
    return {
      text: '꼭짓점이 <b>' + s.n + '개</b>인 도형의 이름은?',
      answer: s.name,
      choices: MQ.uniq4(s.name, names, R),
      explain: '꼭짓점이 ' + s.n + '개면 변도 ' + s.n + '개, 바로 ' + s.name + '이에요.'
    };
  });

  /* =================================================================
   * 2. anglekind — 각의 종류
   * ================================================================= */
  MQ.Gen.register('anglekind', {
    name: '각의 종류', icon: '📐', skill: 'shape', minLv: 14, maxLv: 100
  }, function (lv, R) {
    var kinds = ['예각', '직각', '둔각'];
    var kind = R.pick(kinds), deg;
    if (kind === '예각') deg = R.int(20, 75);
    else if (kind === '직각') deg = 90;
    else deg = R.int(105, 165);

    var vx = 100, vy = 116, len = 84, rad = 26;
    var ax = vx + len, ay = vy;
    var rd = deg * Math.PI / 180;
    var bx = vx + len * Math.cos(rd), by = vy - len * Math.sin(rd);
    var s = L(vx, vy, ax, ay, CY, 3) + L(vx, vy, bx, by, CY, 3);
    if (deg === 90) {
      s += P('M' + (vx + 16) + ' ' + vy + 'V' + (vy - 16) + 'H' + vx, YE, 'none', 2);
    } else {
      s += P('M' + r(vx + rad) + ' ' + vy + 'A' + rad + ' ' + rad + ' 0 0 0 ' +
        r(vx + rad * Math.cos(rd)) + ' ' + r(vy - rad * Math.sin(rd)), YE, 'none', 2);
    }
    if (lv < 24) {
      var mx = vx + 46 * Math.cos(rd / 2), my = vy - 46 * Math.sin(rd / 2);
      s += T(mx, my + 4, deg + '°', 'middle', YE);
    }
    s += dot(vx, vy, PK, 3.5);

    return {
      text: '그림의 각은 어떤 각일까?',
      svg: svg(s),
      answer: kind,
      choices: MQ.uniq4(kind, ['예각', '직각', '둔각', '평각'], R),
      explain: deg + '도는 ' + (deg < 90 ? '0도보다 크고 직각(90도)보다 작으니 예각' :
        (deg === 90 ? '딱 직각' : '직각보다 크고 180도보다 작으니 둔각')) + '이에요.'
    };
  });

  /* =================================================================
   * 3. perim — 둘레
   * ================================================================= */
  MQ.Gen.register('perim', {
    name: '둘레', icon: '🧵', skill: 'shape', minLv: 20, maxLv: 100
  }, function (lv, R) {
    var big = lv < 40 ? 12 : (lv < 65 ? 25 : 60);
    var kind = lv < 30 ? R.int(0, 1) : R.int(0, 2);
    var s, ans, text, ex;

    if (kind === 0) { /* 직사각형 */
      var a = R.int(3, big), b = R.int(3, big);
      if (a === b) b = b + 1;
      var w = 106, h = Math.max(40, Math.min(80, 106 * b / a));
      if (b > a) { h = 80; w = Math.max(44, 80 * a / b); }
      var x0 = 62 + (106 - w) / 2, y0 = 62 - h / 2;
      s = svg(P(boxD(x0, y0, w, h), CY, 'none', 2.5) +
        T(100, y0 + h + 20, a + ' cm', 'middle', YE) +
        T(x0 - 6, y0 + h / 2 + 5, b + ' cm', 'end', YE));
      ans = 2 * (a + b);
      text = '이 직사각형의 둘레는 몇 cm?';
      ex = '(' + a + ' + ' + b + ') × 2 = ' + ans + ' cm 예요.';
    } else if (kind === 1) { /* 정사각형 */
      var c = R.int(3, big);
      s = svg(P(boxD(64, 18, 88, 88), CY, 'none', 2.5) +
        T(108, 128, c + ' cm', 'middle', YE));
      ans = 4 * c;
      text = '한 변이 <b>' + c + ' cm</b>인 정사각형의 둘레는?';
      ex = c + ' × 4 = ' + ans + ' cm 예요. 정사각형은 네 변이 모두 같아요.';
    } else { /* 삼각형 */
      var p = R.int(4, big), q = R.int(4, big), t = R.int(Math.max(Math.abs(p - q) + 1, 4), p + q - 1);
      var pts = [[28, 112], [172, 112], [28 + 144 * p / (p + q), 26]];
      s = svg(P(polyD(pts), CY, 'none', 2.5) +
        T(100, 132, t + ' cm', 'middle', YE) +
        T(48, 66, p + ' cm', 'end', YE) +
        T(154, 66, q + ' cm', 'start', YE));
      ans = p + q + t;
      text = '이 삼각형의 둘레는 몇 cm?';
      ex = p + ' + ' + q + ' + ' + t + ' = ' + ans + ' cm 예요.';
    }
    return {
      text: text, svg: s, answer: String(ans),
      choices: MQ.mkChoices(ans, R, { spread: Math.max(2, Math.round(ans * 0.2)), min: 1 }),
      explain: ex
    };
  });

  /* =================================================================
   * 4. angle — 각도 구하기
   * ================================================================= */
  MQ.Gen.register('angle', {
    name: '각도', icon: '📏', skill: 'shape', minLv: 24, maxLv: 100
  }, function (lv, R) {
    var mode = lv < 38 ? 0 : (lv < 52 ? R.int(0, 1) : R.int(1, 2));

    if (mode === 0) { /* 일직선 */
      var a = R.int(20, 160), ans = 180 - a;
      var vx = 100, vy = 104, rd = (180 - a) * Math.PI / 180;
      var s = L(16, vy, 184, vy, CY, 3) +
        L(vx, vy, vx + 78 * Math.cos(rd), vy - 78 * Math.sin(rd), CY, 3) +
        T(vx - 30, vy - 12, a + '°', 'middle', YE) +
        T(vx + 32, vy - 12, '□', 'middle', PK) + dot(vx, vy, PK, 3.5);
      return {
        text: '□에 알맞은 각도는?',
        svg: svg(s), answer: String(ans),
        choices: MQ.mkChoices(ans, R, { spread: 12, min: 1, max: 179 }),
        explain: '일직선은 180°니까 180 - ' + a + ' = ' + ans + '° 예요.'
      };
    }
    if (mode === 1) { /* 삼각형 내각의 합 */
      var A = 50, B = 60, gd = 0, tA, tB;
      while (gd++ < 60) {
        A = R.int(28, 62); B = R.int(28, Math.min(62, 140 - A));
        tA = Math.tan(A * Math.PI / 180); tB = Math.tan(B * Math.PI / 180);
        if (150 * tA * tB / (tA + tB) <= 104) break;
        A = 50; B = 60;
      }
      var C = 180 - A - B;
      var pts = triPts(A, B), c0 = centroid(pts);
      var deg = [A, B, C], hide = R.int(0, 2), s2 = P(polyD(pts), CY, 'none', 2.5), i, lp;
      var anch = ['start', 'end', 'middle'];
      for (i = 0; i < 3; i++) {
        lp = inward(pts[i], c0, i === 2 ? 0.44 : 0.26);
        s2 += T(lp[0], lp[1] + (i === 2 ? 8 : -2), i === hide ? '□' : deg[i] + '°', anch[i], i === hide ? PK : YE);
      }
      var kn = [];
      for (i = 0; i < 3; i++) if (i !== hide) kn.push(deg[i]);
      return {
        text: '□에 알맞은 각도는?',
        svg: svg(s2), answer: String(deg[hide]),
        choices: MQ.mkChoices(deg[hide], R, { spread: 12, min: 1, max: 178 }),
        explain: '삼각형 세 각의 합은 180°니까 180 - ' + kn[0] + ' - ' + kn[1] + ' = ' + deg[hide] + '° 예요.'
      };
    }
    /* 사각형 내각의 합 */
    var q1 = R.int(50, 130), q2 = R.int(50, 130), q3 = R.int(50, Math.min(130, 350 - q1 - q2));
    var q4 = 360 - q1 - q2 - q3;
    if (q4 < 20) { q3 = q3 - (20 - q4); q4 = 20; }
    var qp = [[28, 114], [172, 114], [150, 28], [56, 28]], cq = centroid(qp);
    var dg = [q1, q2, q3, q4], hd = R.int(0, 3), s3 = P(polyD(qp), CY, 'none', 2.5), j, p2;
    for (j = 0; j < 4; j++) {
      p2 = inward(qp[j], cq, 0.3);
      s3 += T(p2[0], p2[1] + 5, j === hd ? '□' : dg[j] + '°', 'middle', j === hd ? PK : YE);
    }
    var kk = [];
    for (j = 0; j < 4; j++) if (j !== hd) kk.push(dg[j]);
    return {
      text: '□에 알맞은 각도는?',
      svg: svg(s3), answer: String(dg[hd]),
      choices: MQ.mkChoices(dg[hd], R, { spread: 15, min: 1, max: 300 }),
      explain: '사각형 네 각의 합은 360°니까 360 - ' + kk[0] + ' - ' + kk[1] + ' - ' + kk[2] + ' = ' + dg[hd] + '° 예요.'
    };
  });

  /* =================================================================
   * 5. symm — 대칭
   * ================================================================= */
  var SYMS = [
    { name: '정삼각형', ax: 3, pts: regPoly(100, 74, 48, 3) },
    { name: '정사각형', ax: 4, pts: [[58, 28], [142, 28], [142, 112], [58, 112]] },
    { name: '직사각형', ax: 2, pts: [[34, 40], [166, 40], [166, 100], [34, 100]] },
    { name: '마름모', ax: 2, pts: [[100, 22], [156, 70], [100, 118], [44, 70]] },
    { name: '정오각형', ax: 5, pts: regPoly(100, 72, 47, 5) },
    { name: '정육각형', ax: 6, pts: regPoly(100, 70, 47, 6) },
    { name: '평행사변형', ax: 0, pts: [[30, 104], [124, 104], [170, 40], [76, 40]] },
    { name: '이등변삼각형', ax: 1, pts: [[38, 112], [162, 112], [100, 26]] }
  ];

  MQ.Gen.register('symm', {
    name: '대칭', icon: '🦋', skill: 'shape', minLv: 26, maxLv: 100
  }, function (lv, R) {
    var pool = lv < 40 ? SYMS.slice(0, 4) : SYMS;
    var s = R.pick(pool);
    if (lv >= 46 && R.chance(0.4)) {
      var names = [], i;
      for (i = 0; i < SYMS.length; i++) if (SYMS[i].ax !== s.ax) names.push(SYMS[i].name);
      return {
        text: '대칭축이 <b>' + s.ax + '개</b>인 도형은?',
        answer: s.name,
        choices: MQ.uniq4(s.name, names, R),
        explain: s.name + '은 접었을 때 완전히 겹치는 선이 ' + s.ax + '개예요.'
      };
    }
    return {
      text: '이 도형의 대칭축은 몇 개?',
      svg: svg(P(polyD(s.pts), CY, 'none', 2.5) + T(100, 134, s.name, 'middle', YE)),
      answer: String(s.ax),
      choices: MQ.uniq4(String(s.ax), ['0', '1', '2', '3', '4', '5', '6', '8'], R),
      explain: s.name + '은 반으로 접어 꼭 겹치는 선이 ' + s.ax + '개예요.'
    };
  });

  /* =================================================================
   * 6. area — 넓이
   * ================================================================= */
  MQ.Gen.register('area', {
    name: '넓이', icon: '🟦', skill: 'shape', minLv: 28, maxLv: 100
  }, function (lv, R) {
    var big = lv < 40 ? 9 : (lv < 60 ? 15 : 30);
    var kind = lv < 34 ? R.int(0, 1) : (lv < 46 ? R.int(0, 2) : R.int(0, 3));
    var s, ans, text, ex;

    if (kind === 0) { /* 직사각형 */
      var a = R.int(3, big), b = R.int(2, big);
      if (a === b) b = b + 1;
      var w = 106, h = 76;
      if (a > b) h = Math.max(38, 106 * b / a); else w = Math.max(44, 76 * a / b);
      var x0 = 62 + (106 - w) / 2, y0 = 58 - h / 2;
      s = svg(P(boxD(x0, y0, w, h), CY, 'none', 2.5) +
        T(100, y0 + h + 22, a + ' cm', 'middle', YE) +
        T(x0 - 6, y0 + h / 2 + 5, b + ' cm', 'end', YE));
      ans = a * b;
      text = '이 직사각형의 넓이는? (cm²)';
      ex = a + ' × ' + b + ' = ' + ans + ' cm² 예요.';
    } else if (kind === 1) { /* 정사각형 */
      var c = R.int(3, big);
      s = svg(P(boxD(64, 18, 88, 88), CY, 'none', 2.5) + T(108, 128, c + ' cm', 'middle', YE));
      ans = c * c;
      text = '한 변이 <b>' + c + ' cm</b>인 정사각형의 넓이는? (cm²)';
      ex = c + ' × ' + c + ' = ' + ans + ' cm² 예요.';
    } else if (kind === 2) { /* 삼각형 */
      var bs = R.int(3, big), ht = R.int(2, big);
      if ((bs * ht) % 2 === 1) ht = ht + 1;
      var apex = R.int(72, 128);
      s = svg(P(polyD([[30, 110], [170, 110], [apex, 26]]), CY, 'none', 2.5) +
        L(apex, 26, apex, 110, GR, 2, 'stroke-dasharray:5 4') +
        P('M' + apex + ' 100H' + (apex + 10) + 'V110', YE, 'none', 2) +
        T(100, 132, '밑변 ' + bs + ' cm', 'middle', YE) +
        T(apex + (apex < 100 ? 8 : -8), 98, '높이 ' + ht, apex < 100 ? 'start' : 'end', GR));
      ans = bs * ht / 2;
      text = '이 삼각형의 넓이는? (cm²)';
      ex = '밑변 × 높이 ÷ 2 = ' + bs + ' × ' + ht + ' ÷ 2 = ' + ans + ' cm² 예요.';
    } else { /* 평행사변형 */
      var pb = R.int(4, big), ph = R.int(3, big);
      s = svg(P(polyD([[26, 108], [128, 108], [174, 32], [72, 32]]), CY, 'none', 2.5) +
        L(128, 32, 128, 108, GR, 2, 'stroke-dasharray:5 4') +
        P('M128 98H138V108', YE, 'none', 2) +
        T(77, 130, '밑변 ' + pb + ' cm', 'middle', YE) +
        T(120, 98, '높이 ' + ph, 'end', GR));
      ans = pb * ph;
      text = '이 평행사변형의 넓이는? (cm²)';
      ex = '밑변 × 높이 = ' + pb + ' × ' + ph + ' = ' + ans + ' cm² 예요.';
    }
    return {
      text: text, svg: s, answer: String(ans),
      choices: MQ.mkChoices(ans, R, { spread: Math.max(2, Math.round(ans * 0.3)), min: 1 }),
      explain: ex
    };
  });

  /* =================================================================
   * 7. cube — 쌓기나무 개수
   * ================================================================= */
  MQ.Gen.register('cube', {
    name: '쌓기나무', icon: '🧊', skill: 'shape', minLv: 32, maxLv: 100
  }, function (lv, R) {
    if (lv < 46 || R.chance(0.5)) { /* 층별 개수 세기 */
      var n = lv < 40 ? 2 : 3, i, cnt = [], sum = 0;
      var topN = lv < 40 ? 6 : 8;
      for (i = 0; i < n; i++) cnt.push(R.int(1, topN - i * 2 > 1 ? topN - i * 2 : 2));
      cnt.sort(function (a, b) { return b - a; });
      var s = '', y, j, mx0 = cnt[0], subTxt = [];
      var sizeC = Math.min(20, Math.floor(142 / mx0) - 3);
      var step = sizeC + 3, gap = n === 2 ? 34 : 30;
      for (i = 0; i < n; i++) {
        y = 108 - sizeC - i * gap;
        s += T(14, y + sizeC - 4, (i + 1) + '층', 'start', YE);
        for (j = 0; j < cnt[i]; j++) {
          s += P(boxD(52 + j * step, y, sizeC, sizeC), CY, 'none', 2);
        }
        sum += cnt[i];
        subTxt.push((i + 1) + '층 ' + cnt[i] + '개');
      }
      return {
        text: '쌓기나무는 모두 몇 개?',
        sub: subTxt.join(' · '),
        svg: svg(s),
        answer: String(sum),
        choices: MQ.mkChoices(sum, R, { spread: 3, min: 1 }),
        explain: subTxt.join(' + ').replace(/개/g, '') + ' = ' + sum + '개예요.'
      };
    }
    /* 직육면체 모양 쌓기 */
    var a = R.int(2, 5), b = R.int(2, 4), c = R.int(2, 5);
    var total = a * b * c;
    return {
      text: '이렇게 쌓은 쌓기나무는 모두 몇 개?',
      svg: isoBox('가로 ' + a, '세로 ' + b, '높이 ' + c),
      answer: String(total),
      choices: MQ.mkChoices(total, R, { spread: Math.max(3, Math.round(total * 0.3)), min: 1 }),
      explain: a + ' × ' + b + ' × ' + c + ' = ' + total + '개예요.'
    };
  });

  /* =================================================================
   * 8. coord — 좌표
   * ================================================================= */
  function gridSvg(marks) {
    var ox = 40, oy = 118, st = 19, n = 5, s = '', i;
    for (i = 0; i <= n; i++) {
      s += L(ox, oy - i * st, ox + n * st, oy - i * st, CY, 1.2, 'stroke-opacity:0.55');
      s += L(ox + i * st, oy, ox + i * st, oy - n * st, CY, 1.2, 'stroke-opacity:0.55');
    }
    s += L(ox, oy, ox + n * st + 12, oy, CY, 2.5);
    s += L(ox, oy, ox, oy - n * st - 12, CY, 2.5);
    for (i = 0; i <= n; i++) {
      s += T(ox + i * st, oy + 16, String(i), 'middle', TX);
      if (i > 0) s += T(ox - 8, oy - i * st + 5, String(i), 'end', TX);
    }
    for (i = 0; i < marks.length; i++) {
      s += dot(ox + marks[i][0] * st, oy - marks[i][1] * st, marks[i][2] || PK, 5);
      if (marks[i][3]) s += T(ox + marks[i][0] * st + 10, oy - marks[i][1] * st - 8, marks[i][3], 'start', YE);
    }
    return svg(s);
  }
  function coordStr(x, y) { return '(' + x + ', ' + y + ')'; }

  MQ.Gen.register('coord', {
    name: '좌표', icon: '📍', skill: 'shape', minLv: 42, maxLv: 100
  }, function (lv, R) {
    var x = R.int(0, 5), y = R.int(0, 5);
    if (lv < 56 || R.chance(0.45)) {
      var ansA = coordStr(x, y);
      var cands = [coordStr(y, x), coordStr(x, (y + 1) % 6), coordStr((x + 1) % 6, y),
        coordStr((x + 2) % 6, y), coordStr(x, (y + 2) % 6)];
      var i, cl = [];
      for (i = 0; i < cands.length; i++) if (cands[i] !== ansA) cl.push(cands[i]);
      return {
        text: '점 ★의 좌표는?',
        svg: gridSvg([[x, y, PK, '★']]),
        answer: ansA,
        choices: MQ.uniq4(ansA, cl, R),
        explain: '오른쪽으로 ' + x + '칸, 위로 ' + y + '칸이니까 ' + ansA + '이에요.'
      };
    }
    /* 이동 */
    x = R.int(0, 3); y = R.int(0, 3);
    var mx = R.int(1, 5 - x), my = R.int(1, 5 - y);
    var nx = x + mx, ny = y + my, ansB = coordStr(nx, ny);
    var c2 = [coordStr(x, y), coordStr(ny, nx), coordStr(nx, y), coordStr(x, ny),
      coordStr(Math.min(5, nx + 1), ny), coordStr(nx, Math.max(0, ny - 1)),
      coordStr(Math.max(0, nx - 1), ny)], k, cl2 = [];
    for (k = 0; k < c2.length; k++) if (c2[k] !== ansB) cl2.push(c2[k]);
    return {
      text: '점 ★' + coordStr(x, y) + '를 오른쪽 ' + mx + '칸, 위로 ' + my + '칸 옮기면?',
      svg: gridSvg([[x, y, PK, '★']]),
      answer: ansB,
      choices: MQ.uniq4(ansB, cl2, R),
      explain: '가로 ' + x + '+' + mx + '=' + nx + ', 세로 ' + y + '+' + my + '=' + ny + ' → ' + ansB + '이에요.'
    };
  });

  /* =================================================================
   * 9. arealeft — 색칠한 부분의 넓이
   * ================================================================= */
  MQ.Gen.register('arealeft', {
    name: '색칠한 넓이', icon: '🎨', skill: 'shape', minLv: 46, maxLv: 100
  }, function (lv, R) {
    var big = lv < 60 ? 12 : 20;
    var W = R.int(6, big), H = R.int(5, big - 1);
    var w = R.int(2, Math.max(2, W - 3)), h = R.int(2, Math.max(2, H - 2));
    var ans = W * H - w * h;

    var px = 58, py = 24, pw = 110, ph = 84;
    var iw = Math.max(26, pw * w / W), ih = Math.max(22, ph * h / H);
    var ix = px + (pw - iw) / 2, iy = py + (ph - ih) / 2;
    var d = boxD(px, py, pw, ph) + ' ' + boxD(ix, iy, iw, ih);
    var s = P(d, CY, CY, 2.5, 'fill-rule:evenodd;fill-opacity:0.28');
    s += P(boxD(ix, iy, iw, ih), PK, 'none', 2.5);
    s += T(100, py + ph + 22, W + ' cm', 'middle', YE);
    s += T(px - 6, py + ph / 2 + 5, H + ' cm', 'end', YE);
    if (iw >= 46) s += T(ix + iw / 2, iy + ih / 2 + 5, w + '×' + h, 'middle', PK);

    return {
      text: '색칠한 부분의 넓이는? (cm²)',
      sub: '큰 직사각형 ' + W + '×' + H + ', 가운데 구멍 ' + w + '×' + h,
      svg: svg(s),
      answer: String(ans),
      choices: MQ.mkChoices(ans, R, { spread: Math.max(3, Math.round(ans * 0.25)), min: 1 }),
      explain: W + '×' + H + ' - ' + w + '×' + h + ' = ' + (W * H) + ' - ' + (w * h) + ' = ' + ans + ' cm² 예요.'
    };
  });

  /* =================================================================
   * 10. net — 전개도
   * ================================================================= */
  MQ.Gen.register('net', {
    name: '전개도', icon: '📦', skill: 'shape', minLv: 50, maxLv: 100
  }, function (lv, R) {
    var faces = R.shuffle(['가', '나', '다', '라', '마', '바']);
    /* 십자 전개도: 띠 4칸 = f0 f1 f2 f3, f4 는 f1 위, f5 는 f1 아래 */
    var f0 = faces[0], f1 = faces[1], f2 = faces[2], f3 = faces[3], f4 = faces[4], f5 = faces[5];
    var pairs = {};
    pairs[f0] = f2; pairs[f2] = f0;
    pairs[f1] = f3; pairs[f3] = f1;
    pairs[f4] = f5; pairs[f5] = f4;

    var cs = 30, sx = 25, sy = 55, s = '', i;
    var strip = [f0, f1, f2, f3];
    for (i = 0; i < 4; i++) {
      s += P(boxD(sx + i * cs, sy, cs, cs), CY, 'none', 2.2);
      s += T(sx + i * cs + cs / 2, sy + cs / 2 + 5, strip[i], 'middle', TX);
    }
    s += P(boxD(sx + cs, sy - cs, cs, cs), CY, 'none', 2.2);
    s += T(sx + cs * 1.5, sy - cs / 2 + 5, f4, 'middle', TX);
    s += P(boxD(sx + cs, sy + cs, cs, cs), CY, 'none', 2.2);
    s += T(sx + cs * 1.5, sy + cs * 1.5 + 5, f5, 'middle', TX);

    var ask = R.pick(faces), ansF = pairs[ask];
    var others = [], j;
    for (j = 0; j < faces.length; j++) if (faces[j] !== ask && faces[j] !== ansF) others.push(faces[j]);

    return {
      text: '정육면체를 접으면 <b>' + ask + '</b> 면과 마주보는 면은?',
      svg: svg(s),
      answer: ansF,
      choices: MQ.uniq4(ansF, others, R),
      explain: '전개도에서 한 칸 건너뛴 면끼리 마주봐요. 그래서 ' + ask + '의 맞은편은 ' + ansF + '예요.'
    };
  });

  /* =================================================================
   * 11. rotate — 도형 돌리기
   * ================================================================= */
  var DIRS = ['위쪽', '오른쪽', '아래쪽', '왼쪽'];

  MQ.Gen.register('rotate', {
    name: '도형 돌리기', icon: '🔄', skill: 'shape', minLv: 56, maxLv: 100
  }, function (lv, R) {
    var from = R.int(0, 3);
    var turns = [
      { t: '시계 방향으로 90도', k: 1 },
      { t: '시계 반대 방향으로 90도', k: 3 },
      { t: '180도', k: 2 }
    ];
    var tn = lv < 66 ? R.pick([turns[0], turns[2]]) : R.pick(turns);
    var to = (from + tn.k) % 4;
    var arrow = 'M100 22L134 68H114V116H86V68H66Z';
    var s = '<g transform="rotate(' + (from * 90) + ' 100 70)">' +
      P(arrow, TX, YE, 2.5) + '</g>' +
      T(100, 136, '지금은 ' + DIRS[from] + ' 방향', 'middle', GR);

    return {
      text: '화살표를 <b>' + tn.t + '</b> 돌리면 어느 쪽을 가리킬까?',
      svg: svg(s),
      answer: DIRS[to],
      choices: MQ.uniq4(DIRS[to], DIRS, R),
      explain: DIRS[from] + '을 가리키던 화살표를 ' + tn.t + ' 돌리면 ' + DIRS[to] + '을 가리켜요.'
    };
  });

  /* =================================================================
   * 12. volume — 부피
   * ================================================================= */
  MQ.Gen.register('volume', {
    name: '부피', icon: '📦', skill: 'shape', minLv: 66, maxLv: 100
  }, function (lv, R) {
    var mode = lv < 80 ? R.int(0, 1) : R.int(0, 2);
    if (mode === 0) {
      var a = R.int(3, 12), b = R.int(2, 10), c = R.int(2, 10);
      var v = a * b * c;
      return {
        text: '이 직육면체의 부피는? (cm³)',
        svg: isoBox(a + ' cm', b + ' cm', c + ' cm'),
        answer: String(v),
        choices: MQ.mkChoices(v, R, { spread: Math.max(4, Math.round(v * 0.25)), min: 1 }),
        explain: '가로 × 세로 × 높이 = ' + a + ' × ' + b + ' × ' + c + ' = ' + v + ' cm³ 예요.'
      };
    }
    if (mode === 1) {
      var e = R.int(2, 11), ve = e * e * e;
      return {
        text: '한 모서리가 <b>' + e + ' cm</b>인 정육면체의 부피는? (cm³)',
        svg: isoBox(e + ' cm', e + ' cm', e + ' cm'),
        answer: String(ve),
        choices: MQ.mkChoices(ve, R, { spread: Math.max(5, Math.round(ve * 0.3)), min: 1 }),
        explain: e + ' × ' + e + ' × ' + e + ' = ' + ve + ' cm³ 예요.'
      };
    }
    var p = R.int(3, 10), q = R.int(2, 9), hgt = R.int(2, 12), vol = p * q * hgt;
    return {
      text: '부피가 <b>' + vol + ' cm³</b>이고 밑면이 ' + p + ' cm × ' + q + ' cm인 직육면체의 높이는? (cm)',
      svg: isoBox(p + ' cm', q + ' cm', '□'),
      answer: String(hgt),
      choices: MQ.mkChoices(hgt, R, { spread: 4, min: 1 }),
      explain: vol + ' ÷ (' + p + ' × ' + q + ') = ' + vol + ' ÷ ' + (p * q) + ' = ' + hgt + ' cm 예요.'
    };
  });

  /* =================================================================
   * 13. tri3 — 삼각형이 되는 조건
   * ================================================================= */
  function setStr(a, b, c) { return a + ', ' + b + ', ' + c; }

  MQ.Gen.register('tri3', {
    name: '삼각형 조건', icon: '🔺', skill: 'shape', minLv: 72, maxLv: 100
  }, function (lv, R) {
    if (R.chance(0.5)) {
      /* 삼각형이 되는 세 변 고르기 */
      var a = R.int(3, 12), b = R.int(3, 12);
      var c = R.int(Math.abs(a - b) + 1, a + b - 1);
      var good = setStr(a, b, c);
      var bad = [], guard = 0;
      while (bad.length < 5 && guard++ < 200) {
        var x = R.int(2, 12), y = R.int(2, 12), z = x + y + R.int(0, 4);
        var arr = R.shuffle([x, y, z]);
        var st = setStr(arr[0], arr[1], arr[2]);
        if (st !== good && bad.indexOf(st) < 0) bad.push(st);
      }
      return {
        text: '삼각형을 만들 수 있는 세 변은?',
        answer: good,
        choices: MQ.uniq4(good, bad, R),
        explain: '가장 긴 변보다 나머지 두 변의 합이 커야 해요. ' + good + ' 은(는) 조건을 만족해요.'
      };
    }
    /* 나머지 한 변이 될 수 있는 길이 */
    var p = R.int(4, 14), q = R.int(4, 14);
    if (p === q) q = q + 1;
    var lo = Math.abs(p - q), hi = p + q;
    var ok = R.int(lo + 1, hi - 1);
    var wrong = [String(lo), String(hi), String(hi + R.int(1, 5)), String(hi + R.int(6, 10))];
    if (lo >= 2) wrong.push(String(lo - R.int(1, Math.min(3, lo - 1) || 1)));
    var i, wl = [];
    for (i = 0; i < wrong.length; i++) if (wrong[i] !== String(ok) && parseInt(wrong[i], 10) > 0) wl.push(wrong[i]);
    return {
      text: '두 변이 <b>' + p + ' cm</b>, <b>' + q + ' cm</b>일 때 나머지 한 변이 될 수 있는 길이는?',
      answer: String(ok),
      choices: MQ.uniq4(String(ok), wl, R),
      explain: '나머지 변은 ' + lo + '보다 크고 ' + hi + '보다 작아야 해요. 그래서 ' + ok + ' cm 예요.'
    };
  });
})();
