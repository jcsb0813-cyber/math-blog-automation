// reels/storyboards/eccentricity.js
// 주제: 이심률(Eccentricity, e) — "원뿔곡선(conic_sections)" 편의 클리프행어
// ("우주선이 그리는 궤도는 무엇일까?")에 답하는 후속편.
// 초점 기준 극좌표 방정식 r(θ) = ℓ/(1+e·cosθ) 하나로 원(e≈0)→타원→포물선(e=1)→
// 쌍곡선(e>1)까지 전부 나온다는 사실을, e를 연속으로 스윕하며 보여준다.
// 색 코딩(원=cyan/타원=green/포물선=magenta/쌍곡선=white)과 실생활 사실은 1편과 동일하게
// 유지해서 시리즈 일관성을 지킨다. 9:16, 1080x1920, 소리 없음.

import {
  NEON, WIDTH, HEIGHT, ease, segProgress, clamp01,
  drawBackground, glowPolylineReveal, neonText, drawSparkle,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo,
  SAFE_CX, SAFE_X0, SAFE_Y1,
} from "../engine.js";

// ---------- 타임라인 (초) ----------
export const T = {
  HOOK: [0.0, 2.2],
  APPROACH: [2.2, 4.6],
  SOLVE: [4.6, 20.6],
  CLIFF: [20.6, 22.6],
  OUTRO: [22.6, 24.6],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "고등 · 이차곡선",
  title: "이심률",
  subtitle: "숫자 하나가 궤도의 모양을 정한다",
};

// ---------- 초점 기준 극좌표 궤도: r(θ) = ℓ / (1 + e·cosθ) ----------
// ℓ(반통경)을 고정해두면 e가 바뀌어도 크기가 폭주하지 않고 안정적으로 보인다.
// FX는 WIDTH/2가 아니라 SAFE_CX: 업로드 시 우측 아이콘 열에 가려지지 않도록.
// R_MAX는 가장 많이 벌어지는 타원(e=0.55) 기준으로 SAFE_X0/SAFE_Y1 안에 들어오게 잡았다.
const FX = SAFE_CX, FY = SAFE_Y1 * 0.5;
const ELL = 175;
const R_MAX = 500;

function polarToPoint(theta, e) {
  const denom = 1 + e * Math.cos(theta);
  if (denom <= 0.02) return null; // 점근선 방향 — 그리지 않는다
  const r = ELL / denom;
  if (r > R_MAX) return null;
  return { x: FX + r * Math.cos(theta), y: FY + r * Math.sin(theta) };
}

function buildOrbitPoints(e, samples = 360) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const theta = -Math.PI + (2 * Math.PI * i) / samples;
    const p = polarToPoint(theta, e);
    if (p) pts.push(p);
  }
  return pts;
}

function colorFor(e) {
  if (e < 0.3) return NEON.cyan;
  if (e < 0.9) return NEON.green;
  if (e < 1.05) return NEON.magenta;
  return NEON.white;
}

// ---------- e값 체크포인트: 1편과 같은 4가지 실생활 사실 재사용 ----------
const CHECK = [
  {
    eVal: 0.12, tStart: 0.0, tEnd: 2.6, label: "e ≈ 0 → 원",
    fact: "인공위성이 지구를 도는\n가장 안정적인 궤도",
  },
  {
    eVal: 0.55, tStart: 3.6, tEnd: 6.8, label: "0 < e < 1 → 타원",
    fact: "지구가 태양을 도는 궤도\n(케플러의 행성 운동 법칙)",
  },
  {
    eVal: 1.0, tStart: 7.8, tEnd: 11.0, label: "e = 1 → 포물선",
    fact: "딱 탈출속도로 날아갈 때의 궤적\n다시는 돌아오지 않는다",
  },
  {
    eVal: 1.6, tStart: 12.0, tEnd: 15.6, label: "e > 1 → 쌍곡선",
    fact: "우주선이 행성 중력으로\n스윙바이(가속)할 때의 궤적",
  },
];

function eAt(local) {
  if (local <= CHECK[0].tStart) return CHECK[0].eVal;
  for (let i = 0; i < CHECK.length; i++) {
    const c = CHECK[i];
    if (local <= c.tEnd) {
      if (local >= c.tStart) return c.eVal;
      const prev = CHECK[i - 1];
      const f = segProgress(local, prev.tEnd, c.tStart, ease.inOutQuad);
      return prev.eVal + (c.eVal - prev.eVal) * f;
    }
  }
  return CHECK[CHECK.length - 1].eVal;
}

function activeCard(local) {
  for (const c of CHECK) {
    const fadeIn = segProgress(local, c.tStart + 0.1, c.tStart + 0.6);
    const fadeOut = 1 - segProgress(local, c.tEnd - 0.5, c.tEnd);
    const a = Math.min(fadeIn, fadeOut);
    if (a > 0.02) return { c, a };
  }
  return null;
}

// ---------- 장면 요소 ----------
function drawOrbitScene(ctx, e) {
  ctx.save();
  ctx.fillStyle = NEON.white;
  ctx.shadowColor = NEON.white;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(FX, FY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  neonText(ctx, "F", FX, FY - 36, { size: 30, color: NEON.white, glow: 10, weight: 700 });

  const pts = buildOrbitPoints(e);
  if (pts.length > 1) glowPolylineReveal(ctx, pts, 1, colorFor(e), 6, 28);
}

function drawEReadout(ctx, e) {
  neonText(ctx, `e = ${e.toFixed(2)}`, WIDTH / 2, 560, { size: 44, color: NEON.yellow, glow: 20, weight: 800 });
}

function decorate(ctx, t) {
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

// ---------- 세그먼트별 렌더 ----------
function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.5) });
  drawOrbitScene(ctx, 0.55);
  drawEReadout(ctx, 0.55);

  const cardA = segProgress(local, 1.0, 1.6);
  drawStepCard(ctx, {
    stepLabel: "HOOK",
    headline: "지난 영상, 우주선의 궤도가 궁금했다면",
    subtext: "사실은 숫자 하나(e)가 전부 결정한다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderApproach(ctx, t) {
  const [s] = T.APPROACH;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const e = Math.max(0.05, 0.3 + 0.25 * Math.sin(local * 2));
  drawOrbitScene(ctx, e);
  drawEReadout(ctx, e);

  drawStepCard(ctx, {
    stepLabel: "원리",
    headline: "초점(F)까지의 거리 비율 = e",
    subtext: "이 숫자 하나가 궤도의 모양을 정한다",
    alpha: 1,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderSolve(ctx, t) {
  const [s] = T.SOLVE;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const e = eAt(local);
  drawOrbitScene(ctx, e);
  drawEReadout(ctx, e);

  const active = activeCard(local);
  if (active) {
    drawStepCard(ctx, {
      stepLabel: active.c.label,
      headline: `e = ${active.c.eVal.toFixed(2)}`,
      subtext: active.c.fact,
      alpha: active.a,
    });
  }
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderCliff(ctx, t) {
  const [s] = T.CLIFF;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  drawOrbitScene(ctx, 1.6);
  drawEReadout(ctx, 1.6);

  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, {
    stepLabel: "다음 편",
    headline: "e는 대체 어떻게 계산할까?",
    subtext: "정답은 다음 영상에서 공개",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderOutro(ctx, t) {
  const [s] = T.OUTRO;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  const logoP = segProgress(local, 0.0, 1.0, ease.outCubic);
  drawBrandLogo(ctx, WIDTH / 2, HEIGHT / 2, logoP);
}

// ---------- 메인 렌더 함수 ----------
export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.APPROACH[0]) return renderHook(ctx, t);
  if (t < T.SOLVE[0]) return renderApproach(ctx, t);
  if (t < T.CLIFF[0]) return renderSolve(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "숫자 하나로 우주선의 궤도가 결정된다 (이심률)",
  hashtags: ["#두뇌", "#우주", "#수학", "#상식", "#이심률"],
};
