/* ===========================================================
   Tiny World - data/quests.js
   퀘스트는 순서대로 열리고, 한 번에 최대 3개까지 보여 준다.
   prog(s) → [지금까지, 목표]  (자동으로 진행도가 채워진다)
   reward: { xp, energy(세계수 에너지), items:{}, msg }
   =========================================================== */
window.TW = window.TW || {};

function has(s, item) { return s.inv[item] || 0; }

TW.QUESTS = [
  { id: 'q1', title: '나무를 3개 모아 보자!', hint: '나무 앞에서 채집 버튼을 눌러 봐',
    prog: function (s) { return [Math.min(s.counters.got_wood, 3), 3]; },
    reward: { xp: 10, items: { stone: 2 }, msg: '좋아! 돌 2개를 선물로 줄게.' } },

  { id: 'q2', title: '돌을 3개 모아 보자!', hint: '회색 돌덩이를 찾아봐',
    prog: function (s) { return [Math.min(s.counters.got_stone, 3), 3]; },
    reward: { xp: 10, items: { wood: 3 }, msg: '이제 작업대를 만들 수 있어!' } },

  { id: 'q3', title: '작업대를 만들어 보자!', hint: '건설 버튼 → 작업대 → 빈 땅을 고르기',
    prog: function (s) { return [Math.min(s.counters.built_workbench, 1), 1]; },
    reward: { xp: 20, energy: 2, msg: '작업대에서 도구를 만들 수 있어!' } },

  { id: 'q4', title: '나무 도끼를 만들어 보자!', hint: '작업대 옆에서 제작 버튼을 눌러',
    prog: function (s) { return [s.tools.axe_wood ? 1 : 0, 1]; },
    reward: { xp: 20, energy: 2, msg: '도끼가 있으면 나무가 더 많이 나와!' } },

  { id: 'q5', title: '세계수에게 에너지를 5 주자!', hint: '섬 가운데 반짝이는 새싹에게 가 봐',
    prog: function (s) { return [Math.min(s.counters.tree_energy, 5), 5]; },
    reward: { xp: 25, msg: '세계수가 기뻐하고 있어!' } },

  { id: 'q6', title: '세계수를 2단계로 키워 작은 숲을 열자!', hint: '에너지를 더 모아서 주면 자란다',
    prog: function (s) { return [Math.min(s.tree.stage, 2), 2]; },
    reward: { xp: 40, items: { berry: 3 }, msg: '북서쪽 숲의 안개가 걷혔어!' } },

  { id: 'q7', title: '나무를 10번 캐 보자!', hint: '숲에는 나무가 아주 많아',
    prog: function (s) { return [Math.min(s.counters.gather_tree, 10), 10]; },
    reward: { xp: 25, msg: '숲에서 뭔가 반짝이는 게 보인다…' } },

  { id: 'q8', title: '잎새 정령을 찾아보자!', hint: '작은 숲 안을 돌아다녀 봐. 열매 3개도 챙기고!',
    prog: function (s) { return [s.spirits.leaf.friend ? 1 : 0, 1]; },
    reward: { xp: 50, energy: 3, msg: '첫 번째 정령 친구가 생겼어!' } },

  { id: 'q9', title: '작은 집을 만들어 보자!', hint: '나무 12개, 돌 6개가 필요해',
    prog: function (s) { return [Math.min(s.counters.built_house, 1), 1]; },
    reward: { xp: 35, energy: 3, msg: '집에서 쉬면 활동력이 가득 차!' } },

  { id: 'q10', title: '텃밭을 만들고 씨앗을 심자!', hint: '풀을 캐면 씨앗이 나올 때가 있어',
    prog: function (s) { return [Math.min(s.counters.planted, 1), 1]; },
    reward: { xp: 30, items: { water: 3 }, msg: '물을 주면 더 빨리 자란다!' } },

  { id: 'q11', title: '텃밭에 물을 5번 주자!', hint: '연못에서 물을 퍼 올 수 있어',
    prog: function (s) { return [Math.min(s.counters.water_given, 5), 5]; },
    reward: { xp: 30, msg: '연못가에 무언가 찰랑거린다…' } },

  { id: 'q12', title: '물방울 정령을 찾아보자!', hint: '연못 주변을 살펴봐. 꽃 2개를 준비하고!',
    prog: function (s) { return [s.spirits.drop.friend ? 1 : 0, 1]; },
    reward: { xp: 50, energy: 3, msg: '텃밭이 훨씬 빨라질 거야!' } },

  { id: 'q13', title: '돌 곡괭이를 만들어 보자!', hint: '나무 4개 + 돌 10개',
    prog: function (s) { return [s.tools.pick_stone ? 1 : 0, 1]; },
    reward: { xp: 35, energy: 2, msg: '이제 철광석도 캘 수 있어!' } },

  { id: 'q14', title: '세계수를 3단계로 키워 바위 언덕을 열자!', hint: '에너지를 계속 모으자',
    prog: function (s) { return [Math.min(s.tree.stage, 3), 3]; },
    reward: { xp: 60, msg: '북동쪽 바위 언덕이 열렸어!' } },

  { id: 'q15', title: '돌을 15번 캐 보자!', hint: '바위 언덕에 돌이 가득해',
    prog: function (s) { return [Math.min(s.counters.gather_stone, 15), 15]; },
    reward: { xp: 30, msg: '언덕 위에서 코 고는 소리가 들린다…' } },

  { id: 'q16', title: '돌멩이 정령을 찾아보자!', hint: '바위 언덕에서 만날 수 있어. 돌 10개 준비!',
    prog: function (s) { return [s.spirits.rock.friend ? 1 : 0, 1]; },
    reward: { xp: 55, energy: 3, msg: '힘센 친구가 생겼어!' } },

  { id: 'q17', title: '철광석을 3개 캐 보자!', hint: '바위 언덕의 반짝이는 돌',
    prog: function (s) { return [Math.min(s.counters.got_iron, 3), 3]; },
    reward: { xp: 40, energy: 2, msg: '세계수가 철광석을 아주 좋아해!' } },

  { id: 'q18', title: '창고를 만들어 보자!', hint: '가방이 커진다',
    prog: function (s) { return [Math.min(s.counters.built_storage, 1), 1]; },
    reward: { xp: 35, msg: '자원을 더 많이 담을 수 있어!' } },

  { id: 'q19', title: '정령 쉼터를 만들어 정령을 배치하자!', hint: '정령 버튼에서 일을 맡길 수 있어',
    prog: function (s) { return [Math.min(s.counters.jobs_set, 1), 1]; },
    reward: { xp: 45, energy: 3, msg: '정령이 대신 자원을 모아 온다!' } },

  { id: 'q20', title: '불씨 정령을 친구로 만들자!', hint: '세계수 옆 모닥불을 살펴봐. 버섯 3개 준비!',
    prog: function (s) { return [s.spirits.ember.friend ? 1 : 0, 1]; },
    reward: { xp: 60, energy: 4, msg: '정령 4마리가 모두 모였어!' } },

  { id: 'q21', title: '세계수를 4단계로 키우자!', hint: '섬 최고의 목표! 반짝이는 나무로!',
    prog: function (s) { return [Math.min(s.tree.stage, 4), 4]; },
    reward: { xp: 120, items: { starstone: 1 }, msg: '세계수가 빛나며 새로운 세계로 가는 문이 열렸어!' } },

  { id: 'q22', title: '도감을 절반 이상 채워 보자!', hint: '새로운 것을 발견하면 도감에 담긴다',
    prog: function (s) { return [TW.codexPercent ? TW.codexPercent(s) : 0, 50]; },
    reward: { xp: 80, msg: '탐험가다운 실력이야!' } }
];
