---
name: reels-auto
description: 주제(예 "원뿔곡선", "무한등비급수")를 입력받아 20~25초 수학 숏폼(틱톡/릴스용) 영상을 네온 모션그래픽으로 자동 렌더링한다. "수학릴스", "숏폼 자동화", "틱톡 영상" 등의 요청과 /reels-auto 호출 시 사용.
---

# 수학 릴스(숏폼) 자동화 파이프라인

입력: 영상으로 만들 수학 주제 1개(예: "원뿔곡선", "무한등비급수"). 선택 입력: 이미
정리된 기획안(호기심 포인트, 단계별 설명, 실생활 연결)이 있으면 함께 전달.

이 스킬은 **영상 파일(mp4)까지 렌더링**한다. 업로드(틱톡/릴스 게시)는 하지 않는다 —
최종 게시는 사람이 제목/해시태그를 확인한 뒤 직접 올린다.

## 0단계 — 사전 점검
- `reels/README.md`를 읽고 환경이 준비됐는지 확인한다:
  - `node_modules/playwright` 심볼릭 링크가 있는지 (`ls node_modules/playwright`)
  - `which ffmpeg` 결과가 libx264를 포함하는 시스템 ffmpeg인지 (`ffmpeg -encoders | grep 264`).
    Playwright 내장 ffmpeg만 있으면 mp4 인코딩이 실패하니, 안내된 `apt-get install` 명령을
    실행해야 한다.
- 둘 다 없으면 조용히 넘어가지 말고 README의 "0) 최초 1회 환경 준비" 명령을 실행해서
  갖춘 뒤 진행한다.

## 1단계 — 스토리 기획
- 구조는 항상 **호기심 유발 → 접근 → 문제 해결(2~4개 비트) → 다음 편 궁금증(클리프행어)
  → 77math 아웃트로**를 따른다. 전체 길이는 20~25초.
- 사용자가 기획안을 줬다면 그 내용(단계별 설명, 실생활 연결 포인트)을 그대로 스토리
  비트로 옮긴다. 없다면 주제의 핵심 개념을 2~4단계로 쪼개고, 각 단계마다 "왜 흥미로운가"
  한 줄을 붙인다.
- 제목 후보 2~3개와 해시태그 5개 내외를 뽑는다(클릭베이트 금지, 기존 성공 패턴처럼
  "행동 기반 호기심 유발" 톤 — 예: "~했더니 나타나는 ~").

## 2단계 — 스토리보드 작성
- `reels/storyboards/conic_sections.js`를 템플릿으로 삼아 `reels/storyboards/<topic>.js`를
  새로 만든다.
- 재사용 가능한 시각 효과는 전부 `reels/engine.js`의 헬퍼를 쓴다(네온 글로우 선,
  진행률 기반 선 그리기, 글리치/타이핑 텍스트, 파티클 산산조각 등). 주제 전용 도형
  로직(예: 원뿔 단면 계산)만 스토리보드 파일 안에 둔다.
- 아웃트로는 항상 `77math` 타이핑 → 산산조각 효과로 끝낸다(`engine.js`의
  `makeShatterSprite`/`drawShatter` 재사용).
- 색상은 `engine.js`의 `NEON` 팔레트(cyan/magenta/yellow/purple/white)를 벗어나지 않는다 —
  여러 영상이 시리즈로 쌓였을 때 톤이 통일되도록.

## 3단계 — 미리보기 & 렌더링
- 빠른 확인: 낮은 fps(예 `--fps 6`)로 먼저 렌더링해서 타이밍/레이아웃이 맞는지 본다.
  ```
  node reels/render.mjs --story <topic> --out output/reels/<topic>_preview.mp4 --fps 6
  ```
- 문제 없으면 최종 화질로 렌더링한다.
  ```
  node reels/render.mjs --story <topic> --out output/reels/<topic>.mp4 --fps 30
  ```
- 렌더링된 mp4의 길이가 20~25초 범위인지, 해상도가 1080x1920인지 확인한다
  (`ffprobe -v error -show_entries format=duration -show_entries stream=width,height output/reels/<topic>.mp4`).

## 4단계 — 최종 전달
사용자에게 아래를 전달한다(채팅에 전체 코드를 다시 늘어놓지 않는다 — 영상 파일이 결과물이다):
- 렌더링된 mp4 파일
- 제목 후보 2~3개, 해시태그 (스토리보드의 `meta` export 참고)
- `[확인필요]` — 예를 들어 사실관계(케플러 법칙, 실생활 예시 등)는 원장님/기획자가
  한 번 더 검수해야 한다고 짚어준다. 이 스킬은 사실관계 검증을 자동으로 하지 않는다.
