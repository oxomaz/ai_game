// api/ 엔드포인트 통합 테스트 — 인메모리 Redis 위에서 실제 핸들러를 돌린다.
import http from 'node:http';
import { startRedis } from './mock-redis.js';

const RPORT = 7788;
const APORT = 7799;
process.env.KV_REST_API_URL = `http://127.0.0.1:${RPORT}`;
process.env.KV_REST_API_TOKEN = 'test';

const scores = (await import('../api/scores.js')).default;
const me = (await import('../api/me.js')).default;
const notes = (await import('../api/notes.js')).default;
const versus = (await import('../api/versus.js')).default;

const routes = { '/api/scores': scores, '/api/me': me, '/api/notes': notes, '/api/versus': versus };

await startRedis(RPORT);
const api = http.createServer((req, res) => {
  const path = req.url.split('?')[0];
  const h = routes[path];
  if (!h) {
    res.statusCode = 404;
    return res.end('no route');
  }
  h(req, res);
});
await new Promise((r) => api.listen(APORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${APORT}/api`;

let pass = 0;
let fail = 0;
function ok(name, cond, extra) {
  if (cond) {
    pass++;
    console.log('  ✅', name);
  } else {
    fail++;
    console.log('  ❌', name, extra === undefined ? '' : JSON.stringify(extra));
  }
}
const post = (p, b) =>
  fetch(BASE + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: 'https://oxomaz.github.io' },
    body: JSON.stringify(b),
  }).then(async (r) => ({ status: r.status, cors: r.headers.get('access-control-allow-origin'), body: await r.json() }));
const get = (p) =>
  fetch(BASE + p, { headers: { origin: 'https://oxomaz.github.io' } }).then(async (r) => ({
    status: r.status,
    body: await r.json(),
  }));

const A = 'playerAAAAAA1111';
const B = 'playerBBBBBB2222';

console.log('\n[1] 점수 기록과 랭킹');
let r = await post('/scores', { pid: A, name: '재희', game: 'jump-map', score: 100 });
ok('첫 점수 저장', r.body.ok && r.body.best === 100 && r.body.rank === 1, r.body);
ok('CORS 허용 헤더', r.cors === 'https://oxomaz.github.io', r.cors);

r = await post('/scores', { pid: A, name: '재희', game: 'jump-map', score: 50 });
ok('낮은 점수는 최고기록을 못 덮어씀', r.body.best === 100 && r.body.isBest === false, r.body);

r = await post('/scores', { pid: A, name: '재희', game: 'jump-map', score: 300 });
ok('높은 점수는 갱신됨', r.body.best === 300 && r.body.isBest === true, r.body);

await post('/scores', { pid: B, name: '친구', game: 'jump-map', score: 200 });
r = await get('/scores?game=jump-map&limit=10&pid=' + B);
ok('랭킹 순서 (재희 300 > 친구 200)', r.body.top[0].name === '재희' && r.body.top[1].name === '친구', r.body.top);
ok('중복 없이 사람당 1줄', r.body.top.length === 2, r.body.top);
ok('내 순위 표시', r.body.top[1].me === true && r.body.total === 2, r.body);

console.log('\n[2] 잘못된 입력 막기');
ok('가짜 게임 이름 거부', (await post('/scores', { pid: A, game: 'hack', score: 1 })).status === 400);
ok('점수 상한 초과 거부', (await post('/scores', { pid: A, game: 'jump-map', score: 999999999 })).status === 400);
ok('음수 점수 거부', (await post('/scores', { pid: A, game: 'jump-map', score: -5 })).status === 400);
ok('이상한 pid 거부', (await post('/scores', { pid: 'x', game: 'jump-map', score: 1 })).status === 400);
r = await post('/scores', { pid: A, name: '<script>주입', game: 'set', score: 7 });
ok('긴/이상한 이름도 통과(잘라서 저장)', r.body.ok === true, r.body);

console.log('\n[3] 오답노트');
r = await post('/notes', {
  pid: A,
  game: 'math-speed',
  items: [
    { q: '7 × 8', a: '56', my: '54' },
    { q: '9 × 6', a: '54', my: '56' },
  ],
});
ok('오답 2개 저장', r.body.added === 2, r.body);
r = await get('/notes?pid=' + A + '&game=math-speed');
ok('오답노트 조회', r.body.count === 2 && r.body.items[0].a === '56', r.body.items);
await post('/notes', { pid: A, game: 'math-speed', clear: true });
r = await get('/notes?pid=' + A);
ok('오답노트 비우기', r.body.count === 0, r.body);

console.log('\n[4] 대결 전적');
await post('/versus', { pid: A, name: '재희', game: 'set', result: 'win', opp: '친구' });
await post('/versus', { pid: A, name: '재희', game: 'set', result: 'win', opp: '친구' });
r = await post('/versus', { pid: A, name: '재희', game: 'set', result: 'lose', opp: '친구' });
ok('전적 누적 2승 1패', r.body.win === 2 && r.body.lose === 1, r.body);
ok('잘못된 결과값 거부', (await post('/versus', { pid: A, game: 'set', result: 'cheat' })).status === 400);
r = await get('/versus?pid=' + A);
ok('게임별 전적 분리', r.body.byGame.length === 1 && r.body.byGame[0].game === 'set', r.body.byGame);
ok('최근 경기 로그', r.body.recent.length === 3 && r.body.recent[0].r === 'lose', r.body.recent);

console.log('\n[5] 내 기록 모아보기');
r = await get('/me?pid=' + A);
ok('닉네임(가장 최근에 보낸 이름)', r.body.name === '재희', r.body.name);
ok('게임별 최고기록 2종', r.body.best.length === 2, r.body.best);
ok('jump-map 1위/2명', r.body.best.find((b) => b.game === 'jump-map').rank === 1, r.body.best);
ok('플레이 이력 쌓임', r.body.history.length >= 4, r.body.history.length);
ok('전적 합산', r.body.versus.win === 2, r.body.versus);
r = await post('/me', { pid: A, name: '재희' });
ok('닉네임 변경', r.body.name === '재희');
r = await get('/scores?game=jump-map&limit=10');
ok('랭킹에도 새 닉네임 반영', r.body.top[0].name === '재희', r.body.top[0]);

console.log('\n[6] 요청 폭주 제한');
let limited = false;
for (let i = 0; i < 70; i++) {
  const res = await post('/scores', { pid: B, name: '친구', game: 'set', score: 1 });
  if (res.status === 429) {
    limited = true;
    break;
  }
}
ok('분당 60회 넘으면 429', limited);

console.log(`\n결과: ${pass} 통과, ${fail} 실패\n`);
process.exit(fail ? 1 : 0);
