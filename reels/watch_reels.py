"""릴스 폴더를 계속 지켜보다가, 사진이 들어온 폴더를 자동으로 영상으로 만든다.

    릴스\
     ├─ 1번\  ← 사진을 넣으면 잠시 뒤 1번\1번.mp4 가 생김
     ├─ 2번\  ← 비어 있으면 그냥 기다림
     └─ ...

- 폴더에 사진이 없으면 아무것도 하지 않고 기다린다.
- 사진이 들어오면, 추가가 끝날 때까지(기본 10초간 변화 없음) 기다렸다가 영상을 만든다.
  → 사진을 여러 장 옮기는 중간에 영상이 만들어지지 않는다.
- 첫 사진은 1초, 나머지 사진은 0.7초씩 (--first-seconds / --seconds 로 변경).
- 영상은 그 폴더 안에 "<폴더이름>.mp4" 로 저장한다.
- 이미 영상을 만든 폴더에 사진을 더 넣거나 바꾸면 영상을 다시 만든다.
- 폴더에 대본.txt 가 있으면 그 내용을 첫 사진(처음 1초)에 제목 자막으로 넣는다 (줄바꿈 그대로).
- 꺼져 있거나 잠자기였던 동안 들어온 사진은, 다시 켜지면 확인해서 영상을 만든다.

사용 예:
    python watch_reels.py --root "C:/Users/나/Desktop/릴스" --create 100
    (Ctrl+C 로 종료)
"""

from __future__ import annotations  # macOS 기본 파이썬(3.9)에서도 동작하도록

import argparse
import datetime
import time
from pathlib import Path
from types import SimpleNamespace

from make_reel import IMAGE_EXTS, find_ffmpeg, find_font, load_script, make_reel, natural_key


def log(msg: str) -> None:
    print(f"[{datetime.datetime.now():%H:%M:%S}] {msg}", flush=True)


def photo_files(folder: Path) -> list[Path]:
    return sorted((p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS),
                  key=lambda p: natural_key(p.name))


def signature(photos: list[Path], folder: Path) -> tuple:
    """사진 목록/크기/수정시각 (+대본) — 이 값이 바뀌면 '사진이 바뀌었다'고 본다."""
    files = photos + [p for p in [folder / "대본.txt"] if p.exists()]
    return tuple((p.name, p.stat().st_size, p.stat().st_mtime) for p in files)


def done_marker(folder: Path) -> Path:
    """영상을 어떤 사진들로 만들었는지 적어두는 숨김 파일 (프로그램을 다시 켜도 기억하도록)."""
    return folder / f".{folder.name}.만든사진목록"


def content_key(sig: tuple) -> str:
    # 수정시각은 iCloud 동기화 중 바뀔 수 있어서 이름+크기만 비교
    return "\n".join(f"{name}\t{size}" for name, size, _ in sig)


def main() -> None:
    ap = argparse.ArgumentParser(description="릴스 폴더 자동 감시 → 사진이 들어오면 영상 생성")
    ap.add_argument("--root", required=True, help="1번, 2번 … 폴더들이 들어 있는 상위 폴더")
    ap.add_argument("--create", type=int, default=0, help="1번~N번 폴더를 미리 만들어 둠 (이미 있으면 건너뜀)")
    ap.add_argument("--settle", type=float, default=10, help="마지막 사진이 들어온 뒤 이만큼(초) 변화가 없으면 작업 시작")
    ap.add_argument("--interval", type=float, default=3, help="폴더 확인 주기(초)")
    ap.add_argument("--first-seconds", type=float, default=1.0, help="첫 사진 길이(초)")
    ap.add_argument("--seconds", type=float, default=0.7, help="두 번째 사진부터 1장당 길이(초)")
    ap.add_argument("--no-fill", action="store_true", help="화면 꽉 채우지 않고 흐린 여백으로 원본 전체 보이기")
    args = ap.parse_args()

    root = Path(args.root)
    root.mkdir(parents=True, exist_ok=True)
    for i in range(1, args.create + 1):
        (root / f"{i}번").mkdir(exist_ok=True)

    ffmpeg = find_ffmpeg()
    # 대본.txt 가 있으면: 첫 사진(처음 1초)에만, 화면 위쪽 1/3 지점에 제목 자막
    opts = SimpleNamespace(seconds=args.seconds, first_seconds=args.first_seconds, fill=not args.no_fill, music=None,
                           font=None, font_size=80, position="third", first_only=True)

    seen: dict[Path, tuple] = {}      # 폴더 → 마지막으로 본 사진 상태
    changed_at: dict[Path, float] = {}  # 폴더 → 사진 상태가 마지막으로 바뀐 시각
    built: dict[Path, tuple] = {}     # 폴더 → 영상을 만들 때의 사진 상태

    log(f"감시 시작: {root}  (첫 사진 {args.first_seconds:g}초 + 나머지 {args.seconds:g}초씩, 종료는 Ctrl+C)")
    try:
        while True:
            folders = sorted((d for d in root.iterdir() if d.is_dir()), key=lambda d: natural_key(d.name))
            for folder in folders:
                try:
                    photos = photo_files(folder)
                    if not photos:
                        continue
                    sig = signature(photos, folder)
                except OSError:
                    continue  # 복사 중이라 파일을 못 읽는 경우 → 다음 확인 때 다시

                out = folder / f"{folder.name}.mp4"
                if folder not in built and out.exists():
                    # 프로그램을 다시 켰을 때(잠자기/재부팅 후): 같은 사진으로 이미 만든 영상이면 건너뜀
                    marker = done_marker(folder)
                    if marker.exists() and marker.read_text(encoding="utf-8") == content_key(sig):
                        built[folder] = sig
                if built.get(folder) == sig:
                    continue

                now = time.time()
                if seen.get(folder) != sig:
                    seen[folder] = sig
                    changed_at[folder] = now
                    log(f"{folder.name}: 사진 {len(photos)}장 감지 — 추가가 끝나길 기다리는 중…")
                    continue
                if now - changed_at[folder] < args.settle:
                    continue

                try:
                    script = folder / "대본.txt"
                    lines = load_script(script) if script.exists() else [""]
                    font_path = find_font(None) if lines != [""] else ""
                    log(f"{folder.name}: 영상 만드는 중 (사진 {len(photos)}장)")
                    # 임시 이름으로 만든 뒤 바꿔치기 → 만드는 도중의 반쪽짜리 영상이 보이지 않게
                    tmp = folder / f"{folder.name}.만드는중.mp4"
                    make_reel(photos, tmp, lines, font_path, ffmpeg, opts)
                    tmp.replace(out)
                    tmp.with_suffix(".srt").unlink(missing_ok=True)  # 자막 파일은 폴더에 남기지 않음
                    done_marker(folder).write_text(content_key(sig), encoding="utf-8")
                    log(f"{folder.name}: 완료 → {out}")
                    built[folder] = sig
                except (Exception, SystemExit) as e:  # 사진 한 장이 깨져도 감시는 계속
                    log(f"{folder.name}: 실패 — {e}  (사진을 확인해 주세요. 사진이 바뀌면 다시 시도합니다)")
                    built[folder] = sig
            time.sleep(args.interval)
    except KeyboardInterrupt:
        log("감시 종료")


if __name__ == "__main__":
    main()
