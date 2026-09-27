// reels/storyboards/bonnet_twin_torus.js
// [daily-reels 2026-09-27, 배치 확장 5/5] 오늘의 이슈: TUM(뮌헨공대)·TU베를린·NC주립대
// 공동 연구팀이 "닫힌 도넛형 곡면(원환면)은 모든 점에서의 계량(metric)과 평균곡률이
// 같으면 전체 모양도 하나로 정해진다"는 150년 된 본네(Bonnet)의 통념이 항상 참은
// 아님을 처음으로 구체적 사례(compact Bonnet torus pair)로 증명
// (Publications mathématiques de l'IHÉS, 2026.4 보도, TUM/TU Berlin/ScienceDaily).
// 정확한 곡률 수치는 공개 보도자료에 없어 숫자를 지어내지 않고 "국소 측정값이
// 동일하다"는 정성적 사실만 사용한다.
// 새 기법: 도넛 윤곽을 프레임 단위로 그리며 국소 측정 마커를 순차 등장시키고,
// 같은 마커를 유지한 채 전체 윤곽을 다른 모양으로 모핑한다("ring-tickmark-morph").
// 9:16, 1080x1920, 소리 없음. 5개 중 하나이므로 클리프행어 강제 연결 없음(단독 완결).

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  RING: [2.2, 9.4],
  MORPH: [9.4, 15.4],
  FACT: [15.4, 19.0],
  CLOSE: [19.0, 21.0],
  OUTRO: [21.0, 23.2],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 기하학",
  title: "150년 된 기하학 법칙이 깨졌다",
  subtitle: "TUM·TU베를린·NC주립대 공동 연구(2026)",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 55);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.4);
  drawSparkle(ctx, WIDTH - 86, 620, 16, { color: NEON.green, alpha: pulse });
  drawSparkle(ctx, 76, HEIGHT - 660, 12, { color: NEON.white, alpha: pulse * 0.7 });
}

function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.4) });

  const cy = SAFE_Y1 * 0.38;
  const p1 = segProgress(local, 0.4, 0.9);
  if (p1 > 0) neonText(ctx, "이 도넛 모양, 표면 위 모든 점에서", SAFE_CX, cy - 30, { size: 34, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "측정값이 완전히 똑같다면?", SAFE_CX, cy + 50, { size: 40, color: NEON.green, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "그런데 전체 모양은 서로 다르다", subtext: "150년 만에 뒤집힌 통념", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 도넛(원환면) 윤곽을 그리는 헬퍼 ----------
const RING_CX = SAFE_CX, RING_CY = 780;
function torusOuterPoint(shape, angle) {
  return { x: RING_CX + Math.cos(angle) * shape.rx, y: RING_CY + Math.sin(angle) * shape.ry };
}
function torusInnerPoint(shape, angle) {
  return { x: RING_CX + Math.cos(angle) * shape.holeRx, y: RING_CY + Math.sin(angle) * shape.holeRy };
}
const SHAPE_A = { rx: 250, ry: 320, holeRx: 90, holeRy: 150 };
const SHAPE_B = { rx: 320, ry: 240, holeRx: 150, holeRy: 70 };
function lerpShape(a, b, f) {
  return { rx: a.rx + (b.rx - a.rx) * f, ry: a.ry + (b.ry - a.ry) * f, holeRx: a.holeRx + (b.holeRx - a.holeRx) * f, holeRy: a.holeRy + (b.holeRy - a.holeRy) * f };
}
function drawTorusOutline(ctx, shape, reveal, color) {
  const samples = 96;
  const drawArc = (pointFn) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 4;
    ctx.beginPath();
    const n = Math.max(1, Math.floor(samples * clamp01(reveal)));
    for (let i = 0; i <= n; i++) {
      const angle = (i / samples) * Math.PI * 2 - Math.PI / 2;
      const p = pointFn(shape, angle);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  };
  drawArc(torusOuterPoint);
  drawArc(torusInnerPoint);
}

const TICK_COUNT = 8;
function drawTicks(ctx, shape, revealCount, color) {
  for (let i = 0; i < revealCount; i++) {
    const angle = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
    const p = torusOuterPoint(shape, angle);
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function renderRing(ctx, t) {
  const [s, e] = T.RING;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const outlineP = segProgress(local, 0.2, 2.4, ease.outCubic);
  drawTorusOutline(ctx, SHAPE_A, outlineP, NEON.green);

  // 프레임 단위로 마커를 하나씩 순차 등장 (거의 프레임마다 revealCount가 늘어난다)
  const tickStart = 2.6, tickEnd = 6.6;
  const tickProgress = segProgress(local, tickStart, tickEnd);
  const revealCount = Math.floor(tickProgress * TICK_COUNT);
  drawTicks(ctx, SHAPE_A, revealCount, NEON.white);
  // 방금 등장한 마커에 짧은 펄스
  if (revealCount > 0 && revealCount <= TICK_COUNT) {
    const idx = revealCount - 1;
    const cellDone = idx / TICK_COUNT;
    const since = tickProgress - cellDone;
    if (since >= 0 && since < 0.12) {
      const angle = (idx / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
      const p = torusOuterPoint(SHAPE_A, angle);
      drawBurst(ctx, p.x, p.y, since / 0.12, { colors: [NEON.white, NEON.green], count: 8, maxDist: 40 });
    }
  }

  const labelA = segProgress(local, 3.2, 3.8);
  if (labelA > 0) neonText(ctx, "여덟 지점 모두 국소 측정값 동일", SAFE_CX, RING_CY + 370, { size: 26, color: NEON.white, glow: 12, weight: 700, alpha: labelA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "관찰", headline: "표면 위 여덟 지점을 측정해보면", subtext: "곡률·휘어짐 데이터가 전부 똑같다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderMorph(ctx, t) {
  const [s, e] = T.MORPH;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const morphP = segProgress(local, 0.6, dur - 1.8, ease.inOutQuad);
  const shape = lerpShape(SHAPE_A, SHAPE_B, morphP);
  drawTorusOutline(ctx, shape, 1, NEON.green);
  drawTicks(ctx, shape, TICK_COUNT, NEON.white);

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "그런데 전체 모양은 서서히 달라진다", SAFE_CX, RING_CY - 340, { size: 28, color: NEON.magenta, glow: 14, weight: 700, alpha: capA });

  const doneA = segProgress(local, dur - 1.4, dur - 0.8);
  if (doneA > 0) {
    neonText(ctx, "같은 측정값, 다른 전체 모양", SAFE_CX, RING_CY + 370, { size: 28, color: NEON.yellow, glow: 16, weight: 800, alpha: doneA });
    if (local > dur - 1.4 && local < dur - 0.7) drawBurst(ctx, SAFE_CX, RING_CY, segProgress(local, dur - 1.4, dur - 0.8), { colors: [NEON.yellow, NEON.green, NEON.white], count: 24, maxDist: 220 });
  }

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "반전", headline: "국소 데이터가 전체 모양을 정하지 않는다", subtext: "본네의 통념이 항상 참은 아니었다", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "닫힌 도넛형 곡면 한 쌍을\n처음으로 구체적으로 찾아낸 것", SAFE_CX, cy, { size: 30, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy, segProgress(local, 1.2, 1.8), { colors: [NEON.green, NEON.white], count: 18 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "출처", headline: "Publications mathématiques de l'IHÉS (2026)", subtext: "TUM · TU베를린 · NC주립대 공동 연구", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "우리가 '측정'하는 것과 '진짜 모양'은 다를 수 있다", subtext: "150년을 버틴 통념도 반례 하나면 깨진다", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.green, NEON.magenta, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.RING[0]) return renderHook(ctx, t);
  if (t < T.MORPH[0]) return renderRing(ctx, t);
  if (t < T.FACT[0]) return renderMorph(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "150년 된 기하학 법칙이 깨졌다 (본네의 도넛 정리)",
  hashtags: ["#수학", "#기하학", "#이슈", "#위상수학"],
  trendSource: "issue",
  trendNote: "2026년 4월 Publications mathématiques de l'IHÉS 발표, TUM/TU베를린/NC주립대 공동 연구. 정확한 곡률 수치는 비공개라 정성적 사실만 사용.",
};
