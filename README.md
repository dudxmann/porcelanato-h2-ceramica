# Porcelanato com H₂ e recuperação de calor: modelo do artigo

Código e dados do artigo *Descarbonização da fabricação de porcelanato com hidrogênio e recuperação de calor: balanços de energia e exergia, incerteza e avaliação econômica* (E. A. B. Vaz, M. R. da Costa e V. dos S. Florenzano, Engenharia de Energia, UNIFEI, disciplina EEN807 Projeto II, 2026).

## O que tem aqui

| Arquivo | O que faz |
|---|---|
| `site/model.js` | Modelo técnico: 179 grandezas (balanço de massa, ciclo 0, recuperação, turbina, atomizador, secador, forno a H₂ + O₂, eletrolisador e campo FV), cada uma com fórmula, unidade e fonte |
| `site/custos.js` | Modelo econômico (investimento item a item, uso da rede, VPL, TIR, custo do H₂); reproduz a planilha de precificação com diferença de US$ 0,05 milhão no VPL |
| `artigo_v2/modelo.js` | Carrega os dois modelos em Node |
| `artigo_v2/modelo_rev.js` | Caso-base do artigo: PCI do H₂ a 20 °C na Eq. (9), turbina a 31,5% (Taurus 60), troca das pilhas e encargos da FV |
| `artigo_v2/caso_rev.js` | Caso-base, robustez, cenários, sensibilidade, validação e análise exergética → `caso_rev.json` |
| `artigo_v2/incerteza_rev.js` | Monte Carlo (10.000 sorteios, gerador mulberry32, semente 20261126) → `incerteza_rev.json` e `incerteza_amostras_rev.json` |
| `artigo_v2/otimiza_rev.js` | Tamanho do eletrolisador e uso do H₂ → `otimiza_rev.json` |
| `artigo_v2/figs/gera_figs_rev.py` | Figuras do artigo (`*_rev.pdf` e `.png`) |
| `artigo_v2/monta_rev.py` | Roda tudo e compila o artigo (`Grupo-03__Artigo_rev.tex`) |
| `memorial/Grupo-03__Memorial.pdf` | Memorial de cálculo (83 páginas), com os mesmos números do artigo |
| `precificacao/` | PLD horário do Sul de 2024 e 2025 (CCEE) e perfil horário do campo FV (PVGIS) usados no acerto na CCEE |

## Como rodar

Requisitos: Node.js 18 ou mais novo; Python 3 com matplotlib e numpy; XeLaTeX (ou Tectonic) para compilar o artigo.

```bash
node artigo_v2/caso_rev.js                    # caso-base, cenários e exergia
node artigo_v2/incerteza_rev.js 10000 20261126  # Monte Carlo (N e semente)
node artigo_v2/otimiza_rev.js                 # otimização
python artigo_v2/figs/gera_figs_rev.py        # figuras
python artigo_v2/monta_rev.py                 # tudo e o PDF
```

Rodar com o rendimento de 35% para a turbina: `ETA_BASE=0.35 node artigo_v2/caso_rev.js`.

## Dados

Os dados de processo cedidos pela Portobello (unidade de Tijucas, SC) são de uso acadêmico e entram só como os valores agregados citados no artigo (consumo específico, faixas de repartição do calor, consumo do moinho). Os demais valores têm a fonte indicada no próprio `site/model.js` e na Tabela 1 do artigo.

## Licença

MIT. Ao usar, cite o artigo.
