// Otimização do ciclo proposto, com o modelo do site (artigo_v2/modelo.js), em duas partes:
//
// A. Tamanho do eletrolisador e horas de operação. Para cada tamanho, de 1 a 2 vezes o mínimo (o do caso-base, que opera
//    todas as horas fora da ponta), o eletrolisador opera em cada mês nas horas de PLD mais baixo até produzir o H₂ do dia
//    (despacho de menor custo, com a média de cada mês e hora do PLD do Sul de 2024 e 2025 e da geração do PVGIS, como a
//    planilha). O estoque segue com 1 dia de consumo (hipótese do caso-base), que cobre qualquer deslocamento dentro do dia.
//
// B. Onde usar o H₂. Forno (H₂ com O₂ ou gás natural com ar), queimador de duto (fração de H₂ de 0 a 1) e turbina (H₂ de 0%
//    a 30% em volume, o limite de [NETL]). Para cada combinação: H₂, CO₂ e VPL; daí a fronteira de menor custo para cada
//    nível de CO₂ e o custo de cada passo por t de CO₂ evitada. Hipóteses: com o forno a gás natural, não há conversão dos
//    queimadores (sai o item do forno); com o queimador de duto só a gás natural, usa-se o queimador do atomizador (sai o item).
//
// Uso (na pasta do projeto): node artigo_v2/otimiza_rev.js  → imprime o resumo e grava artigo_v2/otimiza_rev.json
const fs = require("fs"), path = require("path");
// VERSÃO REVISADA: mesmo método, com o motor modelo_rev.js (Eq. (9) numa base só, turbina a 31,5%, pilhas e encargos da FV)
const R = require("./modelo_rev.js");
const S = { ...R, M: { calcular: (p, ex) => R.calc(ex) }, econ: r => R.econRev(r) };
const RAIZ = path.join(__dirname, "..");
const PLD = JSON.parse(fs.readFileSync(path.join(RAIZ, "precificacao", "dados_ccee", "pld_sul_2024_2025.json"), "utf8"));
const SIM = JSON.parse(fs.readFileSync(path.join(RAIZ, "precificacao", "sim_horaria.json"), "utf8"));
const P = 30000, ANO = P * 365, DIAS = SIM.dias_m, PMH = SIM.pmh;
const PLD_MED = PLD["2024"].tab.map((l, m) => l.map((x, h) => (x + PLD["2025"].tab[m][h]) / 2));
// fração de cada hora em que o eletrolisador pode operar: parado na ponta (18h30 às 21h30) nos 5 dias úteis da semana
const W = Array.from({ length: 24 }, (_, h) => (h === 18 || h === 21 ? 1 - 0.5 * 5 / 7 : h === 19 || h === 20 ? 1 - 5 / 7 : 1));
const f = (x, d) => (x === null || x === undefined ? "—" : x.toFixed(d).replace(".", ","));

// ── A. tamanho do eletrolisador ──
// despacho de menor custo: em cada mês, as horas de PLD mais baixo primeiro, até a energia do dia
function despacho(E, Pkw, disp, pld) {
  let cons = 0;
  const perfil = [];
  for (let m = 0; m < 12; m++) {
    const ordem = [...Array(24).keys()].sort((a, b) => pld[m][a] - pld[m][b]);
    const c = Array(24).fill(0);
    let falta = E;
    for (const h of ordem) { const u = Math.min(Pkw * disp * W[h], falta); c[h] = u; falta -= u; if (falta <= 1e-6) break; }
    if (falta > 1) return null;
    for (let h = 0; h < 24; h++) cons += DIAS[m] * c[h] * pld[m][h] / 1000;   // R$/ano
    perfil.push(c);
  }
  return { cons, perfil };
}
function tamanho(fator, { pld = PLD_MED, celz = S.PC0.C_ELZ } = {}) {
  const v = S.M.calcular(P);
  S.prepara(v);
  let r = S.custos(P, celz);
  const E = r.k.E_DIA, Pmin = r.k.P_INST, Pkw = Pmin * fator;
  const d = despacho(E, Pkw, S.PC.DISP, pld);
  let ger = 0;
  for (let m = 0; m < 12; m++) for (let h = 0; h < 24; h++) ger += DIAS[m] * r.k.P_FV / (1 + S.PC.PERDAS) * PMH[m][h] * pld[m][h] / 1000;
  const eAno = E * 365 / 1000;
  S.prepara(v);
  Object.assign(S.PC, { H_OP: E / (Pkw * S.PC.DISP), K_PLD: (d.cons - ger) / eAno });   // P_INST = Pkw; acerto na CCEE do despacho
  r = S.custos(P, celz);
  S.semTrocador(r, v);
  const x = S.econ(r);
  return { fator, P_MW: Pkw / 1000, kpld: S.PC.K_PLD, rede: x.rede / 1e6, ccee: x.rdPld / S.PC.BRL / 1e6, inv: r.total / 1e6,
    elz: r.por.elz.usd / 1e6, comp: r.por.comp.usd / 1e6, vpl: x.vpl / 1e6, lcoh: x.lcoh, h_op: E / (Pkw * S.PC.DISP) };
}
const pldAno = a => PLD[a].tab;
const FATORES = Array.from({ length: 21 }, (_, i) => 1 + 0.05 * i);
const A = { base: FATORES.map(k => tamanho(k)), pld2025: FATORES.map(k => tamanho(k, { pld: pldAno("2025") })),
  elz600: FATORES.map(k => tamanho(k, { celz: 600 })) };
const otimo = L => L.reduce((a, b) => (b.vpl > a.vpl ? b : a));

// ── B. onde usar o H₂ ──
// forno: true = H₂ com O₂; sDuto: fração do calor do queimador de duto vinda do H₂; xv: H₂ na turbina (volume)
function uso(forno, sDuto, xv, pEl = S.PE0.P_EL) {
  const v = S.M.calcular(P, { X_H2V: xv });
  S.prepara(v);
  let h2 = v.H2_TOT, gn = v.GN_NM3, co2 = v.CO2_P;
  const dg = (1 - sDuto) * v.DUTO;                                         // parte do duto a gás natural
  h2 -= dg / v.PCI; gn += dg / v.PCI_GN; co2 += dg * v.FE_GN;
  if (!forno) { h2 -= v.Q_F / v.PCI; gn += v.Q_FOR0 / v.PCI_GN; co2 += v.Q_FOR0 * v.FE_GN; }
  const temH2 = h2 > 1e-9;
  Object.assign(S.PC, { H2: temH2 ? h2 : 1e-9 });
  Object.assign(S.PE, { GN1: gn, CO2_1: co2, P_EL: pEl });
  const r = S.custos(P);
  S.semTrocador(r, v);
  const tira = id => { const u = r.por[id].usd * (1 + S.PC.F_ND); r.total -= u; r.fab -= u; };
  if (sDuto === 0) tira("duto");
  if (!forno) tira("forno");
  if (!temH2) { r.total -= r.sis; r.sis = 0; }
  const x = S.econ(r);
  const om = (temH2 ? x.omFv + x.rede + x.ext.total : 0) + S.PE.OM_RESTO * (r.total - (temH2 ? r.por.fv.usd : 0));
  const fluxo = x.ec - om, vpl = -r.total + fluxo / x.frc;
  return { forno, sDuto, xv, h2: temH2 ? h2 : 0, gn, co2, co2Ano: co2 * ANO / 1000, inv: r.total / 1e6, vpl: vpl / 1e6, fluxo: fluxo / 1e6,
    frc: x.frc, el: x.el };
}
const B = [];
for (const forno of [false, true]) for (let i = 0; i <= 10; i++) for (let j = 0; j <= 12; j++) B.push(uso(forno, i / 10, j * 0.025));
// maior VPL para cada meta de CO₂ (kg/m²): o forno é tudo ou nada (hipótese), por isso a fronteira tem um degrau
const melhor = meta => B.filter(p => p.co2 <= meta + 1e-9).reduce((a, c) => (c.vpl > a.vpl ? c : a));
const co2Min = Math.min(...B.map(p => p.co2));
const fronteira = Array.from({ length: 77 }, (_, i) => co2Min + 0.05 * i).filter(m => m <= 6.08).map(m => ({ meta: m, ...melhor(m) }));
const degrau = B.filter(p => !p.forno).reduce((a, c) => (c.co2 < a.co2 ? c : a));   // menor CO₂ sem o forno a H₂
// caminho por passos, do sem H₂ ao proposto
const PASSOS = [["Sem \\Ht{} (turbina a gás natural e recuperação)", false, 0, 0], ["+ forno a \\Ht{} com \\Ot", true, 0, 0],
  ["+ queimador de duto a \\Ht", true, 1, 0], ["+ 30\\% de \\Ht{} na turbina (proposto)", true, 1, 0.30]].map(([n, fo, sd, xv]) => ({ nome: n, ...uso(fo, sd, xv) }));
PASSOS.forEach((p, i) => { if (i) { const a = PASSOS[i - 1]; p.custoT = (a.vpl - p.vpl) * 1e6 * p.frc / ((a.co2 - p.co2) * ANO / 1000); } });
const total = PASSOS[3], semH2 = PASSOS[0];
total.custoTotal = (semH2.vpl - total.vpl) * 1e6 * total.frc / ((semH2.co2 - total.co2) * ANO / 1000);
// ordem alternativa: turbina e duto antes do forno (o custo por t de cada uso não depende muito da ordem)
const usoSo = (fo, sd, xv) => { const p = uso(fo, sd, xv); return (semH2.vpl - p.vpl) * 1e6 * p.frc / ((semH2.co2 - p.co2) * ANO / 1000); };
const custoSo = { forno: usoSo(true, 0, 0), duto: usoSo(false, 1, 0), turbina: usoSo(false, 0, 0.30) };
// eletricidade que zera o VPL da fábrica sem H₂ (o VPL é linear no preço da eletricidade)
const s600 = uso(false, 0, 0, 600), s0 = uso(false, 0, 0, 0);
const pElZera = 600 * (-s0.vpl) / (s600.vpl - s0.vpl);
// mais barato abaixo do limite de conciliação do SBCE (25 mil t/ano)
const abaixo = B.filter(p => p.co2Ano <= 25000), sbce = abaixo.length ? abaixo.reduce((a, b) => (b.vpl > a.vpl ? b : a)) : null;
const co2AnoMin = Math.min(...B.map(p => p.co2Ano));
// mesmo nível de H₂ do proposto, só mudando a turbina: o x_V que leva ao limite (busca fina)
let lo = 0, hi = 0.3;
for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (uso(true, 1, m).co2Ano > 25000) lo = m; else hi = m; }
const xvSbce = uso(true, 1, 0.30).co2Ano > 25000 ? null : hi, noLimite = xvSbce === null ? null : uso(true, 1, xvSbce);
// H₂ na turbina (volume) que levaria ao limite, se os combustores admitissem mais de 30% (extrapolação)
let lo2 = 0.3, hi2 = 1; for (let k = 0; k < 60; k++) { const m = (lo2 + hi2) / 2; if (uso(true, 1, m).co2Ano > 25000) lo2 = m; else hi2 = m; }
const xvSbceExtra = hi2;

// ── conferências ──
const base = tamanho(1), prop = uso(true, 1, 0.30);
console.log(`conferência: caso-base pelo despacho, VPL ${f(base.vpl, 2)} mi e acerto ${f(base.kpld, 4)} R$/MWh (site: −215,26 e 29,5941)`);
console.log(`conferência: proposto pela parte B, VPL ${f(prop.vpl, 2)} mi, CO₂ ${f(prop.co2, 3)} kg/m², H₂ ${f(prop.h2, 4)} kg/m²`);
if (Math.abs(base.vpl - prop.vpl) > 0.01 || Math.abs(base.kpld - 29.5941) > 0.001 || Math.abs(prop.vpl - R.caso().x.vpl / 1e6) > 0.01) { console.error("✗ as partes não reproduzem o caso-base"); process.exit(1); }

// ── resumo ──
console.log("\nA. tamanho do eletrolisador (× mínimo) | MW | h/dia | acerto R$/MWh | rede mi/ano | investimento mi | VPL mi | H₂ US$/kg");
for (const o of A.base.filter((_, i) => i % 2 === 0)) console.log(`${f(o.fator, 2)} | ${f(o.P_MW, 1)} | ${f(o.h_op, 1)} | ${f(o.kpld, 1)} | ${f(o.rede, 2)} | ${f(o.inv, 1)} | ${f(o.vpl, 1)} | ${f(o.lcoh, 2)}`);
for (const [n, L] of Object.entries(A)) { const o = otimo(L); console.log(`ótimo (${n}): ${f(o.fator, 2)} × mínimo, VPL ${f(o.vpl, 1)} mi; a cada +10% o VPL muda ${f(L[2].vpl - L[0].vpl, 1)} mi`); }
console.log("\nB. caminho | H₂ kg/m² | CO₂ kg/m² | mil t/ano | investimento mi | VPL mi | US$/t do passo");
for (const p of PASSOS) console.log(`${p.nome} | ${f(p.h2, 3)} | ${f(p.co2, 2)} | ${f(p.co2Ano / 1000, 1)} | ${f(p.inv, 1)} | ${f(p.vpl, 1)} | ${f(p.custoT, 0)}`);
console.log(`do sem H₂ ao proposto: ${f(total.custoTotal, 0)} US$/t; cada uso sozinho a partir do sem H₂: forno ${f(custoSo.forno, 0)}, duto ${f(custoSo.duto, 0)}, turbina ${f(custoSo.turbina, 0)} US$/t`);
console.log(`fábrica sem H₂: VPL ${f(semH2.vpl, 1)} mi; zera com a eletricidade a R$ ${f(pElZera, 0)}/MWh (adotado R$ 600)`);
console.log(`sem o forno a H₂, o menor CO₂ é ${f(degrau.co2, 2)} kg/m² (${f(degrau.co2Ano / 1000, 1)} mil t/ano, VPL ${f(degrau.vpl, 1)} mi); abaixo disso o forno a H₂ entra de uma vez`);
for (const m of [5.9, 5.6, 5.3, 5.0, 2.8, 2.5, 2.4]) { const p = melhor(m); console.log(`  meta ${f(m, 2)} kg/m²: forno ${p.forno ? "H₂" : "GN"}, duto ${f(p.sDuto, 1)}, turbina ${f(p.xv * 100, 1)}%, VPL ${f(p.vpl, 1)}`); }
const reta = (semH2.vpl - total.vpl) / (semH2.co2 - total.co2), desvio = B.map(p => p.vpl - (semH2.vpl + reta * (p.co2 - semH2.co2)));
console.log(`afastamento da reta sem H₂ → proposto: de ${f(Math.min(...desvio), 1)} a ${f(Math.max(...desvio), 1)} mi`);
const fo = uso(true, 0, 0.30), fd = uso(true, 1, 0);   // depois do forno: turbina antes do duto e duto antes da turbina
console.log(`depois do forno: turbina primeiro ${f((PASSOS[1].vpl - fo.vpl) * 1e6 * fo.frc / ((PASSOS[1].co2 - fo.co2) * ANO / 1000), 0)} US$/t; duto primeiro ${f((PASSOS[1].vpl - fd.vpl) * 1e6 * fd.frc / ((PASSOS[1].co2 - fd.co2) * ANO / 1000), 0)} US$/t`);
if (sbce) console.log(`melhor abaixo de 25 mil t/ano: forno ${sbce.forno ? "H₂" : "GN"}, duto ${f(sbce.sDuto, 1)}, turbina ${f(sbce.xv * 100, 1)}%: CO₂ ${f(sbce.co2Ano / 1000, 2)} mil t, VPL ${f(sbce.vpl, 1)} mi`);
console.log(`menor CO₂ possível: ${f(co2AnoMin / 1000, 2)} mil t/ano; H₂ na turbina para o limite (acima de 30%, extrapolado): ${f(xvSbceExtra * 100, 1)}%`);
if (noLimite) console.log(`rente ao limite só pela turbina: ${f(xvSbce * 100, 1)}% de H₂, VPL ${f(noLimite.vpl, 1)} mi (+${f(noLimite.vpl - prop.vpl, 1)} sobre o proposto)`);

fs.writeFileSync(path.join(__dirname, "otimiza_rev.json"), JSON.stringify({ A, B: B.map(({ frc, el, ...p }) => p), fronteira: fronteira.map(({ frc, el, ...p }) => p),
  passos: PASSOS.map(({ frc, el, ...p }) => p), custoTotal: total.custoTotal, custoSo, pElZera, sbce, xvSbce, noLimite, co2AnoMin, xvSbceExtra,
  degrau: (({ frc, el, ...p }) => p)(degrau) }, null, 1));
