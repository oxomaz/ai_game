// 테스트용 인메모리 Upstash-호환 서버 + /api 라우터
// 실제 배포에는 쓰이지 않는다. `node test/mock-redis.js` 로 띄운다.
import http from 'node:http';

const DB = new Map(); // key -> {type,val}
const now = () => Date.now();
const expires = new Map();

function live(k) {
  const e = expires.get(k);
  if (e && e < now()) {
    DB.delete(k);
    expires.delete(k);
  }
  return DB.get(k);
}
function hash(k) {
  let v = live(k);
  if (!v) DB.set(k, (v = { t: 'h', m: new Map() }));
  return v.m;
}
function list(k) {
  let v = live(k);
  if (!v) DB.set(k, (v = { t: 'l', a: [] }));
  return v.a;
}
function zset(k) {
  let v = live(k);
  if (!v) DB.set(k, (v = { t: 'z', m: new Map() }));
  return v.m;
}
function set_(k) {
  let v = live(k);
  if (!v) DB.set(k, (v = { t: 's', s: new Set() }));
  return v.s;
}
const sorted = (m) =>
  [...m.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));

function exec(cmd) {
  const op = String(cmd[0]).toUpperCase();
  const k = cmd[1];
  switch (op) {
    case 'INCR': {
      const v = live(k);
      const n = (v ? Number(v.val) : 0) + 1;
      DB.set(k, { t: 'str', val: n });
      return n;
    }
    case 'EXPIRE':
      expires.set(k, now() + Number(cmd[2]) * 1000);
      return 1;
    case 'DEL': {
      const had = DB.has(k);
      DB.delete(k);
      return had ? 1 : 0;
    }
    case 'HSET': {
      const m = hash(k);
      for (let i = 2; i < cmd.length; i += 2) m.set(cmd[i], String(cmd[i + 1]));
      return 1;
    }
    case 'HSETNX': {
      const m = hash(k);
      if (m.has(cmd[2])) return 0;
      m.set(cmd[2], String(cmd[3]));
      return 1;
    }
    case 'HINCRBY': {
      const m = hash(k);
      const n = Number(m.get(cmd[2]) || 0) + Number(cmd[3]);
      m.set(cmd[2], String(n));
      return n;
    }
    case 'HGET': {
      const v = live(k);
      return v && v.t === 'h' ? (v.m.has(cmd[2]) ? v.m.get(cmd[2]) : null) : null;
    }
    case 'HGETALL': {
      const v = live(k);
      if (!v || v.t !== 'h') return [];
      const out = [];
      v.m.forEach((val, key) => out.push(key, val));
      return out;
    }
    case 'ZADD': {
      const m = zset(k);
      let i = 2;
      let gt = false;
      let ch = false;
      while (['GT', 'CH', 'NX', 'XX'].includes(String(cmd[i]).toUpperCase())) {
        const f = String(cmd[i]).toUpperCase();
        if (f === 'GT') gt = true;
        if (f === 'CH') ch = true;
        i++;
      }
      let changed = 0;
      for (; i < cmd.length; i += 2) {
        const score = Number(cmd[i]);
        const member = cmd[i + 1];
        const prev = m.get(member);
        if (gt && prev !== undefined && score <= prev) continue;
        if (prev !== score) changed++;
        m.set(member, score);
      }
      return ch ? changed : changed;
    }
    case 'ZSCORE': {
      const v = live(k);
      if (!v || v.t !== 'z' || !v.m.has(cmd[2])) return null;
      return String(v.m.get(cmd[2]));
    }
    case 'ZREVRANK': {
      const v = live(k);
      if (!v || v.t !== 'z') return null;
      const idx = sorted(v.m).findIndex((e) => e[0] === cmd[2]);
      return idx < 0 ? null : idx;
    }
    case 'ZCARD': {
      const v = live(k);
      return v && v.t === 'z' ? v.m.size : 0;
    }
    case 'ZREVRANGE': {
      const v = live(k);
      if (!v || v.t !== 'z') return [];
      const all = sorted(v.m);
      let start = Number(cmd[2]);
      let stop = Number(cmd[3]);
      if (stop < 0) stop = all.length + stop;
      const slice = all.slice(start, stop + 1);
      const ws = cmd.some((c) => String(c).toUpperCase() === 'WITHSCORES');
      return ws ? slice.flatMap(([m, s]) => [m, String(s)]) : slice.map((e) => e[0]);
    }
    case 'LPUSH': {
      const a = list(k);
      for (let i = 2; i < cmd.length; i++) a.unshift(cmd[i]);
      return a.length;
    }
    case 'LTRIM': {
      const a = list(k);
      let stop = Number(cmd[3]);
      if (stop < 0) stop = a.length + stop;
      const kept = a.slice(Number(cmd[2]), stop + 1);
      a.length = 0;
      kept.forEach((x) => a.push(x));
      return 'OK';
    }
    case 'LRANGE': {
      const v = live(k);
      if (!v || v.t !== 'l') return [];
      let stop = Number(cmd[3]);
      if (stop < 0) stop = v.a.length + stop;
      return v.a.slice(Number(cmd[2]), stop + 1);
    }
    case 'SADD': {
      const s = set_(k);
      let n = 0;
      for (let i = 2; i < cmd.length; i++) if (!s.has(cmd[i])) (s.add(cmd[i]), n++);
      return n;
    }
    default:
      throw new Error('unsupported ' + op);
  }
}

export function startRedis(port) {
  return new Promise((resolve) => {
    const srv = http.createServer(async (req, res) => {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      let cmds;
      try {
        cmds = JSON.parse(Buffer.concat(chunks).toString('utf8') || '[]');
      } catch {
        cmds = [];
      }
      const out = cmds.map((c) => {
        try {
          return { result: exec(c) };
        } catch (e) {
          return { error: String(e.message) };
        }
      });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(out));
    });
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startRedis(Number(process.argv[2] || 7788)).then(() =>
    console.log('mock redis on 7788')
  );
}
