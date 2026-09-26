// reels/engine.js
// 재사용 가능한 "네온 숏폼" 캔버스 드로잉 엔진.
// 특정 주제(원뿔곡선, 무한등비급수 등)에 종속되지 않는 범용 헬퍼만 담는다.
// 각 storyboard(reels/storyboards/*.js)는 이 파일의 함수들을 조합해서 장면을 그린다.

export const WIDTH = 1080;
export const HEIGHT = 1920;

export const NEON = {
  cyan: "#00fff2",
  magenta: "#ff2fd0",
  yellow: "#fff700",
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
