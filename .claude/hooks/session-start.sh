#!/bin/bash
# 매 세션 시작 시 reels 렌더링 파이프라인이 바로 동작하도록 환경을 갖춘다.
# (수동으로 매번 다시 설치하지 않아도 되게 하기 위함 — daily-reels 자동화가
#  새 세션/컨테이너에서 실행될 때도 그대로 동작해야 하기 때문.)
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# 1) ffmpeg (libx264 포함) — Playwright 내장 ffmpeg은 webm/vp8 전용이라 mp4 인코딩이 안 됨
# apt-get update가 이 컨테이너와 무관한 PPA(예: deadsnakes) 때문에 0이 아닌 코드로
# 끝나도(일부 저장소만 실패), 핵심 우분투 저장소 목록은 대개 갱신되어 있으므로 계속 진행한다.
# (ffmpeg | grep -q 파이프는 pipefail 아래서 grep이 먼저 끝나 ffmpeg가 SIGPIPE로 죽으면
#  grep이 찾았어도 파이프 전체가 실패로 보일 수 있어, 출력을 변수에 먼저 담아 grep한다.)
FFMPEG_ENCODERS="$(command -v ffmpeg >/dev/null 2>&1 && ffmpeg -hide_banner -encoders 2>/dev/null || true)"
if ! grep -q libx264 <<< "$FFMPEG_ENCODERS"; then
  sudo apt-get update -qq || true
  sudo apt-get install -y --no-install-recommends ffmpeg -qq
fi

# 2) 전역 설치된 Playwright를 로컬에서 import할 수 있게 심볼릭 링크
mkdir -p "$CLAUDE_PROJECT_DIR/node_modules"
if [ -d /opt/node22/lib/node_modules/playwright ]; then
  ln -sfn /opt/node22/lib/node_modules/playwright "$CLAUDE_PROJECT_DIR/node_modules/playwright"
fi
