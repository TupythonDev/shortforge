#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tendencias.py — MÉTODO B (bibliotecas prontas): TikTokApi (davidteather) e
Instaloader. Complementa o Método A (scripts/tendencias.js, Puppeteer).

Papéis:
  * Método A (JS) — padrão do canal: estável, sem login, sem token, mudo.
  * Método B (este) — mais dados onde o A não alcança:
      - tiktok: vídeos de uma hashtag específica (ex.: #historia)
      - insta: posts top de uma hashtag do Instagram (público)

Uso:
  python scripts/tendencias.py tiktok --tag terror [--count 20] [--ms_token XXX]
  python scripts/tendencias.py insta --tag terror [--count 12]

Limitação conhecida (2026-11-07): a API direta do TikTok responde VAZIA quando
detecta automação sem sessão válida. Se falhar, rode com --ms_token (cole o
cookie "msToken" do seu navegador logado) ou use o Método A.
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import date

PASTA = os.path.join(os.path.dirname(__file__), "..", "entity", "tendencias")


def salvar(fonte, dados):
    os.makedirs(PASTA, exist_ok=True)
    base = os.path.join(PASTA, f"{date.today().isoformat()}-{fonte}")
    with open(base + ".json", "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    linhas = [f"# Tendências {fonte} — {date.today().isoformat()}", ""]
    for it in dados.get("itens", []):
        v = it.get("views")
        vtxt = f"{int(v) / 1000:.0f}K" if isinstance(v, (int, float)) else "?"
        linhas.append(f"- [{vtxt}] {(it.get('descricao') or '(sem descrição)')[:110]}")
        linhas.append(f"  — @{it.get('autor') or '?'} · {it.get('link') or ''}")
    with open(base + ".md", "w", encoding="utf-8") as f:
        f.write("\n".join(linhas) + "\n")
    print(f"OK -> {base}.md (e .json)")


def coletar_tiktok_hashtag(tag: str, count: int, ms_token: str | None):
    from TikTokApi import TikTokApi

    async def rodar():
        itens = []
        async with TikTokApi() as api:
            await api.create_sessions(
                num_sessions=1,
                sleep_after=3,
                browser="chromium",
                headless=True,
                override_browser_args=["--mute-audio", "--lang=pt-BR"],
                ms_tokens=[ms_token] if ms_token else None,
            )
            hashtag = api.hashtag(name=tag)
            async for video in hashtag.videos(count=count):
                d = video.as_dict
                st = d.get("stats") or {}
                doc = d.get("author") or {}
                itens.append({
                    "id": d.get("id"),
                    "descricao": d.get("desc"),
                    "autor": doc.get("uniqueId"),
                    "views": st.get("playCount"),
                    "curtidas": st.get("diggCount"),
                    "hashtags": [t.get("hashtagName") for t in (d.get("textExtra") or []) if t.get("hashtagName")],
                    "link": f"https://www.tiktok.com/{doc.get('uniqueId')}/video/{d.get('id')}",
                })
        return {"fonte": "tiktok-hashtag", "tag": tag, "itens": itens}

    return asyncio.run(rodar())


def coletar_insta_hashtag(tag: str, count: int, login: str | None = None):
    import instaloader

    L = instaloader.Instaloader(quiet=True, download_comments=False, save_metadata=True)
    if login:
        # sessão criada 1x com:  instaloader -l <login>  (grava arquivo de sessão)
        L.load_session_from_file(login)
    itens = []
    for post in L.get_hashtag_posts(tag):
        itens.append({
            "id": post.shortcode,
            "descricao": (post.caption or "")[:280],
            "autor": post.owner_username,
            "views": (post.video_view_count or 0) if post.is_video else None,
            "curtidas": post.likes,
            "comentarios": post.comments,
            "link": f"https://www.instagram.com/p/{post.shortcode}/",
        })
        if len(itens) >= count:
            break
    return {"fonte": "insta-hashtag", "tag": tag, "itens": itens}


def main():
    p = argparse.ArgumentParser(description="Coleta tendências (Método B: libs)")
    p.add_argument("fonte", choices=["tiktok", "insta"])
    p.add_argument("--tag", default="terror")
    p.add_argument("--count", type=int, default=20)
    p.add_argument("--ms_token", default=os.environ.get("TIKTOK_MS_TOKEN"))
    p.add_argument("--login", default=None, help="login do Instagram para carregar sessão salva (opcional)")
    a = p.parse_args()

    try:
        if a.fonte == "tiktok":
            salvar("tiktok-hashtag-" + a.tag, coletar_tiktok_hashtag(a.tag, a.count, a.ms_token))
        else:
            salvar("insta-hashtag-" + a.tag, coletar_insta_hashtag(a.tag, a.count, a.login))
    except Exception as e:
        nome = type(e).__name__
        print(f"FALHOU ({nome}): {e}")
        if a.fonte == "tiktok" and "Empty" in nome:
            print("\nTecido conhecido: detecção anti-bot. Opções:")
            print("  1) Rode com --ms_token <valor do cookie msToken do seu navegador>")
            print("  2) Use o Método A: node scripts/tendencias.js tiktok")
        sys.exit(1)


if __name__ == "__main__":
    main()
