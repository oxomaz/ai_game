/* =====================================================================
 * data/items.js — 장비 · 펫 · 날개 · 탈것 · 스킨 (희귀도 5단계)
 * ---------------------------------------------------------------------
 * I(id, slot, emoji, 이름, 희귀도, 공격, 방어, 보너스)
 *   slot  : weapon 무기 / armor 갑옷 / hat 모자 / pet 펫 / wing 날개 / mount 탈것 / skin 스킨
 *   희귀도 : 0 흔함 · 1 희귀 · 2 영웅 · 3 전설 · 4 신화
 *   보너스 : { exp:1.1 경험치배수, gold:1.2 골드배수, crit:0.1 크리확률+,
 *             time:3 문제당 초+, hp:20 최대체력+, shield:1 첫오답 1회 방어 }
 * 새 아이템은 배열에 한 줄만 추가하면 상자에서 나온다.
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  MQ.RARITY = [
    { key: 'common', name: '흔함', color: '#9fb0c9', w: 100 },
    { key: 'rare', name: '희귀', color: '#4cc9f0', w: 42 },
    { key: 'epic', name: '영웅', color: '#b892ff', w: 15 },
    { key: 'legend', name: '전설', color: '#ffd166', w: 4 },
    { key: 'mythic', name: '신화', color: '#f72585', w: 1 }
  ];

  MQ.SLOTS = [
    { key: 'weapon', name: '무기', icon: '⚔️' },
    { key: 'armor', name: '갑옷', icon: '🛡️' },
    { key: 'hat', name: '모자', icon: '🎩' },
    { key: 'pet', name: '펫', icon: '🐾' },
    { key: 'wing', name: '날개', icon: '🪽' },
    { key: 'mount', name: '탈것', icon: '🐴' },
    { key: 'skin', name: '스킨', icon: '🧝' }
  ];

  function I(id, slot, emoji, name, rar, atk, def, bonus) {
    return { id: id, slot: slot, emoji: emoji, name: name, rar: rar, atk: atk || 0, def: def || 0, bonus: bonus || {} };
  }

  MQ.ITEMS = [
    /* ---------- 무기 ---------- */
    I('w-stick', 'weapon', '🥢', '나무 막대', 0, 2, 0),
    I('w-pencil', 'weapon', '✏️', '몽당 연필', 0, 3, 0),
    I('w-ruler', 'weapon', '📏', '30cm 자', 0, 4, 1),
    I('w-fork', 'weapon', '🍴', '용사의 포크', 0, 5, 0),
    I('w-dagger', 'weapon', '🔪', '수식 단검', 1, 8, 0, { crit: .05 }),
    I('w-hammer', 'weapon', '🔨', '계산 망치', 1, 10, 2),
    I('w-bow', 'weapon', '🏹', '속도의 활', 1, 9, 0, { time: 2 }),
    I('w-wand', 'weapon', '🪄', '요술 지팡이', 2, 14, 0, { exp: 1.1 }),
    I('w-sword', 'weapon', '⚔️', '기사의 검', 2, 16, 3),
    I('w-axe', 'weapon', '🪓', '숫자 도끼', 2, 18, 0, { crit: .08 }),
    I('w-trident', 'weapon', '🔱', '삼지창', 3, 24, 4, { crit: .1 }),
    I('w-katana', 'weapon', '🗡️', '섬광의 검', 3, 26, 0, { crit: .15, time: 1 }),
    I('w-star', 'weapon', '🌠', '별똥별 창', 4, 36, 6, { crit: .2, exp: 1.2 }),
    I('w-infinity', 'weapon', '♾️', '무한의 검', 4, 40, 8, { exp: 1.3, gold: 1.3 }),

    /* ---------- 갑옷 ---------- */
    I('a-shirt', 'armor', '👕', '연습생 셔츠', 0, 0, 2),
    I('a-vest', 'armor', '🦺', '초보 조끼', 0, 0, 3),
    I('a-coat', 'armor', '🧥', '모험가 코트', 0, 1, 4),
    I('a-leather', 'armor', '🟫', '가죽 갑옷', 1, 0, 7, { hp: 10 }),
    I('a-scale', 'armor', '🐟', '비늘 갑옷', 1, 2, 8),
    I('a-robe', 'armor', '🥋', '마법사 로브', 2, 4, 10, { exp: 1.1 }),
    I('a-plate', 'armor', '🛡️', '강철 판금', 2, 0, 16, { hp: 20 }),
    I('a-crystal', 'armor', '💠', '수정 갑옷', 3, 6, 22, { shield: 1 }),
    I('a-dragon', 'armor', '🐲', '용비늘 갑옷', 3, 10, 24, { hp: 30 }),
    I('a-galaxy', 'armor', '🌌', '은하의 갑옷', 4, 14, 34, { hp: 50, shield: 1 }),

    /* ---------- 모자 ---------- */
    I('h-cap', 'hat', '🧢', '야구 모자', 0, 0, 1),
    I('h-straw', 'hat', '👒', '밀짚 모자', 0, 0, 2),
    I('h-band', 'hat', '🎀', '집중 머리띠', 1, 0, 3, { time: 2 }),
    I('h-helmet', 'hat', '⛑️', '탐험 헬멧', 1, 1, 5),
    I('h-witch', 'hat', '🎩', '마법사 모자', 2, 3, 6, { exp: 1.15 }),
    I('h-crown', 'hat', '👑', '왕관', 3, 6, 10, { gold: 1.4 }),
    I('h-halo', 'hat', '😇', '천사의 고리', 4, 8, 16, { shield: 1, exp: 1.25 }),

    /* ---------- 펫 ---------- */
    I('p-chick', 'pet', '🐤', '삐약이', 0, 1, 1, { gold: 1.1 }),
    I('p-cat', 'pet', '🐱', '계산 고양이', 0, 2, 0, { time: 1 }),
    I('p-dog', 'pet', '🐶', '충직한 강아지', 0, 1, 2),
    I('p-fox', 'pet', '🦊', '꾀돌이 여우', 1, 3, 1, { crit: .05 }),
    I('p-owl', 'pet', '🦉', '지혜의 부엉이', 1, 2, 2, { exp: 1.15 }),
    I('p-penguin', 'pet', '🐧', '얼음 펭귄', 1, 3, 3),
    I('p-uni', 'pet', '🦄', '유니콘', 2, 6, 4, { exp: 1.2 }),
    I('p-robot', 'pet', '🤖', '도우미 로봇', 2, 5, 5, { time: 3 }),
    I('p-drake', 'pet', '🐉', '아기 드래곤', 3, 12, 8, { crit: .1, exp: 1.2 }),
    I('p-phoenix', 'pet', '🔥', '불사조', 4, 18, 12, { shield: 1, gold: 1.5 }),

    /* ---------- 날개 ---------- */
    I('g-leaf', 'wing', '🍃', '나뭇잎 날개', 0, 0, 1, { time: 1 }),
    I('g-feather', 'wing', '🪶', '깃털 날개', 1, 2, 2, { time: 2 }),
    I('g-bat', 'wing', '🦇', '박쥐 날개', 1, 3, 1, { crit: .05 }),
    I('g-angel', 'wing', '🪽', '천사 날개', 2, 4, 6, { hp: 15 }),
    I('g-flame', 'wing', '🔥', '불꽃 날개', 3, 9, 6, { crit: .12 }),
    I('g-cosmos', 'wing', '✨', '우주 날개', 4, 15, 12, { exp: 1.3, time: 3 }),

    /* ---------- 탈것 ---------- */
    I('m-skate', 'mount', '🛹', '스케이트보드', 0, 0, 0, { gold: 1.15 }),
    I('m-bike', 'mount', '🚲', '자전거', 0, 1, 1),
    I('m-horse', 'mount', '🐴', '갈색 말', 1, 3, 3),
    I('m-boat', 'mount', '⛵', '작은 배', 1, 2, 4, { gold: 1.2 }),
    I('m-car', 'mount', '🏎️', '경주차', 2, 6, 4, { time: 2 }),
    I('m-ufo', 'mount', '🛸', '접시 비행선', 3, 10, 9, { exp: 1.25 }),
    I('m-rocket', 'mount', '🚀', '별을 넘는 로켓', 4, 16, 14, { exp: 1.35, gold: 1.5 }),

    /* ---------- 스킨(겉모습) ---------- */
    I('s-boy', 'skin', '🧒', '용감한 아이', 0, 0, 0),
    I('s-knight', 'skin', '🧝', '숲의 요정', 1, 1, 1),
    I('s-mage', 'skin', '🧙', '작은 마법사', 2, 2, 2, { exp: 1.1 }),
    I('s-hero', 'skin', '🦸', '수학 히어로', 3, 4, 4, { crit: .08 }),
    I('s-star', 'skin', '🌟', '별의 아이', 4, 8, 8, { exp: 1.2, gold: 1.2 })
  ];

  MQ.ITEM = {};
  for (var i = 0; i < MQ.ITEMS.length; i++) MQ.ITEM[MQ.ITEMS[i].id] = MQ.ITEMS[i];

  /* 소모품(상점) */
  MQ.SHOP = [
    { id: 'hint', emoji: '💡', name: '힌트', desc: '문제를 푸는 실마리를 보여줘요', price: 60 },
    { id: 'fifty', emoji: '✂️', name: '50:50', desc: '틀린 보기 두 개를 지워요', price: 90 },
    { id: 'time', emoji: '⏳', name: '시간 +10초', desc: '남은 시간을 늘려요', price: 50 },
    { id: 'shield', emoji: '🛡️', name: '정답 보호막', desc: '한 번 틀려도 피해를 안 받아요', price: 120 },
    { id: 'revive', emoji: '💖', name: '부활', desc: '쓰러져도 체력 절반으로 일어나요', price: 200 },
    { id: 'potion', emoji: '🧪', name: '체력 물약', desc: '체력을 가득 채워요', price: 80 },
    { id: 'chest', emoji: '🎁', name: '보물상자', desc: '아이템이 하나 나와요', price: 300 },
    { id: 'bigchest', emoji: '💝', name: '반짝이는 상자', desc: '희귀 이상이 확정으로 나와요', price: 900, gem: 3 }
  ];
  MQ.SHOP_MAP = {};
  for (var j = 0; j < MQ.SHOP.length; j++) MQ.SHOP_MAP[MQ.SHOP[j].id] = MQ.SHOP[j];
})();
