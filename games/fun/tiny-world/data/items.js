/* ===========================================================
   Tiny World - data/items.js
   아이템과 자원 노드(맵에 놓이는 채집 대상) 정의
   여기에 한 줄 추가하면 게임 전체(인벤토리·도감·제작)에 반영된다.
   =========================================================== */
window.TW = window.TW || {};

/* cat: res(자원) / tool(도구) / seed(씨앗) / special(특별) */
TW.ITEMS = {
  wood:      { name: '나무',     icon: '🪵', cat: 'res',     desc: '따뜻한 색의 통나무. 거의 모든 것의 시작.' },
  stone:     { name: '돌',       icon: '🪨', cat: 'res',     desc: '단단한 회색 돌. 튼튼한 도구를 만든다.' },
  grass:     { name: '풀',       icon: '🌿', cat: 'res',     desc: '푹신한 풀 다발. 씨앗이 숨어 있기도 하다.' },
  berry:     { name: '열매',     icon: '🍓', cat: 'res',     desc: '새콤달콤. 먹으면 활동력이 돌아온다.' },
  mushroom:  { name: '버섯',     icon: '🍄', cat: 'res',     desc: '숲 그늘에서 자란다. 정령들이 좋아한다.' },
  iron:      { name: '철광석',   icon: '🪙', cat: 'res',     desc: '돌 곡괭이가 있어야 캘 수 있는 반짝이는 광석.' },
  flower:    { name: '꽃',       icon: '🌸', cat: 'res',     desc: '섬을 예쁘게 하는 꽃. 선물로 좋다.' },
  water:     { name: '물',       icon: '💧', cat: 'res',     desc: '연못에서 퍼 온 맑은 물. 텃밭에 준다.' },

  seed:      { name: '씨앗',     icon: '🌱', cat: 'seed',    desc: '텃밭에 심으면 열매가 자란다.' },

  axe_wood:  { name: '나무 도끼',   icon: '🪓', cat: 'tool', tier: 1, kind: 'axe',  desc: '나무를 조금 더 빨리 캔다.' },
  pick_wood: { name: '나무 곡괭이', icon: '⛏️', cat: 'tool', tier: 1, kind: 'pick', desc: '돌을 조금 더 빨리 캔다.' },
  axe_stone: { name: '돌 도끼',     icon: '🪓', cat: 'tool', tier: 2, kind: 'axe',  desc: '나무를 한 번에 많이 캔다.' },
  pick_stone:{ name: '돌 곡괭이',   icon: '⛏️', cat: 'tool', tier: 2, kind: 'pick', desc: '철광석까지 캘 수 있다!' },

  starstone: { name: '별돌',      icon: '☄️', cat: 'special', desc: '유성이 남긴 반짝이는 돌. 세계수가 아주 좋아한다.' },
  rainbow:   { name: '무지개꽃',  icon: '🌺', cat: 'special', desc: '무지개가 뜬 자리에 피는 귀한 꽃.' },
  goldwood:  { name: '황금 나무', icon: '✨', cat: 'special', desc: '황금빛 나무에서만 나오는 반짝이는 목재.' }
};

/* 맵에 배치되는 자원 노드
   hp: 채집 가능 횟수 / tool: 필요한 도구 종류 / minTier: 필요한 도구 등급
   respawn: 사라진 뒤 다시 자라는 시간(초) / solid: 통과 불가 여부 */
TW.NODES = {
  tree:      { name: '나무',     icon: '🌳', hp: 3, xp: 2, tool: 'axe',  minTier: 0, respawn: 45, solid: true,
               drops: [{ item: 'wood', min: 1, max: 2 }, { item: 'seed', min: 1, max: 1, chance: 0.15 }] },
  rock:      { name: '돌',       icon: '🪨', hp: 3, xp: 2, tool: 'pick', minTier: 0, respawn: 55, solid: true,
               drops: [{ item: 'stone', min: 1, max: 2 }] },
  bush:      { name: '풀숲',     icon: '🌿', hp: 2, xp: 1, tool: null,   minTier: 0, respawn: 30, solid: false,
               drops: [{ item: 'grass', min: 1, max: 2 }, { item: 'seed', min: 1, max: 1, chance: 0.35 }] },
  berry:     { name: '열매나무', icon: '🍓', hp: 2, xp: 2, tool: null,   minTier: 0, respawn: 60, solid: true,
               drops: [{ item: 'berry', min: 1, max: 2 }] },
  mushroom:  { name: '버섯',     icon: '🍄', hp: 1, xp: 2, tool: null,   minTier: 0, respawn: 50, solid: false,
               drops: [{ item: 'mushroom', min: 1, max: 1 }] },
  iron:      { name: '철광석',   icon: '🪙', hp: 3, xp: 5, tool: 'pick', minTier: 2, respawn: 90, solid: true,
               drops: [{ item: 'iron', min: 1, max: 1 }, { item: 'stone', min: 1, max: 1, chance: 0.5 }],
               lockMsg: '돌 곡괭이가 있어야 캘 수 있어!' },
  flower:    { name: '꽃',       icon: '🌸', hp: 1, xp: 1, tool: null,   minTier: 0, respawn: 40, solid: false,
               drops: [{ item: 'flower', min: 1, max: 1 }] },
  water:     { name: '연못',     icon: '💧', hp: 99, xp: 1, tool: null,  minTier: 0, respawn: 0, solid: true,
               drops: [{ item: 'water', min: 1, max: 1 }] },

  /* 특별 / 이벤트 노드 */
  goldtree:  { name: '황금 나무', icon: '🌟', hp: 3, xp: 8, tool: 'axe', minTier: 0, respawn: 0, solid: true, rare: true,
               drops: [{ item: 'goldwood', min: 1, max: 2 }, { item: 'wood', min: 1, max: 2 }] },
  rainbowf:  { name: '무지개꽃', icon: '🌺', hp: 1, xp: 6, tool: null,  minTier: 0, respawn: 0, solid: false, rare: true,
               drops: [{ item: 'rainbow', min: 1, max: 1 }] },
  starrock:  { name: '별돌',     icon: '☄️', hp: 2, xp: 8, tool: 'pick', minTier: 1, respawn: 0, solid: true, rare: true,
               drops: [{ item: 'starstone', min: 1, max: 1 }] },
  chest:     { name: '보물상자', icon: '🎁', hp: 1, xp: 10, tool: null, minTier: 0, respawn: 0, solid: true, rare: true,
               drops: [{ item: 'wood', min: 3, max: 6 }, { item: 'stone', min: 3, max: 6 },
                       { item: 'berry', min: 1, max: 3 }, { item: 'seed', min: 1, max: 2 }] }
};

/* 먹을 수 있는 아이템 → 활동력 회복량 */
TW.EDIBLE = { berry: 8, mushroom: 6 };

/* 세계수에 바칠 수 있는 아이템 → 필요 개수당 에너지 1 */
TW.OFFERINGS = [
  { item: 'wood',      cost: 3, energy: 1 },
  { item: 'stone',     cost: 3, energy: 1 },
  { item: 'grass',     cost: 4, energy: 1 },
  { item: 'berry',     cost: 2, energy: 1 },
  { item: 'flower',    cost: 1, energy: 1 },
  { item: 'mushroom',  cost: 2, energy: 1 },
  { item: 'iron',      cost: 1, energy: 3 },
  { item: 'goldwood',  cost: 1, energy: 4 },
  { item: 'rainbow',   cost: 1, energy: 5 },
  { item: 'starstone', cost: 1, energy: 6 }
];
