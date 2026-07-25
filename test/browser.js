// common/records.js 를 실제 브라우저에서 검증한다 (Playwright + 모의 서버).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startRedis } from './mock-redis.js';

const RPORT = 7888;
const APORT = 7899;
process.env.KV_REST_API_URL = `http://127.0.0.1:${RPORT}`;
process.env.KV_REST_API_TOKEN = 'test';

const scores = (await import('../api/scores.js')).default;
const me = (await import('../api/me.js')).default;
const notes = (await import('../api/notes.js')).default;
const versus = (await import('../api/versus.js')).default;
const routes = { '/api/scores': scores, '/api/me': me, '/api/notes': notes, '/api/versus': versus };

await startRedis(RPORT);

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srv = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  if (routes[p]) return routes[p](req, res);
  if (p === '/' || p === '/t.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(
      '<!doctype html><meta charset="utf-8"><body><script src="/common/records.js"></script>'
    );
  }
  const f = path.join(ROOT, p);
  if (f.startsWith(ROOT) && fs.existsSync(f)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    return res.end(fs.readFileSync(f));
  }
  res.statusCode = 404;
  res.end('nope');
});
await new Promise((r) => srv.listen(APORT, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${APORT}/t.html`;

let pass = 0,
  fail = 0;
const ok = (n, c, e) =>
  c ? (pass++, console.log('  ✅', n)) : (fail++, console.log('  ❌', n, JSON.stringify(e)));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

console.log('\n[A] 브라우저에서 점수 전송 → 랭킹 조회');
const p1 = await browser.newPage();
const errs = [];
p1.on('pageerror', (e) => errs.push(String(e)));
await p1.goto(URL_);
ok('스크립트 로드 에러 없음', errs.length === 0, errs);
ok('Records 전역 생성됨', await p1.evaluate(() => typeof window.Records === 'object'));
const pid1 = await p1.evaluate(() => Records.pid);
ok('플레이어 id 자동 생성', /^[A-Za-z0-9]{16}$/.test(pid1), pid1);
ok(
  '새로고침해도 같은 id 유지',
  (await (async () => {
    await p1.reload();
    return p1.evaluate(() => Records.pid);
  })()) === pid1
);

await p1.evaluate(() => Records.setName('브라우저'));
let res = await p1.evaluate(() => Records.submit('quiz-science', 88));
ok('점수 전송 성공', res && res.ok && res.best === 88, res);
res = await p1.evaluate(() => Records.submit('quiz-science', 40));
ok('낮은 점수여도 최고기록 유지', res.best === 88 && res.isBest === false, res);

console.log('\n[B] 두 번째 플레이어와 랭킹 비교');
const ctx2 = await browser.newContext();
const p2 = await ctx2.newPage();
await p2.goto(URL_);
await p2.evaluate(() => Records.setName('둘째'));
await p2.evaluate(() => Records.submit('quiz-science', 95));
const board = await p1.evaluate(() => Records.top('quiz-science', 10));
ok('1위 둘째(95), 2위 브라우저(88)', board.top[0].name === '둘째' && board.top[1].name === '브라우저', board.top);
ok('본인 표시(me)', board.top[1].me === true, board.top);

console.log('\n[C] 랭킹 창 UI');
await p1.evaluate(() => Records.showBoard('quiz-science', { title: '테스트 랭킹' }));
await p1.waitForTimeout(600);
const txt = await p1.evaluate(() => document.body.innerText);
ok('랭킹 창에 이름이 보임', txt.includes('둘째') && txt.includes('브라우저'), txt.slice(0, 120));
ok('내 기록 강조 표시', txt.includes('(나)'), txt.slice(0, 200));
await p1.evaluate(() => document.querySelector('#jgx').click());
await p1.waitForTimeout(200);
ok('닫기 버튼으로 사라짐', !(await p1.evaluate(() => !!document.querySelector('#jgb'))));

console.log('\n[D] 오답노트 · 대결 전적');
await p1.evaluate(() =>
  Records.note('math-speed', [{ q: '6×7', a: '42', my: '48' }])
);
const nt = await p1.evaluate(() => Records.notes('math-speed'));
ok('오답노트 왕복', nt.count === 1 && nt.items[0].q === '6×7', nt.items);
await p1.evaluate(() => Records.versus('set', 'win', '둘째'));
const mine = await p1.evaluate(() => Records.me());
ok('내 기록에 전적 포함', mine.versus.win === 1, mine.versus);
ok('내 기록에 플레이 이력 포함', mine.history.length >= 2, mine.history.length);

console.log('\n[E] 서버가 죽었을 때 (오프라인 큐)');
await p1.route('**/api/scores', (r) => r.abort());
res = await p1.evaluate(() => Records.submit('set', 777));
ok('실패해도 예외 없이 null 반환', res === null, res);
ok('큐에 쌓임', (await p1.evaluate(() => Records.pending())) === 1);
await p1.unroute('**/api/scores');
await p1.evaluate(() => Records.flush());
await p1.waitForTimeout(400);
ok('서버 복구 후 자동 재전송', (await p1.evaluate(() => Records.pending())) === 0);
const after = await p1.evaluate(() => Records.top('set', 5));
ok('밀렸던 점수가 랭킹에 반영됨', after.top.some((t) => t.score === 777), after.top);

console.log('\n[F] 저장소가 막힌 브라우저에서도 동작');
const ctx3 = await browser.newContext();
await ctx3.addInitScript(() => {
  Object.defineProperty(window, 'localStorage', {
    get() {
      throw new Error('blocked');
    },
  });
});
const p3 = await ctx3.newPage();
const errs3 = [];
p3.on('pageerror', (e) => errs3.push(String(e)));
await p3.goto(URL_);
ok('localStorage 차단돼도 에러 없음', errs3.length === 0, errs3);
res = await p3.evaluate(async () => {
  Records.setName('시크릿');
  return Records.submit('onitama', 12);
});
ok('그래도 점수 전송됨', res && res.ok, res);

await browser.close();
srv.close();
console.log(`\n결과: ${pass} 통과, ${fail} 실패\n`);
process.exit(fail ? 1 : 0);
