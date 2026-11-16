# Vídeo — cena HTML, render e compilado

Manual de consulta: ler antes de criar uma cena ou renderizar.

## Cena

- A cena é um HTML 1080×1920 com animação CSS e/ou JS, sem bundler. O `html/gerar.js` de um episódio existente é o ponto de partida (`modelos/LEIA.md` tem o fluxo de comandos)
- Animação CSS: o render pausa tudo e posiciona `currentTime` de cada animação a cada quadro
- Canvas / three.js: definir `window.renderTempo(segundos)`, que desenha aquele instante. **Tem que ser função pura do tempo** (sem estado acumulado entre quadros, sem `Math.random()` solto): os quadros são pedidos fora de ordem por vários Chromes
- Carregamento demorado (modelos, imagens): `window.__carregando = true` até terminar; o render espera
- three.js: importar de `node_modules/three/build/three.module.js` por caminho relativo; usar `preserveDrawingBuffer: true`; não colocar planos no mesmo `z` (z-fighting aparece como hachura)

## Render

```
node scripts/render.js <cena.html> --audio <ep>/audio/narracao-final.wav --saida <ep>/final/arquivo.mp4
```

- `--duracao N` (sem ela, vale a duração do áudio) · `--fps 30` · `--workers N` (padrão: metade dos núcleos, até 6) · `--sem-gpu` (só em máquina sem placa de vídeo; ~1 quadro/s)
- `--horizontal` = 16:9 (1920×1080); `--largura N --altura N` para outro tamanho (pares, 64 a 7680). O render só abre o Chrome nesse tamanho: a cena HTML tem que ser desenhada para ele (um `gerar.js` vertical não vira horizontal sozinho)
- Saída: 1080×1920 (ou o tamanho pedido), x264 CRF 20, AAC 192k. Os quadros vão direto para o ffmpeg; nada é gravado em `tmp/`
- Velocidade medida (2026-11-14, 12 núcleos, GPU): 20 a 29 quadros/s, ou seja, um episódio de 64 s em cerca de 1 min 30 s
- O `-shortest` corta o vídeo no fim do áudio: o áudio precisa de `apad` no fim para o CTA não sumir (o script avisa quando o áudio é mais curto)
- Requer ffmpeg/ffprobe no PATH (`INSTALACAO.md`)

## Horizontal (16:9) e vídeos longos (2026-11-16)

- Render horizontal testado com uma cena mínima: sai 1920×1080 a 30 fps (11,8 quadros/s com 2 Chromes numa cena trivial; cena pesada e mais Chromes mudam isso). Uma cena de 1920×1080 tem 2,6× mais pixels que a vertical, então espere render mais lento por quadro
- **Não testado ainda:** um vídeo de ~10 min (18 mil quadros). Estimativa: 10 a 15 min de render se mantiver 20 a 29 quadros/s. Antes de produzir um longo, renderizar um trecho de 1 min na cena real e medir
- Fluxo de um longo: o roteiro vira capítulos; cada capítulo tem os seus segmentos em `segmentos.json` (100 a 150 no total). A narração, o `tempos.json`, `npm run palavras` (≈13 s por fala na CPU) e a mixagem funcionam como nos Shorts, só demoram mais. Renderizar e mixar por capítulo e juntar com ffmpeg evita refazer tudo por um erro no meio
- O `cortar.js` só gera versões verticais; os Shorts de divulgação de um longo são cenas/recortes próprios, não o 16:9 cortado
- As regras de abertura (fala no segundo 0, texto na tela) e de final (CTA intocável) valem também no longo, salvo decisão do dono no `CLAUDE.md` do canal

## Compilado da temporada

Não concatenar os Shorts colados (risco de "conteúdo duplicado" na monetização):
- abertura própria, re-ordenação leve das cenas
- trilha contínua própria e recapitulação do enredo no meio
- legendas refeitas para formato horizontal (16:9, YouTube)

## HyperFrames (avaliado em 2026-11-14, não adotado)

Não substitui a voz clonada (o TTS dele é Kokoro), não tem ducking nem normalização do mix final, exige reescrever as cenas no formato dele e tem issues abertas no Windows. O que ele fazia melhor (render paralelo) foi trazido para o `render.js`. Reavaliar se um dia precisar do catálogo de blocos prontos dele.
