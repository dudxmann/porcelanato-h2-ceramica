# -*- coding: utf-8 -*-
"""Figuras do artigo (Grupo 3, EEN807), no tamanho da coluna do modelo IJRER (87 mm) ou da página (180 mm).

Os números da energia vêm do memorial de cálculo (equações citadas em cada bloco); os da economia,
dos JSON do painel (apresentacao/painel_dados), que saem da planilha recalculada pelo extrai_painel.py.
Uso: .venv/Scripts/python.exe artigo/figs/gera_figs.py
"""
import json, pathlib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

AQUI = pathlib.Path(__file__).resolve().parent
DADOS = AQUI.parents[1] / "apresentacao" / "painel_dados"
COL, PAG = 87 / 25.4, 180 / 25.4                     # larguras em polegadas
plt.rcParams.update({
    "font.family": "serif", "font.serif": ["Times New Roman", "TeX Gyre Termes", "DejaVu Serif"],
    "mathtext.fontset": "stix", "font.size": 8, "axes.titlesize": 8, "axes.labelsize": 8,
    "xtick.labelsize": 7.5, "ytick.labelsize": 7.5, "legend.fontsize": 7, "axes.linewidth": 0.6,
    "xtick.major.width": 0.6, "ytick.major.width": 0.6, "savefig.bbox": "tight", "savefig.pad_inches": 0.02,
})
COR = {"gn": "#8C96A0", "h2": "#C0392B", "esc": "#E67E22", "ar": "#2E8B57", "trc": "#7D5BA6",
       "rede": "#5B8DB8", "eq": "#2A6CB0", "imp": "#E8833A", "inst": "#9FB1C3", "ind": "#5B6B7B"}
H2, O2, CO2 = r"H$_2$", r"O$_2$", r"CO$_2$"


def br(v, d=1):
    return f"{v:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".").replace("-", "−")


def dados(n):
    return json.loads((DADOS / f"{n}.json").read_text(encoding="utf-8"))["rows"]


def salva(fig, nome):
    fig.savefig(AQUI / f"{nome}.pdf")
    fig.savefig(AQUI / f"{nome}.png", dpi=200)
    plt.close(fig)


# ───────────────────── Fig. 1: esquema do ciclo proposto (180 mm) ─────────────────────
def fig_ciclo():
    fig, ax = plt.subplots(figsize=(PAG, 3.2))
    ax.set_xlim(0, 180); ax.set_ylim(0, 81); ax.axis("off")

    def via(pts, cor, lw=1.4, txt=None, xy=None, ha="left", tam=6.4):
        """Linha poligonal com ponta de seta no fim."""
        for a, b in zip(pts[:-2], pts[1:-1]):
            ax.plot([a[0], b[0]], [a[1], b[1]], color=cor, lw=lw, solid_capstyle="butt")
        ax.add_patch(FancyArrowPatch(pts[-2], pts[-1], arrowstyle="-|>", mutation_scale=7, color=cor, lw=lw,
                                     shrinkA=0, shrinkB=1))
        if txt:
            ax.text(*xy, txt, ha=ha, va="bottom", fontsize=tam, color=cor, linespacing=1.1)

    def caixa(x, y, w, h, titulo, sub="", cor="#FFFFFF", borda="#33475B", ft=7):
        """Caixa com título em negrito (ft pt) e detalhe em fonte normal logo abaixo."""
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4,rounding_size=1.2",
                                    fc=cor, ec=borda, lw=0.8))
        n = sub.count("\n") + 1 if sub else 0
        yt = y + h / 2 + (1.6 * n if n else 0)
        ax.text(x + w / 2, yt, titulo, ha="center", va="center", fontsize=ft, fontweight="bold")
        if sub:
            ax.text(x + w / 2, yt - 2.4, sub, ha="center", va="top", fontsize=6.3, linespacing=1.12)

    def seta(p, q, cor, txt=None, dx=0, dy=1.3, lw=1.4, ha="center", estilo="-|>", con="arc3", tam=6.4):
        ax.add_patch(FancyArrowPatch(p, q, arrowstyle=estilo, mutation_scale=7, color=cor, lw=lw,
                                     connectionstyle=con, shrinkA=1, shrinkB=1))
        if txt:
            ax.text((p[0] + q[0]) / 2 + dx, (p[1] + q[1]) / 2 + dy, txt, ha=ha, va="bottom",
                    fontsize=tam, color=cor, linespacing=1.1)

    # regiões (sistema à parte: x 1–50; fábrica: x 55–179; o H₂ passa pelo vão em x = 52,5)
    ax.add_patch(FancyBboxPatch((1, 1), 49, 78, boxstyle="round,pad=0,rounding_size=2", fc="#FBF6E9",
                                ec="#C9A227", lw=0.8, ls="--"))
    ax.text(3, 76.6, "SISTEMA À PARTE (fora do balanço)", fontsize=5.7, fontweight="bold", color="#8A6D0B")
    ax.add_patch(FancyBboxPatch((55, 1), 124, 78, boxstyle="round,pad=0,rounding_size=2", fc="#F2F5F8",
                                ec="#7D90A3", lw=0.8, ls="--"))
    ax.text(57, 76.6, "FÁBRICA (gate-to-gate; valores por m² de produto)", fontsize=6.8, fontweight="bold",
            color="#33475B")

    # sistema à parte
    caixa(5, 61, 40, 9, "Campo fotovoltaico leste-oeste", "312,8 MWp · 232 ha de terreno", "#FFF3C4", ft=6.3)
    caixa(5, 43, 40, 9, "Rede da distribuidora", "autoprodução", "#E3ECF5")
    caixa(5, 24, 40, 10, "Eletrolisador alcalino", "45,6 MW · 58 kWh/kg\nsaída a 30 bar", "#E3ECF5")
    caixa(5, 7, 17, 9, "Estoque", O2 + " · 30 bar", "#D6E6F2")
    caixa(27, 7, 18, 9, "Estoque", H2 + " · 200 bar", "#F6D5D1")
    seta((25, 60.6), (25, 52.4), COR["rede"], "injeta a geração\n+ 3% de perdas", dx=2, dy=-3.2, ha="left")
    seta((25, 42.6), (25, 34.4), COR["rede"], "retira, menos\nna ponta", dx=2, dy=-3.2, ha="left")
    seta((13.5, 23.6), (13.5, 16.4), COR["trc"])
    seta((36, 23.6), (36, 16.4), COR["h2"])          # só o excedente vai ao estoque (comprimido a 200 bar)
    ax.text(34.6, 18.2, "excedente\n2,2 t/dia", ha="right", fontsize=5.6, color=COR["h2"], linespacing=1.05)

    # fábrica: linha de cima (escape), meio (eletricidade e secador), baixo (forno e trocador)
    caixa(60, 55, 34, 15, "Turbina a gás · 5,2 MW", "30% " + H2 + " (vol.) + gás natural\nη = 35% · escape a 500 °C",
          "#FFFFFF")
    caixa(98.5, 57, 26, 11, "Queimador de duto", H2 + ": 8,39 MJ$_t$", "#F6D5D1", ft=6.4)
    caixa(131, 55, 44, 14, "Atomizador · 550 °C", "39,60 MJ$_t$ = 27,86 do escape\n+ 3,36 do ar + 8,39 do queimador",
          "#FDEBD8")
    caixa(60, 31, 34, 10, "Eletricidade da fábrica", "15,00 MJ$_e$ (da rede: 0)", "#E3ECF5")
    caixa(137, 31, 38, 12, "Secador · 210 °C", "11,09 MJ$_t$ = 9,61 do ar\n+ 1,48 do trocador", "#E4F2E9")
    caixa(98, 7, 30, 13, "Forno a rolos", H2 + " + " + O2 + " puro\n52,00 MJ$_t$", "#F6D5D1")
    caixa(141, 7, 34, 10, "Trocador gás-gás", "exaustão 200 → 188 °C", "#EEE8F6")

    # gás natural, escape e eletricidade
    seta((77, 75.2), (77, 70.4), "#56606A")
    ax.text(79, 71.6, "gás natural 37,97 MJ (1,058 m³)", fontsize=6.4, color="#56606A", va="bottom")
    seta((94.4, 62.5), (98.1, 62.5), COR["esc"], lw=2.2)
    seta((124.9, 62.5), (130.6, 62.5), COR["esc"], lw=2.2)
    seta((77, 54.6), (77, 41.4), COR["rede"], "15,00 MJ$_e$", dx=1.5, dy=2.2, ha="left")

    # hidrogênio: sai do eletrolisador a 30 bar direto para a fábrica; o estoque (200 bar) só recebe o excedente
    # e devolve o H₂ na ponta e nas paradas
    via([(45.4, 29), (52.5, 29)], COR["h2"])
    via([(52.5, 29), (52.5, 11.5), (97.6, 11.5)], COR["h2"], txt=H2 + " 52,00 MJ (0,433 kg)", xy=(56, 12.2))
    via([(45.4, 11.5), (52.5, 11.5)], COR["h2"])          # volta do estoque na ponta e nas paradas
    via([(52.5, 29), (52.5, 48), (112, 48), (112, 56.6)], COR["h2"], txt=H2 + " 8,39 MJ", xy=(95, 48.6))
    via([(52.5, 48), (52.5, 66), (59.6, 66)], COR["h2"], txt=H2 + " 4,89 MJ", xy=(53.4, 71.0))
    via([(13.5, 6.6), (13.5, 3.5), (113, 3.5), (113, 6.6)], COR["trc"], txt=O2 + " 3,44 kg", xy=(70, 4.1))

    # correntes quentes do forno (ar de resfriamento a 225 °C): uma rota para cada uso, sem cruzar
    via([(116, 20.4), (116, 44), (128, 44), (128, 52), (138, 54.6)], COR["ar"], lw=1.6)
    via([(125, 20.4), (125, 26), (147, 26), (147, 30.6)], COR["ar"], lw=1.6)
    ax.text(117.5, 33, "ar de\nresfriamento\n225 °C", fontsize=6.2, color=COR["ar"], linespacing=1.1)
    ax.text(117.5, 44.6, "3,36 MJ$_t$", fontsize=6.2, color=COR["ar"])
    ax.text(126.5, 26.6, "9,61 MJ$_t$", fontsize=6.2, color=COR["ar"])
    seta((128.4, 12), (140.6, 12), "#7D5BA6", "exaustão", dy=0.5)
    seta((162, 17.4), (162, 30.6), COR["trc"], "ar 150 °C\n1,48 MJ$_t$", dx=1.4, dy=-3.6, ha="left")
    salva(fig, "fig_ciclo")


# ───────────────────── Fig. 2: fontes de calor por operação (coluna) ─────────────────────
def fig_calor():
    # memorial: Tab. "termico0", Tab. "recB", Eqs. (qesc), (marat), (duto), (arsec), (trcp), (forno2)
    dem = {"Atomizador": 39.60, "Secador": 11.09}
    casos = [("Atomizador", [("Ciclo 0", {"gn": 39.60}),
                             ("Recuperação", {"ar": 12.97, "trc": 1.14, "gn": 25.48}),
                             ("Proposto", {"esc": 27.86, "ar": 3.36, "h2": 8.39})]),
             ("Secador", [("Ciclo 0", {"gn": 11.09}),
                          ("Recuperação", {"trc": 7.07, "gn": 4.02}),
                          ("Proposto", {"ar": 9.61, "trc": 1.48})]),
             ("Forno", [("Ciclo 0", {"gn": 54.91}),
                        ("Recuperação", {"gn": 54.91}),
                        ("Proposto", {"h2": 52.00})])]
    nomes = {"gn": "gás natural", "h2": H2, "esc": "escape da turbina", "ar": "ar de resfriamento", "trc": "ar do trocador"}
    fig, ax = plt.subplots(figsize=(COL, 2.75))
    y, ticks, rot, usados = 0, [], [], []
    for op, linhas in casos:
        for caso, fontes in linhas:
            x = 0
            for k, v in fontes.items():
                ax.barh(y, v, left=x, color=COR[k], height=0.72, edgecolor="white", lw=0.4,
                        label=nomes[k] if k not in usados else None)
                usados.append(k)
                x += v
            ax.text(x + 0.8, y, br(dem.get(op, x), 2), va="center", fontsize=6.6)
            ticks.append(y); rot.append(f"{op}: {caso}" if caso == "Ciclo 0" else caso)
            y -= 1
        y -= 0.5
    ax.set_yticks(ticks); ax.set_yticklabels(rot)
    ax.set_xlabel("Calor entregue (MJ$_t$ por m² de produto)")
    ax.set_xlim(0, 64)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(loc="lower center", bbox_to_anchor=(0.42, 1.0), frameon=False, ncol=3, handlelength=1.1,
              columnspacing=0.8, fontsize=6.6)
    salva(fig, "fig_calor")


# ───────────────────── Fig. 3: CO2 por m² (coluna) ─────────────────────
def fig_co2():
    # memorial Eqs. (co2s1), (co2s2), (co2b), (co2p)
    fe, fs = 0.0561, 0.0385 / 3.6
    casos = [("Ciclo 0", 105.59 * fe, 14.40 * fs), ("Com recuperação", 84.41 * fe, 15.00 * fs),
             ("Ciclo proposto", 37.97 * fe, 0.0)]
    fig, ax = plt.subplots(figsize=(COL, 1.75))
    for i, (n, s1, s2) in enumerate(casos):
        ax.bar(i, s1, color=COR["gn"], width=0.55, label="escopo 1 (gás natural)" if i == 0 else None)
        ax.bar(i, s2, bottom=s1, color=COR["rede"], width=0.55, label="escopo 2 (rede)" if i == 0 else None)
        tot = s1 + s2
        rot = br(tot, 2) + ("" if i == 0 else f"  ({br((tot / (casos[0][1] + casos[0][2]) - 1) * 100, 0)}%)")
        ax.text(i, tot + 0.12, rot, ha="center", fontsize=7)
    ax.set_xticks(range(3)); ax.set_xticklabels([c[0] for c in casos])
    ax.set_ylabel(CO2 + " (kg por m²)"); ax.set_ylim(0, 7.2)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, loc="upper right")
    salva(fig, "fig_co2")


# ───────────────────── Fig. 4: investimento por item (coluna) ─────────────────────
def fig_invest():
    c = dados("custos")
    def item(chave):
        return next(r for r in c if r["item"].startswith(chave))
    grupos = [("Campo fotovoltaico", [item("Campo fotovoltaico")]),
              ("Eletrolisador alcalino", [item("Eletrolisador")]),
              ("Estoque de " + H2 + " (1 dia)", [item("Estoque")]),
              ("Turbina a gás", [item("Turbina")]),
              ("Demais itens da fábrica", [r for r in c if r["grupo"] == "Fábrica" and not r["item"].startswith("Turbina")]),
              ("Compressor de " + H2, [item("Compressor")])]
    partes = [("equipamento", "equipamento", COR["eq"]), ("importacao", "importação (+80%) ou Brasil (+14%)", COR["imp"]),
              ("instalacao", "instalação", COR["inst"]), ("indiretos", "indiretos", COR["ind"])]
    fig, ax = plt.subplots(figsize=(COL, 2.0))
    for i, (nome, rs) in enumerate(grupos):
        x = 0
        for k, rot, cor in partes:
            v = sum((r[k] or 0) for r in rs) / 1e6
            if k == "instalacao":       # itens dados só pelo total (dutos e tubulações) entram como instalação
                v += sum(r["total"] / 1e6 for r in rs if not any(r[q] for q in ("equipamento", "importacao", "instalacao", "indiretos")))
            ax.barh(-i, v, left=x, color=cor, height=0.66, label=rot if i == 0 else None, edgecolor="white", lw=0.3)
            x += v
        ax.text(x + 2, -i, br(x, 1), va="center", fontsize=7)
    ax.set_yticks([-i for i in range(len(grupos))]); ax.set_yticklabels([g[0] for g in grupos])
    ax.set_xlabel("US$ milhões de 2026"); ax.set_xlim(0, 185)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, loc="lower right", handlelength=1.2)
    salva(fig, "fig_invest")


# ───────────────────── Fig. 5: dinheiro acumulado (coluna) ─────────────────────
def fig_fluxo():
    f = dados("fluxo")
    tir = next(r["valor"] for r in dados("indicadores") if r["chave"] == "tir")
    anos = [r["ano"] for r in f]
    sem, a8, atir, s, t = [], [r["acumulado_desc"] / 1e6 for r in f], [], 0, 0
    for r in f:
        s += r["fluxo"] / 1e6; sem.append(s)
        t += r["fluxo"] / 1e6 / (1 + tir) ** r["ano"]; atir.append(t)
    fig, ax = plt.subplots(figsize=(COL, 1.9))
    ax.axhline(0, color="#33475B", lw=0.6)
    ax.plot(anos, sem, color=COR["gn"], lw=1.3, label="sem desconto")
    ax.plot(anos, a8, color=COR["imp"], lw=1.6, label="a 8% ao ano (VPL)")
    ax.plot(anos, atir, color=COR["eq"], lw=1.3, ls="--", label=f"à TIR ({br(tir * 100, 1)}% ao ano)")
    for serie, cor in ((sem, COR["gn"]), (a8, COR["imp"])):
        ax.text(25.4, serie[-1], br(serie[-1], 0), va="center", fontsize=6.8, color=cor)
    ax.set_xlabel("Ano"); ax.set_ylabel("US$ milhões acumulados"); ax.set_xlim(0, 28)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, loc="upper left")
    salva(fig, "fig_fluxo")


# ───────────────────── Fig. 6: tornado do VPL (coluna) ─────────────────────
def fig_tornado():
    s = dados("sensibilidade")
    nomes = {"Eletrolisador": "Eletrolisador: 600 a 1.200 US$/kW",
             "Fotovoltaica": "Fotovoltaica: R$ 2,40 a 5,50/Wp",
             "Acréscimo": "Importação: 0% a 87%",
             "Taxa": "Taxa de desconto: 6% a 10% ao ano",
             "Vida": "Vida útil: 25 para 20 anos",
             "Manutenção": "Manutenção: 1,5% a 3,0% ao ano",
             "Diferença": "Acerto na CCEE: R$ 21 a 77/MWh",
             "Tarifa": "Tarifa da usina: 0 a R$ 9,74/kW·mês"}
    base = s[0]["vpl_base"] / 1e6
    linhas = []
    for r in s:
        n = next(v for k, v in nomes.items() if r["parametro"].startswith(k))
        lo, hi = r["vpl_baixo"] / 1e6, r["vpl_alto"] / 1e6
        linhas.append((abs(hi - lo), n, lo, hi))
    linhas.sort()
    fig, ax = plt.subplots(figsize=(COL, 2.15))
    for i, (_, n, lo, hi) in enumerate(linhas):
        for v, cor in ((lo, COR["eq"]), (hi, COR["imp"])):
            ax.barh(i, v - base, left=base, color=cor, height=0.62)
            if abs(v - base) > 0.5:
                ax.text(v + (2 if v > base else -2), i, br(v, 0), va="center", ha="left" if v > base else "right", fontsize=6.4)
    ax.axvline(base, color="#33475B", lw=0.7)
    ax.set_yticks(range(len(linhas))); ax.set_yticklabels([l[1] for l in linhas], fontsize=6.8)
    ax.set_xlabel(f"VPL (US$ milhões); caso-base {br(base, 0)}")
    ax.set_xlim(-375, -150)
    ax.spines[["top", "right"]].set_visible(False)
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(color=COR["eq"], label="primeiro valor da faixa"), Patch(color=COR["imp"], label="segundo valor")],
              frameon=False, loc="lower left", fontsize=6.4, handlelength=1)
    salva(fig, "fig_tornado")


# ───────────────────── Fig. 7: incerteza conjunta, Monte Carlo (180 mm) ─────────────────────
def fig_mc():
    """Lê artigo_v2/incerteza.json e incerteza_amostras.json (gerados por incerteza.js)."""
    import numpy as np
    r = json.loads((AQUI.parent / "incerteza.json").read_text(encoding="utf-8"))
    a = json.loads((AQUI.parent / "incerteza_amostras.json").read_text(encoding="utf-8"))
    vpl, gz = np.array(a["vpl"]), np.sort(np.array(a["gasZera"]))
    e, pgn, base = r["estatisticas"]["vpl"], r["p_gn"], r["base"]
    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(PAG, 2.1), gridspec_kw={"width_ratios": [1, 1, 0.82], "wspace": 0.72})

    # (a) distribuição do VPL
    pesos = np.full(len(vpl), 100 / len(vpl))
    ax1.hist(vpl, bins=np.arange(-400, -130, 5), weights=pesos, color=COR["eq"], alpha=0.85, lw=0)
    topo = ax1.get_ylim()[1]
    ax1.set_ylim(0, topo * 1.32)
    for v, rot, ls in ((e["p05"], "P5", ":"), (e["p50"], "P50", "--"), (e["p95"], "P95", ":")):
        ax1.axvline(v, color="#33475B", lw=0.7, ls=ls, ymax=0.84)
        ax1.text(v, 0.99, f"{rot}\n{br(v, 0)}", transform=ax1.get_xaxis_transform(), ha="center", va="top", fontsize=6.2,
                 color="#33475B", linespacing=1.0)
    ax1.axvline(base["vpl"], color=COR["imp"], lw=1.1, ymax=0.84)
    ax1.plot([-392, -381], [0.62, 0.62], transform=ax1.get_xaxis_transform(), color=COR["imp"], lw=1.1)
    ax1.text(-378, 0.62, f"caso-base\n({br(base['vpl'], 1)})", transform=ax1.get_xaxis_transform(), ha="left", va="center",
             fontsize=6.2, color=COR["imp"], linespacing=1.0)
    ax1.set_xlim(-400, -130)
    ax1.set_xlabel("VPL com o gás de hoje (US$ milhões)"); ax1.set_ylabel("Sorteios (%)")
    ax1.set_title("(a)", loc="left", fontsize=8)

    # (b) probabilidade de se pagar × preço do gás natural (distribuição do preço que zera o VPL)
    x = np.linspace(3, 13, 401)
    p = np.searchsorted(gz, x, side="right") / len(gz) * 100
    ax2.plot(x, p, color=COR["eq"], lw=1.5)
    for mult, rot in ((1, "hoje"), (2, "2×"), (3, "3×")):
        g = mult * pgn
        pr = np.searchsorted(gz, g, side="right") / len(gz) * 100
        ax2.axvline(g, color=COR["gn"], lw=0.6, ls=":")
        ax2.text(g + 0.12, 2, f"{rot}\n{br(pr, 0)}%", ha="left", va="bottom", fontsize=6.2, color="#33475B", linespacing=1.0)
    for q, rot in ((0.5, "50%"), (0.9, "90%")):
        g = float(np.quantile(gz, q))
        ax2.plot([3, g], [q * 100, q * 100], color=COR["imp"], lw=0.6, ls="--")
        ax2.plot(g, q * 100, "o", ms=2.6, color=COR["imp"])
        ax2.text(g - 0.3, q * 100 + 1.5, f"R\\$ {br(g, 2)}/m³", ha="right", va="bottom", fontsize=6.4, color=COR["imp"])
    ax2.set_xlim(3, 13); ax2.set_ylim(0, 100); ax2.set_yticks([0, 25, 50, 75, 100])
    ax2.set_xlabel("Preço do gás natural (R$/m³)"); ax2.set_ylabel("Probabilidade de VPL > 0 (%)")
    ax2.set_title("(b)", loc="left", fontsize=8)

    # (c) correlação de postos de cada hipótese com o VPL
    nomes = {"cfv": "Fotovoltaica", "tusdg": "Tarifa da usina", "imp": "Importação", "celz": "Eletrolisador, US$/kW",
             "kwh": "Eletrolisador, kWh/kg", "pld": "Acerto na CCEE", "om": "Manutenção", "fr": "Frações de calor¹",
             "eta": "Rendimento da turbina"}
    sp = sorted(((r["spearman"][k]["vpl"], n) for k, n in nomes.items()), key=lambda t: -abs(t[0]))[::-1]
    for i, (v, n) in enumerate(sp):
        ax3.barh(i, v, color=COR["imp"] if v < 0 else COR["eq"], height=0.62)
        dentro = abs(v) > 0.5                       # barra longa: valor dentro dela, em branco
        ax3.text(v + 0.03 if dentro else v - 0.02, i, br(v, 2), va="center", ha="left" if dentro else "right", fontsize=6.2,
                 color="white" if dentro else "black")
    ax3.axvline(0, color="#33475B", lw=0.6)
    ax3.set_yticks(range(len(sp))); ax3.set_yticklabels([n for _, n in sp], fontsize=6.8)
    ax3.set_xlim(-1.05, 0.12); ax3.set_xlabel("Correlação de postos com o VPL")
    ax3.set_title("(c)", loc="left", fontsize=8)
    from matplotlib.ticker import FuncFormatter
    for ax in (ax2, ax3):                         # vírgula decimal nos eixos, como nos rótulos
        ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, 1)))
    for ax in (ax1, ax2, ax3):
        ax.spines[["top", "right"]].set_visible(False)
    salva(fig, "fig_mc")


# ───────────────────── Fig. 8: otimização (180 mm) ─────────────────────
def fig_otim():
    """Lê artigo_v2/otimiza.json (gerado por otimiza.js)."""
    from matplotlib.ticker import FuncFormatter
    o = json.loads((AQUI.parent / "otimiza.json").read_text(encoding="utf-8"))
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(PAG, 2.25), gridspec_kw={"wspace": 0.28})

    # (a) VPL × tamanho do eletrolisador
    for chave, rot, cor, ls in (("base", "caso-base", COR["eq"], "-"), ("pld2025", "PLD de 2025", COR["imp"], "--"),
                                ("elz600", "eletrolisador a 600 US$/kW", COR["ar"], ":")):
        L = o["A"][chave]
        ax1.plot([p["P_MW"] for p in L], [p["vpl"] for p in L], color=cor, lw=1.4, ls=ls, label=rot)
        ax1.plot(L[0]["P_MW"], L[0]["vpl"], "o", ms=3.2, color=cor)
    b0 = o["A"]["base"][0]
    ax1.text(60, -194, f"pontos: o tamanho mínimo, {br(b0['P_MW'], 1)} MW,\né o ótimo nos três casos", fontsize=6.4, color="#33475B",
             ha="left", va="center", linespacing=1.05)
    ax1.set_xlabel("Eletrolisador (MW), operando nas horas de PLD mais baixo"); ax1.set_ylabel("VPL (US$ milhões)")
    ax1.legend(frameon=False, loc="lower left", fontsize=6.4)
    ax1.set_title("(a)", loc="left", fontsize=8)

    # (b) VPL × CO₂ de todas as configurações de uso do H₂ (cinza), com o caminho do sem H₂ ao proposto
    B = o["B"]
    ax2.scatter([p["co2Ano"] / 1000 for p in B], [p["vpl"] for p in B], s=4, color=COR["gn"], alpha=0.45, lw=0, zorder=1)
    pas = o["passos"]
    ax2.plot([p["co2Ano"] / 1000 for p in pas], [p["vpl"] for p in pas], color="#33475B", lw=0.9, marker="o", ms=3.2, zorder=2)
    rot = [f"sem H$_2$ (turbina a gás natural\ne recuperação): +{br(pas[0]['vpl'], 0)}",
           f"+ forno a H$_2$: {br(pas[1]['vpl'], 0)} ({br(pas[1]['custoT'], 0)} US\\$/t)",
           f"+ duto a H$_2$: {br(pas[2]['vpl'], 0)} ({br(pas[2]['custoT'], 0)} US\\$/t)",
           f"+ 30% de H$_2$ na turbina (proposto):\n{br(pas[3]['vpl'], 0)} ({br(pas[3]['custoT'], 0)} US\\$/t)"]
    pos = [(62, 45, "right"), (40, -150, "left"), (40, -182, "left"), (40, -218, "left")]
    for p, r, (tx, ty, ha) in zip(pas, rot, pos):
        ax2.annotate(r, xy=(p["co2Ano"] / 1000, p["vpl"]), xytext=(tx, ty), fontsize=6.2, ha=ha, va="center", color="#33475B",
                     linespacing=1.0, arrowprops=dict(arrowstyle="-", color="#9AA7B4", lw=0.5, shrinkA=1, shrinkB=2))
    ax2.plot(66.576, 0, "s", ms=3.4, color="#33475B"); ax2.text(66.6, -9, "ciclo 0", fontsize=6.2, ha="center", va="top", color="#33475B")
    ax2.axvline(25, color=COR["eq"], lw=0.7, ls="--")
    ax2.text(25.6, -55, "limite de conciliação\ndo SBCE (25 mil t/ano)", fontsize=6.2, color=COR["eq"], ha="left", va="center", linespacing=1.0)
    ax2.axhline(0, color="#33475B", lw=0.5)
    ax2.set_xlim(18, 72); ax2.set_ylim(-245, 60)
    ax2.set_xlabel("CO$_2$ fóssil (mil t/ano)"); ax2.set_ylabel("VPL (US$ milhões)")
    ax2.set_title("(b)", loc="left", fontsize=8)
    for ax in (ax1, ax2):
        ax.spines[["top", "right"]].set_visible(False)
        ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, 0)))
        ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: br(v, 0)))
    salva(fig, "fig_otim")


if __name__ == "__main__":
    for f in (fig_ciclo, fig_calor, fig_co2, fig_invest, fig_fluxo, fig_tornado, fig_mc, fig_otim):
        f(); print("ok", f.__name__)
