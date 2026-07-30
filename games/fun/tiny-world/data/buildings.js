/* ===========================================================
   Tiny World - data/buildings.js
   건물. lvl 은 해금 레벨, size 는 차지하는 타일 수(가로x세로).
   =========================================================== */
window.TW = window.TW || {};

TW.BUILDINGS = {
  workbench: {
    name: '작업대', icon: '🛠️', lvl: 1, cost: { wood: 6, stone: 3 }, xp: 15, energy: 2,
    desc: '도구를 만드는 곳. 가까이 가서 사용하자.',
    action: '제작하기', spiritJob: '제작 도우미'
  },
  house: {
    name: '작은 집', icon: '🏠', lvl: 1, cost: { wood: 12, stone: 6 }, xp: 25, energy: 3,
    desc: '들어가 쉬면 활동력이 가득 찬다.',
    action: '쉬기', spiritJob: '집 지키기'
  },
  storage: {
    name: '창고', icon: '📦', lvl: 3, cost: { wood: 10, stone: 8 }, xp: 25, energy: 3,
    desc: '가방에 넣을 수 있는 자원이 150개 늘어난다.',
    action: '살펴보기', spiritJob: '정리 도우미', capacity: 150
  },
  farm: {
    name: '텃밭', icon: '🌾', lvl: 2, cost: { wood: 6, grass: 6 }, xp: 20, energy: 2,
    desc: '씨앗을 심고 물을 주면 열매가 자란다.',
    action: '돌보기', spiritJob: '농사 도우미'
  },
  nest: {
    name: '정령 쉼터', icon: '🏕️', lvl: 3, cost: { wood: 10, stone: 4, flower: 3 }, xp: 30, energy: 4,
    desc: '정령이 일할 수 있는 자리가 2개 늘어난다.',
    action: '정령 보기', spiritJob: '쉼터 지키기', slots: 2
  }
};

TW.BUILDING_ORDER = ['workbench', 'house', 'farm', 'storage', 'nest'];

/* 텃밭 성장 시간(초) */
TW.FARM_GROW = 55;
