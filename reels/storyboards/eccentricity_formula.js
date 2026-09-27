// reels/storyboards/eccentricity_formula.js
// 주제: 이심률은 어떻게 계산할까? (e = c/a) — "이심률(eccentricity)" 편의
// 클리프행어("e는 대체 어떻게 계산할까?")에 답하는 3편.
// 요청: "네온이 더 화려하게, 장면이 많아야" — 헤더/카드/로고 등 브랜드 골격은 유지하되
// 장면 수를 늘리고(기하 장면 ↔ 타이포 장면 ↔ 속사포 실제 사례) 순간순간 파티클 버스트로
// 포인트를 준다. 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, glowStroke, glowPolylineReveal, neonText, drawSparkle,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

// ---------- 타임라인 (초) ----------
export const T = {
  HOOK: [0.0, 2.4],
  SETUP: [2.4, 5.4],
  FORMULA: [5.4, 8.6],
  PLUGIN: [8.6, 11.8],
  ALT: [11.8, 15.4],
  REAL: [15.4, 20.4],
  CLIFF: [20.4, 22.6],
  OUTRO: [22.6, 24.6],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "고등 · 이차곡선",
  title: "이심률 구하기",
  subtitle: "e = c ÷ a, 이 비율 하나면 끝난다",
};

// ---------- 기준 타원: 2편의 e=0.55와 정확히 같은 도형 (시리즈 연속성) ----------
const EX = SAFE_CX, EY = SAFE_Y1 * 0.5;
const A_LEN = 220;
const C_LEN = 121; // e = 121/220 = 0.55
const B_LEN = Math.sqrt(A_LEN * A_LEN - C_LEN * C_LEN); // ≈ 183.7
const E_VAL = C_LEN / A_LEN;

function ellipsePoints(samples = 240) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const th = (i / samples) * Math.PI * 2;
    pts.push({ x: EX + A_LEN * Math.cos(th), y: EY + B_LEN * Math.sin(th) });
  }
  return pts;
}
const O_PT = { x: EX, y: EY };
const A_PT = { x: EX + A_LEN, y: EY };
const F_PT = { x: EX + C_LEN, y: EY };
const B_PT = { x: EX, y: EY - B_LEN };

function dot(ctx, p, color, r = 7) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function segment(ctx, p0, p1, color, reveal, width = 6) {
  glowPolylineReveal(ctx, [p0, p1], reveal, color, width, 24);
}

function decorate(ctx, t) {
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

// ---------- 기하 장면: 타원 + a/c(+옵션 b) ----------
function drawEllipseScene(ctx, { ellipseReveal = 1, aReveal = 0, cReveal = 0, bReveal = 0 } = {}) {
  glowPolylineReveal(ctx, ellipsePoints(), ellipseReveal, NEON.white, 4.5, 18);
  dot(ctx, O_PT, NEON.white, 6);
  neonText(ctx, "O", O_PT.x - 34, O_PT.y - 6, { size: 30, color: NEON.white, glow: 8, weight: 700 });

  if (aReveal > 0) {
    segment(ctx, O_PT, A_PT, NEON.green, aReveal, 6);
    if (aReveal > 0.5) neonText(ctx, "a", (O_PT.x + A_PT.x) / 2, O_PT.y - 30, { size: 34, color: NEON.green, glow: 14, weight: 800 });
  }
  if (cReveal > 0) {
    segment(ctx, O_PT, F_PT, NEON.magenta, cReveal, 6);
    if (cReveal > 0.5) neonText(ctx, "c", (O_PT.x + F_PT.x) / 2, O_PT.y + 34, { size: 34, color: NEON.magenta, glow: 14, weight: 800 });
  }
  if (bReveal > 0) {
    segment(ctx, O_PT, B_PT, NEON.yellow, bReveal, 6);
    if (bReveal > 0.5) neonText(ctx, "b", O_PT.x + 30, (O_PT.y + B_PT.y) / 2, { size: 34, color: NEON.yellow, glow: 14, weight: 800, align: "left" });
  }
  if (aReveal >= 1) { dot(ctx, A_PT, NEON.white, 6); neonText(ctx, "A", A_PT.x + 28, A_PT.y, { size: 28, color: NEON.white, glow: 8, weight: 700, align: "left" }); }
  if (cReveal >= 1) { dot(ctx, F_PT, NEON.magenta, 6); neonText(ctx, "F", F_PT.x, F_PT.y - 32, { size: 28, color: NEON.magenta, glow: 10, weight: 700 }); }
  if (bReveal >= 1) { dot(ctx, B_PT, NEON.yellow, 6); neonText(ctx, "B", B_PT.x, B_PT.y - 30, { size: 28, color: NEON.yellow, glow: 8, weight: 700 }); }
}

// ---------- 세그먼트별 렌더 ----------
function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.5) });

  const ellA = segProgress(local, 0.2, 1.0, ease.outCubic);
  drawEllipseScene(ctx, { ellipseReveal: ellA, aReveal: 0, cReveal: 0 });
  if (local > 0.9 && local < 1.3) drawBurst(ctx, EX, EY, segProgress(local, 0.9, 1.5), { colors: [NEON.cyan, NEON.green] });

  const cardA = segProgress(local, 1.1, 1.7);
  drawStepCard(ctx, {
    stepLabel: "HOOK",
    headline: "지난 편, e = 0.55였던 그 타원",
    subtext: "이 숫자는 대체 어떻게 나온 걸까?",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderSetup(ctx, t) {
  const [s] = T.SETUP;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const aR = segProgress(local, 0.2, 1.0, ease.outCubic);
  const cR = segProgress(local, 1.1, 1.9, ease.outCubic);
  drawEllipseScene(ctx, { ellipseReveal: 1, aReveal: aR, cReveal: cR });
  if (local > 1.85 && local < 2.3) drawBurst(ctx, F_PT.x, F_PT.y, segProgress(local, 1.85, 2.35), { colors: [NEON.magenta, NEON.white] });

  const cardA = segProgress(local, 0.15, 0.6);
  drawStepCard(ctx, {
    stepLabel: "01 준비",
    headline: "중심→꼭짓점 = a, 중심→초점 = c",
    subtext: "두 길이만 재면 된다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderFormula(ctx, t) {
  const [s] = T.FORMULA;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.42;
  const eP = segProgress(local, 0.1, 0.6, ease.outBack);
  const cP = segProgress(local, 0.5, 1.0, ease.outBack);
  const barP = segProgress(local, 0.8, 1.1);
  const aP = segProgress(local, 0.9, 1.4, ease.outBack);

  if (eP > 0) neonText(ctx, "e", SAFE_CX - 200, cy, { size: 96, color: NEON.white, glow: 24, weight: 900, alpha: eP });
  if (eP > 0.4) neonText(ctx, "=", SAFE_CX - 110, cy, { size: 80, color: NEON.white, glow: 16, weight: 800, alpha: eP });
  if (cP > 0) neonText(ctx, "c", SAFE_CX + 40, cy - 62, { size: 84, color: NEON.magenta, glow: 26, weight: 900, alpha: cP });
  if (barP > 0) {
    ctx.save();
    ctx.globalAlpha = barP;
    ctx.strokeStyle = NEON.white;
    ctx.shadowColor = NEON.white;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(SAFE_CX - 20, cy);
    ctx.lineTo(SAFE_CX + 130, cy);
    ctx.stroke();
    ctx.restore();
  }
  if (aP > 0) neonText(ctx, "a", SAFE_CX + 40, cy + 62, { size: 84, color: NEON.green, glow: 26, weight: 900, alpha: aP });

  if (local > 1.35 && local < 1.9) drawBurst(ctx, SAFE_CX + 40, cy, segProgress(local, 1.35, 1.95), { colors: [NEON.white, NEON.magenta, NEON.green, NEON.cyan], count: 30, maxDist: 320 });

  const cardA = segProgress(local, 2.0, 2.5);
  drawStepCard(ctx, {
    stepLabel: "02 공식",
    headline: "이심률 e = c ÷ a",
    subtext: "초점까지 거리를 꼭짓점까지 거리로 나눈다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderPlugin(ctx, t) {
  const [s] = T.PLUGIN;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.4;
  const l1 = segProgress(local, 0.1, 0.5);
  const l2 = segProgress(local, 0.5, 0.9);
  const l3 = segProgress(local, 1.2, 1.7, ease.outBack);

  if (l1 > 0) neonText(ctx, "c = 121", SAFE_CX, cy - 90, { size: 58, color: NEON.magenta, glow: 22, weight: 800, alpha: l1 });
  if (l2 > 0) neonText(ctx, "a = 220", SAFE_CX, cy, { size: 58, color: NEON.green, glow: 22, weight: 800, alpha: l2 });
  if (l3 > 0) neonText(ctx, `e = 121 ÷ 220 = ${E_VAL.toFixed(2)}`, SAFE_CX, cy + 130, { size: 52, color: NEON.white, glow: 26, weight: 900, alpha: l3 });

  if (local > 1.6 && local < 2.2) drawBurst(ctx, SAFE_CX, cy + 130, segProgress(local, 1.6, 2.2), { colors: [NEON.cyan, NEON.green, NEON.magenta], count: 26 });

  const cardA = segProgress(local, 2.3, 2.8);
  drawStepCard(ctx, {
    stepLabel: "03 대입",
    headline: "숫자를 넣으면 e = 0.55",
    subtext: "2편에서 봤던 바로 그 타원이 맞다",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderAlt(ctx, t) {
  const [s] = T.ALT;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const bR = segProgress(local, 0.2, 1.0, ease.outCubic);
  drawEllipseScene(ctx, { ellipseReveal: 1, aReveal: 1, cReveal: 0, bReveal: bR });

  const formulaA = segProgress(local, 1.3, 1.9);
  if (formulaA > 0) {
    neonText(ctx, "e = √(1 − (b/a)²)", SAFE_CX, SAFE_Y1 * 0.5 + 260, {
      size: 42, color: NEON.yellow, glow: 20, weight: 800, alpha: formulaA,
    });
  }
  const sameA = segProgress(local, 2.4, 2.9);
  if (sameA > 0) {
    neonText(ctx, "= 0.55  (똑같다!)", SAFE_CX, SAFE_Y1 * 0.5 + 316, {
      size: 34, color: NEON.cyan, glow: 16, weight: 700, alpha: sameA,
    });
    if (local > 2.4 && local < 2.9) drawBurst(ctx, SAFE_CX, SAFE_Y1 * 0.5 + 300, segProgress(local, 2.4, 3.0), { colors: [NEON.cyan, NEON.yellow], count: 18, maxDist: 160 });
  }

  const cardA = segProgress(local, 0.05, 0.4);
  drawStepCard(ctx, {
    stepLabel: "04 다른 방법",
    headline: "단축 b로도 구할 수 있다",
    subtext: "b = √(a² − c²) 관계를 거꾸로 쓴 것뿐",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 실제 사례 속사포 ----------
const REAL_EXAMPLES = [
  { label: "지구", value: "e ≈ 0.017", desc: "거의 완벽한 원", color: NEON.cyan },
  { label: "핼리 혜성", value: "e ≈ 0.967", desc: "포물선에 가까운 타원", color: NEON.magenta },
  { label: "보이저 1호", value: "e ≈ 3.7", desc: "태양계를 탈출하는 쌍곡선 궤도", color: NEON.white },
];

function renderReal(ctx, t) {
  const [s, e] = T.REAL;
  const local = t - s;
  const dur = e - s;
  const slotDur = dur / REAL_EXAMPLES.length;
  drawBackground(ctx, t, { flash: local % slotDur < 0.05 ? 0.3 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const idx = Math.min(REAL_EXAMPLES.length - 1, Math.floor(local / slotDur));
  const within = local - idx * slotDur;
  const item = REAL_EXAMPLES[idx];
  const pop = segProgress(within, 0.05, 0.5, ease.outBack);
  const cy = SAFE_Y1 * 0.42;

  ctx.save();
  ctx.globalAlpha = pop;
  ctx.translate(SAFE_CX, cy);
  ctx.scale(pop, pop);
  ctx.translate(-SAFE_CX, -cy);
  neonText(ctx, item.label, SAFE_CX, cy - 90, { size: 40, color: NEON.white, glow: 12, weight: 700 });
  neonText(ctx, item.value, SAFE_CX, cy + 10, { size: 76, color: item.color, glow: 28, weight: 900 });
  neonText(ctx, item.desc, SAFE_CX, cy + 100, { size: 30, color: "rgba(220,228,245,0.85)", glow: 8, weight: 600 });
  ctx.restore();

  if (within > 0.15 && within < 0.7) drawBurst(ctx, SAFE_CX, cy + 10, segProgress(within, 0.15, 0.75), { colors: [item.color, NEON.white], count: 20 });

  const cardA = 1;
  drawStepCard(ctx, {
    stepLabel: `0${5 + idx} 실제 사례`,
    headline: `${item.label}의 이심률`,
    subtext: item.desc,
    alpha: cardA,
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
    headline: "진짜 우주선의 궤도를 계산해보면?",
    subtext: "보이저 1호, 뉴호라이즌스... 다음 영상에서",
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
  if (local > 0.85) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.85, e - s), { colors: [NEON.cyan, NEON.magenta], count: 28, maxDist: 300 });
}

// ---------- 메인 렌더 함수 ----------
export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.SETUP[0]) return renderHook(ctx, t);
  if (t < T.FORMULA[0]) return renderSetup(ctx, t);
  if (t < T.PLUGIN[0]) return renderFormula(ctx, t);
  if (t < T.ALT[0]) return renderPlugin(ctx, t);
  if (t < T.REAL[0]) return renderAlt(ctx, t);
  if (t < T.CLIFF[0]) return renderReal(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "이심률(e)은 어떻게 계산할까? — 공식 하나로 끝",
  hashtags: ["#두뇌", "#우주", "#수학", "#상식", "#이심률"],
};
