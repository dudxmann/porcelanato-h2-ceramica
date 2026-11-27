# -*- coding: utf-8 -*-
"""Revisão final, parte 3 (26/11/2026, noite): números do texto depois de padronizar o câmbio dos encargos da FV
(R$ 120/kW·ano da EPE a 6,10 R$/US$, como o preço e a O&M da FV; a tarifa da usina, da ANEEL, a 5,3488), mais os
ajustes aprovados pelo Eduardo: Eq. (20) arredondada, origem dos 18%, "abaixo", "praticamente igual", exergia
na fronteira ampliada, retorno da recuperação como estimativa preliminar.
Números de caso_rev.json, incerteza_rev.json e otimiza_rev.json depois de modelo_rev.js corrigido.
Uso: python artigo_v2/revisao_final_patch3.py   (uma vez, depois das partes 1 e 2)"""
import sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
AQUI = pathlib.Path(__file__).resolve().parent
p = AQUI / "Grupo-03__Artigo_rev.tex"
t = p.read_text(encoding="utf-8")
crlf = "\r\n" in t
t = t.replace("\r\n", "\n")
if "revisao_final_patch3" in t or "_patch3.py" in t:
    sys.exit("✓ parte 3 já aplicada")

def r(velho, novo, n=1):
    global t
    c = t.count(velho)
    if c != n:
        sys.exit(f"✗ esperado {n}, achado {c}: {velho[:70]}")
    t = t.replace(velho, novo)

# ── Resumo
r("os combustíveis são contabilizados", "os combustíveis são contabilizados")  # âncora de sanidade
r("as emissões caem 61\\%, para 2,39~kg/m², mas a eficiência exergética cai para 25\\%, porque a eletrólise e a turbina destroem 72~MJ/m².",
  "as emissões caem 61\\%, para 2,39~kg/m², mas a eficiência exergética, numa fronteira ampliada que inclui a eletricidade do campo fotovoltaico, cai para 25\\%: a rede e o eletrolisador destroem 50,7~MJ/m² e a turbina, 21,0.")
r("o valor presente líquido a 8\\% ao ano em 25 anos é de −US\\$~263,5 milhões, o \\Ht{} custa US\\$~6,73/kg e evitar \\COt{} custa US\\$~611/t.",
  "o valor presente líquido a 8\\% ao ano em 25 anos é de −US\\$~254,7 milhões, o \\Ht{} custa US\\$~6,58/kg e evitar \\COt{} custa US\\$~590/t.")
r("e o gás teria de passar de R\\$~11,15/m³ para o projeto se pagar com 90\\% de probabilidade.",
  "e o gás teria de passar de R\\$~10,99/m³ para o projeto se pagar com 90\\% de probabilidade.")

# ── Seção 2.4 e validação
r("muda no máximo 0,45\\% em qualquer percentil;", "muda no máximo 0,47\\% em qualquer percentil da Tabela~\\ref{tab:mc_sai};")
r("Custo do \\Ht{} (US\\$/kg) & 6,73 & 2,84--5,56", "Custo do \\Ht{} (US\\$/kg) & 6,58 & 2,84--5,56")
r("Gás que zera o VPL (R\\$/m³) & 10,03 & 8,55", "Gás que zera o VPL (R\\$/m³) & 9,80 & 8,55")
r("fica pouco abaixo dos 83\\% e 85\\% medidos", "fica abaixo dos 83\\% e 85\\% medidos")

# ── Recuperação de calor: estimativa preliminar
r("Com 1,5\\% ao ano de manutenção, o VPL a 8\\% ao ano em 25 anos é de +US\\$~37,4 milhões e o retorno simples, de três meses; mesmo que o custo real, com os dutos longos de ar quente, fosse dez vezes maior, o retorno ficaria abaixo de três anos.",
  "Com 1,5\\% ao ano de manutenção, o VPL a 8\\% ao ano em 25 anos é de +US\\$~37,4 milhões e o retorno simples, de cerca de três meses; mesmo que o custo real, com os dutos longos de ar quente, fosse dez vezes maior, o retorno ficaria abaixo de três anos. É uma estimativa preliminar, para a indústria de referência sem reaproveitamento: o trocador está fora da faixa da correlação, a unidade de Tijucas já reaproveita parte do ar de resfriamento, e uma cotação do trocador e dos dutos daria mais base à recomendação.")

# ── Eletrolisador ligado direto: origem dos 18%
r("Um eletrolisador ligado direto ao campo teria fator de capacidade de só 18\\%.",
  "Um eletrolisador ligado direto ao campo, sem baterias, teria de acompanhar o pico de geração, cerca de 0,72 vez a potência do campo na série horária do PVGIS \\cite{pvgis2026}, e teria fator de capacidade de só 18\\% ($1.137{,}5/(0{,}72 \\times 8.760)$).")

# ── Fluxo de caixa
r("Os demais custos anuais (a operação e manutenção da fotovoltaica, da EPE, também a 6,10) e os totais em reais usam 5,3488~R\\$/US\\$ \\cite{agrolink2026}.",
  "A operação e manutenção e os encargos da fotovoltaica, também da EPE, usam o mesmo câmbio; os demais custos anuais e os totais em reais usam 5,3488~R\\$/US\\$ \\cite{agrolink2026}.")
r("e os encargos da fotovoltaica, R\\$~120/(kW·ano) \\cite{epe2025}, menos os R\\$~48/(kW·ano) da tarifa da usina já contados no uso da rede, US\\$~4,0 milhões.",
  "e os encargos da fotovoltaica, R\\$~120/(kW·ano) \\cite{epe2025} a 6,10~R\\$/US\\$, menos os R\\$~48/(kW·ano) da tarifa da usina, já contados no uso da rede a 5,3488, US\\$~3,2 milhões.")
r("""\\mathrm{FC} &= 11{,}4 + 4{,}9 - 3{,}0 - 1{,}7 - 6{,}6 - 1{,}0 - 4{,}0\\\\
&= -0{,}1\\un{US\\$\\ milhão/ano}.""",
  """\\mathrm{FC} &= 11{,}4 + 4{,}9 - 3{,}0 - 1{,}7 - 6{,}6 - 1{,}0 - 3{,}2\\\\
&= 0{,}76\\un{US\\$\\ milhão/ano}""")
r("\\end{split} \\label{eq:fc}\n\\end{equation}\nCom o fator",
  "\\end{split} \\label{eq:fc}\n\\end{equation}\n(termos arredondados; a soma é feita sem arredondar). Com o fator")
r("-262{,}8 + \\frac{-0{,}07}{0{,}0937} = -263{,}5.", "-262{,}8 + \\frac{0{,}76}{0{,}0937} = -254{,}7.")
r("&= \\frac{22{,}5 + 16{,}0}{5{,}72} = 6{,}73\\un{US\\$/kg}.", "&= \\frac{22{,}5 + 15{,}2}{5{,}72} = 6{,}58\\un{US\\$/kg}.")
r("$-\\mathrm{VPL} \\times \\mathrm{FRC} = 24{,}7$ milhões de US\\$/ano", "$-\\mathrm{VPL} \\times \\mathrm{FRC} = 23{,}9$ milhões de US\\$/ano")
r("= 40,5~mil~t/ano: 611~US\\$/t.", "= 40,4~mil~t/ano: 590~US\\$/t.")

# Tabela 5
r("Fluxo de caixa anual (US\\$ milhões) & −0,1\\\\", "Fluxo de caixa anual (US\\$ milhões) & 0,8\\\\")
r("Valor presente líquido (US\\$ milhões) & −263,5\\\\", "Valor presente líquido (US\\$ milhões) & −254,7\\\\")
r("Taxa interna de retorno & não existe\\textsuperscript{a}\\\\", "Taxa interna de retorno (\\% ao ano) & −14,6\\\\")
r("Custo nivelado do \\Ht{} (US\\$/kg) & 6,73\\\\", "Custo nivelado do \\Ht{} (US\\$/kg) & 6,58\\\\")
r("Custo de evitar \\COt{} (US\\$/t) & 611\\\\", "Custo de evitar \\COt{} (US\\$/t) & 590\\\\")
r("Custo a mais por m² de produto (R\\$) & 12,06\\\\", "Custo a mais por m² de produto (R\\$) & 11,65\\\\")
r("Preço do gás que zera o VPL (R\\$/m³) & 10,03\\\\", "Preço do gás que zera o VPL (R\\$/m³) & 9,80\\\\")
r("VPL depois de impostos (US\\$ milhões) & −225,1\\\\", "VPL depois de impostos (US\\$ milhões) & −219,3\\\\")
r("TIR depois de impostos (\\% ao ano) & −7,1\\\\", "TIR depois de impostos (\\% ao ano) & −6,3\\\\")
r("\\multicolumn{2}{L{7.4cm}}{\\scriptsize \\textsuperscript{a} O fluxo anual é negativo: o investimento nunca volta.}\\\\\n", "")

r("Fora dos anos de troca das pilhas, o fluxo é de US\\$~1,0 milhão por ano; com as três trocas, de US\\$~9,8 milhões cada, o acumulado sem desconto termina em −US\\$~267,9 milhões, abaixo do próprio investimento, e a 8\\% ao ano, no VPL.",
  "Fora dos anos de troca das pilhas, o fluxo é de US\\$~1,8 milhão por ano; com as três trocas, de US\\$~9,8 milhões cada, o acumulado sem desconto termina em −US\\$~247,1 milhões (volta só 6\\% do investimento) e a 8\\% ao ano, no VPL; a TIR é de −14,6\\% ao ano.")
r("o VPL melhora para −US\\$~225,1 milhões", "o VPL melhora para −US\\$~219,3 milhões")

# ── Cenários e sensibilidade
r("o VPL se anula com o gás a R\\$~10,03/m³, 3,2 vezes o de hoje; com o gás pelo dobro, o VPL é de −US\\$~142,0 milhões, e pelo triplo, ainda de −US\\$~20,4 milhões",
  "o VPL se anula com o gás a R\\$~9,80/m³, 3,1 vezes o de hoje; com o gás pelo dobro, o VPL é de −US\\$~133,1 milhões, e pelo triplo, ainda de −US\\$~11,5 milhões")
r("sem o acréscimo de importação, o VPL é de −US\\$~224,1 milhões; com o gás pelo triplo e o investimento pela metade, chega a +US\\$~125,6 milhões.",
  "sem o acréscimo de importação, o VPL é de −US\\$~215,2 milhões; com o gás pelo triplo e o investimento pela metade, chega a +US\\$~134,5 milhões.")
r("o investimento cai para US\\$~202,5 milhões e o \\Ht{} para 5,66~US\\$/kg, mas o VPL ainda é de −US\\$~198,2 milhões.",
  "o investimento cai para US\\$~202,5 milhões e o \\Ht{} para 5,51~US\\$/kg, mas o VPL ainda é de −US\\$~189,3 milhões.")
r("o preço da fotovoltaica pesa mais (−US\\$~248 a −389 milhões), seguido do preço do eletrolisador e dos encargos da fotovoltaica.",
  "o preço da fotovoltaica pesa mais (−US\\$~239 a −380 milhões), seguido do preço do eletrolisador e do acréscimo de importação.")
r("""Caso-base & −263,5 & -- & 6,73\\\\
Gás natural pelo dobro & −142,0 & 0,6 & 6,73\\\\
Gás natural pelo triplo & −20,4 & 7,1 & 6,73\\\\
Sem acréscimo de importação & −224,1 & −14,7 & 6,20\\\\
Eletrolisador a 600~US\\$/kW & −238,1 & −15,6 & 6,31\\\\
Eletrolisador a 1.200~US\\$/kW & −289,0 & -- & 7,14\\\\
Eletrolisador a 2.300~US\\$/kW (fora da China) & −382,5 & -- & 8,67\\\\
Investimento pela metade e gás pelo triplo & +125,6 & 18,0 & 4,55\\\\
2030 (eletrolisador e FV mais baratos) & −198,2 & −16,2 & 5,66\\\\""",
  """Caso-base & −254,7 & −14,6 & 6,58\\\\
Gás natural pelo dobro & −133,1 & 1,1 & 6,58\\\\
Gás natural pelo triplo & −11,5 & 7,5 & 6,58\\\\
Sem acréscimo de importação & −215,2 & −10,9 & 6,06\\\\
Eletrolisador a 600~US\\$/kW & −229,2 & −11,5 & 6,16\\\\
Eletrolisador a 1.200~US\\$/kW & −280,2 & −21,9 & 7,00\\\\
Eletrolisador a 2.300~US\\$/kW (fora da China) & −373,6 & -- & 8,53\\\\
Investimento pela metade e gás pelo triplo & +134,5 & 18,7 & 4,41\\\\
2030 (eletrolisador e FV mais baratos) & −189,3 & −11,2 & 5,51\\\\""")

# ── Robustez
r("A eletrólise de 2030 na China, 62\\% (PCI) \\cite{iea2025b}, ou 54~kWh/kg com a compressão, melhora o VPL em US\\$~26 milhões;",
  "A eletrólise de 2030 na China, 62\\% (PCI) \\cite{iea2025b}, ou 54~kWh/kg com a compressão, melhora o VPL em US\\$~25 milhões;")
r("""Caso-base (31,5\\%) & 0,523 & 2,39 & −263,5 & 6,73\\\\
Turbina a 35\\% \\cite{boyce2012} & 0,542 & 2,15 & −270,4 & 6,73\\\\
Eletrólise de 2030 (54~kWh/kg) & 0,523 & 2,39 & −237,9 & 6,31\\\\
Frações de calor 49/39/12\\% & 0,506 & 2,39 & −250,5 & 6,73\\\\
Frações de calor 55/36/9\\% & 0,540 & 2,39 & −276,9 & 6,73\\\\
Estoque só do excedente & 0,523 & 2,39 & −230,5 & 6,19\\\\
Pilha a 15\\% / 20\\% & 0,523 & 2,39 & −261,9 / −265,1 & 6,70 / 6,75\\\\""",
  """Caso-base (31,5\\%) & 0,523 & 2,39 & −254,7 & 6,58\\\\
Turbina a 35\\% \\cite{boyce2012} & 0,542 & 2,15 & −261,2 & 6,58\\\\
Eletrólise de 2030 (54~kWh/kg) & 0,523 & 2,39 & −229,6 & 6,17\\\\
Frações de calor 49/39/12\\% & 0,506 & 2,39 & −241,9 & 6,58\\\\
Frações de calor 55/36/9\\% & 0,540 & 2,39 & −267,7 & 6,58\\\\
Estoque só do excedente & 0,523 & 2,39 & −221,6 & 6,04\\\\
Pilha a 15\\% / 20\\% & 0,523 & 2,39 & −253,1 / −256,3 & 6,56 / 6,61\\\\""")

# ── Monte Carlo
r("VPL (US\\$ milhões) & −263,5 & −331,9 & −262,8 & −206,1\\\\", "VPL (US\\$ milhões) & −254,7 & −325,3 & −256,6 & −201,5\\\\")
r("Custo do \\Ht{} (US\\$/kg) & 6,73 & 5,79 & 6,66 & 7,76\\\\", "Custo do \\Ht{} (US\\$/kg) & 6,58 & 5,72 & 6,56 & 7,65\\\\")
r("Custo de evitar \\COt{} (US\\$/t) & 611 & 461 & 589 & 745\\\\", "Custo de evitar \\COt{} (US\\$/t) & 590 & 451 & 575 & 730\\\\")
r("Gás que zera o VPL (R\\$/m³) & 10,03 & 8,35 & 9,78 & 11,53\\\\", "Gás que zera o VPL (R\\$/m³) & 9,80 & 8,22 & 9,63 & 11,36\\\\")
r("nenhum percentil da Tabela~\\ref{tab:mc_sai} muda mais de 0,45\\%.", "nenhum percentil da Tabela~\\ref{tab:mc_sai} muda mais de 0,47\\%.")
r("em 90\\% delas o VPL fica entre −US\\$~332 milhões e −US\\$~206 milhões, e em 9\\% a TIR nem existe. Com as pilhas e os encargos no caso-base, ele fica no meio da distribuição (49\\% das combinações abaixo dele).",
  "em 90\\% delas o VPL fica entre −US\\$~325 milhões e −US\\$~202 milhões, e em 3\\% a TIR nem existe. Com as pilhas e os encargos no caso-base, ele fica no meio da distribuição (52\\% das combinações abaixo dele).")
r("(correlação de postos de −0,79 com o VPL)", "(correlação de postos de −0,80 com o VPL)")
r("o gás teria de custar R\\$~9,78/m³, 3,1 vezes o de hoje; com 90\\%, R\\$~11,15/m³, 3,5 vezes. Com o gás pelo dobro, nenhuma combinação se paga; pelo triplo, 38\\%.",
  "o gás teria de custar R\\$~9,63/m³, 3,0 vezes o de hoje; com 90\\%, R\\$~10,99/m³, 3,5 vezes. Com o gás pelo dobro, nenhuma combinação se paga; pelo triplo, 45\\%.")

# ── Otimização
r("O VPL piora US\\$~5,3 milhões nos primeiros 10\\% e chega a −US\\$~326,7 milhões com o dobro",
  "O VPL piora US\\$~5,2 milhões nos primeiros 10\\% e chega a −US\\$~317,8 milhões com o dobro")
r("662~US\\$/t no forno e de 705 a 719~US\\$/t no duto e na turbina", "642~US\\$/t no forno e de 683 a 698~US\\$/t no duto e na turbina")
r("com 670~US\\$/t do sem \\Ht{} ao proposto", "com 649~US\\$/t do sem \\Ht{} ao proposto")
r("""+ forno a \\Ht{} com \\Ot & 0,433 & 2,99 & −213,8 & 662\\\\
+ queimador de duto a \\Ht & 0,480 & 2,67 & −240,0 & 708\\\\
+ 30\\% de \\Ht{} na turbina (proposto) & 0,523 & 2,39 & −263,5 & 705\\\\""",
  """+ forno a \\Ht{} com \\Ot & 0,433 & 2,99 & −206,5 & 642\\\\
+ queimador de duto a \\Ht & 0,480 & 2,67 & −231,8 & 686\\\\
+ 30\\% de \\Ht{} na turbina (proposto) & 0,523 & 2,39 & −254,7 & 683\\\\""")

# ── Exergia
r("Mas a eficiência total cai para 24,6\\%, porque a entrada sobe para 156,5~MJ/m²:",
  "Mas a eficiência total, na fronteira ampliada que inclui a eletricidade do campo, cai para 24,6\\%, porque a entrada sobe para 156,5~MJ/m²:")
r("e $\\psi$ fica igual.", "e $\\psi$ fica praticamente igual.")
r("é de US\\$~57,4/GJ para o \\Ht{} (6,73~US\\$/kg ÷ 117,1~MJ/kg)", "é de US\\$~56,2/GJ para o \\Ht{} (6,58~US\\$/kg ÷ 117,1~MJ/kg)")
r("custa 3,6 vezes o do gás", "custa 3,5 vezes o do gás")
r("A eficiência exergética do forno usa a fração retida na peça medida por \\cite{ferrer2019} num forno a gás; num forno a \\Ht{} ela pode ser outra.",
  "A exergia retida na peça (10\\% da entrada) foi medida por \\cite{ferrer2019} num forno a gás e aqui é aplicada também ao forno a \\Ht, como produto igual nos três cenários; num forno a \\Ht{} ela pode ser outra, e a comparação da destruição no forno entre os cenários depende dessa hipótese.")

# ── Análise crítica e conclusões
r("a tonelada teria de valer US\\$~611,", "a tonelada teria de valer US\\$~590,")
r("custa cerca de US\\$~0,9 milhão, poupa cerca de US\\$~3,6 milhões por ano (VPL de +US\\$~37 milhões)",
  "custa cerca de US\\$~0,9 milhão (estimativa preliminar), poupa cerca de US\\$~3,6 milhões por ano (VPL de +US\\$~37 milhões)")
r("tem eficiência exergética de 25\\%, por causa da eletrólise e da turbina,", "tem eficiência exergética de 25\\% na fronteira ampliada, por causa da rede e do eletrolisador (50,7~MJ/m²) e da turbina (21,0~MJ/m²),")
r("Com todos os custos orçados, o VPL é de −US\\$~263,5 milhões e o \\Ht{} custa US\\$~6,73/kg;", "Com todos os custos orçados, o VPL é de −US\\$~254,7 milhões e o \\Ht{} custa US\\$~6,58/kg;")
r("e o gás teria de passar de R\\$~11,15/m³ para ele se pagar com 90\\% de probabilidade.", "e o gás teria de passar de R\\$~10,99/m³ para ele se pagar com 90\\% de probabilidade.")
r("cada uso do \\Ht{} custa de 662 a 719~US\\$/t de \\COt{} evitada.", "cada uso do \\Ht{} custa de 642 a 698~US\\$/t de \\COt{} evitada.")

t = t.replace("% O original (Grupo-03__Artigo.tex) não foi alterado.", "% O original (Grupo-03__Artigo.tex) não foi alterado. Revisão final: revisao_final_patch.py, _patch2.py e _patch3.py.", 1)
if crlf:
    t = t.replace("\n", "\r\n")
p.write_text(t, encoding="utf-8")
print("✓ Grupo-03__Artigo_rev.tex (parte 3)")
