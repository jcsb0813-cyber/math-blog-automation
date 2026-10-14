#!/usr/bin/env python3
"""릴스 자동 제작: 폴더의 사진을 1초씩 이어붙이고, 주제 은행(reels/topics.json)의 자막을 장면마다 입혀
9:16 mp4 로 저장한다. (사진 슬라이드쇼 -> 자막 -> 검수용 체크표까지 한 번에)

사용:
  python3 scripts/reels_build.py --root ~/릴스 --out output/reels            # 1번~12번 전부
  python3 scripts/reels_build.py --root ~/릴스 --only 1 3 --sec 1.5         # 일부만, 사진당 1.5초
  (얼굴 자동 모자이크는 기본 적용: 정면 얼굴만 가리고 숙인/옆모습은 그대로. 끄려면 --no-blur)
  python3 scripts/reels_build.py --video 1번.mp4 --folder 1 --out output/reels  # 이미 만든 mp4에 자막만

필요: ffmpeg, Pillow (pip install pillow). 한글 폰트는 --font 로 지정 (기본: 맥/리눅스 후보 자동 탐색).
"""
import argparse, json, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
YELLOW = (255, 214, 0)  # 학원 메인 컬러 (마지막 구독유도 줄만 사용)
STROKE = 0              # 글씨 굵기 보정(필요시 1)
CAPTION_CENTER_Y = 0.284  # 기존 영상 자막의 세로 중심(화면 높이 대비)
IMG_EXT = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
FONT_CANDIDATES = [
    str(Path(__file__).resolve().parent.parent / "reels" / "fonts" / "GamjaFlower-Regular.ttf"),
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/Library/Fonts/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
]
TOPICS = Path(__file__).resolve().parent.parent / "reels" / "topics.json"


def find_font(arg):
    for p in ([arg] if arg else []) + FONT_CANDIDATES:
        if p and Path(p).exists():
            return p
    sys.exit("한글 폰트를 못 찾았습니다. --font 로 .ttf/.ttc 경로를 지정하세요.")


def caption_png(text, font_path, path, size=76, last=False):
    """기존 릴스 자막과 동일한 모양: 모서리 각진 불투명 흰 박스 + 검정 손글씨체, 가운데 정렬."""
    font = ImageFont.truetype(font_path, size)
    pad_x, pad_y = 48, 26
    tmp = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = tmp.textbbox((0, 0), text, font=font, stroke_width=STROKE)
    w, h = min(r - l + pad_x * 2, W - 60), b - t + pad_y * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, w, h), fill=YELLOW if last else (255, 255, 255, 255))
    d.text(((w - (r - l)) // 2 - l, pad_y - t), text, font=font, fill=(0, 0, 0, 255),
           stroke_width=STROKE, stroke_fill=(0, 0, 0, 255))
    img.save(path)


def photos_in(folder):
    return sorted(p for p in Path(folder).iterdir() if p.suffix.lower() in IMG_EXT and not p.name.startswith("."))


def slideshow(photos, sec, out):
    """사진 -> 1080x1920 중앙 크롭, 장당 sec초."""
    with tempfile.TemporaryDirectory() as td:
        lst = Path(td) / "list.txt"
        frames = []
        for i, p in enumerate(photos):
            im = Image.open(p).convert("RGB")
            s = max(W / im.width, H / im.height)
            im = im.resize((round(im.width * s), round(im.height * s)))
            x, y = (im.width - W) // 2, (im.height - H) // 2
            f = Path(td) / f"{i:03d}.jpg"
            im.crop((x, y, x + W, y + H)).save(f, quality=92)
            frames.append(f)
        lst.write_text("".join(f"file '{f}'\nduration {sec}\n" for f in frames) + f"file '{frames[-1]}'\n")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                        "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18", str(out)], check=True)


def duration(video):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout)


def add_captions(video, lines, font_path, out):
    """lines 를 영상 길이에 균등 배분(장면마다 1줄)해서 입힌다. 짧은 영상이면 줄당 시간이 자동으로 줄어든다."""
    total = duration(video)
    per = total / len(lines)
    with tempfile.TemporaryDirectory() as td:
        inputs, chain, last = ["-i", str(video)], [], "0:v"
        for i, line in enumerate(lines):
            png = Path(td) / f"c{i}.png"
            caption_png(line, font_path, png, last=(i == len(lines) - 1))
            inputs += ["-i", str(png)]
            a, b = i * per, (i + 1) * per
            chain.append(f"[{last}][{i+1}:v]overlay=x=(W-w)/2:y=H*{CAPTION_CENTER_Y}-h/2:enable='between(t,{a:.2f},{b:.2f})'[v{i}]")
            last = f"v{i}"
        subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(chain),
                        "-map", f"[{last}]", "-map", "0:a?", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
                        "-c:a", "copy", "-movflags", "+faststart", str(out)], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", help="'1번','2번' 폴더들이 들어있는 릴스 폴더")
    ap.add_argument("--video", help="이미 만든 mp4 (자막만 입힐 때)")
    ap.add_argument("--folder", type=int, help="--video 와 함께 쓸 주제 번호")
    ap.add_argument("--only", type=int, nargs="*")
    ap.add_argument("--sec", type=float, default=1.0, help="사진당 노출 시간(초)")
    ap.add_argument("--out", default="output/reels")
    ap.add_argument("--font")
    ap.add_argument("--no-blur", action="store_true", help="얼굴 자동 모자이크 끄기")
    a = ap.parse_args()
    font = find_font(a.font)
    topics = {t["folder"]: t for t in json.loads(TOPICS.read_text(encoding="utf-8"))["topics"]}
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)

    jobs = []
    if a.video:
        jobs.append((a.folder, Path(a.video)))
    else:
        for n in (a.only or sorted(topics)):
            d = Path(a.root).expanduser() / f"{n}번"
            if d.is_dir() and photos_in(d):
                jobs.append((n, d))
            else:
                print(f"[건너뜀] {d} 에 사진이 없습니다")

    report = ["# 릴스 검수표 (원장님 확인 후 업로드)\n"]
    for n, src in jobs:
        t = topics[n]
        raw = src
        if src.is_dir():
            raw = out / f"{n}번_raw.mp4"
            slideshow(photos_in(src), a.sec, raw)
        if not a.no_blur:  # 자막을 입히기 전에 얼굴부터 가린다 (자막이 모자이크에 깨지지 않도록)
            blurred = out / f"{n}번_blur.mp4"
            subprocess.run([sys.executable, str(Path(__file__).with_name("face_blur.py")), str(raw), str(blurred)], check=True)
            raw = blurred
        final = out / f"{n}번_{t['level']}_{t['title']}.mp4"
        add_captions(raw, t["lines"], font, final)
        print("완료:", final)
        report.append(f"## {n}번 · {t['level']} · {t['title']}\n- 파일: `{final.name}`")
        report += [f"- [ ] 확인필요: {v}" for v in t["verify"]]
        report += ["- [ ] 학생 얼굴 모자이크/동의서 확인 (미동의 학생 얼굴 노출 금지)",
                   "- [ ] 자막에 실명·학교명 없음", ""]
    (out / "review.md").write_text("\n".join(report), encoding="utf-8")


if __name__ == "__main__":
    main()
