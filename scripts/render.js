#!/usr/bin/env node
/**
 * render.js — renderiza um HTML animado (cena de episode) em MP4 vertical 1080x1920.
 *
 * Pipeline do canal: HTML animado (CSS/JS) -> Puppeteer captura frame a frame
 * (controlando o tempo das animacoes) -> ffmpeg monta o MP4 (com trilha de
 * narracao opcional). Deterministico: cada frame e um tempo fixo da animacao.
 *
 * Uso:
 *   node scripts/render.js <cena.html> --duracao 10 --fps 30 --saida final/ep01.mp4 [--audio audio/narracao.wav]
 *
 * - Se --duracao for omitido e houver --audio, usa-se a duracao do audio (via ffprobe).
 * - Frames intermediarios vao para tmp/ (ignorada no git) e sao apagados ao final
 *   (sao materiais de trabalho, nunca assets).
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const puppeteer = require("puppeteer");
const { args, falhar, arquivoObrigatorio, probeDuracao } = require("./lib/cli");

const ROOT = path.resolve(__dirname, "..");
const LARGURA = 1080;
const ALTURA = 1920;

async function main() {
  const opts = args(process.argv.slice(2));
  const cena = arquivoObrigatorio(opts._[0], "o HTML da cena (ex.: node scripts/render.js cena.html --duracao 10 --saida ep01.mp4)");
  const saida = path.resolve(opts.saida || path.join(ROOT, "saida.mp4"));
  const fps = parseInt(opts.fps || 30, 10);
  const audio = opts.audio ? path.resolve(opts.audio) : null;


  // duracao: fixa em --duracao, ou herdada do audio
  let duracao = opts.duracao ? parseFloat(opts.duracao) : null;
  if (!duracao && audio) duracao = probeDuracao(audio);
  if (!duracao) {
    console.error("ERRO: informe --duracao ou passe --audio para herdar a duracao da narracao.");
    process.exit(1);
  }
  if (audio) {
    if (!fs.existsSync(audio)) falhar(`ERRO: áudio não encontrado: ${audio}`);
    const dAudio = probeDuracao(audio);
    // -shortest corta o vídeo no fim do áudio: avisar em vez de entregar um MP4 mais curto sem aviso
    if (dAudio < duracao - 0.05) console.warn(`AVISO: o áudio (${dAudio.toFixed(2)}s) é mais curto que a duração pedida (${duracao.toFixed(2)}s); o MP4 vai sair com ${dAudio.toFixed(2)}s. Use apad no áudio para manter o final.`);
  }
  const frames = Math.round(duracao * fps);
  console.log(`Cena:   ${cena}`);
  console.log(`Duracao: ${duracao.toFixed(2)}s @ ${fps}fps -> ${frames} frames`);
  if (audio) console.log(`Audio:  ${audio}`);

  const dirFrames = path.join(ROOT, "tmp", `render-${Date.now()}`);
  fs.mkdirSync(dirFrames, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--allow-file-access-from-files", // permite carregar three.js (módulo ES) de node_modules via file://
      // WebGL: por software (padrão, funciona sem GPU) ou na placa de vídeo com --gpu (cenas three.js ficam ~10x mais rápidas)
      ...(opts.gpu ? ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
      `--window-size=${LARGURA},${ALTURA}`,
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: LARGURA, height: ALTURA, deviceScaleFactor: 1 });
    await page.goto("file:///" + cena.replace(/\\/g, "/"), { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready.then(() => null));
    // cenas que carregam modelos 3D marcam window.__carregando = true até terminar
    await page.waitForFunction(() => !window.__carregando, { timeout: 120000 });

    // congela as animacoes: pausa tudo uma vez e avanca o tempo a cada frame
    await page.evaluate(() => {
      document.getAnimations().forEach((anim) => {
        if (typeof anim.pause === "function") anim.pause();
      });
    });

    for (let i = 0; i < frames; i++) {
      const t = i / fps;
      await page.evaluate((seg) => {
        document.getAnimations().forEach((anim) => {
          try { anim.currentTime = seg * 1000; } catch (e) { /* animacao já terminada */ }
        });
        // cenas com three.js: a página define window.renderTempo(segundos) e desenha o frame desse instante
        if (typeof window.renderTempo === "function") window.renderTempo(seg);
      }, t);
      await page.screenshot({
        path: path.join(dirFrames, `frame_${String(i).padStart(6, "0")}.jpg`),
        type: "jpeg",
        quality: 92,
      });
    }
    console.log("Frames capturados.");
  } finally {
    await browser.close();
  }

  // monta o MP4
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const argsFfmpeg = ["-y", "-framerate", String(fps), "-i", path.join(dirFrames, "frame_%06d.jpg")];
  if (audio) argsFfmpeg.push("-i", audio);
  argsFfmpeg.push(
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(fps),
  );
  if (audio) argsFfmpeg.push("-c:a", "aac", "-b:a", "192k", "-shortest");
  argsFfmpeg.push("-movflags", "+faststart", saida);

  execFileSync("ffmpeg", argsFfmpeg, { windowsHide: true, stdio: ["ignore", "ignore", "inherit"] });

  // limpa frames intermediarios (nunca assets)
  fs.rmSync(dirFrames, { recursive: true, force: true });

  const saidaDur = probeDuracao(saida);
  console.log(`\nOK -> ${saida} (${saidaDur.toFixed(2)}s)`);
}

main().catch((e) => { console.error("FALHOU:", e.message || e); process.exit(1); });

