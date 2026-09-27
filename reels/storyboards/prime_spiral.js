// reels/storyboards/prime_spiral.js
// 주제: 울람의 나선(Ulam Spiral) — 1부터 숫자를 나선으로 배열하면 소수가 대각선을
// 따라 뭉치는, 지금도 완전히 설명되지 않은 패턴이 드러난다.
// 요청 반영: "다른 방향" (원뿔곡선/피보나치 계열과 무관한 새 주제) + "움직임이 더
// 화려하게, 프레임마다 쪼개서" — 격자를 셀 단위로 거의 프레임 단위로 채워나가고,
// 소수가 나올 때마다 짧게 반짝이며, 전체 격자에 은은한 줌/회전 카메라 움직임을 건다.
// 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust, glowPolylineReveal,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_X0, SAFE_X1, SAFE_Y1,
} from "../engine.js";

// ---------- 타임라인 (초) ----------
export const T = {
  HOOK: [0.0, 1.8],
  FILL: [1.8, 8.4],
  REVEAL: [8.4, 11.8],
  FACTS: [11.8, 17.8],
  CLIFF: [17.8, 20.0],
  OUTRO: [20.0, 22.2],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "수학상식 · 정수론",
  title: "소수는 사실 무작위가 아니다?",
  subtitle: "울람의 나선이 밝혀낸 소수의 비밀",
};

// ---------- 울람 나선 좌표 생성 (1부터 N까지, 중심에서 시계반대 방향 사각 나선) ----------
const N = 225;
function buildUlamCoords(count) {
  const coords = [{ x: 0, y: 0 }];
  let x = 0, y = 0, dx = 1, dy = 0, stepLen = 1, stepsInLen = 0, turns = 0;
  while (coords.length < count) {
    x += dx; y += dy;
    coords.push({ x, y });
    stepsInLen++;
    if (stepsInLen === stepLen) {
      stepsInLen = 0;
      [dx, dy] = [-dy, dx]; // 90도 반시계 회전
      turns++;
      if (turns === 2) { turns = 0; stepLen++; }
    }
  }
  return coords;
}
function isPrime(n) {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}
const COORDS = buildUlamCoords(N);
const IS_PRIME = COORDS.map((_, i) => isPrime(i + 1));

const minX = Math.min(...COORDS.map((c) => c.x));
const maxX = Math.max(...COORDS.map((c) => c.x));
const minY = Math.min(...COORDS.map((c) => c.y));
const maxY = Math.max(...COORDS.map((c) => c.y));
const GRID_W = maxX - minX + 1, GRID_H = maxY - minY + 1;

// ---------- 안전영역 안에 격자를 맞춘다 ----------
const AVAIL_W = SAFE_X1 - SAFE_X0 - 40;
const GRID_TOP = 380, GRID_BOTTOM = SAFE_Y1 - 300;
const AVAIL_H = GRID_BOTTOM - GRID_TOP;
const CELL = Math.min(AVAIL_W / GRID_W, AVAIL_H / GRID_H, 34);
const GRID_CX = SAFE_CX, GRID_CY = GRID_TOP + AVAIL_H / 2;

function unitToPx(u) {
  return {
    x: GRID_CX + (u.x - (minX + maxX) / 2) * CELL,
    y: GRID_CY + (u.y - (minY + maxY) / 2) * CELL,
  };
}
function cellPx(i) { return unitToPx(COORDS[i]); }

// 소수가 가장 많이 몰린 대각선 몇 개를 실제 데이터에서 뽑는다 (연출용 임의 선이 아님)
function topDiagonals(topK = 2) {
  const sumCount = new Map(), diffCount = new Map();
  COORDS.forEach((c, i) => {
    if (!IS_PRIME[i]) return;
    const s = c.x + c.y, d = c.x - c.y;
    sumCount.set(s, (sumCount.get(s) || 0) + 1);
    diffCount.set(d, (diffCount.get(d) || 0) + 1);
  });
  const pick = (map, kind) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, topK).map(([v]) => ({ kind, v }));
  return [...pick(sumCount, "sum"), ...pick(diffCount, "diff")];
}
const DIAGONALS = topDiagonals(2).map(({ kind, v }) => {
  let x0, x1;
  if (kind === "diff") { // x - y = v
    x0 = Math.max(minX, minY + v); x1 = Math.min(maxX, maxY + v);
    return { a: { x: x0, y: x0 - v }, b: { x: x1, y: x1 - v } };
  } else { // x + y = v
    x0 = Math.max(minX, v - maxY); x1 = Math.min(maxX, v - minY);
    return { a: { x: x0, y: v - x0 }, b: { x: x1, y: v - x1 } };
  }
});

function decorate(ctx, t) {
  drawDust(ctx, t, 60);
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

// 격자 전체에 거는 은은한 줌/흔들림 카메라 움직임
function withGridCamera(ctx, t, draw) {
  const zoom = 0.9 + 0.08 * Math.sin(t * 0.35) + Math.min(0.1, t * 0.01);
  const wobble = Math.sin(t * 0.5) * 0.012;
  ctx.save();
  ctx.translate(GRID_CX, GRID_CY);
  ctx.rotate(wobble);
  ctx.scale(zoom, zoom);
  ctx.translate(-GRID_CX, -GRID_CY);
  draw();
  ctx.restore();
}

function drawCell(ctx, i, extra = 0) {
  const p = cellPx(i);
  const prime = IS_PRIME[i];
  const r = (prime ? CELL * 0.42 : CELL * 0.28) + extra;
  ctx.save();
  ctx.fillStyle = prime ? NEON.cyan : "rgba(255,255,255,0.16)";
  if (prime) {
    ctx.shadowColor = NEON.cyan;
    ctx.shadowBlur = 10 + extra * 3;
  }
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- 세그먼트별 렌더 ----------
function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.4) });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.3, 0.8);
  if (p1 > 0) neonText(ctx, "1부터 순서대로 세어봤을 뿐인데...", SAFE_CX, cy, { size: 36, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  const cardA = segProgress(local, 1.0, 1.5);
  drawStepCard(ctx, {
    stepLabel: "HOOK",
    headline: "숫자를 나선으로 배열하면?",
    subtext: "소수만 표시해봤다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderFill(ctx, t) {
  const [s, e] = T.FILL;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const progress = clamp01(local / dur);
  const revealCount = Math.max(1, Math.floor(ease.inCubic(progress) * N) + 1);

  withGridCamera(ctx, t, () => {
    for (let i = 0; i < revealCount; i++) {
      const revealFrac = i / N;
      const since = progress - revealFrac;
      const pulse = since >= 0 && since < 0.12 ? (1 - since / 0.12) : 0;
      drawCell(ctx, i, IS_PRIME[i] ? pulse * 5 : 0);
      if (IS_PRIME[i] && since >= 0 && since < 0.05) {
        drawBurst(ctx, cellPx(i).x, cellPx(i).y, since / 0.05, { colors: [NEON.cyan, NEON.white], count: 8, maxDist: 34 });
      }
    }
  });

  const countA = 1;
  neonText(ctx, `${revealCount} / ${N}`, SAFE_CX, GRID_TOP - 16, { size: 34, color: NEON.yellow, glow: 14, weight: 800, alpha: countA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, {
    stepLabel: "채우는 중",
    headline: "시안색 점 = 소수",
    subtext: "그냥 무작위로 흩어져 있을 것 같은데...",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderReveal(ctx, t) {
  const [s, e] = T.REVEAL;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.08 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  withGridCamera(ctx, t, () => {
    for (let i = 0; i < N; i++) drawCell(ctx, i);
    const lineReveal = segProgress(local, 0.3, 1.6, ease.outCubic);
    DIAGONALS.forEach((d, idx) => {
      const p0 = unitToPx(d.a), p1 = unitToPx(d.b);
      glowPolylineReveal(ctx, [p0, p1], lineReveal, idx % 2 === 0 ? NEON.magenta : NEON.yellow, 3.5, 16);
    });
  });

  if (local > 0.3 && local < 1.0) drawBurst(ctx, GRID_CX, GRID_CY, segProgress(local, 0.3, 1.0), { colors: [NEON.magenta, NEON.yellow, NEON.cyan], count: 24, maxDist: 260 });

  const cardA = segProgress(local, 1.8, 2.3);
  drawStepCard(ctx, {
    stepLabel: "발견",
    headline: "소수가 대각선을 따라 줄지어 있다",
    subtext: "왜 그런지는 아직 완전히 밝혀지지 않았다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 소수 속사포 사실 ----------
const FACTS = [
  { label: "RSA 암호화", value: "거대한 소수 2개가 지킨다", desc: "온라인 뱅킹·비밀번호의 핵심 원리", color: NEON.green },
  { label: "매미(Cicada)", value: "13년·17년 주기로 출현", desc: "소수 주기로 천적과 마주칠 확률을 줄인다", color: NEON.cyan },
  { label: "쌍둥이 소수 추측", value: "(3,5) (11,13) (17,19)...", desc: "무한히 많을까? 아직 미해결 문제다", color: NEON.magenta },
  { label: "에라토스테네스의 체", value: "2000년 전 알고리즘", desc: "고대 그리스에서 이미 소수를 걸러냈다", color: NEON.yellow },
  { label: "메르센 소수", value: "2ⁿ − 1 꼴의 소수", desc: "가장 큰 소수 기록은 지금도 갱신 중이다", color: NEON.white },
];

function renderFacts(ctx, t) {
  const [s, e] = T.FACTS;
  const local = t - s;
  const dur = e - s;
  const slotDur = dur / FACTS.length;
  drawBackground(ctx, t, { flash: local % slotDur < 0.05 ? 0.3 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const idx = Math.min(FACTS.length - 1, Math.floor(local / slotDur));
  const within = local - idx * slotDur;
  const item = FACTS[idx];
  const pop = segProgress(within, 0.04, 0.35, ease.outBack);
  const cy = SAFE_Y1 * 0.42;

  ctx.save();
  ctx.globalAlpha = pop;
  ctx.translate(SAFE_CX, cy);
  ctx.scale(pop, pop);
  ctx.translate(-SAFE_CX, -cy);
  neonText(ctx, item.label, SAFE_CX, cy - 80, { size: 36, color: NEON.white, glow: 12, weight: 700 });
  neonText(ctx, item.value, SAFE_CX, cy + 10, { size: 40, color: item.color, glow: 22, weight: 800 });
  ctx.restore();

  if (within > 0.1 && within < 0.5) drawBurst(ctx, SAFE_CX, cy + 10, segProgress(within, 0.1, 0.55), { colors: [item.color, NEON.white], count: 16, maxDist: 160 });

  drawStepCard(ctx, {
    stepLabel: `0${idx + 1} 소수 상식`,
    headline: item.label,
    subtext: item.desc,
    alpha: 1,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderCliff(ctx, t) {
  const [s] = T.CLIFF;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, {
    stepLabel: "다음 편",
    headline: "소수는 정말 무한할까?",
    subtext: "2000년 전 유클리드의 증명, 다음 영상에서",
    alpha: cardA,
  });
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

// ---------- 메인 렌더 함수 ----------
export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.FILL[0]) return renderHook(ctx, t);
  if (t < T.REVEAL[0]) return renderFill(ctx, t);
  if (t < T.FACTS[0]) return renderReveal(ctx, t);
  if (t < T.CLIFF[0]) return renderFacts(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "숫자를 나선으로 배열했더니 소수가 줄을 섰다 (울람의 나선)",
  hashtags: ["#두뇌", "#수학", "#소수", "#정수론", "#패턴"],
};
