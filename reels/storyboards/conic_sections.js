// reels/storyboards/conic_sections.js
// 주제: 원뿔곡선 (Conic Sections) — "고깔콘을 비스듬히 잘랐더니 나타나는 소름 돋는 모양"
// 구조: 호기심유발(HOOK) → 접근(APPROACH) → 문제해결(4개 단면) → RECAP → 다음편 궁금증(CLIFFHANGER) → 77math 아웃트로
// 9:16, 1080x1920, 검정 배경 + 네온 라인.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, glowStroke, glowPolylineReveal, sampleParametric,
  project3D, neonText, glitchText, typeOnText, drawSparks,
  makeShatterSprite, drawShatter,
} from "../engine.js";

// ---------- 타임라인 (초) ----------
export const T = {
  HOOK: [0.0, 3.2],
  APPROACH: [3.2, 6.4],
  CASE1: [6.4, 9.4],   // 원
  CASE2: [9.4, 12.4],  // 타원
  CASE3: [12.4, 15.4], // 포물선
  CASE4: [15.4, 18.4], // 쌍곡선
  RECAP: [18.4, 20.4],
  CLIFF: [20.4, 22.6],
  OUTRO: [22.6, 24.6],
};
export const DURATION = T.OUTRO[1];

// ---------- 원뿔(더블콘) 지오메트리 ----------
const K = 0.7;   // 반지름/높이 비율 = 원뿔 반각의 tan
const H = 260;   // 콘 절반 높이 (3D unit)

function coneTransform(t) {
  return { rotY: 0.6 + t * 0.18, tiltX: 0.58, scale: 2.55, perspective: 1200 };
}

function drawCone(ctx, t, opts = {}) {
  const { alpha = 1 } = opts;
  const xf = coneTransform(t);
  const levels = 7;
  const rings = [];
  for (let i = 0; i <= levels; i++) {
    const y = -H + (2 * H * i) / levels;
    const r = K * Math.abs(y);
    const pts3d = sampleParametric(
      (a) => ({ x: r * Math.cos(a), y, z: r * Math.sin(a) }),
      0, Math.PI * 2, 48
    );
    const pts2d = pts3d.map((p) => project3D(p, xf));
    const depth = pts2d.reduce((s, p) => s + p.depth, 0) / pts2d.length;
    rings.push({ pts2d, depth, y });
  }
  // generator lines (apex -> base edge), a handful around the circumference
  const genLines = [];
  const apex2d = project3D({ x: 0, y: 0, z: 0 }, xf);
  const nGen = 10;
  for (let nappe = -1; nappe <= 1; nappe += 2) {
    for (let i = 0; i < nGen; i++) {
      const a = (i / nGen) * Math.PI * 2;
      const base3d = { x: K * H * Math.cos(a), y: nappe * H, z: K * H * Math.sin(a) };
      const base2d = project3D(base3d, xf);
      const depth = (apex2d.depth + base2d.depth) / 2;
      genLines.push({ a: apex2d, b: base2d, depth });
    }
  }

  const drawables = [
    ...rings.map((r) => ({ type: "ring", ...r })),
    ...genLines.map((g) => ({ type: "gen", ...g })),
  ].sort((p, q) => p.depth - q.depth);

  ctx.save();
  ctx.globalAlpha = alpha;
  for (const d of drawables) {
    const dimFactor = 0.35 + 0.65 * clamp01((d.depth + 300) / 600);
    if (d.type === "ring") {
      glowStroke(ctx, () => {
        ctx.beginPath();
        d.pts2d.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
      }, NEON.purple, 2.4, 14 * dimFactor);
    } else {
      ctx.save();
      ctx.globalAlpha = alpha * dimFactor * 0.7;
      glowStroke(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(d.a.x, d.a.y);
        ctx.lineTo(d.b.x, d.b.y);
      }, NEON.purple, 1.6, 10);
      ctx.restore();
    }
  }
  ctx.restore();
  return xf;
}

// ---------- 평면로 자른 단면 곡선 계산 (수치적 접근) ----------
// 원뿔: x^2 + z^2 = k^2 y^2
// 평면: x = x0 + s*cos(alpha), y = y0 + s*sin(alpha), z = w
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
  // group into contiguous runs
  const runs = [];
  let cur = [];
  for (const s of validS) {
    if (s === null) {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    } else {
      cur.push(s);
    }
  }
  if (cur.length > 1) runs.push(cur);

  return runs.map((run) => {
    const upper = run.map((s) => ({ s, w: Math.sqrt(Math.max(0, rhs(s))) }));
    const lower = [...run].reverse().map((s) => ({ s, w: -Math.sqrt(Math.max(0, rhs(s))) }));
    const loop = [...upper, ...lower];
    return loop.map(({ s, w }) => ({
      x: x0 + s * Math.cos(alpha),
      y: y0 + s * Math.sin(alpha),
      z: w,
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
    alpha: (30 * Math.PI) / 180, x0: 0, y0: -90, sRange: [-160, 160], color: NEON.yellow,
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

function drawCutIndicator(ctx, xf, c, sweepProgress) {
  // 평면을 가장자리에서 본 듯한 네온 "칼날" 선
  const s0 = c.sRange[0] * 1.15, s1 = c.sRange[1] * 1.15;
  const a = c.alpha * ease.outCubic(sweepProgress);
  const p0 = project3D({ x: c.x0 + s0 * Math.cos(a), y: c.y0 + s0 * Math.sin(a), z: 0 }, xf);
  const p1 = project3D({ x: c.x0 + s1 * Math.cos(a), y: c.y0 + s1 * Math.sin(a), z: 0 }, xf);
  glowStroke(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
  }, NEON.yellow, 5, 30);
}

function drawCaseCurve(ctx, xf, c, reveal) {
  const loops = conicLoops(c.alpha, c.x0, c.y0, c.sRange[0], c.sRange[1]);
  for (const loop3d of loops) {
    const pts2d = loop3d.map((p) => project3D(p, xf));
    glowPolylineReveal(ctx, pts2d, reveal, c.color, 7, 34);
  }
}

function caption(ctx, x, y, lines, alpha, opts = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const size = opts.size ?? 40;
  lines.forEach((line, i) => {
    neonText(ctx, line, x, y + i * (size + 10), { size, color: NEON.white, glow: 14, weight: 600 });
  });
  ctx.restore();
}

// ---------- 세그먼트별 렌더 ----------
function renderHook(ctx, t) {
  const [s, e] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.08 ? 0.5 : 0 });
  const xf = drawCone(ctx, t, { alpha: clamp01(local / 1.2) });
  drawSparks(ctx, t, 40);

  const p1 = segProgress(local, 0.0, 0.5, ease.outBack);
  const p2 = segProgress(local, 0.75, 1.25, ease.outBack);
  const p3 = segProgress(local, 1.5, 2.1, ease.outBack);
  if (p1 > 0) glitchText(ctx, "원뿔을", WIDTH / 2, 430, t, { size: 76 });
  if (p2 > 0) glitchText(ctx, "자르는 각도 하나로", WIDTH / 2, 540, t, { size: 62 });
  if (p3 > 0) glitchText(ctx, "우주의 궤도가 정해진다", WIDTH / 2, 650, t, { size: 58, color: NEON.cyan });
}

function renderApproach(ctx, t) {
  const [s] = T.APPROACH;
  const local = t - s;
  drawBackground(ctx, t);
  const xf = drawCone(ctx, t, { alpha: 1 });
  drawSparks(ctx, t, 30);

  // 평면이 수평 -> 수직으로 계속 스윕
  const sweep = (Math.sin(local * 1.4) + 1) / 2; // 0..1 왕복
  const fakeCase = { x0: 0, y0: -90, sRange: [-170, 170] };
  const a = sweep * (Math.PI / 2);
  const p0 = project3D({ x: fakeCase.x0 - 200 * Math.cos(a), y: fakeCase.y0 - 200 * Math.sin(a), z: 0 }, xf);
  const p1 = project3D({ x: fakeCase.x0 + 200 * Math.cos(a), y: fakeCase.y0 + 200 * Math.sin(a), z: 0 }, xf);
  glowStroke(ctx, () => { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); }, NEON.yellow, 5, 30);

  const cap1 = segProgress(local, 0.1, 0.9);
  const cap2 = segProgress(local, 1.6, 2.4);
  if (cap1 > 0) caption(ctx, WIDTH / 2, 300, ["평면(빛나는 선)으로", "자르는 각도만 바꿨을 뿐인데..."], cap1, { size: 44 });
  if (cap2 > 0) neonText(ctx, "4가지 곡선이 전부 여기서 나온다", WIDTH / 2, 1650, { size: 46, color: NEON.magenta, glow: 24, alpha: cap2 });
}

function renderCase(ctx, t, seg, c, index) {
  const [s, e] = seg;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.35 : 0 });
  const xf = drawCone(ctx, t, { alpha: 0.9 });
  drawSparks(ctx, t, 26);

  const sweepP = segProgress(local, 0.1, 1.0);
  drawCutIndicator(ctx, xf, c, sweepP);

  const revealP = segProgress(local, 0.85, 2.15, ease.outCubic);
  if (revealP > 0) drawCaseCurve(ctx, xf, c, revealP);

  const titleP = segProgress(local, 0.0, 0.45, ease.outBack);
  const nameP = segProgress(local, 1.0, 1.6, ease.outElastic);
  const factP = segProgress(local, dur - 1.0, dur - 0.3);

  if (titleP > 0) {
    ctx.save();
    ctx.globalAlpha = titleP;
    neonText(ctx, `${index}. ${c.sub}`, WIDTH / 2, 210, { size: 40, color: NEON.white, glow: 16, weight: 700 });
    ctx.restore();
  }
  if (nameP > 0) {
    glitchText(ctx, c.label, WIDTH / 2, 1720, t, { size: 108, color: c.color });
  }
  if (factP > 0) {
    const lines = c.fact.split("\n");
    caption(ctx, WIDTH / 2, 1820, lines, factP, { size: 34 });
  }
}

const RECAP_SHAPES = [
  { label: "원", draw: (ctx, cx, cy, r) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); }, color: NEON.cyan },
  { label: "타원", draw: (ctx, cx, cy, r) => { ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.6, 0, 0, Math.PI * 2); }, color: NEON.yellow },
  {
    label: "포물선", color: NEON.magenta,
    draw: (ctx, cx, cy, r) => {
      ctx.beginPath();
      for (let i = -20; i <= 20; i++) {
        const x = (i / 20) * r;
        const y = (x * x) / r - r * 0.55;
        const px = cx + x, py = cy + y;
        i === -20 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
    },
  },
  {
    label: "쌍곡선", color: NEON.white,
    draw: (ctx, cx, cy, r) => {
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        for (let i = -20; i <= 20; i++) {
          const u = (i / 20) * 1.4;
          const x = dir * r * 0.4 * Math.cosh(u);
          const y = r * 0.7 * Math.sinh(u);
          const px = cx + x, py = cy + y;
          i === -20 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    },
  },
];

function renderRecap(ctx, t) {
  const [s, e] = T.RECAP;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t, { flash: 0.15 });
  drawSparks(ctx, t, 60);

  const slot = clamp01(local / dur) * RECAP_SHAPES.length;
  const idx = Math.min(RECAP_SHAPES.length - 1, Math.floor(slot));
  const shape = RECAP_SHAPES[idx];
  const within = slot - idx;
  const pop = ease.outBack(clamp01(within * 3));

  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT / 2 - 60);
  ctx.scale(pop, pop);
  glowStroke(ctx, () => shape.draw(ctx, 0, 0, 260), shape.color, 10, 44);
  ctx.restore();
  neonText(ctx, shape.label, WIDTH / 2, HEIGHT / 2 + 340, { size: 64, color: shape.color, glow: 30, alpha: pop });

  if (local > dur - 0.4) {
    const p = segProgress(local, dur - 0.4, dur);
    neonText(ctx, "4개의 곡선, 하나의 원뿔", WIDTH / 2, 1780, { size: 42, color: NEON.white, alpha: p });
  }
}

function renderCliff(ctx, t) {
  const [s] = T.CLIFF;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.6 : 0 });
  drawSparks(ctx, t, 24);

  const p1 = segProgress(local, 0.15, 0.9);
  const p2 = segProgress(local, 1.15, 1.9);
  if (p1 > 0) glitchText(ctx, "그럼...", WIDTH / 2, 780, t, { size: 60, alpha: p1 });
  if (p2 > 0) glitchText(ctx, "NASA 우주선의 궤도는\n이 중 무엇일까?", WIDTH / 2, 900, t, { size: 50, color: NEON.cyan });
  const p3 = segProgress(local, 1.9, 2.2);
  if (p3 > 0) neonText(ctx, "다음 영상에서 공개", WIDTH / 2, 1600, { size: 38, color: NEON.magenta, alpha: p3, glow: 20 });
}

let shatterSprite = null;
function getShatterSprite() {
  if (shatterSprite) return shatterSprite;
  const w = 700, h = 220;
  shatterSprite = makeShatterSprite(w, h, (octx) => {
    octx.clearRect(0, 0, w, h);
    octx.font = `900 130px "Pretendard","Noto Sans KR",sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.shadowColor = NEON.cyan;
    octx.shadowBlur = 40;
    octx.fillStyle = NEON.cyan;
    octx.fillText("77math", w / 2, h / 2);
    octx.shadowBlur = 14;
    octx.fillStyle = "#ffffff";
    octx.globalAlpha = 0.7;
    octx.fillText("77math", w / 2, h / 2);
  });
  return shatterSprite;
}

function renderOutro(ctx, t) {
  const [s, e] = T.OUTRO;
  const local = t - s;
  drawBackground(ctx, t);
  drawSparks(ctx, t, 18);

  const typeP = segProgress(local, 0.0, 0.55);
  const holdEnd = 0.95;
  const shatterP = segProgress(local, holdEnd, (e - s));

  if (local < holdEnd) {
    typeOnText(ctx, "77math", WIDTH / 2, HEIGHT / 2, typeP, { size: 108, color: NEON.cyan, glow: 34, weight: 900 });
  } else {
    const sprite = getShatterSprite();
    drawShatter(ctx, sprite, WIDTH / 2, HEIGHT / 2, shatterP, { cols: 16, rows: 6, spread: 620 });
  }
}

// ---------- 메인 렌더 함수 ----------
export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.APPROACH[0]) return renderHook(ctx, t);
  if (t < T.CASE1[0]) return renderApproach(ctx, t);
  if (t < T.CASE2[0]) return renderCase(ctx, t, T.CASE1, CASES[0], 1);
  if (t < T.CASE3[0]) return renderCase(ctx, t, T.CASE2, CASES[1], 2);
  if (t < T.CASE4[0]) return renderCase(ctx, t, T.CASE3, CASES[2], 3);
  if (t < T.RECAP[0]) return renderCase(ctx, t, T.CASE4, CASES[3], 4);
  if (t < T.CLIFF[0]) return renderRecap(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "고깔콘을 비스듬히 잘랐더니 나타나는 소름 돋는 모양",
  hashtags: ["#두뇌", "#도형트레이닝", "#수학", "#상식", "#공간지각"],
};
