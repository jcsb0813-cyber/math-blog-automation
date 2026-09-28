// reels/storyboards/hat_tile_chiral_light.js
// [daily-reels 2026-09-28, 1/5] 오늘의 이슈: 2023년 아마추어 수학자 David Smith가 발견한
// 최초의 비주기 단일타일("아인슈타인 타일"/"모자(hat) 타일")로 도쿄대 연구팀이 나노 구조를
// 만들어 레이저를 쏘았더니, 회전방향에 따라 다른 팔랑개비 모양의 카이랄(chiral) 회절
// 패턴이 나타났다는 새 발견 (Nature Communications, 2026.7.29 게재).
// 실제 hat 타일의 정확한 다각형 좌표 대신, "같은 도형이 반복 없이 평면을 채운다"는
// 개념을 전달하는 단순화된 육각형 계열 타일로 근사해서 시각화한다(과장/허위 없음,
// 다만 기하학적으로 엄밀한 아인슈타인 타일 재현은 아님을 인지하고 개념 전달 목적으로 단순화).
// 새 기법: 비주기 타일링을 프레임 단위로 채워나가는 "aperiodic-tile-tessellation-reveal".
// 9:16, 1080x1920, 소리 없음. 5개 중 하나이므로 클리프행어 강제 연결 없음(단독 완결).

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01, makeRng,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  SAFE_CX, SAFE_Y1,
} from "../engine.js";

export const T = {
  HOOK: [0.0, 2.2],
  TILE: [2.2, 8.4],
  LIGHT: [8.4, 15.2],
  FACT: [15.2, 18.6],
  CLOSE: [18.6, 20.6],
  OUTRO: [20.6, 22.8],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLOSE[1];

const HEADER = {
  breadcrumb: "수학 이슈 · 기하학·광학",
  title: "아인슈타인 타일이 빛을 꼬았다",
  subtitle: "도쿄대 연구팀 발표(2026)",
};

function decorate(ctx, t) {
  drawDust(ctx, t, 55);
  const pulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  drawSparkle(ctx, WIDTH - 86, 630, 16, { color: NEON.magenta, alpha: pulse });
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
  if (p1 > 0) neonText(ctx, "이 도형 하나로 평면을 다 채워도", SAFE_CX, cy - 30, { size: 34, color: NEON.white, glow: 16, weight: 800, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "무늬가 절대 반복되지 않는다면?", SAFE_CX, cy + 50, { size: 38, color: NEON.magenta, glow: 20, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, { stepLabel: "HOOK", headline: "2023년 발견된 '아인슈타인 타일'", subtext: "여기에 레이저를 쏘자 이상한 일이 벌어졌다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

// ---------- 단순화된 "hat" 계열 타일: 육각형 변형 도형을 회전/반사시켜 반복 없이 배치 ----------
const TILE_R = 62;
function hatTilePath(ctx, cx, cy, rotation, mirror) {
  const pts = [
    [0, -1], [0.87, -0.5], [0.87, 0.5], [0, 1], [-0.5, 0.6], [-0.87, -0.5],
  ];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(mirror ? -1 : 1, 1);
  ctx.beginPath();
  pts.forEach(([px, py], i) => {
    const x = px * TILE_R, y = py * TILE_R;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.restore();
}

const GRID_COLS = 6, GRID_ROWS = 7;
const TILE_ORIGIN_X = SAFE_CX - (GRID_COLS - 1) * 78 / 2;
const TILE_ORIGIN_Y = 500;
const rng = makeRng(4242);
const TILE_CELLS = [];
for (let r = 0; r < GRID_ROWS; r++) {
  for (let c = 0; c < GRID_COLS; c++) {
    TILE_CELLS.push({
      x: TILE_ORIGIN_X + c * 78 + (r % 2 === 0 ? 0 : 20),
      y: TILE_ORIGIN_Y + r * 68,
      rotation: Math.floor(rng() * 6) * (Math.PI / 3),
      mirror: rng() > 0.5,
      color: [NEON.cyan, NEON.magenta, NEON.white][Math.floor(rng() * 3)],
    });
  }
}

function renderTile(ctx, t) {
  const [s, e] = T.TILE;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const fillProgress = segProgress(local, 0.2, dur - 1.0);
  const revealCount = Math.floor(fillProgress * TILE_CELLS.length);
  for (let i = 0; i < revealCount; i++) {
    const cell = TILE_CELLS[i];
    const cellDone = i / TILE_CELLS.length;
    const since = clamp01((fillProgress - cellDone) / 0.08);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = cell.color;
    ctx.shadowColor = cell.color;
    ctx.shadowBlur = 10 + since * 10;
    ctx.lineWidth = 2.5;
    hatTilePath(ctx, cell.x, cell.y, cell.rotation, cell.mirror);
    ctx.stroke();
    ctx.restore();
  }

  const capA = segProgress(local, 0.1, 0.5);
  if (capA > 0) neonText(ctx, "같은 도형, 계속 다른 배치 — 절대 안 반복된다", SAFE_CX, TILE_ORIGIN_Y + GRID_ROWS * 68 + 60, { size: 25, color: NEON.white, glow: 10, weight: 700, alpha: capA });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "발견", headline: "David Smith, 아마추어 수학자(2023)", subtext: "최초의 '비주기 단일타일'을 손으로 찾아냈다", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderLight(ctx, t) {
  const [s, e] = T.LIGHT;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  // 배경에 타일 패턴을 옅게 유지
  TILE_CELLS.forEach((cell) => {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = cell.color;
    ctx.lineWidth = 1.5;
    hatTilePath(ctx, cell.x, cell.y, cell.rotation, cell.mirror);
    ctx.stroke();
    ctx.restore();
  });

  const cx = SAFE_CX, cy = TILE_ORIGIN_Y + (GRID_ROWS * 68) / 2 - 40;

  const capA = segProgress(local, 0.1, 0.6);
  if (capA > 0) neonText(ctx, "여기에 레이저를 쏘자", cx, 420, { size: 30, color: NEON.white, glow: 14, weight: 700, alpha: capA });

  // 회절 팔랑개비 패턴: 회전하는 방사형 burst를 여러 번 겹쳐서 pinwheel 느낌
  const burstStart = 1.0;
  if (local > burstStart) {
    const spinT = local - burstStart;
    for (let k = 0; k < 6; k++) {
      const angle = spinT * 0.6 + (k / 6) * Math.PI * 2;
      const armLen = 220 + 40 * Math.sin(spinT * 1.3 + k);
      const ax = cx + Math.cos(angle) * armLen, ay = cy + Math.sin(angle) * armLen;
      const armAlpha = 0.5 + 0.3 * Math.sin(spinT * 2 + k);
      ctx.save();
      ctx.globalAlpha = armAlpha;
      ctx.strokeStyle = k % 2 === 0 ? NEON.cyan : NEON.magenta;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.restore();
    }
    drawFlare(ctx, cx, cy, 70, 0.5, NEON.white);
  }

  const p2 = segProgress(local, 1.6, 2.2);
  if (p2 > 0) neonText(ctx, "빛이 팔랑개비처럼 휘어진다", cx, cy + 300, { size: 28, color: NEON.magenta, glow: 16, weight: 700, alpha: p2 });
  const p3 = segProgress(local, 2.6, 3.2);
  if (p3 > 0) neonText(ctx, "회전 방향에 따라 다른 무늬 — '카이랄' 회절", cx, cy + 340, { size: 24, color: NEON.cyan, glow: 12, weight: 600, alpha: p3 });

  const cardA = segProgress(local, 0.1, 0.5);
  drawStepCard(ctx, { stepLabel: "새 발견", headline: "카이랄 회절 패턴", subtext: "기존의 '반복 안 하는' 패턴에는 없던 성질", alpha: cardA });
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
  if (p1 > 0) neonText(ctx, "실리콘 나이트라이드 박막에\n전자빔으로 패턴을 새겨 확인했다", SAFE_CX, cy, { size: 30, color: NEON.white, glow: 16, weight: 700, alpha: p1 });

  if (local > 1.2 && local < 1.8) drawBurst(ctx, SAFE_CX, cy, segProgress(local, 1.2, 1.8), { colors: [NEON.magenta, NEON.cyan, NEON.white], count: 18 });

  const cardA = segProgress(local, 1.9, 2.4);
  drawStepCard(ctx, { stepLabel: "출처", headline: "Nature Communications (2026.7.29)", subtext: "도쿄대 산업과학연구소 공동 연구팀", alpha: cardA });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClose(ctx, t) {
  const [s] = T.CLOSE;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.05 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });
  const cardA = segProgress(local, 0.1, 0.6);
  drawStepCard(ctx, { stepLabel: "생각해보기", headline: "규칙이 없어 보이는 패턴에도 숨은 대칭이 있다", subtext: "기하학이 광학의 새 실험 재료가 되고 있다", alpha: cardA });
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
  if (local > 0.8) drawBurst(ctx, WIDTH / 2, HEIGHT / 2, segProgress(local, 0.8, e - s), { colors: [NEON.magenta, NEON.cyan, NEON.white], count: 40, maxDist: 420 });
}

export function render(ctx, t) {
  t = Math.max(0, Math.min(DURATION - 0.001, t));
  if (t < T.TILE[0]) return renderHook(ctx, t);
  if (t < T.LIGHT[0]) return renderTile(ctx, t);
  if (t < T.FACT[0]) return renderLight(ctx, t);
  if (t < T.CLOSE[0]) return renderFact(ctx, t);
  if (t < T.OUTRO[0]) return renderClose(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "아인슈타인 타일이 빛을 꼬았다 (카이랄 회절 발견)",
  hashtags: ["#수학", "#기하학", "#물리", "#이슈", "#광학"],
  trendSource: "issue",
  trendNote: "2026년 7월 29일 Nature Communications 게재, 도쿄대 산업과학연구소 공동 연구. 타일은 2023년 David Smith가 처음 발견한 비주기 단일타일('hat' 타일).",
};
