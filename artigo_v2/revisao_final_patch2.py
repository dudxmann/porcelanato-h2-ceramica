# -*- coding: utf-8 -*-
"""Revisão final, parte 2 (26/11/2026, noite): o limite é de 20 páginas, então volta o que saiu por falta de espaço:
Tabela da demanda térmica do ciclo 0, figura do dinheiro acumulado (fig_fluxo_rev, em figs/gera_figs_rev.py),
ressalva da água evaporada e análise crítica mais completa.
Uso: python artigo_v2/revisao_final_patch2.py   (idempotente; depois python artigo_v2/monta_rev.py)"""
import sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
AQUI = pathlib.Path(__file__).resolve().parent
p = AQUI / "Grupo-03__Artigo_rev.tex"
t = p.read_text(encoding="utf-8")
crlf = "\r\n" in t
t = t.replace("\r\n", "\n")

TAB_TERMICO = r"""
\begin{table}[!t]
\centering
\caption{Demanda térmica do ciclo 0 por operação}\label{tab:termico0}
\footnotesize
\begin{tabular}{L{2.6cm}rrr}
\toprule
\textbf{Operação} & \textbf{$\varphi_i$ (\%)} & \textbf{$Q_i$ (\MJt/m²)} & \textbf{GN (m³/m²)}\\ \midrule
Queima & 52,0 & 54,91 & 1,529\\
Atomização & 37,5 & 39,60 & 1,103\\
Secagem & 10,5 & 11,09 & 0,309\\
\textbf{Total} & 100,0 & \textbf{105,59} & \textbf{2,941}\\
\bottomrule
\end{tabular}
\end{table}
"""

FIG_FLUXO = r"""
\begin{figure}[!t]
\centering
\includegraphics[width=\columnwidth]{figs/fig_fluxo_rev.pdf}
\caption{Dinheiro acumulado do projeto em 25 anos, sem desconto e a 8\% ao ano (VPL), com as trocas das pilhas nos anos em que ocorrem.}\label{fig:fluxo}
\end{figure}
"""

pares = [
    # Tabela da demanda térmica
    ("A energia de cada operação $i$ é $Q_i=\\varphi_i Q_{t,0}$: 54,91~\\MJt/m² na queima, 39,60 na atomização e 11,09 na secagem, ou 1,529, 1,103 e 0,309~m³/m² de gás (2,941 no total).",
     "A energia de cada operação $i$ é $Q_i=\\varphi_i Q_{t,0}$, e o gás correspondente é $V_i = Q_i/\\mathrm{PCI}_{\\text{GN}}$ (Tabela~\\ref{tab:termico0}): 54,91~\\MJt/m² na queima, 39,60 na atomização e 11,09 na secagem, ou 2,941~m³/m² de gás no total."),
    ("ou 182~t por dia. O \\COt{} da decomposição dos carbonatos da massa (emissão de processo) não foi contado em nenhum caso: não muda a redução em toneladas e só diminui um pouco a porcentagem.\n",
     "ou 182~t por dia. O \\COt{} da decomposição dos carbonatos da massa (emissão de processo) não foi contado em nenhum caso: não muda a redução em toneladas e só diminui um pouco a porcentagem.\n" + TAB_TERMICO),
    # Ressalva da água
    ("a moagem fica acima, o que é coerente com o moinho contínuo de Tijucas \\cite{rigobelo2026}.",
     "a moagem fica acima, o que é coerente com o moinho contínuo de Tijucas \\cite{rigobelo2026}. A água evaporada só confere a ordem de grandeza, porque a umidade das matérias-primas não passa pela captação."),
    # Figura do dinheiro acumulado
    ("O projeto não se paga (Tabela~\\ref{tab:econ}): o benefício anual mal cobre os custos anuais, e o investimento não volta.",
     "O projeto não se paga (Tabela~\\ref{tab:econ}): o benefício anual mal cobre os custos anuais, e o investimento não volta (Fig.~\\ref{fig:fluxo}). Fora dos anos de troca das pilhas, o fluxo é de US\\$~1,0 milhão por ano; com as três trocas, de US\\$~9,8 milhões cada, o acumulado sem desconto termina em −US\\$~267,9 milhões, abaixo do próprio investimento, e a 8\\% ao ano, no VPL."),
    ("\\subsection{Cenários e sensibilidade}\n", FIG_FLUXO.lstrip("\n") + "\n\\subsection{Cenários e sensibilidade}\n"),
    # Análise crítica mais completa
    ("A eficiência exergética do forno usa a fração retida na peça medida por \\cite{ferrer2019} num forno a gás; num forno a \\Ht{} ela pode ser outra.",
     "A eficiência exergética do forno usa a fração retida na peça medida por \\cite{ferrer2019} num forno a gás; num forno a \\Ht{} ela pode ser outra. Os resultados valem para a indústria de referência do ciclo 0, sem reaproveitamento, cujo consumo foi tomado igual ao de Tijucas (Seção~2.2). A verificação de temperatura no atomizador (Eq.~\\eqref{eq:matmax}) mostrou que somar energia não basta: a divisão do calor recuperado entre as operações é limitada pela massa de gás admissível a 550~°C. A lama de retífica (0,78~kg/m², hipótese) entra só no balanço de massa e não altera a energia."),
    ("\\textit{Economia.} O preço do eletrolisador parte do custo chinês e é otimista; a tarifa da usina foi tomada igual à das eólicas; o acerto na CCEE usa preços médios de cada mês e hora, sem os dias nublados de preço alto. Os custos que ficaram fora (Seção~\\ref{sec:fluxo}) só piorariam o resultado.",
     "\\textit{Economia.} O preço do eletrolisador parte do custo chinês: a engenharia e a obra seguem a proporção chinesa, e os 1.284~US\\$/kW em Tijucas ficam abaixo da faixa da IEA para fora da China \\cite{iea2025a}; o resultado é otimista nesse item. A tarifa da usina foi tomada igual à das eólicas; uma usina desse porte pode se ligar em tensão mais alta e pagar outra tarifa. O estoque de \\Ht{} guarda um dia de consumo (15,7~t, US\\$~33,0 milhões), embora só o excedente médio de 2,1~t/dia passe por ele; sem a reserva para paradas longas, o VPL melhora US\\$~33 milhões (Tabela~\\ref{tab:robustez}). O acerto na CCEE usa o preço médio de cada mês e hora de 2024 e 2025, sem os dias nublados de preço alto, e pode estar subestimado. Os custos que ficaram fora (Seção~\\ref{sec:fluxo}) só piorariam o resultado."),
]
for velho, novo in pares:
    if novo in t:   # já aplicado
        continue
    if velho in t:
        if t.count(velho) != 1:
            sys.exit(f"✗ trecho repetido: {velho[:60]}")
        t = t.replace(velho, novo)
    else:   # já aplicado, ou reescrito por uma parte posterior
        continue
# Seção 2.2 como \ref
t = t.replace("\\subsection{Base de dados}\n", "\\subsection{Base de dados}\\label{sec:dados}\n").replace("(Seção~2.2)", "(Seção~\\ref{sec:dados})")
if crlf:
    t = t.replace("\n", "\r\n")
p.write_text(t, encoding="utf-8")
print("✓ Grupo-03__Artigo_rev.tex")
