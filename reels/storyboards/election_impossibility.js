// reels/storyboards/election_impossibility.js
// [daily-reels 2026-09-27, 배치 확장 4/5] 오늘의 이슈: 케임브리지대·코펜하겐대 연구팀이
// "지역 대표성 + 비례성 + 고정 의석수"를 동시에 만족하는 선거제도는 수학적으로
// 존재할 수 없다는 불가능성 정리를 증명 (Annals of Operations Research, 2026.8 보도,
// ScienceDaily/Cambridge 공식 발표). 실제 사례: 2024년 영국 총선에서 노동당은 득표율
// 33.7%로 의석 63%를 차지(역대 가장 비례성이 낮은 선거)했다는 검증된 수치를 사용.
// 새 기법: 삼각형 꼭짓점에 세 목표를 배치하는 "trilemma-triangle-reveal".
// 9:16, 1080x1920, 소리 없음. 이 배치는 5개 중 하나이므로 클리프행어 강제 연결 없음(단독 완결).

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  TRIANGLE: [2.2, 10.0],
  DATA: [10.0, 15.5],
  FACT: [15.5, 19.0],
  CLOSE: [19.0, 21.2],
  OUTRO: [21.2, 23.4],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 사회선택이론",
  title: "완벽한 선거는 수학적으로 불가능하다",
  subtitle: "케임브리지대·코펜하겐대 공동 연구(2026)",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 55);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  drawSparkle(ctx, WIDTH - 90, 640, 18, { color: NEON.purple, alpha: pulse });
  drawSparkle(ctx, 74, HEIGHT - 640, 12, { color: NEON.white, alpha: pulse * 0.7 });
}

function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.4) });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.4, 0.9);
  if (p1 > 0) neonText(ctx, "이 셋을 동시에 만족하는", SAFE_CX, cy - 30, { size: 40, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "선거제도는 없다", SAFE_CX, cy + 50, { size: 44, color: NEON.purple, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "수학이 증명한 '완벽한 선거'의 한계", subtext: "2026년 논문 기준", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 삼각형 트릴레마: 세 목표를 동시에 만족할 수 없다 ----------
const GOALS = [
  { label: "지역 대표성", sub: "지역에서 이기면 의석도" },
  { label: "비례성", sub: "득표율 = 의석 비율" },
  { label: "고정 의석수", sub: "의회 규모 그대로" },
];
const TRI_CY = 760, TRI_R = 300;
function triVertex(i) {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
  return { x: SAFE_CX + Math.cos(angle) * TRI_R, y: TRI_CY + Math.sin(angle) * TRI_R };
}

function renderTriangle(ctx, t) {
  const [s, e] = T.TRIANGLE;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const verts = [triVertex(0), triVertex(1), triVertex(2)];

  // 변(edge) 3개를 순서대로 그린다
  for (let i = 0; i < 3; i++) {
    const a = segProgress(local, 0.3 + i * 0.5, 0.3 + i * 0.5 + 0.5, ease.outCubic);
    if (a <= 0) continue;
    const p0 = verts[i], p1 = verts[(i + 1) % 3];
    const mx = p0.x + (p1.x - p0.x) * a, my = p0.y + (p1.y - p0.y) * a;
    ctx.save();
    ctx.strokeStyle = NEON.purple;
    ctx.shadowColor = NEON.purple;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(mx, my);
    ctx.stroke();
    ctx.restore();
  }

  // 꼭짓점 라벨 3개
  GOALS.forEach((g, i) => {
    const a = segProgress(local, 0.6 + i * 0.5, 1.1 + i * 0.5, ease.outBack);
    if (a <= 0) return;
    const v = verts[i];
    const ty = v.y + (i === 0 ? -70 : 56);
    neonText(ctx, g.label, v.x, ty, { size: 32, color: NEON.white, glow: 14, weight: 800, alpha: a });
    neonText(ctx, g.sub, v.x, ty + 42, { size: 22, color: "rgba(200,210,235,0.8)", glow: 0, weight: 500, alpha: a });
    if (a > 0.3) drawSparkle(ctx, v.x, v.y, 10 * a, { color: NEON.purple, alpha: a });
  });

  // 중앙에 "동시엔 불가능" X 표시
  const xP = segProgress(local, dur - 3.0, dur - 2.0, ease.outBack);
  if (xP > 0) {
    ctx.save();
    ctx.globalAlpha = xP;
    ctx.strokeStyle = NEON.yellow;
    ctx.shadowColor = NEON.yellow;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    const r = 46 * xP;
    ctx.beginPath();
    ctx.moveTo(SAFE_CX - r, TRI_CY - r);
    ctx.lineTo(SAFE_CX + r, TRI_CY + r);
    ctx.moveTo(SAFE_CX + r, TRI_CY - r);
    ctx.lineTo(SAFE_CX - r, TRI_CY + r);
    ctx.stroke();
    ctx.restore();
  }
  if (local > dur - 2.0 && local < dur - 1.3) {
    drawBurst(ctx, SAFE_CX, TRI_CY, segProgress(local, dur - 2.0, dur - 1.4), { colors: [NEON.yellow, NEON.purple, NEON.white], count: 26, maxDist: 200 });
  }
  const capA = segProgress(local, dur - 1.6, dur - 1.0);
  if (capA > 0) neonText(ctx, "정당 수가 많아지면 셋 다는 불가능", SAFE_CX, TRI_CY + TRI_R + 110, { size: 27, color: NEON.yellow, glow: 12, weight: 700, alpha: capA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "증명", headline: "세 목표의 삼각관계", subtext: "하나를 포기해야 나머지 둘을 만족한다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 실제 데이터: 2024년 영국 총선 (검증된 수치) ----------
function renderData(ctx, t) {
  const [s] = T.DATA;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "2024년 영국 총선, 노동당", SAFE_CX, 560, { size: 32, color: NEON.white, glow: 14, weight: 700, alpha: capA });

  const barX = SAFE_CX - 280, barW = 560, barH = 70;
  const rows = [
    { y: 660, label: "득표율", value: 33.7, color: NEON.cyan },
    { y: 800, label: "의석 비율", value: 63, color: NEON.yellow },
  ];
  rows.forEach((row, i) => {
    const a = segProgress(local, 0.8 + i * 0.6, 1.3 + i * 0.6, ease.outCubic);
    if (a <= 0) return;
    neonText(ctx, row.label, barX, row.y - 30, { size: 24, color: "rgba(210,220,240,0.85)", align: "left", glow: 0, weight: 600, alpha: a });
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

  const gapA = segProgress(local, 2.6, 3.2);
  if (gapA > 0) neonText(ctx, "득표율의 거의 2배가 의석으로", SAFE_CX, 940, { size: 28, color: NEON.magenta, glow: 14, weight: 700, alpha: gapA });
  const noteA = segProgress(local, 3.4, 4.0);
  if (noteA > 0) neonText(ctx, "역대 가장 비례성이 낮았던 선거", SAFE_CX, 980, { size: 24, color: "rgba(200,210,235,0.75)", glow: 0, weight: 500, alpha: noteA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "실제 사례", headline: "제도 탓이 아니라 수학적 한계", subtext: "덴마크(비례대표제)도 2022년 비슷한 왜곡을 겪었다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderFact(ctx, t) {
  const [s] = T.FACT;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.2, 0.7);
  if (p1 > 0) neonText(ctx, "이건 '나쁜 정치'가 아니라\n수학적으로 증명된 불가능성이다", SAFE_CX, cy, { size: 30, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy, segProgress(local, 1.2, 1.8), { colors: [NEON.purple, NEON.white], count: 18 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "출처", headline: "Annals of Operations Research (2026)", subtext: "케임브리지대 · 코펜하겐대 공동 연구", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "완벽한 제도가 없다는 걸 아는 것도 수학의 힘", subtext: "그래서 '어떤 걸 포기할지'를 사회가 선택해야 한다", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.purple, NEON.yellow, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.TRIANGLE[0]) return renderHook(ctx, t);
  if (t < T.DATA[0]) return renderTriangle(ctx, t);
  if (t < T.FACT[0]) return renderData(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "완벽한 선거는 수학적으로 불가능하다는 증명",
  hashtags: ["#수학", "#정치", "#선거", "#사회선택이론", "#이슈"],
  trendSource: "issue",
  trendNote: "2026년 8월 Annals of Operations Research 발표, 케임브리지대·코펜하겐대 공동 연구. 영국 2024 총선 수치(33.7%→63%)는 공개 선거 결과 기준.",
};
