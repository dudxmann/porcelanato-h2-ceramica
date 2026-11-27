// VERSÃO REVISADA (modelo_rev.js: Eq. (9) numa base só, turbina a 31,5%, troca das pilhas e encargos da FV no caso-base).
// Incerteza conjunta do ciclo proposto (Monte Carlo): sorteia ao mesmo tempo as hipóteses técnicas e de custo, cada uma
// na faixa que já tem fonte no artigo (Tabela 1, Tabela 7 e Fig. 6), e roda para cada sorteio o modelo técnico do site
// (site/model.js) e o econômico (site/custos.js, que bate com a planilha de precificação), como o robustez.js.
//
// O preço do gás natural não é sorteado: não há fonte para a distribuição do preço futuro. Como o VPL é linear no preço
// do gás, cada sorteio dá o preço do gás que zera o VPL; a distribuição desse preço diz a probabilidade de o projeto se
// pagar para qualquer preço do gás (curva da Fig. 7b). A taxa (8% ao ano), a vida (25 anos), o preço da eletricidade
// (R$ 600/MWh) e o câmbio ficam fixos, como no caso-base.
//
// Uso (na pasta do projeto): node artigo_v2/incerteza_rev.js [N] [semente]
//   → imprime o resumo e grava artigo_v2/incerteza.json (resumo) e artigo_v2/incerteza_amostras.json (amostras, para as figuras)
const fs = require("fs"), path = require("path");
const R = require("./modelo_rev.js");
const { PC, PE, PC0, PE0, PRECOS_FV } = R;
const P = 30000;

// FV em US$/kW de 2026, como na sensibilidade da planilha (aba Análise econômica, seção J): Greener a R$ 2,40/Wp ao câmbio de hoje;
// EPE a R$ 3,00 e R$ 5,50/Wp ao câmbio da EPE (6,10 R$/US$), em US$ de 2024 levados a 2026 pelo CEPCI
const FV_GREENER = 2400 / PC0.BRL, FV_EPE1 = 3000 / PC0.FX_EPE * PC0.CE26 / PC0.CE24, FV_EPE4 = 5500 / PC0.FX_EPE * PC0.CE26 / PC0.CE24;
let fvSorteada = FV_EPE1;
PRECOS_FV.push({ id: "mc", c: () => fvSorteada, ce: () => PC.CE26, ano: 2026, fonte: "sorteio" });
const DIFM = 48.803, DIF24 = 20.5053, DIF25 = 77.1008;   // diferença compra − venda na CCEE (R$/MWh que passa pela rede), planilha, aba Ligação à rede

// variáveis sorteadas: [id, nome, distribuição, parâmetros, valor do caso-base, unidade, fonte]
const VARS = [
  { id: "eta", nome: "Rendimento elétrico da turbina", dist: "uniforme", p: [0.315, 0.35], base: 0.315, un: "–",
    fonte: "31,5%: catálogo do Taurus 60 (Gas Turbine World, 2018), adotado; 35%: Boyce (2012)" },
  { id: "fr", nome: "Frações de calor (queima, atomização, secagem)", dist: "uniforme na região", p: [[0.49, 0.55], [0.36, 0.39], [0.09, 0.12]], base: [0.52, 0.375, 0.105], un: "–",
    fonte: "faixas consideradas realistas por Rigobelo (2026), com soma 100%" },
  { id: "kwh", nome: "Consumo do eletrolisador", dist: "uniforme", p: [54, 58], base: 58, un: "kWh/kg",
    fonte: "IEA (2025): eficiência chinesa de 2030 (62%) e de 2024 (58%), mais a compressão, arredondados" },
  { id: "celz", nome: "Eletrolisador instalado na China", dist: "triangular", p: [600, 900, 1200], base: 900, un: "US$/kW",
    fonte: "IEA (2025): faixa da China, 600 a 1.200; central 900" },
  { id: "cfv", nome: "Campo fotovoltaico instalado", dist: "triangular", p: [FV_GREENER, FV_EPE1, FV_EPE4], base: FV_EPE1, un: "US$/kW (2026)",
    fonte: "Greener (R$ 2,40/Wp), EPE (R$ 3,00/Wp, adotado) e EPE (R$ 5,50/Wp)" },
  { id: "imp", nome: "Acréscimo de importação", dist: "triangular", p: [0, 0.80, 0.87], base: 0.80, un: "–",
    fonte: "sem acréscimo; +80% do professor; 87% de Izidoro (2016)" },
  { id: "om", nome: "Manutenção dos demais itens", dist: "uniforme", p: [0.015, 0.03], base: 0.015, un: "ao ano",
    fonte: "1,5%: Lora e Nascimento (2004); 3,0%: IEA (2025)" },
  { id: "pld", nome: "Diferença de preço na CCEE", dist: "uniforme", p: [DIF24, DIF25], base: DIFM, un: "R$/MWh",
    fonte: "PLD horário do Sul de 2024 e de 2025 (CCEE)" },
  { id: "pilha", nome: "Custo da pilha (troca a cada 50.000 h)", dist: "uniforme", p: [0.15, 0.20], base: 0.175, un: "do eletrolisador",
    fonte: "IEA (2025): pilha 15% a 20% do custo instalado" },
  { id: "enc", nome: "Encargos da FV", dist: "uniforme", p: [48.11, 120], base: 120, un: "R$/(kW·ano)",
    fonte: "48: só a tarifa da usina (ANEEL, REH 3.602/2026); 120: taxas, encargos e impostos (EPE, 2025)" },
];

// gerador com semente (mulberry32), para o resultado se repetir
function gerador(s) {
  return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const tri = (u, a, m, b) => { const F = (m - a) / (b - a); return u < F ? a + Math.sqrt(u * (b - a) * (m - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - m)); };
const uni = (u, a, b) => a + u * (b - a);

function sorteia(r) {
  const x = {};
  for (const v of VARS) {
    if (v.id === "fr") {   // uniforme na região onde as três faixas valem e a soma dá 100% (rejeição)
      let q, a, s, n = 0;
      do { q = uni(r(), ...v.p[0]); a = uni(r(), ...v.p[1]); s = 1 - q - a; n++; } while ((s < v.p[2][0] || s > v.p[2][1]) && n < 1000);
      x.fr = [q, a, s];
    } else x[v.id] = v.dist === "uniforme" ? uni(r(), ...v.p) : tri(r(), ...v.p);
  }
  return x;
}

// um caso: modelo técnico → capacidades e consumos → custos → economia (mesma sequência do robustez.js)
function roda(x) {
  fvSorteada = x.cfv;
  const c = R.caso({ ETA: x.eta, KWH_KG: x.kwh, FR_FOR: x.fr[0], FR_AT: x.fr[1], FR_SEC: x.fr[2] }, { celz: x.celz, fv: "mc",
    ajusta: (pc, pe) => { Object.assign(pc, { F_IMP: x.imp, K_PLD: PC0.K_PLD * x.pld / DIFM }); pe.OM_RESTO = x.om; },
    o: { ...R.COMPLETO, pilha: x.pilha, encEPE: x.enc } });
  const { v, r, x: e, semTrc } = c;
  return { h2: v.H2_TOT, gn: v.GN_NM3, co2: v.CO2_P, red: v.RED_CO2, co2Ano: v.CO2_P * P * 365 / 1000, semTrc,
    mAt: v.M_ESC + v.M_AR_AT, mAtLim: v.Q_AT * 1000 / (1.07 * 525), pfv: v.P_FV / 1000, pelz: v.P_INST / 1000,
    inv: r.total / 1e6, vpl: e.vpl / 1e6, tir: e.tir, lcoh: e.lcoh, abat: e.abat, gasZera: e.gnEq, pGn: e.pGn, vplGas: e.ecGn / e.frc / 1e6 };
}

const BASE = { eta: 0.315, fr: [0.52, 0.375, 0.105], kwh: 58, celz: 900, cfv: FV_EPE1, imp: 0.80, om: 0.015, pld: DIFM, pilha: 0.175, enc: 120 };
const f = (x, d) => (x === null || x === undefined ? "—" : x.toFixed(d).replace(".", ","));
const b0 = roda(BASE);
const pior = 0;
console.log(`caso-base revisado: VPL ${f(b0.vpl, 2)} mi; H₂ ${f(b0.lcoh, 2)} US$/kg`);

// ── Monte Carlo ──
const N = +(process.argv[2] || 10000), SEMENTE = +(process.argv[3] || 20261126);
function mc(n, semente) {
  const r = gerador(semente), xs = [], ys = [];
  for (let i = 0; i < n; i++) { const x = sorteia(r); xs.push(x); ys.push(roda(x)); }
  return { xs, ys };
}
const { xs, ys } = mc(N, SEMENTE);

const qtl = (a, p) => { const s = [...a].sort((u, v) => u - v), i = p * (s.length - 1), lo = Math.floor(i); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (i - lo); };
const media = a => a.reduce((s, v) => s + v, 0) / a.length;
const dp = a => { const m = media(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
const resumo = a => ({ media: media(a), dp: dp(a), p05: qtl(a, 0.05), p50: qtl(a, 0.5), p95: qtl(a, 0.95), min: Math.min(...a), max: Math.max(...a) });
const fr = c => ys.filter(c).length / ys.length;
const ranks = a => { const idx = a.map((v, i) => [v, i]).sort((u, v) => u[0] - v[0]), r = new Array(a.length); idx.forEach(([, i], k) => (r[i] = k)); return r; };
const pearson = (a, b) => { const ma = media(a), mb = media(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < a.length; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); };
const spearman = (a, b) => pearson(ranks(a), ranks(b));

const SAIDAS = ["h2", "co2", "red", "co2Ano", "inv", "vpl", "tir", "lcoh", "abat", "gasZera", "pfv", "pelz"];
const est = Object.fromEntries(SAIDAS.map(k => [k, resumo(ys.map(y => (y[k] === null ? NaN : y[k])).filter(v => !Number.isNaN(v)))]));
const entrada = v => xs.map(x => (v.id === "fr" ? x.fr[0] : x[v.id]));   // frações: representadas pela da queima
const corr = Object.fromEntries(VARS.map(v => [v.id, Object.fromEntries(["vpl", "lcoh", "gasZera", "co2Ano"].map(k => [k, spearman(entrada(v), ys.map(y => y[k]))]))]));
const prob = {
  vpl_pos: fr(y => y.vpl > 0),
  co2_25mil: fr(y => y.co2Ano > 25000),
  atomizador_excede: fr(y => y.mAt > y.mAtLim),
  sem_trocador: fr(y => y.semTrc),
  vpl_pos_gas2: fr(y => y.gasZera <= 2 * y.pGn), vpl_pos_gas3: fr(y => y.gasZera <= 3 * y.pGn),
  tir_nula: fr(y => y.tir === null),
  vpl_abaixo_base: fr(y => y.vpl < b0.vpl), lcoh_acima_base: fr(y => y.lcoh > b0.lcoh),
};
const gasP = { p10: qtl(ys.map(y => y.gasZera), 0.10), p50: qtl(ys.map(y => y.gasZera), 0.50), p90: qtl(ys.map(y => y.gasZera), 0.90) };

// convergência: outra semente com o mesmo N
const outra = mc(N, SEMENTE + 1).ys;
const conv = { vpl_p50: qtl(outra.map(y => y.vpl), 0.5), lcoh_p50: qtl(outra.map(y => y.lcoh), 0.5), gas_p90: qtl(outra.map(y => y.gasZera), 0.9),
  co2_25mil: outra.filter(y => y.co2Ano > 25000).length / N, max_rel: 0, onde: "" };
for (const k of SAIDAS) for (const [q, pq] of [["p05", 0.05], ["p50", 0.5], ["p95", 0.95]]) {   // maior mudança de um percentil entre as sementes
  const d = Math.abs(qtl(outra.map(y => y[k]).filter(v => v !== null), pq) / est[k][q] - 1);
  if (d > conv.max_rel) { conv.max_rel = d; conv.onde = `${k} ${q}`; }
  if (k !== "tir" && d > (conv.max_rel_sem_tir || 0)) conv.max_rel_sem_tir = d;   // a TIR, quase nula e só onde existe, varia mais em termos relativos
}
// o CO₂ do ciclo proposto só depende do rendimento da turbina (∝ 1/η): rendimento abaixo do qual passa de 25 mil t/ano (SBCE)
const etaSbce = BASE.eta * b0.co2Ano / 25000;   // abaixo deste rendimento passa de 25 mil t/ano

const out = { N, semente: SEMENTE, eta_sbce: etaSbce, p_gn: b0.pGn, base: b0, conferencia_vpl_max: pior,
  variaveis: VARS.map(({ id, nome, dist, p, base, un, fonte }) => ({ id, nome, dist, p, base, un, fonte })),
  estatisticas: est, probabilidades: prob, gas_que_zera: gasP, spearman: corr, convergencia: conv };
fs.writeFileSync(path.join(__dirname, "incerteza_rev.json"), JSON.stringify(out, null, 1));
const r3 = (a, d) => a.map(v => +v.toFixed(d));
fs.writeFileSync(path.join(__dirname, "incerteza_amostras_rev.json"), JSON.stringify({
  vpl: r3(ys.map(y => y.vpl), 2), lcoh: r3(ys.map(y => y.lcoh), 3), gasZera: r3(ys.map(y => y.gasZera), 3), co2Ano: r3(ys.map(y => y.co2Ano), 0) }));

// ── resumo ──
console.log(`\nMonte Carlo: ${N} sorteios (semente ${SEMENTE}), ${VARS.length} grupos de hipóteses sorteados juntos`);
const L = [["H₂ (kg/m²)", "h2", 3, 1], ["CO₂ fóssil (kg/m²)", "co2", 2, 1], ["redução de CO₂ (%)", "red", 1, 100], ["CO₂ (mil t/ano)", "co2Ano", 1, 1e-3],
  ["investimento (US$ mi)", "inv", 1, 1], ["VPL (US$ mi)", "vpl", 1, 1], ["TIR (% ao ano)", "tir", 1, 100], ["H₂ (US$/kg)", "lcoh", 2, 1],
  ["CO₂ evitado (US$/t)", "abat", 0, 1], ["gás que zera o VPL (R$/m³)", "gasZera", 2, 1], ["campo FV (MWp)", "pfv", 1, 1], ["eletrolisador (MW)", "pelz", 1, 1]];
console.log("saída | caso-base | P5 | P50 | P95 | média ± dp");
for (const [n, k, d, m] of L) { const s = est[k]; console.log(`${n} | ${f(b0[k] * m, d)} | ${f(s.p05 * m, d)} | ${f(s.p50 * m, d)} | ${f(s.p95 * m, d)} | ${f(s.media * m, d)} ± ${f(s.dp * m, d)}`); }
console.log(`\nP(VPL > 0) com o gás de hoje (R$ ${f(b0.pGn, 4)}/m³ evitado, TG1): ${f(prob.vpl_pos * 100, 1)}%`);
console.log(`P(VPL > 0) com o gás pelo dobro: ${f(prob.vpl_pos_gas2 * 100, 1)}%; pelo triplo: ${f(prob.vpl_pos_gas3 * 100, 1)}%`);
console.log(`VPL abaixo do caso-base em ${f(prob.vpl_abaixo_base * 100, 1)}% dos sorteios; H₂ acima do caso-base em ${f(prob.lcoh_acima_base * 100, 1)}%`);
console.log(`gás que zera o VPL: P10 R$ ${f(gasP.p10, 2)}, P50 R$ ${f(gasP.p50, 2)}, P90 R$ ${f(gasP.p90, 2)}/m³ (caso-base R$ ${f(b0.gasZera, 2)})`);
console.log(`P(CO₂ > 25 mil t/ano, concilia no SBCE): ${f(prob.co2_25mil * 100, 1)}%; trocador dispensado em ${f(prob.sem_trocador * 100, 1)}%; atomizador acima do limite em ${f(prob.atomizador_excede * 100, 1)}%; TIR inexistente em ${f(prob.tir_nula * 100, 1)}%`);
console.log("\ncorrelação de postos (Spearman) com: VPL | H₂ US$/kg | gás que zera | CO₂ t/ano");
for (const v of VARS) { const c = corr[v.id]; console.log(`${v.nome} | ${f(c.vpl, 2)} | ${f(c.lcoh, 2)} | ${f(c.gasZera, 2)} | ${f(c.co2Ano, 2)}`); }
console.log(`o CO₂ passa de 25 mil t/ano com rendimento da turbina abaixo de ${f(etaSbce * 100, 2)}%`);
// linhas da tabela do artigo; na coluna Base, os valores econômicos são os da planilha (Tabela 5 do artigo) e os físicos, os do modelo
const BP = {};
const TEXL = [["\\Ht{} (kg/m²)", "h2", 3, 1], ["\\COt{} fóssil (kg/m²)", "co2", 2, 1], ["\\COt{} (mil~t/ano)", "co2Ano", 1, 1e-3],
  ["Investimento (US\\$ milhões)", "inv", 1, 1], ["VPL (US\\$ milhões)", "vpl", 1, 1], ["TIR (\\% ao ano)", "tir", 1, 100],
  ["Custo do \\Ht{} (US\\$/kg)", "lcoh", 2, 1], ["Custo de evitar \\COt{} (US\\$/t)", "abat", 0, 1], ["Gás que zera o VPL (R\\$/m³)", "gasZera", 2, 1]];
const tx = (v, d) => f(v, d).replace("-", "−");
console.log("\nlinhas LaTeX (Indicador & Base & P5 & P50 & P95):");
for (const [n, k, d, m] of TEXL) console.log(`${n} & ${tx((k in BP ? BP[k] : b0[k]) * m, d)} & ${tx(est[k].p05 * m, d)} & ${tx(est[k].p50 * m, d)} & ${tx(est[k].p95 * m, d)}\\\\`);
console.log(`maior mudança de um percentil (P5, P50 ou P95) com a outra semente: ${f(conv.max_rel * 100, 2)}% (${conv.onde}); sem a TIR: ${f(conv.max_rel_sem_tir * 100, 2)}%`);
console.log(`\nconvergência (semente ${SEMENTE + 1}): VPL P50 ${f(conv.vpl_p50, 1)} (era ${f(est.vpl.p50, 1)}); H₂ P50 ${f(conv.lcoh_p50, 2)} (era ${f(est.lcoh.p50, 2)}); gás P90 ${f(conv.gas_p90, 2)} (era ${f(gasP.p90, 2)}); P(CO₂ > 25 mil) ${f(conv.co2_25mil * 100, 1)}% (era ${f(prob.co2_25mil * 100, 1)}%)`);
