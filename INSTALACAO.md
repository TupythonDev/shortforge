# Instalação e preparação do repositório

Inventário completo do que este estúdio usa e como instalar em um computador novo: aplicativos, bibliotecas, plugins, skills e MCPs do Claude Code, inclusive os que ficam **fora do repositório** (na pasta do usuário ou no aplicativo Claude). Nenhum caminho aqui é fixo: instale cada programa onde quiser; o que importa é o que cada um precisa **encontrar** (PATH, variável de ambiente ou pasta do usuário).

> Os scripts foram escritos e testados no **Windows 10/11** com PowerShell 5.1 e Git Bash. Os comandos estão em PowerShell, salvo indicação. As versões entre parênteses são as que estavam instaladas quando este documento foi escrito (2026-11-10); versões mais novas costumam funcionar, mas não foram testadas.

## Mapa do que precisa existir

| Camada | O que é | Onde vive |
|---|---|---|
| 1. Sistema e aplicativos | Git, Node, Python, ffmpeg, VoiceStudio... | instalados no PC |
| 2. Repositório | código, canais, modelos | pasta clonada |
| 3. Dependências do repositório | pacotes npm (e pip opcionais) | `node_modules/`, Python do usuário |
| 4. Claude Code | plugins, skills e MCPs de **usuário** | `~/.claude/`, `~/.claude.json`, `~/.agents/` |
| 5. App Claude e conta | skills/ferramentas que o aplicativo fornece | fora do alcance do CLI |
| 6. Variáveis e arquivos locais | base do VoiceStudio, `.secrets/`, ajustes locais do projeto | usuário do Windows, pasta do projeto |

---

## 1. Sistema e aplicativos

| Aplicativo | Versão de referência | Para que serve | Obrigatório | Instalação |
|---|---|---|---|---|
| Windows | 10 1809+ ou 11 | sistema testado | sim | — |
| Git (com Git Bash) | 2.54 | clonar, versionar, rodar scripts `.sh` | sim | `winget install Git.Git` |
| Node.js LTS | 26.13 (mínimo 22) | todos os scripts, Puppeteer, `npx` | sim | `winget install OpenJS.NodeJS.LTS` |
| ffmpeg + ffprobe | 9.0.2 (build gyan.dev) | render, mixagem, cortes, medição de LUFS | sim | `winget install Gyan.FFmpeg` |
| VoiceStudio | release atual do GitHub | narração por TTS, clone de voz | sim, para narrar | seção 4 |
| Driver NVIDIA/CUDA | qualquer atual (RTX 2060 gera ~5 s por take) | acelera o VoiceStudio; sem GPU funciona mais devagar | recomendado | site da NVIDIA |
| Python | 3.12 | método B de tendências | não | `winget install Python.Python.3.12` |
| uv | 0.13 | instalador/gerenciador Python usado por algumas ferramentas | não | `winget install astral-sh.uv` |
| yt-dlp | 2026.10.26 | baixar vídeos de referência | não | `winget install yt-dlp.yt-dlp` |
| Google Chrome | atual | login e publicação pelo navegador (extensão Claude in Chrome) | para publicar pelo navegador | site do Google |
| Claude Code (CLI) | 2.1.220 | assistente que roda o fluxo, plugins, skills e MCPs | sim, se usar IA | seção 5 |
| App Claude desktop | atual | navegador embutido, skills do aplicativo | opcional | site da Anthropic |

Depois de instalar, feche e abra o terminal. Em um terminal que já estava aberto, recarregue o PATH:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
```

Conferir: `git --version`, `node -v`, `ffmpeg -version`, `ffprobe -version`.

## 2. Repositório e dependências

```powershell
git clone <url-do-repositorio> "IA Data"
cd "IA Data"
npm install
```

- O `npm install` instala o **Puppeteer** (25.16), que baixa o próprio Chromium para a pasta de cache do usuário. Ele é usado por `render.js`, `tendencias.js` e pelos geradores de cena e miniatura.

### Dependências Python (opcionais, só tendências método B)

```powershell
pip install TikTokApi==7.3.3 instaloader==4.16 playwright==1.64.1
python -m playwright install chromium
```

O TikTok exige `--ms_token` (ou a variável `TIKTOK_MS_TOKEN`) e o Instagram exige uma sessão do `instaloader` com uma **conta secundária**. Nunca use a conta principal de um canal. O método A (`node scripts/tendencias.js tiktok`) não precisa disso.

## 3. Variáveis e arquivos locais (não vão no Git)

| Item | O que é | Como criar |
|---|---|---|
| `OMNIVOICE_MCP_BASE_PATH` e `OMNIVOICE_MCP_OUTPUT_MODE` | base do VoiceStudio = raiz do repositório; modo `files` | `npm run voicestudio -- --aplicar` (seção 4) |
| `.secrets/` | tokens, se algum dia houver | criar a pasta; está no `.gitignore`. **Nunca commitar tokens** |
| `.claude/settings.local.json` | ajustes do Claude Code só deste PC e deste projeto (ex.: desligar o Ponytail) | criar à mão; é ignorado pelo Git |

## 4. VoiceStudio (narração)

1. Baixe a release mais recente em `github.com/debpalash/VoiceStudio` (página Releases), instale em qualquer pasta e abra o aplicativo. Enquanto ele estiver aberto, o REST responde em `http://localhost:3900` e o MCP em `http://localhost:3900/mcp/`.
2. Crie ou importe o perfil de voz de cada canal (clone a partir de uma gravação em português; lições de voz em `docs/voz.md`). O ID do perfil de cada canal fica no `CLAUDE.md` do canal, em `canais/<canal>/`, e é passado ao `narrar.js` pela variável `VOZ_PERFIL`. **Perfis não viajam com o repositório:** em um PC novo é preciso recriar a voz e atualizar o ID no `CLAUDE.md` do canal.
3. **Apontar o MCP para este repositório (1 vez por computador):**

   ```powershell
   npm run voicestudio                  # só mostra o valor atual e o esperado
   npm run voicestudio -- --aplicar     # grava as variáveis de usuário
   ```

   O script calcula a raiz do repositório onde ele está e a usa como base (`OMNIVOICE_MCP_BASE_PATH`); os arquivos são pedidos por caminho relativo (`canais/<canal>/series/<serie>/epXX/audio/...`). Depois **feche e abra o VoiceStudio de um terminal novo** (ou faça logoff). `scripts/narrar.js` não depende disso (usa o REST).
4. Opcional: instalar o modelo de transcrição (faster-whisper large-v3, ~2,9 GB) pelo Model Catalogue do app, para ter timestamps de palavra.

## 5. Claude Code: plugins, skills e MCPs de usuário

Instale o Claude Code seguindo a documentação oficial da Anthropic e confira com `claude --version`. Tudo abaixo vale para **todos os projetos** do usuário (escopo `user`) e fica fora do repositório.

### 5.1 Plugins

| Plugin | Versão | Para que serve | Neste projeto | Instalação |
|---|---|---|---|---|
| `ponytail@ponytail` | 5.3.3 | faz o agente escolher a solução mínima de código | **desligado** por `.claude/settings.local.json` | `claude plugin marketplace add DietrichGebert/ponytail` · `claude plugin install ponytail@ponytail` |
| `i-have-adhd@i-have-adhd` | 0.4.1 | respostas com ação primeiro, passos numerados, sem rodeios | opcional, ligado por `/i-have-adhd` | `claude plugin marketplace add ayghri/i-have-adhd` · `claude plugin install i-have-adhd@i-have-adhd` |
| `superpowers@claude-plugins-official` | 6.4.2 | fluxos de brainstorming, planos, depuração e revisão de código (origem: `github.com/obra/superpowers`) | opcional | `claude plugin install superpowers@claude-plugins-official` (marketplace oficial; não testado nesta instalação) |
| `animation-skills@claude-animation-skills` | repositório atual | seis skills de animação para reels: stick-figure, 3D cartoon (zach-d-films), gráfico, mapa de rota, vista explodida e linha minimalista (origem: `github.com/artemnovitckii/claude-animation-skills`) | opcional | `claude plugin marketplace add artemnovitckii/claude-animation-skills` · `claude plugin install animation-skills@claude-animation-skills` |

Para desligar um plugin só neste projeto, crie `.claude/settings.local.json` na raiz:

```json
{ "enabledPlugins": { "ponytail@ponytail": false } }
```

**Hyperframes (HeyGen):** o marketplace `heygen-com/hyperframes` está **registrado** nas configurações do usuário, mas nenhum plugin dele foi instalado, e o código não foi auditado. Não é necessário para o pipeline.

### 5.2 Skills de usuário (`~/.claude/skills/`)

| Skill | Para que serve | Obrigatória? | Instalação |
|---|---|---|---|
| `sound-effects` | kit de 110 sons CC0 e regras de mixagem; **`scripts/mixar-sons.js` lê o kit em `~/.claude/skills/sound-effects/sfx/kit`** | **sim**, para mixar sons | `npx skills add Barty-Bart/motion-graphics` e escolher só `sound-effects` |
| `remotion` | boas práticas e fluxos do Remotion (vídeo em React): legendas, render, 3D, áudio (origem: `github.com/remotion-dev/skills`) | não | `npx skills add remotion-dev/skills` (ou `gh skill install remotion-dev/skills`) |

### 5.3 Servidores MCP de usuário

| MCP | Para que serve | Instalação |
|---|---|---|
| `agent-desktop` (1.2.0) | lê e opera apps nativos pela árvore de acessibilidade (ex.: a interface do VoiceStudio, apps de publicação) | `npm install -g agent-desktop` e `claude mcp add --scope user agent-desktop -- agent-desktop mcp` |

Notas: no `npm install -g agent-desktop`, o npm pode bloquear o script de pós-instalação; o programa funciona assim mesmo, só um pouco mais devagar. Para o binário nativo direto: `npm install -g agent-desktop --allow-scripts=agent-desktop`. Confira os MCPs com `claude mcp list`.

### 5.4 Fornecidos pelo app Claude e pela conta (fora do CLI)

O Claude Code já traz de fábrica a skill `skill-creator` (e outras, como `code-review` e `simplify`); não precisa instalar. O aplicativo Claude desktop e a conta ainda oferecem, sem instalação pelo terminal:

- **Navegação e computador:** navegador embutido do app, extensão **Claude in Chrome** (usa o Google Chrome com o seu login) e **computer-use**. Ative-os no aplicativo.
- **Conectores:** Google Drive, Vercel, Supabase e outros da conta, sem relação com o pipeline.

As versões de `remotion`, `animation-skills` e `superpowers` que aparecem no aplicativo vêm do diretório de plugins da Anthropic; as seções 5.1 e 5.2 dão a instalação direta pela origem no GitHub.

### 5.5 Configuração pessoal do Claude Code (fora do repositório)

- `~/.claude/CLAUDE.md`: instruções globais do usuário, escritas à mão e fora do repositório.
- `~/.claude/settings.json`: idioma, permissões, plugins habilitados e marketplaces conhecidos (`ponytail`, `i-have-adhd` e `hyperframes`). Os comandos `claude plugin marketplace add` da seção 5.1 recriam essa parte.

## 6. Verificação

```powershell
npm test                     # 16 testes de sintaxe e argumentos dos scripts
npm run voicestudio          # variável do VoiceStudio aponta para este repositório?
ffmpeg -version
claude plugin list
claude mcp list
```

Teste completo (com o VoiceStudio aberto): siga o fluxo de comandos de `modelos/LEIA.md` com um episódio de teste e confira os 2 segundos finais do vídeo.

## 7. O que não vai no Git

- **Todo o conteúdo de `canais/`** (roteiros, séries, vozes de referência, MP4, WAV): fica só no disco. O repositório guarda a estrutura e as ferramentas. **Não há remoto para os canais**, então faça backup por conta própria (disco externo, nuvem) ou mantenha um repositório privado por canal dentro de `canais/<canal>/`, e leve-os ao trocar de computador.
- `.secrets/`, `.env`, `node_modules/`, `tmp/` e `.claude/`: ignorados. **Nunca commite tokens.**

## 8. Criar um canal novo

1. Copie `modelos/canal/` para `canais/<canal>/` e preencha `CLAUDE.md` (tema, tom, paleta, voz, contas, lições) e `identidade.md`.
2. Crie a voz do canal no VoiceStudio e registre o ID no `CLAUDE.md` do canal. Para narrar, use `VOZ_PERFIL=<id>` (ou o campo `voz` de cada segmento) ao rodar `node scripts/narrar.js`.
3. Copie `modelos/ep01/` para `canais/<canal>/series/<serie>/` e siga `modelos/LEIA.md`.

## 9. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `narrar.js` falha com `fetch failed` | VoiceStudio fechado ou em outra porta |
| MCP do VoiceStudio recusa caminhos de arquivo | `OMNIVOICE_MCP_BASE_PATH` vazia ou apontando para a pasta errada: rodar `npm run voicestudio -- --aplicar` e reabrir o app |
| HTTP 400 ao chamar a API com `curl` e texto acentuado | codificação no shell do Windows: mande o JSON por arquivo UTF-8 (`--data-binary @arq.json`) ou use `scripts/narrar.js` |
| `ffmpeg` não é reconhecido | terminal aberto antes da instalação: recarregue o PATH (seção 1) |
| `mixar-sons.js` não acha os sons | skill `sound-effects` não instalada (seção 5.2) |
| Plugin ligado onde não deveria | falta o `.claude/settings.local.json` do projeto (seção 5.1) |
| Render termina sem os 2 s finais (CTA) | o áudio passado ao render precisa de `apad` no fim (o `-shortest` corta o vídeo) |
| O navegador do `tendencias.js` faz barulho | ele deve rodar com `--mute-audio`; não remova a flag |

## Apêndice: o que foi auditado

Antes de instalar, o código de `ponytail`, `i-have-adhd`, `sound-effects`, TikTokApi e instaloader foi revisado e não mostrou comportamento suspeito. Do `agent-desktop` foi lido só o script de pós-instalação (baixa o binário do release oficial e confere o SHA-256). `superpowers`, `remotion` e `animation-skills` **não foram auditados** (o `animation-skills` tem licença "other" no GitHub e o `install.sh` dele roda `npm` e `brew`). Releia o código de qualquer item novo antes de instalar em outra máquina.
