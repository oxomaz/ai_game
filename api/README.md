# 기록 서버 (api/)

게임 기록을 계속 남기기 위한 서버입니다. **Vercel Functions + Upstash Redis** 조합이고,
설치할 패키지가 하나도 없습니다(Node 내장 `fetch`만 씁니다).

```
브라우저(게임)  ──HTTPS──▶  jerry-games.vercel.app/api/*  ──REST──▶  Upstash Redis
   common/records.js            api/*.js (서버리스 함수)          (기록 영구 보관)
```

- GitHub Pages(`oxomaz.github.io/jerry-games`)에서 열어도 **Vercel의 API를 그대로 호출**합니다(CORS 허용됨).
  즉 두 주소 중 어디서 플레이해도 기록은 한 곳에 쌓입니다.
- 서버가 없어도 게임은 그대로 돌아갑니다. 못 보낸 기록은 브라우저에 쌓였다가 다음 접속 때 자동 재전송됩니다.

## 처음 한 번만 하는 설정 (약 3분)

1. <https://vercel.com> 로그인 → `jerry-games` 프로젝트 클릭
2. 상단 **Storage** 탭 → **Create Database** → **Upstash for Redis** 선택 → Free 플랜 → Create
3. 만들어진 DB의 **Connect Project**에서 `jerry-games`를 연결 (환경변수 `KV_REST_API_URL`,
   `KV_REST_API_TOKEN`이 자동으로 들어갑니다)
4. **Deployments** 탭에서 가장 최근 배포의 **⋯ → Redeploy** (환경변수를 새로 읽게 하기 위함)
5. <https://jerry-games.vercel.app/records.html> 을 열어 이름을 정하면 끝

설정 전에는 API가 `503 db_not_configured`를 돌려주고, 게임은 기록만 안 남을 뿐 정상 작동합니다.

## 엔드포인트

| 메서드 | 경로 | 하는 일 |
|---|---|---|
| GET | `/api/scores?game=&limit=&pid=` | 게임별 랭킹 + 내 순위 |
| POST | `/api/scores` | 점수 기록 `{pid,name,game,score,meta}` |
| GET | `/api/me?pid=` | 내 최고기록·순위·최근 플레이·전적 |
| POST | `/api/me` | 닉네임 변경 `{pid,name}` |
| GET | `/api/notes?pid=&game=` | 오답노트 조회 |
| POST | `/api/notes` | 오답 추가 `{pid,game,items:[{q,a,my}]}` / 비우기 `{pid,game,clear:true}` |
| GET | `/api/versus?pid=` | 대결 전적 (pid 없으면 승률 랭킹) |
| POST | `/api/versus` | 대결 결과 `{pid,name,game,result:'win'\|'lose'\|'draw',opp}` |

## 저장 구조 (Redis 키)

| 키 | 타입 | 내용 |
|---|---|---|
| `p:<pid>` | Hash | 닉네임, 가입시각, 마지막접속, 총 플레이 수 |
| `lb:<game>` | Sorted Set | 게임별 최고점수 랭킹 (member = pid) |
| `hist:<pid>` | List | 최근 플레이 200개 |
| `notes:<pid>:<game>` | List | 오답노트 300개 |
| `vs:<pid>` / `vslog:<pid>` | Hash / List | 대결 전적 합계 · 최근 100경기 |
| `vsrate` | Sorted Set | 승률 랭킹 (5경기 이상) |

## 안전장치

- 플레이어 id는 브라우저가 만든 16자 난수(`localStorage`). 로그인·개인정보 없음.
- 게임 이름은 화이트리스트, 점수는 게임별 상한을 넘으면 거부.
- 닉네임·문제 텍스트는 길이 제한 + 제어문자 제거.
- 한 사람당 분당 60회 요청 제한.
- CORS는 `oxomaz.github.io`, `jerry-games*.vercel.app`, localhost 만 허용.

> 완벽한 치팅 방지는 아닙니다. 점수 계산이 브라우저에서 일어나는 구조라, 마음먹으면 조작할 수 있어요.
> 가족·친구끼리 쓰는 랭킹 수준에 맞춘 방어입니다.

## 테스트

```bash
npm run test:api        # 엔드포인트 27개 항목 (인메모리 Redis)
npm i playwright        # 브라우저 테스트를 처음 돌릴 때만
npm run test:browser    # common/records.js 를 실제 브라우저에서 20개 항목
```

`test/mock-redis.js`가 Upstash REST를 흉내 내므로 인터넷이나 실제 DB 없이 전부 검증됩니다.
