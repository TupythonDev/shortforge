# ShortForge

Estúdio de séries narrativas em vídeo vertical. Ferramentas para produzir séries narrativas em vídeo vertical (Shorts, Reels, TikTok) a partir de código: o roteiro vira narração por TTS, a cena é uma página HTML animada, o render sai pelo Chromium e a mixagem pelo ffmpeg.

O repositório guarda **as ferramentas, os manuais e os modelos**. O conteúdo de cada canal (roteiros, vozes, vídeos) fica só no disco de quem produz, em `canais/`, e não é versionado.

## O que ele faz

| Etapa | Comando | Resultado |
|---|---|---|
| Narração | `npm run narrar` | vários takes de TTS por trecho do roteiro (VoiceStudio local) |
| Montagem da voz | `npm run montar` | `narracao.wav` e `tempos.json`, com o instante de cada fala |
| Cena | `node <ep>/html/gerar.js` | página HTML com legendas sincronizadas pelos tempos |
| Render | `npm run render` | MP4 1080×1920, quadro a quadro, em paralelo e pela GPU |
| Som | `npm run sons` | voz + efeitos + fundo, normalizado em -16 LUFS |
| Cortes | `npm run cortar` | versões por plataforma a partir de um master |

Extras: `npm run sons:buscar` procura sons CC0 no Openverse, e `scripts/tendencias.js` coleta tendências para pauta.

## Requisitos

- Windows 10/11 (os scripts foram escritos e testados nele)
- Node.js 22 ou mais novo
- ffmpeg e ffprobe no PATH
- [VoiceStudio](https://github.com/debpalash/VoiceStudio) aberto em `localhost:3900`, para narrar
- Placa de vídeo com driver atual (sem ela o render funciona com `--sem-gpu`, bem mais devagar)
- Skill `sound-effects` do Claude Code, de onde o `mixar-sons.js` lê o kit de efeitos

O passo a passo completo, com versões, opcionais e problemas comuns, está em [INSTALACAO.md](INSTALACAO.md).

## Começar

```powershell
git clone <url-do-repositorio> estudio-series
cd estudio-series
npm install
npm test
```

O modelo de episódio já vem com uma cena que funciona sem voz. Para ver um vídeo sair antes de configurar a narração:

```powershell
node modelos/ep01/html/gerar.js
npm run render -- modelos/ep01/html/cena.html --duracao 24.57 --saida modelos/ep01/final/teste.mp4
```

Sem narração, o render precisa do `--duracao` em segundos (o `gerar.js` imprime o valor estimado); com `--audio`, ele usa a duração do áudio.

Depois disso:

1. Crie um canal copiando `modelos/canal/` para `canais/<canal>/` e preencha o `CLAUDE.md` e a `identidade.md` dele (tema, tom, paleta, voz). Detalhes em [canais/LEIA.md](canais/LEIA.md).
2. Copie `modelos/ep01/` para `canais/<canal>/series/<serie>/ep01/` e siga o fluxo de [modelos/LEIA.md](modelos/LEIA.md).

## Fluxo de um episódio

Da raiz do projeto, com `EP=canais/<canal>/series/<serie>/ep01`:

```
npm run narrar -- $EP/audio/segmentos.json $EP/audio      # takes de TTS (VOZ_PERFIL=<id do perfil>)
npm run montar -- $EP/audio                               # narracao.wav + tempos.json
node $EP/html/gerar.js                                    # cena sincronizada com os tempos
npm run render -- $EP/html/cena.html --audio <wav> --saida $EP/final/ep01-v1.mp4
npm run sons   -- $EP/final/ep01-v1.mp4 $EP $EP/final/ep01.mp4
npm run cortar -- $EP/final/ep01.mp4 --plataforma all
```

Os efeitos sonoros de cada episódio são descritos em `cues.js` (modelo em `modelos/ep01/cues.exemplo.js`). Sem esse arquivo, a mixagem leva só voz e fundo.

## Estrutura

```
scripts/     ferramentas (narrar, montar, render, mixar, cortar, tendências)
tests/       testes dos scripts (node --test)
docs/        manuais: video.md, voz.md, som.md, publicacao.md
modelos/     templates de canal e de episódio
entity/      comum a todos os canais: sons CC0, padrões de monetização
canais/      um diretório por canal — fora do Git, backup por conta de quem produz
```

## Manuais

| Assunto | Arquivo |
|---|---|
| Criar cena, renderizar, compilado de temporada | [docs/video.md](docs/video.md) |
| Narração, clones de voz, takes, sincronia | [docs/voz.md](docs/voz.md) |
| Efeitos, música, mixagem | [docs/som.md](docs/som.md) |
| Publicação, monetização, restrições das plataformas | [docs/publicacao.md](docs/publicacao.md) |
| Preparar um computador novo | [INSTALACAO.md](INSTALACAO.md) |

Os manuais registram também o que já deu errado e por quê; vale ler o do assunto antes de mexer.

## Uso com o Claude Code

O projeto foi pensado para ser operado com o [Claude Code](https://claude.com/claude-code): o [CLAUDE.md](CLAUDE.md) da raiz traz as regras e os padrões de produção, e cada canal tem o seu próprio `CLAUDE.md`. Os scripts não dependem dele e rodam direto pelo terminal.

## Sons e créditos

Os arquivos de `entity/sons/` são de domínio público (CC0), com exceção de uma música em CC BY, que pede crédito ao autor. A origem e a licença de cada um estão em [entity/sons/CREDITOS.md](entity/sons/CREDITOS.md). Ao acrescentar um som, registre-o lá.

## Licença

O código e os manuais estão sob a [licença MIT](LICENSE). Os sons de `entity/sons/` seguem a licença de cada arquivo, listada no `CREDITOS.md`.
