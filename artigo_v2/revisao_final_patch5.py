# -*- coding: utf-8 -*-
"""Revisão final, parte 5 (27/11/2026): o que faltava frente à outra versão revisada (Artigo_Porcelanato_Revisado.pdf):
rendimento de 31,5% conferido pelo consumo térmico ISO, faturas diárias da TG1, O2 do queimador de duto, ressalvas do
combustor a 30% de H2 e da diluição no secador, exergia física das correntes recuperadas, custo marginal antes e depois
do forno, e dependência do SBCE da regulamentação. Números do modelo atual (caso_rev.json, otimiza_rev.json).
Uso: python artigo_v2/revisao_final_patch5.py   (idempotente; depois python artigo_v2/monta_rev.py)"""
import sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
AQUI = pathlib.Path(__file__).resolve().parent
p = AQUI / "Grupo-03__Artigo_rev.tex"
t = p.read_text(encoding="utf-8")
crlf = "\r\n" in t
t = t.replace("\r\n", "\n")

pares = [
    # Cabeçalho
    ("_patch3.py e _patch4.py (revisao_final_patch4: tarifa TG1).",
     "_patch3.py, _patch4.py (tarifa TG1) e _patch5.py."),
    # Rendimento conferido pelo consumo térmico ISO
    ("com 5.670~kW e rendimento de 31,5\\% \\cite{gtw2018}, adotado",
     "com 5.670~kW e consumo térmico de 11.430~kJ/kWh nas condições ISO, ou rendimento de $3.600/11.430 = 31{,}5\\%$ \\cite{gtw2018,solar2026}, adotado"),
    # Combustor a 30% de H2
    ("admitem hoje de 20\\% a 30\\% de \\Ht{} em volume \\cite{netl2022}.",
     "admitem hoje de 20\\% a 30\\% de \\Ht{} em volume \\cite{netl2022}; para o combustor do Taurus 60, os 30\\% precisam ser confirmados pelo fabricante."),
    # O2 do queimador de duto
    ("O queimador de duto completa a energia queimando \\Ht{} no oxigênio que sobra no escape:",
     "O queimador de duto completa a energia queimando \\Ht{} no oxigênio que sobra no escape: o ar em excesso da turbina leva cerca de 10,5~kg/m² de \\Ot, e o queimador consome 0,37~kg/m², menos de 4\\% disso:"),
    # Diluição e umidade no secador
    ("e o trocador da exaustão é dispensado (com 35\\%, o escape menor deixa ar de menos e o trocador entrega 1,48~\\MJt/m²).",
     "e o trocador da exaustão é dispensado (com 35\\%, o escape menor deixa ar de menos e o trocador entrega 1,48~\\MJt/m²). O ar chega a 225~°C, e só a parte necessária entra no secador, diluída com ar ambiente até a temperatura de uso; essa diluição e a umidade dos gases de \\Ht{} ficam para o projeto de detalhe."),
    # Faturas diárias na TG1
    ("(o ciclo 0 usa 88,2~mil~m³/dia e o proposto, 35,5~mil, e o gás evitado",
     "(o ciclo 0 usa 88,2~mil~m³/dia, uma fatura de R\\$~313,6~mil por dia, e o proposto, 35,5~mil, R\\$~129,8~mil por dia; o gás evitado"),
    # Custo marginal antes e depois da conversão do forno
    ("614~US\\$/t no forno e cerca de 670~US\\$/t no duto e na turbina,",
     "614~US\\$/t no forno; depois dele, 650~US\\$/t no duto e 647 na turbina, e, sem converter o forno, 670 e 669, de modo que a ordem dos passos muda pouco o custo,"),
    # Exergia física das correntes recuperadas
    ("o escape a 500~°C no atomizador e o ar a 225~°C no secador destroem só 3,2~MJ/m².",
     "o escape a 500~°C no atomizador e o ar a 225~°C no secador destroem só 3,2~MJ/m². A exergia física das correntes explica a escolha: o escape leva 13,11~MJ/m² (0,402~MJ por MJ sensível) e o ar a 225~°C, 2,61~MJ/m² (0,235); a corrente mais quente vai ao atomizador, que pede gás a 550~°C, e a mais fria ao secador, a 125~°C. Essa comparação usa só correntes de gás calculadas e não depende da exergia retida na peça."),
    # SBCE: regulamentação
    ("Com 35\\%, ficaria em 23,5~mil~t/ano, abaixo do limite.",
     "Com 35\\%, ficaria em 23,5~mil~t/ano, abaixo do limite. Nos dois casos, o enquadramento efetivo depende da regulamentação da lei e da contabilização dos carbonatos."),
]
for velho, novo in pares:
    if novo in t:
        continue
    n = t.count(velho)
    if n != 1:
        sys.exit(f"✗ trecho encontrado {n} vezes: {velho[:70]}")
    t = t.replace(velho, novo)
if crlf:
    t = t.replace("\n", "\r\n")
p.write_text(t, encoding="utf-8")
print("✓ Grupo-03__Artigo_rev.tex")
