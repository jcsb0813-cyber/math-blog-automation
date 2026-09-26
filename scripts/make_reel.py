"""
수학 문제 릴스(MP4, 1080x1920 세로) 자동 생성 스크립트.

구성: 후킹 → 문제 → 생각할 시간(카운트다운) → 힌트(선택) → 풀이(단계별) → 정답 → 학원 CTA

입력은 JSON 스펙 파일 하나입니다 (예시: examples/reels/중2_일차방정식.json).
Claude가 `/reels-auto` 스킬로 스펙을 작성하고 이 스크립트를 실행합니다.

사용법:
  python scripts/make_reel.py examples/reels/중2_일차방정식.json
  python scripts/make_reel.py spec.json --out output/2026-09-25_중2_reel
  python scripts/make_reel.py spec.json --preview   # 영상 없이 장면별 PNG만 빠르게 확인

결과물 (--out 폴더):
  reel.mp4     인스타그램/유튜브 쇼츠 업로드용 영상
  cover.png    릴스 커버(썸네일) 이미지
  caption.md   게시글 캡션 + 해시태그
  spec.json    사용한 스펙 사본 (재생성용)

필요 패키지: pillow, imageio-ffmpeg (requirements.txt)
한글 폰트(나눔고딕)는 처음 실행할 때 fonts/ 폴더로 자동 다운로드합니다.
"""

import argparse
import json
import math
import shutil
import struct
import subprocess
import sys
import tempfile
import urllib.request
import wave
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "fonts"
FONT_URLS = {
    "bold": "https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Bold.ttf",
    "extrabold": "https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-ExtraBold.ttf",
}

# 컬러 이모지(✋ 등)용. 시스템에 있으면 그걸 쓰고, 없으면 fonts/로 다운로드.
EMOJI_FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/notocoloremoji/NotoColorEmoji-Regular.ttf"
EMOJI_SYSTEM_PATHS = [Path("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"),
                      Path("/System/Library/Fonts/Apple Color Emoji.ttc")]

W, H = 1080, 1920
FPS = 30
MARGIN = 90

# 브랜드 기준 (docs/STYLE_GUIDE.md) — 노란색 포인트
ACADEMY_NAME = "ssen math"  # 릴스에는 영문 브랜드명만 표기
YELLOW = (255, 212, 0)
YELLOW_SOFT = (255, 243, 176)
INK = (28, 28, 30)
GRAY = (110, 110, 115)
WHITE = (255, 255, 255)
PAPER = (255, 252, 240)
RED = (230, 57, 70)

# 장면별 기본 길이(초). 스펙의 "timing"으로 덮어쓸 수 있습니다.
DEFAULT_TIMING = {
    "hook": 2.5,
    "problem": 4.0,
    "think": 5,  # 카운트다운 초 (정수)
    "hint": 3.0,
    "step": 3.0,  # 풀이 단계 하나당
    "answer": 3.0,
    "cta": 3.5,
}


# ---------------------------------------------------------------- fonts

def _download_font(url: str) -> Path:
    path = FONT_DIR / Path(url).name
    if not path.exists() or path.stat().st_size < 100_000:
        FONT_DIR.mkdir(exist_ok=True)
        print(f"폰트 다운로드: {path.name}")
        tmp = path.with_suffix(".part")
        urllib.request.urlretrieve(url, tmp)
        if tmp.stat().st_size < 100_000:
            tmp.unlink()
            sys.exit(f"폰트 다운로드 실패: {url} — 직접 받아서 {path}에 넣어주세요.")
        tmp.rename(path)
    return path


def ensure_fonts() -> dict[str, Path]:
    paths = {key: _download_font(url) for key, url in FONT_URLS.items()}
    paths["emoji"] = next((p for p in EMOJI_SYSTEM_PATHS if p.exists()), None) or _download_font(EMOJI_FONT_URL)
    return paths


_font_cache: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}
FONT_PATHS: dict[str, Path] = {}


def font(size: int, weight: str = "bold") -> ImageFont.FreeTypeFont:
    key = (weight, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(str(FONT_PATHS[weight]), size)
    return _font_cache[key]


# ---------------------------------------------------------------- emoji

def _is_emoji(ch: str) -> bool:
    cp = ord(ch)
    return 0x1F000 <= cp <= 0x1FAFF or 0x2600 <= cp <= 0x27BF


_emoji_cache: dict[tuple[str, int], Image.Image] = {}


def _emoji_image(ch: str, size: int) -> Image.Image:
    """컬러 이모지는 비트맵 폰트라 109px로 그린 뒤 원하는 크기로 줄인다."""
    key = (ch, size)
    if key not in _emoji_cache:
        efont = ImageFont.truetype(str(FONT_PATHS["emoji"]), 109)
        canvas = Image.new("RGBA", (160, 160))
        ImageDraw.Draw(canvas).text((0, 0), ch, font=efont, embedded_color=True)
        glyph = canvas.crop(canvas.getbbox())
        h = int(size * 0.95)
        _emoji_cache[key] = glyph.resize((max(1, glyph.width * h // glyph.height), h), Image.LANCZOS)
    return _emoji_cache[key]


def _runs(line: str):
    """글자/이모지 구간으로 나눈다. 이모지 변형 선택자(U+FE0F)는 버린다."""
    line = line.replace("\ufe0f", "")
    runs, buf = [], ""
    for ch in line:
        if _is_emoji(ch):
            if buf:
                runs.append((False, buf))
                buf = ""
            runs.append((True, ch))
        else:
            buf += ch
    if buf:
        runs.append((False, buf))
    return runs


def line_width(line: str, fnt: ImageFont.FreeTypeFont) -> float:
    return sum(_emoji_image(t, fnt.size).width + fnt.size * 0.08 if emo else fnt.getlength(t)
               for emo, t in _runs(line))


def draw_line(draw: ImageDraw.ImageDraw, xy, line: str, fnt: ImageFont.FreeTypeFont, fill, alpha=1.0):
    x, y = xy
    for emo, t in _runs(line):
        if emo:
            glyph = _emoji_image(t, fnt.size)
            if alpha < 1.0:
                glyph = glyph.copy()
                glyph.putalpha(glyph.getchannel("A").point(lambda a: int(a * max(0.0, alpha))))
            draw._image.paste(glyph, (int(x + fnt.size * 0.04), int(y + fnt.size * 0.12)), glyph)
            x += glyph.width + fnt.size * 0.08
        else:
            draw.text((x, y), t, font=fnt, fill=fill)
            x += fnt.getlength(t)


# ---------------------------------------------------------------- text helpers

def wrap(text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """어절(공백) 단위로 줄바꿈하고, 한 어절이 한 줄보다 길면 글자 단위로 자른다. '\\n'은 강제 줄바꿈."""
    lines = []
    for para in text.split("\n"):
        line = ""
        for word in para.split(" "):
            candidate = f"{line} {word}" if line else word
            if line_width(candidate, fnt) <= max_width:
                line = candidate
                continue
            if line:
                lines.append(line)
            line = ""
            for ch in word:
                if line_width(line + ch, fnt) > max_width and line:
                    lines.append(line)
                    line = ""
                line += ch
        lines.append(line)
    return lines


def text_block(draw, text, y, size, color=INK, weight="bold", max_width=W - 2 * MARGIN,
               align="center", line_gap=1.35, alpha=1.0, x_offset=0, bg=None):
    """여러 줄 텍스트를 그리고 다음 y 좌표를 반환."""
    fnt = font(size, weight)
    lines = wrap(text, fnt, max_width)
    lh = int(size * line_gap)
    col = _fade(color, alpha, bg or PAPER)
    for i, line in enumerate(lines):
        x = (W - line_width(line, fnt)) / 2 if align == "center" else MARGIN
        draw_line(draw, (x + x_offset, y + i * lh), line, fnt, col, alpha)
    return y + len(lines) * lh


def measure_block(text, size, weight="bold", max_width=W - 2 * MARGIN, line_gap=1.35):
    lines = wrap(text, font(size, weight), max_width)
    return len(lines) * int(size * line_gap)


def _fade(color, alpha, bg):
    a = max(0.0, min(1.0, alpha))
    return tuple(int(bg[i] + (color[i] - bg[i]) * a) for i in range(3))


def ease_out(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def highlight(draw, x0, y0, x1, y1, color=YELLOW, progress=1.0):
    """형광펜처럼 왼쪽→오른쪽으로 칠해지는 하이라이트."""
    x1p = x0 + (x1 - x0) * ease_out(progress)
    if x1p > x0 + 2:
        draw.rounded_rectangle((x0, y0, x1p, y1), radius=14, fill=color)


# ---------------------------------------------------------------- common chrome

def base_frame(spec, bg=PAPER) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    # 상단 노란 띠 + 학년/단원 태그
    d.rectangle((0, 0, W, 22), fill=YELLOW)
    tag = f"{spec['grade']} · {spec['unit']}"
    fnt = font(40)
    tw = fnt.getlength(tag)
    d.rounded_rectangle((MARGIN, 110, MARGIN + tw + 56, 186), radius=38, fill=INK)
    d.text((MARGIN + 28, 124), tag, font=fnt, fill=YELLOW)
    # 하단 학원명 (릴스 UI에 가리지 않도록 너무 아래로 내리지 않음)
    fnt2 = font(36)
    name = ACADEMY_NAME
    d.text(((W - fnt2.getlength(name)) / 2, H - 330), name, font=fnt2, fill=GRAY)
    return img, d


def _fit_size(text, sizes, max_width, weight="bold"):
    """강제 줄바꿈('\\n')한 줄이 중간에 끊기지 않는 가장 큰 글자 크기. 다 안 되면 첫 크기."""
    n_lines = len(text.split("\n"))
    for size in sizes:
        if len(wrap(text, font(size, weight), max_width)) == n_lines:
            return size
    return sizes[0]


def problem_card(d, spec, top, alpha=1.0, compact=False):
    """문제 카드. 카드 하단 y를 반환."""
    size = _fit_size(spec["problem"], (66, 60, 56, 52) if not compact else (54, 50, 46, 42), W - 2 * MARGIN - 80)
    body_h = measure_block(spec["problem"], size, max_width=W - 2 * MARGIN - 80)
    label_h = 90
    bottom = top + label_h + body_h + 70
    fill = _fade(WHITE, alpha, PAPER)
    border = _fade(INK, alpha, PAPER)
    d.rounded_rectangle((MARGIN, top, W - MARGIN, bottom), radius=36, fill=fill, outline=border, width=5)
    lbl = _fade(YELLOW, alpha, PAPER)
    d.rounded_rectangle((MARGIN + 40, top + 36, MARGIN + 124, top + 96), radius=18, fill=lbl)
    d.text((MARGIN + 62, top + 44), "Q.", font=font(44, "extrabold"), fill=border)
    text_block(d, spec["problem"], top + label_h + 40, size, max_width=W - 2 * MARGIN - 80,
               align="left", x_offset=40, alpha=alpha, bg=WHITE)
    return bottom


def draw_choices(d, spec, top, alpha=1.0, reveal=False):
    """A/B/C 보기 버튼 한 줄. reveal=True면 정답만 노랗게, 나머지는 흐리게. 하단 y를 반환."""
    choices = spec.get("choices")
    if not choices:
        return top
    n, gap, h = len(choices), 28, 150
    w = (W - 2 * MARGIN - gap * (n - 1)) / n
    for i, text in enumerate(choices):
        x0 = MARGIN + i * (w + gap)
        correct = i == spec["correct"]
        if reveal:
            fill, border, ink = (YELLOW, INK, INK) if correct else ((240, 236, 222), (215, 210, 195), (170, 168, 160))
        else:
            fill, border, ink = WHITE, INK, INK
        d.rounded_rectangle((x0, top, x0 + w, top + h), radius=30, fill=_fade(fill, alpha, PAPER),
                            outline=_fade(border, alpha, PAPER), width=4)
        letter = "ABCD"[i]
        fl = font(34, "extrabold")
        d.text((x0 + (w - fl.getlength(letter)) / 2, top + 16), letter, font=fl, fill=_fade(GRAY if not correct or not reveal else INK, alpha, PAPER))
        size = next((sz for sz in (54, 48, 42, 36) if font(sz, "extrabold").getlength(text) <= w - 30), 36)
        fv = font(size, "extrabold")
        d.text((x0 + (w - fv.getlength(text)) / 2, top + 62 + (54 - size) / 2), text, font=fv, fill=_fade(ink, alpha, PAPER))
    return top + h


# ---------------------------------------------------------------- scenes
# 각 scene 함수는 (spec, t, dur) -> Image 형태. t는 장면 시작부터의 초.

def scene_hook(spec, t, dur):
    img = Image.new("RGB", (W, H), YELLOW)
    d = ImageDraw.Draw(img)
    p = ease_out(t / 0.5)
    hook = spec.get("hook", "이 문제, 풀 수 있나요?")
    size = _fit_size(hook, (104, 96, 88, 80), W - 2 * MARGIN, "extrabold")
    bh = measure_block(hook, size, "extrabold")
    y = (H - bh) / 2 - 120 + (1 - p) * 80
    text_block(d, hook, y, size, weight="extrabold", alpha=p, bg=YELLOW)
    sub = spec.get("hook_tag", f"{spec['grade']} {spec['unit']}")
    fnt = font(52)
    sw = fnt.getlength(sub)
    sy = y + bh + 60
    if p > 0.3:
        d.rounded_rectangle(((W - sw) / 2 - 36, sy, (W + sw) / 2 + 36, sy + 92), radius=46, fill=INK)
        d.text(((W - sw) / 2, sy + 18), sub, font=fnt, fill=YELLOW)
    return img


def scene_problem(spec, t, dur):
    img, d = base_frame(spec)
    p = ease_out(t / 0.6)
    top = 300 + (1 - p) * 60
    bottom = problem_card(d, spec, top, alpha=p)
    if spec.get("choices"):
        bottom = draw_choices(d, spec, bottom + 40, alpha=ease_out((t - 0.5) / 0.5))
    if t > 1.0:
        q = ease_out((t - 1.0) / 0.5)
        default = "댓글에 먼저 골라두세요!\n정답은 마지막에 공개" if spec.get("choices") else "잠깐 멈추고 풀어보세요!"
        text_block(d, spec.get("teaser", default), bottom + 80, 56, color=GRAY, alpha=q)
    return img


def scene_think(spec, t, dur):
    img, d = base_frame(spec)
    bottom = problem_card(d, spec, 300, compact=True)
    bottom = draw_choices(d, spec, bottom + 30)
    total = dur
    remain = max(0, math.ceil(total - t))
    # 원형 타이머
    # 타이머 + "생각할 시간" 라벨이 하단 학원명(H - 330)과 겹치지 않도록 남은 공간에 맞춘다
    avail = H - 360 - bottom - 100
    r = max(100, min(230, avail / 2 - 20))
    cx, cy = W / 2, bottom + 20 + avail / 2
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(230, 225, 205), width=28)
    frac = min(1.0, t / total)
    d.arc((cx - r, cy - r, cx + r, cy + r), start=-90, end=-90 + 360 * (1 - frac),
          fill=RED if remain <= 2 else YELLOW, width=28)
    # 숫자는 초가 바뀔 때마다 살짝 튀어오름
    beat = t - math.floor(t)
    scale = 1.0 + 0.18 * max(0.0, 1 - beat / 0.25)
    size = int(r * 1.05 * scale)
    num = str(remain) if remain > 0 else "0"
    fnt = font(size, "extrabold")
    bbox = fnt.getbbox(num)
    d.text((cx - (bbox[2] + bbox[0]) / 2, cy - (bbox[3] + bbox[1]) / 2), num, font=fnt,
           fill=RED if remain <= 2 else INK)
    lbl = "생각할 시간"
    fl = font(44)
    d.text(((W - fl.getlength(lbl)) / 2, cy + r + 36), lbl, font=fl, fill=GRAY)
    return img


def scene_hint(spec, t, dur):
    img, d = base_frame(spec)
    bottom = problem_card(d, spec, 300, compact=True)
    bottom = draw_choices(d, spec, bottom + 30)
    p = ease_out(t / 0.5)
    top = bottom + 80 + (1 - p) * 40
    hint_h = measure_block(spec["hint"], 58, max_width=W - 2 * MARGIN - 80)
    d.rounded_rectangle((MARGIN, top, W - MARGIN, top + hint_h + 150), radius=32,
                        fill=_fade(YELLOW_SOFT, p, PAPER))
    d.text((MARGIN + 40, top + 36), "HINT", font=font(42, "extrabold"),
           fill=_fade(INK, p, YELLOW_SOFT))
    text_block(d, spec["hint"], top + 106, 58, max_width=W - 2 * MARGIN - 80, align="left",
               x_offset=40, alpha=p, bg=YELLOW_SOFT)
    return img


STEP_SIZE = 60
STEP_GAP = 56
NUM_R = 40


def _step_text_width():
    return W - 2 * MARGIN - 2 * NUM_R - 34


def make_scene_steps(n_visible):
    def scene(spec, t, dur):
        img, d = base_frame(spec)
        steps = spec["steps"]
        # 모든 단계가 다 나왔을 때 기준으로 세로 가운데 정렬 → 단계가 추가돼도 위치가 흔들리지 않음
        heights = [measure_block(s, STEP_SIZE, max_width=_step_text_width()) for s in steps]
        block_h = 130 + sum(heights) + STEP_GAP * (len(steps) - 1)
        y = max(260, (H - 330 - block_h) / 2)
        highlight(d, MARGIN - 8, y + 54, MARGIN + 170, y + 92)
        d.text((MARGIN, y), "풀이", font=font(80, "extrabold"), fill=INK)
        y += 150
        for i in range(n_visible):
            is_new = i == n_visible - 1
            p = ease_out(t / 0.5) if is_new else 1.0
            ny = y + 2
            d.ellipse((MARGIN, ny, MARGIN + 2 * NUM_R, ny + 2 * NUM_R),
                      fill=_fade(YELLOW if is_new else (235, 230, 210), p, PAPER))
            fn = font(44, "extrabold")
            num = str(i + 1)
            d.text((MARGIN + NUM_R - fn.getlength(num) / 2, ny + 16), num, font=fn, fill=_fade(INK, p, PAPER))
            text_block(d, steps[i], y + (1 - p) * 30, STEP_SIZE, color=INK if is_new else GRAY,
                       align="left", x_offset=2 * NUM_R + 34, max_width=_step_text_width(), alpha=p)
            y += heights[i] + STEP_GAP
        return img
    return scene


def scene_answer(spec, t, dur):
    img, d = base_frame(spec)
    p = ease_out(t / 0.5)
    text_block(d, "정답", 560, 64, color=GRAY, alpha=p)
    ans = spec["answer"]
    size = 120 if len(ans) <= 10 else 84
    fnt = font(size, "extrabold")
    lines = wrap(ans, fnt, W - 2 * MARGIN - 60)
    lh = int(size * 1.3)
    y0 = 700
    for i, line in enumerate(lines):
        w = fnt.getlength(line)
        x = (W - w) / 2
        yy = y0 + i * lh
        highlight(d, x - 30, yy + size * 0.45, x + w + 30, yy + size * 1.15, progress=(t - 0.3) / 0.6)
        d.text((x, yy), line, font=fnt, fill=_fade(INK, p, PAPER))
    y = y0 + len(lines) * lh + 80
    if spec.get("answer_note"):
        y = text_block(d, spec["answer_note"], y, 54, color=GRAY, alpha=ease_out((t - 0.8) / 0.5))
    if spec.get("choices"):
        draw_choices(d, spec, y + 70, alpha=ease_out((t - 0.5) / 0.5), reveal=True)
    return img


def scene_cta(spec, t, dur):
    img = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(img)
    p = ease_out(t / 0.6)
    cta = spec.get("cta", "성공한 친구\n손✋~")
    y = text_block(d, cta, 620 + (1 - p) * 50, 80, color=WHITE, weight="extrabold", alpha=p, bg=INK)
    sub = spec.get("cta_sub", "저장해두고 아이와 함께 풀어보세요")
    y = text_block(d, sub, y + 50, 48, color=(200, 200, 205), alpha=p, bg=INK)
    fnt = font(58, "extrabold")
    nw = fnt.getlength(ACADEMY_NAME)
    by = y + 140
    q = ease_out((t - 0.4) / 0.5)
    if q > 0:
        d.rounded_rectangle(((W - nw) / 2 - 50, by, (W + nw) / 2 + 50, by + 120), radius=60,
                            fill=_fade(YELLOW, q, INK))
        d.text(((W - nw) / 2, by + 28), ACADEMY_NAME, font=fnt, fill=_fade(INK, q, YELLOW))
    return img


# ---------------------------------------------------------------- timeline

def build_timeline(spec):
    tm = {**DEFAULT_TIMING, **spec.get("timing", {})}
    tl = [("hook", scene_hook, tm["hook"]),
          ("problem", scene_problem, tm["problem"]),
          ("think", scene_think, float(int(tm["think"])))]
    if spec.get("hint"):
        tl.append(("hint", scene_hint, tm["hint"]))
    for i in range(len(spec["steps"])):
        tl.append((f"step{i + 1}", make_scene_steps(i + 1), tm["step"]))
    tl.append(("answer", scene_answer, tm["answer"]))
    tl.append(("cta", scene_cta, tm["cta"]))
    return tl


# ---------------------------------------------------------------- audio (카운트다운 틱 소리)

def write_audio(path: Path, timeline, total: float):
    sr = 44100
    n = int(total * sr)
    samples = [0.0] * n

    def beep(start, freq, length=0.09, vol=0.35):
        s0 = int(start * sr)
        for i in range(int(length * sr)):
            if s0 + i >= n:
                break
            env = 1 - i / (length * sr)
            samples[s0 + i] += vol * env * math.sin(2 * math.pi * freq * i / sr)

    t = 0.0
    for name, _, dur in timeline:
        if name == "think":
            for k in range(int(dur)):
                beep(t + k, 1320 if int(dur) - k <= 2 else 880)
        elif name == "answer":
            beep(t + 0.3, 1047, 0.12)
            beep(t + 0.42, 1568, 0.25)
        t += dur

    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32000)) for s in samples))


# ---------------------------------------------------------------- render

def validate(spec):
    missing = [k for k in ("grade", "unit", "problem", "steps", "answer") if not spec.get(k)]
    if missing:
        sys.exit(f"스펙에 필수 항목이 없습니다: {', '.join(missing)}")
    if not isinstance(spec["steps"], list):
        sys.exit("steps는 문자열 리스트여야 합니다.")
    if len(spec["steps"]) > 5:
        sys.exit("풀이 단계는 5개 이하로 줄여주세요 (릴스는 짧아야 합니다).")
    if spec.get("choices"):
        if not 2 <= len(spec["choices"]) <= 4:
            sys.exit("choices는 2~4개여야 합니다.")
        if not isinstance(spec.get("correct"), int) or not 0 <= spec["correct"] < len(spec["choices"]):
            sys.exit("choices를 쓰면 correct(정답 보기 번호, 0부터)가 필요합니다.")


def render(spec, out_dir: Path, preview: bool, sound: bool):
    import imageio_ffmpeg

    timeline = build_timeline(spec)
    total = sum(d for _, _, d in timeline)
    out_dir.mkdir(parents=True, exist_ok=True)

    # 커버: 후킹 장면 완성 상태
    scene_hook(spec, 10, 1).save(out_dir / "cover.png")

    if preview:
        pdir = out_dir / "preview"
        pdir.mkdir(exist_ok=True)
        for i, (name, fn, dur) in enumerate(timeline):
            fn(spec, dur * 0.8, dur).save(pdir / f"{i:02d}_{name}.png")
        print(f"미리보기 {len(timeline)}장 → {pdir}  (총 {total:.1f}초 예정)")
        return

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory() as tmp:
        audio = Path(tmp) / "audio.wav"
        cmd = [ffmpeg, "-y", "-loglevel", "error",
               "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
        if sound:
            write_audio(audio, timeline, total)
            cmd += ["-i", str(audio), "-c:a", "aac", "-b:a", "128k", "-shortest"]
        cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20",
                "-movflags", "+faststart", str(out_dir / "reel.mp4")]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for name, fn, dur in timeline:
            frames = int(round(dur * FPS))
            for f in range(frames):
                proc.stdin.write(fn(spec, f / FPS, dur).tobytes())
            print(f"  {name:8s} {dur:4.1f}s")
        proc.stdin.close()
        if proc.wait() != 0:
            sys.exit("ffmpeg 인코딩 실패")
    print(f"완료: {out_dir / 'reel.mp4'}  ({total:.1f}초)")


def write_caption(spec, out_dir: Path):
    series = [f"#{spec['series'].replace(' ', '')}"] if spec.get("series") else []
    tags = spec.get("hashtags") or [
        f"#{spec['grade']}수학", f"#{spec['unit'].replace(' ', '')}", *series, "#수학문제", "#수학릴스",
        "#민락동수학학원", "#ssenmath", "#의정부수학학원"]
    caption = spec.get("caption") or (
        f"{spec.get('hook', '이 문제, 풀 수 있나요?').replace(chr(10), ' ')}\n\n"
        f"{spec['problem'].replace(chr(10), ' ')}\n"
        + ("".join(f"{'ABCD'[i]}) {c}   " for i, c in enumerate(spec.get("choices", []))).rstrip()
           + "\n정답을 먼저 댓글로 골라주세요!\n" if spec.get("choices") else "")
        + "아이와 같이 풀어보세요!\n"
        "정답과 풀이는 영상 끝에 있어요. 성공한 친구는 댓글에 손✋~\n\n"
        f"📍 {ACADEMY_NAME}")
    (out_dir / "caption.md").write_text(
        f"# 릴스 캡션\n\n{caption}\n\n{' '.join(tags)}\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description="수학 문제 릴스 MP4 생성")
    ap.add_argument("specs", type=Path, nargs="+", help="릴스 스펙 JSON 파일 (여러 개면 차례로 생성)")
    ap.add_argument("--out", type=Path, help="결과 폴더 (스펙 1개일 때만. 기본: output/<날짜>_<학년>_reel_<단원>)")
    ap.add_argument("--preview", action="store_true", help="영상 대신 장면별 PNG만 생성")
    ap.add_argument("--no-sound", action="store_true", help="카운트다운 효과음 없이 생성")
    args = ap.parse_args()

    if args.out and len(args.specs) > 1:
        sys.exit("--out은 스펙이 1개일 때만 쓸 수 있습니다.")
    specs = [(path, json.loads(path.read_text(encoding="utf-8"))) for path in args.specs]
    for _, spec in specs:
        validate(spec)  # 렌더링 시작 전에 전부 검사
    FONT_PATHS.update(ensure_fonts())

    for path, spec in specs:
        print(f"[{spec['grade']} · {spec['unit']}]")
        out = args.out or ROOT / "output" / f"{date.today().isoformat()}_{spec['grade']}_reel_{spec['unit'].replace(' ', '')}"
        render(spec, out, args.preview, not args.no_sound)
        if out.resolve() != path.resolve().parent:
            shutil.copy(path, out / "spec.json")
        write_caption(spec, out)


if __name__ == "__main__":
    main()
