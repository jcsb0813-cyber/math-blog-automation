// reels/storyboards/point_nine_repeating.js
// [daily-reels 2026-09-29, 5/5, 호기심 우선 기획] "0.999...(무한히 반복) = 1"은 인터넷에서
// 영원히 논쟁거리가 되는 클래식 떡밥이지만, 실수 체계에서는 엄밀하게 참인 표준 수학
// 정리다(10x-x 대수적 증명, 1/3=0.333... 증명 등 복수의 독립적 증명이 존재). 이 스토리
// 보드는 "댓글창에서 싸우는" 형식으로 통념(오답처럼 보이는 주장)을 먼저 보여준 뒤
// 대수적으로 반박하는 구성.
// 새 기법: 잘못된 통념을 댓글 말풍선으로 보여주고 벗겨내듯 반박하는 "comment-debate-reveal".
// 9:16, 1080x1920, 소리 없음. 호기심 갭 우선 기획 — 5개 중 하나, 단독 완결.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  COMMENT: [2.2, 7.4],
  PROOF: [7.4, 15.6],
  FACT: [15.6, 18.4],
  CLOSE: [18.4, 20.4],
  OUTRO: [20.4, 22.6],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 실수론",
  title: "0.999...는 사실 1이다 (진짜임)",
  subtitle: "인터넷 영원한 떡밥의 정답",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 50);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  drawSparkle(ctx, WIDTH - 86, 630, 16, { color: NEON.magenta, alpha: pulse });
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
  if (p1 > 0) neonText(ctx, "0.999...(무한히 반복)", SAFE_CX, cy - 30, { size: 40, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "이거 1이랑 완전히 같다", SAFE_CX, cy + 60, { size: 38, color: NEON.magenta, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "'거의 같다'가 아니라 '완전히 같다'", subtext: "댓글창에서 매번 싸우는 그 문제", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 댓글 말풍선 ----------
function drawBubble(ctx, x, y, w, h, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(20,24,40,0.9)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 40, y + h);
  ctx.lineTo(x + 60, y + h + 22);
  ctx.lineTo(x + 76, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderComment(ctx, t) {
  const [s] = T.COMMENT;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const bubbleA = segProgress(local, 0.3, 1.0, ease.outBack);
  const bx = SAFE_X0 + 30, by = 560, bw = SAFE_X1 - SAFE_X0 - 60, bh = 190;
  if (bubbleA > 0) drawBubble(ctx, bx, by, bw, bh, bubbleA);

  const nameA = segProgress(local, 0.5, 1.0);
  if (nameA > 0) neonText(ctx, "익명123", bx + 34, by + 42, { size: 22, color: NEON.cyan, align: "left", glow: 8, weight: 700, alpha: nameA });
  const textA = segProgress(local, 0.8, 1.4);
  if (textA > 0) {
    neonText(ctx, "말도 안 됨ㅋㅋ 0.999...는", bx + 34, by + 92, { size: 26, color: NEON.white, align: "left", glow: 0, weight: 600, alpha: textA });
    neonText(ctx, "1보다 아주 조금 작은 수잖아요", bx + 34, by + 134, { size: 26, color: NEON.white, align: "left", glow: 0, weight: 600, alpha: textA });
  }

  const replyA = segProgress(local, 2.4, 3.0);
  if (replyA > 0) neonText(ctx, "...정말 그럴까?", SAFE_CX, by + bh + 100, { size: 28, color: NEON.yellow, glow: 14, weight: 700, alpha: replyA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "흔한 오해", headline: "'1보다 살짝 작다'는 착각", subtext: "직관은 그렇지만, 대수는 다르게 말한다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderProof(ctx, t) {
  const [s] = T.PROOF;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.3 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = 620;
  const lines = [
    "x = 0.999...",
    "10x = 9.999...",
    "10x − x = 9.999... − 0.999...",
    "9x = 9",
    "x = 1",
  ];
  lines.forEach((line, i) => {
    const a = segProgress(local, 0.4 + i * 1.3, 0.4 + i * 1.3 + 0.5, ease.outCubic);
    if (a <= 0) return;
    const isLast = i === lines.length - 1;
    neonText(ctx, line, SAFE_CX, cy + i * 92, { size: isLast ? 44 : 32, color: isLast ? NEON.yellow : NEON.white, glow: isLast ? 20 : 10, weight: isLast ? 800 : 700, alpha: a });
    if (isLast && a > 0.6) {
      drawBurst(ctx, SAFE_CX, cy + i * 92, segProgress(local, 0.4 + i * 1.3 + 0.2, 0.4 + i * 1.3 + 0.8), { colors: [NEON.yellow, NEON.white], count: 20, maxDist: 140 });
    }
  });

  const altA = segProgress(local, 6.8, 7.4);
  if (altA > 0) neonText(ctx, "1/3 = 0.333... 이니까 3배 하면 1 = 0.999...", SAFE_CX, cy + lines.length * 92 + 50, { size: 22, color: "rgba(200,210,235,0.8)", glow: 0, weight: 500, alpha: altA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "증명", headline: "x=0.999...라면 10x−x=9x=9", subtext: "그러므로 x는 정확히 1이다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "두 실수가 다르다면\n반드시 그 사이에 다른 수가 있어야 한다", SAFE_CX, cy, { size: 27, color: NEON.white, glow: 14, weight: 700, alpha: p1 });

  const cardA = segProgress(local, 1.6, 2.1);
  drawStepCard(ctx, { stepLabel: "핵심", headline: "0.999...와 1 사이엔 아무 수도 없다", subtext: "그래서 둘은 다른 수가 아니라 같은 수다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "표기가 다르다고 값이 다른 건 아니다", subtext: "이 댓글 논쟁, 이제 종결해도 된다", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.magenta, NEON.yellow, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.COMMENT[0]) return renderHook(ctx, t);
  if (t < T.PROOF[0]) return renderComment(ctx, t);
  if (t < T.FACT[0]) return renderProof(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "0.999...는 사실 1이다 (진짜임, 인터넷 영원한 떡밥 종결)",
  hashtags: ["#수학", "#실수론", "#떡밥", "#mathtok", "#증명"],
  trendSource: "viral",
  trendNote: "0.999...=1은 실수 체계에서 엄밀하게 증명되는 표준 정리(대수적 증명, 1/3=0.333... 증명 등 다수). #mathtok에서 꾸준히 재순환되는 논쟁형 떡밥.",
};
