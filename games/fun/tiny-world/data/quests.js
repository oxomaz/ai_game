/* ===========================================================
   Tiny World - data/quests.js
   퀘스트는 순서대로 열리고, 한 번에 최대 3개까지 보여 준다.
   prog(s) → [지금까지, 목표]  (자동으로 진행도가 채워진다)
   reward: { xp, energy(세계수 에너지), items:{}, msg }
   help  : 힌트 버튼을 눌렀을 때 보여 줄 자세한 설명 (짧은 문장 2~3개)
   guide : 길안내 화살표가 가리킬 곳
           {kind:'node', t:'tree'}    가장 가까운 그 자원
           {kind:'worldtree'}         세계수
           {kind:'spirit', k:'leaf'}  그 정령 (나타났을 때)
           {kind:'building', t:'farm'}내가 지은 그 건물
           {kind:'panel', p:'build'}  아래 메뉴 버튼 (지도 안내 없음)
   =========================================================== */
window.TW = window.TW || {};

TW.QUESTS = [
  { id: 'q1', title: '나무를 3개 모아 보자!', hint: '나무 앞에서 채집 버튼을 눌러 봐',
    prog: function (s) { return [Math.min(s.counters.got_wood, 3), 3]; },
    help: '초록색 나무 옆으로 걸어가 보자. 나무에 하얀 네모 표시가 생기면 다 온 거야.\n' +
          '그때 오른쪽 아래 큰 버튼(또는 스페이스·E 키)을 누르면 나무가 흔들리면서 🪵 나무가 나와.\n' +
          '버튼을 꾹 누르고 있으면 계속 캘 수 있어!',
    guide: { kind: 'node', t: 'tree' },
    reward: { xp: 10, items: { stone: 2 }, msg: '좋아! 돌 2개를 선물로 줄게.' } },

  { id: 'q2', title: '돌을 3개 모아 보자!', hint: '회색 돌덩이를 찾아봐',
    prog: function (s) { return [Math.min(s.counters.got_stone, 3), 3]; },
    help: '회색 돌덩이도 나무와 똑같아. 옆에 가서 버튼을 누르면 🪨 돌이 나와.\n' +
          '돌은 길 근처에도 있고, 나중에 바위 언덕에 아주 많아.',
    guide: { kind: 'node', t: 'rock' },
    reward: { xp: 10, items: { wood: 3 }, msg: '이제 작업대를 만들 수 있어!' } },

  { id: 'q3', title: '작업대를 만들어 보자!', hint: '건설 버튼 → 작업대 → 빈 땅을 고르기',
    prog: function (s) { return [Math.min(s.counters.built_workbench, 1), 1]; },
    help: '아래 🏠 건설 버튼을 눌러 봐. 목록에서 🛠️ 작업대의 "짓기"를 누르면\n' +
          '지도에서 놓을 수 있는 칸이 하얗게 반짝여.\n' +
          '반짝이는 칸을 손으로 누르면(PC는 마우스로 클릭) 작업대가 완성돼!',
    guide: { kind: 'panel', p: 'build' },
    reward: { xp: 20, energy: 2, msg: '작업대에서 도구를 만들 수 있어!' } },

  { id: 'q4', title: '나무 도끼를 만들어 보자!', hint: '작업대 옆에서 제작 버튼을 눌러',
    prog: function (s) { return [s.tools.axe_wood ? 1 : 0, 1]; },
    help: '도구는 작업대 옆에서만 만들 수 있어. 내가 지은 🛠️ 작업대로 걸어가자.\n' +
          '작업대 옆에서 채집 버튼을 누르면 제작 창이 열려. (아래 🔨 제작 버튼도 똑같아)\n' +
          '나무 도끼는 🪵 5개 + 🪨 2개가 필요해.',
    guide: { kind: 'building', t: 'workbench' },
    reward: { xp: 20, energy: 2, msg: '도끼가 있으면 나무가 더 많이 나와!' } },

  { id: 'q5', title: '세계수에게 에너지를 5 주자!', hint: '섬 가운데 반짝이는 새싹에게 가 봐',
    prog: function (s) { return [Math.min(s.counters.tree_energy, 5), 5]; },
    help: '흙길을 따라 위로 올라가면 반짝이는 🌰 세계수가 있어.\n' +
          '세계수 옆에서 버튼을 누르면(또는 화면 위 세계수 칸을 눌러도 돼)\n' +
          '자원을 주는 창이 열려. 🌸 꽃 1개 = 에너지 1, 🪵 나무 3개 = 에너지 1이야.',
    guide: { kind: 'worldtree' },
    reward: { xp: 25, msg: '세계수가 기뻐하고 있어!' } },

  { id: 'q6', title: '세계수를 2단계로 키워 작은 숲을 열자!', hint: '에너지를 더 모아서 주면 자란다',
    prog: function (s) { return [Math.min(s.tree.stage, 2), 2]; },
    help: '에너지를 모두 8 모으면 세계수가 새싹으로 자라고, 안개에 가려진 작은 숲이 열려!\n' +
          '꽃이 제일 값이 좋아(1개 = 1). 나무·돌은 3개마다 1이야.\n' +
          '퀘스트를 하나 끝낼 때도 에너지를 받을 수 있어.',
    guide: { kind: 'worldtree' },
    reward: { xp: 40, items: { berry: 3 }, msg: '북서쪽 숲의 안개가 걷혔어!' } },

  { id: 'q7', title: '나무를 10번 캐 보자!', hint: '숲에는 나무가 아주 많아',
    prog: function (s) { return [Math.min(s.counters.gather_tree, 10), 10]; },
    help: '왼쪽 위 작은 숲으로 가면 나무가 빽빽해.\n' +
          '나무 도끼가 있으면 한 번에 더 많이 나오고 더 빨라!\n' +
          '나무를 많이 캐면 숲에서 반짝이는 게 나타날 거야…',
    guide: { kind: 'node', t: 'tree' },
    reward: { xp: 25, msg: '숲에서 뭔가 반짝이는 게 보인다…' } },

  { id: 'q8', title: '잎새 정령을 찾아보자!', hint: '작은 숲 안을 돌아다녀 봐. 열매 3개도 챙기고!',
    prog: function (s) { return [s.spirits.leaf.friend ? 1 : 0, 1]; },
    help: '작은 숲 안에 ❓ 표시가 붙은 반짝이는 정령이 있어. 가까이 가서 말을 걸어 봐.\n' +
          '잎새 정령은 🍓 열매 3개를 좋아해. 열매나무(빨간 열매가 달린 나무)에서 모을 수 있어.\n' +
          '열매를 들고 다시 말을 걸면 친구가 돼!',
    guide: { kind: 'spirit', k: 'leaf', fallback: { kind: 'node', t: 'berry' } },
    reward: { xp: 50, energy: 3, msg: '첫 번째 정령 친구가 생겼어!' } },

  { id: 'q9', title: '작은 집을 만들어 보자!', hint: '나무 12개, 돌 6개가 필요해',
    prog: function (s) { return [Math.min(s.counters.built_house, 1), 1]; },
    help: '아래 🏠 건설에서 작은 집을 골라 빈 땅에 놓아 보자. 🪵 12개 + 🪨 6개가 필요해.\n' +
          '집에서 쉬면 활동력이 가득 차. 힘이 없을 때 아주 좋아!\n' +
          '집을 어디에 놓을지는 네 마음대로야.',
    guide: { kind: 'panel', p: 'build' },
    reward: { xp: 35, energy: 3, msg: '집에서 쉬면 활동력이 가득 차!' } },

  { id: 'q10', title: '텃밭을 만들고 씨앗을 심자!', hint: '풀을 캐면 씨앗이 나올 때가 있어',
    prog: function (s) { return [Math.min(s.counters.planted, 1), 1]; },
    help: '먼저 🌿 풀숲을 캐서 🌱 씨앗을 얻자. (풀 3개로 씨앗을 만들 수도 있어)\n' +
          '건설에서 🌾 텃밭을 짓고, 텃밭 옆에서 버튼을 누르면 씨앗을 심어.\n' +
          '심고 나서 💧 물을 주면 훨씬 빨리 자라!',
    guide: { kind: 'building', t: 'farm', fallback: { kind: 'panel', p: 'build' } },
    reward: { xp: 30, items: { water: 3 }, msg: '물을 주면 더 빨리 자란다!' } },

  { id: 'q11', title: '텃밭에 물을 5번 주자!', hint: '연못에서 물을 퍼 올 수 있어',
    prog: function (s) { return [Math.min(s.counters.water_given, 5), 5]; },
    help: '왼쪽 아래 파란 연못가에서 💧 물을 퍼 올 수 있어. 물은 활동력을 쓰지 않아!\n' +
          '물을 들고 텃밭에 가서 버튼을 누르면 물을 줘.\n' +
          '다 자라면 ✨ 표시가 뜨고, 그때 누르면 🍓 열매를 수확해!',
    guide: { kind: 'node', t: 'water' },
    reward: { xp: 30, msg: '연못가에 무언가 찰랑거린다…' } },

  { id: 'q12', title: '물방울 정령을 찾아보자!', hint: '연못 주변을 살펴봐. 꽃 2개를 준비하고!',
    prog: function (s) { return [s.spirits.drop.friend ? 1 : 0, 1]; },
    help: '연못 근처에 물방울 정령이 나타났어. 가까이 가서 말을 걸어 보자.\n' +
          '물방울 정령은 🌸 꽃 2개를 좋아해. 꽃은 평원 곳곳에 피어 있어.\n' +
          '친구가 되면 텃밭이 훨씬 빨리 자라!',
    guide: { kind: 'spirit', k: 'drop', fallback: { kind: 'node', t: 'flower' } },
    reward: { xp: 50, energy: 3, msg: '텃밭이 훨씬 빨라질 거야!' } },

  { id: 'q13', title: '돌 곡괭이를 만들어 보자!', hint: '나무 4개 + 돌 10개',
    prog: function (s) { return [s.tools.pick_stone ? 1 : 0, 1]; },
    help: '작업대 옆으로 가서 제작 창을 열자. 돌 곡괭이는 🪵 4개 + 🪨 10개야.\n' +
          '돌 곡괭이가 있으면 🔒 표시가 붙은 철광석도 캘 수 있어!\n' +
          '도구는 저절로 제일 좋은 게 쓰이니까 따로 고를 필요 없어.',
    guide: { kind: 'building', t: 'workbench' },
    reward: { xp: 35, energy: 2, msg: '이제 철광석도 캘 수 있어!' } },

  { id: 'q14', title: '세계수를 3단계로 키워 바위 언덕을 열자!', hint: '에너지를 계속 모으자',
    prog: function (s) { return [Math.min(s.tree.stage, 3), 3]; },
    help: '에너지를 모두 26 모으면 세계수가 어린 나무가 되고 바위 언덕이 열려.\n' +
          '숲에서 얻은 🍄 버섯(2개=1), 🍓 열매(2개=1)도 줄 수 있어.\n' +
          '퀘스트를 끝낼 때마다 받는 에너지도 쌓이고 있어!',
    guide: { kind: 'worldtree' },
    reward: { xp: 60, msg: '북동쪽 바위 언덕이 열렸어!' } },

  { id: 'q15', title: '돌을 15번 캐 보자!', hint: '바위 언덕에 돌이 가득해',
    prog: function (s) { return [Math.min(s.counters.gather_stone, 15), 15]; },
    help: '오른쪽 위 바위 언덕은 온통 돌이야. 곡괭이가 있으면 훨씬 빠르고 많이 나와.\n' +
          '많이 캐면 언덕에서 코 고는 소리가 들릴지도…',
    guide: { kind: 'node', t: 'rock' },
    reward: { xp: 30, msg: '언덕 위에서 코 고는 소리가 들린다…' } },

  { id: 'q16', title: '돌멩이 정령을 찾아보자!', hint: '바위 언덕에서 만날 수 있어. 돌 10개 준비!',
    prog: function (s) { return [s.spirits.rock.friend ? 1 : 0, 1]; },
    help: '바위 언덕에서 낮잠 자는 돌멩이 정령을 깨워 보자.\n' +
          '돌멩이 정령은 🪨 돌 10개를 좋아해. 돌은 언덕에 아주 많으니 먼저 모으고 가면 좋아.\n' +
          '친구가 되면 힘센 친구가 돌을 모아다 줄 거야!',
    guide: { kind: 'spirit', k: 'rock', fallback: { kind: 'node', t: 'rock' } },
    reward: { xp: 55, energy: 3, msg: '힘센 친구가 생겼어!' } },

  { id: 'q17', title: '철광석을 3개 캐 보자!', hint: '바위 언덕의 반짝이는 돌',
    prog: function (s) { return [Math.min(s.counters.got_iron, 3), 3]; },
    help: '바위 언덕에서 노란 점이 반짝이는 돌이 철광석이야.\n' +
          '돌 곡괭이가 없으면 🔒 표시가 뜨면서 못 캐. 곡괭이를 먼저 만들자.\n' +
          '철광석은 세계수가 아주 좋아해서 1개에 에너지 3이야!',
    guide: { kind: 'node', t: 'iron' },
    reward: { xp: 40, energy: 2, msg: '세계수가 철광석을 아주 좋아해!' } },

  { id: 'q18', title: '창고를 만들어 보자!', hint: '가방이 커진다',
    prog: function (s) { return [Math.min(s.counters.built_storage, 1), 1]; },
    help: '건설에서 📦 창고를 지으면 가방에 담을 수 있는 자원이 150개 늘어나.\n' +
          '가방이 꽉 찼다는 말이 나오면 창고를 더 지으면 돼!',
    guide: { kind: 'panel', p: 'build' },
    reward: { xp: 35, msg: '자원을 더 많이 담을 수 있어!' } },

  { id: 'q19', title: '정령 쉼터를 만들어 정령을 배치하자!', hint: '정령 버튼에서 일을 맡길 수 있어',
    prog: function (s) { return [Math.min(s.counters.jobs_set, 1), 1]; },
    help: '아래 🧚 정령 버튼을 누르면 친구가 된 정령 목록이 나와.\n' +
          '정령 아래의 건물 이름을 누르면 그 건물에서 일을 해 줘.\n' +
          '🏕️ 정령 쉼터를 지으면 일할 수 있는 자리가 2개 늘어나!',
    guide: { kind: 'panel', p: 'spirits' },
    reward: { xp: 45, energy: 3, msg: '정령이 대신 자원을 모아 온다!' } },

  { id: 'q20', title: '불씨 정령을 친구로 만들자!', hint: '세계수 옆 모닥불을 살펴봐. 버섯 3개 준비!',
    prog: function (s) { return [s.spirits.ember.friend ? 1 : 0, 1]; },
    help: '세계수 오른쪽에 작은 불씨가 나타나. 가까이 가서 말을 걸어 보자.\n' +
          '불씨 정령은 🍄 버섯 3개를 좋아해. 버섯은 작은 숲 그늘에 많아.\n' +
          '친구가 되면 물건을 훨씬 빨리 만들어 줘!',
    guide: { kind: 'spirit', k: 'ember', fallback: { kind: 'node', t: 'mushroom' } },
    reward: { xp: 60, energy: 4, msg: '정령 4마리가 모두 모였어!' } },

  { id: 'q21', title: '세계수를 4단계로 키우자!', hint: '섬 최고의 목표! 반짝이는 나무로!',
    prog: function (s) { return [Math.min(s.tree.stage, 4), 4]; },
    help: '에너지를 모두 58 모으면 세계수가 빛나는 나무가 돼!\n' +
          '☄️ 별돌(1개 = 6)과 🪙 철광석(1개 = 3)이 가장 좋아.\n' +
          '유성이 떨어지는 사건이 나오면 별돌을 꼭 챙기자!',
    guide: { kind: 'worldtree' },
    reward: { xp: 120, items: { starstone: 1 }, msg: '세계수가 빛나며 새로운 세계로 가는 문이 열렸어!' } },

  { id: 'q22', title: '도감을 절반 이상 채워 보자!', hint: '새로운 것을 발견하면 도감에 담긴다',
    prog: function (s) { return [TW.codexPercent ? TW.codexPercent(s) : 0, 50]; },
    help: '아래 📖 도감을 눌러 보자. 아직 못 본 것은 ❓ 로 나와 있어.\n' +
          '처음 캐는 자원, 처음 짓는 건물, 처음 만난 정령이 도감에 담겨.\n' +
          '❓ 를 채우려면 새로운 곳에 가서 새로운 걸 캐 보면 돼!',
    guide: { kind: 'panel', p: 'codex' },
    reward: { xp: 80, msg: '탐험가다운 실력이야!' } }
];
