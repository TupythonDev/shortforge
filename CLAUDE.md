# Estúdio de Séries Interativas — Multicanal

Instruções de trabalho para qualquer sessão de IA neste diretório. **Tudo em português do Brasil (PT-BR).**

Este repositório produz séries narrativas para **vários canais, cada um com seu tema**. Aqui ficam as regras e ferramentas comuns a todos; o que é específico de um canal fica em `canais/<canal>/` (identidade, `CLAUDE.md` do canal, referências, séries). Para preparar o ambiente em um computador novo, ver `INSTALACAO.md`.

## Canais e temas

- Cada canal tem identidade própria: nome, tema, tom, paleta, voz, contas e hashtags. Tudo isso vive em `canais/<canal>/` (`identidade.md` e o `CLAUDE.md` do canal) — **ler os dois antes de escrever ou produzir qualquer coisa para ele**
- Nunca misturar canais: nome, voz, paleta, trilha e cenas de um canal não entram em outro
- Formato padrão: **Shorts / TikTok / Reels** — vertical 9:16 (1080×1920), ~50–60s por episódio (o canal pode definir outro)
- Mecânica padrão: cada episódio termina com um **cliffhanger + votação do público** (2–3 opções nos comentários); a próxima parte é decidida pelos votos (o canal pode definir outra)
- No fim da temporada: compilar os episódios num **vídeo longo** para o canal
- Tom e público: definidos pela identidade do canal

## Fluxo de episódio (ordem fixa)

1. **Roteiro** — preencher o template em `modelos/ep01/roteiro.md` (copiar `modelos/` para `canais/<canal>/series/<serie>/`; fluxo de comandos em `modelos/LEIA.md`)
2. **Storyboard de cenas** — quebrar o roteiro em cenas de 2–4s com descrição visual de cada uma
3. **Assets visuais** — imagens/cenas geradas (quando houver) → `html/assets/`
4. **HTML animado** — um HTML por cena (CSS/JS animation, 9:16), NÃO vídeo cru — o visual do canal nasce aqui
5. **Render** — transformar HTML em MP4 vertical (gravação de navegador ou ffmpeg)
6. **Audio** — narração via VoiceStudio → `audio/` (ver regras de voz abaixo)
7. **Final** — MP4 montado com trilha, legendas queimadas e conferência dos últimos 2s (CTA visível) → `final/`
8. **Publicação** — plataformas do canal, com pergunta fixa no fim do vídeo (ex.: "O que acontece no próximo? Comenta 👇")

## Regras de roteiro

- Gancho nos **2 primeiros segundos** (frase curta e forte; nunca começar com introdução)
- Frases curtas, ritmo crescente, uma ideia por frase
- Terminar SEMPRE com cliffhanger que soa como pergunta
- **CTA de votação obrigatório** com 2–3 opções claras e mutuamente exclusivas
- **CTA de seguir obrigatório** (decisão do dono, 2026-11-08): uma frase falada curta (ex.: "Segue pra não perder o próximo", variar entre episódios) + cartão "SEGUE @<usuário do canal>" nos últimos 2s + 1 linha na legenda. Nunca antes do gancho nem no meio da história; vai junto da votação, no fim. O usuário de cada canal está na identidade dele. Episódio já publicado sem CTA de seguir não é refeito: vale só dali em diante
- Continuidade: nunca contradizer o que o público votou; vitória da votação mais alta
- Respeitar a política de monetização e de feed da plataforma para o tema do canal. Temas sensíveis (terror, violência, saúde etc.): sugerir > mostrar, nada explícito

## Regras visuais

- Paleta e estilo consistentes por canal (definidos em `canais/<canal>/`)
- Legendas grandes e legíveis SEMPRE (Shorts assistem sem som)
- Animações de 2–4s por cena; movimento barato (zoom, pan, glitch, flicker) > animação cara
- Sem reuso idêntico de cena entre episódios de séries ou canais diferentes

## Vídeo compilado da temporada

**Nunca concatenar os Shorts colados** (risco de "conteúdo duplicado" na monetização):
- abertura própria, re-ordenação leve das cenas
- trilha contínua própria e recapitulação do enredo no meio
- legendas refeitas para formato horizontal (16:9, YouTube)

## Ferramentas

### Publicação — manual / pelo navegador (decisão do dono, 2026-11-08)
- Cada canal tem suas contas (YouTube, Instagram, TikTok), criadas e logadas pelo dono; os dados ficam na identidade do canal em `canais/<canal>/identidade.md`
- **Sem API.** Os scripts de publicação por API (`publicar-yt.js`, `publicar-ig.js`, `auth-yt.js`) foram REMOVIDOS: nunca foram testados contra as APIs reais, a API do YouTube exige projeto no Google Cloud e pode travar uploads como privados, e o Google Cloud pediu verificação de identidade (CPF) sem necessidade. Continuam no histórico do git (commits anteriores a 2026-11-08) se um dia forem retomados
- Como publicar: o dono posta pelo YouTube Studio / app do Instagram / TikTok Studio, ou pede ao assistente para usar o navegador (login feito pelo dono; o assistente NUNCA digita senha, resolve CAPTCHA nem clica em publicar sem confirmação explícita de título, legenda e horário). Textos prontos de cada episódio em `canais/<canal>/series/<serie>/epXX/publicacao.md`
- `scripts/cortar.js <master.mp4> --plataforma all` → gera `<master>-tiktok/yt/reels.mp4`. **NÃO corta o final por padrão**: master dentro do limite da plataforma (tiktok 90s, yt 180s, reels 90s) sai inteiro; só corta acima disso ou com `--dur N` (e avisa quanto do final foi descartado). Lição: o corte antigo (45s do início) apagava a votação/CTA
- `.secrets/` está no gitignore — NUNCA commitar tokens

### Monetização — padrões por plataforma (verificado 2026-11-07)
- **Doctrine completa em `entity/padroes-monetizacao.md`** — ler antes das primeiras publicações de um canal
- Resumo (REVERIFICADO 2026-11-08 nas páginas oficiais; detalhes e o que ficou sem confirmação em `entity/padroes-monetizacao.md` seção 0): TikTok Rewards exige vídeo ≥60s, 10k seguidores e 100k views/30d (Brasil NÃO aparece na lista oficial e a página não fala de IA: confirmar no app; vídeos de "Série" do TikTok não são elegíveis); YouTube YPP 1k inscritos + 4.000h OU 10M views de Shorts/90d — **a partir de 2027-02-01 sobe para 8.000h ou 20M de Shorts (novos candidatos)**; Instagram: bônus só por convite, sem países/valores públicos → descoberta
- Preferir UM vídeo master de ~64s para as 3 plataformas (≥60s p/ TikTok; Shorts aceita até 3min; Reels até 90s). Versão curta 30–60s só se for REMOVER um beat do meio (nunca truncar o final com a votação)
- OBRIGATÓRIO por publicação: rotular "AI-generated content" (voz + visual), sem música licenciada, legenda abre com gancho emocional, "EP XX" na capa

### TikTok — restrição de feed e Promover (lição de 2026-11-08)
- **Lição:** um vídeo de tema sensível (terror) com IA rotulada ficou com 0 views e o anúncio do Promover foi rejeitado por "conteúdo impróprio para o feed Para você"; o recurso foi negado. O motivo exato NÃO é informado (palpites: tema sensível = "tópico sensível" e/ou conteúdo de IA = "autenticidade")
- **Regra:** NÃO pagar Promover em vídeo de tema sensível direto. Testar de forma orgânica; para promover, usar vídeo de bastidores/"como é feito" que diga com honestidade que é série com IA e qual o tema (nunca esconder o tema para passar no filtro). Preferir tom mais leve na capa e no texto (sem apelos de pânico, sem escuro total na capa). O rótulo de IA continua obrigatório
- **Checklist de feed:** capa clara (sem rosto em choque/escuro total) · legenda e capa sem chamadas alarmistas · hashtags do canal sem a do tema sensível (ex.: sem #terror) · dizer "ficção" e "feito com IA" · rótulo de IA ligado · sem Série. Não garante liberação: medir views nas primeiras horas
- Não aceitar os "Termos de serviço atualizados" do Promover sem o dono decidir (pagamento antecipado = sem reembolso do saldo)

### Tendências (TikTok/Instagram) — o que está viralizando
- **Método A — `node scripts/tendencias.js tiktok [--scroll 8]`** (PADRÃO, funciona hoje): Puppeteer abre `tiktok.com/explore?lang=pt-BR` e captura as respostas JSON do próprio feed (`/api/explore/item_list`) — as requisições saem assinadas pelo site, sem login e sem token; navegador SEMPRE com `--mute-audio` (lição: autoplay do explore jogou som na sessão do usuário)
- Saída: `entity/tendencias/YYYY-MM-DD-tiktok.json` + `.md` (top vídeos por views + hashtags por audiência agregada)
- **Método B — libs (`python scripts/tendencias.py`)**: TikTokApi (TikTok hashtag) e instaloader (Instagram hashtag); auditados contra malware e limpos
  - TikTok direto exige `--ms_token` (cookie do navegador logado) ou env `TIKTOK_MS_TOKEN` — sem token a API responde vazia (anti-bot)
  - Instagram exige sessão: criar 1x com `instaloader -l <login-de-conta-secundaria>` e rodar com `--login <login>` — sem sessão dá 403 login_required

### VoiceStudio — voz (PADRÃO)
- Com o app aberto, o REST responde em `http://localhost:3900` e o MCP em `http://localhost:3900/mcp/` (instalação e configuração: `INSTALACAO.md`, seção 4)
- **Cada canal tem sua voz oficial** (perfil do VoiceStudio), registrada na identidade/`CLAUDE.md` do canal em `canais/<canal>/`. Nunca usar a voz de um canal em outro. Listar os perfis existentes pelo app/REST antes de criar um novo; perfis descartados devem ser apagados para não confundir
- Settings padrão: `steps: 32` (qualidade), `language: "pt-BR"`
- **Gerar 3 takes por trecho e escolher o melhor** — geração não é determinística; manda `seed` para reprodutibilidade; `instruct` no `/v1/audio/speech` é aceito (200) mas NÃO produz sussurro (testado: fração de fala com tom 0,53 vs 0,02 de um perfil sussurrado) — não confiar nele
- Clone via REST: `POST /profiles` multipart (`name`, `kind=clone`, `language`, `ref_audio`) com `curl.exe` (PowerShell 5.1 não tem `-Form`); o app transcreve o `ref_text` sozinho. TTS via `POST /v1/audio/speech` (corpo JSON UTF-8: `model=omnivoice`, `voice=<profile_id>`, `response_format=wav`, `num_step=32`). **No bash do Windows, texto com acento inline em `curl -d` dá HTTP 400 (codificação)**: mande o JSON por arquivo UTF-8 (`--data-binary @arq.json`) ou use `scripts/narrar.js` (Node). Perfil `design` NÃO aceita trocar o áudio (PUT /profiles/<id>/audio → 409): crie um clone novo
- **Voz projetada (sem referência)**: `POST /profiles` com `kind=design` + `vd_states` (JSON com aspas duplas escapadas `""` no PS 5.1). Vocabulário aceito (código do app, `core/describe_voice.py`): Gender `male/female` · Age `child/teenager/young adult/middle-aged/elderly` (ou "45 years old") · Pitch `very low/low/moderate/high/very high pitch` ("deep", "bass", "baritone", "husky", "booming" → grave; "whisper" é o único Style) · Accent: 10 opções (`portuguese accent` cobre "brazilian"). Tudo fora dessa lista é IGNORADO ("unmatched") — timbre tipo "raspy", "dark" não fazem nada
- **Lição (sotaque)**: perfil de design (só descrição de texto, sem referência em português) soou estrangeiro ao dono → para vozes novas, prefira CLONE de uma gravação em PT; design só como último recurso. Em perfis de design trave sempre o sotaque em `Auto`, nunca `portuguese accent` (injeta sotaque indevido)
- Baixar sempre (!!): só confiar no arquivo salvo em `epXX/audio/` após `Invoke-WebRequest ... /audio/<id>.wav` para a pasta; a URL interna dentro de `data\outputs` expira
- **Modo `files` do MCP — caminho portátil entre PCs:** o VoiceStudio aceita UM diretório base (`OMNIVOICE_MCP_BASE_PATH`) e recebe/entrega arquivos por caminho **relativo** a ele. A base é a **raiz do repositório**, então nos pedidos usa-se `canais/<canal>/series/<serie>/epXX/audio/arquivo.wav` (nunca caminho absoluto no código ou na documentação). Em cada PC, configurar 1x com `npm run voicestudio` (passo a passo em `INSTALACAO.md`, seção 4). `scripts/narrar.js` não depende disso: fala com o REST em `localhost:3900` e salva onde o comando mandar. Enquanto a variável não estiver certa, vale o modo `resources` (baixar por URL)
- Transcrição (ASR) no app: **modelo NÃO instalado** (faster-whisper large-v3, 2,9 GB, baixar no Model Catalogue) → sem timestamps de palavra por enquanto; para sincronizar uma palavra-chave, divida a frase em segmentos separados (a palavra começa exatamente no início do segmento)
- **Lição de fala PT**: números de hora por EXTENSO ("três e três", não "03h03" que vira dígito-a-dígito) e voz mais lenta: `speed 0.9` era rápido demais para narração sombria; `speed 0.8` foi o valor validado (`VELOCIDADE` em `scripts/narrar.js`). Ajustar por canal
- **Boas práticas de vídeo validadas contra um canal de referência** (ver `canais/<canal>/referencias/`): legendas bold com contorno, palavra-chave em destaque (amarelo) e entrada animada · nenhum "EP XX" falado no áudio (nº de episódio só na capa visual — quebra a imersão) · as opções de voto A/B têm que CONTINUAR a regra do episódio atual, nunca temas soltos · um beat de respiro (tela quase vazia/escura) antes do clímax · capa card grande com a regra + nº do episódio nos 3 primeiros segundos · quando o canal for imersivo, narrar em 2ª pessoa (o espectador É o protagonista)
- **Técnica de sincronia áudio→vídeo (padrão do estúdio)**: cada frase é um segmento TTS (`audio/segmentos.json` → `scripts/narrar.js` → `audio/segs/`), `scripts/montar-narracao.js` concatena com pausa de 0,3s e grava `audio/tempos.json` (início/fim exatos) → `html/gerar.js` converte os tempos em delays de animação CSS (shots cortam no meio da pausa; ids com sufixo `b`/`c` continuam o shot anterior) · o áudio passado ao render precisa de `apad` no fim (o `-shortest` corta o vídeo no fim do áudio e some o CTA)
- **Tags de reação nativas do OmniVoice (funcionam no meio do texto, app e REST)**: `[laughter] [sigh] [confirmation-en] [question-en] [question-ah] [question-oh] [question-ei] [question-yi] [surprise-ah] [surprise-oh] [surprise-wa] [surprise-yo] [dissatisfaction-hnn]` (regex `_NONVERBAL_PATTERN` em `omnivoice/models/omnivoice.py`)
- **Tags na narração: NÃO usar por padrão** — o dono ouviu `[sigh]` `[surprise-oh]` `[question-ei]` numa narração e reprovou (2026-11-08). (Em 2026-11-07 um teste havia aprovado um "arsenal" de tags; vale a decisão mais recente.)
- **Markup de guia longo (página Audiobook do app; NÃO vale no `/v1/audio/speech`)**: `# título de capítulo` · `[voice:NAME]` troca de voz (com elenco mapeado) · `[pause 500ms]` / `[pause 1s]` · `[slow].[/slow]` · `[fast].[/fast]` · `[emphasis].[/emphasis]` · `[spell].[/spell]`
- **Pronúncia**: dicionário do app (lexicon "diga como") aplica em `pronounce=True` (padrão); override inline pontual em texto: `[[respelling]]` (fala o conteúdo sem os colchetes) ou `[[termo|respelling]]` — ex.: `[[Nuh-VAD-uh]]`
- **Emoção paramétrica** é só do motor IndexTTS2 (emo_text/emo_vector/emo_alpha), não do OmniVoice

### Som — efeitos, drone e mixagem
- Skill **sound-effects** (Barty-Bart/motion-graphics, MIT; auditada; instalação em `INSTALACAO.md`, seção 5): kit de 110 sons CC0, regras de licença e mixagem medida. Só ela foi instalada (as outras skills do repo não entram neste pipeline)
- **Openverse** (API pública, só licenças comerciais): `node scripts/sons-openverse.js buscar "termo" --cc0` / `baixar <id> --nome apelido` → `entity/sons/` + `entity/sons/CREDITOS.md`. Preferir CC0; BY exige crédito na descrição
- **Mixagem**: `node scripts/mixar-sons.js <mp4> canais/<canal>/series/<s>/epXX <saida.mp4>` — voz > efeitos > drone (sidechain), alvo **-16 LUFS e pico real < -4 dBFS medidos no MP4 exportado** (estéreo e mono). Os cues estão no próprio script e são **específicos de cada episódio** (ajuste por episódio)
- **Lição (volume)**: um filtro de voz (lowpass + compressor + eco) deixou um trecho a **-39 LUFS** (inaudível) e a checagem de "planicidade espectral" não pegou — depois de QUALQUER filtro em voz, medir LUFS do trecho e normalizar (`loudnorm`) antes de montar
- Não consigo ouvir: valide o som com fones. Conferir a licença na página de cada som antes de publicar e manter `final/CREDITS.txt`

### Pipeline HTML → vídeo (núcleo visual) — PRONTO E TESTADO
- 1 arquivo HTML por cena; animação CSS/JS; sem bundler pesado
- **Render**: `node scripts/render.js <cena.html> --duracao N --fps 30 --audio audio/narracao-final.wav --saida canais/<canal>/series/<serie>/epXX/final/arquivo.mp4` (o script avisa se o áudio for mais curto que a duração)
  - o script cria a pasta `final/` se não existir; frames passam por `tmp/` e são apagados no fim
- Cena de referência: o `html/gerar.js` de uma série existente gera a cena HTML (protagonista animado, cenários em camadas, grão, legendas, cartões de voto); `modelos/LEIA.md` tem o fluxo de comandos
- Requer **ffmpeg/ffprobe** no PATH (yt-dlp opcional); instalação em `INSTALACAO.md`
- 1080×1920, 30 fps, x264 CRF 20, AAC 192k

## Organização

```
CLAUDE.md              ← estas instruções (regras comuns a todos os canais)
INSTALACAO.md          ← requisitos e preparação do ambiente em um PC novo
package.json           ← npm test, npm run narrar|montar|render|sons|cortar|voicestudio
scripts/               ← pipeline (lib/cli.js = utilitários comuns)
tests/                 ← node --test (args, cortar, sintaxe dos scripts)
modelos/               ← templates: canal/ (CLAUDE.md e identidade.md de um canal) e ep01/ (série/episódio; LEIA.md tem o fluxo de comandos)
canais/                ← um canal por pasta
  <canal>/
    CLAUDE.md          ← tema, tom, paleta, voz oficial, contas, CTA e lições do canal
    identidade.md      ← identidade completa; descricoes-canais.md, identidade/ (avatar, banner)
    referencias/       ← canais/vídeos de referência, voz/ (áudios de referência), video/
    testes-voz/        ← takes de teste de narração
    series/<serie>/epXX/  ← roteiro.md · html/gerar.js→cena.html · audio/ (segmentos.json, tempos.json, segs/) · final/ · publicacao.md
    compilados/        ← MP4s longos das temporadas
entity/                ← o que vale para TODOS os canais: monetização, tendências, sons
  padroes-monetizacao.md
  tendencias/          ← snapshots de tendências
  sons/                ← efeitos CC0 baixados do Openverse + CREDITOS.md (compartilhados)
```

Para criar um canal novo: criar `canais/<canal>/` com `CLAUDE.md` e `identidade.md` (copiar `modelos/canal/`; passo a passo em `canais/LEIA.md`) e só então abrir séries em `canais/<canal>/series/`.

**O conteúdo de `canais/` NÃO é versionado** (`.gitignore`): o repositório guarda só a estrutura e as ferramentas. Cada canal fica só no disco; faça backup dele por conta própria (ou mantenha um repositório privado por canal dentro de `canais/<canal>/`).

## Regras da casa

- Nunca perguntar onde vão as coisas: a resposta está aqui
- Nunca apagar nada sem confirmar — tudo pode ser asset futuro
- Nomenclatura: `epXX` com zero (ep01, ep02...); datas ISO (AAAA-MM-DD); sem espaços e acentos em nome de arquivo
- Antes de "finalizar" um episódio: conferir roteiro → cenas → áudio sincronizado com legendas → 2s finais da CTA
- Exportar assets só a partir da pasta certa — arquivos soltos na raiz são temporários e podem mover para o local certo
- Rodar `npm test` depois de mexer nos scripts
