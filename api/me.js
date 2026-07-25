// GET  /api/me?pid=xxx          → 프로필 + 게임별 최고기록/순위 + 최근 플레이 이력 + 대결 전적
// POST /api/me {pid,name}       → 닉네임 변경
import {
  guard,
  json,
  redis,
  r1,
  readBody,
  clean,
  okPid,
  nowSec,
  GAMES,
} from './_lib.js';

export default guard(async (req, res) => {
  if (req.method === 'POST') {
    const b = await readBody(req);
    const pid = String(b.pid || '');
    const name = clean(b.name, 12);
    if (!okPid(pid)) return json(res, 400, { ok: false, error: 'bad_pid' });
    if (!name) return json(res, 400, { ok: false, error: 'bad_name' });
    await redis([
      ['HSET', `p:${pid}`, 'name', name, 'seen', nowSec()],
      ['HSETNX', `p:${pid}`, 'created', nowSec()],
      ['SADD', 'players', pid],
    ]);
    return json(res, 200, { ok: true, name });
  }
  if (req.method !== 'GET')
    return json(res, 405, { ok: false, error: 'method' });

  const url = new URL(req.url, 'http://x');
  const pid = url.searchParams.get('pid') || '';
  if (!okPid(pid)) return json(res, 400, { ok: false, error: 'bad_pid' });

  const keys = Object.keys(GAMES);
  const [profile, hist, vs] = await redis([
    ['HGETALL', `p:${pid}`],
    ['LRANGE', `hist:${pid}`, 0, 49],
    ['HGETALL', `vs:${pid}`],
  ]);

  const cmds = [];
  keys.forEach((g) => {
    cmds.push(['ZSCORE', `lb:${g}`, pid]);
    cmds.push(['ZREVRANK', `lb:${g}`, pid]);
    cmds.push(['ZCARD', `lb:${g}`]);
  });
  const out = await redis(cmds);

  const best = [];
  keys.forEach((g, i) => {
    const score = out[i * 3];
    if (score == null) return;
    best.push({
      game: g,
      label: GAMES[g].label,
      score: Number(score),
      rank: Number(out[i * 3 + 1]) + 1,
      total: Number(out[i * 3 + 2]),
    });
  });

  const asObj = (v) => {
    if (!v) return {};
    if (Array.isArray(v)) {
      const o = {};
      for (let i = 0; i < v.length; i += 2) o[v[i]] = v[i + 1];
      return o;
    }
    return v;
  };
  const prof = asObj(profile);
  const record = asObj(vs);

  json(res, 200, {
    ok: true,
    pid,
    name: prof.name || '이름없음',
    plays: Number(prof.plays || 0),
    created: Number(prof.created || 0),
    best,
    versus: {
      win: Number(record.win || 0),
      lose: Number(record.lose || 0),
      draw: Number(record.draw || 0),
    },
    history: (hist || [])
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .map((h) => ({ ...h, label: (GAMES[h.g] || {}).label || h.g })),
  });
});
