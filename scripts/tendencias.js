#!/usr/bin/env node
/**
 * tendencias.js — MÉTODO A (escrito por nós): coleta o que está em alta no
 * TikTok BR hoje, lendo a página Explore com Puppeteer e capturando as
 * respostas JSON do próprio feed (/api/explore/item_list) — as requisições
 * saem assinadas pelo próprio site, por isso funciona sem login e sem token.
 *
 * Salva snapshot em: entity/tendencias/YYYY-MM-DD-tiktok.json e .md
 *
 * Uso:
 *   node scripts/tendencias.js tiktok [--scroll 8] [--saidas pasta]
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const AGENTE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function args(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const chave = a.slice(2);
      const valor = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      opts[chave] = valor;
    } else opts._.push(a);
  }
  return opts;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function espera(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Extrai, de cada resposta do feed explore, os itens em formato canônico. */
function desmontaItemStruct(json) {
  const itens = [];
  const pilha = [json];
  while (pilha.length) {
    const no = pilha.pop();
    if (!no || typeof no !== "object") continue;
    if (Array.isArray(no)) {
      pilha.push(...no);
      continue;
    }
    if (no.itemStruct) pilha.push(no.itemStruct);
    if (no.desc !== undefined && (no.id !== undefined || no.author !== undefined)) {
      const tags = (no.textExtra || [])
        .map((t) => t.hashtagName)
        .filter(Boolean);
      itens.push({
        id: no.id,
        descricao: no.desc,
        autor: no.author?.uniqueId || null,
        autor_nick: no.author?.nickname || null,
        views: no.stats?.playCount ?? null,
        curtidas: no.stats?.diggCount ?? null,
        comentarios: no.stats?.commentCount ?? null,
        compartilhamentos: no.stats?.shareCount ?? null,
        duracao_s: no.video?.duration ?? null,
        criado_em: no.createTime ? new Date(parseInt(no.createTime, 10) * 1000).toISOString() : null,
        hashtags: tags,
        link: no.id ? `https://www.tiktok.com/${no.author?.uniqueId || "@"}/video/${no.id}` : null,
      });
    }
    pilha.push(...Object.values(no));
  }
  return itens;
}

async function coletarTikTok(scrolls = 8) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--lang=pt-BR", "--mute-audio", "--autoplay-policy=user-gesture-required"],
  });
  const coletados = new Map(); // id -> item
  let caracteresBrutos = 0;

  try {
    const page = await browser.newPage();
    await page.setUserAgent(AGENTE);
    await page.setViewport({ width: 1366, height: 900 });

    // intercepta as respostas do feed de exploração
    page.on("response", async (resp) => {
      try {
        const url = resp.url();
        if (!url.includes("/api/explore/item_list") && !url.includes("/api/challenge/item_list")) return;
        const tipo = (resp.headers()["content-type"] || "").toLowerCase();
        if (!tipo.includes("json")) return;
        const texto = await resp.text();
        caracteresBrutos += texto.length;
        const json = JSON.parse(texto);
        for (const it of desmontaItemStruct(json)) {
          if (it.id && !coletados.has(it.id)) coletados.set(it.id, it);
        }
      } catch (e) {
        /* resposta binária ou truncada — ignora */
      }
    });

    await page.goto("https://www.tiktok.com/explore?lang=pt-BR", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await espera(6000);

    for (let i = 0; i < scrolls; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.6));
      await espera(2200);
    }
  } finally {
    await browser.close();
  }

  const itens = [...coletados.values()];
  // ordena por views desc
  itens.sort((a, b) => (b.views || 0) - (a.views || 0));

  // ranking de hashtags pela soma de views dos vídeos coletados
  const mapaTags = new Map();
  for (const it of itens) {
    for (const t of it.hashtags || []) {
      const atual = mapaTags.get(t) || { tag: t, videos: 0, views: 0 };
      atual.videos += 1;
      atual.views += it.views || 0;
      mapaTags.set(t, atual);
    }
  }
  const hashtags = [...mapaTags.values()].sort((a, b) => b.views - a.views).slice(0, 30);

  return { fonte: "tiktok-explore-BR", itens_coletados: itens.length, bytes_coletados: caracteresBrutos, itens, hashtags };
}

function paraMarkdown(dados) {
  const linhas = [`# Tendências TikTok (explore BR) — ${hoje()}`, ""];
  linhas.push(`Itens coletados: ${dados.itens_coletados}`, "");
  if (dados.hashtags.length) {
    linhas.push("## Hashtags por audiência agregada", "");
    for (const t of dados.hashtags) {
      linhas.push(`- ${t.tag} — ${t.videos} vídeo(s), ${(t.views / 1e6).toFixed(1)}M views somadas`);
    }
    linhas.push("");
  }
  linhas.push("## Top 30 vídeos por views", "");
  for (const it of dados.itens.slice(0, 30)) {
    const v = it.views != null ? `${(it.views / 1e3).toFixed(0)}K` : "?";
    const tags = (it.hashtags || []).map((t) => "#" + t).join(" ");
    linhas.push(`- [${v}] ${it.descricao ? it.descricao.slice(0, 120).replace(/\n/g, " ") : "(sem descrição)"}`);
    linhas.push(`  — @${it.autor || "?"} · ${it.link || ""} ${tags ? "· " + tags : ""}`);
  }
  return linhas.join("\n");
}

async function main() {
  const opts = args(process.argv.slice(2));
  const fonte = (opts._[0] || "tiktok").toLowerCase();
  if (fonte !== "tiktok") {
    console.error("Uso: node scripts/tendencias.js tiktok [--scroll 8]");
    process.exit(1);
  }
  const pasta = path.resolve(opts.saidas || path.join(__dirname, "..", "entity", "tendencias"));
  fs.mkdirSync(pasta, { recursive: true });

  console.log("Coletando TikTok explore (BR) via JSON do feed...");
  const dados = await coletarTikTok(parseInt(opts.scroll || 8, 10));

  const base = path.join(pasta, `${hoje()}-tiktok`);
  fs.writeFileSync(base + ".json", JSON.stringify(dados, null, 2));
  fs.writeFileSync(base + ".md", paraMarkdown(dados));
  console.log(`Itens: ${dados.itens_coletados} | Payload JSON: ${(dados.bytes_coletados / 1024).toFixed(0)}KB`);
  console.log(`OK -> ${base}.md (e .json)`);
}

main().catch((e) => {
  console.error("FALHOU:", e.message || e);
  process.exit(1);
});
