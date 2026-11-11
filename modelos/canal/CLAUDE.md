# Canal <nome-do-canal>

Regras específicas deste canal. As regras comuns a todos os canais estão em `../../CLAUDE.md`; identidade completa em `identidade.md`. **Tudo em português do Brasil (PT-BR).**

## O canal
- **Nome:** <nome> — <tema em uma frase>
- **Contas:** @<usuario> no YouTube, Instagram e TikTok; dados de login nunca ficam aqui (só o usuário público)
- **Formato:** <ex.: Shorts / TikTok / Reels, vertical 9:16, ~50–60s por episódio, cliffhanger + votação>
- **Tom e público:** <ex.: narrador sombrio, em 2ª pessoa; audiência jovem-adulta>
- **Séries em `series/`:** <lista>

## Roteiro
- **CTA de seguir:** cartão "SEGUE @<usuario>" nos últimos 2s + frase falada curta + 1 linha na legenda
- <limites de conteúdo do tema, ex.: sustos psicológicos > gore>

## Visual
- Paleta: <cores em hexadecimal e uso de cada uma>
- Estilo: <ex.: cartoon flat 2D em SVG/CSS>
- Capa: <regra do card, número do episódio só visual>

## Voz (VoiceStudio)
- **Voz oficial:** perfil "<nome>" (`<id do perfil>`), speed <valor>, tags de reação: <sim/não>
- Para narrar: `VOZ_PERFIL=<id do perfil>` ao rodar `node scripts/narrar.js` (ou o campo `voz` em cada segmento)
- Outras vozes do canal (sussurro, personagens): <perfil e id>

## Publicação (lições deste canal)
- <hashtags, restrições de feed, horários, o que já funcionou ou foi barrado>

## Pastas deste canal
```
identidade.md  descricoes-canais.md  identidade/ (avatar, banner)
referencias/   ← canais/vídeos de referência, voz/ (áudios de referência), video/
testes-voz/    ← takes de teste de narração
series/        ← <serie>/epXX (roteiro.md, html/, audio/, final/, publicacao.md)
compilados/    ← MP4s longos das temporadas
```
