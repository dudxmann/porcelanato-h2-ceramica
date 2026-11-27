// Versão revisada do artigo: caso-base, robustez, cenários, sensibilidade, fluxo de caixa, investimento, validação e
// análise exergética, todos com o mesmo motor (modelo_rev.js: Eq. (9) numa base só, turbina a 31,5% e custos completos).
// Uso (na pasta do projeto): node artigo_v2/caso_rev.js  → imprime o resumo e grava artigo_v2/caso_rev.json
const fs = require("fs"), path = require("path");
const R = require("./modelo_rev.js");
const P = R.P, ANO = P * 365;
const f = (x, d) => (x === null || x === undefined || Number.isNaN(x) ? "—" : x.toFixed(d).replace(".", ","));
const mi = x => x / 1e6;

function resumo(c) {
  const { v, r, x } = c;
  return { h2: v.H2_TOT, gn: v.GN_NM3, co2: v.CO2_P, red: v.RED_CO2, co2Ano: v.CO2_P * ANO / 1000, duto: v.DUTO, trc: v.TRC,
    semTrc: c.semTrc, xE: v.X_H2E, inv: mi(r.total), fab: mi(r.fab), sis: mi(r.sis), vpl: mi(x.vpl), tir: x.tir, lcoh: x.lcoh,
    abat: x.abat, gasZera: x.gnEq, pGn: x.pGn, fluxo: mi(x.fluxo), m2: x.m2 * R.PC.BRL, vpli: mi(x.vpli), tiri: x.tiri, il: x.il,
    payb: x.payb, pfv: v.P_FV / 1000, pelz: v.P_INST / 1000, ext: x.ext, ecGn: mi(x.ecGn), ecEl: mi(x.ecEl), omFv: mi(x.omFv),
    omR: mi(x.omR), rede: mi(x.rede), pilhasAno: mi(x.ext.pilhasAno), encAno: mi(x.ext.encAno), frc: x.frc };
}

// ── conferência do código contra a planilha (antes das correções): tem de dar o caso-base entregue ──
const S = R;   // mesmo objeto do modelo.js
S.prepara(S.M.calcular(P)); const r0 = S.custos(P), x0 = S.econ(r0);
const confere = { vpl_planilha: -215.3126, vpl_codigo: mi(x0.vpl), inv_codigo: mi(r0.total) };
if (Math.abs(confere.vpl_codigo - confere.vpl_planilha) > 0.1) { console.error("✗ o código não reproduz a planilha"); process.exit(1); }

// ── caso-base revisado e passos da revisão (para mostrar o efeito de cada correção) ──
const base = R.caso();
const B = resumo(base);
const SEM = { pilha: 0, vidaPilha: 50000, encEPE: 0, tarifa: "TMP" };
const passos = [
  ["Artigo v2 (35%, PCI do H₂ a 0 °C, sem pilhas e encargos)", R.caso({ ETA: 0.35, PCI_H2V: 10.78 }, { o: SEM })],
  ["+ PCI do H₂ a 20 °C na Eq. (9)", R.caso({ ETA: 0.35 }, { o: SEM })],
  ["+ turbina a 31,5% (Taurus 60)", R.caso({}, { o: SEM })],
  ["+ troca das pilhas", R.caso({}, { o: { ...R.COMPLETO, encEPE: 0, tarifa: "TMP" } })],
  ["+ encargos da FV (EPE)", R.caso({}, { o: { ...R.COMPLETO, tarifa: "TMP" } })],
  ["+ tarifa industrial TG1 em cascata: caso-base", base],
].map(([n, c]) => ({ nome: n, ...resumo(c) }));

// ── robustez: uma hipótese técnica ou de custo por vez ──
const ROB = [
  ["Caso-base", {}],
  ["Turbina a 35% (Boyce)", { ETA: 0.35 }],
  ["Eletrólise de 2030 (54 kWh/kg)", { KWH_KG: 54 }],
  ["Frações de calor 49/39/12%", { FR_FOR: 0.49, FR_AT: 0.39, FR_SEC: 0.12 }],
  ["Frações de calor 55/36/9%", { FR_FOR: 0.55, FR_AT: 0.36, FR_SEC: 0.09 }],
].map(([n, ex]) => ({ nome: n, ...resumo(R.caso(ex)) }));
// estoque só do excedente (escolha de projeto; o caso-base guarda 1 dia por confiabilidade)
const exc = 1 - R.PC0.H_OP * R.PC0.DISP / 24;   // fração do consumo do dia que passa pelo estoque (excedente médio, como no texto)
ROB.push({ nome: "Estoque só do excedente", ...resumo(R.caso({}, { ajusta: c => { c.AUT = exc; } })), autExc: exc });
ROB.push({ nome: "Pilha a 15% / 20% do eletrolisador", lo: resumo(R.caso({}, { o: { ...R.COMPLETO, pilha: 0.15 } })), hi: resumo(R.caso({}, { o: { ...R.COMPLETO, pilha: 0.20 } })) });

// ── cenários ──
const CEN = [
  ["Caso-base", {}, {}],
  ["Gás natural pelo dobro", {}, { ajusta: (c, e) => { e.P_GN *= 2; } }],
  ["Gás natural pelo triplo", {}, { ajusta: (c, e) => { e.P_GN *= 3; } }],
  ["Sem acréscimo de importação", {}, { ajusta: c => { c.F_IMP = 0; } }],
  ["Eletrolisador a 600 US$/kW", {}, { celz: 600 }],
  ["Eletrolisador a 1.200 US$/kW", {}, { celz: 1200 }],
  ["Eletrolisador a 2.300 US$/kW (fora da China)", {}, { celz: 2300 }],
  ["Tarifa de matéria-prima (TMP), como nas versões anteriores", {}, { o: { ...R.COMPLETO, tarifa: "TMP" } }],
  ["Gás da turbina na tarifa de geração distribuída (TGG)", {}, { o: { ...R.COMPLETO, tarifa: "TG1+TGG" } }],
].map(([n, ex, op]) => ({ nome: n, ...resumo(R.caso(ex, op)) }));
// investimento pela metade e gás pelo triplo: metade de todo o investimento (e da manutenção proporcional a ele)
{
  const c = R.caso({}, { ajusta: (cc, e) => { e.P_GN *= 3; } });
  c.r.total /= 2; c.r.sis /= 2; c.r.fab /= 2; for (const k of Object.keys(c.r.por)) c.r.por[k] = { ...c.r.por[k], usd: c.r.por[k].usd / 2 };
  c.x = R.econRev(c.r); CEN.push({ nome: "Investimento pela metade e gás pelo triplo", ...resumo(c) });
}
// 2030: eletrolisador a 675 US$/kW e FV × 18/26 (IEA), 58 kWh/kg mantidos
{
  const fv30 = { id: "fv2030", c: () => 3000 / R.PC0.FX_EPE * 18 / 26, ce: () => R.PC0.CE24, ano: 2024 };
  if (!R.PRECOS_FV.find(p => p.id === "fv2030")) R.PRECOS_FV.push(fv30);
  CEN.push({ nome: "2030 (eletrolisador 675 US$/kW, FV × 0,69)", ...resumo(R.caso({}, { celz: 675, fv: "fv2030" })) });
}
const zeraGas = B.gasZera;

// ── sensibilidade (tornado), um parâmetro por vez ──
const FV = { greener: 2400 / R.PC0.BRL, epe4: 5500 / R.PC0.FX_EPE * R.PC0.CE26 / R.PC0.CE24 };
R.PRECOS_FV.push({ id: "gr", c: () => FV.greener, ce: () => R.PC.CE26, ano: 2026 }, { id: "e4", c: () => FV.epe4, ce: () => R.PC.CE26, ano: 2026 });
const SENS = [
  ["Eletrolisador: 600 a 1.200 US$/kW", { celz: 600 }, { celz: 1200 }],
  ["Fotovoltaica: R$ 2,40 a 5,50/Wp", { fv: "gr" }, { fv: "e4" }],
  ["Importação: 0% a 87%", { ajusta: c => { c.F_IMP = 0; } }, { ajusta: c => { c.F_IMP = 0.87; } }],
  ["Taxa de desconto: 6% a 10% ao ano", { ajusta: (c, e) => { e.TAXA = 0.06; } }, { ajusta: (c, e) => { e.TAXA = 0.10; } }],
  ["Vida útil: 25 para 20 anos", { ajusta: (c, e) => { e.VIDA = 25; } }, { ajusta: (c, e) => { e.VIDA = 20; } }],
  ["Manutenção: 1,5% a 3,0% ao ano", { ajusta: (c, e) => { e.OM_RESTO = 0.015; } }, { ajusta: (c, e) => { e.OM_RESTO = 0.03; } }],
  ["Acerto na CCEE: R$ 21 a 77/MWh", { ajusta: c => { c.K_PLD = R.PC0.K_PLD * 20.5053 / 48.803; } }, { ajusta: c => { c.K_PLD = R.PC0.K_PLD * 77.1008 / 48.803; } }],
  ["Encargos da FV: R$ 48 a 120/kW·ano", { o: { ...R.COMPLETO, encEPE: 0 } }, {}],
  ["Eletricidade evitada: R$ 450 a 750/MWh", { ajusta: (c, e) => { e.P_EL = 450; } }, { ajusta: (c, e) => { e.P_EL = 750; } }],
].map(([n, a, b]) => ({ nome: n, lo: mi(R.caso({}, a).x.vpl), hi: mi(R.caso({}, b).x.vpl), tirLo: R.caso({}, a).x.tir, tirHi: R.caso({}, b).x.tir }));
R.PE.P_EL = R.PE0.P_EL;
R.PE.TAXA = R.PE0.TAXA; R.PE.VIDA = R.PE0.VIDA;

// ── investimento por item e parcela ──
const inv = Object.fromEntries(Object.entries(base.r.por).map(([k, o]) => [k, { usd: mi(o.usd), m: mi(o.m || 0), n: mi(o.n || 0), o: mi(o.o || 0), p: mi(o.p || 0) }]));

// ── validação: indicadores do modelo contra valores publicados (não usados para calibrar) ──
const v = base.v;
const val = {
  agua: { modelo: v.AGUA_EV, ref: 12.16 },
  atom_MJ_kg: { modelo: v.E_AT_ESP },
  forno_kcal_kg: { modelo: v.Q_FOR0 / v.M_P / 4.1868 * 1000, faixa: [500, 600] },
  eletr_kWh_t: { modelo: v.E_E0 / 3.6 / v.M_P * 1000 },
  perdas_forno: { modelo: v.F_EXA + v.F_RES, exaustao: v.F_EXA },
  elz_kWh_kg: { modelo: v.KWH_KG, enerlac: 61.7 },
  lcoh: { modelo: B.lcoh, enerlac: [2.84, 5.56] },
  gas_zera: { modelo: B.gasZera, enerlac: 8.55 },
};

// ── análise exergética (por m² de produto), estado morto 25 °C e 1 atm ──
// exergia química padrão (Szargut, em Bejan, Tsatsaronis e Moran, 1996): CH₄ 831,65 kJ/mol; H₂ 236,09 kJ/mol; O₂ 3,97 kJ/mol
const T0 = 298.15;
const PHI_GN = 831.65 / 802;                  // exergia química / PCI do metano, tomada para o gás natural (hipótese)
const EX_H2 = 236.09 / 2.016;                 // MJ/kg
const PHI_H2 = EX_H2 / 120;
const EX_O2 = 3.97 / 32.00;                   // MJ/kg
const exq = Tc => { const T = Tc + 273.15; return 1 - T0 * Math.log(T / T0) / (T - T0); };   // exergia/calor sensível acima de 25 °C
const T_SEC = 125;                            // temperatura dos gases de secagem no secador (consigna de 120 a 125 °C; Mezquita et al., 2012)
const PSI_FORNO = 0.10;                       // exergia retida nas transformações da peça: 10% da entrada do forno a gás (Ferrer et al., 2019)
function exergia(v, cenario, extra = {}) {
  const prod = { el: v.E_E0 >= 0 ? Math.round(v.E_E0 * 100) / 100 : 0, at: v.Q_AT * exq(550), sec: v.Q_SEC * exq(T_SEC),
    forno: PSI_FORNO * PHI_GN * v.Q_FOR0 };
  const ent = {}, des = {}, perd = {};
  const exaQ = v.Q_EXA0, resQ = v.Q_RES0;
  if (cenario === "c0") {
    ent.gn = PHI_GN * v.Q_T0; ent.rede = prod.el;
    perd.exaustao = exaQ * exq(v.T_EXA); perd.ar_res = resQ * exq(v.T_ARQ);
    des.forno = PHI_GN * v.Q_FOR0 - prod.forno - perd.exaustao - perd.ar_res;
    des.atomizador = PHI_GN * v.Q_AT - prod.at;
    des.secador = PHI_GN * v.Q_SEC - prod.sec;
  } else if (cenario === "rec") {
    // divisão do artigo (Fig. 2): atomizador com todo o ar de resfriamento recuperado e 1,14 do trocador; secador com 7,07 do trocador
    const ar = v.AR_REC, qtrc = 8.21, trcAt = 1.14, trcSec = qtrc - trcAt;
    const gnAt = v.Q_AT - ar - trcAt, gnSec = v.Q_SEC - trcSec;
    ent.gn = PHI_GN * (v.Q_FOR0 + gnAt + gnSec); ent.rede = prod.el + v.E_VENT;
    const exa200 = exaQ * exq(v.T_EXA), exa140 = exaQ * (140 - 25) / (v.T_EXA - 25) * exq(140);
    perd.exaustao = exa140; perd.ar_res = (resQ - ar) * exq(v.T_ARQ);
    des.forno = PHI_GN * v.Q_FOR0 - prod.forno - exa200 - resQ * exq(v.T_ARQ);
    des.trocador = exa200 - exa140 - qtrc * exq(150);
    des.ventiladores = v.E_VENT;
    des.atomizador = PHI_GN * gnAt + ar * exq(v.T_ARQ) + trcAt * exq(150) - prod.at;
    des.secador = PHI_GN * gnSec + trcSec * exq(150) - prod.sec;
  } else {
    const eElz = v.E_PV_M2 * 3.6, eCampo = eElz * (1 + v.PERDAS);
    ent.fv = eCampo; ent.gn = PHI_GN * v.GN_TG;
    des.rede_fv = eCampo - eElz;
    const exH2 = v.H2_TOT * EX_H2, exO2 = v.O2_TOT * EX_O2;
    des.eletrolisador = eElz - exH2 - exO2;
    prod.o2_venda = v.O2_VENDA * EX_O2;
    const exEsc = v.ESC * exq(v.T_EX);
    des.turbina = PHI_GN * v.GN_TG + PHI_H2 * v.F_H2_TG - v.E_TG - exEsc;
    des.ventiladores = v.E_VENT;
    des.atomizador = PHI_H2 * v.DUTO + exEsc + v.AR_AT * exq(v.T_ARQ) - prod.at;
    const arSec = v.TRC > 0 ? v.AR_SEC : v.Q_SEC, trc = Math.max(0, v.TRC);
    des.secador = arSec * exq(v.T_ARQ) + trc * exq(150) - prod.sec;
    perd.ar_res = (resQ - v.AR_REC) * exq(v.T_ARQ) + (v.TRC < 0 ? -v.TRC * exq(v.T_ARQ) : 0);
    const exaF = v.Q_EXA * exq(v.T_EXA);
    des.forno = PHI_H2 * v.Q_F + v.O2_FOR * EX_O2 - prod.forno - exaF - resQ * exq(v.T_ARQ);
    if (trc > 0) {
      const tOut = v.T_FOR_OUT, exaOut = v.Q_EXA * (tOut - 25) / (v.T_EXA - 25) * exq(tOut);
      des.trocador = exaF - exaOut - trc * exq(150); perd.exaustao = exaOut;
    } else perd.exaustao = exaF;
  }
  const soma = o => Object.values(o).reduce((a, b) => a + b, 0);
  const E = soma(ent), Pd = soma(prod), D = soma(des), L = soma(perd);
  return { ent, prod, des, perd, E, P: Pd, D, L, fecha: E - Pd - D - L, psi: Pd / E };
}
const v0 = base.v;   // ciclo 0 e recuperação não dependem do rendimento da turbina nem do H₂
const EXE = { c0: exergia(v0, "c0"), rec: exergia(v0, "rec"), prop: exergia(base.v, "prop"), prop35: exergia(R.calc({ ETA: 0.35 }), "prop") };
// custo termodinâmico do caminho eletricidade → H₂ → calor: MJ de eletricidade do campo por MJ de calor no forno
const caminho = { el_por_MJ_H2: base.v.KWH_KG * 3.6 * (1 + base.v.PERDAS) / 120, exGN_por_MJ: PHI_GN,
  psi_elz: EX_H2 / (base.v.KWH_KG * 3.6) };
// custo médio da exergia de cada insumo (US$/GJ de exergia): primeiro passo da exergoeconomia
const cEx = { h2: B.lcoh / EX_H2 * 1000, gn: B.pGn / R.PC0.BRL / (v0.PCI_GN * PHI_GN) * 1000, el: R.PE0.P_EL / R.PC0.BRL / 3.6 };
// recuperação: exergia de 1 MJ de cada corrente recuperada e destruição ao usá-la no atomizador (550 °C) ou no secador (210 °C)
const correntes = { ar225: exq(225), trc150: exq(150), esc500: exq(500), at550: exq(550), sec210: exq(210) };

// recuperação de calor isolada (Seção 4): trocador da exaustão, ventilador e dutos orçados com as correlações da Tabela 4
// (US$ milhões de 2026); gás evitado pela TG1 em cascata, menos a eletricidade dos ventiladores (0,60 MJe/m²)
const recup = (() => {
  const inv = 0.74 + 0.04 + 0.12, gn0 = R.PE0.GN0, gnRec = gn0 - (v0.AR_REC + 8.21) / v0.PCI_GN;   // 12,97 do ar de resfriamento + 8,21 do trocador (Eq. 6)
  const prod = R.P * 365, m3 = (gn0 - gnRec) * prod;
  const res = {};
  for (const tar of ["TG1", "TMP"]) {
    const p = R.precoEvitado(tar, gn0, gnRec);
    const ec = (m3 * p - 0.60 / 3.6 * prod / 1000 * R.PE0.P_EL) / R.PC0.BRL / 1e6;   // US$ milhões/ano
    const fl = ec - 0.015 * inv;
    res[tar] = { preco: p, economia: ec, vpl: -inv + fl / B.frc, retorno_meses: inv / fl * 12 };
  }
  return { inv, m3_ano: m3, ...res };
})();

const out = { eta: R.ETA_BASE, confere, base: B, recup, v: Object.fromEntries(["H2_TOT", "GN_NM3", "GN_TG", "F_TG", "ESC", "X_H2E", "F_H2_TG", "DUTO", "AR_AT", "AR_SEC", "TRC",
  "AR_REC", "Q_F", "Q_EXA", "M_ESC", "M_AR_AT", "T_SEC_IN", "O2_TOT", "O2_FOR", "O2_VENDA", "E_PV_M2", "P_FV", "P_INST", "A_TER_HA", "N_PLACAS", "REC_TOT", "ENT_TOT",
  "USO_TOT", "ENT_FAB", "CO2_P", "RED_CO2", "RED_GN", "H2_DIA", "P_TG", "T_PRE", "M_GAS_AT", "H2_FOR", "V_EST", "CO2_FV"].map(k => [k, base.v[k]])),
  k: { P_ISO: base.r.k.P_ISO, TG: base.r.k.TG, H2_EXC: base.r.k.H2_EXC, E_DIA: base.r.k.E_DIA }, passos, robustez: ROB, cenarios: CEN,
  sensibilidade: SENS, investimento: inv, validacao: val, exergia: EXE, caminho, custo_exergia: cEx, correntes,
  constantes: { PHI_GN, PHI_H2, EX_H2, EX_O2, T_SEC, PSI_FORNO } };
fs.writeFileSync(path.join(__dirname, "caso_rev.json"), JSON.stringify(out, null, 1));

// ── resumo ──
console.log(`conferência com a planilha (antes das correções): VPL ${f(confere.vpl_codigo, 2)} mi (planilha −215,31)`);
console.log(`\nturbina η = ${f(R.ETA_BASE * 100, 1)}%; x_E = ${f(B.xE, 4)}`);
console.log("passo | H₂ kg/m² | CO₂ kg/m² (red.) | mil t/ano | inv. mi | VPL mi | TIR | H₂ US$/kg | US$/t | gás zera R$/m³");
for (const p of passos) console.log(`${p.nome} | ${f(p.h2, 3)} | ${f(p.co2, 2)} (${f(-p.red * 100, 1)}%) | ${f(p.co2Ano / 1000, 1)} | ${f(p.inv, 1)} | ${f(p.vpl, 1)} | ${p.tir === null ? "—" : f(p.tir * 100, 1) + "%"} | ${f(p.lcoh, 2)} | ${f(p.abat, 0)} | ${f(p.gasZera, 2)}`);
console.log(`\nbase: GN ${f(B.gn, 3)} m³/m²; duto ${f(B.duto, 2)}; trocador ${f(B.trc, 2)} (${B.semTrc ? "dispensado" : "usado"}); FV ${f(B.pfv, 1)} MWp; ELZ ${f(B.pelz, 1)} MW; fluxo ${f(B.fluxo, 2)} mi/ano`);
console.log(`economia GN ${f(B.ecGn, 2)}, El ${f(B.ecEl, 2)}; O&M FV ${f(B.omFv, 2)}, resto ${f(B.omR, 2)}, rede ${f(B.rede, 2)}, pilhas ${f(B.pilhasAno, 2)} (${B.ext.nPilhas} trocas), encargos ${f(B.encAno, 2)}`);
console.log(`depois de impostos VPL ${f(B.vpli, 1)}, TIR ${B.tiri === null ? "—" : f(B.tiri * 100, 1)}; IL ${f(B.il, 2)}; R$/m² ${f(B.m2, 2)}; fab ${f(B.fab, 1)} sis ${f(B.sis, 1)}`);
console.log("\nrobustez | H₂ | CO₂ | mil t | VPL | H₂ US$/kg");
for (const o of ROB) o.lo ? console.log(`${o.nome} | VPL ${f(o.lo.vpl, 1)} a ${f(o.hi.vpl, 1)} | H₂ ${f(o.lo.lcoh, 2)} a ${f(o.hi.lcoh, 2)}`)
  : console.log(`${o.nome} | ${f(o.h2, 3)} | ${f(o.co2, 2)} | ${f(o.co2Ano / 1000, 1)} | ${f(o.vpl, 1)} | ${f(o.lcoh, 2)}`);
console.log("\ncenários | VPL | TIR | H₂");
for (const o of CEN) console.log(`${o.nome} | ${f(o.vpl, 1)} | ${o.tir === null ? "—" : f(o.tir * 100, 1)} | ${f(o.lcoh, 2)} | inv ${f(o.inv, 1)}`);
console.log("\nsensibilidade | VPL lo | VPL hi");
for (const o of SENS) console.log(`${o.nome} | ${f(o.lo, 1)} | ${f(o.hi, 1)} | TIR ${o.tirLo === null ? "—" : f(o.tirLo * 100, 1)} a ${o.tirHi === null ? "—" : f(o.tirHi * 100, 1)}`);
console.log("\nexergia (MJ/m²) | entra | produtos | destruída | perdas | fecha | ψ");
for (const [k, e] of Object.entries(EXE)) {
  console.log(`${k} | ${f(e.E, 2)} | ${f(e.P, 2)} | ${f(e.D, 2)} | ${f(e.L, 2)} | ${f(e.fecha, 3)} | ${f(e.psi * 100, 1)}%`);
  console.log(`   entra ${JSON.stringify(Object.fromEntries(Object.entries(e.ent).map(([a, b]) => [a, +b.toFixed(2)])))} prod ${JSON.stringify(Object.fromEntries(Object.entries(e.prod).map(([a, b]) => [a, +b.toFixed(2)])))}`);
  console.log(`   destr ${JSON.stringify(Object.fromEntries(Object.entries(e.des).map(([a, b]) => [a, +b.toFixed(2)])))} perdas ${JSON.stringify(Object.fromEntries(Object.entries(e.perd).map(([a, b]) => [a, +b.toFixed(2)])))}`);
}
console.log(`caminho: ${f(caminho.el_por_MJ_H2, 2)} MJ de eletricidade por MJ de H₂ (PCI) contra ${f(caminho.exGN_por_MJ, 3)} MJ de exergia do GN; ψ eletrólise ${f(caminho.psi_elz * 100, 1)}%`);
console.log(`custo da exergia (US$/GJ): H₂ ${f(cEx.h2, 1)}, GN ${f(cEx.gn, 1)}, eletricidade ${f(cEx.el, 1)}`);
console.log(`exq: ${Object.entries(correntes).map(([a, b]) => a + " " + f(b, 3)).join("; ")}`);
console.log(`validação: ${JSON.stringify(val)}`);
console.log("recuperação:", JSON.stringify(recup));

// alocação do custo da turbina por exergia (regra SPECO para dois produtos do mesmo componente: mesmo custo por
// unidade de exergia): custo anualizado + manutenção + combustível (gás pela TG1 média do proposto, H₂ pelo LCOH),
// dividido entre a eletricidade (15,00 MJ/m²) e a exergia térmica do escape a 500 °C
const turbSpeco = (() => {
  const vb = base.v, prod = R.P * 365, inv = base.r.por.tg.usd / 1e6;
  const qd = vb.GN_NM3 * R.P, pGnMed = R.custoDia("TG1", qd) / qd;
  const cGn = vb.GN_NM3 * prod * pGnMed / R.PC0.BRL / 1e6, cH2 = vb.F_H2_TG / 120 * prod * B.lcoh / 1e6;
  const cCap = inv * B.frc, cOm = 0.015 * inv, total = cCap + cOm + cGn + cH2;
  const exEl = vb.E_E || 15.0, exEsc = vb.ESC * exq(500);
  const cUnit = total * 1e6 / ((exEl + exEsc) * prod / 1000);   // US$/GJ
  return { inv, pGnMed, cCap, cOm, cGn, cH2, total, exEl, exEsc, cUnit, el_m2: cUnit * exEl / 1000, esc_m2: cUnit * exEsc / 1000,
    el_kWh: cUnit * 3.6 / 1000, fracEsc: exEsc / (exEl + exEsc) };
})();
console.log("turbina (SPECO):", JSON.stringify(turbSpeco));
require("fs").writeFileSync(require("path").join(__dirname, "caso_rev_extra.json"), JSON.stringify({ recup, turbSpeco }, null, 1));
