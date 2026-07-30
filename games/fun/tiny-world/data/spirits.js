/* ===========================================================
   Tiny World - data/spirits.js
   정령 4종. 진화 단계(evo)는 데이터만 준비해 두었다(다음 버전용).
   discover: 발견 조건 / gift: 친구가 되기 위한 선물 / job: 배치 능력
   =========================================================== */
window.TW = window.TW || {};

TW.SPIRITS = {
  leaf: {
    key: 'leaf', name: '잎새 정령', icon: '🍃', color: '#5ec26a', color2: '#a8e6a1',
    where: '작은 숲', region: 'forest', spot: { x: 5, y: 9 },
    personality: '밝고 호기심 많음',
    power: '나무 채집을 도와준다',
    job: { type: 'gather', item: 'wood', every: 30, amount: 1, label: '나무를 모아 온다' },
    gift: { item: 'berry', qty: 3 },
    lines: [
      '어? 사람이다! 나무 캐는 소리가 들려서 나왔어.',
      '나는 잎새 정령이야. 이 숲에서 제일 오래 산 아기 정령!',
      '음… 새콤한 열매 3개만 주면 친구 해 줄게. 어때?'
    ],
    thanks: '와아! 고마워! 이제 우리 친구야. 나무 모으는 거 도와줄게!',
    evo: ['씨앗 정령', '새싹 정령', '잎새 정령', '숲의 수호자'],
    desc: '초록 잎으로 만든 작은 몸. 웃으면 잎이 살랑거린다.'
  },
  rock: {
    key: 'rock', name: '돌멩이 정령', icon: '🪨', color: '#9aa3ad', color2: '#cfd6dd',
    where: '바위 언덕', region: 'hill', spot: { x: 18, y: 9 },
    personality: '느긋하고 힘이 셈',
    power: '돌과 광석 채집을 도와준다',
    job: { type: 'gather', item: 'stone', every: 34, amount: 1, label: '돌을 모아 온다' },
    gift: { item: 'stone', qty: 10 },
    lines: [
      '…쿨… 쿨… 응? 누가 내 언덕을 두드렸어?',
      '나는 돌멩이 정령. 천 년 동안 여기서 낮잠을 잤지.',
      '돌 10개 쌓아 주면 일어날게. 돌은 많을수록 좋아…'
    ],
    thanks: '좋아, 마음에 들어. 무거운 건 내가 들어 줄게.',
    evo: ['조각돌 정령', '돌멩이 정령', '바위 정령', '산의 수호자'],
    desc: '둥근 돌 위에 작은 눈. 굴러서 이동한다.'
  },
  drop: {
    key: 'drop', name: '물방울 정령', icon: '💧', color: '#5bc0eb', color2: '#bfeaff',
    where: '연못가', region: 'plain', spot: { x: 7, y: 22 },
    personality: '장난기 많음',
    power: '텃밭 작물이 빨리 자란다',
    job: { type: 'farm', speed: 0.45, label: '텃밭에 물을 준다' },
    gift: { item: 'flower', qty: 2 },
    lines: [
      '히히, 물 주는 거 봤어! 나도 물 뿌리기 좋아해.',
      '나는 물방울 정령이야. 연못에서 태어났어.',
      '예쁜 꽃 2개 주면 텃밭 일 도와줄게. 꽃 좋아!'
    ],
    thanks: '와! 예뻐! 이제 네 텃밭은 내가 책임진다!',
    evo: ['이슬 정령', '물방울 정령', '샘 정령', '호수의 수호자'],
    desc: '투명한 물방울 몸. 웃을 때마다 찰랑거린다.'
  },
  ember: {
    key: 'ember', name: '불씨 정령', icon: '🔥', color: '#ff8a3d', color2: '#ffd28a',
    where: '세계수 옆 모닥불', region: 'plain', spot: { x: 14, y: 17 },
    personality: '용감하고 급함',
    power: '제작 시간을 줄여 준다',
    job: { type: 'craft', speed: 0.35, label: '풀무질로 제작을 돕는다' },
    gift: { item: 'mushroom', qty: 3 },
    questOnly: true,
    lines: [
      '앗 뜨거! …아니 내가 뜨거운 거였네. 반가워!',
      '나는 불씨 정령! 세계수가 자라면서 나를 깨웠어.',
      '고소한 버섯 3개! 그거 구워 먹고 싶어. 주면 도와줄게!'
    ],
    thanks: '좋았어! 이제 뭐든 후딱 만들어 줄게. 빨리빨리!',
    evo: ['불씨 정령', '모닥불 정령', '화덕 정령', '태양의 수호자'],
    desc: '작고 따뜻한 불꽃. 신날 때 톡톡 튄다.'
  }
};

TW.SPIRIT_ORDER = ['leaf', 'rock', 'drop', 'ember'];

/* 발견 조건: state 를 받아 true 면 정령이 맵에 나타난다 */
TW.SPIRIT_UNLOCK = {
  leaf:  function (s) { return s.counters.gather_tree >= 10 && s.regions.forest; },
  rock:  function (s) { return s.counters.gather_stone >= 15 && s.regions.hill; },
  drop:  function (s) { return s.counters.water_given >= 5; },
  ember: function (s) { return s.tree.stage >= 2 && s.counters.tree_energy >= 12; }
};

TW.SPIRIT_HINT = {
  leaf:  '나무를 10번 캐면 숲에서 만날 수 있어',
  rock:  '돌을 15번 캐면 바위 언덕에서 만날 수 있어',
  drop:  '텃밭에 물을 5번 주면 연못가에 나타나',
  ember: '세계수가 자라고 에너지를 12 모으면 찾아온다'
};
