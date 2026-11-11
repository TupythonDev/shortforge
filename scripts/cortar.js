#!/usr/bin/env node
/**
 * cortar.js — gera o corte por plataforma a partir do MP4 master do episódio.
 *
 * Padrões de monetização (entity/padroes-monetizacao.md):
 *   tiktok -> 60–90s  (Creator Rewards exige >=60s)
 *   yt     -> 30–60s  (Shorts; faixa campeã dos dados de tendência)
 *   reels  -> 30–60s
 *
 * Uso:
 *   node scripts/cortar.js ep01.mp4 --plataforma all
 *   node scripts/cortar.js ep01.mp4 --plataforma tiktok --dur 75
 *   node scripts/cortar.js ep01.mp4 --plataforma yt,reels --dur 45
 *
 * Saída: <pasta-do-master>/<nome>-<plataforma>.mp4
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { args, falhar, arquivoObrigatorio, probeDuracao } = require("./lib/cli");

// duracao = alvo quando o master é MAIOR que `max`; até `max` o vídeo NÃO é cortado
// (cortar o início-fim apagava a votação/cliffhanger do final).
const PERFIS = {
  tiktok: { duracao: 75, max: 90, origem: 0, largura: 1080, altura: 1920 },
  yt: { duracao: 45, max: 180, origem: 0, largura: 1080, altura: 1920 },
  reels: { duracao: 45, max: 90, origem: 0, largura: 1080, altura: 1920 },
};

/** Duração (s) do corte: --dur manda; senão mantém o master inteiro se couber em `max`. */
function duracaoDoCorte(perfil, durMaster, durPedida) {
  const disponivel = Math.max(1, durMaster - perfil.origem);
  if (durPedida) return Math.min(parseFloat(durPedida), disponivel);
  return durMaster <= perfil.max ? disponivel : Math.min(perfil.duracao, disponivel);
}

function ffmpegDe(args) {
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    windowsHide: true,
  });
}

async function main() {
  const opts = args(process.argv.slice(2));
  const master = arquivoObrigatorio(opts._[0], "o MP4 master");
  let plataformas = Object.keys(PERFIS);
  if (opts.plataforma && opts.plataforma !== "all") {
    plataformas = opts.plataforma.split(",").map((p) => p.trim()).filter(Boolean);
  }

  const durMaster = probeDuracao(master);
  const pasta = path.dirname(master);
  const nomeBase = path.basename(master, path.extname(master));
  const saidas = [];

  for (const plat of plataformas) {
    const perfil = PERFIS[plat];
    if (!perfil) {
      console.warn(`Plataforma desconhecida (${plat}); usando tiktok como perfil base`);
      continue;
    }
    const dur = duracaoDoCorte(perfil, durMaster, opts.dur);
    if (plat === "tiktok" && dur < 60) console.warn(`AVISO: ${dur.toFixed(1)}s no TikTok fica abaixo de 60s (Creator Rewards exige >= 60s).`);
    if (dur < durMaster - 1) console.warn(`AVISO [${plat}]: o corte (${dur.toFixed(1)}s) descarta os ${(durMaster - dur).toFixed(1)}s finais do master (CTA/votação?).`);
    const fim = perfil.origem + dur;
    let saida = path.join(pasta, `${nomeBase}-${plat}.mp4`);
    if (fs.existsSync(saida)) {
      // nunca sobrescrever silenciosamente: assina com sufixo
      saida = path.join(pasta, `${nomeBase}-${plat}-${Date.now()}.mp4`);
    }

    ffmpegDe([
      "-ss", String(perfil.origem),
      "-to", String(fim),
      "-i", master,
      "-vf", `scale=${perfil.largura}:${perfil.altura}:flags=lanczos,setsar=1`,
      "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
      "-c:a", "aac", "-b:a", "192k",
      "-movflags", "+faststart",
      saida,
    ]);

    const durFinal = probeDuracao(saida);
    saidas.push(saida);
    console.log(`[${plat}] ${durFinal.toFixed(1)}s -> ${saida}`);
  }

  if (saidas.length === 0) console.warn("Nada gerado — verifique --plataforma.");
}

if (require.main === module) {
  main().catch((e) => {
    console.error("FALHOU:", e.message || e);
    process.exit(1);
  });
}

module.exports = { PERFIS, duracaoDoCorte };
