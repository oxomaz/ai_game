// 온라인 대결 전적
// POST /api/versus {pid,name,game,result:'win'|'lose'|'draw',opp,room}
// GET  /api/versus?pid=xxx        → 합계 + 게임별 + 최근 20경기
// GET  /api/versus                → 승률 랭킹(5경기 이상)
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

const LOG_MAX = 100;
const RESULTS = ['win', 'lose', 'draw'];

const asObj = (v) => {
  if (!v) return {};
  if (Array.isArray(v)) {
    const o = {};
    for (let i = 0; i < v.length; i += 2) o[v[i]] = v[i + 1];
    return o;
  }
  return v;
};

export default guard(async (req, res) => {
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x');
    const pid = url.searchParams.get('pid') || '';

    if (!pid) {
      // 승률 랭킹
      const flat = await r1('ZREVRANGE', 'vsrate', 0, 19, 'WITHSCORES');
      const rows = [];
      for (let i = 0; i < flat.length; i += 2)
        rows.push({ pid: flat[i], rate: Number(flat[i + 1]) });
      if (!rows.length) return json(res, 200, { ok: true, top: [] });
      const info = await redis(
        rows.flatMap((r) => [
          ['HGET', `p:${r.pid}`, 'name'],
          ['HGETALL', `vs:${r.pid}`],
        ])
      );
      return json(res, 200, {
        ok: true,
        top: rows.map((r, i) => {
          const v = asObj(info[i * 2 + 1]);
          return {
            rank: i + 1,
            name: info[i * 2] || '이름없음',
            rate: Math.round(r.rate),
            win: Number(v.win || 0),
            lose: Number(v.lose || 0),
            draw: Number(v.draw || 0),
          };
        }),
      });
    }

    if (!okPid(pid)) return json(res, 400, { ok: false, error: 'bad_pid' });
    const [vs, log] = await redis([
      ['HGETALL', `vs:${pid}`],
      ['LRANGE', `vslog:${pid}`, 0, 19],
    ]);
    const v = asObj(vs);
    const byGame = {};
    Object.keys(v).forEach((k) => {
      const m = k.match(/^(win|lose|draw):(.+)$/);
      if (!m) return;
      byGame[m[2]] = byGame[m[2]] || { win: 0, lose: 0, draw: 0 };
      byGame[m[2]][m[1]] = Number(v[k]);
    });
    return json(res, 200, {
      ok: true,
      pid,
      win: Number(v.win || 0),
      lose: Number(v.lose || 0),
      draw: Number(v.draw || 0),
      byGame: Object.keys(byGame).map((g) => ({
        game: g,
        label: (GAMES[g] || {}).label || g,
        ...byGame[g],
      })),
      recent: (log || [])
        .map((s) => {
          try {
            return JSON.parse(s);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    });
  }

  if (req.method !== 'POST')
    return json(res, 405, { ok: false, error: 'method' });

  const b = await readBody(req);
  const pid = String(b.pid || '');
  const g = clean(b.game, 40);
  const result = clean(b.result, 8);
  const name = clean(b.name, 12) || '이름없음';
  const opp = clean(b.opp, 12) || '상대';

  if (!okPid(pid)) return json(res, 400, { ok: false, error: 'bad_pid' });
  if (!GAMES[g]) return json(res, 400, { ok: false, error: 'bad_game' });
  if (!RESULTS.includes(result))
    return json(res, 400, { ok: false, error: 'bad_result' });
  if (!(await rateOk(`v:${pid}`, 60, 60)))
    return json(res, 429, { ok: false, error: 'too_many' });

  const t = nowSec();
  await redis([
    ['HSET', `p:${pid}`, 'name', name, 'seen', t],
    ['HSETNX', `p:${pid}`, 'created', t],
    ['HINCRBY', `vs:${pid}`, result, 1],
    ['HINCRBY', `vs:${pid}`, `${result}:${g}`, 1],
    ['LPUSH', `vslog:${pid}`, JSON.stringify({ g, r: result, o: opp, t })],
    ['LTRIM', `vslog:${pid}`, 0, LOG_MAX - 1],
    ['SADD', 'players', pid],
  ]);

  const v = asObj(await r1('HGETALL', `vs:${pid}`));
  const win = Number(v.win || 0);
  const lose = Number(v.lose || 0);
  const draw = Number(v.draw || 0);
  const games = win + lose + draw;
  // 5경기 이상부터 승률 랭킹에 올린다
  if (games >= 5)
    await r1('ZADD', 'vsrate', (win / games) * 100, pid);

  json(res, 200, { ok: true, win, lose, draw, games });
});
