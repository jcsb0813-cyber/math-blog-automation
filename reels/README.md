# 수학 릴스(숏폼) 자동화 파이프라인

학년 블로그 자동화(`.claude/skills/blog-auto/`)와 별개로, **틱톡/릴스용 20~25초 수학 숏폼
영상**을 만드는 파이프라인입니다. 검정 배경 + 네온 라인 모션그래픽으로, "호기심 유발 →
접근 → 문제 해결 → 다음 편 궁금증(클리프행어)" 구조를 따르고, 마지막에 `77math` 로고가
타이핑되다가 깨져서 사라지는 아웃트로로 끝납니다.

## 왜 이런 구조인가

- **완전 코드 기반**: PNG 프레임을 일일이 타임라인 편집기로 만드는 대신, 캔버스를
  `render(ctx, t)` 함수 하나로 정의합니다. `t`(초)를 넣으면 항상 같은 프레임이 나오는
  **결정론적** 렌더링이라, 서버 성능과 무관하게 매번 똑같은 결과가 나옵니다.
- **주제 = 데이터가 아니라 코드**: 원뿔곡선처럼 "도형이 실시간으로 계산되는" 주제가
  많아서, 스토리보드를 JSON이 아니라 JS 모듈로 둡니다(원뿔 단면 곡선 수식 등 로직이 필요).
- **인터넷 접속 불필요**: 웹폰트/CDN 라이브러리 없이 시스템 폰트 + Canvas API만 사용해서
  오프라인 렌더 서버에서도 그대로 동작합니다.

## 폴더 구조

- `engine.js` — 주제에 종속되지 않는 범용 헬퍼 (네온 글로우 선, 진행률 기반 선 그리기,
  글리치 텍스트, 타이핑 텍스트, 파티클 산산조각 효과, 3D 프로젝션, 배경/스파크 등)
- `storyboards/<topic>.js` — 주제별 장면 연출. `T`(타임라인), `render(ctx, t)`,
  `DURATION`, `meta`(제목/해시태그 후보)를 export 해야 합니다.
- `player.html` — 브라우저에서 스토리보드를 재생하는 뷰어.
  - 미리보기(라이브 재생): `player.html?story=conic_sections`
  - 캡처 모드(Playwright 전용, 자동재생 안 함): `?story=conic_sections&capture=1`
- `render.mjs` — Playwright로 프레임을 한 장씩 정확히 캡처한 뒤 시스템 ffmpeg으로
  mp4(H.264)로 인코딩하는 CLI.

## 사용법

### 0) 최초 1회 환경 준비
```
ln -sfn /opt/node22/lib/node_modules/playwright node_modules/playwright
```
(전역 설치된 Playwright를 로컬에서 `import`할 수 있게 심볼릭 링크만 겁니다. `node_modules/`는
git에 커밋하지 않습니다 — `.gitignore` 참고.)

시스템에 `ffmpeg`(libx264 포함)가 없다면 설치합니다:
```
sudo apt-get update && sudo apt-get install -y --no-install-recommends ffmpeg
```
(Playwright에 내장된 ffmpeg은 webm/vp8 스크린캐스트 전용 경량 빌드라 mp4 인코딩이 안 됩니다.)

### 1) 브라우저에서 미리보기
```
npx http-server reels -p 8787
# 브라우저에서 http://localhost:8787/player.html?story=conic_sections
```

### 2) mp4로 렌더링
```
node reels/render.mjs --story conic_sections --out output/reels/conic_sections.mp4 --fps 30
```
결과: 1080x1920 세로 mp4. `output/`는 `.gitignore`에 포함되어 있어 렌더 결과물은
커밋되지 않습니다(용량 문제 + 회차별 산출물이라 블로그 파이프라인과 동일한 정책).

## 새 주제 추가하기

1. `reels/storyboards/<topic>.js`를 만듭니다. `conic_sections.js`를 템플릿으로 복사하세요.
2. 타임라인은 20~25초 안에서 `HOOK → APPROACH → (문제 해결 비트들) → CLIFF → OUTRO` 순서를
   지킵니다. `OUTRO`는 `77math` 타이핑+산산조각 아웃트로를 그대로 재사용하면 됩니다
   (`makeShatterSprite`/`drawShatter`는 `engine.js`에 이미 있습니다).
3. `render(ctx, t)` 하나만 export하면 나머지 파이프라인(뷰어, 렌더러)은 그대로 재사용됩니다.
4. `meta.title`/`meta.hashtags`에 후보 제목·해시태그를 적어두면 업로드 시 바로 씁니다.

다음 후보 주제 예시(참고 기획서에서): 무한등비급수 등.

## 알려진 한계 / TODO
- 음성/배경음악 없음(무음 mp4). 필요하면 별도로 TTS/효과음을 입혀서 mux하세요.
- 자막(캡션)은 화면에 직접 그려진 텍스트뿐이라, 플랫폼 자동 자막과 별개입니다.
- 원뿔곡선 단면 곡선은 실제 원뿔-평면 교선 방정식(수치적으로 유효 구간을 찾는 방식)으로
  계산되어 수학적으로 정확합니다. 다른 주제는 필요에 따라 직접 수식을 세워야 합니다.
