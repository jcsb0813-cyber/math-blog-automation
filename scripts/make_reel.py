"""사진 폴더 + 대본으로 인스타그램 릴스(1080x1920 세로 영상)를 자동 생성한다.

- 사진 1장당 기본 1초씩 (파일명 순서대로) 이어 붙인다.
- 대본 파일(txt)의 한 줄 = 자막 한 줄. 줄 수가 사진 수와 같으면 사진 1장에 자막 1줄이
  매칭되고, 다르면 전체 영상 길이를 줄 수만큼 균등하게 나눠서 자막을 띄운다.
- 자막은 영상에 직접 새겨지고(번인), 같은 이름의 .srt 파일도 함께 저장한다
  (인스타 업로드 시 자막을 따로 쓰고 싶을 때용).

사용 예:
    python scripts/make_reel.py --photos ./reel_photos --script ./reel_script.txt
    python scripts/make_reel.py --photos ./reel_photos --script ./reel_script.txt \
        --seconds 1.5 --music ./bgm.mp3 --out output/reels/중2_시험대비.mp4

필요 패키지: pip install pillow imageio-ffmpeg  (ffmpeg가 설치돼 있으면 그걸 우선 사용)
"""

import argparse
import datetime
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

WIDTH, HEIGHT = 1080, 1920
FPS = 30
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

# 브랜드 기준 (카드뉴스와 동일한 노란색 포인트)
BRAND_YELLOW = (255, 214, 0)

# 한글이 되는 폰트를 OS별로 순서대로 찾는다. --font 로 직접 지정 가능.
FONT_CANDIDATES = [
    # Windows
    "C:/Windows/Fonts/malgunbd.ttf",
    "C:/Windows/Fonts/malgun.ttf",
    # macOS
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/Library/Fonts/NanumGothicExtraBold.ttf",
    "/Library/Fonts/NanumGothicBold.ttf",
    # Linux
    "/usr/share/fonts/truetype/nanum/NanumGothicExtraBold.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
]


def find_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg를 찾을 수 없습니다. `pip install imageio-ffmpeg` 후 다시 실행하세요.")


def find_font(user_font: str | None) -> str:
    if user_font:
        if not Path(user_font).exists():
            sys.exit(f"폰트 파일이 없습니다: {user_font}")
        return user_font
    for cand in FONT_CANDIDATES:
        if Path(cand).exists():
            return cand
    sys.exit("한글 폰트를 찾지 못했습니다. --font 로 .ttf/.otf/.ttc 경로를 지정하세요.")


def load_photos(folder: Path) -> list[Path]:
    photos = sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTS)
    if not photos:
        sys.exit(f"사진이 없습니다: {folder}")
    return photos


def load_script(path: Path) -> list[str]:
    lines = [ln.strip() for ln in path.read_text(encoding="utf-8-sig").splitlines()]
    lines = [ln for ln in lines if ln and not ln.startswith("#")]
    if not lines:
        sys.exit(f"대본이 비어 있습니다: {path}")
    return lines


def fit_vertical(img: Image.Image) -> Image.Image:
    """사진을 9:16 캔버스에 맞춘다. 비율이 다르면 흐린 배경 위에 원본 전체를 얹는다."""
    img = ImageOps.exif_transpose(img).convert("RGB")
    bg = ImageOps.fit(img, (WIDTH, HEIGHT), Image.LANCZOS).filter(ImageFilter.GaussianBlur(40))
    bg = Image.blend(bg, Image.new("RGB", bg.size, (0, 0, 0)), 0.35)
    fg = ImageOps.contain(img, (WIDTH, HEIGHT), Image.LANCZOS)
    bg.paste(fg, ((WIDTH - fg.width) // 2, (HEIGHT - fg.height) // 2))
    return bg


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    """한글은 띄어쓰기 단위로, 한 단어가 너무 길면 글자 단위로 줄바꿈한다."""
    lines: list[str] = []
    for para in text.split("\\n"):
        cur = ""
        for word in para.split(" "):
            trial = f"{cur} {word}".strip()
            if draw.textlength(trial, font=font) <= max_width:
                cur = trial
                continue
            if cur:
                lines.append(cur)
            cur = ""
            for ch in word:
                if draw.textlength(cur + ch, font=font) > max_width and cur:
                    lines.append(cur)
                    cur = ""
                cur += ch
        if cur:
            lines.append(cur)
    return lines


def draw_subtitle(frame: Image.Image, text: str, font_path: str, font_size: int, position: str) -> Image.Image:
    if not text:
        return frame
    frame = frame.copy()
    draw = ImageDraw.Draw(frame)
    font = ImageFont.truetype(font_path, font_size)
    max_w = WIDTH - 160
    lines = wrap_text(draw, text, font, max_w)
    line_h = int(font_size * 1.35)
    block_h = line_h * len(lines)

    # 인스타 릴스 UI(하단 캡션/버튼)에 가리지 않도록 세이프존 안쪽에 배치
    if position == "top":
        top = 260
    elif position == "center":
        top = (HEIGHT - block_h) // 2
    else:
        top = HEIGHT - 480 - block_h

    for i, line in enumerate(lines):
        w = draw.textlength(line, font=font)
        x = (WIDTH - w) / 2
        y = top + i * line_h
        # 노란 형광펜 띠 + 검은 글씨 (브랜드 노란색 포인트)
        pad_x, pad_y = 24, 8
        draw.rounded_rectangle(
            [x - pad_x, y - pad_y, x + w + pad_x, y + line_h - pad_y],
            radius=14,
            fill=BRAND_YELLOW,
        )
        draw.text((x, y), line, font=font, fill=(20, 20, 20))
    return frame


def build_timeline(n_photos: int, seconds: float, n_lines: int) -> tuple[list[float], list[tuple[float, float]]]:
    """사진 경계와 자막 구간을 계산한다."""
    total = n_photos * seconds
    photo_bounds = [i * seconds for i in range(n_photos + 1)]
    step = total / n_lines
    subs = [(round(i * step, 3), round((i + 1) * step, 3)) for i in range(n_lines)]
    return photo_bounds, subs


def srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def write_srt(path: Path, lines: list[str], subs: list[tuple[float, float]]) -> None:
    out = []
    for i, (text, (start, end)) in enumerate(zip(lines, subs), 1):
        out.append(f"{i}\n{srt_time(start)} --> {srt_time(end)}\n{text.replace(chr(92) + 'n', chr(10))}\n")
    path.write_text("\n".join(out), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="사진 + 대본 → 인스타 릴스 영상")
    ap.add_argument("--photos", required=True, help="사진 폴더 (파일명 순서대로 사용)")
    ap.add_argument("--script", required=True, help="대본 txt (한 줄 = 자막 한 줄, #으로 시작하면 무시, \\n 쓰면 강제 줄바꿈)")
    ap.add_argument("--seconds", type=float, default=1.0, help="사진 1장당 초 (기본 1초)")
    ap.add_argument("--out", help="저장 경로 (기본: output/reels/reel_<시각>.mp4)")
    ap.add_argument("--music", help="배경음악 파일 (선택, 영상 길이에 맞춰 자르고 페이드아웃)")
    ap.add_argument("--font", help="자막 폰트 경로 (기본: 한글 폰트 자동 탐색)")
    ap.add_argument("--font-size", type=int, default=72)
    ap.add_argument("--position", choices=["bottom", "center", "top"], default="bottom")
    args = ap.parse_args()

    if args.seconds <= 0:
        sys.exit("--seconds 는 0보다 커야 합니다.")

    photos = load_photos(Path(args.photos))
    lines = load_script(Path(args.script))
    font_path = find_font(args.font)
    ffmpeg = find_ffmpeg()

    out = Path(args.out) if args.out else Path("output/reels") / f"reel_{datetime.datetime.now():%Y%m%d_%H%M%S}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)

    photo_bounds, subs = build_timeline(len(photos), args.seconds, len(lines))
    if len(lines) != len(photos):
        print(f"※ 사진 {len(photos)}장 / 대본 {len(lines)}줄 — 개수가 달라서 자막을 전체 길이에 균등 배분합니다.")

    # 사진 경계 + 자막 경계를 합쳐서 "화면이 바뀌는 순간"마다 정지 프레임 1장씩 만든다.
    cuts = sorted({round(t, 3) for t in photo_bounds} | {s for s, _ in subs} | {e for _, e in subs})
    total = photo_bounds[-1]
    cuts = [c for c in cuts if c <= total + 1e-6]

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        bases: dict[int, Image.Image] = {}
        concat = []
        for k in range(len(cuts) - 1):
            start, end = cuts[k], cuts[k + 1]
            if end - start < 1e-6:
                continue
            mid = (start + end) / 2
            pi = min(int(mid // args.seconds), len(photos) - 1)
            si = next(i for i, (s, e) in enumerate(subs) if s <= mid < e or i == len(subs) - 1)
            if pi not in bases:
                with Image.open(photos[pi]) as im:
                    bases[pi] = fit_vertical(im)
            frame = draw_subtitle(bases[pi], lines[si], font_path, args.font_size, args.position)
            fp = tmpdir / f"seg_{k:04}.png"
            frame.save(fp)
            concat.append(f"file '{fp.as_posix()}'\nduration {end - start:.3f}")
        # concat demuxer는 마지막 파일을 한 번 더 적어줘야 마지막 duration이 반영된다.
        concat.append(concat[-1].split("\n")[0])
        list_file = tmpdir / "list.txt"
        list_file.write_text("\n".join(concat), encoding="utf-8")

        cmd = [ffmpeg, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(list_file)]
        if args.music:
            cmd += ["-i", args.music]
        cmd += ["-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "20"]
        if args.music:
            fade_start = max(0.0, total - 1.0)
            cmd += [
                "-af", f"afade=t=out:st={fade_start:.3f}:d=1",
                "-c:a", "aac", "-b:a", "192k", "-map", "0:v", "-map", "1:a", "-shortest",
            ]
        cmd += ["-t", f"{total:.3f}", "-movflags", "+faststart", str(out)]
        subprocess.run(cmd, check=True)

    srt = out.with_suffix(".srt")
    write_srt(srt, lines, subs)
    print(f"완료: {out}  ({total:.1f}초, 사진 {len(photos)}장, 자막 {len(lines)}줄)")
    print(f"자막 파일: {srt}")


if __name__ == "__main__":
    main()
