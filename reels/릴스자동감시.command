#!/bin/bash
# 맥용: 더블클릭하면 iCloud Drive/릴스 (없으면 바탕화면/릴스) 에 1번~100번 폴더를 만들고 계속 지켜봅니다.
# 폴더에 사진을 넣으면 10초 뒤 그 폴더 안에 영상(예: 1번/1번.mp4)이 만들어집니다.
# 끄려면 이 터미널 창을 닫으면 됩니다.
cd "$(dirname "$0")" || exit 1
# iCloud Drive가 켜져 있으면 iCloud Drive/릴스 (아이패드 파일 앱에서도 보임), 아니면 바탕화면/릴스
ICLOUD="$HOME/Library/Mobile Documents/com~apple~CloudDocs"
if [ -d "$ICLOUD" ]; then DEFAULT="$ICLOUD/릴스"; else DEFAULT="$HOME/Desktop/릴스"; fi
TARGET="${1:-$DEFAULT}"
VENV="$HOME/.reels-venv"

if ! command -v python3 > /dev/null 2>&1; then
  echo "파이썬이 없습니다. https://www.python.org/downloads/ 에서 macOS용을 설치한 뒤 다시 실행하세요."
  read -r -p "엔터를 누르면 닫힙니다."; exit 1
fi
if [ ! -x "$VENV/bin/python" ]; then
  echo "처음 실행 준비 중입니다 (1~2분, 한 번만)…"
  python3 -m venv "$VENV" || { read -r -p "준비 실패. 엔터를 누르면 닫힙니다."; exit 1; }
fi
"$VENV/bin/python" -m pip install --quiet --disable-pip-version-check pillow imageio-ffmpeg pillow-heif \
  || { read -r -p "패키지 설치 실패 (인터넷 연결 확인). 엔터를 누르면 닫힙니다."; exit 1; }

mkdir -p "$TARGET" && open "$TARGET"
"$VENV/bin/python" watch_reels.py --root "$TARGET" --create 100
