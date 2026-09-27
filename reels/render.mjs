#!/usr/bin/env node
// reels/render.mjs
// 스토리보드(캔버스 애니메이션)를 프레임 단위로 정확하게 캡처해서 mp4로 인코딩한다.
// 실시간 재생에 의존하지 않기 때문에 서버 성능과 무관하게 항상 같은 결과가 나온다.
//
// 사용법:
//   node reels/render.mjs --story conic_sections --out output/reels/conic_sections.mp4 [--fps 30]

import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };

// ES module dynamic import() is blocked by CORS under file://, so we serve
// reels/ over a throwaway local http server instead.
function serveReelsDir() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      const filePath = path.join(__dirname, urlPath === "/" ? "player.html" : urlPath);
      if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function parseArgs(argv) {
  const out = { fps: 30, safe: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--story") out.story = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--fps") out.fps = Number(argv[++i]);
    else if (a === "--safe") out.safe = true; // 안전영역 가이드를 프레임에 그려서 확인용으로만 쓴다
  }
  if (!out.story) throw new Error("--story <name> 필요 (reels/storyboards/<name>.js)");
  if (!out.out) out.out = `output/reels/${out.story}.mp4`;
  return out;
}

function findFfmpeg() {
  // Prefer a full system ffmpeg (needs libx264 for mp4) — Playwright's bundled
  // ffmpeg is a stripped build that only knows how to mux webm/vp8 screencasts.
  const which = spawnSync("which", ["ffmpeg"]);
  if (which.status === 0) return which.stdout.toString().trim();

  const candidates = [
    process.env.PLAYWRIGHT_FFMPEG_PATH,
    ...(() => {
      const root = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), ".cache", "ms-playwright");
      if (!fs.existsSync(root)) return [];
      return fs
        .readdirSync(root)
        .filter((d) => d.startsWith("ffmpeg-"))
        .map((d) => path.join(root, d, "ffmpeg-linux"));
    })(),
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return "ffmpeg";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(__dirname, "..");
  const outPath = path.isAbsolute(args.out) ? args.out : path.join(projectRoot, args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), "reel-frames-"));
  console.log(`[render] story=${args.story} fps=${args.fps} frames_dir=${framesDir}`);

  const server = await serveReelsDir();
  const port = server.address().port;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

  const playerUrl = `http://127.0.0.1:${port}/player.html?story=${encodeURIComponent(args.story)}&capture=1${args.safe ? "&safe=1" : ""}`;
  await page.goto(playerUrl);
  await page.waitForFunction(() => typeof window.renderFrame === "function" && typeof window.__DURATION__ === "number");
  const duration = await page.evaluate(() => window.__DURATION__);
  const totalFrames = Math.ceil(duration * args.fps);
  console.log(`[render] duration=${duration.toFixed(2)}s total_frames=${totalFrames}`);

  const canvas = page.locator("#c");
  for (let i = 0; i < totalFrames; i++) {
    const t = Math.min(duration - 1 / args.fps / 2, i / args.fps);
    await page.evaluate((tt) => window.renderFrame(tt), t);
    const framePath = path.join(framesDir, `frame_${String(i).padStart(5, "0")}.png`);
    await canvas.screenshot({ path: framePath });
    if (i % 30 === 0 || i === totalFrames - 1) {
      console.log(`[render] frame ${i + 1}/${totalFrames}`);
    }
  }

  await browser.close();
  server.close();

  const ffmpeg = findFfmpeg();
  console.log(`[render] encoding with ${ffmpeg}`);
  const result = spawnSync(
    ffmpeg,
    [
      "-y",
      "-framerate", String(args.fps),
      "-i", path.join(framesDir, "frame_%05d.png"),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-crf", "18",
      "-preset", "medium",
      "-movflags", "+faststart",
      outPath,
    ],
    { stdio: "inherit" }
  );
  if (result.status !== 0) {
    throw new Error(`ffmpeg exited with status ${result.status}`);
  }

  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log(`[render] done -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
