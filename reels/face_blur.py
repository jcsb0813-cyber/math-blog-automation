#!/usr/bin/env python3
"""정면에 가까운 얼굴(얼굴의 2/3 이상이 보이는 경우)만 자동 모자이크(표정이 보이는 약한 강도).
고개를 숙였거나 옆모습이라 정면 얼굴이 검출되지 않으면 그대로 둔다.

사용: python3 reels/face_blur.py 입력.mp4 출력.mp4 [--sheet 확인용.jpg]
필요: opencv-python, numpy, ffmpeg (얼굴 모델 yunet.onnx 는 첫 실행 때 자동 다운로드)
"""
from __future__ import annotations
import argparse, json, subprocess, urllib.request
from pathlib import Path
import cv2, numpy as np
from make_reel import find_ffmpeg  # 같은 폴더 (시스템 ffmpeg 또는 imageio-ffmpeg)

MODEL_URL = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
MODEL = Path(__file__).resolve().parent / "yunet.onnx"
STEP = 2          # N프레임마다 검출, 사이 프레임은 직전 결과 사용
MIN_SCORE = 0.5   # 검출 신뢰도 하한 (낮추면 더 많이 가림)
MAX_YAW = 0.7     # 코가 두 눈 중앙에서 벗어난 정도(눈 간격 대비). 클수록 옆모습까지 가림
MIN_FACE = 0.04   # 화면 폭 대비 최소 얼굴 크기 (먼 배경 얼굴 제외)
PAD = 0.12        # 검출 박스를 이만큼 넓혀서 가림 (이마·턱선 포함)
BLOCKS = 22       # 얼굴 폭을 몇 칸으로 쪼갤지. 클수록 약한 모자이크(표정이 보임), 작을수록 강함
BLEND = 0.9       # 모자이크 반영 비율 (1.0 = 완전 적용)
COVER_RATIO = 0.25  # 자막 박스가 얼굴 핵심부(눈·코·입)의 25% 이상을 가리면 모자이크 생략. 핵심부는 얼굴보다 작아서 얼굴 기준 약 1/3 에 해당 (자막+모자이크 겹침 방지)


def load_detector(w, h):
    if not MODEL.exists() or MODEL.stat().st_size < 10000:
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    return cv2.FaceDetectorYN.create(str(MODEL), "", (w, h), MIN_SCORE, 0.3, 5000)


def detect(det, frame):
    """정면 얼굴만 반환. YuNet 은 두 눈·코·입 위치를 같이 주므로 '정면 판정'에 사용:
    - 숙이거나 옆을 본 얼굴은 눈 두 개가 안 잡히거나 코가 한쪽으로 치우쳐서 제외된다."""
    h, w = frame.shape[:2]
    _, faces = det.detect(frame)
    out = []
    for r in (faces if faces is not None else []):
        x, y, bw, bh = r[:4]
        reye, leye, nose = r[4:6], r[6:8], r[8:10]
        eye_d = abs(leye[0] - reye[0])
        if bw < w * MIN_FACE or eye_d < 1:
            continue
        yaw = abs(nose[0] - (reye[0] + leye[0]) / 2) / eye_d
        if yaw > MAX_YAW:
            continue
        # 박스가 화면 밖으로 잘린 큰 얼굴도 놓치지 않도록, 눈 간격 기준 박스와 합친다
        cx, cy = r[4:14].reshape(5, 2).mean(axis=0)
        x0, y0 = min(x, cx - 1.6 * eye_d), min(y, cy - 2.0 * eye_d)
        x1, y1 = max(x + bw, cx + 1.6 * eye_d), max(y + bh, cy + 2.0 * eye_d)
        px, py = (x1 - x0) * PAD / 2, (y1 - y0) * PAD / 2
        box = (max(0, int(x0 - px)), max(0, int(y0 - py)), min(w, int(x1 + px)), min(h, int(y1 + py)))
        # 눈·코·입 영역(얼굴 핵심부)을 따로 반환: 자막이 여기를 가리는지로 모자이크 생략 여부를 판단
        pts = r[4:14].reshape(5, 2)
        mx, my = (pts[:, 0].max() - pts[:, 0].min()) * 0.15, (pts[:, 1].max() - pts[:, 1].min()) * 0.15
        core = (int(pts[:, 0].min() - mx), int(pts[:, 1].min() - my), int(pts[:, 0].max() + mx), int(pts[:, 1].max() + my))
        out.append((box, core))
    return out


def mosaic(frame, box):
    """약한 모자이크: 얼굴 폭을 BLOCKS 칸으로 나눠 픽셀화하고, 타원 마스크로 가장자리를 부드럽게 섞는다."""
    x0, y0, x1, y1 = box
    roi = frame[y0:y1, x0:x1]
    bw, bh = x1 - x0, y1 - y0
    cell = max(4, bw // BLOCKS)
    small = cv2.resize(roi, (max(1, bw // cell), max(1, bh // cell)), interpolation=cv2.INTER_AREA)
    pix = cv2.resize(small, (bw, bh), interpolation=cv2.INTER_NEAREST)
    mask = np.zeros((bh, bw), np.float32)
    cv2.ellipse(mask, (bw // 2, bh // 2), (int(bw * 0.5), int(bh * 0.5)), 0, 0, 360, BLEND, -1)
    mask = cv2.GaussianBlur(mask, (0, 0), max(1, bw / 40))[..., None]
    frame[y0:y1, x0:x1] = (pix * mask + roi * (1 - mask)).astype(np.uint8)


def covered(box, rects, t):
    """해당 시각의 자막 박스가 얼굴 박스를 충분히 가리고 있으면 True (그 경우 모자이크 불필요)."""
    x0, y0, x1, y1 = box
    area = max(1, (x1 - x0) * (y1 - y0))
    for r in rects:
        if r["t0"] <= t < r["t1"]:
            ix = max(0, min(x1, r["x1"]) - max(x0, r["x0"]))
            iy = max(0, min(y1, r["y1"]) - max(y0, r["y0"]))
            if ix * iy / area >= COVER_RATIO:
                return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--covers", help="자막 박스 위치 JSON(reels_build 가 생성). 자막이 얼굴을 가리는 구간은 모자이크 생략")
    ap.add_argument("--sheet", help="모자이크 적용된 프레임 샘플을 한 장으로 저장(검수용)")
    a = ap.parse_args()
    cap = cv2.VideoCapture(a.src)
    w, h = int(cap.get(3)), int(cap.get(4)); fps = cap.get(5) or 30
    det = load_detector(w, h)
    rects = json.loads(Path(a.covers).read_text()) if a.covers else []
    enc = subprocess.Popen(
        [find_ffmpeg(), "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
         "-i", a.src, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "copy", "-movflags", "+faststart", "-shortest", a.dst], stdin=subprocess.PIPE)
    boxes, i, hits, samples = [], 0, 0, []
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        if i % STEP == 0:
            boxes = detect(det, fr)
        drawn = False
        for b, core in boxes:
            if not covered(core, rects, i / fps):
                mosaic(fr, b); drawn = True
        if drawn:
            hits += 1
            if len(samples) < 12 and i % 15 == 0:
                samples.append(cv2.resize(fr, (270, int(270 * h / w))))
        enc.stdin.write(fr.tobytes()); i += 1
    enc.stdin.close(); enc.wait()
    print(f"총 {i}프레임 중 {hits}프레임에 모자이크 적용 -> {a.dst}")
    if a.sheet and samples:
        cols = 6; rows = -(-len(samples) // cols); sh, sw = samples[0].shape[:2]
        sheet = np.zeros((rows * sh, cols * sw, 3), np.uint8)
        for k, s in enumerate(samples):
            sheet[(k // cols) * sh:(k // cols + 1) * sh, (k % cols) * sw:(k % cols + 1) * sw] = s
        cv2.imwrite(a.sheet, sheet)


if __name__ == "__main__":
    main()
