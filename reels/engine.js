// reels/engine.js
// 재사용 가능한 "네온 숏폼" 캔버스 드로잉 엔진.
// 특정 주제(원뿔곡선, 무한등비급수 등)에 종속되지 않는 범용 헬퍼만 담는다.
// 각 storyboard(reels/storyboards/*.js)는 이 파일의 함수들을 조합해서 장면을 그린다.

export const WIDTH = 1080;
export const HEIGHT = 1920;

// ---------- 플랫폼 안전 영역 (TikTok / Reels / Shorts 공통) ----------
// 업로드하면 앱 자체 UI(우측 좋아요·댓글·공유 아이콘 열, 하단 계정명+캡션+
// 진행바)가 영상 위에 고정으로 덮인다. 이 영역엔 절대 핵심 콘텐츠를 놓지 않는다.
// 수치는 세 플랫폼의 통상적인 세이프존 가이드를 기준으로 보수적으로 잡았다.
export const SAFE = {
  top: 40,
  bottom: 330,   // 계정명 + 캡션 + 음원 정보 + 자체 진행바
  right: 170,    // 좋아요/댓글/공유/북마크 아이콘 열
  left: 40,
};
// 콘텐츠(다이어그램, 카드)가 실제로 놓여도 되는 영역
export const SAFE_X0 = SAFE.left;
export const SAFE_X1 = WIDTH - SAFE.right;
export const SAFE_Y0 = SAFE.top;
export const SAFE_Y1 = HEIGHT - SAFE.bottom;
export const SAFE_CX = (SAFE_X0 + SAFE_X1) / 2; // 다이어그램은 이 x를 중심으로 그린다 (WIDTH/2 아님)

export const NEON = {
  cyan: "#00fff2",
  magenta: "#ff2fd0",
  yellow: "#fff700",
  green: "#39ff88",
  purple: "#8a4dff",
  white: "#f4faff",
  black: "#020204",
};

// ---------- easing ----------
export const ease = {
  linear: (t) => t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// progress within [start,end] of the current time t, eased, clamped to [0,1]
export function segProgress(t, start, end, easeFn = ease.linear) {
  if (end <= start) return t >= end ? 1 : 0;
  return easeFn(clamp01((t - start) / (end - start)));
}

// deterministic pseudo-random (so re-renders are stable frame to frame)
export function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- background ----------
export function drawBackground(ctx, t, opts = {}) {
  ctx.fillStyle = NEON.black;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // faint drifting grid for depth
  const spacing = 90;
  const drift = (t * 14) % spacing;
  ctx.save();
  ctx.strokeStyle = "rgba(120, 160, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let x = -spacing; x < WIDTH + spacing; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + drift, 0);
    ctx.lineTo(x + drift, HEIGHT);
    ctx.stroke();
  }
  for (let y = -spacing; y < HEIGHT + spacing; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y + drift * 0.6);
    ctx.lineTo(WIDTH, y + drift * 0.6);
    ctx.stroke();
  }
  ctx.restore();

  // subtle vignette
  const grad = ctx.createRadialGradient(
    WIDTH / 2, HEIGHT / 2, HEIGHT * 0.25,
    WIDTH / 2, HEIGHT / 2, HEIGHT * 0.75
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (opts.flash) {
    ctx.fillStyle = `rgba(255,255,255,${opts.flash})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

// ---------- glow line / path primitives ----------
export function withGlow(ctx, color, blur, draw) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  draw();
  ctx.restore();
}

export function glowStroke(ctx, drawPath, color, width, glow = 24) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // outer glow pass
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = 0.9;
  drawPath();
  ctx.stroke();
  // bright core pass
  ctx.shadowBlur = glow * 0.4;
  ctx.lineWidth = Math.max(1, width * 0.4);
  ctx.strokeStyle = "#ffffff";
  ctx.globalAlpha = 0.85;
  drawPath();
  ctx.stroke();
  ctx.restore();
}

// Draw a polyline of {x,y} points, revealing only `progress` (0..1) of its
// cumulative arc length. Used for the "선이 그려지고" hand-drawn feel.
export function glowPolylineReveal(ctx, points, progress, color, width, glow = 24) {
  if (points.length < 2) return;
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    lengths.push(lengths[i - 1] + Math.hypot(dx, dy));
  }
  const total = lengths[lengths.length - 1];
  const target = total * clamp01(progress);

  const visible = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (lengths[i] <= target) {
      visible.push(points[i]);
    } else {
      const segLen = lengths[i] - lengths[i - 1];
      const remain = target - lengths[i - 1];
      const f = segLen === 0 ? 0 : remain / segLen;
      if (f > 0) {
        visible.push({
          x: points[i - 1].x + (points[i].x - points[i - 1].x) * f,
          y: points[i - 1].y + (points[i].y - points[i - 1].y) * f,
        });
      }
      break;
    }
  }
  if (visible.length < 2) return;
  glowStroke(
    ctx,
    () => {
      ctx.beginPath();
      ctx.moveTo(visible[0].x, visible[0].y);
      for (let i = 1; i < visible.length; i++) ctx.lineTo(visible[i].x, visible[i].y);
    },
    color,
    width,
    glow
  );
}

export function sampleParametric(fn, t0, t1, samples) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = t0 + ((t1 - t0) * i) / samples;
    pts.push(fn(t));
  }
  return pts;
}

// ---------- 3D-ish projection for the double cone ----------
// Simple rotation around Y then X, orthographic-with-a-bit-of-perspective projection.
export function project3D(p, { rotY = 0, tiltX = 0.55, scale = 1, cx = WIDTH / 2, cy = HEIGHT / 2, perspective = 900 }) {
  let { x, y, z } = p;
  // rotate around Y axis
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  // tilt around X axis
  const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  const depth = perspective / (perspective + z2);
  return {
    x: cx + x1 * scale * depth,
    y: cy + y2 * scale * depth,
    depth: z2,
  };
}

// ---------- text FX ----------
export function neonText(ctx, text, x, y, { size = 64, color = NEON.cyan, align = "center", weight = 800, glow = 30, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px "Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = glow * 0.3;
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// RGB-split glitch text — great for hook/cliffhanger beats
export function glitchText(ctx, text, x, y, t, opts = {}) {
  const { size = 64, color = NEON.white, align = "center", weight = 800, intensity = 6 } = opts;
  const rng = makeRng(Math.floor(t * 30));
  const jitter = () => (rng() - 0.5) * intensity;
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.font = `${weight} ${size}px "Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;

  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(0,255,255,0.85)";
  ctx.fillText(text, x + jitter(), y + jitter() * 0.4);
  ctx.fillStyle = "rgba(255,40,220,0.85)";
  ctx.fillText(text, x + jitter(), y + jitter() * 0.4);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Typewriter reveal: progress 0..1 reveals characters left to right
export function typeOnText(ctx, text, x, y, progress, opts = {}) {
  const n = Math.ceil(text.length * clamp01(progress));
  const shown = text.slice(0, n);
  neonText(ctx, shown, x, y, opts);
  return n < text.length; // still typing?
}

// Word-wrap plain caption text (used for approach/solve beats)
export function wrapLines(ctx, text, maxWidth, font) {
  ctx.save();
  ctx.font = font;
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  ctx.restore();
  return lines;
}

// ---------- particle shatter (for the logo outro) ----------
// Rasterize `draw(offCtx)` once onto an offscreen canvas, slice it into a grid
// of shards, then fly them apart based on `progress` (0 = intact, 1 = fully scattered).
export function makeShatterSprite(width, height, drawFn) {
  const off = (typeof OffscreenCanvas !== "undefined")
    ? new OffscreenCanvas(width, height)
    : Object.assign(document.createElement("canvas"), { width, height });
  off.width = width;
  off.height = height;
  const octx = off.getContext("2d");
  drawFn(octx);
  return off;
}

export function drawShatter(ctx, sprite, x, y, progress, opts = {}) {
  const { cols = 14, rows = 8, seed = 7, spread = 520, spin = 6 } = opts;
  const w = sprite.width, h = sprite.height;
  const cw = w / cols, ch = h / rows;
  const rng = makeRng(seed);
  const p = clamp01(progress);
  const eased = ease.inCubic(p);
  const fade = 1 - ease.inOutQuad(p);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = c * cw, sy = r * ch;
      const dirX = (rng() - 0.5) * 2;
      const dirY = (rng() - 0.5) * 2 - 0.3; // slight upward bias
      const dist = eased * spread * (0.5 + rng());
      const dx = dirX * dist;
      const dy = dirY * dist + eased * eased * 260; // gravity feel
      const rot = eased * spin * (rng() - 0.5);
      if (fade <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(x - w / 2 + sx + cw / 2 + dx, y - h / 2 + sy + ch / 2 + dy);
      ctx.rotate(rot);
      ctx.drawImage(sprite, sx, sy, cw, ch, -cw / 2, -ch / 2, cw, ch);
      ctx.restore();
    }
  }
}

// ---------- 77math 브랜드 레이아웃 헬퍼 ----------
// 실제 77math 채널 숏폼(외심/단위원 시리즈)의 구조를 그대로 따른다:
// 좌상단 학년·단원 브레드크럼 + 우상단 회차 번호 + 큰 제목 + 시안 부제 한 줄,
// 화면 하단 다크 카드(단계 라벨 + 헤드라인 + 보조설명), 맨 아래 진행률 바.

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 개발용: 안전영역 경계를 그려서 앱 UI에 가려지는지 눈으로 확인한다.
// player.html에 ?safe=1을 붙였을 때만 호출되고, render.mjs(실제 캡처)는 이 쿼리를
// 절대 붙이지 않으므로 최종 mp4에는 절대 나오지 않는다.
export function drawSafeZoneGuide(ctx) {
  ctx.save();
  ctx.setLineDash([16, 10]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,64,64,0.9)";
  ctx.strokeRect(SAFE_X0, SAFE_Y0, SAFE_X1 - SAFE_X0, SAFE_Y1 - SAFE_Y0);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,64,64,0.95)";
  ctx.font = `700 24px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("SAFE ZONE — 이 밖은 앱 UI에 가려짐", SAFE_X0, SAFE_Y0 - 16);
  ctx.restore();
}

export function drawHeader(ctx, { breadcrumb, title, subtitle, alpha = 1, titleY = 220 }) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textBaseline = "middle";

  ctx.textAlign = "left";
  ctx.font = `600 30px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.fillStyle = "rgba(205,220,255,0.7)";
  ctx.fillText(breadcrumb, 64, 92);

  neonText(ctx, title, WIDTH / 2, titleY, { size: 68, color: NEON.white, glow: 14, weight: 800 });
  neonText(ctx, subtitle, WIDTH / 2, titleY + 92, { size: 32, color: NEON.cyan, glow: 12, weight: 600 });
  ctx.restore();
}

export function drawStepCard(ctx, { stepLabel, headline, subtext, alpha = 1, y, h = 280 } = {}) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = SAFE_X0;
  const w = SAFE_X1 - SAFE_X0 - 20; // 우측 아이콘 열 앞에서 멈춘다
  if (y === undefined) y = SAFE_Y1 - 20 - h; // 하단 캡션/진행바 위에서 멈춘다

  ctx.fillStyle = "rgba(8,12,24,0.82)";
  roundRectPath(ctx, x, y, w, h, 30);
  ctx.fill();
  ctx.strokeStyle = "rgba(120,170,255,0.22)";
  ctx.lineWidth = 2;
  roundRectPath(ctx, x, y, w, h, 30);
  ctx.stroke();

  neonText(ctx, stepLabel, x + 44, y + 58, { size: 28, color: NEON.cyan, align: "left", glow: 10, weight: 700 });

  const headFont = `800 42px "Pretendard", "Noto Sans KR", sans-serif`;
  const lines = wrapLines(ctx, headline, w - 88, headFont);
  let cursorY = y + 126;
  for (const line of lines) {
    neonText(ctx, line, x + 44, cursorY, { size: 42, align: "left", color: NEON.white, glow: 6, weight: 800 });
    cursorY += 52;
  }
  if (subtext) {
    cursorY += 14;
    ctx.textAlign = "left";
    ctx.font = `500 27px "Pretendard", "Noto Sans KR", sans-serif`;
    ctx.fillStyle = "rgba(198,210,232,0.78)";
    for (const line of subtext.split("\n")) {
      ctx.fillText(line, x + 44, cursorY);
      cursorY += 36;
    }
  }
  ctx.restore();
}

// 하단은 플랫폼 캡션/진행바에 가려지므로, 진행률 바는 헤더 바로 아래(상단)에 둔다.
export function drawProgressBar(ctx, progress, { y = 372, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = SAFE_X0, w = SAFE_X1 - SAFE_X0 - 20;
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();

  ctx.strokeStyle = NEON.cyan;
  ctx.shadowColor = NEON.cyan;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * clamp01(progress), y);
  ctx.stroke();
  ctx.restore();
}

export function drawSparkle(ctx, x, y, size, { color = NEON.white, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 1.4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.12, -size * 0.12, size, 0);
  ctx.quadraticCurveTo(size * 0.12, size * 0.12, 0, size);
  ctx.quadraticCurveTo(-size * 0.12, size * 0.12, -size, 0);
  ctx.quadraticCurveTo(-size * 0.12, -size * 0.12, 0, -size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 77math 브랜드 로고: "77"(cyan) + "math"(magenta, italic) + 밑줄 스우시.
// 실제 채널 아웃트로처럼 좌->우 와이프로 네온사인이 켜지듯 등장한다 (타이핑/파쇄 아님).
export function drawBrandLogo(ctx, cx, cy, progress) {
  const p = clamp01(progress);
  if (p <= 0.001) return;
  ctx.save();
  roundRectPath(ctx, cx - 480, cy - 160, 960 * ease.outCubic(p), 320, 8);
  ctx.clip();

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `italic 800 128px "Pretendard", "Noto Sans KR", sans-serif`;
  const num = "77";
  const word = "math";
  const numW = ctx.measureText(num).width;
  ctx.font = `italic 800 112px "Pretendard", "Noto Sans KR", sans-serif`;
  const wordW = ctx.measureText(word).width;
  const startX = cx - (numW + 16 + wordW) / 2;

  ctx.font = `italic 800 128px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.shadowColor = NEON.cyan;
  ctx.shadowBlur = 36;
  ctx.fillStyle = NEON.cyan;
  ctx.fillText(num, startX, cy + 44);

  ctx.font = `italic 800 112px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.shadowColor = NEON.magenta;
  ctx.shadowBlur = 36;
  ctx.fillStyle = NEON.magenta;
  ctx.fillText(word, startX + numW + 16, cy + 44);

  ctx.beginPath();
  ctx.moveTo(startX + numW - 6, cy + 74);
  ctx.quadraticCurveTo(startX + numW + wordW * 0.5, cy + 128, startX + numW + wordW + 46, cy + 58);
  ctx.strokeStyle = NEON.magenta;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.shadowColor = NEON.magenta;
  ctx.shadowBlur = 26;
  ctx.stroke();
  ctx.restore();
}

// ---------- ambient sparks (fills "화려하고 시선을 뺏는" screen space) ----------
export function drawSparks(ctx, t, count, colorList = [NEON.cyan, NEON.magenta, NEON.yellow]) {
  const rng = makeRng(1234);
  for (let i = 0; i < count; i++) {
    const seedT = (t * 0.6 + i * 3.7) % 4;
    const life = seedT / 4;
    const x = rng() * WIDTH;
    const y = rng() * HEIGHT;
    const alpha = Math.sin(life * Math.PI) * 0.6;
    if (alpha <= 0.02) continue;
    const color = colorList[i % colorList.length];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y, 2 + rng() * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 한 순간을 강조하는 방사형 파티클 폭발("화려한" 포인트 연출용).
// progress 0..1: 0=발생, 1=완전히 흩어져 사라짐. 매 프레임 t가 아니라 progress로만
// 결정되는 순수 함수라 몇 번을 다시 그려도 항상 같은 궤적이 나온다.
export function drawBurst(ctx, cx, cy, progress, opts = {}) {
  const { colors = [NEON.cyan, NEON.magenta, NEON.yellow, NEON.green], count = 22, maxDist = 260, seed = 3 } = opts;
  const p = clamp01(progress);
  if (p <= 0.001 || p >= 0.999) return;
  const rng = makeRng(seed);
  const fade = 1 - ease.inOutQuad(p);
  const dist = ease.outCubic(p) * maxDist;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.35;
    const d = dist * (0.65 + rng() * 0.6);
    const x = cx + Math.cos(angle) * d;
    const y = cy + Math.sin(angle) * d;
    const size = 3 + rng() * 3.2;
    const color = colors[i % colors.length];
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
