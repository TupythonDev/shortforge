# Como começar uma série nova

1. Copie TODO este diretório `modelos` para `canais/<canal>/series/<nome-da-serie>/` (a série pertence a UM canal)
2. Renomeie `ep01` conforme o número do episódio (ep01, ep02...) e siga a estrutura:

```
<serie>/
  epXX/
    roteiro.md    <- preencher com o template abaixo
    html/         <- gerar.js (exemplo) -> cena.html
    assets/       <- imagens/figuras usadas nas cenas
    audio/        <- segmentos.json (texto de cada trecho), segs/ (takes), narracao.wav, tempos.json
    final/        <- MP4 vertical 1080x1920 pronto para publicar
```

Regras rápidas:
- A votação de CADA episódio é registrada no rodapé do roteiro.md correspondente
- Toda temporada termina em um compilado em `canais/<canal>/compilados/`
- Só move o que você criou — nada sem dono

Fluxo de comandos de um episódio (rodar da raiz do projeto):
```
node scripts/narrar.js canais/<canal>/series/<serie>/epXX/audio/segmentos.json canais/<canal>/series/<serie>/epXX/audio   # 3 takes por trecho (VoiceStudio aberto; defina VOZ_PERFIL=<id do perfil do canal>)
node scripts/montar-narracao.js canais/<canal>/series/<serie>/epXX/audio                                     # concat + tempos.json
node canais/<canal>/series/<serie>/epXX/html/gerar.js                                                        # cena HTML sincronizada com os tempos
node scripts/render.js canais/<canal>/series/<serie>/epXX/html/cena01.html --audio <wav com apad> --saida canais/<canal>/series/<serie>/epXX/final/epXX-v1.mp4
node scripts/mixar-sons.js <mp4> canais/<canal>/series/<serie>/epXX <saida-som.mp4>                           # efeitos + drone, -16 LUFS
npm test                                                                                      # testes dos scripts
```
`ep01/` já vem com um exemplo que funciona: `audio/segmentos.json` (falas, com a palavra de `destaque` da legenda) e `html/gerar.js` (cena com legendas sincronizadas, cartão de votação junto da última fala e cartão SEGUE nos últimos 2 s). Sem voz ainda, `node <ep>/html/gerar.js` estima os tempos e já dá para renderizar e ver. Troque o texto, o desenho, as cores e o @ no topo do `gerar.js`; depois, copie de um episódio seu. O contrato da cena está em `docs/video.md`. Os cues de som ficam em `cues.js` dentro do episódio (modelo em `cues.exemplo.js`; sem ele, `scripts/mixar-sons.js` mixa só voz + drone). Antes de tudo, leia o `CLAUDE.md` e a `identidade.md` do canal.

## Vídeo longo e horizontal (16:9)

Para um canal de vídeos de vários minutos em 1920×1080 (por exemplo, história de algum tema), use `ep-longo/` no lugar de `ep01/`:

- `roteiro.md` é por capítulos, com fontes, fatos a conferir e direitos de cada imagem
- `audio/segmentos.json`: o 1º segmento de cada capítulo leva `"cap"` (título); `"cena"` põe uma imagem de `assets/` na tela, com zoom lento, até a próxima `cena`
- `html/gerar.js`: cena horizontal com legenda embaixo (a palavra falada acende quando há `npm run palavras`), cartão de capítulo, barra de progresso e cartão final. Imprime os capítulos em mm:ss para a descrição do YouTube
- Render: `node scripts/render.js <cena.html> --horizontal --duracao N --audio <wav com apad> --saida <mp4>`
- Medido com a cena de exemplo (3 imagens, legendas por palavra): 24 a 27 quadros/s em 1920×1080. Um vídeo de 10 min ainda não foi renderizado de ponta a ponta; ver `docs/video.md`
- O `ep-longo/` é um ponto de partida para copiar e redesenhar, como o `ep01/`
