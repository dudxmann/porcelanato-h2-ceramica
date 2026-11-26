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
const COMPLETO = { pilha: 0.175, vidaPilha: 50000, encEPE: 120 };   // fração da pilha, h, R$/kW·ano

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
  const encAno = Math.max(0, o.encEPE - tusdgKw) * k.P_FV / S.PC.BRL;
  return { nPilhas: n, vpPilhas, pilhasAno, encAno, tusdgKw, total: pilhasAno + encAno };
}

// econ() do site mais os custos da revisão; devolve os mesmos campos, recalculados
function econRev(r, o = COMPLETO) {
  const x = S.econ(r);
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

module.exports = { ...S, P, REV, ETA_BASE, COMPLETO, calc, extras, econRev, caso };
