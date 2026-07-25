// jerry-games 기록 서버 공용 모듈
// 의존성 0 — Node 18+ 내장 fetch 만 사용한다.
// 저장소: Upstash Redis(REST). Vercel Marketplace에서 연결하면 환경변수가 자동으로 주입된다.
//   KV_REST_API_URL / KV_REST_API_TOKEN  (또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)

const URL_ =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

export const configured = Boolean(URL_ && TOKEN);

/** Redis 명령 여러 개를 파이프라인으로 한 번에 보낸다. 결과 배열을 돌려준다. */
export async function redis(commands) {
  if (!configured) throw new Error('DB_NOT_CONFIGURED');
  const res = await fetch(URL_.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands.map((c) => c.map(String))),
  });
  if (!res.ok) throw new Error('DB_HTTP_' + res.status);
  const rows = await res.json();
  return rows.map((row) => {
    if (row && row.error) throw new Error('DB_' + row.error);
    return row ? row.result : null;
  });
}

/** 명령 하나 */
export async function r1(...cmd) {
  const [out] = await redis([cmd]);
  return out;
}

// ── 게임 목록과 점수 상한 (터무니없는 값 차단용) ────────────────────────────
export const GAMES = {
  'math-speed': { max: 100000, label: '연산 스피드 퀴즈' },
  'times-table-shooter': { max: 100000, label: '구구단 슈팅' },
  'word-cards': { max: 100000, label: '영단어 카드 퀴즈' },
  'quiz-science': { max: 100000, label: '상식·과학 퀴즈' },
  'word-chain': { max: 100000, label: '끝말잇기' },
  'hidden-object': { max: 100000, label: '숨은그림찾기' },
  set: { max: 100000, label: 'SET 카드게임' },
  'jump-map': { max: 100000, label: '점프맵 100' },
  'subway-io': { max: 1000000, label: '지하철 슬리더' },
  onitama: { max: 100000, label: '오니타마' },
};

// ── HTTP 유틸 ──────────────────────────────────────────────────────────────
const ALLOW = ['https://oxomaz.github.io', 'https://jerry-games.vercel.app'];

export function cors(req, res) {
  const origin = req.headers.origin || '';
  const ok =
    ALLOW.includes(origin) ||
    /^https:\/\/jerry-games[a-z0-9-]*\.vercel\.app$/.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  res.setHeader('Access-Control-Allow-Origin', ok ? origin : ALLOW[0]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export function json(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ── 값 정리 ────────────────────────────────────────────────────────────────
const CTRL = /[\u0000-\u001f\u007f]/g;

export const clean = (s, len) =>
  String(s == null ? '' : s)
    .replace(CTRL, '')
    .trim()
    .slice(0, len);

/** 플레이어 id: 클라이언트가 만든 8~22자 영숫자 */
export const okPid = (p) => /^[A-Za-z0-9_-]{8,22}$/.test(p || '');

export const nowSec = () => Math.floor(Date.now() / 1000);

/** 간단한 요청 제한. 통과하면 true */
export async function rateOk(bucket, limit, windowSec) {
  const key = `rl:${bucket}:${Math.floor(nowSec() / windowSec)}`;
  const n = Number(await r1('INCR', key));
  if (n === 1) await r1('EXPIRE', key, windowSec);
  return n <= limit;
}

/** DB 미설정 등 공통 에러 처리 래퍼 */
export function guard(handler) {
  return async (req, res) => {
    if (cors(req, res)) return;
    try {
      await handler(req, res);
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      if (msg === 'DB_NOT_CONFIGURED') {
        return json(res, 503, {
          ok: false,
          error: 'db_not_configured',
          hint: 'Vercel > Storage 에서 Upstash Redis 를 연결하세요.',
        });
      }
      json(res, 500, { ok: false, error: msg });
    }
  };
}
