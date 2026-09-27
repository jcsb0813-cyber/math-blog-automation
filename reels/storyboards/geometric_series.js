// reels/storyboards/geometric_series.js
// 주제: 무한등비급수 — "끝없이 더해도 답은 있다" (1/2+1/4+1/8+... = 1)
// 원뿔곡선/이심률 시리즈와는 다른 새 주제지만, 브랜드 골격(헤더/스텝카드/진행바/로고/
// 안전영역)과 3편에서 정립한 "장면 다양성 + drawBurst 포인트" 패턴을 그대로 따른다.
// 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

// ---------- 타임라인 (초) ----------
const STEPS = 6;
const STEP_DUR = 1.4;
export const T = {
  HOOK: [0.0, 2.2],
  DEMO: [2.2, 2.2 + STEPS * STEP_DUR], // 2.2 -> 10.6
  FORMULA: [10.6, 13.8],
  PLUGIN: [13.8, 16.8],
  REAL: [16.8, 21.0],
  CLIFF: [21.0, 23.0],
  OUTRO: [23.0, 25.0],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "고등 · 수열의 극한",
  title: "무한등비급수",
  subtitle: "끝없이 더해도 답은 있다",
};

// ---------- 정사각형 나선 분할: 1/2 + 1/4 + 1/8 + ... ----------
const SQ_SIZE = 420;
const SQ_X = SAFE_CX - SQ_SIZE / 2;
const SQ_Y = SAFE_Y1 * 0.5 - SQ_SIZE / 2 - 30;
const PIECE_COLORS = [NEON.cyan, NEON.magenta, NEON.yellow, NEON.green, NEON.cyan, NEON.magenta];
const RUNNING_SUM = ["1/2", "3/4", "7/8", "15/16", "31/32", "63/64"];

function computeSpiralRects(steps) {
  let rect = { x: SQ_X, y: SQ_Y, w: SQ_SIZE, h: SQ_SIZE };
  const rects = [];
  for (let i = 0; i < steps; i++) {
    if (i % 2 === 0) {
      const halfW = rect.w / 2;
      rects.push({ x: rect.x, y: rect.y, w: halfW, h: rect.h });
      rect = { x: rect.x + halfW, y: rect.y, w: halfW, h: rect.h };
    } else {
      const halfH = rect.h / 2;
      rects.push({ x: rect.x, y: rect.y, w: rect.w, h: halfH });
      rect = { x: rect.x, y: rect.y + halfH, w: rect.w, h: halfH };
    }
  }
  return rects;
}
const SPIRAL_RECTS = computeSpiralRects(STEPS);

function drawPiece(ctx, rect, color, reveal) {
  if (reveal <= 0.001) return;
  const p = ease.outBack(clamp01(reveal));
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.globalAlpha = clamp01(reveal) ;
  ctx.translate(cx, cy);
  ctx.scale(Math.max(0.001, p), Math.max(0.001, p));
  ctx.translate(-cx, -cy);
  ctx.fillStyle = color;
  ctx.globalAlpha = clamp01(reveal) * 0.28; // 약한 채움(면적을 눈으로 느끼게)
  ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
  ctx.globalAlpha = clamp01(reveal);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 4;
  ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
  ctx.restore();
}

function drawOuterSquare(ctx, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = NEON.white;
  ctx.shadowColor = NEON.white;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 4;
  ctx.strokeRect(SQ_X, SQ_Y, SQ_SIZE, SQ_SIZE);
  ctx.restore();
}

function decorate(ctx, t) {
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

// ---------- 세그먼트별 렌더 ----------
function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.5) });

  drawOuterSquare(ctx, segProgress(local, 0.2, 0.8));
  const p1 = segProgress(local, 0.7, 1.3, ease.outBack);
  drawPiece(ctx, SPIRAL_RECTS[0], PIECE_COLORS[0], p1);

  const cardA = segProgress(local, 1.1, 1.7);
  drawStepCard(ctx, {
    stepLabel: "HOOK",
    headline: "1/2 + 1/4 + 1/8 + ... 계속 더하면?",
    subtext: "끝이 없는데 답이 있을까?",
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
  drawOuterSquare(ctx, 1);

  const idx = Math.min(STEPS - 1, Math.floor(local / STEP_DUR));
  const within = local - idx * STEP_DUR;

  for (let i = 0; i <= idx; i++) {
    const reveal = i < idx ? 1 : segProgress(within, 0.05, 0.55, ease.outBack);
    drawPiece(ctx, SPIRAL_RECTS[i], PIECE_COLORS[i], reveal);
  }
  const rect = SPIRAL_RECTS[idx];
  if (within > 0.05 && within < 0.6) {
    drawBurst(ctx, rect.x + rect.w / 2, rect.y + rect.h / 2, segProgress(within, 0.05, 0.65), {
      colors: [PIECE_COLORS[idx], NEON.white], count: 16, maxDist: 150,
    });
  }

  const sumA = segProgress(within, 0.35, 0.75);
  neonText(ctx, `합계 = ${RUNNING_SUM[idx]}`, SAFE_CX, SQ_Y - 46, {
    size: 42, color: NEON.yellow, glow: 20, weight: 800, alpha: sumA,
  });

  const cardA = segProgress(local, 0.15, 0.5);
  drawStepCard(ctx, {
    stepLabel: `0${idx + 1} 단계`,
    headline: `남은 절반을 또 절반으로`,
    subtext: idx === STEPS - 1 ? "계속해도 1은 절대 못 넘는다" : "빈 곳이 점점 좁아진다",
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
  const sP = segProgress(local, 0.1, 0.6, ease.outBack);
  const aP = segProgress(local, 0.5, 1.0, ease.outBack);
  const barP = segProgress(local, 0.8, 1.1);
  const denomP = segProgress(local, 0.9, 1.4, ease.outBack);

  if (sP > 0) neonText(ctx, "S", SAFE_CX - 220, cy, { size: 96, color: NEON.white, glow: 24, weight: 900, alpha: sP });
  if (sP > 0.4) neonText(ctx, "=", SAFE_CX - 120, cy, { size: 80, color: NEON.white, glow: 16, weight: 800, alpha: sP });
  if (aP > 0) neonText(ctx, "a", SAFE_CX + 40, cy - 62, { size: 84, color: NEON.magenta, glow: 26, weight: 900, alpha: aP });
  if (barP > 0) {
    ctx.save();
    ctx.globalAlpha = barP;
    ctx.strokeStyle = NEON.white;
    ctx.shadowColor = NEON.white;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(SAFE_CX - 90, cy);
    ctx.lineTo(SAFE_CX + 170, cy);
    ctx.stroke();
    ctx.restore();
  }
  if (denomP > 0) neonText(ctx, "1 − r", SAFE_CX + 40, cy + 62, { size: 68, color: NEON.green, glow: 26, weight: 900, alpha: denomP });

  if (local > 1.35 && local < 1.9) drawBurst(ctx, SAFE_CX + 40, cy, segProgress(local, 1.35, 1.95), { colors: [NEON.white, NEON.magenta, NEON.green, NEON.cyan], count: 30, maxDist: 320 });

  const cardA = segProgress(local, 2.0, 2.5);
  drawStepCard(ctx, {
    stepLabel: "공식",
    headline: "무한등비급수 합 S = a ÷ (1 − r)",
    subtext: "첫째항 a, 공비 r (단, |r| < 1)",
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
  const l2 = segProgress(local, 0.5, 0.9);
  const l3 = segProgress(local, 1.2, 1.7, ease.outBack);

  if (l1 > 0) neonText(ctx, "a = 1/2", SAFE_CX, cy - 90, { size: 56, color: NEON.magenta, glow: 22, weight: 800, alpha: l1 });
  if (l2 > 0) neonText(ctx, "r = 1/2", SAFE_CX, cy, { size: 56, color: NEON.green, glow: 22, weight: 800, alpha: l2 });
  if (l3 > 0) neonText(ctx, "S = (1/2) ÷ (1/2) = 1", SAFE_CX, cy + 130, { size: 48, color: NEON.white, glow: 26, weight: 900, alpha: l3 });

  if (local > 1.6 && local < 2.2) drawBurst(ctx, SAFE_CX, cy + 130, segProgress(local, 1.6, 2.2), { colors: [NEON.cyan, NEON.green, NEON.magenta], count: 26 });

  const cardA = segProgress(local, 2.3, 2.8);
  drawStepCard(ctx, {
    stepLabel: "대입",
    headline: "숫자를 넣으면 S = 1",
    subtext: "아까 정사각형에서 본 것과 정확히 같다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 실제/재미있는 사례 속사포 ----------
const REAL_EXAMPLES = [
  { label: "0.999...는 1과 같다?", value: "0.999… = 1", desc: "9/10+9/100+... 도 무한등비급수", color: NEON.cyan },
  { label: "제논의 역설", value: "아킬레스 vs 거북이", desc: "무한 번 따라가도 유한한 거리 = 결국 따라잡는다", color: NEON.magenta },
  { label: "계속 튕기는 공", value: "떨어진 거리의 합", desc: "무한히 튕겨도 이동 거리는 유한하다", color: NEON.green },
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
  neonText(ctx, item.label, SAFE_CX, cy - 90, { size: 36, color: NEON.white, glow: 12, weight: 700 });
  neonText(ctx, item.value, SAFE_CX, cy + 20, { size: 58, color: item.color, glow: 26, weight: 900 });
  ctx.restore();

  if (within > 0.15 && within < 0.7) drawBurst(ctx, SAFE_CX, cy + 20, segProgress(within, 0.15, 0.75), { colors: [item.color, NEON.white], count: 20 });

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
    headline: "모든 무한합이 항상 답을 가질까?",
    subtext: "1 + 1/2 + 1/3 + ... 은 답이 없다? 다음 영상에서",
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
  drawBrandLogo(ctx, WIDTH / 2, HEIGHT / 2, logoP);
  if (local > 0.85) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.85, e - s), { colors: [NEON.cyan, NEON.magenta], count: 28, maxDist: 300 });
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
  title: "끝없이 더했는데 답이 1이라고? (무한등비급수)",
  hashtags: ["#두뇌", "#수학", "#상식", "#역설", "#무한급수"],
};
