# 프로젝트 규칙

이 저장소는 브라우저에서 바로 실행되는 미니 게임 모음입니다. 새 게임을 만들거나 기존 게임을 수정할 때 아래 규칙을 따르세요.

## 규칙

1. **모든 게임은 `games/<카테고리>/<게임이름>/` 폴더 아래에 생성한다.** 카테고리는 `fun`(재미용) 또는 `study`(학습용) 둘 중 하나이며, 게임 성격에 따라 고른다. 폴더명은 영문 소문자 + 하이픈(kebab-case)으로 짓는다. (예: `games/fun/brick-breaker/`, `games/study/times-table/`)
2. **각 게임 폴더의 진입점은 `index.html`로 한다.** GitHub Pages 경로가 `games/<카테고리>/<게임이름>/`만으로 바로 열리도록 하기 위함이다.
3. **순수 HTML/CSS/JS만 사용한다.** 별도 빌드 도구, 번들러, npm 설치 없이 브라우저에서 바로 실행되어야 한다. 외부 라이브러리가 꼭 필요하면 cdnjs 같은 CDN에서 `<script>` 태그로 불러온다.
4. **모바일 우선(mobile-first)으로 만든다.** 터치 조작을 기본으로 지원하고, 반응형 레이아웃을 사용한다.
5. **브라우저 저장소가 없어도 게임이 정상 동작해야 한다.** 기본은 메모리(JS 변수) 저장이다. 진행상황·최고기록처럼 저장이 게임의 핵심 기능일 때만 `localStorage`를 쓰되, 반드시 `try/catch`로 감싸고 접근이 막히면 메모리 저장으로 자동 대체되게 한다. 저장 실패로 게임이 멈추는 코드는 금지한다.
6. **게임을 하나 완성하면 루트 `index.html`의 `GAMES` 배열에 카드 한 줄을 추가한다.** (emoji, path, title, desc, category: "fun" 또는 "study") 루트 `README.md`의 게임 목록 표(해당 카테고리 표)와 게임별 상세 섹션에도 같은 내용을 추가한다.
6-1. **게임 폴더 안에 그 게임만의 `README.md`를 함께 만든다.** 소개 · 모드 · 규칙/난이도 · 조작법 · 기술 메모 순으로 정리한다.
6-2. **시작 화면과 결과 화면에 `← 게임 목록` 링크를 둔다.** `<a class="hub-link" href="../../../">← 게임 목록</a>` 형태로, 플레이 중에는 보이지 않게 해 조작을 방해하지 않는다.
7. **완성 후에는 GitHub 저장소 `oxomaz/jerry-games`에 push까지 수행한다.** 커밋 메시지는 "Add <게임이름> game" 또는 "Update <게임이름>" 형식으로 간결하게 작성한다.
   - 이 PC에는 **git CLI가 설치돼 있지 않다.** 터미널에서 `git` 명령을 쓰려 하지 말 것 (GitHub Desktop의 "Open in Command Prompt"는 `Unable to locate Git` 에러가 난다).
   - 대신 **GitHub Desktop**(설치·로그인 완료)을 컴퓨터 사용 권한으로 직접 조작한다: `Current repository`가 `jerry-games`인지 확인 → Summary 입력 → **Commit to main** → **Push origin**.
   - 브랜치 기본값 변경·삭제·이름 변경처럼 깃허브 웹에서만 되는 작업은 **구글 크롬**으로 `github.com/oxomaz/jerry-games`에 들어가 처리한다.
   - 푸시 후에는 `https://oxomaz.github.io/jerry-games/` 와 새 게임 주소가 실제로 열리는지 확인한다. (Pages: `main` 브랜치 / root)
7-1. **여러 게임이 함께 쓰는 코드는 루트 `common/` 폴더에 둔다.** 지금은 1:1 온라인 대결 라이브러리 `common/versus.js`, **여러 명(2~10명)이 한 방에 모이는 `common/room.js`**, 그리고 둘이 함께 쓰는 `common/peerjs.min.js`가 들어 있다. 게임에서는 `<script src="../../../common/versus.js"></script>`(또는 `room.js`)로 불러온다. 인원이 3명 이상이거나 손패처럼 **비밀 정보**가 있는 게임은 `room.js` 를 쓴다 — 방장이 판정을 전부 맡고(host-authoritative) 자리마다 다른 화면 정보만 보내주는 구조라 남의 손패가 전송되지 않는다. PeerJS는 CDN이 막힌 환경에서도 되도록 저장소에 함께 넣어두고, 없으면 unpkg CDN으로 자동 대체된다.
7-2. **새 게임은 반드시 `common/profile.js`(플레이어 · 기록 · 배지)를 붙인다.** `<script src="../../../common/profile.js"></script>` 로 불러오고, 전역 `JG` 를 쓴다.
   - 시작 화면에 `<div id="jgChip"></div>` + `JG.mountChip('jgChip')` — 현재 플레이어 칩(누르면 전환·추가).
   - 판이 끝나면 `JG.submit('<게임id>', {score, mode, unit, lowerIsBetter})`. `mode` 는 난이도·주제 같은 설정을 **사람이 읽을 수 있는 문자열**로 (모드별로 최고 기록이 따로 쌓인다). 온라인 대결 판은 `mode:"온라인 대결"` 로 분리한다.
   - 결과 화면에 `<div id="jgRes"></div>` + `JG.resultBox('jgRes', {gameId, score, res, unit, badges, extra})`.
   - 배지는 `common/profile.js` 의 `BADGES` 카탈로그에 게임별 3~5개를 먼저 정의하고, 게임에서 `JG.awardAll({...})` 로 준다. 루트 `index.html` 의 `GAMES` 배열 `id` 와 `profile.js` 의 `GAMES` 키는 **같아야 한다.**
   - 게임이 자체 `localStorage` 최고기록을 따로 두지 않는다. 진행상황 저장(점프맵 같은)은 예외로 유지하되, 기록·배지는 JG 로 일원화한다.
   - 학습용 게임은 `JG.shuffleBag()` / `JG.recentFilter()` 로 **같은 문제가 짧은 간격으로 반복되지 않게** 출제한다.
7-3. **모바일에서 화면이 잘리지 않게 만든다.** viewport meta 는 `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`. CSS 에서 `100vh` 대신 `var(--jg-vh, 100vh)` 를 쓴다(`profile.js` 가 visualViewport 기준 실제 높이를 채워준다). 노치·홈바는 `env(safe-area-inset-*)` 로 피한다. **가로 320px 에서 가로 스크롤 0**, 세로 640px·가로 740×360 에서 보드/캔버스/조작 버튼이 스크롤 없이 다 보여야 하며, 좌표 계산이 있는 게임은 스케일 변경 후 실제 클릭이 맞는지 반드시 테스트한다.
7-4. **기록은 로컬이 먼저, 서버는 그 위에 얹는다.** 게임 코드는 `JG`(profile.js)만 부르면 된다 — `profile.js`가 옆 폴더의 `common/records.js`를 자동으로 불러오고, `Records.useProfile(프로필id, 이름)`으로 묶어 **플레이어마다 서버 pid를 따로** 발급한다. 게임 파일에 `records.js` script 태그를 직접 넣지 않는다.
   - **오답노트**는 게임이 직접 보낸다. 학습용 게임은 판이 끝날 때 `if(window.Records && ...) Records.note("<서버 게임키>", [{q:문제, a:정답, my:내가_쓴_답}, ...])` 를 부른다 (한 번에 50개까지). 화면에 보여주는 오답 목록과 별개로 `{q,a,my}` 모양의 배열을 따로 쌓아 두면 된다.
   - **온라인 대결 전적**은 게임이 신경 쓰지 않는다. `common/versus.js` 의 승패 화면(`showResult`) 한 곳에서 `Records.versus()` 를 부르므로 대결을 붙인 게임은 전부 자동으로 기록된다. 상대가 중간에 나간 판은 세지 않는다.
   - `JG.submit()`은 **`profile.js`의 `RANKED` 표에 적힌 "순위표 모드"로 플레이한 판만** 서버(`api/` + Upstash Redis)에 올린다. 서버는 게임당 순위표(`lb:<game>` ZSET)가 하나뿐이라 난이도·주제가 섞이면 순위가 무의미해지기 때문이다. 게임의 `mode` 문자열을 바꾸면 `RANKED`의 정규식도 같이 고칠 것.
   - 점수가 **작을수록 좋은 게임**(SET의 클리어 시간 등)은 서버 ZSET이 큰 값을 이긴 것으로 보므로 순위표에서 제외한다. 로컬 기록·배지는 그대로 남긴다.
   - 새 게임을 추가하면 `api/_lib.js`의 `GAMES` 목록에도 게임 키와 점수 상한을 등록해야 한다(등록 안 된 게임은 서버가 거부한다). 자세한 내용은 `api/README.md` 참고.
   - 서버가 없거나 인터넷이 끊겨도 게임은 정상 동작해야 한다. 못 보낸 기록은 `records.js`가 큐에 쌓아 두었다가 다음 접속에 자동 재전송한다.
8. 한국어 게임명/설명을 기본으로 하되, 폴더/파일 경로는 영문으로 유지한다.
9. **난이도가 있는 게임은 실제로 클리어 가능한지 검증한다.** 자동 생성 레벨을 쓰는 경우, 물리/규칙을 그대로 시뮬레이션해 모든 단계가 통과 가능한지 확인한 뒤 커밋한다.

## 새 게임 만드는 흐름 (예시)

```
나: game-5 폴더 만들고 벽돌깨기 게임 만들어줘. (재미용)
Claude:
1. games/fun/brick-breaker/index.html 생성 (HTML/CSS/JS 단일 파일, ← 게임 목록 링크 포함)
2. games/fun/brick-breaker/README.md 생성
3. 루트 index.html의 GAMES 배열(category: "fun") + README.md 표·상세 섹션에 항목 추가
4. GitHub Desktop에서 "Add brick-breaker game"으로 Commit to main → Push origin
5. https://oxomaz.github.io/jerry-games/games/fun/brick-breaker/ 접속 확인
```
