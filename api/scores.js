// GET  /api/scores?game=jump-map&limit=20      → 게임별 최고점수 랭킹
// GET  /api/scores?game=jump-map&pid=xxx       → 랭킹 + 내 순위
// POST /api/scores {pid,name,game,score,meta}  → 점수 기록(최고점 갱신 + 플레이 이력)
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

const HIST_MAX = 200; // 플레이어당 보관할 최근 플레이 수

async function board(game, limit) {
  const flat = await r1('ZREVRANGE', `lb:${game}`, 0, limit - 1, 'WITHSCORES');
  const rows = [];
  for (let i = 0; i < flat.length; i += 2)
    rows.push({ pid: flat[i], score: Number(flat[i + 1]) });
  if (!rows.length) return [];
  const names = await redis(rows.map((r) => ['HGET', `p:${r.pid}`, 'name']));
  return rows.map((r, i) => ({
    rank: i + 1,
    name: names[i] || '이름없음',
    score: r.score,
    me: false,
    pid: r.pid,
  }));
}

export default guard(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const game = clean(url.searchParams.get('game'), 40);

  if (req.method === 'GET') {
    if (!GAMES[game]) return json(res, 400, { ok: false, error: 'bad_game' });
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('limit')) || 20)
    );
    const pid = url.searchParams.get('pid') || '';
    const top = await board(game, limit);
    let mine = null;
    if (okPid(pid)) {
      top.forEach((t) => {
        if (t.pid === pid) t.me = true;
      });
      const [score, rank] = await redis([
        ['ZSCORE', `lb:${game}`, pid],
        ['ZREVRANK', `lb:${game}`, pid],
      ]);
      if (score != null)
        mine = { score: Number(score), rank: Number(rank) + 1 };
    }
    const total = Number(await r1('ZCARD', `lb:${game}`));
    return json(res, 200, { ok: true, game, total, top, mine });
  }

  if (req.method !== 'POST')
    return json(res, 405, { ok: false, error: 'method' });

  const b = await readBody(req);
  const pid = String(b.pid || '');
  const g = clean(b.game, 40);
  const score = Math.floor(Number(b.score));
  const name = clean(b.name, 12) || '이름없음';

  if (!okPid(pid)) return json(res, 400, { ok: false, error: 'bad_pid' });
  if (!GAMES[g]) return json(res, 400, { ok: false, error: 'bad_game' });
  if (!Number.isFinite(score) || score < 0 || score > GAMES[g].max)
    return json(res, 400, { ok: false, error: 'bad_score' });
  if (!(await rateOk(`s:${pid}`, 60, 60)))
    return json(res, 429, { ok: false, error: 'too_many' });

  const t = nowSec();
  const entry = JSON.stringify({
    g,
    s: score,
    t,
    m: b.meta && typeof b.meta === 'object' ? b.meta : undefined,
  });

  await redis([
    ['HSET', `p:${pid}`, 'name', name, 'seen', t],
    ['HSETNX', `p:${pid}`, 'created', t],
    ['HINCRBY', `p:${pid}`, 'plays', 1],
    ['ZADD', `lb:${g}`, 'GT', 'CH', score, pid],
    ['LPUSH', `hist:${pid}`, entry],
    ['LTRIM', `hist:${pid}`, 0, HIST_MAX - 1],
    ['SADD', 'players', pid],
  ]);

  const [best, rank] = await redis([
    ['ZSCORE', `lb:${g}`, pid],
    ['ZREVRANK', `lb:${g}`, pid],
  ]);

  json(res, 200, {
    ok: true,
    best: Number(best),
    isBest: Number(best) === score,
    rank: rank == null ? null : Number(rank) + 1,
    total: Number(await r1('ZCARD', `lb:${g}`)),
  });
});
