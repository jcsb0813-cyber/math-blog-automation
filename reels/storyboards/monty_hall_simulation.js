// reels/storyboards/monty_hall_simulation.js
// [daily-reels 2026-09-28, 3/5] 오늘의 조회수 트렌드: #mathtok에서 꾸준히 재순환되는
// 고전 확률 역설, 몬티홀 문제. 문을 바꾸면 승률이 1/3→2/3으로 오른다는 것은 확률론의
// 검증된 결과(위키피디아·다수 교재 기준)이며, 최근에도 TikTok에서 카드/문 소품으로
// 재현하는 영상이 꾸준히 화제. 시뮬레이션 수렴 애니메이션은 실제 몬테카를로 결과를
// 흉내 낸 것으로, 최종적으로 수학적으로 옳은 값(1/3, 2/3)에 수렴하도록 설계.
// 새 기법: 두 전략의 승률이 시행이 쌓일수록 수렴하는 모습을 보여주는
// "monte-carlo-frame-fill-race".
// 9:16, 1080x1920, 소리 없음. 5개 중 하나이므로 클리프행어 강제 연결 없음(단독 완결).

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01, makeRng,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.4],
  DOORS: [2.4, 9.0],
  SIM: [9.0, 15.6],
  FACT: [15.6, 18.4],
  CLOSE: [18.4, 20.4],
  OUTRO: [20.4, 22.6],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 확률론",
  title: "문을 바꿔야 하는 이유",
  subtitle: "다시 화제인 몬티홀 문제",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 55);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  drawSparkle(ctx, WIDTH - 86, 630, 17, { color: NEON.yellow, alpha: pulse });
  drawSparkle(ctx, 76, HEIGHT - 640, 12, { color: NEON.white, alpha: pulse * 0.7 });
}

function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.4) });

  const cy = SAFE_Y1 * 0.36;
  const p1 = segProgress(local, 0.4, 0.9);
  if (p1 > 0) neonText(ctx, "문 3개, 1개엔 자동차 2개엔 염소", SAFE_CX, cy - 30, { size: 30, color: NEON.white, glow: 14, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "사회자가 염소 문을 하나 열어줬다", SAFE_CX, cy + 50, { size: 30, color: NEON.white, glow: 14, weight: 800, alpha: p2 });
  const p3 = segProgress(local, 1.6, 2.1);
  if (p3 > 0) neonText(ctx, "바꿔야 할까, 그대로 있어야 할까?", SAFE_CX, cy + 130, { size: 34, color: NEON.yellow, glow: 18, weight: 800, alpha: p3 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "몬티홀 문제", subtext: "요즘 #mathtok에서 다시 도는 확률 역설", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 문 3개 연출 ----------
const DOOR_Y = 640, DOOR_W = 180, DOOR_H = 260, DOOR_GAP = 60;
const DOOR_TOTAL_W = DOOR_W * 3 + DOOR_GAP * 2;
const DOOR_X0 = SAFE_CX - DOOR_TOTAL_W / 2;
function doorX(i) { return DOOR_X0 + i * (DOOR_W + DOOR_GAP); }

function drawDoor(ctx, i, opened, highlighted, alpha) {
  const x = doorX(i);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = opened ? "rgba(255,255,255,0.06)" : "rgba(10,16,32,0.85)";
  ctx.strokeStyle = highlighted ? NEON.yellow : "rgba(120,170,255,0.3)";
  ctx.lineWidth = highlighted ? 5 : 2.5;
  if (highlighted) { ctx.shadowColor = NEON.yellow; ctx.shadowBlur = 18; }
  ctx.beginPath();
  ctx.roundRect(x, DOOR_Y, DOOR_W, DOOR_H, 14);
  ctx.fill();
  ctx.stroke();
  if (opened) {
    neonText(ctx, "염소", x + DOOR_W / 2, DOOR_Y + DOOR_H / 2, { size: 40, color: NEON.white, glow: 8, weight: 700 });
  } else {
    neonText(ctx, String(i + 1), x + DOOR_W / 2, DOOR_Y + DOOR_H / 2, { size: 60, color: "rgba(210,220,240,0.5)", glow: 0, weight: 800 });
  }
  ctx.restore();
}

function renderDoors(ctx, t) {
  const [s] = T.DOORS;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const doorsA = segProgress(local, 0.1, 0.6, ease.outBack);
  const openAPre = segProgress(local, 2.4, 2.9);
  for (let i = 0; i < 3; i++) {
    if (i === 2 && openAPre > 0) continue;
    drawDoor(ctx, i, false, false, doorsA);
  }

  const pickA = segProgress(local, 1.0, 1.5);
  if (pickA > 0) neonText(ctx, "1번 문을 골랐다", SAFE_CX, DOOR_Y - 70, { size: 26, color: NEON.cyan, glow: 12, weight: 700, alpha: pickA });
  if (pickA > 0.2) {
    ctx.save();
    ctx.globalAlpha = pickA;
    ctx.strokeStyle = NEON.cyan;
    ctx.shadowColor = NEON.cyan;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 4;
    ctx.strokeRect(doorX(0) - 8, DOOR_Y - 8, DOOR_W + 16, DOOR_H + 16);
    ctx.restore();
  }

  const openA = segProgress(local, 2.4, 2.9);
  if (openA > 0) drawDoor(ctx, 2, true, false, 1);
  const openCap = segProgress(local, 3.0, 3.5);
  if (openCap > 0) neonText(ctx, "사회자가 3번(염소) 문을 열었다", SAFE_CX, DOOR_Y + DOOR_H + 60, { size: 25, color: NEON.white, glow: 10, weight: 700, alpha: openCap });

  const choiceA = segProgress(local, 4.2, 4.8);
  if (choiceA > 0) {
    neonText(ctx, "유지할까?", doorX(0) + DOOR_W / 2, DOOR_Y + DOOR_H + 130, { size: 26, color: NEON.cyan, glow: 12, weight: 700, alpha: choiceA });
    neonText(ctx, "바꿀까?", doorX(1) + DOOR_W / 2, DOOR_Y + DOOR_H + 130, { size: 26, color: NEON.magenta, glow: 12, weight: 700, alpha: choiceA });
  }

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "규칙", headline: "사회자는 항상 염소 문을 연다", subtext: "정답 문은 절대 열지 않는다 — 이게 핵심 정보다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 몬테카를로 수렴 시뮬레이션(연출) ----------
function renderSim(ctx, t) {
  const [s, e] = T.SIM;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "10,000번 시뮬레이션하면?", SAFE_CX, 540, { size: 30, color: NEON.white, glow: 14, weight: 700, alpha: capA });

  const runP = segProgress(local, 1.0, dur - 2.2, ease.outCubic);
  const trials = Math.floor(runP * 10000);
  const rngLocal = makeRng(99);
  // 수렴값: 유지=1/3, 바꾸기=2/3 — 초반엔 흔들리다가 시행이 쌓이며 안정되는 느낌을 noise로 연출
  const noise = (1 - runP) * 0.15 * Math.sin(local * 9 + rngLocal());
  const stayRate = clamp01(1 / 3 + noise);
  const switchRate = clamp01(2 / 3 - noise);

  const barY0 = 660, barH = 90, barGap = 70, barW = 560;
  const barX = SAFE_CX - barW / 2;

  [
    { label: "유지", rate: stayRate, color: NEON.cyan, y: barY0 },
    { label: "바꾸기", rate: switchRate, color: NEON.magenta, y: barY0 + barH + barGap },
  ].forEach((row) => {
    neonText(ctx, row.label, barX, row.y - 26, { size: 24, color: "rgba(210,220,240,0.85)", align: "left", glow: 0, weight: 600 });
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, row.y, barW, barH);
    ctx.fillStyle = row.color;
    ctx.shadowColor = row.color;
    ctx.shadowBlur = 16;
    ctx.fillRect(barX, row.y, barW * row.rate, barH);
    ctx.restore();
    neonText(ctx, `${(row.rate * 100).toFixed(1)}%`, barX + barW + 20, row.y + barH / 2, { size: 28, color: row.color, align: "left", glow: 12, weight: 800 });
  });

  const trialA = segProgress(local, 1.0, 1.6);
  if (trialA > 0) neonText(ctx, `${trials.toLocaleString()}판 진행`, SAFE_CX, barY0 + 2 * barH + barGap + 70, { size: 24, color: "rgba(200,210,235,0.75)", glow: 0, weight: 500, alpha: trialA });

  if (local > dur - 1.6 && local < dur - 0.9) {
    drawBurst(ctx, barX + barW * (2 / 3), barY0 + barH + barGap + barH / 2, segProgress(local, dur - 1.6, dur - 1.0), { colors: [NEON.magenta, NEON.white], count: 20, maxDist: 150 });
  }
  const doneA = segProgress(local, dur - 1.2, dur - 0.6);
  if (doneA > 0) neonText(ctx, "바꾸면 승률이 정확히 2배", SAFE_CX, barY0 + 2 * barH + barGap + 120, { size: 27, color: NEON.yellow, glow: 14, weight: 700, alpha: doneA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "시뮬레이션", headline: "1/3 vs 2/3", subtext: "시행이 쌓일수록 이 값에 수렴한다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "사회자의 선택 자체가\n'정보'이기 때문이다", SAFE_CX, cy, { size: 32, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy, segProgress(local, 1.2, 1.8), { colors: [NEON.yellow, NEON.white], count: 18 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "핵심", headline: "함정이 아니라 진짜 수학이다", subtext: "확률론 교재에 실린 검증된 결과", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "직관과 수학이 싸우면, 수학이 이긴다", subtext: "그래도 처음엔 다들 안 믿는다", alpha: cardA });
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
  if (t < T.DOORS[0]) return renderHook(ctx, t);
  if (t < T.SIM[0]) return renderDoors(ctx, t);
  if (t < T.FACT[0]) return renderSim(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "문을 바꿔야 하는 이유 (몬티홀 문제)",
  hashtags: ["#수학", "#확률", "#몬티홀", "#이슈", "#mathtok"],
  trendSource: "viral",
  trendNote: "#mathtok에서 꾸준히 재순환되는 고전 확률 역설. 문을 바꾸면 승률 1/3→2/3은 검증된 확률론 결과.",
};
