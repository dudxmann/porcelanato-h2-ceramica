# -*- coding: utf-8 -*-
"""Revisão final, parte 4 (27/11/2026): tarifa industrial TG1 da SCGÁS em cascata no caso-base (TMP e TGG como
variantes), custo da turbina pelo SPECO, duas etapas (recuperação e H2) com o custo de cada, ressalvas da Lei 14.948,
vazão do escape frente à folha da Solar Turbines, e correções da conferência das referências
(Castiñeiras-Filho, Wang, Mezquita, Lei 15.042). Números: caso_rev.json, incerteza_rev.json, otimiza_rev.json.
Uso: python artigo_v2/revisao_final_patch4.py   (idempotente; depois python artigo_v2/monta_rev.py)"""
import sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
AQUI = pathlib.Path(__file__).resolve().parent
MARCA = "revisao_final_patch4"


def abre(nome):
    p = AQUI / nome
    t = p.read_text(encoding="utf-8")
    crlf = "\r\n" in t
    return p, t.replace("\r\n", "\n"), crlf


def grava(p, t, crlf):
    if crlf:
        t = t.replace("\n", "\r\n")
    p.write_text(t, encoding="utf-8")
    print("✓", p.name)


def aplica(t, pares):
    for velho, novo in pares:
        n = t.count(velho)
        if n != 1:
            sys.exit(f"✗ trecho encontrado {n} vezes: {velho[:70]}")
        t = t.replace(velho, novo)
    return t


p, t, crlf = abre("Grupo-03__Artigo_rev.tex")
if MARCA in t:
    print("· artigo já atualizado pela parte 4")
else:
    # 1. Linhas de tabela e trechos que contêm valores repetidos: trocados com o contexto, antes das trocas globais
    t = aplica(t, [
        # Tabela de otimização
        ("& 0 & 6,07 & +24,6 & --", "& 0 & 6,07 & +24,2 & --"),
        ("& 0,433 & 2,99 & −206,5 & 642", "& 0,433 & 2,99 & −196,8 & 614"),
        ("& 0,480 & 2,67 & −231,8 & 686", "& 0,480 & 2,67 & −220,8 & 650"),
        ("& 0,523 & 2,39 & −254,7 & 683", "& 0,523 & 2,39 & −242,4 & 647"),
        # Robustez
        ("Turbina a 35\\% \\cite{boyce2012} & 0,542 & 2,15 & −261,2 & 6,58", "Turbina a 35\\% \\cite{boyce2012} & 0,542 & 2,15 & −248,0 & 6,58"),
        ("Eletrólise de 2030 (54~kWh/kg) & 0,523 & 2,39 & −229,6 & 6,17", "Eletrólise de 2030 (54~kWh/kg) & 0,523 & 2,39 & −217,3 & 6,17"),
        ("Frações de calor 49/39/12\\% & 0,506 & 2,39 & −241,9", "Frações de calor 49/39/12\\% & 0,506 & 2,39 & −229,6"),
        ("Frações de calor 55/36/9\\% & 0,540 & 2,39 & −267,7", "Frações de calor 55/36/9\\% & 0,540 & 2,39 & −255,5"),
        ("Estoque só do excedente & 0,523 & 2,39 & −221,6", "Estoque só do excedente & 0,523 & 2,39 & −209,3"),
        ("& −253,1 / −256,3 &", "& −240,8 / −244,0 &"),
        # Cenários (com as duas tarifas novas)
        ("Gás natural pelo dobro & −133,1 & 1,1 & 6,58", "Gás natural pelo dobro & −108,5 & 2,6 & 6,58"),
        ("Gás natural pelo triplo & −11,5 & 7,5 & 6,58", "Gás natural pelo triplo & +25,3 & 9,1 & 6,58"),
        ("Sem acréscimo de importação & −215,2 & −10,9 & 6,06", "Sem acréscimo de importação & −202,9 & −8,0 & 6,06"),
        ("& −229,2 & −11,5 & 6,16", "& −216,9 & −8,5 & 6,16"),
        ("& −280,2 & −21,9 & 7,00", "& −267,9 & −12,6 & 7,00"),
        ("& −373,6 & -- & 8,53\\\\\n", "& −361,3 & -- & 8,53\\\\\n"
         "Tarifa de matéria-prima (TMP) & −254,7 & −14,6 & 6,58\\\\\n"
         "Gás da turbina na tarifa TGG & −227,8 & −7,5 & 6,58\\\\\n"),
        ("pelo triplo & +134,5 & 18,7 & 4,41", "pelo triplo & +171,3 & 21,4 & 4,41"),
        ("& −189,3 & −11,2 & 5,51", "& −177,1 & −7,8 & 5,51"),
        # Monte Carlo
        ("& −254,7 & −325,3 & −256,6 & −201,5", "& −242,4 & −312,6 & −243,9 & −188,6"),
        ("& 590 & 451 & 575 & 730", "& 562 & 422 & 547 & 701"),
        # Indicadores econômicos
        ("Fluxo de caixa anual (US\\$ milhões) & 0,8\\\\", "Fluxo de caixa anual (US\\$ milhões) & 1,9\\\\"),
        ("Custo de evitar \\COt{} (US\\$/t) & 590\\\\", "Custo de evitar \\COt{} (US\\$/t) & 562\\\\"),
        ("Custo a mais por m² de produto (R\\$) & 11,65", "Custo a mais por m² de produto (R\\$) & 11,09"),
        ("TIR depois de impostos (\\% ao ano) & −6,3", "TIR depois de impostos (\\% ao ano) & −5,3"),
        ("& −219,3\\\\", "& −211,2\\\\"),
        # Equações do fluxo e do VPL
        ("\\mathrm{FC} &= 11{,}4 + 4{,}9", "\\mathrm{FC} &= 12{,}5 + 4{,}9"),
        ("&= 0{,}76\\un{US\\$\\ milhão/ano}", "&= 1{,}91\\un{US\\$\\ milhão/ano}"),
        ("\\frac{0{,}76}{0{,}0937} = -254{,}7.", "\\frac{1{,}91}{0{,}0937} = -242{,}4."),
        ("$-\\mathrm{VPL} \\times \\mathrm{FRC} = 23{,}9$", "$-\\mathrm{VPL} \\times \\mathrm{FRC} = 22{,}7$"),
        ("= 40,4~mil~t/ano: 590~US\\$/t.", "= 40,4~mil~t/ano: 562~US\\$/t."),
    ])
    # 2. Valores do caso-base que se repetem (resumo, tabelas, texto e conclusões)
    t = t.replace("−254,7", "−242,4").replace("−US\\$~254,7", "−US\\$~242,4").replace("−14,6\\%", "−10,3\\%").replace("& −14,6 &", "& −10,3 &")
    t = t.replace("Tarifa de matéria-prima (TMP) & −242,4 & −10,3", "Tarifa de matéria-prima (TMP) & −254,7 & −14,6")
    t = t.replace("Taxa interna de retorno (\\% ao ano) & −14,6", "Taxa interna de retorno (\\% ao ano) & −10,3")
    t = t.replace("US\\$~590/t", "US\\$~562/t").replace("teria de valer US\\$~590,", "teria de valer US\\$~562,")
    t = t.replace("−US\\$~219,3 milhões", "−US\\$~211,2 milhões")

    t = aplica(t, [
        # Cabeçalho
        ("Revisão final: revisao_final_patch.py, _patch2.py e _patch3.py.",
         "Revisão final: revisao_final_patch.py, _patch2.py, _patch3.py e _patch4.py (revisao_final_patch4: tarifa TG1)."),
        # Introdução: Castiñeiras-Filho não diz que a eletricidade vem da rede; Wang et al. não confirmam o combustível
        ("de um eletrolisador de 2,5~MW suprido pela rede:", "de um eletrolisador de 2,5~MW, com eletricidade a R\\$~300/MWh:"),
        ("balanços de exergia de fornos a rolos a gás natural", "balanços de exergia de fornos a rolos industriais"),
        ("que usa eletricidade da rede a R\\$~300/MWh", "que usa eletricidade a R\\$~300/MWh"),
        # Tabela 1 e vazão do escape frente à folha da Solar Turbines
        ("catálogo do Taurus 60 \\cite{gtw2018}\\\\", "catálogo do Taurus 60 \\cite{gtw2018,solar2026}\\\\"),
        ("= 62{,}43$~kg/m² (Eq.~\\eqref{eq:mq}).",
         "= 62{,}43$~kg/m² (Eq.~\\eqref{eq:mq}), ou 78.036~kg/h, perto dos 78.385~kg/h a 510~°C da folha do Taurus 60 nas condições ISO \\cite{solar2026}."),
        # Recuperação de calor com a tarifa TG1
        ("cerca de US\\$~3,6 milhões por ano aos preços da Seção~\\ref{sec:fluxo}, já descontada",
         "cerca de US\\$~4,0 milhões por ano aos preços da Seção~\\ref{sec:fluxo} (o gás evitado sai da faixa de 50.001 a 100.000~m³/dia, a R\\$~3,4601/m³), já descontada"),
        ("o VPL a 8\\% ao ano em 25 anos é de +US\\$~37,4 milhões", "o VPL a 8\\% ao ano em 25 anos é de +US\\$~41,4 milhões"),
        # Benefício do gás com a tarifa industrial TG1 em cascata
        ("19,2 milhões de m³ de gás natural a R\\$~3,1667/m³ (tarifa da SCGÁS para matéria-prima, hipótese) \\cite{scgas2026}, US\\$~11,4 milhões,",
         "19,2 milhões de m³ de gás natural, US\\$~12,5 milhões, a R\\$~3,4865/m³ em média na tarifa industrial TG1 da SCGÁS, cobrada em cascata por faixa de consumo diário \\cite{scgas2026} (o ciclo 0 usa 88,2~mil~m³/dia e o proposto, 35,5~mil, e o gás evitado sai das faixas de 25.001 a 50.000~m³/dia, a R\\$~3,5563/m³, e de 50.001 a 100.000, a R\\$~3,4601/m³),"),
        # Fluxo acumulado
        ("o fluxo é de US\\$~1,8 milhão por ano;", "o fluxo é de US\\$~3,0 milhões por ano;"),
        ("termina em −US\\$~247,1 milhões (volta só 6\\% do investimento)", "termina em −US\\$~218,3 milhões (volta só 17\\% do investimento)"),
        # Cenários e sensibilidade
        ("O preço do gás natural forma 70\\% do benefício anual.", "O preço do gás natural forma 72\\% do benefício anual."),
        ("R\\$~9,80/m³, 3,1 vezes o de hoje; com o gás pelo dobro, o VPL é de −US\\$~133,1 milhões, e pelo triplo, ainda de −US\\$~11,5 milhões (Tabela~\\ref{tab:cenarios}).",
         "R\\$~9,80/m³, 2,8 vezes o preço médio evitado de hoje; com o gás pelo dobro, o VPL é de −US\\$~108,5 milhões, e pelo triplo, de +US\\$~25,3 milhões, com TIR de 9,1\\%, pouco acima da taxa (Tabela~\\ref{tab:cenarios}). A tarifa também conta: na de matéria-prima (TMP) \\cite{scgas2026b}, usada nas versões anteriores, o VPL seria de −US\\$~254,7 milhões; se o gás da turbina fosse enquadrado na tarifa de geração distribuída (TGG) \\cite{scgas2026c}, faturada pela faixa do consumo total (leitura e enquadramento são hipóteses), seria de −US\\$~227,8 milhões."),
        ("sem o acréscimo de importação, o VPL é de −US\\$~215,2 milhões", "sem o acréscimo de importação, o VPL é de −US\\$~202,9 milhões"),
        ("chega a +US\\$~134,5 milhões.", "chega a +US\\$~171,3 milhões."),
        ("mas o VPL ainda é de −US\\$~189,3 milhões.", "mas o VPL ainda é de −US\\$~177,1 milhões."),
        ("(−US\\$~239 a −380 milhões)", "(−US\\$~227 a −368 milhões)"),
        # Robustez
        ("mas o VPL piora US\\$~7 milhões,", "mas o VPL piora US\\$~6 milhões,"),
        # Monte Carlo
        ("entre −US\\$~325 milhões e −US\\$~202 milhões, e em 3\\% a TIR nem existe.",
         "entre −US\\$~313 milhões e −US\\$~189 milhões, e em 0,1\\% a TIR nem existe."),
        ("(52\\% das combinações abaixo dele)", "(51\\% das combinações abaixo dele)"),
        ("R\\$~9,63/m³, 3,0 vezes o de hoje; com 90\\%, R\\$~10,99/m³, 3,5 vezes.", "R\\$~9,63/m³, 2,8 vezes o de hoje; com 90\\%, R\\$~10,99/m³, 3,2 vezes."),
        ("pelo triplo, 45\\%.", "pelo triplo, 79\\%."),
        ("muda no máximo 0,47\\%", "muda no máximo 0,51\\%"),
        ("muda mais de 0,47\\%", "muda mais de 0,51\\%"),
        # Otimização
        ("O VPL piora US\\$~5,2 milhões nos primeiros 10\\% e chega a −US\\$~317,8 milhões com o dobro",
         "O VPL piora US\\$~5,3 milhões nos primeiros 10\\% e chega a −US\\$~305,5 milhões com o dobro"),
        ("o VPL é de +US\\$~24,6 milhões (zera com a eletricidade a R\\$~318/MWh)", "o VPL é de +US\\$~24,2 milhões (zera com a eletricidade a R\\$~323/MWh)"),
        ("642~US\\$/t no forno e de 683 a 698~US\\$/t no duto e na turbina", "614~US\\$/t no forno e cerca de 670~US\\$/t no duto e na turbina"),
        ("com 649~US\\$/t do sem \\Ht{} ao proposto", "com 619~US\\$/t do sem \\Ht{} ao proposto"),
        # Exergia: Mezquita dá a consigna dos gases que SAEM do secador
        ("(11,09~\\MJt{} a 125~°C, a temperatura de consigna dos gases de secagem medida num secador vertical de porcelanato \\cite{mezquita2012})",
         "(11,09~\\MJt{} a 125~°C, a consigna dos gases na saída de um secador vertical de porcelanato \\cite{mezquita2012}, tomada como o nível de temperatura do calor útil, hipótese conservadora)"),
        # Custo da exergia (TG1) e SPECO da turbina
        ("US\\$~15,9/GJ para o gás natural. Cada GJ de exergia levado ao forno como \\Ht{} custa 3,5 vezes o do gás",
         "US\\$~17,5/GJ para o gás natural. Cada GJ de exergia levado ao forno como \\Ht{} custa 3,2 vezes o do gás"),
        ("A aplicação completa do método SPECO \\cite{lazzaretto2006} aos componentes,",
         "A turbina é o bloco com dois produtos. Pelo método SPECO \\cite{lazzaretto2006}, com o mesmo custo por unidade de exergia para a eletricidade e para o escape, os US\\$~13,8 milhões por ano da turbina (capital 1,6, manutenção 0,3, gás natural 8,9, a R\\$~3,6537/m³ médios da TG1, e \\Ht{} 3,1) se repartem entre 15,00~MJ/m² de eletricidade e 13,11~MJ/m² de escape: US\\$~44,8/GJ, ou 0,671~US\\$/m² para a eletricidade e 0,587~US\\$/m² (47\\%) para o escape. A eletricidade da turbina custa assim 0,161~US\\$/kWh, cerca de R\\$~0,86/kWh, acima dos R\\$~0,60/kWh adotados para a rede: é o escape, que troca gás no atomizador, que paga a geração na planta. A aplicação do método a todos os componentes,"),
        # Análise crítica: Lei 14.948
        ("torna o hidrogênio renovável apenas por balanço anual e transfere à rede a variação da fotovoltaica.",
         "torna o hidrogênio renovável apenas por balanço anual e transfere à rede a variação da fotovoltaica. A Lei nº 14.948/2024 não pede coincidência horária, mas a certificação do hidrogênio de baixa emissão depende de regulamento, com análise de ciclo de vida e fronteiras do sistema próprias (arts. 15 a 25) \\cite{lei14948}: a compensação anual não garante, por si só, a certificação."),
        # SBCE (Lei 15.042, art. 30, II, e art. 34)
        ("No SBCE, que obriga a conciliar as emissões acima de 25~mil~t~\\COt{}e/ano \\cite{lei15042},",
         "No SBCE, o operador que emite mais de 25~mil~t~\\COt{}e/ano tem de conciliar todas as suas emissões (art. 30, II, e art. 34 da Lei nº 15.042/2024) \\cite{lei15042};"),
        # Economia: duas etapas, com o custo de cada
        ("Os custos que ficaram fora (Seção~\\ref{sec:fluxo}) só piorariam o resultado.",
         "Os custos que ficaram fora (Seção~\\ref{sec:fluxo}) só piorariam o resultado. Separado em duas etapas, o resultado fica mais claro: a recuperação de calor, sozinha, tem VPL de +US\\$~41,4 milhões e evita 12,9~mil~t/ano; passar dela ao ciclo proposto custa mais US\\$~283,8 milhões de VPL para evitar outras 27,5~mil~t/ano, cerca de 970~US\\$/t. O custo médio de 562~US\\$/t mistura uma etapa que dá lucro com outra muito cara."),
        # Conclusões
        ("poupa cerca de US\\$~3,6 milhões por ano (VPL de +US\\$~37 milhões)", "poupa cerca de US\\$~4,0 milhões por ano (VPL de +US\\$~41 milhões)"),
        ("por isso deveria ser a primeira medida.",
         "por isso deveria ser a primeira medida, e o \\Ht{} a segunda, quando o gás ou o carbono encarecerem: da recuperação ao ciclo proposto, cada tonelada evitada custa cerca de 970~US\\$."),
        ("custa de 642 a 698~US\\$/t de \\COt{} evitada", "custa de 614 a 670~US\\$/t de \\COt{} evitada"),
    ])
    # Sobras do estado anterior que não podem ficar
    for velho in ["254,7 milhões, o", "−US\\$~254,7 milhões e o", "590~US", "3,1667/m³ (tarifa", "0,47\\%", "suprido pela rede"]:
        if velho in t:
            sys.exit(f"✗ sobrou: {velho}")
    grava(p, t, crlf)

# Referências: TG1 (principal), TMP e TGG em itens separados; folha da Solar Turbines
p, r, crlf = abre("referencias_rev.tex")
if "bibitem{solar2026}" in r:
    print("· referencias_rev.tex já atualizado")
else:
    velho_scgas = next(l for l in r.split("\n") if l.startswith("\\bibitem{scgas2026}"))
    cond = "(condições gerais: poder calorífico de referência de 9.400 kcal/m³, 1,033 kgf/cm² e 20 °C; também no \\textit{Diário Oficial do Estado de Santa Catarina}, 1 jul. 2026)"
    novo_scgas = "\n\n".join([
        "\\bibitem{scgas2026} SCGÁS, ``Entenda a tarifa TG1'' (segmento industrial, cobrança em cascata por faixa de consumo diário), vigente desde 1 jul. 2026 " + cond + ". Disponível em: \\url{https://www.scgas.com.br/scgas/site/tarifas-e-simuladores/entenda-a-tarifa-tg1}. Acesso em: 26 nov. 2026.",
        "\\bibitem{scgas2026b} SCGÁS, ``Tabela de tarifas para o segmento de matéria-prima'', vigente desde 1 jul. 2026. Disponível em: \\url{https://www.scgas.com.br/scgas/site/tarifas-e-simuladores/materia-prima}. Acesso em: 24 nov. 2026.",
        "\\bibitem{scgas2026c} SCGÁS, ``Geração e cogeração de energia'' (tarifa TGG, faturamento por faixa), vigente desde 1 jul. 2026. Disponível em: \\url{https://www.scgas.com.br/scgas/site/para-a-industria/geracao-e-cogeracao-de-energia}. Acesso em: 26 nov. 2026.",
    ])
    r = r.replace(velho_scgas, novo_scgas)
    solar = ("\\bibitem{solar2026} Solar Turbines, ``Taurus 60'', página do conjunto gerador (dados nas condições ISO: 5.670~kWe, "
             "11.430~kJ/kWh, escape de 78.385~kg/h a 510~°C). Disponível em: "
             "\\url{https://www.solarturbines.com/en_US/products/power-generation-packages/taurus-60.html}. Acesso em: 26 nov. 2026.")
    gtw = next(l for l in r.split("\n") if l.startswith("\\bibitem{gtw2018}"))
    r = r.replace(gtw, gtw + "\n\n" + solar)
    grava(p, r, crlf)
