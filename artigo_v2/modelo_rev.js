// Motor da versão revisada do artigo (Grupo-03__Artigo_rev.tex). Reaproveita o motor comum (modelo.js, que carrega
// site/model.js e site/custos.js) e aplica, sem mexer no site nem na planilha, as três correções da revisão:
//
//  1. Base única de volume na Eq. (9): o PCI volumétrico do H₂ passa a 20 °C e 1 atm, a mesma base do gás natural
//     (10,78 MJ/Nm³ × 273,15/293,15 = 10,04 MJ/m³). Com 30% em volume nas mesmas condições, x_E = 0,107.
//  2. Rendimento da turbina alinhado à máquina orçada: 31,5% (Taurus 60, Gas Turbine World 2018). Para rodar com o
//     rendimento antigo: ETA_BASE=0.35 node artigo_v2/caso_rev.js
//  3. Custos que estavam "à parte" entram no caso-base e no Monte Carlo:
//     - troca das pilhas do eletrolisador: a pilha vale 15% a 20% do custo instalado (IEA, 2025, p. 27; adotado 17,5%)
//       e dura 50.000 h (IEA, 2025); cada troca é trazida a valor presente no ano em que as horas acumuladas passam
//       de 50.000 h e anualizada pelo FRC;
//     - encargos da FV: a EPE lista R$ 120/kW·ano de taxas, encargos e impostos (EPE, 2025); a tarifa da usina já
//       contada no uso da rede é descontada, para não somar duas vezes.
//     Continuam fora (declarado no texto): estoques de O₂, subestação e linha, financiamento, água e pessoal.
const S = require("./modelo.js");
const P = 30000;
const ETA_BASE = +(process.env.ETA_BASE || 0.315);
const REV = { PCI_H2V: 10.78 * 273.15 / 293.15, ETA: ETA_BASE };
const COMPLETO = { pilha: 0.175, vidaPilha: 50000, encEPE: 120, tarifa: "TG1" };   // fração da pilha, h, R$/kW·ano, tarifa do gás

// Tarifas brutas da SCGÁS (R$/m³ a 20 °C, com ICMS e PIS/COFINS), vigentes desde 1/7/2026, por consumo diário:
//  TG1, industrial (a mais comum do setor industrial), faturada em cascata: cada faixa só sobre o volume dentro dela;
//  TGG, geração distribuída, "por faixa": todo o volume ao preço da faixa em que cai (leitura adotada, hipótese);
//  TMP, matéria-prima, em cascata (a tarifa das versões anteriores).
const FAIXAS = {
  TG1: [[5, 6.9967], [10, 5.4469], [70, 5.3166], [1000, 3.8899], [5000, 3.7817], [10000, 3.7474], [25000, 3.6337],
        [50000, 3.5563], [100000, 3.4601], [150000, 3.2325], [200000, 3.2044], [Infinity, 3.1814]],
  TGG: [[10000, 3.2911], [90000, 3.0883], [200000, 3.0219], [Infinity, 3.0219]],
  TMP: [[10000, 3.2911], [90000, 3.1667], [200000, 3.0840], [Infinity, 3.0840]],
};
const P_GN_SITE = 3.1667;   // preço plano do site e da planilha (TMP, faixa de 10.001 a 90.000 m³/dia)
function custoDia(tab, q) {            // R$/dia para q m³/dia
  const f = FAIXAS[tab];
  if (tab === "TGG") return q * f.find(([lim]) => q <= lim)[1];
  let c = 0, ant = 0;
  for (const [lim, preco] of f) { const v = Math.min(q, lim) - ant; if (v <= 0) break; c += v * preco; ant = lim; }
  return c;
}
// preço médio do gás evitado (R$/m³): custo do ciclo 0 menos o do proposto, dividido pelo volume evitado
function precoEvitado(tarifa, gn0, gn1) {
  const q0 = gn0 * P, q1 = gn1 * P;
  const [t0, t1] = tarifa === "TG1+TGG" ? ["TG1", "TGG"] : [tarifa, tarifa];
  return (custoDia(t0, q0) - custoDia(t1, q1)) / (q0 - q1);
}

const calc = (extra = {}) => S.M.calcular(P, { ...REV, ...extra });

// custos que entram na versão revisada (US$/ano equivalentes), sobre um resultado de custos() e de econ()
function extras(r, x, o = COMPLETO) {
  const k = r.k, c = S.PC;
  const hAno = c.H_OP * c.DISP * 365;                        // horas de operação por ano
  let vpPilhas = 0, n = 0;
  for (let t = 1; t < S.PE.VIDA; t++) {                     // troca no ano em que o acumulado passa de um múltiplo da vida
    if (Math.floor(hAno * t / o.vidaPilha) > Math.floor(hAno * (t - 1) / o.vidaPilha)) { n++; vpPilhas += o.pilha * r.por.elz.usd / Math.pow(1 + S.PE.TAXA, t); }
  }
  const pilhasAno = vpPilhas * x.frc;
  const tusdgKw = x.rdUs / k.P_FV;                           // R$/kW·ano de tarifa da usina já contada
  // R$ da EPE ao câmbio da EPE (6,10, como o preço e a O&M da FV); a tarifa da usina, da ANEEL de 2026, ao câmbio de hoje
  const encAno = Math.max(0, o.encEPE / S.PC.FX_EPE - tusdgKw / S.PC.BRL) * k.P_FV;
  return { nPilhas: n, vpPilhas, pilhasAno, encAno, tusdgKw, total: pilhasAno + encAno };
}

// econ() do site mais os custos da revisão; devolve os mesmos campos, recalculados
function econRev(r, o = COMPLETO) {
  const x = S.econ(r);
  // gás evitado pela tarifa escolhida, em cascata; um cenário que multiplica S.PE.P_GN multiplica também este preço
  x.pGn = precoEvitado(o.tarifa || "TG1", S.PE.GN0, S.PE.GN1) * S.PE.P_GN / P_GN_SITE;
  x.ecGn = x.gn * x.pGn / S.PC.BRL; x.ec = x.ecGn + x.ecEl;
  const e = extras(r, x, o);
  const y = { ...x, ext: e };
  y.om = x.om + e.total; y.fluxo = x.ec - y.om;
  y.cap = x.inv * x.frc; y.vpl = -x.inv + y.fluxo / x.frc; y.vau = y.fluxo - y.cap;
  y.payb = y.fluxo > 0 ? x.inv / y.fluxo : null; y.tir = S.tirUniforme(x.inv, y.fluxo, S.PE.VIDA);
  y.il = (y.fluxo / x.frc) / x.inv;
  y.abat = -y.vau / x.co2; y.m2 = -y.vau / x.prod;
  y.omSis = x.omSis + e.total; y.lcoh = (r.sis * x.frc + y.omSis) / x.h2;
  y.gnEq = (y.cap + y.om - x.ecEl) * S.PC.BRL / x.gn;
  y.imp = (y.fluxo - x.dep) * S.PE.IRCS; y.fli = y.fluxo - y.imp;
  y.vpli = -x.inv + y.fli / x.frc; y.tiri = S.tirUniforme(x.inv, y.fli, S.PE.VIDA);
  return y;
}

// um caso completo: modelo técnico (com as correções) → custos → economia
function caso(extra = {}, { celz, fv, ajusta, o } = {}) {
  const v = calc(extra);
  S.prepara(v);
  if (ajusta) ajusta(S.PC, S.PE);
  const r = S.custos(P, celz === undefined ? S.PC0.C_ELZ : celz, fv || "epe1");
  const semTrc = S.semTrocador(r, v);
  const x = econRev(r, o);
  return { v, r, x, semTrc };
}

module.exports = { ...S, P, REV, ETA_BASE, COMPLETO, FAIXAS, P_GN_SITE, custoDia, precoEvitado, calc, extras, econRev, caso };
