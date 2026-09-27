// reels/storyboards/new_math_vs_old.js
// [daily-reels 2026-09-27] 오늘의 조회수 트렌드: "요즘 애들이 배우는 수학이 부모 세대와
// 완전히 다르다"는 화제가 SNS/뉴스에서 계속 회자되는 중(2026.9.25 지역 뉴스 다수 보도,
// "Why parents struggle with 'new math'"). 같은 문제를 두 가지 방식으로 푸는 과정을
// 좌우 분할 화면으로 동시에 보여준다 — 지금까지 쓴 적 없는 새 기법(side-by-side).
// 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  SPLIT: [2.2, 10.0],
  WHY: [10.0, 13.6],
  FACT: [13.6, 17.0],
  CLIFF: [17.0, 19.2],
  OUTRO: [19.2, 21.4],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 교육",
  title: "요즘 애들 수학, 왜 부모님은 당황할까",
  subtitle: "새 수학 교육법이 다른 이유",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 60);
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.4) });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.4, 0.9);
  if (p1 > 0) neonText(ctx, "47 + 38 = ?", SAFE_CX, cy, { size: 56, color: NEON.white, glow: 20, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "이 쉬운 덧셈, 푸는 법이 두 가지다", SAFE_CX, cy + 80, { size: 30, color: NEON.cyan, glow: 14, weight: 600, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "부모님 방식 vs 요즘 방식", subtext: "같이 비교해보자", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 좌우 분할: 옛날 방식(세로셈) vs 요즘 방식(수 분해) ----------
const SPLIT_TOP = 420, SPLIT_BOTTOM = SAFE_Y1 - 320;
const LEFT_CX = (SAFE_X0 + SAFE_CX - 20) / 2;
const RIGHT_CX = (SAFE_CX + 20 + SAFE_X1) / 2;

const OLD_LINES = ["  47", "+ 38", "————", "  85"];
const NEW_LINES = ["38 = 30 + 8", "47 + 30 = 77", "77 + 8 = 85"];

function renderSplit(ctx, t) {
  const [s, e] = T.SPLIT;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  // 중앙 구분선
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(SAFE_CX, SPLIT_TOP - 20);
  ctx.lineTo(SAFE_CX, SPLIT_BOTTOM);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  const headA = segProgress(local, 0.1, 0.5);
  neonText(ctx, "옛날 방식", LEFT_CX, SPLIT_TOP - 50, { size: 32, color: NEON.magenta, glow: 14, weight: 800, alpha: headA });
  neonText(ctx, "요즘 방식", RIGHT_CX, SPLIT_TOP - 50, { size: 32, color: NEON.cyan, glow: 14, weight: 800, alpha: headA });

  const lineGap = 58;
  OLD_LINES.forEach((line, i) => {
    const a = segProgress(local, 0.6 + i * 0.5, 0.6 + i * 0.5 + 0.4, ease.outCubic);
    if (a <= 0) return;
    const isResult = i === OLD_LINES.length - 1;
    neonText(ctx, line, LEFT_CX, SPLIT_TOP + i * lineGap, {
      size: isResult ? 44 : 34, color: isResult ? NEON.yellow : NEON.white, glow: isResult ? 20 : 8, weight: 800, alpha: a,
    });
  });
  NEW_LINES.forEach((line, i) => {
    const a = segProgress(local, 0.9 + i * 0.7, 0.9 + i * 0.7 + 0.4, ease.outCubic);
    if (a <= 0) return;
    const isResult = i === NEW_LINES.length - 1;
    neonText(ctx, line, RIGHT_CX, SPLIT_TOP + i * lineGap, {
      size: isResult ? 34 : 27, color: isResult ? NEON.yellow : NEON.white, glow: isResult ? 20 : 8, weight: isResult ? 800 : 600, alpha: a,
    });
  });

  const bothDone = segProgress(local, dur - 2.0, dur - 1.5);
  if (bothDone > 0 && local < dur - 0.3) {
    neonText(ctx, "결국 답은 똑같이 85", SAFE_CX, SPLIT_BOTTOM + 50, { size: 30, color: NEON.green, glow: 16, weight: 700, alpha: bothDone });
  }
  if (local > dur - 2.0 && local < dur - 1.3) {
    drawBurst(ctx, LEFT_CX, SPLIT_TOP + 3 * lineGap, segProgress(local, dur - 2.0, dur - 1.4), { colors: [NEON.yellow, NEON.white], count: 12, maxDist: 90 });
    drawBurst(ctx, RIGHT_CX, SPLIT_TOP + 2 * lineGap, segProgress(local, dur - 2.0, dur - 1.4), { colors: [NEON.yellow, NEON.white], count: 12, maxDist: 90 });
  }

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "비교", headline: "'세로셈' vs '수 쪼개기'", subtext: "과정은 다르지만 결과는 같다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderWhy(ctx, t) {
  const [s] = T.WHY;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.2, 0.7);
  const p2 = segProgress(local, 0.8, 1.3);
  if (p1 > 0) neonText(ctx, "정답보다 '왜'에 집중한다", SAFE_CX, cy - 30, { size: 36, color: NEON.white, glow: 16, weight: 700, alpha: p1 });
  if (p2 > 0) neonText(ctx, "암산 능력과 수 감각을\n키우기 위한 설계다", SAFE_CX, cy + 60, { size: 30, color: NEON.cyan, glow: 14, weight: 600, alpha: p2 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy + 60, segProgress(local, 1.2, 1.8), { colors: [NEON.cyan, NEON.white], count: 20 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "이유", headline: "계산기가 있는 시대의 수학 교육", subtext: "빠른 계산보다 수의 구조를 이해하는 것이 목표", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "미국 '공통핵심교육과정'에서\n특히 논쟁이 뜨겁다", SAFE_CX, cy, { size: 32, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  const cardA = segProgress(local, 1.3, 1.8);
  drawStepCard(ctx, { stepLabel: "현실", headline: "부모 세대와 배우는 법이 다르다", subtext: "그래서 숙제를 도와주기 어렵다는 목소리가 많다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderCliff(ctx, t) {
  const [s] = T.CLIFF;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "다음 편", headline: "그럼 어떤 방식이 진짜 더 효과적일까?", subtext: "연구 결과로 확인해본다, 다음 영상에서", alpha: cardA });
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

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.SPLIT[0]) return renderHook(ctx, t);
  if (t < T.WHY[0]) return renderSplit(ctx, t);
  if (t < T.FACT[0]) return renderWhy(ctx, t);
  if (t < T.CLIFF[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "47+38, 부모님과 요즘 애들 푸는 법이 다르다?",
  hashtags: ["#두뇌", "#수학", "#교육", "#이슈", "#육아"],
  trendSource: "viral",
  trendNote: "2026년 9월 지역 뉴스 다수 보도 — 'new math' vs 'old math' 부모 세대 혼란 화제",
};
