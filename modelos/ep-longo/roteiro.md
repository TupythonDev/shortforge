# Roteiro — [título do vídeo] — [formato: longo horizontal 16:9]

**Status:** [ ] pesquisa e fontes | [ ] roteiro | [ ] imagens com licença | [ ] áudio gerado | [ ] render por capítulo | [ ] mixagem | [ ] final conferido

## Gancho (segundo 0)
> a frase mais forte do vídeo, falada no primeiro quadro e escrita na tela. Sem "olá, pessoal" nem apresentação

## Promessa (até ~20 s)
> o que a pessoa vai entender se ficar até o fim

## Capítulos
Cada capítulo tem uma pergunta ou tensão própria e termina empurrando para o próximo. Mínimo de 3 capítulos de 10 s ou mais (o YouTube só mostra capítulos assim). O 1º segmento de cada capítulo leva `"cap"` no `segmentos.json`.

| # | Título (`cap`) | Duração alvo | Fato central | Fonte | Imagem (`cena`) e licença |
|---|----------------|--------------|--------------|-------|---------------------------|
| 1 | | ~1,5 min | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

## Fatos que podem estar errados
> datas, nomes e números conferidos em mais de uma fonte antes de narrar. Anotar o que ficou incerto e dizer "segundo X" na fala em vez de afirmar

## Direitos das imagens e do som
- [ ] Cada imagem em `assets/` tem origem anotada (própria, licença livre ou uso transformativo com comentário)
- [ ] Sem música licenciada; efeitos e trilha CC0 em `entity/sons/`
- [ ] Trechos de jogo curtos, com comentário por cima, nunca a mesma sequência sem narração

## Fecho e CTA
- Última fala: o fecho que conecta ao próximo vídeo
- CTA falado (até ~3 s): "Se gostou, segue o canal: o próximo continua daqui."
- Cartão final: nos últimos segundos (`FINAL` no `gerar.js`)

## Título, capa e descrição
- Título (até ~60 caracteres, uma pergunta ou imagem forte):
- Capa: [descrição; texto grande e legível em tela pequena]
- Descrição: gancho + capítulos em mm:ss (o `gerar.js` imprime) + fontes + @ + hashtags
