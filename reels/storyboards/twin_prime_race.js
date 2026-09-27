// reels/storyboards/twin_prime_race.js
// [daily-reels 2026-09-27] 오늘의 화제 이슈: 쌍둥이 소수 추측(twin prime conjecture)의
// "간격 상한" 기록이 2013년 장이탕 이후 계속 좁혀지다가, 2026년 8월 말 사람(Stadlmann)이
// 새 기록을 세우자 며칠 만에 AI가 다시 경신했다. 출처: Science News
// "A human set a new mathematical record. Then AI came for it"(2026.9).
// prime_spiral.js에서 "미해결"로 언급했던 쌍둥이 소수 추측의 후속 이야기.
// 새 기법: 로그 스케일로 줄어드는 막대(정확한 역사적 수치) + 사람 vs AI 레이스 카드.
// 2026년 8-9월의 정확한 수치는 아직 논문 검증 중이라 임의로 지어내지 않고 정성적으로만
// 표현했다(과장 없이). 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.0],
  BAR: [2.0, 8.4],
  RACE: [8.4, 15.0],
  FACT: [15.0, 18.0],
  CLIFF: [18.0, 20.2],
  OUTRO: [20.2, 22.4],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 정수론",
  title: "사람이 세운 기록, AI가 3일 만에 깼다",
  subtitle: "쌍둥이 소수 추측, 2026년 8월의 레이스",
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
  if (p1 > 0) neonText(ctx, "(3,5) (11,13) (17,19) ...", SAFE_CX, cy, { size: 42, color: NEON.white, glow: 18, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "이런 쌍이 무한히 있을까?", SAFE_CX, cy + 70, { size: 34, color: NEON.cyan, glow: 16, weight: 700, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "아직 아무도 모른다", subtext: "그런데 최근 그 경계가 급격히 좁혀졌다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 로그 스케일 막대: 실제 역사적 수치 ----------
const BAR_STEPS = [
  { label: "2013 · 장이탕", value: 70000000, display: "70,000,000", color: NEON.white },
  { label: "폴리매스 프로젝트", value: 246, display: "246", color: NEON.cyan },
];
const BAR_MIN = 100, BAR_MAX = 100000000;
function barFrac(v) {
  const lv = Math.log10(v), lo = Math.log10(BAR_MIN), hi = Math.log10(BAR_MAX);
  return clamp01((lv - lo) / (hi - lo));
}
const BAR_X0 = SAFE_X0 + 20, BAR_X1 = SAFE_X1 - 20, BAR_W = BAR_X1 - BAR_X0;
const BAR_Y = SAFE_Y1 * 0.36;

function renderBar(ctx, t) {
  const [s, e] = T.BAR;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  neonText(ctx, "두 소수 사이 최대 간격(상한)", SAFE_CX, BAR_Y - 90, { size: 32, color: NEON.white, glow: 12, weight: 700 });

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(BAR_X0, BAR_Y);
  ctx.lineTo(BAR_X1, BAR_Y);
  ctx.stroke();
  ctx.restore();

  const slot = (dur - 1.0) / BAR_STEPS.length;
  let curFrac = 1.0, curColor = NEON.white, curDisplay = "";
  for (let i = 0; i < BAR_STEPS.length; i++) {
    const stepStart = i * slot;
    const stepEnd = stepStart + slot;
    if (local >= stepStart) {
      const within = segProgress(local, stepStart, stepStart + slot * 0.6, ease.outCubic);
      const prevFrac = i === 0 ? 1.0 : barFrac(BAR_STEPS[i - 1].value);
      const targetFrac = barFrac(BAR_STEPS[i].value);
      curFrac = prevFrac + (targetFrac - prevFrac) * within;
      curColor = BAR_STEPS[i].color;
      curDisplay = BAR_STEPS[i].display;
      if (local < stepStart + slot * 0.65) {
        neonText(ctx, BAR_STEPS[i].label, SAFE_CX, BAR_Y + 70, { size: 28, color: curColor, glow: 12, weight: 700, alpha: segProgress(local, stepStart, stepStart + 0.3) });
      }
    }
  }
  ctx.save();
  ctx.strokeStyle = curColor;
  ctx.shadowColor = curColor;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(BAR_X0, BAR_Y);
  ctx.lineTo(BAR_X0 + BAR_W * curFrac, BAR_Y);
  ctx.stroke();
  ctx.restore();
  neonText(ctx, curDisplay, SAFE_CX, BAR_Y - 30, { size: 44, color: curColor, glow: 20, weight: 900 });

  const cardA = segProgress(local, dur - 1.3, dur - 0.8);
  drawStepCard(ctx, { stepLabel: "역사", headline: "간격이 7천만에서 246까지 좁혀졌다", subtext: "여기서 246은 실제로 증명된 값이다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 사람 vs AI 레이스 카드 (정성적, 수치 임의 생성 없음) ----------
const RACE_EVENTS = [
  { who: "사람", when: "2026.8.28", text: "대학원생 Stadlmann이\n새 기록을 세웠다", color: NEON.cyan },
  { who: "AI", when: "며칠 뒤", text: "AI가 그 기록을\n다시 갈아치웠다", color: NEON.magenta },
];
function renderRace(ctx, t) {
  const [s, e] = T.RACE;
  const local = t - s;
  const dur = e - s;
  const slot = dur / RACE_EVENTS.length;
  drawBackground(ctx, t, { flash: local % slot < 0.06 ? 0.35 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const idx = Math.min(RACE_EVENTS.length - 1, Math.floor(local / slot));
  const within = local - idx * slot;
  const item = RACE_EVENTS[idx];
  const pop = segProgress(within, 0.05, 0.5, ease.outBack);
  const cy = SAFE_Y1 * 0.4;

  ctx.save();
  ctx.globalAlpha = pop;
  ctx.translate(SAFE_CX, cy);
  ctx.scale(pop, pop);
  ctx.translate(-SAFE_CX, -cy);
  neonText(ctx, item.who, SAFE_CX, cy - 90, { size: 54, color: item.color, glow: 26, weight: 900 });
  neonText(ctx, item.when, SAFE_CX, cy - 20, { size: 28, color: NEON.white, glow: 10, weight: 600 });
  item.text.split("\n").forEach((line, i) => {
    neonText(ctx, line, SAFE_CX, cy + 50 + i * 40, { size: 30, color: NEON.white, glow: 12, weight: 700 });
  });
  ctx.restore();

  if (within > 0.15 && within < 0.7) drawBurst(ctx, SAFE_CX, cy - 20, segProgress(within, 0.15, 0.75), { colors: [item.color, NEON.white], count: 24, maxDist: 200 });

  drawStepCard(ctx, {
    stepLabel: idx === 0 ? "기록 경신" : "역전",
    headline: idx === 0 ? "사람이 먼저 기록을 세웠다" : "AI가 3일 만에 다시 넘어섰다",
    subtext: "정확한 수치는 아직 논문 검증이 진행 중이다",
    alpha: 1,
  });
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
  const p2 = segProgress(local, 0.8, 1.3);
  if (p1 > 0) neonText(ctx, "그래도 246은 1이 아니다", SAFE_CX, cy - 30, { size: 36, color: NEON.white, glow: 16, weight: 700, alpha: p1 });
  if (p2 > 0) neonText(ctx, "쌍둥이 소수 추측 자체는\n여전히 미해결 문제다", SAFE_CX, cy + 60, { size: 30, color: NEON.yellow, glow: 16, weight: 600, alpha: p2 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy + 60, segProgress(local, 1.2, 1.8), { colors: [NEON.yellow, NEON.white], count: 20 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "핵심", headline: "간격 2(진짜 쌍둥이 소수)까지는 못 갔다", subtext: "246 → 2, 그 마지막 구간이 진짜 난제다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderCliff(ctx, t) {
  const [s] = T.CLIFF;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "다음 편", headline: "그럼 소수는 정말 무한할까?", subtext: "2000년 전 유클리드의 증명, 다음 영상에서", alpha: cardA });
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
  if (t < T.BAR[0]) return renderHook(ctx, t);
  if (t < T.RACE[0]) return renderBar(ctx, t);
  if (t < T.FACT[0]) return renderRace(ctx, t);
  if (t < T.CLIFF[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "사람이 세운 기록, AI가 3일 만에 깼다 (쌍둥이 소수)",
  hashtags: ["#두뇌", "#수학", "#AI", "#이슈", "#소수"],
  trendSource: "issue",
  trendNote: "Science News 2026년 9월 보도 — Stadlmann(사람)의 쌍둥이 소수 기록을 AI가 곧이어 경신",
};
