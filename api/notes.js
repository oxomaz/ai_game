// 오답노트
// GET  /api/notes?pid=xxx[&game=math-speed][&limit=100]
// POST /api/notes {pid, game, items:[{q,a,my}]}   → 여러 개 한 번에 추가
// POST /api/notes {pid, game, clear:true}         → 그 게임 오답노트 비우기
import {
  guard,
  json,
  redis,
  r1,
  readBody,
  clean,
  okPid,
  nowSec,
  rateOk,
  GAMES,
} from './_lib.js';

const NOTE_MAX = 300; // 게임당 보관 개수

export default guard(async (req, res) => {
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x');
    const pid = url.searchParams.get('pid') || '';
    const game = clean(url.searchParams.get('game'), 40);
    if (!okPid(pid)) return json(res, 400, { ok: false, error: 'bad_pid' });
    const limit = Math.min(
      300,
      Math.max(1, Number(url.searchParams.get('limit')) || 100)
    );
    const games = game ? [game] : Object.keys(GAMES);
    const rows = await redis(
      games.map((g) => ['LRANGE', `notes:${pid}:${g}`, 0, limit - 1])
    );
    const items = [];
    games.forEach((g, i) => {
      (rows[i] || []).forEach((s) => {
        try {
          items.push({ game: g, label: GAMES[g] ? GAMES[g].label : g, ...JSON.parse(s) });
        } catch {
          /* 손상된 항목은 무시 */
        }
      });
    });
    items.sort((a, b) => (b.t || 0) - (a.t || 0));
    return json(res, 200, { ok: true, count: items.length, items });
  }

  if (req.method !== 'POST')
    return json(res, 405, { ok: false, error: 'method' });

  const b = await readBody(req);
  const pid = String(b.pid || '');
  const g = clean(b.game, 40);
  if (!okPid(pid)) return json(res, 400, { ok: false, error: 'bad_pid' });
  if (!GAMES[g]) return json(res, 400, { ok: false, error: 'bad_game' });

  if (b.clear) {
    await r1('DEL', `notes:${pid}:${g}`);
    return json(res, 200, { ok: true, cleared: true });
  }

  const list = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
  if (!list.length) return json(res, 400, { ok: false, error: 'no_items' });
  if (!(await rateOk(`n:${pid}`, 60, 60)))
    return json(res, 429, { ok: false, error: 'too_many' });

  const t = nowSec();
  const entries = list.map((it) =>
    JSON.stringify({
      q: clean(it.q, 120), // 문제
      a: clean(it.a, 60), // 정답
      my: clean(it.my, 60), // 내가 쓴 답
      t,
    })
  );

  await redis([
    // LPUSH 는 인자를 차례로 밀어 넣으므로, 넣은 순서대로 보이게 뒤집어서 보낸다
    ['LPUSH', `notes:${pid}:${g}`, ...entries.slice().reverse()],
    ['LTRIM', `notes:${pid}:${g}`, 0, NOTE_MAX - 1],
  ]);

  json(res, 200, { ok: true, added: entries.length });
});
