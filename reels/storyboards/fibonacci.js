// reels/storyboards/fibonacci.js
// 주제: 피보나치 수열 — 정사각형 나선(1,1,2,3,5,8...)과 황금비로의 수렴.
//
// 참고한 AI 생성 레퍼런스 영상(Gemini)은 겉모양(네온 정사각형 나선 + 라벨 + 점선 호)은
// 그럴듯했지만 숫자가 전부 틀렸다(8,15,5,45,24,25,2,150,16,3,181,8... 피보나치가 아님)
// 정사각형도 서로 안 맞게 회전/중첩되어 있어 실제 나선 작도가 아니었다. 이 파일은 그
// "느낌"만 참고하고, 정사각형 배치와 호(arc)의 중심을 직접 유도해서 수학적으로 정확하게
// 다시 만들었다(아래 buildFibSquares/ARC_RULES 참고). 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, glowStroke, glowPolylineReveal, neonText, drawSparkle,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst,
  drawDust, drawOrbitRing, drawFlare,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

// ---------- 타임라인 (초) ----------
const FIBS = [1, 1, 2, 3, 5, 8];
const STEP_DUR = 1.3;
export const T = {
  HOOK: [0.0, 2.2],
  DEMO: [2.2, 2.2 + FIBS.length * STEP_DUR], // 2.2 -> 10.0
  FORMULA: [10.0, 13.2],
  PLUGIN: [13.2, 16.2],
  REAL: [16.2, 20.4],
  CLIFF: [20.4, 22.4],
  OUTRO: [22.4, 24.4],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "고등 · 수열",
  title: "피보나치 수열",
  subtitle: "정사각형 두 개가 나선을 만든다",
};

// ---------- 정사각형 나선 작도 (수치적으로 검증된 정확한 구성) ----------
// 각 새 정사각형은 현재 사각형의 오른쪽→위→왼쪽→아래 순서로 한 변에 붙는다.
// (이 순서/좌표는 손으로 직접 유도해서 F(n)이 항상 이전 사각형의 변 길이와
// 맞아떨어지는지 검증했다 — 레퍼런스 영상처럼 회전되거나 겹치지 않는다.)
const DIRS = ["right", "up", "left", "down"];

function buildFibUnitSquares(fibs) {
  const squares = [{ x: 0, y: 0, size: fibs[0] }];
  let rect = { x: 0, y: 0, w: fibs[0], h: fibs[0] };
  for (let i = 1; i < fibs.length; i++) {
    const size = fibs[i];
    const dir = DIRS[(i - 1) % 4];
    let sq;
    if (dir === "right") {
      sq = { x: rect.x + rect.w, y: rect.y, size };
      rect = { x: rect.x, y: rect.y, w: rect.w + size, h: rect.h };
    } else if (dir === "up") {
      sq = { x: rect.x, y: rect.y - size, size };
      rect = { x: rect.x, y: rect.y - size, w: rect.w, h: rect.h + size };
    } else if (dir === "left") {
      sq = { x: rect.x - size, y: rect.y, size };
      rect = { x: rect.x - size, y: rect.y, w: rect.w + size, h: rect.h };
    } else {
      sq = { x: rect.x, y: rect.y + rect.h, size };
      rect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h + size };
    }
    squares.push(sq);
  }
  return { squares, rect };
}

// 호(arc)의 중심/시작점/끝점 규칙 — 연속성(이전 호의 끝 = 다음 호의 시작)을 만족하도록
// 직접 좌표로 검증해서 얻은 규칙이다.
const ARC_RULES = {
  right: { center: "TL", start: "BL", end: "TR" },
  up: { center: "BL", start: "BR", end: "TL" },
  left: { center: "BR", start: "TR", end: "BL" },
  down: { center: "TR", start: "TL", end: "BR" },
};

const { squares: UNIT_SQUARES, rect: UNIT_RECT } = buildFibUnitSquares(FIBS);

// 픽셀 좌표로 변환 (전체 나선을 안전영역 중심에 맞춘다)
const UNIT = 65;
const DIAGRAM_CX = SAFE_CX;
const DIAGRAM_CY = 700;
const rectCenterU = { x: UNIT_RECT.x + UNIT_RECT.w / 2, y: UNIT_RECT.y + UNIT_RECT.h / 2 };
const OX = DIAGRAM_CX - rectCenterU.x * UNIT;
const OY = DIAGRAM_CY - rectCenterU.y * UNIT;

function toPx(u) { return { x: OX + u.x * UNIT, y: OY + u.y * UNIT }; }
const SQUARES_PX = UNIT_SQUARES.map((s) => ({ ...toPx(s), size: s.size * UNIT }));

function corners(sq) {
  return {
    TL: { x: sq.x, y: sq.y },
    TR: { x: sq.x + sq.size, y: sq.y },
    BL: { x: sq.x, y: sq.y + sq.size },
    BR: { x: sq.x + sq.size, y: sq.y + sq.size },
  };
}

// 각 정사각형(인덱스 1..n-1)의 호를 이루는 점들을 샘플링한다.
function arcPoints(i, samples = 24) {
  const dir = DIRS[(i - 1) % 4];
  const rule = ARC_RULES[dir];
  const c = corners(SQUARES_PX[i]);
  const center = c[rule.center], p0 = c[rule.start], p1 = c[rule.end];
  const r = SQUARES_PX[i].size;
  const a0 = Math.atan2(p0.y - center.y, p0.x - center.x);
  let a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  let diff = a1 - a0;
  while (diff <= -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  // 항상 90도(pi/2)만큼만 이동하도록 방향을 고른다
  const step = (Math.abs(diff - Math.PI / 2) < Math.abs(diff + Math.PI / 2)) ? Math.PI / 2 : -Math.PI / 2;
  const pts = [];
  for (let k = 0; k <= samples; k++) {
    const a = a0 + step * (k / samples);
    pts.push({ x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) });
  }
  return pts;
}
const ARCS_PX = SQUARES_PX.map((_, i) => (i === 0 ? null : arcPoints(i)));

const PIECE_COLORS = [NEON.cyan, NEON.magenta, NEON.yellow, NEON.green, NEON.cyan, NEON.magenta];

function drawSquare(ctx, sq, color, reveal, label) {
  if (reveal <= 0.001) return;
  const p = ease.outBack(clamp01(reveal));
  const cx = sq.x + sq.size / 2, cy = sq.y + sq.size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(Math.max(0.001, p), Math.max(0.001, p));
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = clamp01(reveal) * 0.24;
  ctx.fillStyle = color;
  ctx.fillRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
  ctx.globalAlpha = clamp01(reveal);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 3.5;
  ctx.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
  if (label !== undefined) {
    const fontSize = Math.max(20, Math.min(52, sq.size * 0.32));
    ctx.font = `italic 700 ${fontSize}px Georgia, "Noto Serif KR", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.fillText(String(label), cx, cy);
  }
  ctx.restore();
}

// 아크가 그려지는 끝부분에 "펜 촉"처럼 밝은 점을 찍어 손으로 그은 듯한 느낌을 준다.
function drawArcTip(ctx, pts, reveal) {
  if (reveal <= 0.001 || reveal >= 0.999) return;
  const idx = Math.min(pts.length - 1, Math.floor(pts.length * clamp01(reveal)));
  const pt = pts[idx];
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function decorate(ctx, t) {
  drawDust(ctx, t, 70);
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

// 나선 중심부 뒤를 천천히 도는 대시 궤도 링 (SF-HUD 느낌의 장식).
// 나선 전체를 둘러싸기엔 안전영역이 부족해서, 중심부 정도만 감싸는 작은 링으로 잡았다
// (반지름을 안전영역 폭의 절반보다 항상 작게 유지 — 아래 수치는 --safe로 직접 확인함).
function decorateOrbit(ctx, t, alpha = 1) {
  drawOrbitRing(ctx, DIAGRAM_CX, DIAGRAM_CY, 300, 190, t * 0.12, {
    color: "rgba(255,255,255,0.35)", alpha, arrowCount: 3,
  });
}

// ---------- 세그먼트별 렌더 ----------
function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.5) });

  const p0 = segProgress(local, 0.2, 0.7, ease.outBack);
  const p1 = segProgress(local, 0.6, 1.1, ease.outBack);
  drawSquare(ctx, SQUARES_PX[0], PIECE_COLORS[0], p0, FIBS[0]);
  drawSquare(ctx, SQUARES_PX[1], PIECE_COLORS[1], p1, FIBS[1]);

  const cardA = segProgress(local, 1.1, 1.7);
  drawStepCard(ctx, {
    stepLabel: "HOOK",
    headline: "정사각형 두 개로 시작하는 이 나선",
    subtext: "정체가 뭘까?",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderDemo(ctx, t) {
  const [s] = T.DEMO;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  decorateOrbit(ctx, t, 0.6);

  const idx = Math.min(FIBS.length - 1, Math.floor(local / STEP_DUR));
  const within = local - idx * STEP_DUR;

  for (let i = 0; i < idx; i++) {
    drawSquare(ctx, SQUARES_PX[i], PIECE_COLORS[i], 1, FIBS[i]);
    if (ARCS_PX[i]) glowPolylineReveal(ctx, ARCS_PX[i], 1, NEON.white, 4, 16);
  }
  const sqReveal = segProgress(within, 0.0, 0.4, ease.outBack);
  drawSquare(ctx, SQUARES_PX[idx], PIECE_COLORS[idx], sqReveal, FIBS[idx]);
  if (ARCS_PX[idx]) {
    const arcReveal = segProgress(within, 0.35, 0.85, ease.outCubic);
    glowPolylineReveal(ctx, ARCS_PX[idx], arcReveal, NEON.white, 4, 16);
    drawArcTip(ctx, ARCS_PX[idx], arcReveal);
  }
  if (within > 0.02 && within < 0.5) {
    const sq = SQUARES_PX[idx];
    drawBurst(ctx, sq.x + sq.size / 2, sq.y + sq.size / 2, segProgress(within, 0.02, 0.55), {
      colors: [PIECE_COLORS[idx], NEON.white], count: 14, maxDist: Math.min(140, sq.size),
    });
  }

  const seq = FIBS.slice(0, idx + 1).join(", ");
  neonText(ctx, seq, SAFE_CX, 392, { size: 40, color: NEON.yellow, glow: 18, weight: 800 });

  const cardA = segProgress(local, 0.15, 0.5);
  drawStepCard(ctx, {
    stepLabel: `0${idx + 1} 단계`,
    headline: idx === 0 ? "1, 1 부터 시작" : "바로 앞 두 변의 합만큼 자란다",
    subtext: idx >= 2 ? `${FIBS[idx - 2]} + ${FIBS[idx - 1]} = ${FIBS[idx]}` : "다음 정사각형을 준비 중",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderFormula(ctx, t) {
  const [s] = T.FORMULA;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.42;
  const p1 = segProgress(local, 0.1, 0.6, ease.outBack);
  const p2 = segProgress(local, 0.5, 1.0, ease.outBack);
  const p3 = segProgress(local, 0.9, 1.4, ease.outBack);

  if (p1 > 0) neonText(ctx, "F(n) =", SAFE_CX, cy - 70, { size: 60, color: NEON.white, glow: 22, weight: 900, alpha: p1 });
  if (p2 > 0) neonText(ctx, "F(n−1) + F(n−2)", SAFE_CX, cy + 20, { size: 52, color: NEON.magenta, glow: 22, weight: 800, alpha: p2 });
  if (p3 > 0) neonText(ctx, "바로 앞 두 항의 합", SAFE_CX, cy + 110, { size: 32, color: NEON.cyan, glow: 14, weight: 600, alpha: p3 });

  if (local > 1.3 && local < 1.9) drawBurst(ctx, SAFE_CX, cy, segProgress(local, 1.3, 1.9), { colors: [NEON.white, NEON.magenta, NEON.cyan], count: 28, maxDist: 300 });

  const cardA = segProgress(local, 2.0, 2.5);
  drawStepCard(ctx, {
    stepLabel: "규칙",
    headline: "F(n) = F(n−1) + F(n−2)",
    subtext: "이 점화식 하나가 나선 전체를 만든다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderPlugin(ctx, t) {
  const [s] = T.PLUGIN;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.4;
  const l1 = segProgress(local, 0.1, 0.5);
  const l2 = segProgress(local, 0.6, 1.0);
  const l3 = segProgress(local, 1.5, 2.0, ease.outBack);

  if (l1 > 0) neonText(ctx, "5 ÷ 3 = 1.666...", SAFE_CX, cy - 90, { size: 46, color: NEON.green, glow: 18, weight: 700, alpha: l1 });
  if (l2 > 0) neonText(ctx, "8 ÷ 5 = 1.6", SAFE_CX, cy - 10, { size: 46, color: NEON.cyan, glow: 18, weight: 700, alpha: l2 });
  if (l3 > 0) neonText(ctx, "φ ≈ 1.618...", SAFE_CX, cy + 120, { size: 60, color: NEON.yellow, glow: 28, weight: 900, alpha: l3 });

  if (local > 1.9 && local < 2.5) drawBurst(ctx, SAFE_CX, cy + 120, segProgress(local, 1.9, 2.5), { colors: [NEON.yellow, NEON.white], count: 26 });

  const cardA = segProgress(local, 2.6, 3.0);
  drawStepCard(ctx, {
    stepLabel: "수렴",
    headline: "비율은 황금비 φ로 수렴한다",
    subtext: "항이 커질수록 점점 정확해진다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 실제 사례 속사포 ----------
const REAL_EXAMPLES = [
  { label: "해바라기 씨앗", value: "나선 개수가 피보나치 수", desc: "34개, 55개... 나선이 겹쳐서 자란다", color: NEON.cyan },
  { label: "솔방울", value: "비늘의 나선 배열", desc: "시계/반시계 나선 수가 피보나치", color: NEON.magenta },
  { label: "앵무조개 껍데기", value: "로그 나선에 가까운 형태", desc: "정확히 황금나선은 아니지만 비슷하다", color: NEON.green },
];

function renderReal(ctx, t) {
  const [s, e] = T.REAL;
  const local = t - s;
  const dur = e - s;
  const slotDur = dur / REAL_EXAMPLES.length;
  drawBackground(ctx, t, { flash: local % slotDur < 0.05 ? 0.3 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const idx = Math.min(REAL_EXAMPLES.length - 1, Math.floor(local / slotDur));
  const within = local - idx * slotDur;
  const item = REAL_EXAMPLES[idx];
  const pop = segProgress(within, 0.05, 0.5, ease.outBack);
  const cy = SAFE_Y1 * 0.42;

  ctx.save();
  ctx.globalAlpha = pop;
  ctx.translate(SAFE_CX, cy);
  ctx.scale(pop, pop);
  ctx.translate(-SAFE_CX, -cy);
  neonText(ctx, item.label, SAFE_CX, cy - 90, { size: 40, color: NEON.white, glow: 12, weight: 700 });
  neonText(ctx, item.value, SAFE_CX, cy + 10, { size: 42, color: item.color, glow: 22, weight: 800 });
  ctx.restore();

  if (within > 0.15 && within < 0.7) drawBurst(ctx, SAFE_CX, cy + 10, segProgress(within, 0.15, 0.75), { colors: [item.color, NEON.white], count: 20 });

  drawStepCard(ctx, {
    stepLabel: `0${4 + idx} 실제 사례`,
    headline: item.label,
    subtext: item.desc,
    alpha: 1,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderCliff(ctx, t) {
  const [s] = T.CLIFF;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, {
    stepLabel: "다음 편",
    headline: "정말 모든 자연이 피보나치를 따를까?",
    subtext: "과장된 속설과 진짜 사례를 가려본다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderOutro(ctx, t) {
  const [s, e] = T.OUTRO;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  const logoP = segProgress(local, 0.0, 1.0, ease.outCubic);
  if (local > 0.8) {
    const flareP = segProgress(local, 0.8, 1.5);
    drawFlare(ctx, WIDTH / 2, HEIGHT / 2, 60 + flareP * 260, (1 - segProgress(local, 1.1, e - s)) * 0.8, NEON.white);
  }
  drawBrandLogo(ctx, WIDTH / 2, HEIGHT / 2, logoP);
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.cyan, NEON.magenta, NEON.white], count: 40, maxDist: 420 });
}

// ---------- 메인 렌더 함수 ----------
export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.DEMO[0]) return renderHook(ctx, t);
  if (t < T.FORMULA[0]) return renderDemo(ctx, t);
  if (t < T.PLUGIN[0]) return renderFormula(ctx, t);
  if (t < T.REAL[0]) return renderPlugin(ctx, t);
  if (t < T.CLIFF[0]) return renderReal(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "정사각형 두 개가 이 나선을 만든다고? (피보나치 수열)",
  hashtags: ["#두뇌", "#수학", "#자연", "#황금비", "#피보나치"],
};
