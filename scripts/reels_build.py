#!/usr/bin/env python3
"""릴스 자동 제작: 폴더의 사진을 1.2초씩 이어붙이고, 주제 은행(reels/topics.json)의 자막(훅 2.4초 -> 내용 2줄씩 2초 -> 제품 연결 -> 저장/구독유도)을 입혀
9:16 mp4 로 저장한다. (사진 슬라이드쇼 -> 자막 -> 검수용 체크표까지 한 번에)

사용 (학년만 맞으면 되는 경우 - 찍어둔 사진을 빨리 소진할 때):
  python3 scripts/reels_build.py --root ~/릴스/초등 --level 초등   # 폴더마다 안 쓴 초등 주제를 차례로 배정
  python3 scripts/reels_build.py --root ~/릴스/중등 --level 중등
사용 (번호 = 주제 번호로 맞춰 찍은 경우):
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
STROKE = 1              # 글씨 굵기 보정 (기존 자막 두께에 맞춤)
PITCH = 0.80            # 글자 간격: 기존 자막처럼 글자마다 같은 폭의 칸(고정폭)에 배치 (글자크기 대비)
SPACE = 0.50            # 띄어쓰기 폭
CAPTION_CENTER_Y = 0.284  # 기존 영상 자막의 세로 중심(화면 높이 대비)
IMG_EXT = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
FONT_CANDIDATES = [
    str(Path(__file__).resolve().parent.parent / "reels" / "fonts" / "CuteFont-Regular.ttf"),
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


def _cells(text, size):
    return [size * (SPACE if ch == " " else PITCH) for ch in text]


def caption_png(lines, font_path, path, size=78, last=False):
    """기존 릴스 자막과 동일한 모양: 모서리 각진 불투명 흰 박스 + 검정 고정폭 손글씨체, 가운데 정렬.
    lines 가 여러 줄이면 박스를 위아래로 쌓는다. 너무 길면 글자 크기를 줄여 화면 안에 맞춘다."""
    if isinstance(lines, str):
        lines = [lines]
    pad_x, pad_y, gap = 48, 26, 14
    boxes = []
    for text in lines:
        sz = size
        while sum(_cells(text, sz)) + pad_x * 2 > W - 60 and sz > 40:
            sz -= 2
        boxes.append((text, sz, sum(_cells(text, sz)) + pad_x * 2, round(sz * 1.45) + pad_y))
    img = Image.new("RGBA", (round(max(bx[2] for bx in boxes)), sum(bx[3] for bx in boxes) + gap * (len(boxes) - 1)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = 0
    for text, sz, bw, bh in boxes:
        font = ImageFont.truetype(font_path, sz)
        x = (img.width - bw) / 2
        d.rectangle((x, y, x + bw, y + bh), fill=YELLOW if last else (255, 255, 255, 255))
        cx = x + pad_x
        for ch, cw in zip(text, _cells(text, sz)):
            if ch != " ":
                d.text((cx + cw / 2, y + bh / 2), ch, font=font, fill=(0, 0, 0, 255), anchor="mm",
                       stroke_width=STROKE, stroke_fill=(0, 0, 0, 255))
            cx += cw
        y += bh + gap
    img.save(path)


def photos_in(folder):
    return sorted(p for p in Path(folder).iterdir() if p.suffix.lower() in IMG_EXT and not p.name.startswith("."))


def slideshow(photos, sec, out, min_total=0.0):
    """사진 -> 1080x1920 중앙 크롭, 장당 sec초."""
    with tempfile.TemporaryDirectory() as td:
        lst = Path(td) / "list.txt"
        frames = []
        need = max(len(photos), int(-(-min_total // sec)))  # 자막이 더 길면 사진을 순서대로 반복
        for i, p in enumerate(photos[i % len(photos)] for i in range(need)):
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


def timeline(topic, hook_sec, card_sec):
    """[(줄 목록, 시작, 끝, 구독유도 여부)] : 제목(1줄) -> 내용 카드(2줄씩) -> CTA(2줄)"""
    items = [(topic["hook"], False, hook_sec)]
    items += [(c, False, card_sec) for c in topic["cards"]]
    items += [(topic["cta"], True, card_sec)]
    t, out = 0.0, []
    for lines, last, dur in items:
        out.append((lines, t, t + dur, last)); t += dur
    return out, t


def caption_rects(tl, font_path):
    """자막 박스가 차지하는 화면 영역 (얼굴 모자이크 생략 판단용)."""
    rects = []
    with tempfile.TemporaryDirectory() as td:
        for i, (lines, a, b, is_cta) in enumerate(tl):
            png = Path(td) / f"r{i}.png"
            caption_png(lines, font_path, png, last=is_cta)
            w, h = Image.open(png).size
            x0, y0 = (W - w) // 2, int(H * CAPTION_CENTER_Y - h / 2)
            rects.append({"t0": a, "t1": b, "x0": x0, "y0": y0, "x1": x0 + w, "y1": y0 + h})
    return rects


def add_captions(video, tl, font_path, out):
    total = duration(video)
    with tempfile.TemporaryDirectory() as td:
        inputs, chain, last = ["-i", str(video)], [], "0:v"
        for i, (lines, a, b, is_cta) in enumerate(tl):
            png = Path(td) / f"c{i}.png"
            caption_png(lines, font_path, png, last=is_cta)
            inputs += ["-i", str(png)]
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
    ap.add_argument("--only", type=int, nargs="*", help="이 번호의 폴더만 (예: --only 1 3)")
    ap.add_argument("--level", choices=["초등", "중등", "고등"], help="학년 모드: --root 안의 모든 폴더에 해당 학년 주제를 자동 배정")
    ap.add_argument("--topic", type=int, nargs="*", help="학년 모드에서 주제 번호를 직접 지정 (topics.json 의 folder 값)")
    ap.add_argument("--sec", type=float, default=1.2, help="사진당 노출 시간(초). 제목 자막도 이 시간만큼 보임")
    ap.add_argument("--hook-sec", type=float, default=2.4, help="맨 앞 훅(공감 질문 2줄) 노출 시간(초)")
    ap.add_argument("--card-sec", type=float, default=2.0, help="내용 카드(2줄) 1장당 노출 시간(초)")
    ap.add_argument("--out", default="output/reels")
    ap.add_argument("--font")
    ap.add_argument("--no-blur", action="store_true", help="얼굴 자동 모자이크 끄기")
    a = ap.parse_args()
    font = find_font(a.font)
    topics = {t["folder"]: t for t in json.loads(TOPICS.read_text(encoding="utf-8"))["topics"]}
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)

    jobs = []  # (주제, 입력 폴더/영상)
    if a.video:
        jobs.append((topics[a.folder], Path(a.video)))
    elif a.level:
        # 학년 모드: 폴더 이름/내용과 상관없이 학년(초등/중등/고등)만 맞춰 아직 안 쓴 주제를 차례로 배정
        used_f = out / "used_topics.json"
        used = set(json.loads(used_f.read_text()) if used_f.exists() else [])
        pool = [t for t in topics.values() if t["level"] == a.level and t["folder"] not in used]
        if a.topic:
            pool = [topics[n] for n in a.topic]
        dirs = [d for d in sorted(Path(a.root).expanduser().iterdir()) if d.is_dir() and photos_in(d)]
        if a.only:
            dirs = [d for d in dirs if any(d.name.startswith(f"{n}번") for n in a.only)]
        if len(dirs) > len(pool):
            print(f"[알림] {a.level} 주제가 {len(pool)}개 남아 폴더 {len(dirs)}개 중 앞의 {len(pool)}개만 만듭니다 (주제는 reels/topics.json 에 추가)")
        for d, t in zip(dirs, pool):
            jobs.append((t, d))
            used.add(t["folder"])
        used_f.write_text(json.dumps(sorted(used)))
    else:
        for n in (a.only or sorted(topics)):
            d = Path(a.root).expanduser() / f"{n}번"
            if d.is_dir() and photos_in(d):
                jobs.append((topics[n], d))
            else:
                print(f"[건너뜀] {d} 에 사진이 없습니다")

    report = ["# 릴스 검수표 (원장님 확인 후 업로드)\n"]
    for t, src in jobs:
        n = t["folder"]
        tl, need = timeline(t, a.hook_sec, a.card_sec)
        raw = src
        if src.is_dir():
            raw = out / f"{src.name}_raw.mp4"
            slideshow(photos_in(src), a.sec, raw, min_total=need)
        elif duration(raw) < need - 0.1:
            print(f"[주의] {raw.name} 길이 {duration(raw):.1f}초 < 자막 {need:.1f}초: 뒤쪽 자막이 잘립니다")
        if not a.no_blur:  # 자막을 입히기 전에 얼굴부터 가린다 (자막이 모자이크에 깨지지 않도록). 자막 박스가 얼굴을 가리는 구간은 모자이크 생략
            blurred = out / f"{src.stem}_blur.mp4"
            covers = out / f"{src.stem}_covers.json"
            covers.write_text(json.dumps(caption_rects(tl, font)))
            subprocess.run([sys.executable, str(Path(__file__).with_name("face_blur.py")), str(raw), str(blurred),
                            "--covers", str(covers)], check=True)
            raw = blurred
        final = out / f"{src.stem}_{t['level']}_{t['title']}.mp4"
        add_captions(raw, tl, font, final)
        print("완료:", final)
        report.append(f"## {src.name} → {t['level']} · {t['title']}\n- 파일: `{final.name}`")
        report += [f"- [ ] 확인필요: {v}" for v in t["verify"]]
        report += ["- [ ] 학생 얼굴 모자이크/동의서 확인 (미동의 학생 얼굴 노출 금지)",
                   "- [ ] 자막에 실명·학교명 없음", ""]
    (out / "review.md").write_text("\n".join(report), encoding="utf-8")


if __name__ == "__main__":
    main()
