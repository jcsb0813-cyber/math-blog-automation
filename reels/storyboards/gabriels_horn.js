// reels/storyboards/gabriels_horn.js
// [daily-reels 2026-09-29, 4/5, 호기심 우선 기획] y=1/x (x≥1)를 x축 중심으로 회전시켜
// 만든 입체 "가브리엘의 뿔"(토리첼리의 트럼펫, 17세기)은 겉넓이가 무한대인데 부피는
// 유한(π)하다는 미적분학의 고전 역설. "내부는 페인트로 채울 수 있는데 겉면을 칠할
// 페인트는 무한히 필요하다"는 역설적 설명으로 유명. 검증된 표준 미적분 결과.
// 새 기법: 회전체를 프레임 단위로 조금씩 늘려가며 만드는 "solid-of-revolution-reveal"
// (project3D 재사용, conic_sections 이후 처음 쓰는 3D 입체 기법).
// 9:16, 1080x1920, 소리 없음. 호기심 갭 우선 기획 — 5개 중 하나, 단독 완결.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01, project3D,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  BUILD: [2.2, 10.0],
  PAINT: [10.0, 15.6],
  FACT: [15.6, 18.6],
  CLOSE: [18.6, 20.6],
  OUTRO: [20.6, 22.8],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 미적분학",
  title: "겉넓이는 무한대인데 부피는 유한하다?",
  subtitle: "가브리엘의 뿔 (17세기 고전 역설)",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 50);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  drawSparkle(ctx, WIDTH - 86, 630, 16, { color: NEON.purple, alpha: pulse });
  drawSparkle(ctx, 78, HEIGHT - 650, 12, { color: NEON.white, alpha: pulse * 0.7 });
}

function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.4) });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.4, 0.9);
  if (p1 > 0) neonText(ctx, "이 뿔 모양, 겉면을 칠하려면", SAFE_CX, cy - 30, { size: 34, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "페인트가 무한히 필요하다", SAFE_CX, cy + 60, { size: 38, color: NEON.purple, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "그런데 속은 유한한 페인트로 채워진다", subtext: "같은 모양인데 어떻게?", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- y=1/x 회전체 ----------
const HORN_CX = SAFE_CX, HORN_CY = 820;
const X_START = 1, X_END_FULL = 7;
const SCALE = 110;

function hornRing(xVal, angleSamples, rotY) {
  const r = (1 / xVal) * SCALE;
  const pts = [];
  for (let i = 0; i <= angleSamples; i++) {
    const a = (i / angleSamples) * Math.PI * 2;
    pts.push(project3D(
      { x: (xVal - X_START) * SCALE * 0.55, y: Math.cos(a) * r, z: Math.sin(a) * r },
      { rotY, tiltX: 0.5, scale: 1, cx: HORN_CX, cy: HORN_CY, perspective: 900 }
    ));
  }
  return pts;
}

function drawHorn(ctx, xEnd, rotY, color, alpha) {
  const steps = 26;
  const rings = [];
  for (let i = 0; i <= steps; i++) {
    const xVal = X_START + (xEnd - X_START) * (i / steps);
    rings.push(hornRing(xVal, 28, rotY));
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.6;
  // 세로선(모선) 몇 가닥
  for (let k = 0; k < 28; k += 4) {
    ctx.beginPath();
    rings.forEach((ring, i) => {
      const p = ring[k];
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }
  // 단면 원(입구, 끝)
  [0, rings.length - 1].forEach((idx) => {
    ctx.beginPath();
    rings[idx].forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();
  });
  ctx.restore();
}

function renderBuild(ctx, t) {
  const [s, e] = T.BUILD;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const growP = segProgress(local, 0.2, dur - 1.6, ease.outCubic);
  const xEnd = X_START + (X_END_FULL - X_START) * Math.max(0.06, growP);
  const rotY = 0.15 + local * 0.12;
  drawHorn(ctx, xEnd, rotY, NEON.purple, 1);

  const capA = segProgress(local, 0.2, 0.7);
  if (capA > 0) neonText(ctx, "y = 1/x 를 x축으로 돌리면", SAFE_CX, 460, { size: 27, color: NEON.white, glow: 12, weight: 700, alpha: capA });

  const doneA = segProgress(local, dur - 1.4, dur - 0.8);
  if (doneA > 0) neonText(ctx, "끝없이 가늘어지지만 절대 0이 되지 않는다", SAFE_CX, HORN_CY + 420, { size: 24, color: NEON.purple, glow: 12, weight: 700, alpha: doneA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "작도", headline: "가브리엘의 뿔 (토리첼리의 트럼펫)", subtext: "무한히 뻗어나가는 회전체", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderPaint(ctx, t) {
  const [s] = T.PAINT;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const rotY = 0.15 + (T.BUILD[1] - T.BUILD[0] + local) * 0.12;
  drawHorn(ctx, X_END_FULL, rotY, NEON.purple, 0.5);

  const cy = SAFE_Y1 * 0.32;
  const p1 = segProgress(local, 0.2, 0.7);
  if (p1 > 0) neonText(ctx, "겉넓이 = 무한대", SAFE_CX, cy, { size: 36, color: NEON.magenta, glow: 18, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 0.9, 1.4);
  if (p2 > 0) neonText(ctx, "부피 = π (유한!)", SAFE_CX, cy + 80, { size: 36, color: NEON.cyan, glow: 18, weight: 800, alpha: p2 });

  if (local > 1.6 && local < 2.2) drawBurst(ctx, SAFE_CX, cy + 40, segProgress(local, 1.6, 2.2), { colors: [NEON.magenta, NEON.cyan, NEON.white], count: 24, maxDist: 180 });

  const p3 = segProgress(local, 2.6, 3.2);
  if (p3 > 0) neonText(ctx, "속을 채울 페인트는 유한한데", SAFE_CX, cy + 220, { size: 25, color: "rgba(200,210,235,0.85)", glow: 0, weight: 500, alpha: p3 });
  const p4 = segProgress(local, 3.4, 4.0);
  if (p4 > 0) neonText(ctx, "겉을 칠할 페인트는 무한히 든다", SAFE_CX, cy + 264, { size: 25, color: "rgba(200,210,235,0.85)", glow: 0, weight: 500, alpha: p4 });

  const cardA = segProgress(local, 4.4, 4.9);
  drawStepCard(ctx, { stepLabel: "역설", headline: "같은 입체인데 앞뒤가 안 맞는다", subtext: "적분으로 정확히 계산되는 결과다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderFact(ctx, t) {
  const [s] = T.FACT;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.2, 0.7);
  if (p1 > 0) neonText(ctx, "17세기 이탈리아 수학자\n토리첼리가 처음 발견했다", SAFE_CX, cy, { size: 30, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  const cardA = segProgress(local, 1.4, 1.9);
  drawStepCard(ctx, { stepLabel: "출처", headline: "미적분학 표준 결과 (∫₁^∞ π/x² dx = π)", subtext: "적분으로 정확히 증명 가능", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "무한은 직관을 자주 배신한다", subtext: "수학은 그 배신을 정확한 숫자로 확인시켜준다", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.purple, NEON.cyan, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.BUILD[0]) return renderHook(ctx, t);
  if (t < T.PAINT[0]) return renderBuild(ctx, t);
  if (t < T.FACT[0]) return renderPaint(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "겉넓이는 무한대인데 부피는 유한하다? (가브리엘의 뿔)",
  hashtags: ["#수학", "#미적분", "#역설", "#기하학", "#mathtok"],
  trendSource: "viral",
  trendNote: "17세기 토리첼리가 발견한 표준 미적분 역설(가브리엘의 뿔/토리첼리의 트럼펫). 겉넓이 무한대·부피 π는 적분으로 검증되는 확립된 수학 결과.",
};
