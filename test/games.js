// 10개 게임에 서버 기록(Records)이 제대로 붙었는지 실제 브라우저에서 검증한다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startRedis } from './mock-redis.js';

const RPORT = 7688, APORT = 7699;
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
const TYPE = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  if (routes[p]) return routes[p](req, res);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (f.startsWith(ROOT) && fs.existsSync(f)) {
    res.setHeader('Content-Type', TYPE[path.extname(f)] || 'text/plain; charset=utf-8');
    return res.end(fs.readFileSync(f));
  }
  res.statusCode = 404;
  res.end('404');
});
await new Promise((r) => srv.listen(APORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${APORT}`;

let pass = 0, fail = 0;
const ok = (n, c, e) => (c ? (pass++, console.log('  ✅', n)) : (fail++, console.log('  ❌', n, JSON.stringify(e))));

const GAMES = [
  ['games/study/math-speed/', 'math-speed'],
  ['games/study/times-table-shooter/', 'times-table-shooter'],
  ['games/study/word-cards/', 'word-cards'],
  ['games/study/quiz-science/', 'quiz-science'],
  ['games/fun/word-chain/', 'word-chain'],
  ['games/fun/hidden-object/', 'hidden-object'],
  ['games/fun/set/', 'set'],
  ['games/fun/jump-map/', 'jump-map'],
  ['games/fun/subway-io/', 'subway-io'],
  ['games/fun/onitama/', 'onitama'],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

console.log('\n[1] 모든 게임이 에러 없이 열리고 Records/JG 를 갖는다');
for (const [p, key] of GAMES) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(BASE + '/' + p, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const state = await page.evaluate(() => ({
    R: typeof window.Records === 'object',
    J: typeof window.JG === 'object',
    pid: window.Records && window.Records.pid,
  }));
  ok(`${key} — JS 에러 없음`, errs.length === 0, errs.slice(0, 2));
  ok(`${key} — Records + JG 둘 다 로드`, state.R && state.J, state);
  await ctx.close();
}

console.log('\n[2] JG.submit 이 서버 순위표까지 올린다 (순위표 모드)');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/games/study/math-speed/');
  await page.waitForTimeout(300);
  const r = await page.evaluate(async () => {

    const res = JG.submit('math-speed', {
      score: 123, mode: '덧셈·뺄셈·곱셈·나눗셈 · 초3~4 · 60초', unit: '점',
    });
    return { ranked: res.ranked, online: res.online ? await res.online : null };
  });
  ok('순위표 모드로 내면 ranked=true', r.ranked === true, r);
  ok('서버가 점수를 받아 순위를 돌려줌', r.online && r.online.ok && r.online.best === 123 && r.online.rank === 1, r.online);

  const r2 = await page.evaluate(async () => {
    const res = JG.submit('math-speed', { score: 999, mode: '연습 · 아무 모드', unit: '점' });
    return { ranked: res.ranked, online: res.online };
  });
  ok('순위표 모드가 아니면 서버에 안 올림', r2.ranked === false && r2.online === null, r2);

  const board = await page.evaluate(() => Records.top('math-speed', 5));
  ok('랭킹에 123점만 올라감(999는 없음)', board.top.length === 1 && board.top[0].score === 123, board.top);
  await ctx.close();
}

console.log('\n[3] 게임키 매핑 — 끝말잇기(kkeutmalitgi → word-chain)');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/games/fun/word-chain/');
  await page.waitForTimeout(300);
  const r = await page.evaluate(async () => {
    const res = JG.submit('kkeutmalitgi', { score: 42, mode: '컴퓨터 · 보통', unit: '단어' });
    return res.online ? await res.online : null;
  });
  ok('서버가 word-chain 으로 받아들임', r && r.ok && r.best === 42, r);
  const board = await page.evaluate(() => Records.top('word-chain', 5));
  ok('word-chain 랭킹에 반영', board.ok && board.top[0] && board.top[0].score === 42, board.top);
  await ctx.close();
}

console.log('\n[4] 오답노트가 서버에 쌓인다');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/games/study/quiz-science/');
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    await Records.note('quiz-science', [{ q: '태양계에서 가장 큰 행성은?', a: '목성', my: '토성' }]);
    await Records.note('math-speed', [{ q: '7 × 8', a: '56', my: '54' }]);
  });
  const n = await page.evaluate(() => Records.notes());
  ok('두 게임 오답이 모두 저장됨', n.count === 2, n.items);
  ok('문제·정답·내 답이 그대로', n.items.some((i) => i.a === '목성' && i.my === '토성'), n.items);
  await ctx.close();
}

console.log('\n[5] 온라인 대결 전적 (versus.js showResult 한 곳에서 처리)');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/games/fun/set/');
  await page.waitForTimeout(300);
  const out = await page.evaluate(async () => {
    // 실제 대결 없이 승패 화면 로직만 직접 태운다
    const V = window.Versus;
    V.open({ game: 'set', onStart: function () {}, onData: function () {} });
    await new Promise((r) => setTimeout(r, 200));
    V.oppName = '친구';
    V.myScore = 5; V.oppScore = 3; V._showResult();     // 승
    V.myScore = 1; V.oppScore = 9; V._showResult();     // 패
    V.myScore = 4; V.oppScore = 4; V._showResult();     // 무
    V.myScore = 9; V.oppScore = 0; V._showResult('상대가 나감', true); // 중단 → 안 세야 함
    await new Promise((r) => setTimeout(r, 900));
    return Records.me();
  });
  ok('1승 1패 1무로 기록', out.versus.win === 1 && out.versus.lose === 1 && out.versus.draw === 1, out.versus);
  ok('상대가 나간 판은 전적에 안 들어감', out.versus.win + out.versus.lose + out.versus.draw === 3, out.versus);
  await ctx.close();
}

console.log('\n[6] 서버가 죽어도 게임은 열린다');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.route('**/api/**', (r) => r.abort());
  await page.goto(BASE + '/games/fun/subway-io/');
  await page.waitForTimeout(500);
  const r = await page.evaluate(async () => {
    const res = JG.submit('subway-io', { score: 50, mode: '혼자', unit: '명' });
    return { local: res.best, online: res.online ? await res.online : 'none' };
  });
  ok('API 전멸해도 페이지 에러 없음', errs.length === 0, errs);
  ok('로컬 기록은 그대로 저장됨', r.local === 50, r);
  ok('서버 실패는 조용히 null', r.online === null, r);
  await ctx.close();
}

console.log('\n[7] 기록 페이지가 게임과 같은 플레이어를 본다');
{
  const ctx = await browser.newContext();
  const g = await ctx.newPage();
  await g.goto(BASE + '/games/fun/jump-map/');
  await g.waitForTimeout(400);
  const pidGame = await g.evaluate(async () => {
    JG.submit('jump-map', { score: 7, mode: '혼자', unit: '단계' });
    await new Promise((r) => setTimeout(r, 500));
    return Records.pid;
  });
  const rp = await ctx.newPage();
  await rp.goto(BASE + '/records.html');
  await rp.waitForTimeout(900);
  const pidPage = await rp.evaluate(() => Records.pid);
  ok('게임과 기록 페이지의 서버 ID가 같음', pidGame === pidPage, { pidGame, pidPage });
  const txt = await rp.innerText('body');
  ok('기록 페이지에 점프맵 기록이 보임', txt.includes('점프맵'), txt.slice(0, 300));
  await ctx.close();
}

console.log('\n[8] 실제로 한 판을 끝내면 오답노트가 서버로 간다 (게임 코드 경로)');
{
  // 8-1. 연산 스피드 퀴즈 — 진짜로 오답을 내고 판을 끝낸다
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(BASE + '/games/study/math-speed/');
  await page.waitForTimeout(600);
  await page.click('#startBtn');
  await page.waitForTimeout(300);
  const asked = await page.evaluate(async () => {
    const seen = [];
    for (let i = 0; i < 3; i++) {
      seen.push(S.q.txt.replace(' = ?', ''));
      S.input = '987654';          // 확실한 오답
      submit();
      await new Promise((r) => setTimeout(r, 400));
    }
    finish();
    await new Promise((r) => setTimeout(r, 900));
    return seen;
  });
  ok('math-speed — 판이 에러 없이 끝남', errs.length === 0, errs.slice(0, 2));
  const n1 = await page.evaluate(() => Records.notes('math-speed'));
  ok('math-speed — 오답 3개가 서버에 저장됨', n1.ok && n1.count === 3, n1.count);
  ok('math-speed — 실제로 나온 문제가 그대로 기록됨',
     n1.items.every((i) => asked.includes(i.q)) && n1.items.every((i) => i.my === '987654'),
     n1.items);
  await ctx.close();
}
{
  // 8-2. 나머지 학습 게임 3종 — 오답 상태를 만든 뒤 finish() 를 태운다
  const cases = [
    ['games/study/times-table-shooter/', 'times-table-shooter', () => {
      document.getElementById('startBtn').click();
      G.notes = [{ q: '7 × 8', a: '56', my: '' }, { q: '9 × 6', a: '54', my: '' }];
      finish();
    }, 2],
    ['games/study/word-cards/', 'word-cards', () => {
      document.getElementById('startBtn').click();
      S.wrongs = [{ en: 'apple', ko: '사과' }];
      finish();
    }, 1],
    ['games/study/quiz-science/', 'quiz-science', () => {
      document.getElementById('startBtn').click();
      S.wrongs = [{ q: { q: '물이 어는 온도는?', a: ['0도', '10도', '100도', '-10도'], c: 0, e: '<b>설명</b>' } }];
      finish();
    }, 1],
  ];
  for (const [url, key, drive, want] of cases) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(BASE + '/' + url);
    await page.waitForTimeout(600);
    await page.evaluate(drive);
    await page.waitForTimeout(900);
    const n = await page.evaluate((k) => Records.notes(k), key);
    ok(`${key} — 판 종료 시 에러 없음`, errs.length === 0, errs.slice(0, 2));
    ok(`${key} — 오답 ${want}개가 서버에 저장됨`, n.ok && n.count === want, n);
    await ctx.close();
  }
}

console.log('\n[9] 오답노트는 이어붙되 게임 하나에 몰아넣지 않는다');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/games/study/word-cards/');
  await page.waitForTimeout(600);
  await page.evaluate(async () => {
    document.getElementById('startBtn').click();
    S.wrongs = [{ en: 'dog', ko: '개' }];
    finish();
    await new Promise((r) => setTimeout(r, 500));
    document.getElementById('startBtn').click();
    S.wrongs = [{ en: 'cat', ko: '고양이' }];
    finish();
    await new Promise((r) => setTimeout(r, 700));
  });
  const n = await page.evaluate(() => Records.notes());
  ok('두 판의 오답이 모두 남음', n.count === 2, n.items);
  ok('전부 word-cards 로 분류됨', n.items.every((i) => i.game === 'word-cards'), n.items);
  await ctx.close();
}

await browser.close();
srv.close();
console.log(`\n결과: ${pass} 통과, ${fail} 실패\n`);
process.exit(fail ? 1 : 0);
