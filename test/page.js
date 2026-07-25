// records.html (기록 보기 페이지) 를 실제 브라우저에서 확인한다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startRedis } from './mock-redis.js';

const RPORT = 7988, APORT = 7999;
process.env.KV_REST_API_URL = `http://127.0.0.1:${RPORT}`;
process.env.KV_REST_API_TOKEN = 'test';
const routes = {
  '/api/scores': (await import('../api/scores.js')).default,
  '/api/me': (await import('../api/me.js')).default,
  '/api/notes': (await import('../api/notes.js')).default,
  '/api/versus': (await import('../api/versus.js')).default,
};
await startRedis(RPORT);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
const srv = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  if (routes[p]) return routes[p](req, res);
  const f = path.join(ROOT, p === '/' ? '/index.html' : p);
  if (f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile()) {
    res.setHeader('Content-Type', TYPES[path.extname(f)] || 'text/plain; charset=utf-8');
    return res.end(fs.readFileSync(f));
  }
  res.statusCode = 404;
  res.end('404');
});
await new Promise((r) => srv.listen(APORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${APORT}`;

let pass = 0, fail = 0;
const ok = (n, c, e) => (c ? (pass++, console.log('  ✅', n)) : (fail++, console.log('  ❌', n, JSON.stringify(e))));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));

// 다른 사람 기록을 먼저 심어 둔다
const other = 'otherplayerXY99';
for (const [g, s] of [['jump-map', 5000], ['quiz-science', 70]])
  await fetch(`${BASE}/api/scores`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pid: other, name: '친구', game: g, score: s }) });

console.log('\n[허브 → 기록 페이지]');
await page.goto(BASE + '/');
ok('허브에 기록 보기 링크 있음', await page.locator('a.records').count() === 1);
await page.locator('a.records').click();
await page.waitForTimeout(300);
ok('기록 페이지로 이동', page.url().includes('records.html'));

console.log('\n[이름 정하기]');
ok('처음엔 이름 입력창이 뜸', await page.locator('#jgn').count() === 1);
await page.fill('#jgn', '재희');
await page.click('#jgok');
await page.waitForTimeout(500);
ok('이름이 화면에 표시됨', (await page.locator('#myname').innerText()) === '재희');

console.log('\n[내 기록 탭]');
let t = await page.innerText('body');
ok('기록 없을 때 안내 문구', t.includes('아직 기록이 없어요'), t.slice(0, 200));

await page.evaluate(async () => {
  await Records.submit('jump-map', 8000);
  await Records.submit('quiz-science', 60);
  await Records.note('math-speed', [{ q: '8×9', a: '72', my: '81' }]);
  await Records.versus('set', 'win', '친구');
});
await page.reload();
await page.waitForTimeout(700);
t = await page.innerText('body');
ok('최고기록 표시', t.includes('점프맵 100') && t.includes('8,000'), t.slice(0, 400));
ok('순위 표시', t.includes('1위 / 2명'), t.slice(0, 400));
ok('대결 전적 표시', t.includes('1승 0패 0무'), t.slice(0, 500));
ok('최근 플레이 표시', t.includes('최근 플레이'));

console.log('\n[전체 랭킹 탭]');
await page.click('.tab[data-t="rank"]');
await page.waitForTimeout(700);
t = await page.innerText('body');
ok('랭킹에 두 사람 모두 나옴', t.includes('재희') && t.includes('친구'), t.slice(0, 400));
ok('내가 1위(8000)로 강조', (await page.locator('tr.me').count()) === 1);
await page.selectOption('#g', 'quiz-science');
await page.waitForTimeout(600);
const rows = await page.locator('#board tr').allInnerTexts();
ok(
  '게임 바꾸면 랭킹도 바뀜(친구 70 > 재희 60)',
  rows[0].includes('친구') && rows[0].includes('70') && rows[1].includes('재희'),
  rows
);

console.log('\n[오답노트 탭]');
await page.click('.tab[data-t="notes"]');
await page.waitForTimeout(600);
t = await page.innerText('body');
ok('오답 문제/내 답/정답 표시', t.includes('8×9') && t.includes('81') && t.includes('72'), t.slice(0, 300));

console.log('\n[서버가 죽었을 때]');
await page.route('**/api/**', (r) => r.abort());
await page.click('.tab[data-t="me"]');
await page.waitForTimeout(7000);
t = await page.innerText('body');
ok('연결 실패 안내가 뜨고 페이지는 살아 있음', t.includes('연결하지 못했어요'), t.slice(0, 300));
await page.unroute('**/api/**');

ok('페이지 전체에서 JS 에러 없음', errs.length === 0, errs);

await browser.close();
srv.close();
console.log(`\n결과: ${pass} 통과, ${fail} 실패\n`);
process.exit(fail ? 1 : 0);
