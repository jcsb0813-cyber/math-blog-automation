// reels/storyboards/birthday_paradox.js
// [daily-reels 2026-09-28, 5/5] 오늘의 조회수 트렌드: #mathtok에서 꾸준히 재순환되는
// 확률론 고전 "생일 역설" — 23명만 모여도 생일이 겹칠 확률이 50%를 넘고, 70명이면
// 99.9%에 달한다는 것은 표준 조합론 결과(1-365!/(365^n(365-n)!)로 정확히 계산되는
// 검증된 수치). 사람 수가 아니라 "짝(pair)의 수"가 훨씬 빨리 늘어난다는 것이 핵심.
// 새 기법: 인원이 늘어남에 따라 확률 곡선이 올라가는 것을 보여주는
// "probability-curve-climb-reveal".
// 9:16, 1080x1920, 소리 없음. 5개 중 하나이므로 클리프행어 강제 연결 없음(단독 완결).

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01, makeRng,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  CURVE: [2.2, 10.0],
  WHY: [10.0, 14.8],
  FACT: [14.8, 18.0],
  CLOSE: [18.0, 20.0],
  OUTRO: [20.0, 22.2],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 확률론",
  title: "23명만 모이면 생일이 겹친다?",
  subtitle: "다시 화제인 생일 역설",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 55);
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
  if (p1 > 0) neonText(ctx, "이 방에 몇 명이 있어야", SAFE_CX, cy - 30, { size: 36, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "생일이 겹칠 확률이 반을 넘을까?", SAFE_CX, cy + 50, { size: 34, color: NEON.purple, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "365일 중 하루인데?", subtext: "직관보다 훨씬 적은 인원이면 충분하다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// 실제 생일 역설 공식(365일 기준) 근사값 — 표준 조합론 결과
function birthdayProb(n) {
  let p = 1;
  for (let i = 0; i < n; i++) p *= (365 - i) / 365;
  return 1 - p;
}

// ---------- 인원 누적 + 확률 곡선 ----------
const CROWD_MAX = 40;
const CHART_X0 = SAFE_X0 + 30, CHART_X1 = SAFE_X1 - 20;
const CHART_TOP = 900, CHART_BOTTOM = 1220;
const crowdRng = makeRng(555);
const CROWD_DOTS = Array.from({ length: CROWD_MAX }, (_, i) => ({
  x: 0.08 + crowdRng() * 0.84,
  y: crowdRng() * 0.7,
}));

function renderCurve(ctx, t) {
  const [s, e] = T.CURVE;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const crowdTop = 480, crowdBottom = 860;
  const fillP = segProgress(local, 0.2, dur - 1.6);
  const n = Math.max(1, Math.floor(fillP * CROWD_MAX));

  for (let i = 0; i < n; i++) {
    const dot = CROWD_DOTS[i];
    const x = CHART_X0 + dot.x * (CHART_X1 - CHART_X0);
    const y = crowdTop + dot.y * (crowdBottom - crowdTop);
    const since = clamp01((fillP - i / CROWD_MAX) / 0.06);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = NEON.white;
    ctx.shadowColor = NEON.purple;
    ctx.shadowBlur = 8 + since * 10;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 확률 곡선
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CHART_X0, CHART_BOTTOM);
  ctx.lineTo(CHART_X1, CHART_BOTTOM);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = NEON.purple;
  ctx.shadowColor = NEON.purple;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const px = CHART_X0 + (i / CROWD_MAX) * (CHART_X1 - CHART_X0);
    const prob = birthdayProb(i);
    const py = CHART_BOTTOM - prob * (CHART_BOTTOM - CHART_TOP);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // 23명, 40명 마일스톤
  const milestones = [{ n: 23, label: "23명 → 50.7%" }, { n: 40, label: "40명 → 89%" }];
  milestones.forEach((m) => {
    if (n < m.n) return;
    const a = segProgress(local, (m.n / CROWD_MAX) * (dur - 1.6) + 0.3, (m.n / CROWD_MAX) * (dur - 1.6) + 0.8);
    if (a <= 0) return;
    const px = CHART_X0 + (m.n / CROWD_MAX) * (CHART_X1 - CHART_X0);
    const py = CHART_BOTTOM - birthdayProb(m.n) * (CHART_BOTTOM - CHART_TOP);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = NEON.yellow;
    ctx.shadowColor = NEON.yellow;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const nearRightEdge = px > CHART_X0 + (CHART_X1 - CHART_X0) * 0.75;
    const labelX = nearRightEdge ? px - 14 : px + 14;
    neonText(ctx, m.label, labelX, py - 30, { size: 20, color: NEON.yellow, glow: 10, weight: 700, alpha: a, align: nearRightEdge ? "right" : "left" });
  });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "누적", headline: "한 명씩 늘어날 때마다", subtext: "겹칠 확률이 얼마나 빨리 오르는지 보자", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderWhy(ctx, t) {
  const [s] = T.WHY;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.36;
  const p1 = segProgress(local, 0.2, 0.7);
  if (p1 > 0) neonText(ctx, "핵심은 '사람 수'가 아니라", SAFE_CX, cy - 30, { size: 32, color: NEON.white, glow: 16, weight: 700, alpha: p1 });
  const p2 = segProgress(local, 0.8, 1.3);
  if (p2 > 0) neonText(ctx, "'짝(pair)의 수'다", SAFE_CX, cy + 50, { size: 36, color: NEON.purple, glow: 18, weight: 800, alpha: p2 });

  const p3 = segProgress(local, 2.0, 2.6);
  if (p3 > 0) neonText(ctx, "23명이면 짝이 253쌍", SAFE_CX, cy + 200, { size: 27, color: NEON.cyan, glow: 12, weight: 700, alpha: p3 });
  const p4 = segProgress(local, 2.8, 3.4);
  if (p4 > 0) neonText(ctx, "각 짝마다 생일이 겹칠 기회가 있다", SAFE_CX, cy + 244, { size: 24, color: "rgba(200,210,235,0.8)", glow: 0, weight: 500, alpha: p4 });

  if (local > 1.4 && local < 2.0) drawBurst(ctx, SAFE_CX, cy + 50, segProgress(local, 1.4, 2.0), { colors: [NEON.purple, NEON.white], count: 20 });

  const cardA = segProgress(local, 3.8, 4.3);
  drawStepCard(ctx, { stepLabel: "이유", headline: "짝의 수는 n(n-1)/2로 늘어난다", subtext: "사람 수보다 훨씬 빠르게 커진다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "70명이면 확률은 99.9%\n(거의 확실)", SAFE_CX, cy, { size: 32, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  const cardA = segProgress(local, 1.4, 1.9);
  drawStepCard(ctx, { stepLabel: "출처", headline: "표준 조합론 결과", subtext: "1-365!/(365ⁿ(365-n)!) 로 정확히 계산된다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "직관은 인원수를 세고, 수학은 짝의 수를 센다", subtext: "그 차이가 역설을 만든다", alpha: cardA });
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
  if (t < T.CURVE[0]) return renderHook(ctx, t);
  if (t < T.WHY[0]) return renderCurve(ctx, t);
  if (t < T.FACT[0]) return renderWhy(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "23명만 모이면 생일이 겹친다? (생일 역설)",
  hashtags: ["#수학", "#확률", "#생일역설", "#이슈", "#mathtok"],
  trendSource: "viral",
  trendNote: "#mathtok에서 꾸준히 재순환되는 확률론 고전. 23명→50.7%, 70명→99.9%는 표준 조합론 공식으로 검증되는 수치.",
};
