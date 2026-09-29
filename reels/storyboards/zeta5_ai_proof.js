// reels/storyboards/zeta5_ai_proof.js
// [daily-reels 2026-09-29, 1/5, 호기심 우선 기획] 1978년 로저 아페리가 ζ(3)이 무리수임을
// 증명한 이후, 홀수 제타값(ζ(5), ζ(7)...)의 무리수 여부는 수십 년간 개별적으로는 증명되지
// 않았다(2000~2001년 리보알/주딜린이 "ζ(5),ζ(7),ζ(9),ζ(11) 중 적어도 하나는 무리수"까지만
// 증명). 2026년 9월 17일, Aabir Fauzan의 프리프린트가 ζ(5) 자체가 무리수라는 첫 증명을
// 주장했고, 뒤이어 AI의 감사(refereeing)를 거쳐 Lean 4로 컴퓨터 정형검증까지 완료됐다
// (아직 동료심사 전이라는 점을 영상에 명시).
// 새 기법: 증명된 제타값에 체크마크가 하나씩 찍히는 "proof-checklist-reveal".
// 9:16, 1080x1920, 소리 없음. 호기심 갭 우선 기획 — 5개 중 하나, 단독 완결.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  CHECKLIST: [2.2, 10.0],
  AI: [10.0, 15.4],
  FACT: [15.4, 18.6],
  CLOSE: [18.6, 20.6],
  OUTRO: [20.6, 22.8],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 정수론",
  title: "300년 못 푼 문제, 방금 AI 검증까지 끝났다",
  subtitle: "ζ(5) 무리수 증명(2026)",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 55);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  drawSparkle(ctx, WIDTH - 86, 630, 16, { color: NEON.cyan, alpha: pulse });
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
  if (p1 > 0) neonText(ctx, "ζ(5)가 무리수인지", SAFE_CX, cy - 30, { size: 40, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "아무도 증명 못 했다... 지금까지는", SAFE_CX, cy + 60, { size: 30, color: NEON.cyan, glow: 16, weight: 700, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "2026년 9월, 마침내 증명됐다", subtext: "그것도 AI 검증을 거쳐서", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 증명 체크리스트 ----------
const ITEMS = [
  { label: "ζ(3)", note: "1978년, 로저 아페리", done: true },
  { label: "ζ(5)", note: "2026년 9월, 새 증명", done: true, highlight: true },
  { label: "ζ(7)", note: "아직 미해결", done: false },
  { label: "ζ(9)", note: "아직 미해결", done: false },
];
const ROW_H = 150;
const LIST_TOP = 560;

function renderChecklist(ctx, t) {
  const [s] = T.CHECKLIST;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "홀수 제타값, 무리수인지 하나씩 확인해보면", SAFE_CX, LIST_TOP - 70, { size: 24, color: NEON.white, glow: 12, weight: 700, alpha: capA });

  ITEMS.forEach((item, i) => {
    const rowA = segProgress(local, 0.6 + i * 1.1, 0.6 + i * 1.1 + 0.4, ease.outBack);
    if (rowA <= 0) return;
    const y = LIST_TOP + i * ROW_H;
    const x = SAFE_X0 + 30;

    ctx.save();
    ctx.globalAlpha = rowA;
    ctx.strokeStyle = item.highlight ? NEON.cyan : "rgba(255,255,255,0.2)";
    ctx.lineWidth = item.highlight ? 4 : 2.5;
    if (item.highlight) { ctx.shadowColor = NEON.cyan; ctx.shadowBlur = 16; }
    ctx.beginPath();
    ctx.arc(x + 30, y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const markA = segProgress(local, 0.9 + i * 1.1, 1.2 + i * 1.1);
    if (markA > 0 && item.done) {
      ctx.save();
      ctx.globalAlpha = markA;
      ctx.strokeStyle = item.highlight ? NEON.yellow : NEON.green;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(x + 16, y);
      ctx.lineTo(x + 26, y + 12);
      ctx.lineTo(x + 46, y - 14);
      ctx.stroke();
      ctx.restore();
    } else if (markA > 0) {
      neonText(ctx, "?", x + 30, y + 2, { size: 32, color: "rgba(210,220,240,0.6)", glow: 0, weight: 800, alpha: markA });
    }

    neonText(ctx, item.label, x + 96, y - 16, { size: 36, color: item.highlight ? NEON.cyan : NEON.white, align: "left", glow: item.highlight ? 14 : 6, weight: 800, alpha: rowA });
    neonText(ctx, item.note, x + 96, y + 26, { size: 22, color: item.done ? "rgba(200,210,235,0.8)" : "rgba(200,210,235,0.5)", align: "left", glow: 0, weight: 500, alpha: rowA });

    if (item.highlight && markA > 0.5 && markA < 0.9) {
      drawBurst(ctx, x + 30, y, segProgress(local, 0.9 + i * 1.1, 1.3 + i * 1.1), { colors: [NEON.cyan, NEON.yellow, NEON.white], count: 18, maxDist: 110 });
    }
  });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "체크리스트", headline: "ζ(5) — 48년 만에 다음 칸이 채워졌다", subtext: "ζ(7), ζ(9)는 여전히 미해결", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderAI(ctx, t) {
  const [s] = T.AI;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.34;
  const p1 = segProgress(local, 0.2, 0.7);
  if (p1 > 0) neonText(ctx, "증명이 발표되자마자", SAFE_CX, cy - 30, { size: 32, color: NEON.white, glow: 16, weight: 700, alpha: p1 });
  const p2 = segProgress(local, 0.8, 1.3);
  if (p2 > 0) neonText(ctx, "AI가 논리를 감사(audit)했다", SAFE_CX, cy + 50, { size: 32, color: NEON.cyan, glow: 16, weight: 800, alpha: p2 });

  const p3 = segProgress(local, 2.0, 2.6);
  if (p3 > 0) neonText(ctx, "그 다음 Lean(증명 검증 언어)으로", SAFE_CX, cy + 200, { size: 26, color: "rgba(200,210,235,0.85)", glow: 8, weight: 600, alpha: p3 });
  const p4 = segProgress(local, 2.8, 3.4);
  if (p4 > 0) neonText(ctx, "컴퓨터가 한 줄 한 줄 재검증했다", SAFE_CX, cy + 244, { size: 26, color: "rgba(200,210,235,0.85)", glow: 8, weight: 600, alpha: p4 });

  if (local > 1.4 && local < 2.0) drawBurst(ctx, SAFE_CX, cy + 50, segProgress(local, 1.4, 2.0), { colors: [NEON.cyan, NEON.white], count: 20 });

  const cardA = segProgress(local, 4.0, 4.5);
  drawStepCard(ctx, { stepLabel: "검증", headline: "사람의 통찰 + AI의 꼼꼼함", subtext: "아직 동료심사 전이지만, 정형검증은 이미 통과했다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "2026년 9월 17일 프리프린트\nAabir Fauzan 발표", SAFE_CX, cy, { size: 30, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  const cardA = segProgress(local, 1.4, 1.9);
  drawStepCard(ctx, { stepLabel: "출처", headline: "아직 동료심사 전인 프리프린트", subtext: "Lean 4 정형검증은 이미 완료됨", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "ζ(7)은 누가, 언제 풀까?", subtext: "다음 체크마크는 사람일까 AI일까", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.cyan, NEON.yellow, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.CHECKLIST[0]) return renderHook(ctx, t);
  if (t < T.AI[0]) return renderChecklist(ctx, t);
  if (t < T.FACT[0]) return renderAI(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "300년 못 푼 문제, AI 검증까지 끝났다 (ζ(5) 무리수 증명)",
  hashtags: ["#수학", "#정수론", "#AI", "#이슈", "#제타함수"],
  trendSource: "issue",
  trendNote: "2026.9.17 Aabir Fauzan 프리프린트, AI 감사 + Lean 4 정형검증. 동료심사 전 단계임을 영상에 명시. ζ(3)은 1978년 Apéry가 증명(검증된 역사적 사실).",
};
