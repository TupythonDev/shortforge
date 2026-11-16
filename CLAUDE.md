# ShortForge — Estúdio de Séries Multicanal

Séries narrativas em vídeo vertical para vários canais, cada um com seu tema. **Tudo em PT-BR.**

O que é de um canal fica em `canais/<canal>/` (`CLAUDE.md` e `identidade.md` dele: tema, tom, paleta, voz, contas, formato). **Ler os dois antes de produzir para o canal; o que o canal definir vale sobre os padrões daqui.**

## Regras (poucas, e valem sempre)

- **Não misturar canais**: nome, voz, paleta, trilha e cenas de um canal não entram em outro, salvo decisão do dono registrada no `CLAUDE.md` do canal
- **Não apagar nada sem confirmar** — tudo pode ser asset futuro
- **Publicação só com o dono**: sem API; o login é dele; o assistente nunca digita senha, resolve CAPTCHA nem clica em publicar sem confirmação explícita de título, legenda e horário. Não pagar Promover nem aceitar termos sem ele decidir
- **Nunca commitar tokens** (`.secrets/` está no gitignore)
- **Uso de IA:** responder com honestidade à pergunta de cada plataforma, pelo que ela pergunta de fato (detalhes em `docs/publicacao.md`). Não usar música licenciada
- **Continuidade**: numa série com vários episódios, nunca contradizer o que o público votou
- **O final do vídeo é intocável**: nenhum corte ou render pode comer a votação/CTA; conferir os últimos 2 s antes de dar um episódio por pronto
- Temas sensíveis: sugerir em vez de mostrar, nada explícito

## Padrões (ponto de partida; o canal ou o dono podem mudar)

- Formato: vertical 9:16 (1080×1920), um master de ~64 s para as três plataformas
- **Uma história = um episódio**, contada inteira (começo, tensão, virada, final). Dividir em vários episódios só quando o dono pedir
- Abertura: a fala começa no segundo 0, com a frase mais forte da história, e há texto na tela desde o primeiro quadro. Câmera de ambientação corre por baixo da fala, nunca antes dela
- Roteiro: frases curtas, uma ideia por frase
- Fim do episódio: a votação (2–3 opções claras) entra em cartão junto da última fala da história, sem pausa nem troca de clima; CTA falado de no máximo ~3 s; cartão "SEGUE @usuário" nos últimos 2 s; 1 linha na legenda
- Descrição: gancho, pergunta da votação, @ do canal e hashtags. Sem "feito com IA" e sem lista de créditos de sons CC0 (crédito só quando a licença exigir, como CC BY)
- Título: curto (alvo de até ~40 caracteres), uma pergunta ou imagem forte; não resumir a história
- Visual: legendas grandes sempre (assiste-se sem som), paleta do canal, movimento barato (zoom, pan) antes de animação cara, sem cena repetida entre séries
- Som: nunca só narração; voz > efeitos > fundo, -16 LUFS (o `mixar-sons.js` mede e ajusta sozinho)
- Fluxo usual: roteiro → cena HTML → narração → render → mixagem → conferência → publicação → limpeza (skill `concluir-episodio`: simula, mostra e só apaga com o sim do dono). A ordem pode mudar quando fizer sentido (ex.: narrar antes de animar para sincronizar pelos tempos)

## Manuais (ler só quando a tarefa pedir)

| Tarefa | Arquivo |
|---|---|
| Criar cena, renderizar, compilado da temporada | `docs/video.md` |
| Narração, clones, takes, sincronia voz→vídeo | `docs/voz.md` |
| Efeitos, música, mixagem | `docs/som.md` |
| Publicar, monetização, restrições do TikTok, tendências | `docs/publicacao.md` e `entity/padroes-monetizacao.md` |
| Preparar um PC novo | `INSTALACAO.md` |
| Abrir canal ou série | `canais/LEIA.md`, `modelos/LEIA.md` |

Os manuais guardam lições já aprendidas (o que deu errado e por quê). Lição nova vai para o manual do assunto, ou para o `CLAUDE.md` do canal se for só dele — não para este arquivo.

## Comandos

```
npm run narrar  -- <segmentos.json> <pasta-audio>        # takes de TTS (VoiceStudio em localhost:3900)
npm run montar  -- <pasta-audio> [--lufs -18]            # narracao.wav + tempos.json
npm run palavras -- <pasta-audio>                        # tempo de cada palavra em tempos.json (Whisper local)
npm run render  -- <cena.html> --audio <wav> --saida <mp4>
npm run sons    -- <mp4> <pasta-ep> <saida.mp4>          # mixa voz + cues.js do episódio
npm run sons:buscar -- "termo" --cc0                     # Openverse → entity/sons/
npm run limpar  -- <pasta-do-episodio> [--apagar]        # simula a limpeza de takes e intermediários; só apaga com --apagar e o OK do dono
npm run cortar  -- <master.mp4> --plataforma all
npm test                                                 # depois de mexer em scripts/
```

## Onde ficam as coisas

```
scripts/  tests/  docs/        ← ferramentas e manuais (versionados)
modelos/                       ← templates de canal e de episódio
entity/                        ← comum a todos: monetização, tendências, sons CC0 (+ CREDITOS.md)
canais/<canal>/                ← NÃO versionado; backup por conta do dono
  CLAUDE.md  identidade.md  referencias/  testes-voz/  compilados/
  series/<serie>/epXX/         ← roteiro.md · html/ · audio/ · final/ · cues.js · publicacao.md
```

Nomes: `epXX` com zero, datas ISO, sem espaços nem acentos em arquivo. Arquivo solto na raiz é temporário.
