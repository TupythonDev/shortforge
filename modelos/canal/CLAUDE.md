# Canal <nome-do-canal>

<Tema em uma frase.> Regras comuns em `../../CLAUDE.md`; o que estiver aqui vale sobre os padrões de lá. Identidade completa em `identidade.md`.

## Regras do canal

Só o que nunca pode ser quebrado neste canal (decisões do dono, limites do tema). Poucas linhas.
- <ex.: susto psicológico, não gore>

## Como o canal costuma fazer (ponto de partida, não trava)

- **Tom:** <ex.: narrador sombrio, em 2ª pessoa>
- **Tamanho e formato:** <ex.: 60–90 s vertical 1080×1920 (padrão) ou longo horizontal 1920×1080, `render.js --horizontal`; modelo em `modelos/ep-longo/`>
- **Votação e fim:** <tipo de pergunta> + cartão "SEGUE @<usuario>"
- **Visual:** <estilo; apontar um episódio pronto como exemplo>
- **Paleta:** <cores em hexadecimal e uso>
- **Capa:** <regra do card; número do episódio só visual>
- **Hashtags:** <lista>

## Voz (VoiceStudio)

| Quem | Perfil | Observação |
|---|---|---|
| Narrador | `<id>` | speed <valor> |

- Narrar: `VOZ_PERFIL=<id>` ao rodar `node scripts/narrar.js` (ou o campo `voz` em cada segmento)

Decisão substituída sai daqui e vai para `historico.md` do canal: este arquivo guarda só o que vale hoje.
