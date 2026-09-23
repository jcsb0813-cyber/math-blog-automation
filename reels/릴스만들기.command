#!/bin/bash
# 맥용: 더블클릭하면 바탕화면/릴스 안의 1번, 2번 … 폴더를 한 번에 영상으로 만듭니다.
# 결과: 바탕화면/릴스/완성영상/1번.mp4, 2번.mp4 …
cd "$(dirname "$0")" || exit 1
TARGET="${1:-$HOME/Desktop/릴스}"
VENV="$HOME/.reels-venv"

if [ ! -d "$TARGET" ]; then
  echo "폴더를 찾을 수 없습니다: $TARGET"
  echo "바탕화면에 '릴스' 폴더를 만들고 그 안에 1번, 2번 … 폴더로 사진을 넣어주세요."
  read -r -p "엔터를 누르면 닫힙니다."; exit 1
fi
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

"$VENV/bin/python" make_reel.py --photos "$TARGET" --fill && open "$TARGET/완성영상"
read -r -p "끝났습니다. 엔터를 누르면 닫힙니다."
