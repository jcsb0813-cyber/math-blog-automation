// reels/storyboards/benford_law_fraud.js
// [daily-reels 2026-09-28, 4/5] 오늘의 이슈: 벤포드의 법칙(자연 발생 숫자 데이터의 첫자리
// 분포가 균등하지 않고 1이 가장 흔하다는 법칙)은 세금·회계·선거 부정 탐지에 오래 쓰여왔고,
// 최근 2025~2026년 연구에서는 AI 생성 텍스트·이미지 탐지에도 확장 적용되고 있다
// (예: LLMChaos 모델, Hotel/Amazon 데이터셋에서 F1 93~95% — arXiv/ScienceDirect 자료 기준).
// 단, "생성 데이터가 벤포드 테스트를 통과할 수도 있다"는 한계도 검색으로 확인된 사실이라
// 과신하지 않도록 영상에 명시한다.
// 새 기법: 1~9 전체 자릿수 분포를 히스토그램으로 순차 공개하는
// "digit-histogram-reveal".
// 9:16, 1080x1920, 소리 없음. 5개 중 하나이므로 클리프행어 강제 연결 없음(단독 완결).

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  HIST: [2.2, 9.6],
  APPLY: [9.6, 15.6],
  FACT: [15.6, 18.8],
  CLOSE: [18.8, 20.8],
  OUTRO: [20.8, 23.0],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 데이터 포렌식",
  title: "숫자 첫자리로 가짜를 잡아낸다",
  subtitle: "벤포드의 법칙",
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
  if (p1 > 0) neonText(ctx, "자연 속 숫자들의 첫자리는", SAFE_CX, cy - 30, { size: 34, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "골고루 나오지 않는다", SAFE_CX, cy + 50, { size: 38, color: NEON.cyan, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "1로 시작하는 숫자가 압도적으로 많다", subtext: "인구, 매출, 강 길이... 거의 모든 데이터에서", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 벤포드 분포 (실제 log10(1+1/d) 값) ----------
const BENFORD = [30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6];

function renderHist(ctx, t) {
  const [s, e] = T.HIST;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const chartTop = 520, chartBottom = 1240, chartH = chartBottom - chartTop;
  const barGap = 14;
  const chartW = SAFE_X1 - SAFE_X0 - 40;
  const barW = (chartW - barGap * (BENFORD.length - 1)) / BENFORD.length;
  const maxVal = 32;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SAFE_X0 + 20, chartBottom);
  ctx.lineTo(SAFE_X1 - 20, chartBottom);
  ctx.stroke();
  ctx.restore();

  BENFORD.forEach((val, i) => {
    const a = segProgress(local, 0.4 + i * 0.4, 0.4 + i * 0.4 + 0.45, ease.outCubic);
    if (a <= 0) return;
    const x = SAFE_X0 + 20 + i * (barW + barGap);
    const h = (val / maxVal) * chartH * a;
    ctx.save();
    ctx.fillStyle = i === 0 ? NEON.yellow : NEON.cyan;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;
    ctx.fillRect(x, chartBottom - h, barW, h);
    ctx.restore();
    neonText(ctx, String(i + 1), x + barW / 2, chartBottom + 28, { size: 22, color: "rgba(210,220,240,0.8)", glow: 0, weight: 700, alpha: a });
    neonText(ctx, `${val}%`, x + barW / 2, chartBottom - h - 22, { size: 18, color: i === 0 ? NEON.yellow : NEON.white, glow: 8, weight: 700, alpha: a });
  });

  const capA = segProgress(local, e - s - 1.4, e - s - 0.9);
  if (capA > 0) neonText(ctx, "1은 30%, 9는 5% — 절대 우연이 아니다", SAFE_CX, chartTop - 60, { size: 25, color: NEON.white, glow: 12, weight: 700, alpha: capA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "분포", headline: "첫자리 숫자의 실제 빈도", subtext: "log(1+1/d) 공식으로 정확히 예측된다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderApply(ctx, t) {
  const [s] = T.APPLY;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.34;
  const p1 = segProgress(local, 0.2, 0.7);
  if (p1 > 0) neonText(ctx, "그래서 세금·회계·선거 조작을\n이 분포 이탈로 잡아낸다", SAFE_CX, cy, { size: 30, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy, segProgress(local, 1.2, 1.8), { colors: [NEON.cyan, NEON.white], count: 18 });

  const p2 = segProgress(local, 2.4, 2.9);
  if (p2 > 0) neonText(ctx, "요즘은 AI가 만든 가짜 데이터·글도", SAFE_CX, cy + 200, { size: 27, color: NEON.magenta, glow: 12, weight: 700, alpha: p2 });
  const p3 = segProgress(local, 3.0, 3.5);
  if (p3 > 0) neonText(ctx, "같은 원리로 탐지하는 연구가 나온다", SAFE_CX, cy + 244, { size: 27, color: NEON.magenta, glow: 12, weight: 700, alpha: p3 });

  const cardA = segProgress(local, 4.2, 4.7);
  drawStepCard(ctx, { stepLabel: "한계", headline: "만능 탐지기는 아니다", subtext: "정교하게 만든 가짜 데이터는 이 테스트도 통과할 수 있다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "AI 생성 텍스트 탐지 모델은\nF1 93~95% 정확도를 기록했다", SAFE_CX, cy, { size: 28, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  const cardA = segProgress(local, 1.4, 1.9);
  drawStepCard(ctx, { stepLabel: "출처", headline: "2025~2026년 포렌식 연구 다수 (arXiv 등)", subtext: "벤포드의 법칙은 1938년 물리학자 프랭크 벤포드가 정리", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "무작위처럼 보여도 자연엔 규칙이 있다", subtext: "그 규칙을 아는 쪽이 거짓을 더 잘 알아본다", alpha: cardA });
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
  if (t < T.HIST[0]) return renderHook(ctx, t);
  if (t < T.APPLY[0]) return renderHist(ctx, t);
  if (t < T.FACT[0]) return renderApply(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "숫자 첫자리로 가짜를 잡아낸다 (벤포드의 법칙)",
  hashtags: ["#수학", "#데이터", "#포렌식", "#이슈", "#AI"],
  trendSource: "issue",
  trendNote: "벤포드의 법칙(1938)은 고전 통계 결과. 세금/회계/선거 부정 탐지 활용은 확립된 사실. AI 생성물 탐지 확장은 2025~2026년 연구(arXiv, ScienceDirect 등) 기준이며, 한계(우회 가능성)도 함께 언급.",
};
