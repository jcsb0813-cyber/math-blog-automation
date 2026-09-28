// reels/storyboards/wordle_entropy.js
// [daily-reels 2026-09-28, 2/5] 오늘의 이슈: 빙엄턴대 연구팀(Aladaileh, Stephens, Alqaisi,
// Wu)이 섀넌 엔트로피(정보이론)를 이용한 워들 풀이 전략을 발표 — 시뮬레이션에서 99% 성공
// (기존 방식은 약 90%). 매 시행 고정 첫 단어는 "TARES"("Solving Wordle Using Information
// Theory", 2026.4.6 발표, 원래 수업 과제였다가 논문으로 발전).
// 실제 논문의 게임별 세부 확률/엔트로피 수치는 인용하지 않고, 검증된 두 수치(90%→99%)와
// 고정 첫 단어("TARES")만 사실로 사용한다. 워들 타일 예시 색상 연출은 개념 설명용 시연이며
// 실제 연구 데이터가 아님을 인지.
// 새 기법: 성공률을 원형 게이지로 보여주는 "radial-gauge-reveal".
// 9:16, 1080x1920, 소리 없음. 5개 중 하나이므로 클리프행어 강제 연결 없음(단독 완결).

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  GRID: [2.2, 9.0],
  GAUGE: [9.0, 14.8],
  FACT: [14.8, 18.2],
  CLOSE: [18.2, 20.2],
  OUTRO: [20.2, 22.4],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 정보이론",
  title: "워들을 수학으로 풀면 99% 이긴다",
  subtitle: "빙엄턴대 연구팀 발표(2026)",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 55);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 88, 640, 17, { color: NEON.green, alpha: pulse });
  drawSparkle(ctx, 76, HEIGHT - 640, 12, { color: NEON.white, alpha: pulse * 0.7 });
}

function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.4) });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.4, 0.9);
  if (p1 > 0) neonText(ctx, "오늘의 워들, 최적의 첫 단어는", SAFE_CX, cy - 30, { size: 36, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "이미 수학적으로 정해져 있다", SAFE_CX, cy + 50, { size: 38, color: NEON.green, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "섀넌 엔트로피로 워들을 풀면?", subtext: "빙엄턴대 연구팀의 수업 과제였다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 워들 그리드 시연 (개념 설명용 예시, 실제 연구 데이터 아님) ----------
const WORD = "TARES";
const TILE_SIZE = 78, TILE_GAP = 12;
const GRID_W = WORD.length * TILE_SIZE + (WORD.length - 1) * TILE_GAP;
const GRID_X0 = SAFE_CX - GRID_W / 2;
const GRID_Y = 560;
const EXAMPLE_STATUS = ["yellow", "gray", "green", "gray", "yellow"]; // 시연용 예시일 뿐

function tileColor(status) {
  if (status === "green") return "#2fae5a";
  if (status === "yellow") return "#b59b2e";
  return "rgba(255,255,255,0.08)";
}

function renderGrid(ctx, t) {
  const [s] = T.GRID;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "정보이론이 계산한 고정 첫 단어", SAFE_CX, GRID_Y - 90, { size: 28, color: NEON.white, glow: 12, weight: 700, alpha: capA });

  for (let i = 0; i < WORD.length; i++) {
    const a = segProgress(local, 0.8 + i * 0.35, 0.8 + i * 0.35 + 0.3, ease.outBack);
    if (a <= 0) continue;
    const x = GRID_X0 + i * (TILE_SIZE + TILE_GAP);
    const colorA = segProgress(local, 2.6 + i * 0.25, 2.6 + i * 0.25 + 0.3);
    const bg = colorA > 0 ? tileColor(EXAMPLE_STATUS[i]) : "rgba(255,255,255,0.06)";
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, GRID_Y);
    ctx.scale(clamp01(a), clamp01(a));
    ctx.fillStyle = bg;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 8);
    ctx.fill();
    ctx.stroke();
    ctx.font = `800 40px "Pretendard", "Noto Sans KR", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4faff";
    ctx.fillText(WORD[i], 0, 4);
    ctx.restore();
  }

  const noteA = segProgress(local, 4.2, 4.8);
  if (noteA > 0) neonText(ctx, "(예시 — 실제 정답은 매일 다르다)", SAFE_CX, GRID_Y + 90, { size: 20, color: "rgba(200,210,235,0.7)", glow: 0, weight: 500, alpha: noteA });

  const p2 = segProgress(local, 5.2, 5.8);
  if (p2 > 0) neonText(ctx, "'정답일 확률'이 아니라", SAFE_CX, GRID_Y + 180, { size: 27, color: NEON.cyan, glow: 12, weight: 700, alpha: p2 });
  const p3 = segProgress(local, 6.0, 6.6);
  if (p3 > 0) neonText(ctx, "'정보를 얼마나 주는가'로 고른다", SAFE_CX, GRID_Y + 224, { size: 27, color: NEON.cyan, glow: 12, weight: 700, alpha: p3 });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "전략", headline: "TARES — 섀넌 엔트로피 최적 첫 수", subtext: "정답이 아니어도 가장 많은 정보를 준다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 원형 게이지 ----------
function drawRadialGauge(ctx, cx, cy, radius, value, progress, color, label) {
  const p = clamp01(progress);
  const sweep = value * Math.PI * 2 * ease.outCubic(p);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + sweep);
  ctx.stroke();
  ctx.restore();

  neonText(ctx, `${Math.round(value * 100 * ease.outCubic(p))}%`, cx, cy - 6, { size: 44, color, glow: 16, weight: 800, alpha: p });
  neonText(ctx, label, cx, cy + 54, { size: 22, color: "rgba(210,220,240,0.85)", glow: 0, weight: 600, alpha: p });
}

function renderGauge(ctx, t) {
  const [s] = T.GAUGE;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "10만 판 시뮬레이션 결과", SAFE_CX, 540, { size: 30, color: NEON.white, glow: 14, weight: 700, alpha: capA });

  const gaugeY = 780, gaugeR = 130;
  const leftCx = SAFE_X0 + (SAFE_X1 - SAFE_X0) * 0.27;
  const rightCx = SAFE_X0 + (SAFE_X1 - SAFE_X0) * 0.73;
  const g1 = segProgress(local, 1.0, 2.4);
  const g2 = segProgress(local, 1.6, 3.0);
  drawRadialGauge(ctx, leftCx, gaugeY, gaugeR, 0.90, g1, NEON.cyan, "기존 방식");
  drawRadialGauge(ctx, rightCx, gaugeY, gaugeR, 0.99, g2, NEON.green, "엔트로피 방식");

  if (local > 3.0 && local < 3.7) {
    drawBurst(ctx, rightCx, gaugeY, segProgress(local, 3.0, 3.6), { colors: [NEON.green, NEON.white], count: 20, maxDist: 160 });
  }

  const capB = segProgress(local, 3.9, 4.5);
  if (capB > 0) neonText(ctx, "9%p 차이 — 정보이론이 이긴다", SAFE_CX, gaugeY + gaugeR + 90, { size: 26, color: NEON.yellow, glow: 14, weight: 700, alpha: capB });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "결과", headline: "90% → 99%", subtext: "같은 게임, 다른 전략의 차이", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "원래는 수업 과제였는데\n그대로 논문이 됐다", SAFE_CX, cy, { size: 32, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy, segProgress(local, 1.2, 1.8), { colors: [NEON.green, NEON.white], count: 18 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "출처", headline: "\"Solving Wordle Using Information Theory\" (2026.4)", subtext: "빙엄턴대(Binghamton University) 연구팀", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "정답에 가까운 것보다, 정보를 많이 주는 게 나을 때가 있다", subtext: "게임 밖에서도 통하는 전략이다", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.green, NEON.cyan, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.GRID[0]) return renderHook(ctx, t);
  if (t < T.GAUGE[0]) return renderGrid(ctx, t);
  if (t < T.FACT[0]) return renderGauge(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "워들을 수학으로 풀면 99% 이긴다 (섀넌 엔트로피 전략)",
  hashtags: ["#수학", "#정보이론", "#워들", "#이슈", "#게임"],
  trendSource: "issue",
  trendNote: "빙엄턴대 연구팀, \"Solving Wordle Using Information Theory\"(2026.4.6). 시뮬레이션 성공률 90%→99%, 고정 첫 단어 TARES는 논문에서 확인된 사실. 워들 타일 색상 연출은 개념 설명용 예시.",
};
