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
- Por publicação: sem música licenciada, legenda abre com gancho emocional, "EP XX" na capa; pergunta de uso de IA conforme a seção "Descrição e uso de IA" abaixo

## TikTok — restrição de feed e Promover (lição de 2026-11-08)
- **Lição:** um vídeo de tema sensível (terror) com IA rotulada ficou com 0 views e o anúncio do Promover foi rejeitado por "conteúdo impróprio para o feed Para você"; o recurso foi negado. O motivo exato NÃO é informado (palpites: tema sensível = "tópico sensível" e/ou conteúdo de IA = "autenticidade")
- **Regra:** NÃO pagar Promover em vídeo de tema sensível direto. Testar de forma orgânica; para promover, usar vídeo de bastidores/"como é feito" que diga com honestidade que é série com IA e qual o tema (nunca esconder o tema para passar no filtro). Preferir tom mais leve na capa e no texto (sem apelos de pânico, sem escuro total na capa).
- **Checklist de feed:** capa clara (sem rosto em choque/escuro total) · legenda e capa sem chamadas alarmistas · hashtags do canal sem a do tema sensível (ex.: sem #terror) · sem Série. Não garante liberação: medir views nas primeiras horas
- Não aceitar os "Termos de serviço atualizados" do Promover sem o dono decidir (pagamento antecipado = sem reembolso do saldo)

## Tendências (TikTok/Instagram) — o que está viralizando
- **Método A — `node scripts/tendencias.js tiktok [--scroll 8]`** (PADRÃO, funciona hoje): Puppeteer abre `tiktok.com/explore?lang=pt-BR` e captura as respostas JSON do próprio feed (`/api/explore/item_list`) — as requisições saem assinadas pelo site, sem login e sem token; navegador SEMPRE com `--mute-audio` (lição: autoplay do explore jogou som na sessão do usuário)
- Saída: `entity/tendencias/YYYY-MM-DD-tiktok.json` + `.md` (top vídeos por views + hashtags por audiência agregada)
- **Método B — libs (`python scripts/tendencias.py`)**: TikTokApi (TikTok hashtag) e instaloader (Instagram hashtag); auditados contra malware e limpos
  - TikTok direto exige `--ms_token` (cookie do navegador logado) ou env `TIKTOK_MS_TOKEN` — sem token a API responde vazia (anti-bot)
  - Instagram exige sessão: criar 1x com `instaloader -l <login-de-conta-secundaria>` e rodar com `--login <login>` — sem sessão dá 403 login_required

## Retenção em Shorts — o que a análise de um vídeo mostrou (2026-11-14)

Vídeo de 87 s, 385 visualizações (amostra pequena: vale a direção, não o número exato):
- **"Continuaram assistindo" de 14%** foi o que travou a distribuição: a primeira fala só começava aos 3,3 s (antes, só câmera) e era uma pergunta lenta; a retenção caiu de 100% para 60% entre 0:04 e 0:15. É a métrica a olhar primeiro em todo vídeo novo
- **O meio segurou** (44% a 35% por 45 s): estrutura em etapas curtas, com um detalhe estranho por etapa
- **O fim perdeu metade de quem restava** (30% para 13%): depois da última frase da história vinham 2 s de pausa, troca para a voz do narrador e mais de 10 s de votação e CTA
- **Título de 68 caracteres**: cabe no limite de 100 do YouTube, mas é longo para o feed e explicava a história em vez de provocar. Preferir o mesmo gancho curto da capa
- Daí os padrões de abertura, fim e título no `CLAUDE.md` da raiz

## Descrição e uso de IA (padrão desde 2026-11-14)

**Descrição / legenda:** gancho emocional, pergunta da votação, @ do canal, hashtags. Não escrever "feito com IA" nem listar créditos de sons CC0 (CC0 e Pixabay não exigem crédito). Crédito na descrição só quando a licença do som exigir (CC BY); o registro de todos os sons continua em `final/CREDITS.txt` do episódio, fora da descrição.

**Pergunta "Uso de IA" do YouTube Studio** (texto do próprio formulário, 2026-11): só pede "Sim" se a IA foi usada para
- fazer uma pessoa real parecer dizer ou fazer algo que não disse ou fez
- alterar a filmagem de um evento ou lugar real
- gerar uma cena com aparência realista que não existiu de verdade
- criar músicas que sejam o foco principal do vídeo

Animação 2D ilustrada com personagens fictícios não cai em nenhum dos quatro: a resposta é **Não**. Passa a ser **Sim** se o vídeo tiver cena fotorrealista, música gerada como foco, ou voz clonada de uma pessoa real identificável dizendo o que não disse (clone da voz de quem autorizou, usado como voz de personagem fictício, não é esse caso).

**TikTok e Instagram:** cada um tem a própria pergunta; responder pelo texto que aparecer na hora de publicar, com o mesmo critério (realista ou não). Não foi reverificado nas páginas oficiais deles.
