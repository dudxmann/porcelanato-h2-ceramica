# -*- coding: utf-8 -*-
"""Correções objetivas da revisão final (26/11/2026, noite) no artigo revisado.
Uso: python artigo_v2/revisao_final_patch.py   (na pasta do projeto; idempotente)
Depois: python artigo_v2/monta_rev.py   (refaz figuras e PDF)"""
import re, sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
AQUI = pathlib.Path(__file__).resolve().parent

def troca(arq, pares):
    p = AQUI / arq
    t = p.read_text(encoding="utf-8")
    for velho, novo in pares:
        if velho not in t:   # já aplicado, ou o trecho foi reescrito por uma parte posterior
            continue
        n = t.count(velho)
        if n != 1:
            sys.exit(f"✗ {arq}: trecho encontrado {n} vezes: {velho[:60]}")
        t = t.replace(velho, novo)
    p.write_text(t, encoding="utf-8")
    print("✓", arq)

troca("Grupo-03__Artigo_rev.tex", [
    # 1. Ordem do tornado: o eletrolisador (−289 a −238) pesa mais que os encargos (−264 a −220)
    ("seguido dos encargos da fotovoltaica e do preço do eletrolisador. Como o fluxo",
     "seguido do preço do eletrolisador e dos encargos da fotovoltaica. Como o fluxo"),
    # 2. O&M da FV é convertida a 6,10 R$/US$ (EPE), não a 5,3488
    ("Os custos anuais e os totais em reais usam 5,3488~R\\$/US\\$ \\cite{agrolink2026}.",
     "Os demais custos anuais (a operação e manutenção da fotovoltaica, da EPE, também a 6,10) e os totais em reais usam 5,3488~R\\$/US\\$ \\cite{agrolink2026}."),
    # 3. SBCE: quem passa do limite concilia todas as emissões, não só o excedente
    ("o projeto não tira a fábrica da conciliação, só a reduz a 1,1~mil~t/ano, mais o \\COt{} dos carbonatos da massa, que não foi levantado.",
     "o projeto reduz as emissões a conciliar a 40\\% das do ciclo 0, mas não tira a fábrica da conciliação: fica 1,1~mil~t/ano acima do limite, sem contar o \\COt{} dos carbonatos da massa, que não foi levantado."),
    # 4. Remissão fixa "Seção 5.2" vira \ref
    ("\\subsection{Turbina a gás e atomizador}\n", "\\subsection{Turbina a gás e atomizador}\\label{sec:tg}\n"),
    ("trocador dispensado (Seção 5.2)", "trocador dispensado (Seção~\\ref{sec:tg})"),
    # 5. Unidade com parênteses, como na Tabela 8 e na produtividade da FV
    ("R\\$~120/kW·ano & \\cite{epe2025}", "R\\$~120/(kW·ano) & \\cite{epe2025}"),
    ("R\\$~60/kW·ano \\cite{epe2025}", "R\\$~60/(kW·ano) \\cite{epe2025}"),
    ("R\\$~120/kW·ano \\cite{epe2025}, menos os R\\$~48/kW·ano", "R\\$~120/(kW·ano) \\cite{epe2025}, menos os R\\$~48/(kW·ano)"),
])

# 6. Referências: "Disponível em:" (NBR 6023) em todas e traço meio nas faixas de páginas
p = AQUI / "referencias_rev.tex"
t = p.read_text(encoding="utf-8")
t = t.replace("Disponível:", "Disponível em:")
t = re.sub(r"pp\. (\d+)-(\d+)", r"pp. \1--\2", t)
t = t.replace("n. 8-9", "n. 8--9")
p.write_text(t, encoding="utf-8")
print("✓ referencias_rev.tex")

troca("figs/gera_figs_rev.py", [
    # 7. Tornado: caso-base com uma casa, como no texto (−263,5)
    ('ax.set_xlabel(f"VPL (US$ milhões); caso-base {br(base, 0)}")', 'ax.set_xlabel(f"VPL (US$ milhões); caso-base {br(base, 1)}")'),
    # 8. Fig. 8a: a nota sobre o tamanho mínimo cobria as curvas; agora fica em coordenadas do eixo,
    #    no canto livre de cima (já feito em gera_figs_rev.py)
])
