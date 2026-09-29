// reels/storyboards/simpsons_paradox.js
// [daily-reels 2026-09-29, 3/5, 호기심 우선 기획] 1973년 UC버클리 대학원 입학 성비
// 소송 사례 — 전체 합격률은 남성 44%(8442명 지원, 3738명 합격) vs 여성 35%(4321명 지원,
// 1494명 합격)로 여성에게 불리해 보였지만, 학과별로 뜯어보면 대부분 학과가 여성에게
// 불리하지 않았다(예: A학과 남성 62% vs 여성 82% 합격 — 오히려 여성이 유리). 여성이
// 경쟁률 높은(합격률 낮은) 학과에 더 많이 지원한 것이 원인(Bickel, Hammel, O'Connell,
// 1975, Science). 검증된 고전 통계 사례(심슨의 역설).
// 새 기법: 부서별 데이터를 먼저 보여준 뒤 전체로 합쳤을 때 결론이 뒤집히는
// "aggregate-reversal-reveal".
// 9:16, 1080x1920, 소리 없음. 호기심 갭 우선 기획 — 5개 중 하나, 단독 완결.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  DEPTS: [2.2, 9.0],
  REVERSE: [9.0, 15.6],
  FACT: [15.6, 18.6],
  CLOSE: [18.6, 20.6],
  OUTRO: [20.6, 22.8],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 통계학",
  title: "부서마다는 여자가 유리한데, 전체론 불리하다?",
  subtitle: "심슨의 역설 (1973년 실제 사례)",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 50);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  drawSparkle(ctx, WIDTH - 86, 630, 16, { color: NEON.green, alpha: pulse });
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
  if (p1 > 0) neonText(ctx, "학과 6곳 중 4곳이", SAFE_CX, cy - 30, { size: 34, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "여자에게 더 유리했는데", SAFE_CX, cy + 50, { size: 34, color: NEON.green, glow: 20, weight: 800, alpha: p2 });
  const p3 = segProgress(local, 1.6, 2.1);
  if (p3 > 0) neonText(ctx, "학교는 성차별로 고소당했다", SAFE_CX, cy + 130, { size: 28, color: NEON.magenta, glow: 14, weight: 700, alpha: p3 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "1973년 UC버클리 실제 사건", subtext: "숫자가 어떻게 이런 모순을 만들까", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 학과별 데이터 ----------
const DEPTS = [
  { name: "A학과", men: 62, women: 82 },
  { name: "B학과", men: 63, women: 68 },
  { name: "C학과", men: 37, women: 34 },
  { name: "D학과", men: 33, women: 35 },
];
const ROW_TOP = 540, ROW_H = 175, BAR_MAX_W = 420;

function renderDepts(ctx, t) {
  const [s] = T.DEPTS;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "학과별 합격률 (남 vs 여)", SAFE_CX, ROW_TOP - 60, { size: 26, color: NEON.white, glow: 12, weight: 700, alpha: capA });

  DEPTS.forEach((d, i) => {
    const rowA = segProgress(local, 0.6 + i * 0.9, 0.6 + i * 0.9 + 0.4, ease.outCubic);
    if (rowA <= 0) return;
    const y = ROW_TOP + i * ROW_H;
    neonText(ctx, d.name, SAFE_X0 + 20, y - 34, { size: 24, color: "rgba(210,220,240,0.85)", align: "left", glow: 0, weight: 700, alpha: rowA });

    const barX = SAFE_X0 + 20;
    // 남성 바
    ctx.save();
    ctx.globalAlpha = rowA;
    ctx.fillStyle = NEON.cyan;
    ctx.shadowColor = NEON.cyan;
    ctx.shadowBlur = 10;
    ctx.fillRect(barX, y - 6, (d.men / 100) * BAR_MAX_W * ease.outCubic(rowA), 26);
    ctx.restore();
    neonText(ctx, `남 ${d.men}%`, barX + (d.men / 100) * BAR_MAX_W + 14, y + 7, { size: 20, color: NEON.cyan, align: "left", glow: 8, weight: 700, alpha: rowA });

    // 여성 바
    ctx.save();
    ctx.globalAlpha = rowA;
    ctx.fillStyle = NEON.magenta;
    ctx.shadowColor = NEON.magenta;
    ctx.shadowBlur = 10;
    ctx.fillRect(barX, y + 34, (d.women / 100) * BAR_MAX_W * ease.outCubic(rowA), 26);
    ctx.restore();
    neonText(ctx, `여 ${d.women}%`, barX + (d.women / 100) * BAR_MAX_W + 14, y + 47, { size: 20, color: NEON.magenta, align: "left", glow: 8, weight: 700, alpha: rowA });
  });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "학과별", headline: "A학과: 여자가 20%p나 더 유리", subtext: "대부분 학과가 여성에게 불리하지 않았다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderReverse(ctx, t) {
  const [s, e] = T.REVERSE;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.3 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "그런데 전체를 합치면?", SAFE_CX, 560, { size: 30, color: NEON.white, glow: 14, weight: 700, alpha: capA });

  const barY0 = 700, barH = 90, barGap = 70, barW = 560;
  const barX = SAFE_CX - barW / 2;
  const rows = [
    { label: "남성 전체 (8,442명 지원)", value: 44, color: NEON.cyan, y: barY0 },
    { label: "여성 전체 (4,321명 지원)", value: 35, color: NEON.magenta, y: barY0 + barH + barGap },
  ];
  rows.forEach((row, i) => {
    const a = segProgress(local, 1.0 + i * 0.7, 1.6 + i * 0.7, ease.outCubic);
    if (a <= 0) return;
    neonText(ctx, row.label, barX, row.y - 30, { size: 22, color: "rgba(210,220,240,0.85)", align: "left", glow: 0, weight: 600, alpha: a });
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, row.y, barW, barH);
    ctx.fillStyle = row.color;
    ctx.shadowColor = row.color;
    ctx.shadowBlur = 16;
    ctx.fillRect(barX, row.y, barW * (row.value / 100) * ease.outCubic(a), barH);
    ctx.restore();
    neonText(ctx, `${row.value}%`, barX + barW + 20, row.y + barH / 2, { size: 30, color: row.color, align: "left", glow: 14, weight: 800, alpha: a });
  });

  const flipA = segProgress(local, dur - 2.2, dur - 1.5);
  if (flipA > 0) neonText(ctx, "합격률이 뒤집혔다", SAFE_CX, barY0 + 2 * barH + barGap + 70, { size: 30, color: NEON.yellow, glow: 16, weight: 800, alpha: flipA });
  if (local > dur - 2.2 && local < dur - 1.4) {
    drawBurst(ctx, SAFE_CX, barY0 + 2 * barH + barGap + 40, segProgress(local, dur - 2.2, dur - 1.5), { colors: [NEON.yellow, NEON.white], count: 22, maxDist: 160 });
  }
  const whyA = segProgress(local, dur - 1.2, dur - 0.6);
  if (whyA > 0) neonText(ctx, "여자가 경쟁률 높은 학과에 더 많이 지원했다", SAFE_CX, barY0 + 2 * barH + barGap + 118, { size: 22, color: "rgba(200,210,235,0.8)", glow: 0, weight: 500, alpha: whyA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "반전", headline: "학과 데이터를 합치면 결론이 바뀐다", subtext: "이게 '심슨의 역설'이다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "집단을 어떻게 나누느냐에 따라\n통계 결론이 완전히 달라진다", SAFE_CX, cy, { size: 30, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  const cardA = segProgress(local, 1.4, 1.9);
  drawStepCard(ctx, { stepLabel: "출처", headline: "Bickel, Hammel, O'Connell (1975, Science)", subtext: "UC버클리 1973년 대학원 입학 데이터", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "'전체 통계'만 보고 결론 내리면 안 되는 이유", subtext: "숫자를 어떻게 나누는지가 진실을 가른다", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.green, NEON.magenta, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.DEPTS[0]) return renderHook(ctx, t);
  if (t < T.REVERSE[0]) return renderDepts(ctx, t);
  if (t < T.FACT[0]) return renderReverse(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "부서마다는 유리한데 전체론 불리하다고? (심슨의 역설)",
  hashtags: ["#수학", "#통계", "#심슨의역설", "#이슈", "#mathtok"],
  trendSource: "viral",
  trendNote: "UC버클리 1973년 실제 입학 데이터(Bickel, Hammel, O'Connell, 1975, Science). 전체 44%(남)/35%(여), A학과 62%(남)/82%(여) 등은 검증된 역사적 수치.",
};
