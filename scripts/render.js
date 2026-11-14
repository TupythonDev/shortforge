#!/usr/bin/env node
/**
 * render.js — renderiza um HTML animado (cena de episódio) em MP4 vertical 1080x1920.
 *
 * HTML animado (CSS/JS) -> vários Chromes capturam os quadros em paralelo (cada quadro é um
 * instante fixo da animação, então o resultado é determinístico) -> os JPEGs vão direto para o
 * ffmpeg por pipe, em ordem (nada passa pelo disco) -> MP4, com a narração se houver --audio.
 *
 * Uso:
 *   node scripts/render.js <cena.html> --saida final/ep01.mp4 [--audio audio/narracao.wav] [--duracao 10] [--fps 30]
 *
 *   --duracao N   segundos; sem ela, usa a duração do --audio
 *   --workers N   Chromes em paralelo (padrão: metade dos núcleos, no máximo 6)
 *   --sem-gpu     desenha por software (lento, ~1 quadro/s); só para máquina sem placa de vídeo
 *
 * A cena pode definir window.renderTempo(segundos) (canvas/three.js): ela tem que ser função pura
 * do tempo, porque os quadros são pedidos fora de ordem. window.__carregando = true segura o início.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { args, falhar, arquivoObrigatorio, probeDuracao } = require("./lib/cli");

const ROOT = path.resolve(__dirname, "..");
const LARGURA = 1080;
const ALTURA = 1920;

/** Abre um Chrome com a cena carregada e as animações CSS pausadas, pronta para receber tempos. */
async function abrirCena(puppeteer, cena, gpu) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--allow-file-access-from-files", // módulos ES (three.js) de node_modules via file://
      ...(gpu ? ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
      `--window-size=${LARGURA},${ALTURA}`,
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: LARGURA, height: ALTURA, deviceScaleFactor: 1 });
    await page.goto("file:///" + cena.replace(/\\/g, "/"), { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready.then(() => null));
    await page.waitForFunction(() => !window.__carregando, { timeout: 120000 });
    await page.evaluate(() => document.getAnimations().forEach((a) => a.pause && a.pause()));
    return { browser, page };
  } catch (e) {
    await browser.close();
    throw e;
  }
}

async function quadro(page, seg) {
  await page.evaluate((s) => {
    document.getAnimations().forEach((a) => { try { a.currentTime = s * 1000; } catch (e) { /* animação já terminada */ } });
    if (typeof window.renderTempo === "function") window.renderTempo(s);
  }, seg);
  return page.screenshot({ type: "jpeg", quality: 92, optimizeForSpeed: true });
}

async function main() {
  const opts = args(process.argv.slice(2), { booleanas: ["gpu", "sem-gpu"] });
  const cena = arquivoObrigatorio(opts._[0], "o HTML da cena (ex.: node scripts/render.js cena.html --duracao 10 --saida ep01.mp4)");
  const saida = path.resolve(opts.saida || path.join(ROOT, "saida.mp4"));
  const fps = parseInt(opts.fps || 30, 10);
  const audio = opts.audio ? path.resolve(opts.audio) : null;
  const gpu = !opts["sem-gpu"];

  if (audio && !fs.existsSync(audio)) falhar(`ERRO: áudio não encontrado: ${audio}`);
  const dAudio = audio ? probeDuracao(audio) : null;
  const duracao = opts.duracao ? parseFloat(opts.duracao) : dAudio;
  if (!duracao) falhar("ERRO: informe --duracao ou passe --audio para herdar a duração da narração.");
  // -shortest corta o vídeo no fim do áudio: avisar em vez de entregar um MP4 mais curto sem aviso
  if (audio && dAudio < duracao - 0.05) console.warn(`AVISO: o áudio (${dAudio.toFixed(2)}s) é mais curto que a duração pedida (${duracao.toFixed(2)}s); o MP4 vai sair com ${dAudio.toFixed(2)}s. Use apad no áudio para manter o final.`);

  const frames = Math.round(duracao * fps);
  const workers = Math.max(1, Math.min(frames, parseInt(opts.workers, 10) || Math.min(6, Math.floor(os.cpus().length / 2) || 1)));
  console.log(`Cena:    ${cena}`);
  console.log(`Duração: ${duracao.toFixed(2)}s @ ${fps}fps -> ${frames} quadros · ${workers} Chrome(s) · ${gpu ? "GPU" : "software"}`);

  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const ff = spawn("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "-",
    ...(audio ? ["-i", audio] : []),
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(fps),
    ...(audio ? ["-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
    "-movflags", "+faststart", saida,
  ], { windowsHide: true, stdio: ["pipe", "ignore", "inherit"] });
  const ffFim = new Promise((ok, erro) => { ff.on("error", erro); ff.on("close", (c) => (c === 0 ? ok() : erro(new Error(`ffmpeg saiu com código ${c}`)))); });
  ffFim.catch(() => {}); // o erro é relançado no await do fim
  ff.stdin.on("error", () => {}); // ffmpeg morreu: quem informa é o "close"

  // os quadros chegam fora de ordem; ficam em `prontos` até o anterior ser gravado
  const prontos = new Map();
  let proximo = 0, gravado = 0, gravando = false, falha = null;
  const acordar = [];
  async function gravar() {
    if (gravando) return;
    gravando = true;
    while (prontos.has(gravado)) {
      const buf = prontos.get(gravado);
      prontos.delete(gravado++);
      if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once("drain", ok));
      if (gravado % (fps * 5) === 0) process.stdout.write(`  ${gravado}/${frames}\r`);
    }
    gravando = false;
    acordar.splice(0).forEach((ok) => ok());
  }

  const puppeteer = require("puppeteer");
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    let c;
    try {
      c = await abrirCena(puppeteer, cena, gpu);
      while (!falha) {
        const i = proximo++;
        if (i >= frames) break;
        // não deixa um Chrome lento acumular quadros dos outros na memória
        while (i - gravado > workers * 8 && !falha) await new Promise((ok) => acordar.push(ok));
        prontos.set(i, await quadro(c.page, i / fps));
        gravar().catch((e) => { falha = falha || e; });
      }
    } catch (e) {
      falha = falha || e;
      acordar.splice(0).forEach((ok) => ok());
    } finally {
      if (c) await c.browser.close();
    }
  }));
  if (!falha) await gravar();
  ff.stdin.end();
  if (falha) { ff.kill(); throw falha; }
  await ffFim;

  const seg = (Date.now() - t0) / 1000;
  console.log(`\nOK -> ${saida} (${probeDuracao(saida).toFixed(2)}s) em ${seg.toFixed(0)}s (${(frames / seg).toFixed(1)} quadros/s)`);
}

main().catch((e) => { console.error("FALHOU:", e.message || e); process.exit(1); });
