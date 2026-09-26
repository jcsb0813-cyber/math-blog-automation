// reels/storyboards/conic_sections.js
// 주제: 원뿔곡선(Conic Sections). 77math 실제 채널(외심/단위원 시리즈) 레퍼런스를 따른
// 브랜드 레이아웃: 상단 브레드크럼+회차+제목+시안 부제, 하단 다크 스텝카드+진행률 바,
// 차분한 고정 시점의 네온 구성 도형(회전/난동 없음), 마지막은 77math 큐레시브 로고.
// 구조: 호기심유발 → 접근 → 문제해결(4개 단면) → 다음편 궁금증 → 77math 아웃트로.
// 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, glowStroke, glowPolylineReveal, sampleParametric,
  project3D, neonText, drawSparkle, drawHeader, drawStepCard, drawProgressBar,
  drawBrandLogo,
} from "../engine.js";

// ---------- 타임라인 (초) ----------
export const T = {
  HOOK: [0.0, 2.2],
  APPROACH: [2.2, 4.6],
  CASE1: [4.6, 8.6],   // 원
  CASE2: [8.6, 12.6],  // 타원
  CASE3: [12.6, 16.6], // 포물선
  CASE4: [16.6, 20.6], // 쌍곡선
  CLIFF: [20.6, 22.6],
  OUTRO: [22.6, 24.6],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1]; // 진행률 바는 아웃트로 전까지 채운다

const HEADER = {
  breadcrumb: "고등 · 이차곡선",
  episode: "07",
  title: "원뿔곡선",
  subtitle: "자르는 각도가 곡선을 결정한다",
};

// ---------- 원뿔(더블콘) 지오메트리 — 항상 같은 고정 시점 ----------
const K = 0.7;   // 반지름/높이 비율 = 원뿔 반각의 tan
const H = 260;   // 콘 절반 높이 (3D unit)
const XF = { rotY: 0.5, tiltX: 0.58, scale: 2.25, perspective: 1200, cx: WIDTH / 2, cy: 980 };

function buildConeGeometry() {
  const levels = 5;
  const rings = [];
  for (let i = 0; i <= levels; i++) {
    const y = -H + (2 * H * i) / levels;
    const r = K * Math.abs(y);
    const pts3d = sampleParametric((a) => ({ x: r * Math.cos(a), y, z: r * Math.sin(a) }), 0, Math.PI * 2, 48);
    rings.push(pts3d.map((p) => project3D(p, XF)));
  }
  const genLines = [];
  const apex2d = project3D({ x: 0, y: 0, z: 0 }, XF);
  const nGen = 6;
  for (let nappe = -1; nappe <= 1; nappe += 2) {
    for (let i = 0; i < nGen; i++) {
      const a = (i / nGen) * Math.PI * 2;
      const base2d = project3D({ x: K * H * Math.cos(a), y: nappe * H, z: K * H * Math.sin(a) }, XF);
      genLines.push({ a: apex2d, b: base2d });
    }
  }
  return { rings, genLines, apex2d };
}
const CONE = buildConeGeometry();

// 후크 구간에서 고리 -> 생성선 순서로 "그려지는" 느낌을 준다
function drawCone(ctx, revealProgress, alpha) {
  const elements = [...CONE.rings.map((pts2d) => ({ type: "ring", pts2d })), ...CONE.genLines.map((g) => ({ type: "gen", ...g }))];
  const n = elements.length;
  ctx.save();
  ctx.globalAlpha = alpha;
  elements.forEach((el, i) => {
    const localP = segProgress(revealProgress, i / n, (i + 1.4) / n, ease.outCubic);
    if (localP <= 0) return;
    if (el.type === "ring") {
      glowPolylineReveal(ctx, [...el.pts2d, el.pts2d[0]], localP, NEON.purple, 2.6, 14);
    } else {
      glowPolylineReveal(ctx, [el.a, el.b], localP, NEON.purple, 1.6, 9);
    }
  });
  ctx.restore();
}

// ---------- 평면으로 자른 단면 곡선 계산 (수치적 접근, 수학적으로 정확) ----------
// 원뿔: x^2 + z^2 = k^2 y^2 / 평면: x=x0+s*cosα, y=y0+s*sinα, z=w
function conicLoops(alpha, x0, y0, sMin, sMax, samples = 480) {
  const A = K * K * Math.sin(alpha) ** 2 - Math.cos(alpha) ** 2;
  const B = 2 * K * K * y0 * Math.sin(alpha) - 2 * x0 * Math.cos(alpha);
  const C = K * K * y0 * y0 - x0 * x0;
  const rhs = (s) => A * s * s + B * s + C;

  const validS = [];
  for (let i = 0; i <= samples; i++) {
    const s = sMin + ((sMax - sMin) * i) / samples;
    validS.push(rhs(s) >= 0 ? s : null);
  }
  const runs = [];
  let cur = [];
  for (const s of validS) {
    if (s === null) { if (cur.length > 1) runs.push(cur); cur = []; }
    else cur.push(s);
  }
  if (cur.length > 1) runs.push(cur);

  return runs.map((run) => {
    const upper = run.map((s) => ({ s, w: Math.sqrt(Math.max(0, rhs(s))) }));
    const lower = [...run].reverse().map((s) => ({ s, w: -Math.sqrt(Math.max(0, rhs(s))) }));
    return [...upper, ...lower].map(({ s, w }) => ({
      x: x0 + s * Math.cos(alpha), y: y0 + s * Math.sin(alpha), z: w,
    }));
  });
}

const CASES = [
  {
    key: "circle", label: "원", sub: "수평으로 반듯하게 자르면",
    fact: "인공위성이 지구를 도는\n가장 안정적인 궤도",
    alpha: 0, x0: 0, y0: -90, sRange: [-140, 140], color: NEON.cyan,
  },
  {
    key: "ellipse", label: "타원", sub: "비스듬하게 기울여 자르면",
    fact: "지구가 태양을 도는 궤도\n(케플러의 행성 운동 법칙)",
    alpha: (30 * Math.PI) / 180, x0: 0, y0: -90, sRange: [-160, 160], color: NEON.green,
  },
  {
    key: "parabola", label: "포물선", sub: "빗면과 나란하게 자르면",
    fact: "야구공이 날아가는 궤적,\n위성 안테나(파라볼라)의 형태",
    alpha: Math.atan(1 / K), x0: 0, y0: -90, sRange: [-160, 60], color: NEON.magenta,
  },
  {
    key: "hyperbola", label: "쌍곡선", sub: "수직으로 똑바로 자르면",
    fact: "우주선이 행성 중력으로\n스윙바이(가속)할 때의 궤적",
    alpha: (90 * Math.PI) / 180, x0: 45, y0: 0, sRange: [-170, 170], color: NEON.white,
  },
];

function drawCutIndicator(ctx, c, sweepProgress) {
  const s0 = c.sRange[0] * 1.15, s1 = c.sRange[1] * 1.15;
  const a = c.alpha * ease.outCubic(sweepProgress);
  const p0 = project3D({ x: c.x0 + s0 * Math.cos(a), y: c.y0 + s0 * Math.sin(a), z: 0 }, XF);
  const p1 = project3D({ x: c.x0 + s1 * Math.cos(a), y: c.y0 + s1 * Math.sin(a), z: 0 }, XF);
  glowStroke(ctx, () => { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); }, NEON.yellow, 5, 26);
}

function drawCaseCurve(ctx, c, reveal) {
  const loops = conicLoops(c.alpha, c.x0, c.y0, c.sRange[0], c.sRange[1]);
  for (const loop3d of loops) {
    glowPolylineReveal(ctx, loop3d.map((p) => project3D(p, XF)), reveal, c.color, 7, 30);
  }
}

function decorate(ctx, t) {
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

// ---------- 세그먼트별 렌더 ----------
function renderHook(ctx, t) {
  const [s, e] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);

  const headerA = segProgress(local, 0.0, 0.5);
  drawHeader(ctx, { ...HEADER, alpha: headerA });

  const coneReveal = segProgress(local, 0.3, 2.0, ease.outCubic);
  drawCone(ctx, coneReveal, 0.9);

  const cardA = segProgress(local, 1.1, 1.7);
  drawStepCard(ctx, {
    stepLabel: "HOOK",
    headline: "우리가 아는 원·타원·포물선·쌍곡선",
    subtext: "사실은 원뿔 하나에서 전부 나온다",
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
  drawCone(ctx, 1, 0.9);

  const sweep = clamp01(local / 2.0);
  const fake = { x0: 0, y0: -90, alpha: sweep * (Math.PI / 2), sRange: [-200, 200] };
  const a = fake.alpha;
  const p0 = project3D({ x: fake.x0 - 200 * Math.cos(a), y: fake.y0 - 200 * Math.sin(a), z: 0 }, XF);
  const p1 = project3D({ x: fake.x0 + 200 * Math.cos(a), y: fake.y0 + 200 * Math.sin(a), z: 0 }, XF);
  glowStroke(ctx, () => { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); }, NEON.yellow, 5, 26);

  drawStepCard(ctx, {
    stepLabel: "원리",
    headline: "평면의 기울기만 바꾸면",
    subtext: "4가지 곡선이 전부 여기서 나온다",
    alpha: 1,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderCase(ctx, t, seg, c, index) {
  const [s, e] = seg;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  drawCone(ctx, 1, 0.85);

  const sweepP = segProgress(local, 0.1, 1.0);
  drawCutIndicator(ctx, c, sweepP);

  const revealP = segProgress(local, 0.9, 2.3, ease.outCubic);
  if (revealP > 0) drawCaseCurve(ctx, c, revealP);

  const cardA = segProgress(local, 1.3, 1.9);
  drawStepCard(ctx, {
    stepLabel: `0${index} 단면`,
    headline: `${c.sub} → ${c.label}`,
    subtext: c.fact,
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderCliff(ctx, t) {
  const [s] = T.CLIFF;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  drawCone(ctx, 1, 0.5);

  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, {
    stepLabel: "다음 편",
    headline: "우주선이 그리는 궤도는 무엇일까?",
    subtext: "정답은 다음 영상에서 공개",
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
  drawBrandLogo(ctx, WIDTH / 2, HEIGHT / 2, logoP);
}

// ---------- 메인 렌더 함수 ----------
export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.APPROACH[0]) return renderHook(ctx, t);
  if (t < T.CASE1[0]) return renderApproach(ctx, t);
  if (t < T.CASE2[0]) return renderCase(ctx, t, T.CASE1, CASES[0], 1);
  if (t < T.CASE3[0]) return renderCase(ctx, t, T.CASE2, CASES[1], 2);
  if (t < T.CASE4[0]) return renderCase(ctx, t, T.CASE3, CASES[2], 3);
  if (t < T.CLIFF[0]) return renderCase(ctx, t, T.CASE4, CASES[3], 4);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "고깔콘을 비스듬히 잘랐더니 나타나는 소름 돋는 모양",
  hashtags: ["#두뇌", "#도형트레이닝", "#수학", "#상식", "#공간지각"],
};
