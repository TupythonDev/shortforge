#!/usr/bin/env python3
"""
avaliar-takes.py <pasta-audio> — mede cada take de audio/segs/ e escolhe o melhor por segmento (sem ouvir).
Critérios: (1) a transcrição do take (ASR do VoiceStudio, localhost:3900) bate com o texto — descarta take que
engole ou troca palavra; (2) expressividade: variação de tom (desvio em semitons) — fala "chapada" perde;
(3) pergunta ("?") ganha se o tom sobe no fim; (4) pausa interna longa sem "..." no texto perde; (5) duração
acima de "max" (segundos, opcional no segmento) elimina. Grava <pasta>/escolhas.json, lido por montar-narracao.js.
Não substitui ouvir: é um filtro para levar só os takes plausíveis ao ouvido do dono.
"""
import json, os, re, subprocess, sys, unicodedata, difflib, wave
import numpy as np

API = "http://localhost:3900/v1/audio/transcriptions"


def ler_wav(f):
    with wave.open(f) as w:
        sr, n, ch, sw = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
        x = np.frombuffer(w.readframes(n), dtype={2: np.int16, 4: np.int32}[sw]).astype(np.float32)
    x = x.reshape(-1, ch).mean(1) / (32768.0 if sw == 2 else 2147483648.0)
    return x, sr


def f0_yin(x, sr, fmin=75, fmax=500, hop=0.01, win=0.04):
    """F0 por quadro (YIN simplificado); 0 = quadro sem voz."""
    N, H = int(win * sr), int(hop * sr)
    tmin, tmax = int(sr / fmax), int(sr / fmin)
    out = []
    for i in range(0, len(x) - N - tmax, H):
        fr = x[i:i + N + tmax]
        if np.sqrt(np.mean(fr[:N] ** 2)) < 0.01:
            out.append(0.0); continue
        d = np.array([np.sum((fr[:N] - fr[t:t + N]) ** 2) for t in range(tmin, tmax)])
        cmnd = d * np.arange(1, len(d) + 1) / np.maximum(np.cumsum(d), 1e-9)
        k = int(np.argmin(cmnd))
        out.append(sr / (k + tmin) if cmnd[k] < 0.25 else 0.0)
    return np.array(out)


def pausa_max(x, sr, lim=0.01):
    """maior silêncio interno (s), ignorando início e fim."""
    H = int(0.01 * sr)
    e = np.array([np.sqrt(np.mean(x[i:i + H] ** 2)) for i in range(0, len(x) - H, H)]) > lim
    if not e.any(): return 0.0
    idx = np.where(e)[0]; e = e[idx[0]:idx[-1] + 1]
    m = c = 0
    for v in e:
        c = 0 if v else c + 1; m = max(m, c)
    return m * 0.01


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9 ]+", " ", s).split()


LOTE = r"""
import json, os, sys
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[1], device=os.environ.get("WHISPER_DEV", "cpu"), compute_type="int8")
out = {}
for f in json.load(open(sys.argv[2], encoding="utf-8")):
    seg, _ = m.transcribe(f, language="pt", beam_size=5, vad_filter=False)
    out[f] = " ".join(s.text for s in seg)
print(json.dumps(out, ensure_ascii=False))
"""


def asr_lote(arquivos):
    """Transcreve todos os takes de uma vez. Com WHISPER_PY (python com faster-whisper) e WHISPER_MODELO (pasta do
    modelo CT2) usa o Whisper local; senão, o REST do VoiceStudio (exige modelo de ASR ativo no app)."""
    py, mod = os.environ.get("WHISPER_PY"), os.environ.get("WHISPER_MODELO")
    if py and mod:
        lista = os.path.join(os.path.dirname(arquivos[0]), "_asr.json")
        json.dump(arquivos, open(lista, "w", encoding="utf-8"))
        r = subprocess.run([py, "-c", LOTE, mod, lista], capture_output=True, text=True, encoding="utf-8",
                           env={**os.environ, "PYTHONIOENCODING": "utf-8"})
        os.remove(lista)
        if r.returncode: sys.exit("ASR local falhou:\n" + r.stderr[-1500:])
        return json.loads(r.stdout.strip().splitlines()[-1])
    out = {}
    for f in arquivos:
        r = subprocess.run(["curl.exe" if os.name == "nt" else "curl", "-s", "-m", "120", "-X", "POST", API,
                            "-F", f"file=@{f}", "-F", "model=whisper-1", "-F", "language=pt", "-F", "response_format=json"],
                           capture_output=True, text=True, encoding="utf-8")
        try: out[f] = json.loads(r.stdout).get("text", "")
        except Exception: out[f] = ""
    if not any(out.values()): sys.exit("ASR vazio: defina WHISPER_PY e WHISPER_MODELO (ver docstring) ou ative um modelo de ASR no app")
    return out


def avaliar(f, cfg, texto_asr):
    x, sr = ler_wav(f)
    dur = len(x) / sr
    f0 = f0_yin(x, sr)
    v = f0[f0 > 0]
    st = 12 * np.log2(v / np.median(v)) if len(v) > 10 else np.zeros(1)
    expr = float(np.std(st))
    sobe = 0.0
    if cfg["texto"].strip().endswith("?") and len(st) > 20:
        k = max(3, len(st) // 7)
        sobe = float(np.median(st[-k:]) - np.median(st[len(st) // 4: -k]))
    sim = difflib.SequenceMatcher(None, norm(cfg["texto"]), norm(texto_asr)).ratio()
    pm = pausa_max(x, sr)
    pena = max(0.0, pm - (1.1 if "..." in cfg["texto"] else 0.6)) * 3
    if cfg.get("max") and dur > cfg["max"]: pena += 100
    score = 4 * sim + min(expr, 4.5) + (0.6 * np.clip(sobe, -2, 3) if sobe else 0) - pena - (100 if sim < 0.75 else 0)
    return dict(dur=round(dur, 2), sim=round(sim, 2), expr=round(expr, 2), sobe=round(sobe, 2), pausa=round(pm, 2),
                score=round(float(score), 2), asr=texto_asr.strip())


def main():
    d = sys.argv[1]
    segs = json.load(open(os.path.join(d, "segmentos.json"), encoding="utf-8"))
    so = sys.argv[2].split(",") if len(sys.argv) > 2 else None
    arq = sorted(os.listdir(os.path.join(d, "segs")))
    saida = os.path.join(d, "escolhas.json")
    esc = json.load(open(saida, encoding="utf-8")) if os.path.exists(saida) else {}
    alvo = {sid: [a for a in arq if re.fullmatch(re.escape(sid) + r"-t\d+\.wav", a)]
            for sid in segs if not so or sid in so}
    textos = asr_lote([os.path.abspath(os.path.join(d, "segs", t)) for ts in alvo.values() for t in ts])
    for sid, takes in alvo.items():
        cfg = {"texto": segs[sid]} if isinstance(segs[sid], str) else segs[sid]
        res = {t: avaliar(os.path.join(d, "segs", t), cfg, textos[os.path.abspath(os.path.join(d, "segs", t))]) for t in takes}
        for t, r in res.items(): print(sid, t, r)
        if res:
            melhor = max(res, key=lambda t: res[t]["score"])
            esc[sid] = {"take": melhor, **res[melhor]}
            print(">>", sid, melhor, "\n")
    json.dump(esc, open(saida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
