# -*- coding: utf-8 -*-
"""Monta a versão revisada: roda os scripts (caso_rev.js, incerteza_rev.js, otimiza_rev.js), as figuras (_rev),
ordena as referências pela primeira citação (referencias_rev.tex → refs_ordenadas_rev.tex) e compila com XeLaTeX
(ou com o Tectonic do projeto, se o XeLaTeX não estiver instalado).
Uso (na pasta do projeto): python artigo_v2/monta_rev.py [--sem-scripts]
"""
import re, subprocess, sys, pathlib, shutil
sys.stdout.reconfigure(encoding="utf-8")
AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent
TEX = AQUI / "Grupo-03__Artigo_rev.tex"
CITE = re.compile(r"\\cite(?:\[[^\]]*\])?\{([^}]+)\}")

if "--sem-scripts" not in sys.argv:
    for s in ("caso_rev.js", "incerteza_rev.js", "otimiza_rev.js"):
        subprocess.run(["node", str(AQUI / s)], cwd=RAIZ, check=True, stdout=subprocess.DEVNULL)
        print("✓", s)
    subprocess.run([sys.executable, str(AQUI / "figs" / "gera_figs_rev.py")], check=True, stdout=subprocess.DEVNULL)
    print("✓ figuras")

texto = TEX.read_text(encoding="utf-8")
ordem = []
for g in CITE.findall(texto):
    for k in g.split(","):
        k = k.strip()
        if k not in ordem:
            ordem.append(k)
base = (AQUI / "referencias_rev.tex").read_text(encoding="utf-8").replace("\r\n", "\n")
itens = {m.group(1): m.group(0).strip() for m in re.finditer(r"\\bibitem\{([^}]+)\}.*?(?=\n\s*\n|\Z)", base, re.S)}
faltam = [k for k in ordem if k not in itens]
if faltam:
    sys.exit("✗ citadas sem referência: " + ", ".join(faltam))
(AQUI / "refs_ordenadas_rev.tex").write_text("\n\n".join(itens[k] for k in ordem) + "\n", encoding="utf-8")
print(f"✓ {len(ordem)} referências")

if shutil.which("xelatex"):
    for _ in range(2):
        r = subprocess.run(["xelatex", "-interaction=nonstopmode", TEX.name], cwd=AQUI, capture_output=True, text=True, encoding="utf-8", errors="replace")
    log = (AQUI / "Grupo-03__Artigo_rev.log").read_text(encoding="utf-8", errors="replace")
else:
    tec = RAIZ / "ferramentas" / "tectonic" / "tectonic.exe"
    r = subprocess.run([str(tec), "-X", "compile", "--keep-logs", TEX.name], cwd=AQUI, capture_output=True, text=True, encoding="utf-8", errors="replace")
    log = r.stdout + r.stderr
print("⚠ referência quebrada (??)" if "undefined" in log else "✓ sem referências quebradas")
print(f"linhas estouradas: {log.count('Overfull')}")
print("✓ PDF:", AQUI / "Grupo-03__Artigo_rev.pdf")
