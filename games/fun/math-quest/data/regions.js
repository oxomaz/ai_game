/* =====================================================================
 * data/regions.js — 지역 8종 · 몬스터 · 보스
 * ---------------------------------------------------------------------
 * 새 지역을 넣으려면 REGIONS 배열에 한 덩어리를 추가하면 된다.
 *   unlock : 이 지역이 열리는 플레이어 레벨
 *   diff   : 이 지역의 기본 문제 난이도(적응형 난이도의 기준선)
 *   skills : 이 지역에서 자주 나오는 능력 분야
 *   stages : 스테이지 수(마지막은 항상 보스)
 * ===================================================================== */
(function () {
  'use strict';
  var MQ = window.MQ = window.MQ || {};

  /* 몬스터 한 마리 정의: [이모지, 이름, 체력배수, 공격력배수] */
  function M(emoji, name, hp, atk) { return { emoji: emoji, name: name, hp: hp || 1, atk: atk || 1 }; }

  MQ.REGIONS = [
    {
      id: 'plain', name: '초원의 마을', emoji: '🏡', unlock: 1, diff: 4, stages: 8,
      sky: ['#6fd3a3', '#2f8f6b'], skills: ['calc', 'pattern'],
      desc: '모험이 시작되는 곳. 순한 몬스터들이 살아요.',
      mons: [M('🐌', '느림보 달팽이', .8, .8), M('🐛', '풀벌레', .9, .9), M('🐰', '깡총 토끼', 1, 1),
      M('🐿️', '도토리 도둑', 1, 1), M('🦔', '가시 고슴도치', 1.1, 1.1), M('🐝', '붕붕 꿀벌', 1, 1.2)],
      boss: { emoji: '🐗', name: '멧돼지 대장', q: 12, hp: 1, atk: 1.2 }
    },
    {
      id: 'slime', name: '슬라임 숲', emoji: '🌲', unlock: 5, diff: 12, stages: 9,
      sky: ['#4aa96c', '#14532d'], skills: ['calc', 'shape'],
      desc: '끈적한 슬라임들이 나무 사이에 숨어 있어요.',
      mons: [M('🟢', '초록 슬라임', 1, 1), M('🔵', '물방울 슬라임', 1.1, 1), M('🍄', '독버섯', 1, 1.3),
      M('🕷️', '숲거미', 1.1, 1.2), M('🦇', '숲박쥐', .9, 1.3), M('🌳', '움직이는 나무', 1.4, .9)],
      boss: { emoji: '👑', name: '슬라임 킹', q: 16, hp: 1.1, atk: 1.3 }
    },
    {
      id: 'ice', name: '얼음 동굴', emoji: '❄️', unlock: 14, diff: 24, stages: 9,
      sky: ['#8fd7ff', '#1b4f7a'], skills: ['calc', 'pattern', 'shape'],
      desc: '숨을 쉬면 하얗게 얼어붙는 동굴. 발밑을 조심해요.',
      mons: [M('🧊', '얼음 덩어리', 1.2, 1), M('⛄', '눈사람 병정', 1.1, 1.2), M('🐧', '얼음 펭귄', 1, 1.3),
      M('🦭', '동굴 물범', 1.3, 1), M('🐺', '설원 늑대', 1, 1.5), M('💎', '수정 정령', 1.2, 1.2)],
      boss: { emoji: '🐻‍❄️', name: '빙하의 수호자', q: 20, hp: 1.2, atk: 1.4 }
    },
    {
      id: 'pyramid', name: '피라미드', emoji: '🏜️', unlock: 24, diff: 36, stages: 10,
      sky: ['#f6c86a', '#8a5a1e'], skills: ['shape', 'logic'],
      desc: '모래 아래 숨겨진 암호와 함정의 미로.',
      mons: [M('🦂', '사막 전갈', 1.1, 1.4), M('🐍', '모래뱀', 1, 1.5), M('🪲', '황금 풍뎅이', 1.2, 1.2),
      M('🧟', '붕대 미라', 1.4, 1.2), M('🗿', '움직이는 석상', 1.6, 1), M('🐪', '사막의 짐승', 1.2, 1.3)],
      boss: { emoji: '🤴', name: '파라오의 혼', q: 24, hp: 1.3, atk: 1.5 }
    },
    {
      id: 'library', name: '마법도서관', emoji: '📚', unlock: 36, diff: 48, stages: 10,
      sky: ['#b892ff', '#3b1f6b'], skills: ['logic', 'pattern'],
      desc: '책들이 스스로 날아다니는 곳. 수수께끼가 가득해요.',
      mons: [M('📕', '붉은 마도서', 1.2, 1.3), M('🪶', '깃펜 요정', 1, 1.6), M('🕯️', '촛불 정령', 1.1, 1.4),
      M('🦉', '지혜의 부엉이', 1.3, 1.3), M('🔮', '수정구', 1.2, 1.5), M('🧙', '견습 마법사', 1.4, 1.4)],
      boss: { emoji: '📖', name: '금서의 주인', q: 28, hp: 1.4, atk: 1.6 }
    },
    {
      id: 'city', name: '기계도시', emoji: '🏙️', unlock: 50, diff: 60, stages: 10,
      sky: ['#4cc9f0', '#0b2545'], skills: ['calc', 'prob', 'logic'],
      desc: '톱니바퀴가 돌아가는 도시. 계산이 빨라야 살아남아요.',
      mons: [M('🤖', '순찰 로봇', 1.3, 1.4), M('⚙️', '톱니 병정', 1.2, 1.5), M('🔋', '전지 드론', 1, 1.8),
      M('🛸', '정찰 비행체', 1.1, 1.7), M('🦾', '강철 팔', 1.5, 1.4), M('💡', '과열 전구', 1.1, 1.6)],
      boss: { emoji: '🦿', name: '중앙 관리 코어', q: 32, hp: 1.5, atk: 1.7 }
    },
    {
      id: 'dragon', name: '용의 산', emoji: '🌋', unlock: 66, diff: 74, stages: 11,
      sky: ['#ff8a5c', '#5a1010'], skills: ['calc', 'shape', 'prob'],
      desc: '용암이 흐르는 산꼭대기. 진짜 용사만 오를 수 있어요.',
      mons: [M('🦎', '용암 도마뱀', 1.3, 1.6), M('🔥', '불꽃 정령', 1.2, 1.8), M('🐲', '새끼 드래곤', 1.4, 1.6),
      M('🪨', '마그마 골렘', 1.8, 1.3), M('🦅', '화산 매', 1.1, 2), M('⚔️', '용기사의 유령', 1.5, 1.7)],
      boss: { emoji: '🐉', name: '고대 드래곤', q: 40, hp: 1.7, atk: 1.9 }
    },
    {
      id: 'space', name: '우주', emoji: '🌌', unlock: 82, diff: 88, stages: 12,
      sky: ['#7b61ff', '#05061a'], skills: ['logic', 'prob', 'pattern', 'shape'],
      desc: '숫자의 끝을 넘어선 곳. 여기까지 온 사람은 아무도 없었어요.',
      mons: [M('👾', '픽셀 외계인', 1.4, 1.8), M('🛰️', '고장난 위성', 1.3, 1.9), M('☄️', '유성체', 1.1, 2.2),
      M('🪐', '고리 수호자', 1.8, 1.6), M('🌑', '검은 위성', 1.6, 1.9), M('✨', '별의 조각', 1.2, 2.1)],
      boss: { emoji: '🕳️', name: '무한의 블랙홀', q: 50, hp: 2, atk: 2.2 }
    }
  ];

  /* 랜덤 던전 테마 — 들어갈 때마다 달라진다 */
  MQ.DUNGEONS = [
    { id: 'mirror', name: '거울의 방', emoji: '🪞', desc: '틀리면 반사 피해가 두 배!', mod: { dmgTaken: 2, gold: 1.6 } },
    { id: 'rush', name: '질주의 통로', emoji: '⚡', desc: '시간이 절반. 대신 경험치 두 배!', mod: { time: 0.5, exp: 2 } },
    { id: 'gold', name: '황금 금고', emoji: '💰', desc: '골드가 세 배로 쏟아져요.', mod: { gold: 3 } },
    { id: 'dark', name: '어둠의 회랑', emoji: '🌑', desc: '보기가 3개뿐. 보상은 두둑해요.', mod: { choices: 3, exp: 1.6, gold: 1.6 } },
    { id: 'shape', name: '도형의 미궁', emoji: '📐', desc: '도형 문제만 나와요.', mod: { skill: 'shape', exp: 1.5 } },
    { id: 'logic', name: '수수께끼 탑', emoji: '🧩', desc: '논리 문제만 나와요.', mod: { skill: 'logic', exp: 1.5 } },
    { id: 'calc', name: '연산 폭포', emoji: '➕', desc: '연산 문제만 폭포처럼!', mod: { calcRush: true, skill: 'calc', exp: 1.4 } },
    { id: 'hard', name: '시련의 심연', emoji: '💀', desc: '난이도 +12. 전설 아이템 확률 상승!', mod: { diff: 12, rare: 2, exp: 1.8 } },
    { id: 'lucky', name: '행운의 정원', emoji: '🍀', desc: '보물상자가 두 배로 나와요.', mod: { drop: 2 } },
    { id: 'combo', name: '콤보 시험장', emoji: '🔥', desc: '콤보 배율이 두 배로 올라요.', mod: { combo: 2 } }
  ];

  MQ.regionOf = function (i) { return MQ.REGIONS[Math.max(0, Math.min(MQ.REGIONS.length - 1, i))]; };
})();
