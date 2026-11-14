# Publicação, monetização e tendências

Manual de consulta: ler antes de publicar ou de pesquisar tendências. Reúne lições já aprendidas na prática.

## Publicação — manual / pelo navegador
- Cada canal tem suas contas (YouTube, Instagram, TikTok), criadas e logadas pelo dono; os dados ficam na identidade do canal em `canais/<canal>/identidade.md`
- **Sem API.** Este repositório não publica por API: a do YouTube exige projeto no Google Cloud (que pode pedir verificação de identidade) e pode travar uploads como privados. Publicação é manual ou pelo navegador
- Como publicar: o dono posta pelo YouTube Studio / app do Instagram / TikTok Studio, ou pede ao assistente para usar o navegador (login feito pelo dono; o assistente NUNCA digita senha, resolve CAPTCHA nem clica em publicar sem confirmação explícita de título, legenda e horário). Textos prontos de cada episódio em `canais/<canal>/series/<serie>/epXX/publicacao.md`
- `scripts/cortar.js <master.mp4> --plataforma all` → gera `<master>-tiktok/yt/reels.mp4`. **NÃO corta o final por padrão**: master dentro do limite da plataforma (tiktok 90s, yt 180s, reels 90s) sai inteiro; só corta acima disso ou com `--dur N` (e avisa quanto do final foi descartado). Lição: o corte antigo (45s do início) apagava a votação/CTA
- `.secrets/` está no gitignore — NUNCA commitar tokens

## Monetização — padrões por plataforma (verificado 2026-11-07)
- **Doctrine completa em `entity/padroes-monetizacao.md`** — ler antes das primeiras publicações de um canal
- Resumo (REVERIFICADO 2026-11-08 nas páginas oficiais; detalhes e o que ficou sem confirmação em `entity/padroes-monetizacao.md` seção 0): TikTok Rewards exige vídeo ≥60s, 10k seguidores e 100k views/30d (Brasil NÃO aparece na lista oficial e a página não fala de IA: confirmar no app; vídeos de "Série" do TikTok não são elegíveis); YouTube YPP 1k inscritos + 4.000h OU 10M views de Shorts/90d — **a partir de 2027-02-01 sobe para 8.000h ou 20M de Shorts (novos candidatos)**; Instagram: bônus só por convite, sem países/valores públicos → descoberta
- Preferir UM vídeo master de ~64s para as 3 plataformas (≥60s p/ TikTok; Shorts aceita até 3min; Reels até 90s). Versão curta 30–60s só se for REMOVER um beat do meio (nunca truncar o final com a votação)
- OBRIGATÓRIO por publicação: rotular "AI-generated content" (voz + visual), sem música licenciada, legenda abre com gancho emocional, "EP XX" na capa

## TikTok — restrição de feed e Promover (lição de 2026-11-08)
- **Lição:** um vídeo de tema sensível (terror) com IA rotulada ficou com 0 views e o anúncio do Promover foi rejeitado por "conteúdo impróprio para o feed Para você"; o recurso foi negado. O motivo exato NÃO é informado (palpites: tema sensível = "tópico sensível" e/ou conteúdo de IA = "autenticidade")
- **Regra:** NÃO pagar Promover em vídeo de tema sensível direto. Testar de forma orgânica; para promover, usar vídeo de bastidores/"como é feito" que diga com honestidade que é série com IA e qual o tema (nunca esconder o tema para passar no filtro). Preferir tom mais leve na capa e no texto (sem apelos de pânico, sem escuro total na capa). O rótulo de IA continua obrigatório
- **Checklist de feed:** capa clara (sem rosto em choque/escuro total) · legenda e capa sem chamadas alarmistas · hashtags do canal sem a do tema sensível (ex.: sem #terror) · dizer "ficção" e "feito com IA" · rótulo de IA ligado · sem Série. Não garante liberação: medir views nas primeiras horas
- Não aceitar os "Termos de serviço atualizados" do Promover sem o dono decidir (pagamento antecipado = sem reembolso do saldo)

## Tendências (TikTok/Instagram) — o que está viralizando
- **Método A — `node scripts/tendencias.js tiktok [--scroll 8]`** (PADRÃO, funciona hoje): Puppeteer abre `tiktok.com/explore?lang=pt-BR` e captura as respostas JSON do próprio feed (`/api/explore/item_list`) — as requisições saem assinadas pelo site, sem login e sem token; navegador SEMPRE com `--mute-audio` (lição: autoplay do explore jogou som na sessão do usuário)
- Saída: `entity/tendencias/YYYY-MM-DD-tiktok.json` + `.md` (top vídeos por views + hashtags por audiência agregada)
- **Método B — libs (`python scripts/tendencias.py`)**: TikTokApi (TikTok hashtag) e instaloader (Instagram hashtag); auditados contra malware e limpos
  - TikTok direto exige `--ms_token` (cookie do navegador logado) ou env `TIKTOK_MS_TOKEN` — sem token a API responde vazia (anti-bot)
  - Instagram exige sessão: criar 1x com `instaloader -l <login-de-conta-secundaria>` e rodar com `--login <login>` — sem sessão dá 403 login_required
