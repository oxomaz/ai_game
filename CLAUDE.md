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
7-1. **여러 게임이 함께 쓰는 코드는 루트 `common/` 폴더에 둔다.** 지금은 온라인 대결 라이브러리 `common/versus.js`와 그것이 쓰는 `common/peerjs.min.js`가 들어 있다. 게임에서는 `<script src="../../../common/versus.js"></script>`로 불러온다. PeerJS는 CDN이 막힌 환경에서도 되도록 저장소에 함께 넣어두고, 없으면 unpkg CDN으로 자동 대체된다.
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
