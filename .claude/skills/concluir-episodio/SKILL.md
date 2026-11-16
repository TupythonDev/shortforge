---
name: concluir-episodio
description: Encerra a produção de um episódio ou vídeo: limpa takes de voz e arquivos intermediários (com confirmação do dono) e fecha o VoiceStudio. Usar quando o dono disser que o vídeo/episódio está aprovado, pronto ou publicado, ou pedir para limpar/concluir/arrumar o episódio. Nunca apaga sem o dono confirmar.
---

# Concluir episódio

Roda no fim da produção, **depois** de o dono aprovar o vídeo (e, de preferência, depois de publicar). Apagar é irreversível, então o dono decide: o assistente simula, mostra e só apaga com um sim claro (regra do `CLAUDE.md`: nada some sem confirmar).

## Passos

1. **Identificar o episódio**: pasta `canais/<canal>/series/<serie>/epXX`. Se houver dúvida de qual é, perguntar. Confirmar que o dono aprovou o vídeo; se não ficou claro, perguntar antes de seguir.
2. **Simular** (não apaga nada):
   ```bash
   npm run limpar -- canais/<canal>/series/<serie>/epXX
   ```
   Se `final/` tiver versões antigas (`-v1`, `-v2`...) e a mais nova for a aprovada, rodar também com `--versoes-antigas` para ver quanto libera.
3. **Mostrar ao dono** o resumo: o que sai, por categoria e o total em MB, e o que fica (a versão mais nova, narração, tempos, roteiro, cues). Avisar se algum nome em `final/` não seguiu o padrão e ficou de fora da lista.
4. **Perguntar**: "Posso apagar isso?" Deixar claro que não dá para desfazer. Só seguir com um sim explícito; sem resposta, não apagar.
5. **Apagar** com as mesmas opções da simulação mais `--apagar`, e relatar o que foi liberado.
6. **VoiceStudio**: se estiver aberto e o dono disse que está tudo bom, fechar (`Get-Process VoiceStudio,voicestudio-desktop-bridge | Stop-Process`). Não fechar se ainda há episódio em produção.

## Cuidados

- `--takes-escolhidos` (apaga a pasta `audio/segs/` inteira) só se o dono disser que não vai refazer a voz; depois disso não dá para remontar a narração sem narrar de novo. Não oferecer como padrão.
- Não rodar antes da publicação sem avisar: o arquivo publicado costuma ser o `-upload`/`-som` mais novo, que o comando preserva, mas o dono pode querer outro.
- Nunca usar `--forcar` sem o dono pedir.
- Depois de apagar, não há nada a commitar: `canais/` não é versionado.
- Detalhes do comando e do que é preservado: seção "Limpeza ao concluir um episódio" de `docs/video.md`.
