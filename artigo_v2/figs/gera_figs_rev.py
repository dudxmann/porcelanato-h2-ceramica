# -*- coding: utf-8 -*-
"""Figuras da versão revisada do artigo (Grupo-03__Artigo_rev.tex), com os números de caso_rev.json,
incerteza_rev.json e otimiza_rev.json (gerados por caso_rev.js, incerteza_rev.js e otimiza_rev.js).
Mesmo estilo do gera_figs.py; os arquivos saem com o sufixo _rev e não substituem as figuras da v2.
Uso: python artigo_v2/figs/gera_figs_rev.py
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import gera_figs as G
from gera_figs import plt, FancyBboxPatch, FancyArrowPatch, COR, COL, PAG, br, H2, O2, CO2

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent
C = json.loads((RAIZ / "caso_rev.json").read_text(encoding="utf-8"))
V, BASE = C["v"], C["base"]


def salva(fig, nome):
    G.salva(fig, nome + "_rev")


# ───────────────────── Fig. 1: esquema do ciclo proposto ─────────────────────
def fig_ciclo():
    fig, ax = plt.subplots(figsize=(PAG, 3.2))
    ax.set_xlim(0, 180); ax.set_ylim(0, 81); ax.axis("off")

    def via(pts, cor, lw=1.4, txt=None, xy=None, ha="left", tam=6.4):
        for a, b in zip(pts[:-2], pts[1:-1]):
            ax.plot([a[0], b[0]], [a[1], b[1]], color=cor, lw=lw, solid_capstyle="butt")
        ax.add_patch(FancyArrowPatch(pts[-2], pts[-1], arrowstyle="-|>", mutation_scale=7, color=cor, lw=lw, shrinkA=0, shrinkB=1))
        if txt:
            ax.text(*xy, txt, ha=ha, va="bottom", fontsize=tam, color=cor, linespacing=1.1)

    def caixa(x, y, w, h, titulo, sub="", cor="#FFFFFF", borda="#33475B", ft=7):
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4,rounding_size=1.2", fc=cor, ec=borda, lw=0.8))
        n = sub.count("\n") + 1 if sub else 0
        yt = y + h / 2 + (1.6 * n if n else 0)
        ax.text(x + w / 2, yt, titulo, ha="center", va="center", fontsize=ft, fontweight="bold")
        if sub:
            ax.text(x + w / 2, yt - 2.4, sub, ha="center", va="top", fontsize=6.3, linespacing=1.12)

    def seta(p, q, cor, txt=None, dx=0, dy=1.3, lw=1.4, ha="center", tam=6.4):
        ax.add_patch(FancyArrowPatch(p, q, arrowstyle="-|>", mutation_scale=7, color=cor, lw=lw, shrinkA=1, shrinkB=1))
        if txt:
            ax.text((p[0] + q[0]) / 2 + dx, (p[1] + q[1]) / 2 + dy, txt, ha=ha, va="bottom", fontsize=tam, color=cor, linespacing=1.1)

    ax.add_patch(FancyBboxPatch((1, 1), 49, 78, boxstyle="round,pad=0,rounding_size=2", fc="#FBF6E9", ec="#C9A227", lw=0.8, ls="--"))
    ax.text(3, 76.6, "SISTEMA À PARTE (fora do balanço)", fontsize=5.7, fontweight="bold", color="#8A6D0B")
    ax.add_patch(FancyBboxPatch((55, 1), 124, 78, boxstyle="round,pad=0,rounding_size=2", fc="#F2F5F8", ec="#7D90A3", lw=0.8, ls="--"))
    ax.text(57, 76.6, "FÁBRICA (gate-to-gate; valores por m² de produto)", fontsize=6.8, fontweight="bold", color="#33475B")

    pfv, ha_ = V["P_FV"] / 1000, V["A_TER_HA"]
    caixa(5, 61, 40, 9, "Campo fotovoltaico leste-oeste", f"{br(pfv, 1)} MWp · {br(ha_, 0)} ha de terreno", "#FFF3C4", ft=6.3)
    caixa(5, 43, 40, 9, "Rede da distribuidora", "autoprodução", "#E3ECF5")
    caixa(5, 24, 40, 10, "Eletrolisador alcalino", f"{br(V['P_INST'] / 1000, 1)} MW · 58 kWh/kg\nsaída a 30 bar", "#E3ECF5")
    caixa(5, 7, 17, 9, "Estoque", O2 + " · 30 bar", "#D6E6F2")
    caixa(27, 7, 18, 9, "Estoque", H2 + " · 200 bar", "#F6D5D1")
    seta((25, 60.6), (25, 52.4), COR["rede"], "injeta a geração\n+ 3% de perdas", dx=2, dy=-3.2, ha="left")
    seta((25, 42.6), (25, 34.4), COR["rede"], "retira, menos\nna ponta", dx=2, dy=-3.2, ha="left")
    seta((13.5, 23.6), (13.5, 16.4), COR["trc"])
    seta((36, 23.6), (36, 16.4), COR["h2"])
    ax.text(34.6, 18.2, f"excedente\n{br(V['H2_DIA'] / 1000 * (1 - 21.857142857 * 0.95 / 24), 1)} t/dia", ha="right", fontsize=5.6, color=COR["h2"], linespacing=1.05)

    esc, ar_at, duto = V["ESC"], V["AR_AT"], V["DUTO"]
    caixa(60, 55, 34, 15, "Turbina a gás · 5,2 MW", "30% " + H2 + " (vol.) + gás natural\nη = 31,5% (Taurus 60)\nescape a 500 °C", "#FFFFFF")
    caixa(98.5, 57, 26, 11, "Queimador de duto", H2 + f": {br(duto, 2)} MJ$_t$", "#F6D5D1", ft=6.4)
    caixa(131, 55, 44, 14, "Atomizador · 550 °C", f"39,60 MJ$_t$ = {br(esc, 2)} do escape\n+ {br(ar_at, 2)} do ar + {br(duto, 2)} do queimador", "#FDEBD8")
    caixa(60, 31, 34, 10, "Eletricidade da fábrica", "15,00 MJ$_e$ (da rede: 0)", "#E3ECF5")
    sobra = -V["TRC"] if V["TRC"] < 0 else 0
    caixa(137, 31, 38, 12, "Secador", f"11,09 MJ$_t$ do ar de resfriamento\n(sobram {br(sobra, 2)}; sem trocador)", "#E4F2E9")
    caixa(98, 7, 30, 13, "Forno a rolos", H2 + " + " + O2 + f" puro\n{br(V['Q_F'], 2)} MJ$_t$", "#F6D5D1")
    caixa(141, 7, 34, 10, "Chaminé", "exaustão a 200 °C", "#EEE8F6")

    seta((77, 75.2), (77, 70.4), "#56606A")
    ax.text(79, 71.6, f"gás natural {br(V['GN_TG'], 2)} MJ ({br(V['GN_NM3'], 3)} m³)", fontsize=6.4, color="#56606A", va="bottom")
    seta((94.4, 62.5), (98.1, 62.5), COR["esc"], lw=2.2)
    seta((124.9, 62.5), (130.6, 62.5), COR["esc"], lw=2.2)
    seta((77, 54.6), (77, 41.4), COR["rede"], "15,00 MJ$_e$", dx=1.5, dy=2.2, ha="left")

    via([(45.4, 29), (52.5, 29)], COR["h2"])
    via([(52.5, 29), (52.5, 11.5), (97.6, 11.5)], COR["h2"], txt=H2 + f" {br(V['Q_F'], 2)} MJ ({br(V['H2_FOR'], 3)} kg)", xy=(56, 12.2))
    via([(45.4, 11.5), (52.5, 11.5)], COR["h2"])
    via([(52.5, 29), (52.5, 48), (112, 48), (112, 56.6)], COR["h2"], txt=H2 + f" {br(duto, 2)} MJ", xy=(95, 48.6))
    via([(52.5, 48), (52.5, 66), (59.6, 66)], COR["h2"], txt=H2 + f" {br(V['F_H2_TG'], 2)} MJ", xy=(53.4, 71.0))
    via([(13.5, 6.6), (13.5, 3.5), (113, 3.5), (113, 6.6)], COR["trc"], txt=O2 + f" {br(V['O2_FOR'], 2)} kg", xy=(70, 4.1))

    via([(116, 20.4), (116, 44), (128, 44), (128, 52), (138, 54.6)], COR["ar"], lw=1.6)
    via([(125, 20.4), (125, 26), (147, 26), (147, 30.6)], COR["ar"], lw=1.6)
    ax.text(117.5, 33, "ar de\nresfriamento\n225 °C", fontsize=6.2, color=COR["ar"], linespacing=1.1)
    ax.text(117.5, 44.6, f"{br(ar_at, 2)} MJ$_t$", fontsize=6.2, color=COR["ar"])
    ax.text(126.5, 26.6, "11,09 MJ$_t$", fontsize=6.2, color=COR["ar"])
    seta((128.4, 12), (140.6, 12), "#7D5BA6", "exaustão", dy=0.5)
    salva(fig, "fig_ciclo")


# ───────────────────── Fig. 2: fontes de calor ─────────────────────
def fig_calor():
    casos = [("Atomizador", [("Ciclo 0", {"gn": 39.60}), ("Recuperação", {"ar": 12.97, "trc": 1.14, "gn": 25.49}),
                             ("Proposto", {"esc": V["ESC"], "ar": V["AR_AT"], "h2": V["DUTO"]})]),
             ("Secador", [("Ciclo 0", {"gn": 11.09}), ("Recuperação", {"trc": 7.07, "gn": 4.02}), ("Proposto", {"ar": 11.09})]),
             ("Forno", [("Ciclo 0", {"gn": 54.91}), ("Recuperação", {"gn": 54.91}), ("Proposto", {"h2": V["Q_F"]})])]
    nomes = {"gn": "gás natural", "h2": H2, "esc": "escape da turbina", "ar": "ar de resfriamento", "trc": "ar do trocador"}
    fig, ax = plt.subplots(figsize=(COL, 2.75))
    y, ticks, rot, usados = 0, [], [], []
    for op, linhas in casos:
        for caso, fontes in linhas:
            x = 0
            for k, v in fontes.items():
                ax.barh(y, v, left=x, color=COR[k], height=0.72, edgecolor="white", lw=0.4, label=nomes[k] if k not in usados else None)
                usados.append(k); x += v
            ax.text(x + 0.8, y, br(x, 2), va="center", fontsize=6.6)
            ticks.append(y); rot.append(f"{op}: {caso}" if caso == "Ciclo 0" else caso)
            y -= 1
        y -= 0.5
    ax.set_yticks(ticks); ax.set_yticklabels(rot)
    ax.set_xlabel("Calor entregue (MJ$_t$ por m² de produto)"); ax.set_xlim(0, 64)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(loc="lower center", bbox_to_anchor=(0.42, 1.0), frameon=False, ncol=3, handlelength=1.1, columnspacing=0.8, fontsize=6.6)
    salva(fig, "fig_calor")


# ───────────────────── Fig. 3: CO₂ ─────────────────────
def fig_co2():
    fe, fs = 0.0561, 0.0385 / 3.6
    casos = [("Ciclo 0", 105.59 * fe, 14.40 * fs), ("Com recuperação", 84.41 * fe, 15.00 * fs), ("Ciclo proposto", V["GN_TG"] * fe, 0.0)]
    fig, ax = plt.subplots(figsize=(COL, 1.75))
    for i, (n, s1, s2) in enumerate(casos):
        ax.bar(i, s1, color=COR["gn"], width=0.55, label="escopo 1 (gás natural)" if i == 0 else None)
        ax.bar(i, s2, bottom=s1, color=COR["rede"], width=0.55, label="escopo 2 (rede)" if i == 0 else None)
        tot = s1 + s2
        r = br(tot, 2) + ("" if i == 0 else f"  ({br((tot / (casos[0][1] + casos[0][2]) - 1) * 100, 0)}%)")
        ax.text(i, tot + 0.12, r, ha="center", fontsize=7)
    ax.set_xticks(range(3)); ax.set_xticklabels([c[0] for c in casos])
    ax.set_ylabel(CO2 + " (kg por m²)"); ax.set_ylim(0, 7.2)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, loc="upper right")
    salva(fig, "fig_co2")


# ───────────────────── Fig. 4: investimento ─────────────────────
def fig_invest():
    I = C["investimento"]
    sem_trc = BASE["semTrc"]
    grupos = [("Campo fotovoltaico", ["fv"]), ("Eletrolisador alcalino", ["elz"]), ("Estoque de " + H2 + " (1 dia)", ["est"]),
              ("Turbina a gás", ["tg"]), ("Demais itens da fábrica", ["duto", "forno", "vent", "nd"] + ([] if sem_trc else ["trc"])),
              ("Compressor de " + H2, ["comp"])]
    partes = [("m", "equipamento", COR["eq"]), ("n", "importação (+80%) ou Brasil (+14%)", COR["imp"]), ("o", "instalação", COR["inst"]), ("p", "indiretos", COR["ind"])]
    fig, ax = plt.subplots(figsize=(COL, 2.0))
    for i, (nome, ids) in enumerate(grupos):
        x = 0
        for k, rot, cor in partes:
            v = sum(I[j][k] for j in ids)
            if k == "o":   # dutos e tubulações (dados só pelo total) entram como instalação; sem o trocador, sai a parcela dele
                v += sum(I[j]["usd"] for j in ids if j == "nd") - (0.15 * I["trc"]["usd"] if sem_trc and "nd" in ids else 0)
            ax.barh(-i, v, left=x, color=cor, height=0.66, label=rot if i == 0 else None, edgecolor="white", lw=0.3)
            x += v
        ax.text(x + 2, -i, br(x, 1), va="center", fontsize=7)
    ax.set_yticks([-i for i in range(len(grupos))]); ax.set_yticklabels([g[0] for g in grupos])
    ax.set_xlabel("US$ milhões de 2026"); ax.set_xlim(0, 185)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, loc="lower right", handlelength=1.2)
    salva(fig, "fig_invest")


# ───────────────────── Fig. 5: dinheiro acumulado ─────────────────────
def fig_fluxo():
    """Fluxo anual sem a anualização das pilhas (fluxo + pilhasAno) e as trocas nos anos em que ocorrem;
    a 8% o acumulado termina no VPL do caso-base."""
    inv, i = BASE["inv"], 0.08
    anual = BASE["fluxo"] + BASE["pilhasAno"]
    horas = (24 - 3 * 5 / 7) * 0.95 * 365
    troca = C["investimento"]["elz"]["usd"] * 0.175
    anos_troca = {int(-(-k * 50000 // horas)) for k in range(1, 4)}
    anos, sem, a8, s, d = [0], [-inv], [-inv], -inv, -inv
    for ano in range(1, 26):
        f = anual - (troca if ano in anos_troca else 0)
        s += f; d += f / (1 + i) ** ano
        anos.append(ano); sem.append(s); a8.append(d)
    fig, ax = plt.subplots(figsize=(COL, 1.9))
    ax.plot(anos, sem, color=COR["gn"], lw=1.3, label="sem desconto")
    ax.plot(anos, a8, color=COR["imp"], lw=1.6, ls="--", label="a 8% ao ano (VPL)")
    ax.text(25.4, sem[-1] - 3, br(sem[-1], 1), va="top", fontsize=6.8, color=COR["gn"])
    ax.text(25.4, a8[-1] + 3, br(a8[-1], 1), va="bottom", fontsize=6.8, color=COR["imp"])
    for a in sorted(anos_troca):
        ax.annotate("troca\ndas pilhas", (a, sem[a]), xytext=(a, sem[a - 1] + 4), ha="center", va="bottom", fontsize=5.8, color="#33475B",
                    arrowprops=dict(arrowstyle="-", color="#33475B", lw=0.5))
    ax.set_xlabel("Ano"); ax.set_ylabel("US$ milhões acumulados"); ax.set_xlim(0, 28)
    ax.set_ylim(min(sem) - 8, max(sem) + 20)
    ax.yaxis.set_major_formatter(__import__("matplotlib").ticker.FuncFormatter(lambda v, _: br(v, 0)))
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, loc="upper left", ncol=2)
    salva(fig, "fig_fluxo")
    return sem[-1], a8[-1]


# ───────────────────── Fig. 5: tornado ─────────────────────
def fig_tornado():
    base = BASE["vpl"]
    linhas = sorted((abs(s["hi"] - s["lo"]), s["nome"].replace("R$", "R\\$").replace("US$", "US\\$"), s["lo"], s["hi"]) for s in C["sensibilidade"])
    fig, ax = plt.subplots(figsize=(COL, 2.3))
    for i, (_, n, lo, hi) in enumerate(linhas):
        for v, cor in ((lo, COR["eq"]), (hi, COR["imp"])):
            ax.barh(i, v - base, left=base, color=cor, height=0.62)
            if abs(v - base) > 0.5:
                ax.text(v + (2 if v > base else -2), i, br(v, 0), va="center", ha="left" if v > base else "right", fontsize=6.4)
    ax.axvline(base, color="#33475B", lw=0.7)
    ax.set_yticks(range(len(linhas))); ax.set_yticklabels([l[1] for l in linhas], fontsize=6.6)
    ax.set_xlabel(f"VPL (US$ milhões); caso-base {br(base, 1)}"); ax.set_xlim(-420, -190)
    ax.spines[["top", "right"]].set_visible(False)
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(color=COR["eq"], label="primeiro valor da faixa"), Patch(color=COR["imp"], label="segundo valor")],
              frameon=False, loc="lower left", fontsize=6.4, handlelength=1)
    salva(fig, "fig_tornado")


# ───────────────────── Fig. 6: Monte Carlo ─────────────────────
def fig_mc():
    import numpy as np
    from matplotlib.ticker import FuncFormatter
    r = json.loads((RAIZ / "incerteza_rev.json").read_text(encoding="utf-8"))
    a = json.loads((RAIZ / "incerteza_amostras_rev.json").read_text(encoding="utf-8"))
    vpl, gz = np.array(a["vpl"]), np.sort(np.array(a["gasZera"]))
    e, pgn, base = r["estatisticas"]["vpl"], r["p_gn"], r["base"]
    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(PAG, 2.1), gridspec_kw={"width_ratios": [1, 1, 0.82], "wspace": 0.72})
    pesos = np.full(len(vpl), 100 / len(vpl))
    ax1.hist(vpl, bins=np.arange(-440, -160, 5), weights=pesos, color=COR["eq"], alpha=0.85, lw=0)
    ax1.set_ylim(0, ax1.get_ylim()[1] * 1.32)
    for v, rot, ls in ((e["p05"], "P5", ":"), (e["p50"], "P50", "--"), (e["p95"], "P95", ":")):
        ax1.axvline(v, color="#33475B", lw=0.7, ls=ls, ymax=0.84)
        ax1.text(v, 0.99, f"{rot}\n{br(v, 0)}", transform=ax1.get_xaxis_transform(), ha="center", va="top", fontsize=6.2, color="#33475B", linespacing=1.0)
    ax1.axvline(base["vpl"], color=COR["imp"], lw=1.1, ymax=0.84)
    ax1.plot([-432, -421], [0.62, 0.62], transform=ax1.get_xaxis_transform(), color=COR["imp"], lw=1.1)
    ax1.text(-418, 0.62, f"caso-base\n({br(base['vpl'], 1)})", transform=ax1.get_xaxis_transform(), ha="left", va="center",
             fontsize=6.2, color=COR["imp"], linespacing=1.0)
    ax1.set_xlim(-440, -160); ax1.set_xlabel("VPL com o gás de hoje (US$ milhões)"); ax1.set_ylabel("Sorteios (%)")
    ax1.set_title("(a)", loc="left", fontsize=8)
    x = np.linspace(3, 14, 441)
    ax2.plot(x, np.searchsorted(gz, x, side="right") / len(gz) * 100, color=COR["eq"], lw=1.5)
    for mult, rot in ((1, "hoje"), (2, "2×"), (3, "3×")):
        g = mult * pgn; pr = np.searchsorted(gz, g, side="right") / len(gz) * 100
        ax2.axvline(g, color=COR["gn"], lw=0.6, ls=":")
        ax2.text(g + 0.12, 2, f"{rot}\n{br(pr, 0)}%", ha="left", va="bottom", fontsize=6.2, color="#33475B", linespacing=1.0)
    for q in (0.5, 0.9):
        g = float(np.quantile(gz, q))
        ax2.plot([3, g], [q * 100, q * 100], color=COR["imp"], lw=0.6, ls="--"); ax2.plot(g, q * 100, "o", ms=2.6, color=COR["imp"])
        ax2.text(g - 0.3, q * 100 + 1.5, f"R\\$ {br(g, 2)}/m³", ha="right", va="bottom", fontsize=6.4, color=COR["imp"])
    ax2.set_xlim(3, 14); ax2.set_ylim(0, 100); ax2.set_yticks([0, 25, 50, 75, 100])
    ax2.set_xlabel("Preço do gás natural (R$/m³)"); ax2.set_ylabel("Probabilidade de VPL > 0 (%)")
    ax2.set_title("(b)", loc="left", fontsize=8)
    nomes = {"cfv": "Fotovoltaica", "enc": "Encargos da FV", "imp": "Importação", "celz": "Eletrolisador, US$/kW",
             "kwh": "Eletrolisador, kWh/kg", "pld": "Acerto na CCEE", "om": "Manutenção", "fr": "Frações de calor¹",
             "eta": "Rendimento da turbina", "pilha": "Custo da pilha"}
    sp = sorted(((r["spearman"][k]["vpl"], n) for k, n in nomes.items()), key=lambda t: -abs(t[0]))[::-1]
    for i, (v, n) in enumerate(sp):
        ax3.barh(i, v, color=COR["imp"] if v < 0 else COR["eq"], height=0.62)
        dentro = abs(v) > 0.5
        ax3.text(v + 0.03 if dentro else v - 0.02, i, br(v, 2), va="center", ha="left" if dentro else "right", fontsize=6.2, color="white" if dentro else "black")
    ax3.axvline(0, color="#33475B", lw=0.6)
    ax3.set_yticks(range(len(sp))); ax3.set_yticklabels([n for _, n in sp], fontsize=6.6)
    ax3.set_xlim(-1.05, 0.12); ax3.set_xlabel("Correlação de postos")
    ax3.set_title("(c)", loc="left", fontsize=8)
    for ax in (ax2, ax3):
        ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, 1)))
    for ax in (ax1, ax2, ax3):
        ax.spines[["top", "right"]].set_visible(False)
    salva(fig, "fig_mc")


# ───────────────────── Fig. 7: otimização ─────────────────────
def fig_otim():
    from matplotlib.ticker import FuncFormatter
    o = json.loads((RAIZ / "otimiza_rev.json").read_text(encoding="utf-8"))
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(PAG, 2.25), gridspec_kw={"wspace": 0.28})
    for chave, rot, cor, ls in (("base", "caso-base", COR["eq"], "-"), ("pld2025", "PLD de 2025", COR["imp"], "--"), ("elz600", "eletrolisador a 600 US$/kW", COR["ar"], ":")):
        L = o["A"][chave]
        ax1.plot([p["P_MW"] for p in L], [p["vpl"] for p in L], color=cor, lw=1.4, ls=ls, label=rot)
        ax1.plot(L[0]["P_MW"], L[0]["vpl"], "o", ms=3.2, color=cor)
    b0 = o["A"]["base"][0]
    ax1.text(0.56, 0.91, f"pontos: o tamanho mínimo, {br(b0['P_MW'], 1)} MW,\né o ótimo nos três casos", transform=ax1.transAxes, fontsize=6.4, color="#33475B", ha="left", va="center", linespacing=1.05)
    ax1.set_xlabel("Eletrolisador (MW), operando nas horas de PLD mais baixo"); ax1.set_ylabel("VPL (US$ milhões)")
    ax1.legend(frameon=False, loc="lower left", fontsize=6.4); ax1.set_title("(a)", loc="left", fontsize=8)
    B = o["B"]
    ax2.scatter([p["co2Ano"] / 1000 for p in B], [p["vpl"] for p in B], s=4, color=COR["gn"], alpha=0.45, lw=0, zorder=1)
    pas = o["passos"]
    ax2.plot([p["co2Ano"] / 1000 for p in pas], [p["vpl"] for p in pas], color="#33475B", lw=0.9, marker="o", ms=3.2, zorder=2)
    rot = [f"sem H$_2$ (turbina a gás natural\ne recuperação): +{br(pas[0]['vpl'], 0)}",
           f"+ forno a H$_2$: {br(pas[1]['vpl'], 0)} ({br(pas[1]['custoT'], 0)} US\\$/t)",
           f"+ duto a H$_2$: {br(pas[2]['vpl'], 0)} ({br(pas[2]['custoT'], 0)} US\\$/t)",
           f"+ 30% de H$_2$ na turbina (proposto):\n{br(pas[3]['vpl'], 0)} ({br(pas[3]['custoT'], 0)} US\\$/t)"]
    pos = [(62, 45, "right"), (42, -185, "left"), (42, -222, "left"), (42, -262, "left")]
    for p, r, (tx, ty, ha) in zip(pas, rot, pos):
        ax2.annotate(r, xy=(p["co2Ano"] / 1000, p["vpl"]), xytext=(tx, ty), fontsize=6.2, ha=ha, va="center", color="#33475B",
                     linespacing=1.0, arrowprops=dict(arrowstyle="-", color="#9AA7B4", lw=0.5, shrinkA=1, shrinkB=2))
    ax2.plot(66.576, 0, "s", ms=3.4, color="#33475B"); ax2.text(66.6, -9, "ciclo 0", fontsize=6.2, ha="center", va="top", color="#33475B")
    ax2.axvline(25, color=COR["eq"], lw=0.7, ls="--")
    ax2.text(25.8, -120, "limite de conciliação\ndo SBCE (25 mil t/ano)", fontsize=6.2, color=COR["eq"], ha="left", va="center", linespacing=1.0)
    ax2.axhline(0, color="#33475B", lw=0.5)
    ax2.set_xlim(14, 72); ax2.set_ylim(-290, 60)
    ax2.set_xlabel("CO$_2$ fóssil (mil t/ano)"); ax2.set_ylabel("VPL (US$ milhões)"); ax2.set_title("(b)", loc="left", fontsize=8)
    for ax in (ax1, ax2):
        ax.spines[["top", "right"]].set_visible(False)
        ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, 0)))
        ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, 0)))
    salva(fig, "fig_otim")


# ───────────────────── Fig. 8 (nova): exergia por cenário ─────────────────────
def fig_exergia():
    E = C["exergia"]
    casos = [("Ciclo 0", E["c0"]), ("Com recuperação", E["rec"]), ("Ciclo proposto", E["prop"])]
    blocos = [("Produtos", lambda e: e["P"], "#2E8B57"),
              ("Eletrolisador e rede", lambda e: e["des"].get("eletrolisador", 0) + e["des"].get("rede_fv", 0), "#5B8DB8"),
              ("Turbina", lambda e: e["des"].get("turbina", 0), "#7D5BA6"),
              ("Forno", lambda e: e["des"].get("forno", 0), "#C0392B"),
              ("Atomizador e secador (suprimento)", lambda e: e["des"].get("atomizador", 0) + e["des"].get("secador", 0), "#E67E22"),
              ("Trocador e ventiladores", lambda e: e["des"].get("trocador", 0) + e["des"].get("ventiladores", 0), "#9FB1C3"),
              ("Perdas (chaminé e ar)", lambda e: e["L"], "#8C96A0")]
    fig, ax = plt.subplots(figsize=(COL, 2.2))
    for i, (n, e) in enumerate(casos):
        x = 0
        for rot, fn, cor in blocos:
            v = fn(e)
            ax.barh(-i, v, left=x, color=cor, height=0.6, edgecolor="white", lw=0.3, label=rot if i == 0 else None)
            if v > 9:
                ax.text(x + v / 2, -i, br(v, 0), ha="center", va="center", fontsize=6.2, color="white")
            x += v
        ax.text(x + 2, -i, f"{br(x, 1)}\nψ = {br(e['psi'] * 100, 0)}%", va="center", fontsize=6.4, linespacing=1.0)
    ax.set_yticks([0, -1, -2]); ax.set_yticklabels([c[0] for c in casos])
    ax.set_xlabel("Exergia que entra (MJ por m² de produto)"); ax.set_xlim(0, 185); ax.set_ylim(-2.6, 0.5)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(loc="upper center", bbox_to_anchor=(0.45, -0.32), frameon=False, ncol=2, fontsize=6.2, handlelength=1.1, columnspacing=0.8)
    salva(fig, "fig_exergia")


if __name__ == "__main__":
    for f in (fig_ciclo, fig_calor, fig_co2, fig_invest, fig_fluxo, fig_tornado, fig_mc, fig_otim, fig_exergia):
        f(); print("ok", f.__name__)
