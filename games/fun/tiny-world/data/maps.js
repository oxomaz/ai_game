/* ===========================================================
   Tiny World - data/maps.js
   24x30 타일 섬. 지역 구획 · 지형 · 자원 배치 규칙.
   같은 씨앗(SEED)을 쓰므로 누가 해도 같은 섬이 나온다.

   섬 구조(위 → 아래)
     y 0~4    별빛 해안 (세계수 4단계에 열림, 포털)
     y 5~14   왼쪽=작은 숲(2단계) / 오른쪽=바위 언덕(3단계) / 가운데=통로
     y 15~29  시작 평원 (처음부터 열림, 집터·연못·세계수)
   =========================================================== */
window.TW = window.TW || {};

TW.MAP = {
  W: 24,
  H: 30,
  SEED: 20260730,

  /* 세계수: 이 줄의 좌우 1칸까지 단단하고, 그림은 위로 더 그려진다 */
  tree: { x: 12, y: 16 },

  /* 시작 위치 */
  start: { x: 12, y: 22 },

  /* 다음 세계로 가는 문(4단계에서 등장) */
  portal: { x: 12, y: 2 },

  /* 연못 타일 */
  pond: [
    [4, 23], [5, 23], [6, 23],
    [3, 24], [4, 24], [5, 24], [6, 24], [7, 24],
    [4, 25], [5, 25], [6, 25], [7, 25],
    [5, 26], [6, 26]
  ],

  /* 흙길(세계수까지 안내) */
  path: [
    [12, 17], [12, 18], [12, 19], [12, 20], [12, 21], [12, 22], [12, 23], [12, 24],
    [11, 22], [13, 22], [10, 22], [14, 22]
  ],

  /* 시작할 때 바로 눈에 보이는 자원 (1분 안에 첫 채집을 하도록) */
  starter: [
    ['tree', 9, 20], ['tree', 15, 20], ['tree', 9, 24], ['tree', 15, 24],
    ['tree', 10, 26], ['tree', 14, 19],
    ['rock', 11, 19], ['rock', 13, 19], ['rock', 10, 25], ['rock', 14, 26],
    ['rock', 16, 22], ['rock', 8, 22],
    ['bush', 10, 19], ['bush', 14, 25], ['bush', 11, 26], ['bush', 13, 26],
    ['flower', 9, 22], ['flower', 15, 21], ['berry', 16, 24]
  ]
};

/* 지역 정의. lock: 해금에 필요한 세계수 단계(0=처음부터 열림) */
TW.REGIONS = {
  plain:  { key: 'plain',  name: '시작 평원',   lock: 0, color: '#8ed86b', color2: '#7ecb5c' },
  forest: { key: 'forest', name: '작은 숲',     lock: 2, color: '#4faa5a', color2: '#43994f' },
  hill:   { key: 'hill',   name: '바위 언덕',   lock: 3, color: '#b3a894', color2: '#a89d88' },
  mist:   { key: 'mist',   name: '별빛 해안',   lock: 4, color: '#8fa6d8', color2: '#829ad0' }
};

/* 좌표 → 지역 키 */
TW.regionAt = function (x, y) {
  if (y <= 4) return 'mist';
  if (y <= 14) {
    if (x <= 10) return 'forest';
    if (x >= 14) return 'hill';
    return 'plain';
  }
  return 'plain';
};

/* 지형 종류: grass / forest / hill / mist / sand / water / path */
TW.terrainAt = function (x, y) {
  var M = TW.MAP;
  if (x < 0 || y < 0 || x >= M.W || y >= M.H) return 'ocean';
  for (var i = 0; i < M.pond.length; i++) if (M.pond[i][0] === x && M.pond[i][1] === y) return 'water';
  if (x === 0 || y === 0 || x === M.W - 1 || y === M.H - 1) return 'sand';
  for (var j = 0; j < M.path.length; j++) if (M.path[j][0] === x && M.path[j][1] === y) return 'path';
  var r = TW.regionAt(x, y);
  if (r === 'forest') return 'forest';
  if (r === 'hill') return 'hill';
  if (r === 'mist') return 'mist';
  return 'grass';
};

/* 통과할 수 없는 지형 */
TW.terrainSolid = function (t) { return t === 'water' || t === 'ocean'; };

/* 간단한 재현 가능 난수 (mulberry32) */
TW.rng = function (seed) {
  var a = seed >>> 0;
  return function () {
    a += 0x6D2B79F5;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* 지역별 자원 배치 개수 */
TW.SPAWN = {
  plain:  { tree: 26, rock: 22, bush: 22, berry: 8, flower: 12 },
  forest: { tree: 34, mushroom: 12, berry: 10, bush: 10, flower: 5 },
  hill:   { rock: 28, iron: 12, tree: 6, bush: 6 },
  mist:   { tree: 5, starrock: 4, flower: 4 }
};

/* 처음 게임을 시작할 때 자원 노드 목록을 만든다 */
TW.generateNodes = function () {
  var M = TW.MAP, rand = TW.rng(M.SEED), nodes = [], used = {};
  var nid = 1;

  function key(x, y) { return x + ',' + y; }
  function reserve(x, y) { used[key(x, y)] = true; }

  /* 예약 구역: 세계수 · 시작 광장 · 정령 자리 · 길 · 중앙 통로 */
  for (var dx = -2; dx <= 2; dx++) {
    for (var dy = -3; dy <= 2; dy++) reserve(M.tree.x + dx, M.tree.y + dy);
  }
  for (var sx = M.start.x - 2; sx <= M.start.x + 2; sx++) {
    for (var sy = M.start.y - 2; sy <= M.start.y + 2; sy++) reserve(sx, sy);
  }
  M.path.forEach(function (p) { reserve(p[0], p[1]); });
  for (var cy = 1; cy <= 16; cy++) reserve(12, cy);
  reserve(M.portal.x, M.portal.y);
  TW.SPIRIT_ORDER.forEach(function (k) {
    var sp = TW.SPIRITS[k].spot;
    for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) reserve(sp.x + a, sp.y + b);
  });

  /* 시작 자원 (정해진 자리) */
  M.starter.forEach(function (st) {
    if (used[key(st[1], st[2])]) return;
    used[key(st[1], st[2])] = true;
    nodes.push({ id: nid++, t: st[0], x: st[1], y: st[2], hp: TW.NODES[st[0]].hp, rt: 0 });
  });

  /* 연못 둘레 물 채집 지점 */
  [[2, 24], [3, 23], [4, 22], [8, 24], [7, 26], [5, 27]].forEach(function (p) {
    if (used[key(p[0], p[1])]) return;
    nodes.push({ id: nid++, t: 'water', x: p[0], y: p[1], hp: TW.NODES.water.hp, rt: 0 });
    reserve(p[0], p[1]);
  });

  Object.keys(TW.SPAWN).forEach(function (region) {
    var plan = TW.SPAWN[region];
    Object.keys(plan).forEach(function (type) {
      var want = plan[type], tries = 0;
      while (want > 0 && tries < 5000) {
        tries++;
        var x = Math.floor(rand() * M.W), y = Math.floor(rand() * M.H);
        if (TW.regionAt(x, y) !== region) continue;
        if (used[key(x, y)]) continue;
        var t = TW.terrainAt(x, y);
        if (t === 'water' || t === 'ocean' || t === 'path') continue;
        used[key(x, y)] = true;
        nodes.push({ id: nid++, t: type, x: x, y: y, hp: TW.NODES[type].hp, rt: 0 });
        want--;
      }
    });
  });

  return TW.ensureConnected(nodes);
};

/* 나무·돌이 우연히 벽을 만들어 길이 막히는 것을 방지한다.
   중요: 지역은 세계수 단계에 따라 차례로 열리므로, **해금 단계마다**
   그때 갈 수 있는 땅만으로 길이 이어져 있는지 확인해야 한다.
   (안 그러면 "숲은 열렸는데 숲 안쪽으로 못 들어가는" 상황이 생긴다.) */
TW.ensureConnected = function (nodes) {
  var M = TW.MAP;
  var STAGES = [
    { plain: 1 },
    { plain: 1, forest: 1 },
    { plain: 1, forest: 1, hill: 1 },
    { plain: 1, forest: 1, hill: 1, mist: 1 }
  ];
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function walkable(x, y, allow) {
    if (x < 0 || y < 0 || x >= M.W || y >= M.H) return false;
    if (!allow[TW.regionAt(x, y)]) return false;
    var t = TW.terrainAt(x, y);
    if (t === 'water' || t === 'ocean') return false;
    if (x === M.tree.x && y === M.tree.y) return false;   /* 세계수가 서 있는 칸 */
    return true;
  }

  STAGES.forEach(function (allow) {
    for (var guard = 0; guard < 400; guard++) {
      var solid = {};
      nodes.forEach(function (n) {
        if (TW.NODES[n.t].solid) solid[n.x + ',' + n.y] = n;
      });
      /* 시작 지점에서 걸어갈 수 있는 곳 */
      var seen = {}, q = [[M.start.x, M.start.y]], head = 0;
      seen[M.start.x + ',' + M.start.y] = true;
      while (head < q.length) {
        var c = q[head++];
        for (var i = 0; i < 4; i++) {
          var nx = c[0] + dirs[i][0], ny = c[1] + dirs[i][1], k = nx + ',' + ny;
          if (seen[k] || !walkable(nx, ny, allow) || solid[k]) continue;
          seen[k] = true; q.push([nx, ny]);
        }
      }
      /* 못 가는 땅 찾기 */
      var bad = null;
      for (var y = 0; y < M.H && !bad; y++) {
        for (var x = 0; x < M.W; x++) {
          var kk = x + ',' + y;
          if (seen[kk] || !walkable(x, y, allow) || solid[kk]) continue;
          bad = [x, y]; break;
        }
      }
      if (!bad) return;

      /* 갇힌 땅 덩어리 */
      var pocket = {}, pq = [bad], ph = 0;
      pocket[bad[0] + ',' + bad[1]] = true;
      while (ph < pq.length) {
        var pc = pq[ph++];
        for (var d2 = 0; d2 < 4; d2++) {
          var mx = pc[0] + dirs[d2][0], my = pc[1] + dirs[d2][1], mk = mx + ',' + my;
          if (pocket[mk] || !walkable(mx, my, allow) || solid[mk]) continue;
          pocket[mk] = true; pq.push([mx, my]);
        }
      }
      /* 갇힌 곳과 갈 수 있는 곳을 동시에 맞댄 자원을 치운다 → 길이 뚫린다 */
      var removeId = null;
      Object.keys(solid).forEach(function (sk) {
        if (removeId) return;
        var n = solid[sk], tp = false, ts = false;
        for (var d3 = 0; d3 < 4; d3++) {
          var ak = (n.x + dirs[d3][0]) + ',' + (n.y + dirs[d3][1]);
          if (pocket[ak]) tp = true;
          if (seen[ak]) ts = true;
        }
        if (tp && ts) removeId = n.id;
      });
      if (!removeId) {
        Object.keys(solid).forEach(function (sk) {
          if (removeId) return;
          var n = solid[sk];
          for (var d4 = 0; d4 < 4; d4++) {
            if (pocket[(n.x + dirs[d4][0]) + ',' + (n.y + dirs[d4][1])]) { removeId = n.id; return; }
          }
        });
      }
      if (!removeId) return;
      nodes = nodes.filter(function (n) { return n.id !== removeId; });
    }
  });
  return nodes;
};
