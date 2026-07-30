/* ══════════════════════════════════════════════════════════════
   카드팩 : 우주 여행 (태양계와 천체 16가지)

   행성은 쓸 수 있는 이모지가 🪐 하나뿐이라, 특징이 드러나도록
   SVG 로 직접 그렸습니다. 토성은 고리, 목성은 줄무늬와 대적점,
   화성은 극관, 명왕성은 하트 무늬처럼 실제 모습의 특징을 넣었습니다.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* 공통 조각들 — 모든 그림은 viewBox="0 0 100 100" 기준 */
  function shade(id) {   // 구(球)처럼 보이게 하는 명암
    return '<radialGradient id="s' + id + '" cx="34%" cy="30%" r="78%">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity=".45"/>' +
      '<stop offset="55%" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#000" stop-opacity=".42"/></radialGradient>';
  }
  function ball(id, r) {
    return '<circle cx="50" cy="50" r="' + r + '" fill="url(#s' + id + ')"/>';
  }
  function svg(inner) {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }

  var ART = {};

  /* ☀️ 태양 — 코로나 + 표면 알갱이 */
  ART['태양'] = svg(
    '<defs><radialGradient id="sunG" cx="50%" cy="50%" r="50%">' +
    '<stop offset="55%" stop-color="#fff6c8"/><stop offset="80%" stop-color="#ffb703"/>' +
    '<stop offset="100%" stop-color="#f4711f"/></radialGradient>' +
    '<radialGradient id="sunH" cx="50%" cy="50%" r="50%">' +
    '<stop offset="60%" stop-color="#ff9f1c" stop-opacity=".55"/>' +
    '<stop offset="100%" stop-color="#ff9f1c" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="50" cy="50" r="49" fill="url(#sunH)"/>' +
    '<circle cx="50" cy="50" r="33" fill="url(#sunG)"/>' +
    '<circle cx="38" cy="40" r="4" fill="#fff" opacity=".5"/>' +
    '<circle cx="60" cy="58" r="3" fill="#e8590c" opacity=".45"/>' +
    '<circle cx="45" cy="62" r="2.4" fill="#e8590c" opacity=".35"/>'
  );

  /* ☿ 수성 — 짙은 회갈색 + 크고 깊은 크레이터 (달과 헷갈리지 않게 어둡게) */
  ART['수성'] = svg(
    '<defs>' + shade(1) + '<clipPath id="me"><circle cx="50" cy="50" r="28"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="28" fill="#77706b"/>' +
    '<g clip-path="url(#me)">' +
    '<circle cx="38" cy="38" r="10" fill="#5d5854"/><circle cx="38" cy="38" r="6" fill="#6b655f"/>' +
    '<circle cx="62" cy="44" r="6" fill="#5d5854"/>' +
    '<circle cx="52" cy="66" r="8" fill="#5d5854"/><circle cx="52" cy="66" r="4.6" fill="#6b655f"/>' +
    '<circle cx="68" cy="62" r="4" fill="#625d58"/><circle cx="30" cy="58" r="4.6" fill="#625d58"/>' +
    '<circle cx="56" cy="28" r="3.4" fill="#625d58"/></g>' + ball(1, 28)
  );

  /* ♀ 금성 — 두꺼운 노란 구름 */
  ART['금성'] = svg(
    '<defs>' + shade(2) + '</defs>' +
    '<circle cx="50" cy="50" r="34" fill="#e8c37a"/>' +
    '<path d="M18 42q16-7 32-1t32-4" stroke="#f6dfae" stroke-width="6" fill="none" opacity=".8"/>' +
    '<path d="M20 56q16 7 32 1t30-5" stroke="#cfa055" stroke-width="5" fill="none" opacity=".7"/>' +
    '<path d="M24 68q14-5 28 0t24-2" stroke="#f6dfae" stroke-width="4" fill="none" opacity=".6"/>' +
    ball(2, 34)
  );

  /* 🌍 지구 — 파란 바다 + 초록 대륙 + 흰 구름 */
  ART['지구'] = svg(
    '<defs>' + shade(3) + '<clipPath id="e"><circle cx="50" cy="50" r="34"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="34" fill="#2b7fd4"/>' +
    '<g clip-path="url(#e)" fill="#3fa34d">' +
    '<path d="M22 34q10-6 18 0t4 12-10 10-14-4-2-14z"/>' +
    '<path d="M46 52q8-4 14 2t2 16-10 8-8-10 0-14z"/>' +
    '<path d="M62 26q12-2 16 6t-4 12-14 0-4-14z"/>' +
    '<path d="M30 66q8 2 10 8t-6 8-8-6 2-10z"/>' +
    '</g>' +
    '<g clip-path="url(#e)" fill="#fff" opacity=".55">' +
    '<ellipse cx="38" cy="26" rx="14" ry="4"/><ellipse cx="66" cy="60" rx="12" ry="3.5"/>' +
    '<ellipse cx="50" cy="78" rx="16" ry="4"/></g>' + ball(3, 34)
  );

  /* 🌕 달 — 아주 밝은 흰빛 + 넓고 옅은 '바다'(마리아) 무늬 */
  ART['달'] = svg(
    '<defs>' + shade(4) + '<clipPath id="mo"><circle cx="50" cy="50" r="34"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="34" fill="#f2f1ee"/>' +
    '<g clip-path="url(#mo)" fill="#cfcdc8">' +
    '<ellipse cx="38" cy="34" rx="14" ry="10"/><ellipse cx="60" cy="40" rx="9" ry="7"/>' +
    '<ellipse cx="56" cy="64" rx="15" ry="9"/><ellipse cx="31" cy="60" rx="7" ry="6"/></g>' +
    '<g clip-path="url(#mo)" fill="#bdbab5">' +
    '<circle cx="66" cy="66" r="3.4"/><circle cx="44" cy="48" r="2.6"/><circle cx="28" cy="42" r="2.4"/></g>' +
    ball(4, 34)
  );

  /* ♂ 화성 — 붉은 흙 + 흰 극관 */
  ART['화성'] = svg(
    '<defs>' + shade(5) + '<clipPath id="m"><circle cx="50" cy="50" r="33"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="33" fill="#c1440e"/>' +
    '<g clip-path="url(#m)">' +
    '<ellipse cx="50" cy="19" rx="15" ry="7" fill="#fff" opacity=".92"/>' +
    '<ellipse cx="50" cy="81" rx="12" ry="6" fill="#fff" opacity=".85"/>' +
    '<ellipse cx="38" cy="52" rx="11" ry="7" fill="#8f3009" opacity=".7"/>' +
    '<ellipse cx="64" cy="62" rx="8" ry="5" fill="#8f3009" opacity=".6"/>' +
    '<ellipse cx="62" cy="38" rx="6" ry="4" fill="#e2703a" opacity=".7"/></g>' + ball(5, 33)
  );

  /* ♃ 목성 — 가로 줄무늬 + 대적점 */
  ART['목성'] = svg(
    '<defs>' + shade(6) + '<clipPath id="j"><circle cx="50" cy="50" r="36"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="36" fill="#e0b083"/>' +
    '<g clip-path="url(#j)">' +
    '<rect x="14" y="22" width="72" height="8" fill="#c98f5f"/>' +
    '<rect x="14" y="34" width="72" height="6" fill="#f3ddc0"/>' +
    '<rect x="14" y="44" width="72" height="9" fill="#b8794a"/>' +
    '<rect x="14" y="57" width="72" height="6" fill="#f3ddc0"/>' +
    '<rect x="14" y="67" width="72" height="8" fill="#c98f5f"/>' +
    '<ellipse cx="63" cy="49" rx="11" ry="7" fill="#c0392b"/>' +
    '<ellipse cx="63" cy="49" rx="6" ry="3.6" fill="#e05a3f"/></g>' + ball(6, 36)
  );

  /* ♄ 토성 — 몸통 + 고리 */
  ART['토성'] = svg(
    '<defs>' + shade(7) + '</defs>' +
    '<ellipse cx="50" cy="52" rx="46" ry="15" fill="none" stroke="#c9a86a" stroke-width="7" opacity=".55"/>' +
    '<circle cx="50" cy="52" r="27" fill="#e8cf9a"/>' +
    '<rect x="23" y="44" width="54" height="4" fill="#cdae74" opacity=".8"/>' +
    '<rect x="23" y="58" width="54" height="3" fill="#cdae74" opacity=".7"/>' +
    '<path d="M4 52a46 15 0 0 0 92 0" fill="none" stroke="#efd9a6" stroke-width="7" opacity=".95"/>' +
    '<path d="M12 57a38 11 0 0 0 76 0" fill="none" stroke="#c9a86a" stroke-width="3" opacity=".8"/>' +
    ball(7, 27)
  );

  /* ⛢ 천왕성 — 청록색 + 누운 고리 */
  ART['천왕성'] = svg(
    '<defs>' + shade(8) + '</defs>' +
    '<ellipse cx="50" cy="50" rx="13" ry="43" fill="none" stroke="#9fd8e0" stroke-width="3" opacity=".55"/>' +
    '<circle cx="50" cy="50" r="30" fill="#8fd4e0"/>' +
    '<path d="M37 8a13 43 0 0 0 0 84" fill="none" stroke="#cbeef3" stroke-width="3" opacity=".9"/>' +
    ball(8, 30)
  );

  /* ♆ 해왕성 — 짙은 파랑 + 검은 점 */
  ART['해왕성'] = svg(
    '<defs>' + shade(9) + '<clipPath id="n"><circle cx="50" cy="50" r="30"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="30" fill="#2a5fd6"/>' +
    '<g clip-path="url(#n)">' +
    '<ellipse cx="42" cy="58" rx="9" ry="6" fill="#17337d"/>' +
    '<path d="M20 38q14-5 28 0t26-3" stroke="#9dc0ff" stroke-width="3" fill="none" opacity=".6"/>' +
    '<path d="M22 70q14 4 28 0t24-2" stroke="#9dc0ff" stroke-width="2.4" fill="none" opacity=".5"/></g>' +
    ball(9, 30)
  );

  /* 명왕성 — 갈회색 + 하트 무늬(톰보 지역) */
  ART['명왕성'] = svg(
    '<defs>' + shade(10) + '<clipPath id="p"><circle cx="50" cy="50" r="26"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="26" fill="#b49a80"/>' +
    '<g clip-path="url(#p)">' +
    '<ellipse cx="40" cy="34" rx="14" ry="8" fill="#8b7663" opacity=".7"/>' +
    '<path d="M50 74c-11-8-16-14-16-21 0-6 5-9 9-9 3 0 6 2 7 5 1-3 4-5 7-5 4 0 9 3 9 9 0 7-5 13-16 21z" fill="#f3e7d3"/>' +
    '</g>' + ball(10, 26)
  );

  /* ☄ 혜성 — 핵 + 꼬리 */
  ART['혜성'] = svg(
    '<defs><linearGradient id="ct" x1="1" y1="1" x2="0.15" y2="0.15">' +
    '<stop offset="0%" stop-color="#4dabf7" stop-opacity="0"/>' +
    '<stop offset="45%" stop-color="#74c0fc" stop-opacity=".75"/>' +
    '<stop offset="100%" stop-color="#1c7ed6" stop-opacity=".95"/></linearGradient></defs>' +
    '<path d="M72 28 98 98 26 62z" fill="url(#ct)"/>' +
    '<path d="M72 28 58 96 18 46z" fill="url(#ct)" opacity=".6"/>' +
    '<circle cx="72" cy="28" r="16" fill="#a5d8ff" opacity=".55"/>' +
    '<circle cx="72" cy="28" r="10" fill="#f1f9ff" stroke="#1c7ed6" stroke-width="1.6"/>' +
    '<circle cx="69" cy="25" r="3.4" fill="#fff"/>'
  );

  /* 소행성 — 울퉁불퉁한 돌덩이 */
  ART['소행성'] = svg(
    '<defs>' + shade(11) + '</defs>' +
    '<path d="M26 40 44 20l24 4 16 20-6 26-24 14-22-8-8-22z" fill="#8a8f96"/>' +
    '<circle cx="45" cy="40" r="7" fill="#70757b"/><circle cx="62" cy="52" r="5" fill="#767b81"/>' +
    '<circle cx="42" cy="62" r="6" fill="#70757b"/><circle cx="58" cy="32" r="3.4" fill="#7c8188"/>' +
    '<circle cx="34" cy="50" r="3" fill="#7c8188"/>' +
    '<path d="M26 40 44 20l24 4 16 20-6 26-24 14-22-8-8-22z" fill="url(#s11)"/>'
  );

  /* 은하 — 나선 */
  ART['은하'] = svg(
    '<defs><radialGradient id="gx" cx="50%" cy="50%" r="50%">' +
    '<stop offset="0%" stop-color="#fff8e1"/><stop offset="35%" stop-color="#e5c9ff" stop-opacity=".8"/>' +
    '<stop offset="100%" stop-color="#7048e8" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="50" cy="50" rx="46" ry="30" fill="url(#gx)" transform="rotate(-20 50 50)"/>' +
    '<g stroke="#e9dcff" fill="none" stroke-linecap="round" opacity=".95" transform="rotate(-20 50 50)">' +
    '<path d="M50 50q22-6 34 10" stroke-width="5"/><path d="M50 50q-22 6-34-10" stroke-width="5"/>' +
    '<path d="M50 50q10 16-6 26" stroke-width="3.4" opacity=".7"/>' +
    '<path d="M50 50q-10-16 6-26" stroke-width="3.4" opacity=".7"/></g>' +
    '<circle cx="50" cy="50" r="8" fill="#fff8e1"/>' +
    '<g fill="#fff"><circle cx="22" cy="24" r="1.6"/><circle cx="80" cy="30" r="1.4"/>' +
    '<circle cx="30" cy="76" r="1.5"/><circle cx="76" cy="74" r="1.3"/></g>'
  );

  /* 블랙홀 — 강착원반 + 검은 구멍 */
  ART['블랙홀'] = svg(
    '<defs><radialGradient id="bh" cx="50%" cy="50%" r="50%">' +
    '<stop offset="42%" stop-color="#ffca3a" stop-opacity="0"/>' +
    '<stop offset="62%" stop-color="#ff9f1c" stop-opacity=".95"/>' +
    '<stop offset="100%" stop-color="#c1440e" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="50" cy="54" rx="47" ry="16" fill="none" stroke="#ffb703" stroke-width="6" opacity=".75"/>' +
    '<circle cx="50" cy="50" r="46" fill="url(#bh)"/>' +
    '<circle cx="50" cy="50" r="34" fill="none" stroke="#ffd166" stroke-width="4" opacity=".85"/>' +
    '<circle cx="50" cy="50" r="27" fill="#0b0b12"/>' +
    '<path d="M3 54a47 16 0 0 0 94 0" fill="none" stroke="#ffe08a" stroke-width="6" opacity=".9"/>'
  );

  /* 유성 — 밤하늘을 가르는 별똥별 */
  ART['유성'] = svg(
    '<defs><linearGradient id="mt" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#ffe08a" stop-opacity="0"/>' +
    '<stop offset="100%" stop-color="#fff3bf"/></linearGradient></defs>' +
    '<g fill="#cbd5e1"><circle cx="18" cy="76" r="1.6"/><circle cx="30" cy="24" r="1.4"/>' +
    '<circle cx="78" cy="22" r="1.5"/><circle cx="84" cy="66" r="1.3"/></g>' +
    '<path d="M10 12 66 68" stroke="url(#mt)" stroke-width="9" stroke-linecap="round"/>' +
    '<circle cx="68" cy="70" r="13" fill="#ffec99" opacity=".4"/>' +
    '<circle cx="68" cy="70" r="7" fill="#fff9db"/>' +
    '<path d="M68 56v-9M68 93v-9M54 70h-9M91 70h-9" stroke="#fff3bf" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
  );

  var DATA = [
    ['태양',   '항성',     '스스로 빛나는 불덩이',        '지구 130만 개가 들어가는 크기. 표면이 약 5,500℃'],
    ['수성',   '행성',     '태양에서 가장 가까운 행성',    '낮은 430℃, 밤은 -180℃ 로 온도 차이가 가장 커요'],
    ['금성',   '행성',     '가장 뜨거운 행성',            '두꺼운 구름이 열을 가둬 470℃ 나 돼요'],
    ['지구',   '행성',     '우리가 사는 물의 행성',        '지금까지 알려진 생명이 사는 유일한 곳'],
    ['달',     '위성',     '지구를 도는 하나뿐인 위성',    '1969년 사람이 처음 발자국을 남긴 곳'],
    ['화성',   '행성',     '붉은 흙과 흰 극관의 행성',     '태양계에서 가장 높은 산 올림푸스가 있어요'],
    ['목성',   '행성',     '줄무늬와 커다란 대적점',       '지구 크기의 태풍이 400년째 불고 있어요'],
    ['토성',   '행성',     '아름다운 고리를 가진 행성',    '고리는 얼음과 돌조각으로 되어 있어요'],
    ['천왕성', '행성',     '누워서 도는 얼음 행성',        '옆으로 누운 채 태양을 돌아 고리가 세로로 보여요'],
    ['해왕성', '행성',     '가장 먼 바람의 행성',          '초속 600m 태양계에서 가장 빠른 바람'],
    ['명왕성', '왜소행성', '하트 무늬가 있는 얼음 세계',   '2006년부터 행성이 아닌 왜소행성이 되었어요'],
    ['혜성',   '천체',     '꼬리가 달린 얼음 덩어리',      '태양에 가까워지면 얼음이 녹아 꼬리가 생겨요'],
    ['소행성', '천체',     '화성과 목성 사이 돌덩이들',    '수십만 개가 띠를 이루어 태양을 돌아요'],
    ['은하',   '천체',     '별 수천억 개가 모인 나선',     '우리 은하에는 별이 약 2천억 개 있어요'],
    ['블랙홀', '천체',     '빛도 빠져나오지 못하는 곳',    '중력이 너무 강해서 빛조차 붙잡혀요'],
    ['유성',   '현상',     '밤하늘에 그려지는 별똥별',      '우주 먼지가 대기와 부딪혀 타는 빛이에요']
  ];

  window.MemoryPacks.add({
    id: 'planets',
    title: '우주 여행',
    emoji: '🪐',
    desc: '태양계와 우주 천체 16가지를 그림으로',
    back: ['#d0bfff', '#3b3b5c'],
    modes: [
      { id: 'same', title: '그림 ↔ 그림', a: 'art', b: 'art', hint: '같은 천체 두 장 찾기' },
      { id: 'name', title: '그림 ↔ 이름', a: 'art', b: 'name', hint: '천체와 이름 짝 맞추기' },
      { id: 'trait', title: '이름 ↔ 특징', a: 'name', b: 'trait', hint: '이름과 특징 짝 맞추기' }
    ],
    picField: 'art',
    fields: {
      art: { style: 'art' },
      name: { style: 'text' },
      trait: { style: 'sub' }
    },
    info: function (c) {
      return { head: c.name, rows: [['분류', c.kind], ['특징', c.trait]], note: c.note };
    },
    cards: DATA.map(function (r) {
      return { key: r[0], name: r[0], art: ART[r[0]], kind: r[1], trait: r[2], note: r[3] };
    })
  });
})();
