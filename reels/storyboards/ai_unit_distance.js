// reels/storyboards/ai_unit_distance.js
// [daily-reels 2026-09-27] 오늘의 화제 이슈: 2026년 5월 OpenAI의 추론 모델이 에르되시의
// "단위거리 문제(unit distance problem)"를 풀어냈다(80년 가까이 미해결이던 조합기하 난제).
// 출처: Quanta Magazine "Why the Legendary Erdős Problems Are Falling to AI"(2026.8.3),
// Scientific American "AI just solved an 80-year-old 'Erdős problem'".
// 새 기법: 삼각격자 위 "정확히 거리 1"인 쌍을 세면서 잇는 카운팅 그래프 리빌
// (기존 prime_spiral의 "칸 채우기"와는 다른, "간선 세기" 방식).
// 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust, glowPolylineReveal,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.0],
  BUILD: [2.0, 9.0],
  HISTORY: [9.0, 15.5],
  FACT: [15.5, 19.0],
  CLIFF: [19.0, 21.2],
  OUTRO: [21.2, 23.4],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "수학 이슈 · AI",
  title: "AI가 80년 난제를 풀었다",
  subtitle: "에르되시의 '단위거리 문제', 2026년 무너지다",
};

// ---------- 삼각격자 점 + "정확히 거리 1"인 간선 ----------
const UNIT = 78;
const ROWS = [
  { y: 0, xs: [0, 1, 2, 3] },
  { y: Math.sqrt(3) / 2, xs: [0.5, 1.5, 2.5] },
  { y: Math.sqrt(3), xs: [0, 1, 2, 3] },
];
const PTS_U = ROWS.flatMap((r) => r.xs.map((x) => ({ x, y: r.y })));
const cxU = PTS_U.reduce((s, p) => s + p.x, 0) / PTS_U.length;
const cyU = PTS_U.reduce((s, p) => s + p.y, 0) / PTS_U.length;
const GRAPH_CY = SAFE_Y1 * 0.4;
function toPx(u) {
  return { x: SAFE_CX + (u.x - cxU) * UNIT, y: GRAPH_CY + (u.y - cyU) * UNIT };
}
const PTS = PTS_U.map(toPx);
const EDGES = [];
for (let i = 0; i < PTS_U.length; i++) {
  for (let j = i + 1; j < PTS_U.length; j++) {
    const d = Math.hypot(PTS_U[i].x - PTS_U[j].x, PTS_U[i].y - PTS_U[j].y);
    if (Math.abs(d - 1) < 0.01) EDGES.push([i, j]);
  }
}

function decorate(ctx, t) {
  drawDust(ctx, t, 60);
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

function drawDot(ctx, p, glow = 8) {
  ctx.save();
  ctx.fillStyle = NEON.white;
  ctx.shadowColor = NEON.white;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.4) });

  const p1 = segProgress(local, 0.4, 0.9);
  if (p1 > 0) neonText(ctx, "점들을 이었을 때 거리가 딱 1인 쌍,", SAFE_CX, GRAPH_CY, { size: 34, color: NEON.white, glow: 16, weight: 700, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "최대 몇 쌍까지 가능할까?", SAFE_CX, GRAPH_CY + 70, { size: 34, color: NEON.cyan, glow: 18, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "80년 동안 아무도 못 풀었다", subtext: "그런데 AI가 2026년에 풀어버렸다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderBuild(ctx, t) {
  const [s, e] = T.BUILD;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const ptProgress = segProgress(local, 0.0, 1.4, ease.outCubic);
  const nPts = Math.max(1, Math.floor(ptProgress * PTS.length));
  for (let i = 0; i < nPts; i++) drawDot(ctx, PTS[i]);

  const edgeProgress = clamp01((local - 1.4) / (dur - 2.4));
  const nEdges = Math.floor(ease.inCubic(edgeProgress) * EDGES.length);
  for (let k = 0; k < nEdges; k++) {
    const [i, j] = EDGES[k];
    const since = edgeProgress - k / EDGES.length;
    const reveal = since >= 0 && since < 0.1 ? since / 0.1 : 1;
    glowPolylineReveal(ctx, [PTS[i], PTS[j]], reveal, NEON.cyan, 3.5, 14);
    if (since >= 0 && since < 0.06) {
      const mid = { x: (PTS[i].x + PTS[j].x) / 2, y: (PTS[i].y + PTS[j].y) / 2 };
      drawBurst(ctx, mid.x, mid.y, since / 0.06, { colors: [NEON.cyan, NEON.white], count: 6, maxDist: 24 });
    }
  }

  if (local > 1.6) {
    neonText(ctx, `거리 1인 쌍: ${nEdges}개`, SAFE_CX, GRAPH_CY - UNIT * 1.5, { size: 32, color: NEON.yellow, glow: 16, weight: 800 });
  }

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, {
    stepLabel: "문제",
    headline: "점 N개 중 '거리 1'인 쌍은 최대 몇 개?",
    subtext: "간단해 보이지만 정확한 최댓값은 아무도 몰랐다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

const HISTORY_EVENTS = [
  { when: "1946", text: "에르되시가 이 질문을 처음 던졌다", color: NEON.white },
  { when: "이후 80년", text: "수학자들이 상한을 조금씩만 좁혀왔다", color: NEON.cyan },
  { when: "2026.5", text: "OpenAI의 추론 모델이 증명을 완성했다", color: NEON.magenta },
  { when: "검증 완료", text: "정상급 수학자들이 확인하고 인정했다", color: NEON.green },
];
function renderHistory(ctx, t) {
  const [s, e] = T.HISTORY;
  const local = t - s;
  const dur = e - s;
  const slot = dur / HISTORY_EVENTS.length;
  drawBackground(ctx, t, { flash: local % slot < 0.05 ? 0.3 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const spineTop = 420, spineBottom = SAFE_Y1 - 340;
  const idx = Math.min(HISTORY_EVENTS.length - 1, Math.floor(local / slot));
  const spineProgress = clamp01((idx + clamp01((local - idx * slot) / slot)) / HISTORY_EVENTS.length);
  glowPolylineReveal(ctx, [{ x: SAFE_CX, y: spineTop }, { x: SAFE_CX, y: spineBottom }], spineProgress, "rgba(255,255,255,0.4)", 3, 10);

  for (let i = 0; i <= idx; i++) {
    const item = HISTORY_EVENTS[i];
    const y = spineTop + ((spineBottom - spineTop) * i) / (HISTORY_EVENTS.length - 1);
    const within = i === idx ? clamp01((local - idx * slot) / (slot * 0.4)) : 1;
    const pop = ease.outBack(within);
    ctx.save();
    ctx.globalAlpha = pop;
    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(SAFE_CX, y, 9 * pop, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    neonText(ctx, item.when, SAFE_CX + 26, y, { size: 26, color: item.color, glow: 12, weight: 800, alpha: pop, align: "left" });
    neonText(ctx, item.text, SAFE_CX - 26, y, { size: 24, color: NEON.white, glow: 8, weight: 600, alpha: pop, align: "right" });
    if (i === idx && within > 0.3 && within < 0.9) drawBurst(ctx, SAFE_CX, y, (within - 0.3) / 0.6, { colors: [item.color, NEON.white], count: 14, maxDist: 100 });
  }

  const cardA = segProgress(local, dur - 1.2, dur - 0.7);
  drawStepCard(ctx, { stepLabel: "타임라인", headline: "80년 걸린 일이 AI에게는 순식간이었다", subtext: "수학계에서도 뜨거운 논쟁이 벌어지고 있다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "혼자 해낸 게 아니다", SAFE_CX, cy - 40, { size: 38, color: NEON.white, glow: 16, weight: 700, alpha: p1 });
  if (p2 > 0) neonText(ctx, "대부분 대학원생·아마추어가\n공개 AI로 이뤄낸 성과", SAFE_CX, cy + 50, { size: 30, color: NEON.cyan, glow: 14, weight: 600, alpha: p2 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy + 50, segProgress(local, 1.2, 1.8), { colors: [NEON.cyan, NEON.white], count: 22 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "포인트", headline: "거대 연구소만의 일이 아니다", subtext: "일반 연구자도 AI로 난제에 도전하는 시대", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderCliff(ctx, t) {
  const [s] = T.CLIFF;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "다음 편", headline: "그럼 AI가 수학자를 대체할까?", subtext: "수학계의 진짜 반응, 다음 영상에서", alpha: cardA });
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
  if (t < T.BUILD[0]) return renderHook(ctx, t);
  if (t < T.HISTORY[0]) return renderBuild(ctx, t);
  if (t < T.FACT[0]) return renderHistory(ctx, t);
  if (t < T.CLIFF[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "AI가 80년 수학 난제를 풀었다 (에르되시 단위거리 문제)",
  hashtags: ["#두뇌", "#수학", "#AI", "#이슈", "#정수론"],
  trendSource: "issue",
  trendNote: "Quanta Magazine / Scientific American 2026년 8월 보도 — OpenAI 추론 모델의 Erdős 단위거리 문제 증명",
};
