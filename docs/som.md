# Som — efeitos, música e mixagem

Manual de consulta: ler antes de buscar sons ou mixar um episódio.

## Som — efeitos, drone e mixagem
- Skill **sound-effects** (Barty-Bart/motion-graphics, MIT; auditada; instalação em `INSTALACAO.md`, seção 5): kit de 110 sons CC0, regras de licença e mixagem medida. Só ela foi instalada (as outras skills do repo não entram neste pipeline)
- **Openverse** (API pública, só licenças comerciais): `node scripts/sons-openverse.js buscar "termo" --cc0` / `baixar <id> --nome apelido` → `entity/sons/` + `entity/sons/CREDITOS.md`. Preferir CC0; BY exige crédito na descrição
- **Mixagem**: `node scripts/mixar-sons.js <mp4> canais/<canal>/series/<s>/epXX <saida.mp4>` — voz > efeitos > drone (sidechain), alvo **-16 LUFS e pico real < -4 dBFS medidos no MP4 exportado** (estéreo e mono). Os cues estão no próprio script e são **específicos de cada episódio** (ajuste por episódio)
- **Lição (volume)**: um filtro de voz (lowpass + compressor + eco) deixou um trecho a **-39 LUFS** (inaudível) e a checagem de "planicidade espectral" não pegou — depois de QUALQUER filtro em voz, medir LUFS do trecho e normalizar (`loudnorm`) antes de montar
- **Lição (música distorcida, 2026-11-11)**: o dono achou a música "toda destorcida". Causa: o arquivo "Baiao" (Jamendo/Openverse) já vinha saturado (pico +3,4 dB, ~985 topos achatados por minuto) e a gravação de festa tinha OUTRA sanfona tocando junto. Antes de usar uma música, medir topos achatados/pico; nunca empilhar duas músicas; som de multidão = só conversa. Música sob voz: duck suave (`duck: {ratio: 3, release: 900}` no cue)
- **Música do Pixabay**: download só pelo navegador do dono (o CDN bloqueia script, 403). Conferir na página se a faixa está "Content ID Registered": essas geram reivindicação no YouTube; preferir as sem esse selo
- Não consigo ouvir: valide o som com fones. Conferir a licença na página de cada som antes de publicar e manter `final/CREDITS.txt`
