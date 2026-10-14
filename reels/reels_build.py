#!/usr/bin/env python3
"""릴스 자동 제작: 폴더의 사진을 1.2초씩 이어붙이고, 주제 은행(reels/topics*.json)의 자막(훅 2.4초 -> 내용 2줄씩 2초 -> 제품 연결 -> 저장/구독유도)을 입혀
9:16 mp4 로 저장한다. (사진 슬라이드쇼 -> 자막 -> 검수용 체크표까지 한 번에)

사용 (학년만 맞으면 되는 경우 - 찍어둔 사진을 계속 소진할 때):
  python3 reels/reels_build.py --root ~/릴스/초등 --level 초등   # 안 쓴 사진만 15장씩 묶어 릴스로. 사용 기록은 output/reels/state.json
  python3 reels/reels_build.py --root ~/릴스/중등 --level 중등 --dry-run   # 만들기 전에 계획만 확인
  python3 reels/reels_build.py --root ~/릴스/고등 --level 고등 --limit 5   # 한 번에 5개만
사용 (번호 = 주제 번호로 맞춰 찍은 경우):
  python3 reels/reels_build.py --root ~/릴스 --out output/reels            # 1번~12번 전부
  python3 reels/reels_build.py --root ~/릴스 --only 1 3 --sec 1.5         # 일부만, 사진당 1.5초
  (얼굴 자동 모자이크는 기본 적용: 정면 얼굴만 가리고 숙인/옆모습은 그대로. 끄려면 --no-blur)
  python3 reels/reels_build.py --video 1번.mp4 --folder 1 --out output/reels  # 이미 만든 mp4에 자막만

필요: ffmpeg, Pillow, pillow-heif (pip install -r requirements.txt). 한글 폰트는 --font 로 지정 (기본: 맥/리눅스 후보 자동 탐색).
"""
from __future__ import annotations  # macOS 기본 파이썬(3.9)에서도 동작
import argparse, json, subprocess, sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_reel import find_ffmpeg  # 시스템 ffmpeg 또는 imageio-ffmpeg
from PIL import Image, ImageDraw, ImageFont, ImageOps
try:  # 아이폰 HEIC 사진 지원 (pip install pillow-heif)
    import pillow_heif; pillow_heif.register_heif_opener()
except ImportError:
    pass

W, H = 1080, 1920
YELLOW = (255, 214, 0)  # 학원 메인 컬러 (마지막 구독유도 줄만 사용)
STROKE = 1              # 글씨 굵기 보정 (기존 자막 두께에 맞춤)
PITCH = 0.80            # 글자 간격: 기존 자막처럼 글자마다 같은 폭의 칸(고정폭)에 배치 (글자크기 대비)
SPACE = 0.50            # 띄어쓰기 폭
CAPTION_CENTER_Y = 0.284  # 기존 영상 자막의 세로 중심(화면 높이 대비)
IMG_EXT = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
FONT_CANDIDATES = [
    str(Path(__file__).resolve().parent / "fonts" / "CuteFont-Regular.ttf"),
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/Library/Fonts/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
]
TOPIC_DIR = Path(__file__).resolve().parent  # topics.json + topics_초등/중등/고등.json 모두 읽음


def find_font(arg):
    for p in ([arg] if arg else []) + FONT_CANDIDATES:
        if p and Path(p).exists():
            return p
    sys.exit("한글 폰트를 못 찾았습니다. --font 로 .ttf/.ttc 경로를 지정하세요.")


# 폰트에 없는 글자는 대체 (Cute Font 에는 ①Ⅰ→− 등이 없음). 화살표는 직접 그린다.
SUBS = {"①": "1)", "②": "2)", "③": "3)", "④": "4)", "Ⅰ": "I", "Ⅱ": "II", "−": "-"}
ARROWS = "→↔"


def _norm(text):
    return "".join(SUBS.get(ch, ch) for ch in text)


def _cw(ch):
    """글자별 칸 폭(글자크기 대비): 한글은 고정폭, 숫자·영문·기호는 좁게, 화살표는 넓게."""
    if ch == " ":
        return SPACE
    if "가" <= ch <= "힣":
        return PITCH
    if ch in ARROWS:
        return 1.0
    return 0.56


def _cells(text, size):
    return [size * _cw(ch) for ch in text]


def _arrow(d, cx, cy, size, both=False):
    L, h, t = size * 0.36, size * 0.16, max(3, int(size * 0.07))
    d.line((cx - L, cy, cx + L, cy), fill=(0, 0, 0, 255), width=t)
    d.polygon([(cx + L + h * 0.6, cy), (cx + L - h, cy - h), (cx + L - h, cy + h)], fill=(0, 0, 0, 255))
    if both:
        d.polygon([(cx - L - h * 0.6, cy), (cx - L + h, cy - h), (cx - L + h, cy + h)], fill=(0, 0, 0, 255))


def caption_png(lines, font_path, path, size=78, last=False):
    """기존 릴스 자막과 동일한 모양: 모서리 각진 불투명 흰 박스 + 검정 고정폭 손글씨체, 가운데 정렬.
    lines 가 여러 줄이면 박스를 위아래로 쌓는다. 너무 길면 글자 크기를 줄여 화면 안에 맞춘다."""
    if isinstance(lines, str):
        lines = [lines]
    lines = [_norm(t) for t in lines]
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
            if ch in ARROWS:
                _arrow(d, cx + cw / 2, y + bh / 2, sz, both=(ch == "↔"))
            elif ch != " ":
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
            im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")  # 아이폰 세로/가로 회전 정보 반영
            s = max(W / im.width, H / im.height)
            im = im.resize((round(im.width * s), round(im.height * s)))
            x, y = (im.width - W) // 2, (im.height - H) // 2
            f = Path(td) / f"{i:03d}.jpg"
            im.crop((x, y, x + W, y + H)).save(f, quality=92)
            frames.append(f)
        lst.write_text("".join(f"file '{f}'\nduration {sec}\n" for f in frames) + f"file '{frames[-1]}'\n")
        subprocess.run([find_ffmpeg(), "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                        "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18", str(out)], check=True)


def duration(video):
    import cv2  # ffprobe 가 없는 환경(imageio-ffmpeg 만 설치)에서도 길이를 구하려고 OpenCV 사용
    cap = cv2.VideoCapture(str(video))
    n, fps = cap.get(cv2.CAP_PROP_FRAME_COUNT), cap.get(cv2.CAP_PROP_FPS) or 30
    cap.release()
    return n / fps


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
        subprocess.run([find_ffmpeg(), "-y", "-v", "error", *inputs, "-filter_complex", ";".join(chain),
                        "-map", f"[{last}]", "-map", "0:a?", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
                        "-c:a", "copy", "-movflags", "+faststart", str(out)], check=True)


def load_topics():
    topics = {}
    for tf in sorted(TOPIC_DIR.glob("topics*.json")):
        for t in json.loads(tf.read_text(encoding="utf-8"))["topics"]:
            assert t["folder"] not in topics, f"주제 번호 중복: {t['folder']}"
            topics[t["folder"]] = t
    return topics


def finish_video(raw, final, topic, font, work_dir, blur=True, hook_sec=2.4, card_sec=2.0):
    """자막 없는 영상 raw 에 (정면 얼굴 약한 모자이크 → 주제 자막)을 입혀 final 로 저장. 감시 프로그램에서도 사용."""
    work_dir = Path(work_dir); work_dir.mkdir(parents=True, exist_ok=True)
    tl, need = timeline(topic, hook_sec, card_sec)
    src = Path(raw)
    if duration(src) < need - 0.1:
        print(f"[주의] 영상 {duration(src):.1f}초 < 자막 {need:.1f}초: 뒤쪽 자막이 잘립니다")
    if blur:
        blurred, covers = work_dir / "blur.mp4", work_dir / "covers.json"
        covers.write_text(json.dumps(caption_rects(tl, font)))
        subprocess.run([sys.executable, str(Path(__file__).with_name("face_blur.py")), str(src), str(blurred),
                        "--covers", str(covers)], check=True)
        src = blurred
    add_captions(src, tl, font, Path(final))
    return need


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", help="'1번','2번' 폴더들이 들어있는 릴스 폴더")
    ap.add_argument("--video", help="이미 만든 mp4 (자막만 입힐 때)")
    ap.add_argument("--folder", type=int, help="--video 와 함께 쓸 주제 번호")
    ap.add_argument("--only", type=int, nargs="*", help="이 번호의 폴더만 (예: --only 1 3)")
    ap.add_argument("--level", choices=["초등", "중등", "고등"], help="학년 모드: --root 안의 모든 폴더에 해당 학년 주제를 자동 배정")
    ap.add_argument("--topic", type=int, nargs="*", help="학년 모드에서 주제 번호를 직접 지정 (topics.json 의 folder 값)")
    ap.add_argument("--per", type=int, default=15, help="학년 모드: 릴스 1개에 쓸 사진 수 (기본 15장 ≈ 18초)")
    ap.add_argument("--min-photos", type=int, default=8, help="학년 모드: 이 장수보다 적게 남은 사진은 다음 실행까지 대기")
    ap.add_argument("--limit", type=int, help="한 번에 만들 릴스 최대 개수 (오래 걸리니 나눠서 돌릴 때)")
    ap.add_argument("--dry-run", action="store_true", help="학년 모드: 만들지 않고 무엇을 만들지만 출력")
    ap.add_argument("--sec", type=float, default=1.2, help="사진당 노출 시간(초). 제목 자막도 이 시간만큼 보임")
    ap.add_argument("--hook-sec", type=float, default=2.4, help="맨 앞 훅(공감 질문 2줄) 노출 시간(초)")
    ap.add_argument("--card-sec", type=float, default=2.0, help="내용 카드(2줄) 1장당 노출 시간(초)")
    ap.add_argument("--out", default="output/reels")
    ap.add_argument("--font")
    ap.add_argument("--no-blur", action="store_true", help="얼굴 자동 모자이크 끄기")
    a = ap.parse_args()
    font = find_font(a.font)
    topics = load_topics()
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)

    state_f = out / "state.json"  # 사용한 사진/주제 기록: 같은 --out 을 계속 써야 "안 쓴 것만" 이어서 만든다
    state = json.loads(state_f.read_text()) if state_f.exists() else {}
    state.setdefault("photos", {}); state.setdefault("topic_n", {}); state.setdefault("seq", {})

    def save_state():
        state_f.write_text(json.dumps(state, ensure_ascii=False, indent=1))

    jobs = []  # (주제, 이름, 사진 목록 | 영상 경로, 재사용 여부)
    if a.video:
        jobs.append((topics[a.folder], Path(a.video).stem, Path(a.video), False))
    elif a.level:
        # 학년 모드: 사진을 학년 폴더에 계속 넣어두면, 아직 안 쓴 사진만 --per 장씩 묶어 릴스 1개로 만든다.
        # 폴더 구분/이름/주제는 상관없음. 주제는 해당 학년 주제를 차례로 돌려쓴다(다 쓰면 처음부터 반복).
        root = Path(a.root).expanduser()
        pool = [t for t in topics.values() if t["level"] == a.level]
        if a.topic:
            pool = [topics[n] for n in a.topic]
        sources = [root] + [d for d in sorted(root.iterdir()) if d.is_dir()]
        pending, waiting = [], 0
        for src in sources:
            files = photos_in(src)
            fresh = [f for f in files if str(f.relative_to(root)) + "|" + str(f.stat().st_size) not in state["photos"]]
            for i in range(0, len(fresh), a.per):
                chunk = fresh[i:i + a.per]
                if len(chunk) >= a.min_photos:
                    pending.append((src.name if src is not root else "낱장", chunk))
                else:
                    waiting += len(chunk)
        n0 = state["topic_n"].get(a.level, 0)
        for k, (name, chunk) in enumerate(pending):
            t = pool[(n0 + k) % len(pool)]
            jobs.append((t, name, chunk, (n0 + k) >= len(pool)))
        left = len(pool) - n0 - len(pending)
        if left <= 3:
            print(f"[알림] {a.level} 새 주제가 {max(left, 0)}개 남았습니다. 이후에는 앞의 주제가 반복됩니다 → Claude에게 '{a.level} 주제 20개 추가'를 요청하세요.")
        print(f"[{a.level}] 새로 만들 릴스 {len(pending)}개 / 사진이 모자라 다음을 기다리는 사진 {waiting}장 / 이미 사용한 사진 {len(state['photos'])}장")
        if a.limit:
            jobs = jobs[:a.limit]
        if a.dry_run:
            for t, name, chunk, reuse in jobs:
                print(f"  - {name} 사진 {len(chunk)}장 → {t['title']}" + (" (주제 재사용)" if reuse else ""))
            return
    else:
        for n in (a.only or sorted(topics)):
            d = Path(a.root).expanduser() / f"{n}번"
            if d.is_dir() and photos_in(d):
                jobs.append((topics[n], d.name, photos_in(d), False))
            else:
                print(f"[건너뜀] {d} 에 사진이 없습니다")

    report = ["# 릴스 검수표 (원장님 확인 후 업로드)\n"]
    for t, name, src, reuse in jobs:
        tl, need = timeline(t, a.hook_sec, a.card_sec)
        seq = state["seq"].get(t["level"], 0) + 1
        tag = f"{t['level']}_{seq:03d}"
        raw = src
        if isinstance(src, list):
            raw = out / f"{tag}_raw.mp4"
            slideshow(src, a.sec, raw, min_total=need)
        elif duration(raw) < need - 0.1:
            print(f"[주의] {raw.name} 길이 {duration(raw):.1f}초 < 자막 {need:.1f}초: 뒤쪽 자막이 잘립니다")
        if not a.no_blur:  # 자막을 입히기 전에 얼굴부터 가린다 (자막이 모자이크에 깨지지 않도록). 자막 박스가 얼굴을 가리는 구간은 모자이크 생략
            blurred = out / f"{tag}_blur.mp4"
            covers = out / f"{tag}_covers.json"
            covers.write_text(json.dumps(caption_rects(tl, font)))
            subprocess.run([sys.executable, str(Path(__file__).with_name("face_blur.py")), str(raw), str(blurred),
                            "--covers", str(covers)], check=True)
            raw = blurred
        final = out / f"{tag}_{t['title']}.mp4"
        add_captions(raw, tl, font, final)
        for f in (out / f"{tag}_raw.mp4", out / f"{tag}_blur.mp4", out / f"{tag}_covers.json"):
            f.unlink(missing_ok=True)  # 중간 파일 정리
        print("완료:", final)
        if isinstance(src, list) and a.level:  # 성공한 뒤에만 '사용함' 기록
            root = Path(a.root).expanduser()
            for f in src:
                state["photos"][str(f.relative_to(root)) + "|" + str(f.stat().st_size)] = final.name
            state["seq"][t["level"]] = seq
            state["topic_n"][a.level] = state["topic_n"].get(a.level, 0) + 1
            save_state()
        report.append(f"## {final.name}  (사진: {name} {len(src) if isinstance(src, list) else ''}장)\n- 주제: {t['level']} · {t['title']}")
        if reuse:
            report.append("- [ ] 주제를 한 바퀴 돌아 다시 사용함 - 이전 영상과 내용이 겹치지 않는지 확인 (topics.json 에 주제 추가 권장)")
        report += [f"- [ ] 확인필요: {v}" for v in t["verify"]]
        report += ["- [ ] 학생 얼굴 모자이크/동의서 확인 (미동의 학생 얼굴 노출 금지)",
                   "- [ ] 자막에 실명·학교명 없음", ""]
    if jobs:  # 매번 덮어쓰지 않고 이어붙임
        rf = out / "review.md"
        old = rf.read_text(encoding="utf-8") + "\n" if rf.exists() else ""
        rf.write_text(old + "\n".join(report[1:] if old else report), encoding="utf-8")


if __name__ == "__main__":
    main()
