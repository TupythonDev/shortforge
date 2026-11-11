# Como começar uma série nova

1. Copie TODO este diretório `modelos` para `canais/<canal>/series/<nome-da-serie>/` (a série pertence a UM canal)
2. Renomeie `ep01` conforme o número do episódio (ep01, ep02...) e siga a estrutura:

```
<serie>/
  epXX/
    roteiro.md    <- preencher com o template abaixo
    html/         <- um arquivo HTML por cena
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
node scripts/render.js canais/<canal>/series/<serie>/epXX/html/cena01.html --duracao <s> --audio <wav com apad> --saida canais/<canal>/series/<serie>/epXX/final/epXX-v1.mp4
node scripts/mixar-sons.js <mp4> canais/<canal>/series/<serie>/epXX <saida-som.mp4>                           # efeitos + drone, -16 LUFS
npm test                                                                                      # testes dos scripts
```
Copie `html/gerar.js` e `audio/segmentos.json` de um episódio existente do canal como ponto de partida. Os cues de som ficam em `cues.js` dentro do episódio (modelo em `cues.exemplo.js`; sem ele, `scripts/mixar-sons.js` mixa só voz + drone). Antes de tudo, leia o `CLAUDE.md` e a `identidade.md` do canal.
