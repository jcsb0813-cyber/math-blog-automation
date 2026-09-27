// reels/storyboards/fibonacci_factcheck.js
// 주제: 피보나치, 얼마나 진짜일까? — "fibonacci.js" 편의 클리프행어
// ("정말 모든 자연이 피보나치를 따를까?")에 답하는 후속편.
// 새 장면 형식: 주장 → "사실/과장" 도장(drawStamp) → 진짜 설명. 9:16, 1080x1920, 소리 없음.

import {
  WIDTH, HEIGHT, NEON, ease, segProgress, clamp01,
  drawBackground, neonText, drawSparkle, drawDust,
  drawHeader, drawStepCard, drawProgressBar, drawBrandLogo, drawBurst, drawFlare,
  drawStamp, SAFE_CX, SAFE_Y1,
} from "../engine.js";

// ---------- 타임라인 (초) ----------
const CLAIM_DUR = 3.8;
export const T = {
  HOOK: [0.0, 2.2],
  CLAIM1: [2.2, 2.2 + CLAIM_DUR],
  CLAIM2: [6.0, 6.0 + CLAIM_DUR],
  CLAIM3: [9.8, 9.8 + CLAIM_DUR],
  CLAIM4: [13.6, 13.6 + CLAIM_DUR],
  SUMMARY: [17.4, 20.2],
  CLIFF: [20.2, 22.2],
  OUTRO: [22.2, 24.2],
};
export const DURATION = T.OUTRO[1];
const CONTENT_END = T.CLIFF[1];

const HEADER = {
  breadcrumb: "고등 · 수열",
  title: "피보나치, 얼마나 진짜일까?",
  subtitle: "진짜와 과장된 속설을 가려본다",
};

// ---------- 팩트체크 4개 ----------
const CLAIMS = [
  {
    seg: "CLAIM1",
    claim: "해바라기 씨앗 나선 = 피보나치 수",
    verdict: "사실",
    verdictColor: NEON.green,
    detail: "대부분의 해바라기가 34, 55, 89개 같은\n피보나치 나선 수를 갖는다 (실측 확인됨)",
  },
  {
    seg: "CLAIM2",
    claim: "앵무조개 껍데기 = 황금나선",
    verdict: "과장",
    verdictColor: NEON.magenta,
    detail: "로그나선인 건 맞지만 실측 성장비는\n보통 1.3 근처 — 황금비 1.618과 다르다",
  },
  {
    seg: "CLAIM3",
    claim: "파르테논 신전 = 황금비로 설계",
    verdict: "과장",
    verdictColor: NEON.magenta,
    detail: "고대 건축가가 황금비를 썼다는 기록이 없고\n실측도 딱 들어맞지 않는다",
  },
  {
    seg: "CLAIM4",
    claim: "식물 잎이 137.5°(황금각) 간격으로 난다",
    verdict: "사실",
    verdictColor: NEON.green,
    detail: "성장호르몬(옥신)의 확산 패턴이\n이 각도를 만든다는 게 실험으로 확인됐다",
  },
];

function decorate(ctx, t) {
  drawDust(ctx, t, 70);
  const pulse = 0.55 + 0.35 * Math.sin(t * 1.6);
  drawSparkle(ctx, WIDTH - 84, HEIGHT - 620, 20, { color: NEON.white, alpha: pulse });
  drawSparkle(ctx, 78, 640, 13, { color: NEON.cyan, alpha: pulse * 0.7 });
}

// ---------- 세그먼트별 렌더 ----------
function renderHook(ctx, t) {
  const [s] = T.HOOK;
  const local = t - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.5 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: segProgress(local, 0.0, 0.5) });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.5, 1.0);
  if (p1 > 0) neonText(ctx, "지난 편에서 본 사례들,", SAFE_CX, cy, { size: 44, color: NEON.white, glow: 16, weight: 700, alpha: p1 });
  const p2 = segProgress(local, 1.0, 1.5);
  if (p2 > 0) neonText(ctx, "전부 진짜였을까?", SAFE_CX, cy + 70, { size: 44, color: NEON.cyan, glow: 18, weight: 800, alpha: p2 });

  const cardA = segProgress(local, 1.5, 2.0);
  drawStepCard(ctx, {
    stepLabel: "HOOK",
    headline: "4가지 유명한 주장을 팩트체크한다",
    subtext: "사실 2개, 과장 2개 — 뭐가 뭘까?",
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderClaim(ctx, t, seg, item) {
  const [s, e] = seg;
  const local = t - s;
  const dur = e - s;
  drawBackground(ctx, t, { flash: local < 0.06 ? 0.4 : 0 });
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.38;
  const claimA = segProgress(local, 0.1, 0.6);
  if (claimA > 0) {
    neonText(ctx, item.claim, SAFE_CX, cy, {
      size: 40, color: NEON.white, glow: 16, weight: 700, alpha: claimA,
    });
  }

  const stampP = segProgress(local, 0.7, 1.15);
  if (stampP > 0) {
    drawStamp(ctx, SAFE_CX, cy + 160, item.verdict, item.verdictColor, stampP);
  }
  if (local > 0.7 && local < 1.4) {
    drawBurst(ctx, SAFE_CX, cy + 160, segProgress(local, 0.7, 1.45), {
      colors: [item.verdictColor, NEON.white], count: 22, maxDist: 220,
    });
  }

  const cardA = segProgress(local, 1.6, 2.1);
  drawStepCard(ctx, {
    stepLabel: item.verdict === "사실" ? "판정: 사실" : "판정: 과장",
    headline: item.claim,
    subtext: item.detail,
    alpha: cardA,
  });
  drawProgressBar(ctx, t / CONTENT_END);
}

function renderSummary(ctx, t) {
  const [s] = T.SUMMARY;
  const local = t - s;
  drawBackground(ctx, t);
  decorate(ctx, t);
  drawHeader(ctx, { ...HEADER, alpha: 1 });

  const cy = SAFE_Y1 * 0.4;
  const p1 = segProgress(local, 0.1, 0.6);
  const p2 = segProgress(local, 0.7, 1.2);
  if (p1 > 0) neonText(ctx, "진짜 이유는 신비가 아니라", SAFE_CX, cy - 50, { size: 38, color: NEON.white, glow: 14, weight: 700, alpha: p1 });
  if (p2 > 0) neonText(ctx, "'최적의 공간 배치'", SAFE_CX, cy + 30, { size: 46, color: NEON.yellow, glow: 22, weight: 900, alpha: p2 });

  if (local > 1.1 && local < 1.7) drawBurst(ctx, SAFE_CX, cy + 30, segProgress(local, 1.1, 1.7), { colors: [NEON.yellow, NEON.cyan], count: 24 });

  const cardA = segProgress(local, 1.8, 2.3);
  drawStepCard(ctx, {
    stepLabel: "결론",
    headline: "황금각으로 자라면 절대 안 겹친다",
    subtext: "신비주의가 아니라 생존에 유리한 수학이다",
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
    headline: "그럼 '황금비 얼굴'은 진짜 있을까?",
    subtext: "동공 확대·착시 효과의 비밀, 다음 영상에서",
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
  if (t < T.CLAIM1[0]) return renderHook(ctx, t);
  if (t < T.CLAIM2[0]) return renderClaim(ctx, t, T.CLAIM1, CLAIMS[0]);
  if (t < T.CLAIM3[0]) return renderClaim(ctx, t, T.CLAIM2, CLAIMS[1]);
  if (t < T.CLAIM4[0]) return renderClaim(ctx, t, T.CLAIM3, CLAIMS[2]);
  if (t < T.SUMMARY[0]) return renderClaim(ctx, t, T.CLAIM4, CLAIMS[3]);
  if (t < T.CLIFF[0]) return renderSummary(ctx, t);
  if (t < T.OUTRO[0]) return renderCliff(ctx, t);
  return renderOutro(ctx, t);
}

export const meta = {
  title: "해바라기는 진짜, 앵무조개는 과장? (피보나치 팩트체크)",
  hashtags: ["#두뇌", "#수학", "#팩트체크", "#황금비", "#피보나치"],
};
