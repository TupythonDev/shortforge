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
- Saída: 1080×1920, x264 CRF 20, AAC 192k. Os quadros vão direto para o ffmpeg; nada é gravado em `tmp/`
- Velocidade medida (2026-11-14, 12 núcleos, GPU): 20 a 29 quadros/s, ou seja, um episódio de 64 s em cerca de 1 min 30 s
- O `-shortest` corta o vídeo no fim do áudio: o áudio precisa de `apad` no fim para o CTA não sumir (o script avisa quando o áudio é mais curto)
- Requer ffmpeg/ffprobe no PATH (`INSTALACAO.md`)

## Compilado da temporada

Não concatenar os Shorts colados (risco de "conteúdo duplicado" na monetização):
- abertura própria, re-ordenação leve das cenas
- trilha contínua própria e recapitulação do enredo no meio
- legendas refeitas para formato horizontal (16:9, YouTube)

## HyperFrames (avaliado em 2026-11-14, não adotado)

Não substitui a voz clonada (o TTS dele é Kokoro), não tem ducking nem normalização do mix final, exige reescrever as cenas no formato dele e tem issues abertas no Windows. O que ele fazia melhor (render paralelo) foi trazido para o `render.js`. Reavaliar se um dia precisar do catálogo de blocos prontos dele.
