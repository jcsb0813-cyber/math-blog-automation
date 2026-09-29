// reels/storyboards/checker_shadow_illusion.js
// [daily-reels 2026-09-29, 2/5, 호기심 우선 기획] MIT 시각과학 교수 Edward H. Adelson이
// 1995년 발표한 "체커 그림자 착시" — 체스판 위 원기둥 그림자 안의 밝은 칸(B)과 그림자
// 밖의 어두운 칸(A)은 실제로 완전히 동일한 회색이지만, 뇌가 그림자를 보정해서 다르게
// 인식한다. 두 칸을 잇는 같은 색 막대를 그려서 "증명"하는 방식이 원본 시연의 핵심이며,
// 이 스토리보드도 동일한 검증 방식을 그대로 재현한다. #mathtok/#illusion 계열에서
// 꾸준히 재순환되는 평생 바이럴 소재.
// 새 기법: 두 칸의 실제 색이 같다는 것을 잇는 막대로 보여주는 "color-sampling-proof-reveal".
// 9:16, 1080x1920, 소리 없음. 호기심 갭 우선 기획 — 5개 중 하나, 단독 완결.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  BOARD: [2.2, 9.4],
  PROOF: [9.4, 15.6],
  FACT: [15.6, 18.6],
  CLOSE: [18.6, 20.6],
  OUTRO: [20.6, 22.8],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 착시·지각",
  title: "이 두 칸, 진짜 같은 색이라고?",
  subtitle: "체커 그림자 착시(1995, MIT)",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 45);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  drawSparkle(ctx, WIDTH - 86, 630, 16, { color: NEON.yellow, alpha: pulse });
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
  if (p1 > 0) neonText(ctx, "곧 나올 두 칸, 색이 달라 보이지만", SAFE_CX, cy - 30, { size: 32, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "실제로는 완전히 같은 색이다", SAFE_CX, cy + 60, { size: 36, color: NEON.yellow, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "MIT 교수가 만든 유명한 착시", subtext: "1995년 발표, 지금도 안 믿는 사람 많음", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 체스판 + 원기둥 그림자 ----------
const BOARD_CX = SAFE_CX, BOARD_CY = 760, CELL = 78, COLS = 8, ROWS = 8;
const BOARD_X0 = BOARD_CX - (COLS * CELL) / 2;
const BOARD_Y0 = BOARD_CY - (ROWS * CELL) / 2;
const GRAY = "#787878"; // A, B 두 칸의 실제(동일한) 색

function cellBaseColor(r, c) {
  return (r + c) % 2 === 0 ? "#3a3a3a" : "#c4c4c4";
}
// A: 그림자 밖 어두운 칸(보드상 (row4,col3)), B: 그림자 안 밝은 칸(row2,col5) — 실제로는 둘 다 GRAY
const CELL_A = { r: 4, c: 2 };
const CELL_B = { r: 2, c: 5 };

function drawBoard(ctx, revealFrac) {
  const total = COLS * ROWS;
  const n = Math.floor(revealFrac * total);
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (idx >= n) return;
      const isA = r === CELL_A.r && c === CELL_A.c;
      const isB = r === CELL_B.r && c === CELL_B.c;
      const x = BOARD_X0 + c * CELL, y = BOARD_Y0 + r * CELL;
      ctx.fillStyle = (isA || isB) ? GRAY : cellBaseColor(r, c);
      ctx.fillRect(x, y, CELL, CELL);
      idx++;
    }
  }
}

function drawShadowOverlay(ctx, alpha) {
  // 원기둥이 보드 위쪽 대각선에 드리우는 타원형 그림자 (B가 이 안에 들어간다)
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(BOARD_X0 + 5.3 * CELL, BOARD_Y0 + 2.6 * CELL, 220, 150, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 원기둥 몸체(그림자의 원인)
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(90,60,20,0.9)";
  ctx.beginPath();
  ctx.ellipse(BOARD_X0 + 6.4 * CELL, BOARD_Y0 - 0.6 * CELL, 70, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(BOARD_X0 + 6.4 * CELL - 70, BOARD_Y0 - 0.6 * CELL, 140, 170);
  ctx.restore();
}

function labelCell(ctx, cell, text, color, alpha) {
  const x = BOARD_X0 + (cell.c + 0.5) * CELL, y = BOARD_Y0 + (cell.r + 0.5) * CELL;
  neonText(ctx, text, x, y, { size: 30, color, glow: 14, weight: 800, alpha });
}

function renderBoard(ctx, t) {
  const [s, e] = T.BOARD;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const boardA = segProgress(local, 0.1, 1.2);
  drawBoard(ctx, boardA);
  const shadowA = segProgress(local, 1.2, 1.8);
  if (shadowA > 0) drawShadowOverlay(ctx, shadowA);

  const labelA = segProgress(local, 2.2, 2.8);
  if (labelA > 0) {
    labelCell(ctx, CELL_A, "A", NEON.magenta, labelA);
    labelCell(ctx, CELL_B, "B", NEON.cyan, labelA);
  }

  const capA = segProgress(local, 3.2, 3.8);
  if (capA > 0) neonText(ctx, "A가 B보다 훨씬 어두워 보인다", SAFE_CX, BOARD_Y0 + ROWS * CELL + 70, { size: 27, color: NEON.white, glow: 12, weight: 700, alpha: capA });
  const capB = segProgress(local, 4.2, 4.8);
  if (capB > 0) neonText(ctx, "그런데... 진짜 그럴까?", SAFE_CX, BOARD_Y0 + ROWS * CELL + 116, { size: 27, color: NEON.yellow, glow: 14, weight: 700, alpha: capB });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "관찰", headline: "그림자 안(B)과 밖(A)", subtext: "뇌가 그림자를 자동으로 보정해서 본다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderProof(ctx, t) {
  const [s] = T.PROOF;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  drawBoard(ctx, 1);
  drawShadowOverlay(ctx, 1);
  labelCell(ctx, CELL_A, "A", NEON.magenta, 1);
  labelCell(ctx, CELL_B, "B", NEON.cyan, 1);

  // 두 칸을 잇는 "같은 색" 증명 막대
  const barA = segProgress(local, 0.6, 2.0, ease.outCubic);
  if (barA > 0) {
    const ax = BOARD_X0 + (CELL_A.c + 0.5) * CELL, ay = BOARD_Y0 + (CELL_A.r + 0.5) * CELL;
    const bx = BOARD_X0 + (CELL_B.c + 0.5) * CELL, by = BOARD_Y0 + (CELL_B.r + 0.5) * CELL;
    const curX = ax + (bx - ax) * barA, curY = ay + (by - ay) * barA;
    ctx.save();
    ctx.strokeStyle = GRAY;
    ctx.lineWidth = 34;
    ctx.lineCap = "round";
    ctx.shadowColor = NEON.yellow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 34;
    ctx.setLineDash([1, 1]);
    ctx.restore();
  }

  const capA = segProgress(local, 2.4, 3.0);
  if (capA > 0) neonText(ctx, "같은 회색으로 이어진다", SAFE_CX, BOARD_Y0 + ROWS * CELL + 70, { size: 28, color: NEON.yellow, glow: 16, weight: 800, alpha: capA });
  if (local > 2.4 && local < 3.0) {
    const bx = BOARD_X0 + (CELL_B.c + 0.5) * CELL, by = BOARD_Y0 + (CELL_B.r + 0.5) * CELL;
    drawBurst(ctx, bx, by, segProgress(local, 2.4, 3.0), { colors: [NEON.yellow, NEON.white], count: 18, maxDist: 100 });
  }

  const capB = segProgress(local, 3.6, 4.2);
  if (capB > 0) neonText(ctx, "뇌가 '그림자 보정'을 하느라 속인 것", SAFE_CX, BOARD_Y0 + ROWS * CELL + 116, { size: 24, color: "rgba(200,210,235,0.85)", glow: 0, weight: 500, alpha: capB });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "증명", headline: "A와 B는 완전히 동일한 회색", subtext: "가려서 비교하면 누구나 확인할 수 있다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "이걸 '색채 항등성'이라고 부른다", SAFE_CX, cy, { size: 32, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy, segProgress(local, 1.2, 1.8), { colors: [NEON.yellow, NEON.white], count: 18 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "출처", headline: "Edward H. Adelson, MIT (1995)", subtext: "시각과학 교수가 만든 대표 착시 사례", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "내 눈이 항상 진실을 보는 건 아니다", subtext: "뇌는 '정답'이 아니라 '그럴듯한 해석'을 보여준다", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.yellow, NEON.magenta, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.BOARD[0]) return renderHook(ctx, t);
  if (t < T.PROOF[0]) return renderBoard(ctx, t);
  if (t < T.FACT[0]) return renderProof(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "이 두 칸, 진짜 같은 색이라고? (체커 그림자 착시)",
  hashtags: ["#착시", "#수학", "#심리학", "#일루전", "#mathtok"],
  trendSource: "viral",
  trendNote: "Edward H. Adelson(MIT, 1995) 발표. #mathtok/#illusion 계열 평생 바이럴 소재. 색상 코드는 시연용 근사치(원본은 특정 RGB #787878 계열로 알려짐).",
};
