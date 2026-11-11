# Canais

Cada canal vive em `canais/<nome-do-canal>/`. Para criar um:

1. Copie `modelos/canal/` para `canais/<nome-do-canal>/` e preencha `CLAUDE.md` e `identidade.md`.
2. As pastas `series/`, `referencias/`, `testes-voz/` e `compilados/` já vêm no modelo (apague os `.gitkeep` se quiser).
3. Abra séries com `modelos/` (`modelos/LEIA.md` tem o fluxo de comandos).

**O conteúdo dos canais não vai para o Git:** este repositório guarda só a estrutura e as ferramentas (veja o `.gitignore`). Cada canal é local; faça backup dele por conta própria ou mantenha um repositório privado por canal dentro desta pasta.
