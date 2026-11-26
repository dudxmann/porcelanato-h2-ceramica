/* ═══════════════════════ custos dos equipamentos ═══════════════════════ */
// Premissas idênticas às da planilha Precificacao_Equipamentos_Ciclo_Proposto.xlsx (versão 4, de 17/11/2026):
// capacidades com os valores arredondados do memorial, para o total bater com a planilha.
const PC = {
  E: 15, DUTO: 8.39, QF: 52, AR: 12.97, CP: 1.05, T_AR: 225, TRC: 1.48,
  TG_IN: 200, TG_OUT: 188, TA_IN: 25, TA_OUT: 150,
  H2: 0.544, KWH: 58, Y: 1137.5, PICO: 0.72, AUT: 1,
  // ligação à rede (decisão do grupo, 14/11/2026; planilha, aba Ligação à rede): o campo injeta na rede e o eletrolisador tira dela,
  // parado na ponta da Celesc (18h30 às 21h30, 5 dias úteis em 7). Tarifas: ANEEL, REH 3.602/2026, Tabela 1 (A2 azul, autoprodução).
  H_OP: 24 - 3 * 5 / 7, DISP: 0.95, PERDAS: 0.03,
  TUSD_FP: 13.99, TUSD_E: 11.63, TUSDG: 4.87, PICO_H: 0.8232422013,
  // acerto na CCEE por MWh consumido: PLD horário do Sul, média de 2024 e 2025, cruzado com a geração média do PVGIS (planilha, seção G)
  K_PLD: 29.5941194429,
  U: 25, P_ELZ: 30, P_EST: 200, NEST: 2, ETA: 0.75, K: 1.41, R: 4124, T_SUC: 298.15,
  P_GRUPO: 0.5, F_OXI: 2, F_INST: 1.3, F_H: 1.45, F_ND: 0.15, ACR_H2: 0,
  C_ELZ: 900, C_EST: 635,   // eletrolisador pelo valor da China (IEA, 2025), por indicação do professor em 14/11
  CE01: 397, CE07: 525.4, CE18: 603.1, CE22: 816, CE24: 798.8, DCE25: 0.016, CE_SEI: 500,
  BRL: 5.3488, GBP: 1.2366,
  // local de instalação (Tijucas, SC), importação e instalação: feedback do professor (28/10)
  T_LOC: 25, T_ISO: 15, K_DER: 0.007, F_IMP: 0.8, FL_BR: 1.14,
  ELZ_FE: 0.40, ELZ_FI: 0.225, ELZ_FO: 0.375,
  C_FV_BR: 724, FV_FE: 0.33, FV_FB: 0.31, FV_FI: 0.15, FV_FO: 0.21,
  // arquivos enviados pelo professor (10/11): turbina pelo Gas Turbine World (2018) e trocador pelo método do módulo de Turton
  TG_PROJ: 1.0,
  HX: { K1: 4.3247, K2: -0.3030, K3: 0.1634, B1: 1.63, B2: 1.66, FM: 1, FP: 1, MAT: 0.714, LAB: 0.630, N: 0.59 },
  FX_EPE: 6.10,
  ARUP: { S1: 2, C1: 30000, S2: 5, C2: 59000, GRUPO: 14000 },
};
PC.CE26 = PC.CE24 * (1 + PC.DCE25);
const PRECOS_ELZ = [[600, "China", "mín."], [900, "adotado", ""], [1200, "China", "máx."], [2300, "fora da", "China"], [2600, "fora,", "máx."]];
const ORIG_TXT = { I: "importado", N: "fabricado no Brasil", L: "preço local do Brasil" };
// Gas Turbine World (2018), tabela "2018 Simple Cycle Genset Prices" (p. 38): [modelo, kW ISO, US$ de 2018 só do equipamento, rendimento %].
// Modelos de 60 Hz até 25 MW, na ordem da tabela.
const GTW = [["C200", 200, 225000, 33.1], ["M1A-17D", 1700, 1550000, 26.9], ["OP16-3C", 1876, 1650000, 24.7], ["Centaur 40", 3515, 3000000, 27.9],
  ["501-KB5S", 3980, 3300000, 29.7], ["Centaur 50", 4600, 3700000, 29.3], ["501-KB7S", 5380, 4450000, 32.3], ["SGT-100", 5400, 4250000, 31.0],
  ["Taurus 60", 5670, 4320000, 31.5], ["Taurus 65", 6300, 4500000, 32.9], ["SGT-300", 7901, 4900000, 30.6], ["Taurus 70", 7965, 5100000, 34.3],
  ["Mars 100", 11350, 6550000, 32.9], ["GTU-12PG-2", 12300, 6460000, 32.6], ["SGT-400", 14326, 7500000, 35.4], ["Titan 130", 16450, 8750000, 35.5],
  ["Titan 250", 21745, 11350000, 38.9], ["LM2500DLE 60Hz", 23200, 12650000, 36.6], ["SGT-600", 24480, 11450000, 33.6], ["FT8 SP25 DLN", 25371, 12900000, 38.1]];
// preço da fotovoltaica em valores do Brasil: o adotado (EPE, R$ 3.000/kW) e as conferências (demais referências da EPE, IRENA e Greener). c = US$/kW na base de ce.
const PRECOS_FV = [
  { id: "greener", g: "R$ 2,40", s: "Greener", brl: 2400, c: () => 2400 / PC.BRL, ce: () => PC.CE26, ano: 2026, nome: "Greener, preço de mercado de um sistema de 300 kWp de geração distribuída (jun/2026)", fonte: "Greener, em Neves (2026)" },
  { id: "epe1", g: "R$ 3,00", s: "adotado", brl: 3000, c: () => 3000 / PC.FX_EPE, ce: () => PC.CE24, ano: 2024, nome: "EPE, PDE 2035: referência mais baixa (adotada)", fonte: "EPE (2025)" },
  { id: "epe2", g: "R$ 3,50", s: "EPE", brl: 3500, c: () => 3500 / PC.FX_EPE, ce: () => PC.CE24, ano: 2024, nome: "EPE, PDE 2035: segunda referência", fonte: "EPE (2025)" },
  { id: "irena", g: "US$ 724", s: "IRENA", brl: null, c: () => PC.C_FV_BR, ce: () => PC.CE24, ano: 2024, nome: "IRENA, média do Brasil em 2024", fonte: "IRENA (2025)" },
  { id: "epe3", g: "R$ 4,50", s: "EPE", brl: 4500, c: () => 4500 / PC.FX_EPE, ce: () => PC.CE24, ano: 2024, nome: "EPE, PDE 2035: terceira referência", fonte: "EPE (2025)" },
  { id: "epe4", g: "R$ 5,50", s: "EPE alta", brl: 5500, c: () => 5500 / PC.FX_EPE, ce: () => PC.CE24, ano: 2024, nome: "EPE, PDE 2035: referência mais alta", fonte: "EPE (2025)" },
];

// correlação dentro da faixa: abaixo do mínimo usa o menor porte; acima do máximo, várias unidades iguais
function faixa(x, min, max, custo) {
  if (x < min) return { c: custo(min), n: 1, fora: "abaixo" };
  const n = Math.ceil(x / max);
  return { c: n * custo(x / n), n, fora: n > 1 ? "acima" : "" };
}

function custos(P, pe = PC.C_ELZ, fv = "epe1") {
  const c = PC, k = { P, pe, fvId: fv, fv: PRECOS_FV.find(x => x.id === fv) };
  // A · turbina: potência ISO para entregar a potência no verão de Tijucas; menor modelo do catálogo acima dela
  k.P_TG = c.E * P / 86.4;
  k.DER = 1 - c.K_DER * (c.T_LOC - c.T_ISO);
  k.P_ISO = k.P_TG / k.DER;
  k.TG = GTW.find(m => m[1] >= k.P_ISO) || null;
  k.F_TG = !k.TG;                    // acima do maior modelo listado: usa a curva de ajuste da revista
  k.TG_KW = k.TG ? k.TG[1] : k.P_ISO;
  k.TG_PRECO = k.TG ? k.TG[2] : 9650 * Math.pow(k.P_ISO, -0.3) * k.P_ISO;
  k.TG_E = k.TG_PRECO * (1 + c.ACR_H2);
  k.TG_I = k.TG_E * c.TG_PROJ;       // engenharia, construção e demais custos: um número só na fonte
  // B · queimador de duto: regra de escala entre dois portes da Arup
  k.Q_DUTO = c.DUTO * P / 86400;
  k.n_DUTO = Math.log(c.ARUP.C2 / c.ARUP.C1) / Math.log(c.ARUP.S2 / c.ARUP.S1);
  k.REF_DUTO = c.ARUP.C1 * Math.pow(k.Q_DUTO / c.ARUP.S1, k.n_DUTO);
  k.F_DUTO = k.Q_DUTO < 0.5 || k.Q_DUTO > 25;
  // C · forno: grupos de queimadores de 0,5 MWt
  k.Q_FOR = c.QF * P / 86400;
  k.N_GR = Math.max(1, k.Q_FOR / c.P_GRUPO);
  k.REF_FOR = k.N_GR * c.ARUP.GRUPO * c.F_OXI;
  k.F_FOR = k.Q_FOR / c.P_GRUPO < 1;
  // D · ventilador do ar de resfriamento (Seider et al.): um só enquanto a vazão couber na faixa da correlação
  k.M_AR = c.AR * 1000 / (c.CP * (c.T_AR - 25)) * P / 86400;
  k.RHO_AR = 101325 / (287.05 * (c.T_AR + 273.15));
  k.V_AR = k.M_AR / k.RHO_AR; k.CFM = k.V_AR * 2118.88;
  const cbV = q => { const l = Math.log(q); return Math.exp(11.0757 - 1.12906 * l + 0.0886 * l * l); };
  const fV = faixa(k.CFM, 1000, 100000, cbV);
  k.CB_VENT = fV.c; k.N_VENT = fV.n; k.F_VENT = fV.fora; k.REF_VENT = k.CB_VENT * c.F_H;
  // E · trocador gás-gás (método do módulo de Turton; acima de 1.000 m², escala com expoente 0,59)
  k.Q_TRC = c.TRC * P / 86.4; k.DT1 = c.TG_IN - c.TA_OUT; k.DT2 = c.TG_OUT - c.TA_IN;
  k.LMTD = (k.DT2 - k.DT1) / Math.log(k.DT2 / k.DT1);
  k.A_TRC = k.Q_TRC * 1000 / (c.U * k.LMTD);
  const cbT = a => { const l = Math.log10(a); return Math.pow(10, c.HX.K1 + c.HX.K2 * l + c.HX.K3 * l * l); };
  k.F_TRC = k.A_TRC < 10 ? "abaixo" : k.A_TRC > 1000 ? "acima" : "";
  k.REF_TRC = k.A_TRC < 10 ? cbT(10) : k.A_TRC > 1000 ? cbT(1000) * Math.pow(k.A_TRC / 1000, c.HX.N) : cbT(k.A_TRC);
  k.FBM_TRC = c.HX.B1 + c.HX.B2 * c.HX.FM * c.HX.FP;
  // F · sistema à parte: FV, eletrolisador, compressor e estoque
  k.E_DIA = c.H2 * c.KWH * P; k.P_FV = k.E_DIA * 365 * (1 + c.PERDAS) / c.Y; k.P_INST = k.E_DIA / (c.H_OP * c.DISP);
  k.H2_PICO = k.P_INST / c.KWH; k.H2_MED = c.H2 * P / 24; k.H2_EXC = k.H2_PICO - k.H2_MED;
  k.W_COMP = c.NEST * c.K / (c.K - 1) * c.R * c.T_SUC * (Math.pow(c.P_EST / c.P_ELZ, (c.K - 1) / (c.K * c.NEST)) - 1) / c.ETA / 3.6e6;
  k.P_COMP = k.H2_EXC * k.W_COMP; k.HP = k.P_COMP / 0.7457;
  const fC = faixa(k.HP, 100, 20000, h => Math.exp(7.9661 + 0.8 * Math.log(h)));
  k.REF_COMP = fC.c; k.N_COMP = fC.n; k.F_COMP = fC.fora;
  k.M_EST = c.H2 * P * c.AUT; k.REF_EST = k.M_EST * c.C_EST;
  k.ELZ_TIC = k.P_INST * pe;          // instalado, valor da China (IEA) ou o escolhido no seletor
  k.C_FV = k.fv.c();
  k.FV_TIC = k.P_FV * k.C_FV;         // instalado no Brasil (IRENA, ou a conferência escolhida)

  // cadeia de cada item, em US$ de 2026:
  // 1. equipamento na origem (base × câmbio × CEPCI) · 2. importação (+80%) ou fabricação no Brasil (× 1,14)
  // 3. instalação e 4. indiretos em Tijucas (× 1,14, salvo preço local)
  const it = ITC.map(d => {
    const b = d.base(k);
    if (b.eq === undefined) return { ...d, ...b, m: 0, n: 0, o: 0, p: 0, usd: 0 };
    const at = x => x * b.fx * c.CE26 / b.ce, loc = b.orig === "L" ? 1 : c.FL_BR;
    const m = at(b.eq), n = b.orig === "I" ? m * c.F_IMP : b.orig === "N" ? m * (c.FL_BR - 1) : 0;
    const o = at(b.ins) * loc, p = at(b.ind) * loc;
    return { ...d, ...b, m, n, o, p, usd: m + n + o + p };
  });
  const por = Object.fromEntries(it.map(x => [x.id, x]));
  por.nd.usd = c.F_ND * ["tg", "duto", "forno", "vent", "trc"].reduce((a, id) => a + por[id].usd, 0);
  const fab = it.filter(x => x.sis === "F").reduce((a, x) => a + x.usd, 0);
  const sis = it.filter(x => x.sis === "S").reduce((a, x) => a + x.usd, 0);
  const soma = f => it.reduce((a, x) => a + x[f], 0);
  const cad = { m: soma("m"), n: soma("n"), o: soma("o"), p: soma("p"), nd: por.nd.usd };
  return { k, it, por, fab, sis, cad, total: fab + sis };
}

/* ── os dez itens da planilha ── */
const ITC = [
  { id: "tg", n: 1, nome: "Turbina a gás com gerador (30% H₂ + GN)", curto: "Turbina a gás", sis: "F",
    desc: "Gera toda a eletricidade da fábrica; o escape quente vai para o atomizador.",
    metodo: "Preço de catálogo do modelo (potência ISO)", fonte: "Gas Turbine World (2018)",
    base: k => ({ eq: k.TG_E, ins: k.TG_I, ind: 0, sym: "US$", ano: 2018, ce: PC.CE18, fx: 1, orig: "I" }),
    cap: k => `${txt("pot", k.TG_KW)} ISO`, unid: k => [k.P_TG, "kW"] },
  { id: "duto", n: 2, nome: "Queimador de duto a H₂ (atomizador)", curto: "Queimador de duto", sis: "F",
    desc: "Eleva o escape da turbina de 500 para 550 °C na entrada do atomizador.",
    metodo: "Custo de conversão GN → H₂ por porte (Arup)", fonte: "Arup (2022)",
    base: k => ({ eq: k.REF_DUTO, ins: k.REF_DUTO * (PC.F_INST - 1), ind: 0, sym: "£", ano: 2022, ce: PC.CE22, fx: PC.GBP, orig: "I" }),
    cap: k => `${txt("pot", k.Q_DUTO * 1000)}t`, unid: k => [k.Q_DUTO * 1000, "kWt"] },
  { id: "forno", n: 3, nome: "Forno: queimadores H₂ + O₂", curto: "Queimadores do forno", sis: "F",
    desc: "Conversão dos queimadores do forno a rolos para H₂ com o O₂ da eletrólise.",
    metodo: "Grupos de 0,5 MWt × conversão × fator de oxicombustão", fonte: "Arup (2022)",
    base: k => ({ eq: k.REF_FOR, ins: k.REF_FOR * (PC.F_INST - 1), ind: 0, sym: "£", ano: 2022, ce: PC.CE22, fx: PC.GBP, orig: "I" }),
    cap: k => `${txt("pot", k.Q_FOR * 1000)}t · ${nf(k.N_GR, 1)} grupos`, unid: k => [k.Q_FOR * 1000, "kWt"] },
  { id: "vent", n: 4, nome: "Ventilador da recuperação do ar de resfriamento", curto: "Ventilador do ar quente", sis: "F",
    desc: "Leva o ar de resfriamento do forno, a 225 °C, ao secador e ao atomizador.",
    metodo: "Correlação de ventilador centrífugo (Seider et al.)", fonte: "Seider et al. (2017)",
    base: k => ({ eq: k.REF_VENT, ins: k.REF_VENT * (PC.F_INST - 1), ind: 0, sym: "US$", ano: "CE 500", ce: PC.CE_SEI, fx: 1, orig: "N" }),
    cap: k => `${sig(k.V_AR)} m³/s · ${k.N_VENT === 1 ? "1 ventilador" : k.N_VENT + " ventiladores"}`, unid: k => [k.V_AR, "m³/s"] },
  { id: "trc", n: 5, nome: "Trocador gás-gás na exaustão do forno", curto: "Trocador gás-gás", sis: "F",
    desc: "A exaustão do forno aquece ar limpo, que vai para o secador.",
    metodo: "Casco e tubos pelo método do módulo de Turton", fonte: "Turton et al. (2012; 2018)",
    base: k => ({ eq: k.REF_TRC, ins: k.REF_TRC * (PC.HX.MAT + PC.HX.LAB), ind: k.REF_TRC * (k.FBM_TRC - 1 - PC.HX.MAT - PC.HX.LAB), sym: "US$", ano: 2001, ce: PC.CE01, fx: 1, orig: "N" }),
    cap: k => `${sig(k.A_TRC)} m² de troca`, unid: k => [k.A_TRC, "m²"] },
  { id: "elz", n: 6, nome: "Eletrolisador alcalino da China (pilhas, BoP e tratamento de água)", curto: "Eletrolisador alcalino", sis: "S",
    desc: "Produz o H₂ e o O₂ com a eletricidade do campo fotovoltaico, que passa pela rede.",
    metodo: "Custo específico instalado (US$/kW), dividido em equipamento (40%) e obra (60%), como diz a IEA", fonte: "IEA (2025)",
    base: k => ({ eq: k.ELZ_TIC * PC.ELZ_FE, ins: k.ELZ_TIC * PC.ELZ_FI, ind: k.ELZ_TIC * PC.ELZ_FO, sym: "US$", ano: 2024, ce: PC.CE24, fx: 1, orig: "I" }),
    cap: k => `${txt("pot", k.P_INST)} instalados`, unid: k => [k.P_INST, "kW"] },
  { id: "fv", n: 7, nome: "Campo fotovoltaico leste-oeste", curto: "Campo fotovoltaico", sis: "S",
    desc: "Placas em fileiras leste-oeste ligadas à rede: geram no ano a energia do eletrolisador.",
    metodo: "Custo instalado no Brasil (R$ 3,00/Wp)", fonte: "EPE (2025); divisão: IRENA (2025)",
    base: k => ({ eq: k.FV_TIC * (PC.FV_FE + PC.FV_FB), ins: k.FV_TIC * PC.FV_FI, ind: k.FV_TIC * PC.FV_FO, sym: "US$", ano: k.fv.ano, ce: k.fv.ce(), fx: 1, orig: "L", fonteP: k.fv.fonte }),
    cap: k => txt("potp", k.P_FV), unid: k => [k.P_FV, "kWp"] },
  { id: "comp", n: 8, nome: "Compressor de H₂ (30 → 200 bar)", curto: "Compressor de H₂", sis: "S",
    desc: "Comprime para o estoque o H₂ que sobra fora da ponta, para as horas de ponta.",
    metodo: "Correlação de compressor alternativo (Seider et al.)", fonte: "Seider et al. (2017)",
    base: k => ({ eq: k.REF_COMP, ins: k.REF_COMP * (PC.F_INST - 1), ind: 0, sym: "US$", ano: "CE 500", ce: PC.CE_SEI, fx: 1, orig: "I" }),
    cap: k => `${txt("pot", k.P_COMP)} · 30 → 200 bar`, unid: k => [k.P_COMP, "kW"] },
  { id: "est", n: 9, nome: "Estoque de H₂ a 200 bar (1 dia)", curto: "Estoque de H₂", sis: "S",
    desc: "Um dia de consumo de H₂ a 200 bar, para a fábrica rodar à noite.",
    metodo: "Custo por kg de H₂ armazenado", fonte: "NREL (2014)",
    base: k => ({ eq: k.REF_EST, ins: k.REF_EST * (PC.F_INST - 1), ind: 0, sym: "US$", ano: 2007, ce: PC.CE07, fx: 1, orig: "I" }),
    cap: k => `${txt("massa", k.M_EST)} de H₂`, unid: k => [k.M_EST, "kg"] },
  { id: "nd", n: 10, nome: "Itens não detalhados da fábrica (dutos, tubulações de H₂ e O₂, instrumentação)", curto: "Itens não detalhados", sis: "F",
    desc: "Dutos, tubulações de H₂ e O₂, válvulas e instrumentação, como porcentagem dos itens 1 a 5 já instalados.",
    metodo: "15% sobre os itens 1 a 5 instalados", fonte: "hipótese do grupo",
    base: k => ({}), cap: k => "15% dos itens 1 a 5", unid: null },
];

/* ── estado e formatação de dinheiro ── */
const CS = { moeda: "USD", pe: PC.C_ELZ, fv: "epe1" };
const RC = () => custos(ST.P, CS.pe, CS.fv);
const cv = usd => CS.moeda === "BRL" ? usd * PC.BRL : usd;
const pre = (m = CS.moeda) => m === "BRL" ? "R$" : "US$";
function grana(x, m = CS.moeda, longo = false) {   // x já na moeda m
  const a = Math.abs(x), p = pre(m);
  if (a < 1e3) return `${p} ${nf(x, 0)}`;
  if (a < 1e6) return `${p} ${sig(x / 1e3)} mil`;
  if (a < 1e9) return `${p} ${sig(x / 1e6)} ${longo ? "milhões" : "mi"}`;
  return `${p} ${sig(x / 1e9)} ${longo ? (a < 2e9 ? "bilhão" : "bilhões") : "bi"}`;
}
const $u = usd => grana(cv(usd));                 // na moeda escolhida
const usd$ = x => grana(x, "USD"), brl$ = usd => grana(usd * PC.BRL, "BRL");
const pct = (x, t) => { const p = x / t * 100; return nf(p, p < 0.1 ? 3 : p < 1 ? 2 : 1) + "%"; };
const refTxt = (x, sym) => `${sym} ${x < 1e6 ? nf(x, 0) : sig(x / 1e6) + " mi"}`;
function grandeHTML(x) {
  const a = Math.abs(x);
  if (a >= 1e9) return `${pre()} ${sig(x / 1e9)}<small> ${a < 2e9 ? "bilhão" : "bilhões"}</small>`;
  if (a >= 1e6) return `${pre()} ${sig(x / 1e6)}<small> milhões</small>`;
  if (a >= 1e3) return `${pre()} ${sig(x / 1e3)}<small> mil</small>`;
  return `${pre()} ${nf(x, 0)}`;
}

/* ── janelas de contas de cada item ── */
const COR_S = { S: "#1D4ED8", F: "#E08A1E" };
const CORES_IT = { elz: "#1E40AF", fv: "#3B82F6", est: "#60A5FA", comp: "#93C5FD", tg: "#C2410C", nd: "#EA580C", forno: "#F97316", trc: "#FB923C", duto: "#FDBA74", vent: "#FED7AA" };
const FONTE_INST = { tg: "Gas Turbine World (2018): 100% do equipamento, já com os indiretos", elz: "IEA (2025): 60% de EPC; 22,5% na proporção 15 : 25 de James et al. (2024)", fv: "IRENA (2025): 15%", trc: "Turton, Exemplo 7.9: materiais 71,4% + mão de obra 63,0%" };
const FONTE_IND = { elz: "IEA (2025): 60% de EPC; 37,5% na proporção 15 : 25 de James et al. (2024)", fv: "IRENA (2025): 21%", trc: "Turton, Exemplo 7.9: frete, despesas de obra e engenharia" };
function passoInstalado(x) {
  const atu = `${x.fx !== 1 ? ` × ${N(x.fx, 4)} US$/£` : ""}${x.ce === PC.CE26 ? "" : ` × ${F(N(PC.CE26, 1), N(x.ce, 1))}`}`, loc = x.orig === "L" ? "" : " × 1,14";
  const L = [sec("Do preço do equipamento ao custo instalado em Tijucas")];
  L.push(passo(`1. ${x.orig === "L" ? "Equipamento, já pelo preço do Brasil" : "Equipamento na origem"}, em US$ de 2026 (CEPCI${x.fx !== 1 ? " e câmbio da libra, média de 2022" : ""}):`,
    `${refTxt(x.eq, x.sym)}${atu} = <b>${usd$(x.m)}</b>`, "CEPCI", "Chemical Engineering"));
  if (x.orig === "I") L.push(passo("2. Importado: impostos, frete, seguro e nacionalização somam 80% do preço do equipamento:", `${usd$(x.m)} × 0,80 = <b>${usd$(x.n)}</b>`, "+80%", "orientação do professor"));
  else if (x.orig === "N") L.push(passo("2. Fabricado no Brasil: fator de localização de 1,14 sobre o equipamento:", `${usd$(x.m)} × 0,14 = <b>${usd$(x.n)}</b>`, "× 1,14", "Towler e Sinnott (2022)"));
  else L.push(passo("2. O preço já é do Brasil (inclui a importação dos módulos e a mão de obra local): sem acréscimo.", `<b>US$ 0</b>`, "preço local", x.fonteP || "IRENA (2025)"));
  if (x.ins) L.push(passo(`3. ${x.id === "tg" ? "Engenharia, construção e demais custos do projeto" : "Instalação"} em Tijucas${loc ? " (mão de obra e materiais no Brasil, × 1,14)" : ""}:`, `${refTxt(x.ins, x.sym)}${atu}${loc} = <b>${usd$(x.o)}</b>`, "instalação", FONTE_INST[x.id] || "NREL (2014): 30% do equipamento"));
  if (x.ind) L.push(passo(`4. Indiretos: engenharia, licenças, preparo do terreno e contingência${loc ? " (× 1,14)" : ""}:`, `${refTxt(x.ind, x.sym)}${atu}${loc} = <b>${usd$(x.p)}</b>`, "indiretos", FONTE_IND[x.id]));
  L.push(passo("Custo instalado em Tijucas:", `${[x.m, x.n, x.o, x.p].filter(v => v > 0).map(usd$).join(" + ")} = <b>${usd$(x.usd)}</b>`, "soma"));
  L.push(passo("Em reais, com o câmbio de 27/10/2026:", `${usd$(x.usd)} × ${N(PC.BRL, 4)} = <b>${brl$(x.usd)}</b>`, "câmbio", "Agrolink (2026)"));
  return L;
}
const avisoFaixa = (fora, nome, min, max, un, n) => fora === "abaixo"
  ? aviso(`Abaixo da faixa da correlação (${nome}: ${min} a ${max} ${un}). Adotado o custo do menor porte da faixa.`)
  : fora === "acima" ? aviso(`Acima da faixa da correlação (${nome}: ${min} a ${max} ${un}). Divididos em ${n} unidades iguais.`) : null;
const CONTAS_C = {
  tg: (k, x) => [sec("Tamanho no local"),
    passo("Potência elétrica média necessária (15,00 MJ<sub>e</sub>/m² da fábrica e dos ventiladores):", `${S("P", "TG")} = ${F(S("E", "e") + " " + S("P"), "86,4")} = ${F("15,00 × " + nf(k.P, 0), "86,4")} = <b>${txt("pot", k.P_TG)}</b>`, "Eq. (51)", "Memorial"),
    passo("A turbina perde potência com o ar quente: cerca de 0,7% por °C acima de 15 °C (ISO). Em Tijucas, o mês mais quente tem média de 25 °C:", `${S("f")} = 1 − 0,007 × (25 − 15) = ${B(k.DER * 100, "%", 1)}`, "ISO 3977-2", "Wärtsilä ([20--?]); INMET/Embrapa Clima Temperado ([20--?])"),
    passo("Potência nominal (ISO) a especificar no catálogo:", `${S("P", "ISO")} = ${F(S("P", "TG"), S("f"))} = ${F(nf(k.P_TG, 0), N(k.DER, 3))} = <b>${txt("pot", k.P_ISO)}</b>`, "condição ISO"),
    sec("Custo de referência (Gas Turbine World, 2018, US$ de 2018, condições ISO)"),
    k.TG ? passo("Menor modelo da tabela de preços com potência ISO igual ou acima da necessária:", `<b>${k.TG[0]}</b>: ${nf(k.TG[1], 0)} kW ISO · rendimento de catálogo ${N(k.TG[3], 1)}% · no verão de Tijucas entrega ${nf(k.TG[1] * k.DER, 0)} kW`, "p. 38", "Gas Turbine World (2018)")
         : passo("A potência passa do maior modelo listado; usa-se a curva de ajuste da revista:", `US$/kW = 9.650 × ${nf(k.P_ISO, 0)}<sup>−0,3</sup> = ${nf(k.TG_PRECO / k.P_ISO, 0)} US$/kW`, "p. 36", "Gas Turbine World (2018)"),
    passo("Preço do conjunto turbina + gerador, só equipamento, na fábrica (inclui controle, filtro de ar, dutos curtos e cabine acústica):", `${S("C", "2018")} = <b>${refTxt(k.TG_PRECO, "US$")}</b> = ${nf(k.TG_PRECO / k.TG_KW, 0)} US$/kW`, "p. 38", "Gas Turbine World (2018)"),
    passo("Engenharia, construção e demais custos do projeto somam de 60% a 100% do equipamento; regra prática da revista: dobrar o preço. Adotado 100%:", `${refTxt(k.TG_E, "US$")} × 1,00 = <b>${refTxt(k.TG_I, "US$")}</b>`, "p. 37", "Gas Turbine World (2018)"),
    ...passoInstalado(x),
    k.F_TG ? aviso("A potência ISO necessária passa do maior modelo listado (25 MW): o preço vem da curva de ajuste da revista.") : null,
    aviso("A versão de 28/10 usava um sistema de cogeração do EPA (2015), com caldeira de recuperação e controle de emissões; por isso a turbina custava quase o dobro. O rendimento de catálogo dos modelos deste porte fica abaixo dos 35% adotados no memorial.")],
  duto: (k, x) => [sec("Tamanho"),
    passo("Potência térmica do queimador de duto (8,39 MJ<sub>t</sub>/m²):", `${S("Q", "duto")} = ${F("8,39 × " + nf(k.P, 0), "86.400")} = <b>${txt("pot", k.Q_DUTO * 1000)}t</b>`, "Eq. (54)", "Memorial"),
    sec("Custo de referência"),
    passo("Custo de converter um queimador de gás natural para só H₂, em libras de 2022:", `2 MW<sub>t</sub> → £ 30.000 · 5 MW<sub>t</sub> → £ 59.000`, "Tabela 2", "Arup (2022)"),
    passo("Expoente de escala entre os dois portes:", `${S("n")} = ${F("ln(59.000 ÷ 30.000)", "ln(5 ÷ 2)")} = ${B(k.n_DUTO, "", 3)}`, "regra de escala"),
    passo("Custo no nosso porte:", `${S("C", "2022")} = £ 30.000 × (${F(N(k.Q_DUTO, 3), "2")})<sup>${N(k.n_DUTO, 3)}</sup> = <b>${refTxt(k.REF_DUTO, "£")}</b>`, "", "Arup (2022)"),
    ...passoInstalado(x),
    k.F_DUTO ? aviso("Porte fora da tabela da Arup (0,5 a 25 MW<sub>t</sub>): a regra de escala é extrapolada.") : null],
  forno: (k, x) => [sec("Tamanho"),
    passo("Potência térmica do forno a H₂ + O₂ (52,00 MJ<sub>t</sub>/m²):", `${S("Q", "F")} = ${F("52,00 × " + nf(k.P, 0), "86.400")} = <b>${txt("pot", k.Q_FOR * 1000)}t</b>`, "Eq. (62)", "Memorial"),
    passo("O forno a rolos tem muitos queimadores pequenos; contam-se grupos de 0,5 MW<sub>t</sub>:", `${S("N", "grupos")} = ${F(N(k.Q_FOR, 2), "0,5")} = ${B(k.N_GR, "grupos", 1)}`, "", "hipótese"),
    sec("Custo de referência"),
    passo("Conversão de cada grupo para H₂ (£ 14.000, porte de 0,5 MW<sub>t</sub>), dobrada para a queima com O₂ puro:", `${S("C", "2022")} = ${N(k.N_GR, 1)} × £ 14.000 × 2 = <b>${refTxt(k.REF_FOR, "£")}</b>`, "Tabela 2", "Arup (2022); fator 2: hipótese"),
    ...passoInstalado(x),
    aviso("Forno a H₂ + O₂ não existe comercialmente: o custo parte da conversão de queimadores a gás para H₂, com o fator 2 de oxicombustão como hipótese do grupo."),
    k.F_FOR ? aviso("Potência menor que um grupo de queimadores: adotado 1 grupo.") : null],
  vent: (k, x) => [sec("Tamanho"),
    passo("Vazão de ar de resfriamento reaproveitado (12,97 MJ<sub>t</sub>/m² a 225 °C):", `ṁ = ${F("12,97 × 1000", "1,05 × (225 − 25)")} × ${F(nf(k.P, 0), "86.400")} = ${B(k.M_AR, "kg/s")}`, "Eq. (36)", "Çengel e Boles (2013)"),
    passo("Massa específica do ar a 225 °C e vazão volumétrica:", `ρ = ${F("101.325", "287,05 × 498,15")} = ${N(k.RHO_AR, 3)} kg/m³ · ${S("V̇")} = ${F(N(k.M_AR), N(k.RHO_AR, 3))} = ${B(k.V_AR, "m³/s")} = ${B(k.CFM, "cfm", 0)}`, "gás ideal"),
    sec("Custo de referência"),
    passo("Ventilador centrífugo de pás para trás, aço carbono, em US$ com CE = 500:", `${S("C", "B")} = exp(11,0757 − 1,12906 ln ${S("Q")} + 0,0886 (ln ${S("Q")})²) = <b>US$ ${nf(k.CB_VENT, 0)}</b>`, "Q em cfm", "Seider et al. (2017)"),
    passo(k.N_VENT === 1 ? "Um ventilador só: a vazão cabe na faixa da correlação (1.000 a 100.000 cfm). Com o fator de carga:" : `${k.N_VENT} ventiladores iguais, porque a vazão passa de 100.000 cfm. Com o fator de carga:`, `${S("C", "P")} = 1,45 × ${nf(k.CB_VENT, 0)} = <b>US$ ${nf(k.REF_VENT, 0)}</b>`, "", "Seider et al. (2017)"),
    ...passoInstalado(x),
    avisoFaixa(k.F_VENT, "vazão", "1.000", "100.000", "cfm", k.N_VENT)],
  trc: (k, x) => [sec("Tamanho"),
    passo("Calor trocado (1,48 MJ<sub>t</sub>/m²):", `${S("Q")} = ${F("1,48 × " + nf(k.P, 0), "86,4")} = ${B(k.Q_TRC, "kW", 1)}`, "Eq. (56)", "Memorial"),
    passo("Contracorrente: exaustão 200 → 188 °C, ar 25 → 150 °C:", `Δ${S("T", "ml")} = ${F("163 − 50", "ln(163 ÷ 50)")} = ${B(k.LMTD, "K", 1)}`, "Eq. (63)"),
    passo("Área de troca, com U = 25 W/(m²·K) para gás-gás:", `${S("A")} = ${F(S("Q"), S("U") + " Δ" + S("T", "ml"))} = ${F(nf(k.Q_TRC * 1000, 0), "25 × " + N(k.LMTD, 1))} = ${B(k.A_TRC, "m²", 1)}`, "", "U: hipótese"),
    sec("Custo de referência (método do módulo de Turton, US$ de 2001)"),
    passo("Custo-base de aquisição: casco e tubos de tubo fixo, aço carbono, pressão ambiente:", `log<sub>10</sub> ${S("C", "B")} = 4,3247 − 0,3030 log<sub>10</sub> ${S("A")} + 0,1634 (log<sub>10</sub> ${S("A")})² → <b>US$ ${nf(k.REF_TRC, 0)}</b>`, "A em m²", "Turton et al. (2012), em Izidoro (2016)"),
    passo("Fator de módulo, com aço carbono e baixa pressão (os dois fatores valem 1):", `${S("F", "mod")} = 1,63 + 1,66 × 1 × 1 = ${B(k.FBM_TRC, "", 2)}`, "Eq. (5.7)", "Izidoro (2016)"),
    passo("O módulo soma ao equipamento a instalação (materiais 71,4% e mão de obra 63,0%) e os indiretos (frete 8,0%, despesas de obra 63,4% e engenharia 23,3%):", `instalação US$ ${nf(x.ins, 0)} · indiretos US$ ${nf(x.ind, 0)} · módulo US$ ${nf(k.REF_TRC * k.FBM_TRC, 0)}`, "Exemplo 7.9", "Turton et al. (2018)"),
    ...passoInstalado(x),
    k.F_TRC === "abaixo" ? aviso("Abaixo da faixa da correlação (área de 10 a 1.000 m²): adotado o custo do menor porte.") : k.F_TRC === "acima" ? aviso("Acima da faixa da correlação (10 a 1.000 m²): custo do porte máximo × (A ÷ 1.000)<sup>0,59</sup>, como nos slides do professor.") : null],
  elz: (k, x) => [sec("Tamanho"),
    passo("Eletricidade da eletrólise por dia (0,544 kg de H₂/m² a 58 kWh/kg):", `${S("E", "dia")} = 0,544 × 58 × ${nf(k.P, 0)} = <b>${txt("eletr", k.E_DIA)}</b>/dia`, "Eq. (71)", "Memorial"),
    passo(`Ligado à rede, o eletrolisador funciona o dia todo, menos na ponta da Celesc (18h30 às 21h30) nos 5 dias úteis: ${N(PC.H_OP, 2)} h por dia na média. Com ${nf(PC.DISP * 100, 0)}% de disponibilidade:`, `${S("P", "ELZ")} = ${F(S("E", "dia"), N(PC.H_OP, 2) + " h × " + N(PC.DISP, 2))} = <b>${txt("pot", k.P_INST)}</b> · fator de capacidade ${nf(k.E_DIA / (k.P_INST * 24) * 100, 0)}%`, "Art. 12; disponibilidade: hipótese", "ANEEL (2026), REH 3.602"),
    aviso("Antes das alterações de 14/11, sem rede nem bateria, o eletrolisador acompanhava o pico do sol (0,72 do campo): 219 MW, trabalhando 18% do tempo (a 30.000 m²/dia). Ligado à rede, ele cai para cerca de um quinto, e o campo vende a sobra do meio-dia (aba Ligação à rede da planilha, seção I)."),
    sec("Custo de referência"),
    passo(`Custo de fabricar e instalar o eletrolisador em 2024, com EPC (escolhido: ${nf(k.pe, 0)} US$/kW). Na China: de 600 a 1.200 US$/kW, valor central de 900. Fora da China: de 2.000 a 2.600, central de 2.300:`, `${S("C", "2024")} = ${nf(k.P_INST, 0)} kW × ${nf(k.pe, 0)} US$/kW = <b>${usd$(k.ELZ_TIC)}</b>`, "p. 9, 99 e 106", "IEA (2025)"),
    passo("Divisão do custo instalado (IEA): cerca de 40% de equipamento (pilha 15–20% + resto da planta 25–30%) e 60% de obra (EPC e contingência), repartidos em 22,5% de instalação e 37,5% de indiretos:", `equipamento ${usd$(x.eq)} · instalação ${usd$(x.ins)} · indiretos ${usd$(x.ind)}`, "p. 27 e 107", "IEA (2025)"),
    ...passoInstalado(x),
    aviso("Segundo a IEA, a obra (EPC e contingência) depende do lugar onde o eletrolisador é instalado. Aqui ela parte do custo chinês × 1,14, por isso o resultado fica abaixo da faixa de 1.500 a 2.400 US$/kW que a IEA dá para um eletrolisador chinês instalado fora da China."),
    sec("Sensibilidade ao preço do eletrolisador"),
    ...PRECOS_ELZ.map(([pe, a, b]) => { const t = custos(k.P, pe, k.fvId); return passo(`${nf(pe, 0)} US$/kW (${a}${b ? " " + b : ""})${pe === k.pe ? " · escolhido" : ""}:`, `eletrolisador ${usd$(t.por.elz.usd)} · total ${pe === k.pe ? `<b>${usd$(t.total)}</b>` : usd$(t.total)}`, "", pe < 1500 ? "IEA (2025), China" : "IEA (2025), fora da China"); }),
    aviso("Adotado o valor da China (900 US$/kW), por indicação do professor. Ele vale para eletrolisador alcalino fabricado e instalado na China; por isso, na precificação o eletrolisador é alcalino (como no memorial; o consumo de 58 kWh/kg é calculado da eficiência de 58% (PCI) que a IEA dá para a China, ou 57,5 kWh/kg, mais a compressão do excedente, arredondado). Para um eletrolisador chinês instalado fora da China, a IEA estima de 1.500 a 2.400 US$/kW; o nosso, com a importação de 80% e o fator Brasil, fica um pouco abaixo dessa faixa.")],
  fv: (k, x) => [sec("Tamanho"),
    passo("Eletricidade da eletrólise por dia:", `${S("E", "dia")} = 0,544 × 58 × ${nf(k.P, 0)} = ${txt("eletr", k.E_DIA)}/dia`, "Eq. (71)", "Memorial"),
    passo(`Leiaute leste-oeste em Santa Catarina, 1.137,5 kWh/kWp por ano. Ligado à rede, nada é cortado: o campo gera a energia do ano mais ${nf(PC.PERDAS * 100, 0)}% de perdas na rede:`, `${S("P", "FV")} = ${F(S("E", "dia") + " × 365 × " + N(1 + PC.PERDAS, 2), "1.137,5")} = <b>${txt("potp", k.P_FV)}</b>`, "Eq. (75); perdas: hipótese", "Memorial"),
    sec("Custo de referência: preço local"),
    k.fvId === "irena" ? passo("Custo total instalado de usinas FV de grande porte no Brasil em 2024 (média ponderada; faixa de 503 a 1.152 US$/kW):", `${S("C", "2024")} = ${nf(k.P_FV, 0)} kWp × 724 US$/kW = <b>${usd$(k.FV_TIC)}</b>`, "Tabela 3.1", "IRENA (2025)")
      : k.fvId === "greener" ? passo("Preço médio de mercado de um sistema de 300 kWp de geração distribuída, em junho de 2026 (R$ 2,40/Wp; no solo, R$ 2,78/Wp), ao câmbio de 27/10/2026:", `${S("C", "2026")} = ${nf(k.P_FV, 0)} kWp × ${F("R$ 2.400", N(PC.BRL, 4))} = ${nf(k.P_FV, 0)} × ${nf(k.C_FV, 0)} US$/kW = <b>${usd$(k.FV_TIC)}</b>`, "Soluções Energéticas Distribuídas", "Greener, em Neves (2026)")
      : passo(`Referência de CAPEX da EPE para usina solar fotovoltaica (R$ ${nf(k.fv.brl, 0)}/kW, data-base de dez/2024, a 6,10 R$/US$):`, `${S("C", "2024")} = ${nf(k.P_FV, 0)} kWp × ${F("R$ " + nf(k.fv.brl, 0), "6,10")} = ${nf(k.P_FV, 0)} × ${nf(k.C_FV, 0)} US$/kW = <b>${usd$(k.FV_TIC)}</b>`, "PDE 2035", "EPE (2025)"),
    passo("Divisão no Brasil: módulos e inversores 33%, estrutura, cabos e subestação 31%, instalação 15%, indiretos 21%:", `equipamento ${usd$(x.eq)} · instalação ${usd$(x.ins)} · indiretos ${usd$(x.ind)}`, "Figura 3.5", "IRENA (2025), lido do gráfico"),
    ...passoInstalado(x),
    sec("Em valores do Brasil"),
    ...PRECOS_FV.map(f => { const t = custos(k.P, k.pe, f.id), rs = t.por.fv.usd / k.P_FV * PC.BRL / 1000; return passo(`${f.nome}${f.id === k.fvId ? " · escolhido" : ""}:`, `${f.brl ? `R$ ${N(f.brl / 1000, 2)}/Wp na fonte · ` : "724 US$/kW na fonte · "}hoje R$ ${N(rs, 2)}/Wp · campo ${usd$(t.por.fv.usd)} · total ${f.id === k.fvId ? `<b>${usd$(t.total)}</b>` : usd$(t.total)}`, "", f.fonte); }),
    aviso("A EPE dá a faixa oficial de usinas solares no Brasil: de R$ 3.000 a R$ 6.000 por kW, com quatro referências. O grupo adotou a mais baixa, R$ 3.000/kW; a média da IRENA para o Brasil cai no meio da faixa. O preço da Greener é de geração distribuída de até 300 kWp: não tem subestação nem linha de conexão, por isso é o piso. A EPE não informa se o kW é de pico ou de corrente alternada; aqui foi aplicado por kWp. “Hoje” é o valor em dólar de 2026 ao câmbio de 27/10/2026 (5,35 R$/US$); a EPE usa 6,10 R$/US$, de dezembro de 2024, por isso os valores dela ficam menores em reais de hoje."),
    aviso("Desde nov/2024 o imposto de importação dos módulos é de 25% (antes, 9,6%), o que a Greener estima em +8% no custo das usinas. Não sabemos quanto disso já está na referência da EPE, de dez/2024.")],
  comp: (k, x) => [sec("Tamanho"),
    passo("Com o eletrolisador cheio, ele faz um pouco mais de H₂ do que a fábrica consome; o excedente enche o estoque, que cobre as horas de ponta:", `${F(nf(k.P_INST, 0) + " kW", "58 kWh/kg")} − ${F("0,544 × " + nf(k.P, 0), "24 h")} = ${N(k.H2_PICO, 0)} − ${N(k.H2_MED, 0)} = ${B(k.H2_EXC, "kg/h", 0)}`, "Eqs. (69) e (73)"),
    passo("Compressão de 30 para 200 bar em 2 estágios com resfriamento intermediário (k = 1,41; η = 0,75):", `${S("w")} = ${F("2 × 1,41", "0,41")} × ${F(S("R") + " " + S("T"), "η")} × [(${F("200", "30")})<sup>0,41/(1,41 × 2)</sup> − 1] = ${B(k.W_COMP, "kWh/kg", 3)}`, "", "Çengel e Boles (2013)"),
    passo("Potência do compressor:", `${S("P", "comp")} = ${N(k.H2_EXC, 0)} × ${N(k.W_COMP, 3)} = ${B(k.P_COMP, "kW", 0)} = ${B(k.HP, "hp", 0)}`, ""),
    sec("Custo de referência"),
    passo("Compressor alternativo com motor elétrico, aço carbono, em US$ com CE = 500:", `${S("C", "B")} = exp(7,9661 + 0,8 ln ${S("P")}) = <b>${usd$(k.REF_COMP)}</b>`, "P em hp", "Seider et al. (2017)"),
    ...passoInstalado(x),
    avisoFaixa(k.F_COMP, "potência", "100", "20.000", "hp", k.N_COMP)],
  est: (k, x) => [sec("Tamanho"),
    passo("Um dia de consumo de H₂:", `${S("m", "est")} = 0,544 × ${nf(k.P, 0)} × 1 dia = <b>${txt("massa", k.M_EST)}</b>`, "Eqs. (64) e (69)", "Memorial"),
    sec("Custo de referência"),
    passo("Vasos de aço de baixa pressão, em US$ de 2007:", `${S("C", "2007")} = ${nf(k.M_EST, 0)} kg × 635 US$/kg = <b>${usd$(k.REF_EST)}</b>`, "", "NREL (2014)"),
    ...passoInstalado(x)],
  nd: (k, x, r) => [sec("Itens não detalhados"),
    passo("Dutos, tubulações de H₂ e O₂, válvulas e instrumentação, como 15% do custo instalado dos itens 1 a 5 da fábrica:", `${S("C", "nd")} = 0,15 × (${["tg", "duto", "forno", "vent", "trc"].map(id => usd$(r.por[id].usd).replace("US$ ", "")).join(" + ")}) = <b>${usd$(x.usd)}</b>`, "", "hipótese do grupo"),
    passo("Em reais, com o câmbio de 27/10/2026:", `${usd$(x.usd)} × ${N(PC.BRL, 4)} = <b>${brl$(x.usd)}</b>`, "câmbio", "Agrolink (2026)")],
};
const ORIGEM_C = "Estimativa de ordem de grandeza por base teórica (classe 5 da AACE): custo por kW, regra de escala e correlações de projeto, atualizados para 2026 pelo CEPCI (média de 2025), com importação de 80% (orientação do professor), instalação e indiretos em Tijucas (fator de localização 1,14, Towler e Sinnott, 2022) e câmbio de 27/10/2026. A turbina usa o preço de catálogo do Gas Turbine World (2018) e o trocador, o método do módulo de Turton, dos arquivos enviados pelo professor. Mesmas premissas da planilha de precificação do grupo (versão 3, de 10/11); as capacidades vêm do memorial de cálculo.";
ITC.forEach(d => {
  GLOB["c_" + d.id] = {
    ey: `Custos · item ${d.n} · ${d.sis === "S" ? "sistema à parte" : "fábrica"}`, nome: d.curto, desc: d.desc, origem: ORIGEM_C,
    contas: () => { const r = RC(), x = r.por[d.id]; return CONTAS_C[d.id](r.k, x, r).filter(Boolean); },
    dia: () => {
      const r = RC(), x = r.por[d.id], u = d.unid && d.unid(r.k);
      return [["tamanho", d.cap(r.k)], ["custo instalado em Tijucas", `${usd$(x.usd)} · ${brl$(x.usd)}`], ["participação no total", pct(x.usd, r.total)], ["origem", x.orig ? ORIG_TXT[x.orig] : "instalado"],
        ...(u ? [[`custo por ${u[1]}`, `US$ ${nf(x.usd / u[0], x.usd / u[0] < 100 ? 1 : 0)}/${u[1]}`]] : [["base", "itens 1 a 5"]])];
    },
  };
});
GLOB.c_total = {
  ey: "Custos", nome: "Investimento do ciclo proposto", desc: "Soma dos dez itens da planilha, instalados em Tijucas (SC), em dólar de 2026.", origem: ORIGEM_C,
  contas: () => {
    const r = RC(), k = r.k, fabIt = r.it.filter(x => x.sis === "F"), sisIt = r.it.filter(x => x.sis === "S");
    return [sec("Fábrica"), ...fabIt.map(x => passo(`${x.n}. ${x.curto}`, `${usd$(x.usd)}`, pct(x.usd, r.total), x.fonte)),
      passo("Total da fábrica:", `<b>${usd$(r.fab)}</b> · ${brl$(r.fab)}`, pct(r.fab, r.total)),
      sec("Sistema à parte (H₂ verde)"), ...sisIt.map(x => passo(`${x.n}. ${x.curto}`, `${usd$(x.usd)}`, pct(x.usd, r.total), x.fonte)),
      passo("Total do sistema à parte:", `<b>${usd$(r.sis)}</b> · ${brl$(r.sis)}`, pct(r.sis, r.total)),
      sec("Total"), passo("Investimento instalado em Tijucas:", `${usd$(r.fab)} + ${usd$(r.sis)} = <b>${usd$(r.total)}</b> = <b>${brl$(r.total)}</b>`, "", `câmbio R$ ${N(PC.BRL, 4)}`),
      sec("Do preço na origem ao custo em Tijucas"),
      passo("1. Equipamentos na origem (itens 1 a 9), em US$ de 2026:", `<b>${usd$(r.cad.m)}</b>`, pct(r.cad.m, r.total), "CEPCI"),
      passo("2. Importação (+80%) e fabricação no Brasil (× 1,14):", `<b>${usd$(r.cad.n)}</b>`, pct(r.cad.n, r.total), "professor; Towler e Sinnott (2022)"),
      passo("3. Instalação em Tijucas:", `<b>${usd$(r.cad.o)}</b>`, pct(r.cad.o, r.total)),
      passo("4. Indiretos (engenharia, licenças, terreno, contingência):", `<b>${usd$(r.cad.p)}</b>`, pct(r.cad.p, r.total)),
      passo("5. Dutos e tubulações (item 10):", `<b>${usd$(r.cad.nd)}</b>`, pct(r.cad.nd, r.total), "hipótese do grupo"),
      sec("Sensibilidade à importação"),
      ...[0, 0.4, 0.8, 0.87].map(f => { const imp = r.it.filter(x => x.orig === "I"), dI = imp.reduce((a, x) => a + x.m * (x.sis === "F" ? 1 + PC.F_ND : 1), 0); return passo(`Acréscimo de ${nf(f * 100, 0)}% sobre o importado${f === PC.F_IMP ? " (adotado)" : f === 0.4 ? " (ex-tarifário, hipótese)" : f === 0.87 ? " (Izidoro, 2016: taxas da Receita Federal)" : ""}:`, f === PC.F_IMP ? `<b>${usd$(r.total)}</b>` : usd$(r.total + (f - PC.F_IMP) * dI), ""); }),
      sec("Comparação com as versões anteriores (a 30.000 m²/dia)"),
      passo("Versão de 27/10, antes do feedback (sem importação, sem instalação separada, FV pela média mundial):", `US$ 773 mi → ${usd$(r.total)} (${(r.total / 773451869.19 - 1) >= 0 ? "+" : ""}${nf((r.total / 773451869.19 - 1) * 100, 0)}%)`, "comparação"),
      passo("Versão de 28/10 (turbina pelo sistema de cogeração do EPA, trocador por Seider e Guthrie, FV pela média da IRENA):", `US$ 1.088 mi → ${usd$(r.total)} (${(r.total / 1087643398.52 - 1) >= 0 ? "+" : ""}${nf((r.total / 1087643398.52 - 1) * 100, 1)}%)`, "comparação"),
      passo("Versão de 10/11 (eletrolisador pelo valor de fora da China, 2.300 US$/kW):", `US$ 1.002 mi → ${usd$(r.total)} (${(r.total / 1001979813.91 - 1) >= 0 ? "+" : ""}${nf((r.total / 1001979813.91 - 1) * 100, 1)}%)`, "comparação"),
      passo("1ª versão de 14/11 (China, eletrolisador do tamanho do pico do campo):", `US$ 524 mi → ${usd$(r.total)} (${(r.total / 524192006.5 - 1) >= 0 ? "+" : ""}${nf((r.total / 524192006.5 - 1) * 100, 1)}%)`, "comparação"),
      passo("2ª versão de 14/11 (eletrolisador ilhado no campo, 0,41 do campo, sem rede):", `US$ 454 mi → ${usd$(r.total)} (${(r.total / 454388599.76 - 1) >= 0 ? "+" : ""}${nf((r.total / 454388599.76 - 1) * 100, 1)}%)`, "comparação"),
      passo("3ª versão de 14/11 (ligada à rede; eletrolisador dividido 60/15/25, de James et al.):", `US$ 278 mi → ${usd$(r.total)} (${(r.total / 278332137.24 - 1) >= 0 ? "+" : ""}${nf((r.total / 278332137.24 - 1) * 100, 1)}%)`, "comparação"),
      aviso("Ligado à rede, o investimento cai, mas entra um custo anual de uso da rede (tarifa da Celesc e acerto na CCEE), que está na análise econômica abaixo."),
      sec("Indicadores"),
      passo("Por m²/dia de capacidade:", `${F(usd$(r.total), nf(k.P, 0) + " m²/dia")} = <b>${grana(r.total / k.P, "USD")}</b> por m²/dia`, ""),
      passo("Fábrica por kW elétrico entregue no local:", `${F(usd$(r.fab), nf(k.P_TG, 0) + " kW")} = <b>US$ ${nf(r.fab / k.P_TG, 0)}/kW</b>`, ""),
      sec("Precisão"),
      passo("Estimativa classe 5 da AACE: o valor real pode ficar até 50% abaixo ou até 100% acima.", `${usd$(r.total * 0.5)} a ${usd$(r.total * 2)}`, "AACE 18R-97"),
      aviso("Não incluídos: compra do terreno, juros durante a obra, subestação e linha de conexão à rede e o estoque de O₂ para a ponta (cerca de 13 t em 3 h na escala de 30.000 m²/dia). Ventilador e compressor seguem nas correlações de Seider: os arquivos do professor não trazem o fator de módulo de Turton para eles.")];
  },
  dia: () => { const r = RC(); return [["total", `${usd$(r.total)} · ${brl$(r.total)}`], ["sistema à parte", `${usd$(r.sis)} · ${pct(r.sis, r.total)}`], ["fábrica", `${usd$(r.fab)} · ${pct(r.fab, r.total)}`]]; },
};

/* ═══════════════════════ desenho: sistema à parte + planta com etiquetas ═══════════════════════ */
function faixaSVG() {
  let tendas = "";
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
    const x = 790 + c * 44 + (r % 2) * 22, y = 92 + r * 26;
    tendas += `<path d="M${x} ${y + 16} L${x + 20} ${y + 4} V${y + 16} Z" fill="#3B74C4"/><path d="M${x + 20} ${y + 4} L${x + 40} ${y + 16} H${x + 20} Z" fill="#1E4E8C"/>`;
  }
  let placas = "";
  for (let i = 0; i < 18; i++) placas += `<rect x="${410 + i * 11.2}" y="92" width="7" height="76" rx="1.5" fill="${i % 2 ? "#E2E8EE" : "#C9D3DC"}"/>`;
  const raios = [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return `<path d="M${1352 + 26 * Math.cos(r)} ${44 + 26 * Math.sin(r)} L${1352 + 34 * Math.cos(r)} ${44 + 34 * Math.sin(r)}"/>`; }).join("");
  return `<svg class="faixa-c" id="faixa-c" viewBox="0 -40 1400 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sistema à parte: campo fotovoltaico, eletrolisador e compressor">
  <g data-c="fv" class="eq-c">
    <g stroke="#F5B544" stroke-width="3" stroke-linecap="round">${raios}</g><circle cx="1352" cy="44" r="18" fill="#FBBF24"/>
    <path d="M780 190 H1360" stroke="#B6C0C9" stroke-width="2"/>${tendas}
    <text x="1075" y="214" text-anchor="middle" class="rotulo">Campo fotovoltaico leste-oeste</text>
    <text x="1075" y="231" text-anchor="middle" class="rotulo-p">placas a 10°, fileiras quase coladas</text>
  </g>
  <g fill="none"><path d="M786 130 H624" stroke="#1D4ED8" stroke-width="3"/><path class="fluxo-el" d="M786 130 H624" stroke="#C7D7FE" stroke-width="1.6"/></g>
  <text x="705" y="121" text-anchor="middle" font-size="11" font-weight="600" fill="#1D4ED8">eletricidade</text>
  <g data-c="elz" class="eq-c">
    <rect x="392" y="78" width="230" height="104" rx="12" fill="url(#gAco)" stroke="#3E4A55" stroke-width="2.4"/>${placas}
    <rect x="400" y="88" width="8" height="84" rx="2" fill="#3E4A55"/><rect x="606" y="88" width="8" height="84" rx="2" fill="#3E4A55"/>
    <text x="507" y="206" text-anchor="middle" class="rotulo">Eletrolisador alcalino</text>
    <text x="507" y="223" text-anchor="middle" class="rotulo-p">H₂ e O₂ a 30 bar</text>
  </g>
  <g fill="none" stroke-linejoin="round">
    <path d="M392 104 H282" stroke="#C0392B" stroke-width="5"/><path class="fluxo" d="M392 104 H282" stroke="#FFD6D0" stroke-width="1.6"/>
    <path d="M218 104 H100 V232" stroke="#C0392B" stroke-width="5"/><path class="fluxo" d="M218 104 H100 V232" stroke="#FFD6D0" stroke-width="1.6"/>
    <path d="M420 182 V200 H168 V232" stroke="#4FA3D9" stroke-width="5"/><path class="fluxo" d="M420 182 V200 H168 V232" stroke="#FFFFFF" stroke-width="1.4"/>
  </g>
  <path d="M93 226 L100 238 L107 226 Z M161 226 L168 238 L175 226 Z" fill="#3E4A55"/>
  <text x="108" y="160" font-size="11" font-weight="600" fill="#C0392B">H₂</text><text x="176" y="194" font-size="11" font-weight="600" fill="#2F7FB5">O₂</text>
  <g data-c="comp" class="eq-c">
    <circle cx="250" cy="104" r="32" fill="url(#gAco)" stroke="#3E4A55" stroke-width="2.4"/>
    <path d="M232 86 L270 96 V112 L232 122 Z" fill="none" stroke="#3E4A55" stroke-width="2"/>
    <text x="250" y="156" text-anchor="middle" class="rotulo">Compressor</text>
    <text x="250" y="172" text-anchor="middle" class="rotulo-p">30 → 200 bar</text>
  </g>
</svg>`;
}
// âncoras das etiquetas: coordenadas do desenho (viewBox) e lado em que a etiqueta fica
const ANC = {
  fv: { s: "f", x: 1075, y: 86, lado: "top" }, elz: { s: "f", x: 507, y: 76, lado: "top" }, comp: { s: "f", x: 250, y: 70, lado: "top" },
  est: { s: "p", x: 118, y: 204, lado: "bottom" }, tg: { s: "p", x: 788, y: 150, lado: "right" }, duto: { s: "p", x: 972, y: 278, lado: "left" },
  forno: { s: "p", x: 592, y: 702, lado: "top" }, vent: { s: "p", x: 430, y: 640, lado: "left" }, trc: { s: "p", x: 894, y: 625, lado: "right" },
};
const DESTAQUE = { tg: '[data-id="tg"]', duto: '[data-id="s5"]', forno: '[data-id="s10"]', vent: '.tubo[data-k="s10 s5 s8 ar"]', trc: '[data-id="trc"]', est: '[data-id="h2t"]' };

const desenhoC = $("#desenho-c"), cardC = $("#custo-card"), cartaoC = $("#cartao-c");
desenhoC.insertAdjacentHTML("beforeend", faixaSVG() + `<div class="fronteira"><span>↑ sistema à parte · fora do balanço</span><span>fábrica · gate-to-gate ↓</span></div>`);
const plantaC = planta.cloneNode(true);
plantaC.id = "planta-c"; plantaC.classList.remove("foco", "modo0"); plantaC.classList.add("custo");
plantaC.setAttribute("aria-label", "Planta do ciclo proposto com o custo dos equipamentos");
$$(".on", plantaC).forEach(e => e.classList.remove("on"));
$$("[tabindex]", plantaC).forEach(e => e.removeAttribute("tabindex"));
desenhoC.appendChild(plantaC);
const faixaC = $("#faixa-c");
// etiquetas e pinos
ITC.forEach(d => {
  if (!ANC[d.id]) return;
  desenhoC.insertAdjacentHTML("beforeend", `<i class="pino ${d.sis === "S" ? "s" : "f"}" data-c="${d.id}"></i><button class="etq ${d.sis === "S" ? "s" : "f"}" data-c="${d.id}" data-abre="c_${d.id}"><span class="nm">${d.curto}</span><span class="lv"><b class="vl"></b><span class="pc"></span></span></button>`);
});
function posicionaEtiquetas() {
  const w = desenhoC.getBoundingClientRect(), rects = { f: faixaC.getBoundingClientRect(), p: plantaC.getBoundingClientRect() }, vb = { f: [-40, 280], p: [0, 940] };   // [y mínimo, altura] de cada viewBox
  const TR = { top: "translate(-50%, calc(-100% - 12px))", bottom: "translate(-50%, 12px)", left: "translate(calc(-100% - 12px), -50%)", right: "translate(12px, -50%)" };
  Object.entries(ANC).forEach(([id, a]) => {
    const r = rects[a.s], x = r.left - w.left + a.x * r.width / 1400, y = r.top - w.top + (a.y - vb[a.s][0]) * r.height / vb[a.s][1];
    const t = $(`.etq[data-c="${id}"]`, desenhoC), p = $(`.pino[data-c="${id}"]`, desenhoC);
    t.style.left = p.style.left = x + "px"; t.style.top = p.style.top = y + "px"; t.style.transform = TR[a.lado];
  });
}
new ResizeObserver(posicionaEtiquetas).observe(desenhoC);

/* ── cartão do hover ── */
let cartaoCAtual = null, timerC = null;
function preencheCartaoC(id) {
  const r = RC(), x = r.por[id], d = ITC.find(e => e.id === id);
  cartaoC.innerHTML = `<div class="topo"><div class="n" style="background:${COR_S[d.sis]}">${d.n}</div><h4>${d.curto}</h4></div><p class="desc">${d.desc}</p>
    <div class="bloco"><b>Custo instalado em Tijucas · 2026</b>
      <div class="linha"><span><i style="background:${CORES_IT[id]}"></i>valor instalado</span><a class="clic" data-abre="c_${id}">${$u(x.usd)}</a></div>
      <div class="linha"><span>participação no total</span><a class="clic" data-abre="c_${id}">${pct(x.usd, r.total)}</a></div>
      <div class="dia">${CS.moeda === "USD" ? brl$(x.usd) : usd$(x.usd)} · ${d.sis === "S" ? "sistema à parte" : "fábrica"}</div></div>
    ${x.eq === undefined ? "" : `<div class="bloco"><b>Até Tijucas · ${ORIG_TXT[x.orig]}</b>
      <div class="linha"><span>${x.orig === "L" ? "equipamento (preço no Brasil)" : "equipamento na origem"}</span><a class="clic" data-abre="c_${id}">${$u(x.m)}</a></div>
      ${x.n ? `<div class="linha"><span>${x.orig === "I" ? "importação (+80%)" : "fabricação no Brasil (× 1,14)"}</span><a class="clic" data-abre="c_${id}">${$u(x.n)}</a></div>` : ""}
      ${x.o ? `<div class="linha"><span>instalação</span><a class="clic" data-abre="c_${id}">${$u(x.o)}</a></div>` : ""}
      ${x.p ? `<div class="linha"><span>indiretos</span><a class="clic" data-abre="c_${id}">${$u(x.p)}</a></div>` : ""}</div>`}
    <div class="bloco"><b>Tamanho</b><div class="linha"><span>na produção escolhida</span><a class="clic" data-abre="c_${id}">${d.cap(r.k)}</a></div></div>
    <div class="bloco"><b>Base de custo</b><div class="cond"><span>${d.metodo}</span><span>${d.fonte}</span><span>${x.sym} de ${x.ano}</span></div></div>
    <div class="vercontas"><em>clique para ver as contas</em><a data-abre="c_${id}">Ver as contas ›</a></div>`;
}
function posicionaCartaoC(el) {
  const r = el.getBoundingClientRect(), c = cardC.getBoundingClientRect(), w = cartaoC.offsetWidth, h = cartaoC.offsetHeight;
  let x = r.right - c.left + 14, y = r.top - c.top + r.height / 2 - h / 2;
  if (x + w > c.width - 8) x = r.left - c.left - w - 14;
  if (x < 8) { x = Math.max(8, Math.min(c.width - w - 8, r.left - c.left + r.width / 2 - w / 2)); y = r.bottom - c.top + 12; }
  y = Math.max(8, Math.min(c.height - h - 8, y));
  cartaoC.style.left = x + "px"; cartaoC.style.top = y + "px";
}
function focaC(id, el) {
  clearTimeout(timerC); cartaoCAtual = id;
  desenhoC.classList.add("foco");
  $$(".etq,.pino", desenhoC).forEach(e => e.classList.toggle("on", e.dataset.c === id));
  const naPlanta = DESTAQUE[id];
  plantaC.classList.toggle("foco", !!naPlanta); faixaC.classList.toggle("foco", !naPlanta);
  $$(".on", plantaC).forEach(e => e.classList.remove("on"));
  if (naPlanta) $$(naPlanta, plantaC).forEach(e => e.classList.add("on"));
  if (id === "tg") $$(".tubo", plantaC).forEach(t => t.classList.toggle("on", (t.dataset.k || "").split(" ").includes("tg")));
  $$(".eq-c", faixaC).forEach(g => g.classList.toggle("on", g.dataset.c === id));
  preencheCartaoC(id); posicionaCartaoC(el || $(`.etq[data-c="${id}"]`, desenhoC)); cartaoC.classList.add("ver");
}
function desfocaC() {
  cartaoCAtual = null; desenhoC.classList.remove("foco"); plantaC.classList.remove("foco"); faixaC.classList.remove("foco");
  $$(".on", desenhoC).forEach(e => e.classList.remove("on")); cartaoC.classList.remove("ver");
}
$$(".etq", desenhoC).forEach(t => {
  t.addEventListener("pointerenter", ev => { if (ev.pointerType !== "touch") focaC(t.dataset.c, t); });
  t.addEventListener("pointerleave", () => { timerC = setTimeout(desfocaC, 240); });
  t.addEventListener("focus", () => focaC(t.dataset.c, t));
  t.addEventListener("blur", () => { timerC = setTimeout(desfocaC, 240); });
  t.addEventListener("click", () => desfocaC());
});
cartaoC.addEventListener("pointerenter", () => clearTimeout(timerC));
cartaoC.addEventListener("pointerleave", () => { timerC = setTimeout(desfocaC, 240); });

/* ── barra de divisão, tabela e números ── */
const ORDEM_BARRA = ["elz", "fv", "est", "comp", "tg", "nd", "forno", "trc", "duto", "vent"];
$("#trilho-c").innerHTML = ORDEM_BARRA.map(id => `<div data-c="${id}" data-abre="c_${id}" style="background:${CORES_IT[id]}" title=""></div>`).join("");
const ORDEM_TAB = ["elz", "fv", "est", "comp", "tg", "nd", "forno", "trc", "duto", "vent"];
$("#tc-corpo").innerHTML =
  `<tr class="grp"><td colspan="5"><i style="background:${COR_S.S}"></i>Sistema à parte · H₂ verde</td></tr>` +
  ORDEM_TAB.filter(id => ITC.find(d => d.id === id).sis === "S").map(linhaTab).join("") +
  `<tr class="sub" data-abre="c_total"><td></td><td>Total do sistema à parte</td><td></td><td class="v" id="tc-sis"></td><td class="bar"><em id="tc-sisp"></em></td></tr>` +
  `<tr class="grp"><td colspan="5"><i style="background:${COR_S.F}"></i>Fábrica</td></tr>` +
  ORDEM_TAB.filter(id => ITC.find(d => d.id === id).sis === "F").map(linhaTab).join("") +
  `<tr class="sub" data-abre="c_total"><td></td><td>Total da fábrica</td><td></td><td class="v" id="tc-fab"></td><td class="bar"><em id="tc-fabp"></em></td></tr>` +
  `<tr class="tot" data-abre="c_total"><td></td><td>Total geral</td><td></td><td class="v" id="tc-tot"></td><td class="bar"><em>100%</em></td></tr>`;
function linhaTab(id) {
  const d = ITC.find(e => e.id === id);
  return `<tr data-c="${id}" data-abre="c_${id}"><td class="n">${d.n}</td><td class="nm"><b>${d.curto}</b><small>${d.metodo} · ${d.fonte}</small><span class="orig"></span></td><td class="cap"></td><td class="v"></td><td class="bar"><span style="--c:${CORES_IT[id]}"></span><em></em></td></tr>`;
}

/* ── barra da cadeia: do preço na origem ao custo em Tijucas ── */
const CAD = [["m", "equipamento na origem", "#94A3B8"], ["n", "importação e fabricação no Brasil", "#F87171"], ["o", "instalação", "#FBBF24"], ["p", "indiretos", "#C084FC"], ["nd", "dutos e tubulações", "#FB923C"]];
$("#trilho-cad").innerHTML = CAD.map(([c_, nome, cor]) => `<div data-abre="c_total" style="background:${cor}" title=""></div>`).join("");
$("#leg-cad").innerHTML = CAD.map(([c_, nome, cor]) => `<div data-abre="c_total"><i style="background:${cor}"></i>${nome}<b data-cad="${c_}"></b></div>`).join("");
function atualizaCadeia(r) {
  $$("#trilho-cad div").forEach((s_, i) => { const v = r.cad[CAD[i][0]]; s_.style.width = (v / r.total * 100) + "%"; s_.title = `${CAD[i][1]}: ${$u(v)} (${pct(v, r.total)})`; });
  $$("#leg-cad b").forEach(b => { const v = r.cad[b.dataset.cad]; b.innerHTML = `${$u(v)} <em>${pct(v, r.total)}</em>`; });
}

/* ═══════════════════════ análise econômica ═══════════════════════ */
// Mesmas premissas da aba "Análise econômica" da planilha: o ciclo proposto contra o ciclo 0, em termos reais.
const PE = { DIAS: 365, GN0: 2.941, GN1: 1.058, EL0: 4.00, CO2_0: 6.08, CO2_1: 2.13, P_GN: 3.1667, P_EL: 600, TAXA: 0.08, VIDA: 25, OM_FV: 60, OM_RESTO: 0.015, DEPR: 0.04, IRCS: 0.34 };
function tirUniforme(inv, fluxo, n) {   // taxa que zera −investimento + fluxo × Σ (1 + r)^−t
  if (fluxo <= 0) return null;
  const f = r => { let s = 0; for (let t = 1; t <= n; t++) s += fluxo / Math.pow(1 + r, t); return s - inv; };
  let lo = -0.9, hi = 1;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function econ(r, gas = 1) {
  const e = PE, k = r.k, x = {}, c = PC;
  x.prod = k.P * e.DIAS; x.gn = (e.GN0 - e.GN1) * x.prod; x.ecGn = x.gn * e.P_GN * gas / PC.BRL;
  x.el = e.EL0 * x.prod / 1000; x.ecEl = x.el * e.P_EL / PC.BRL; x.ec = x.ecGn + x.ecEl;
  x.omFv = k.P_FV * e.OM_FV / PC.FX_EPE; x.omR = e.OM_RESTO * (r.total - r.por.fv.usd);
  // uso da rede (aba Ligação à rede da planilha): demanda fora da ponta, parcela de energia, tarifa da usina e acerto na CCEE
  x.eAno = k.E_DIA * e.DIAS / 1000; x.musd = c.PICO_H * k.P_FV;
  x.rdDem = k.P_INST * c.TUSD_FP * 12; x.rdEn = x.eAno * c.TUSD_E; x.rdUs = x.musd * c.TUSDG * 12; x.rdPld = x.eAno * c.K_PLD;
  x.rede = (x.rdDem + x.rdEn + x.rdUs + x.rdPld) / PC.BRL; x.om = x.omFv + x.omR + x.rede;
  x.fluxo = x.ec - x.om; x.inv = r.total;
  x.frc = e.TAXA * Math.pow(1 + e.TAXA, e.VIDA) / (Math.pow(1 + e.TAXA, e.VIDA) - 1);
  x.cap = x.inv * x.frc; x.vpl = -x.inv + x.fluxo / x.frc; x.vau = x.fluxo - x.cap;
  x.payb = x.fluxo > 0 ? x.inv / x.fluxo : null; x.tir = tirUniforme(x.inv, x.fluxo, e.VIDA);
  x.il = (x.fluxo / x.frc) / x.inv; x.rec = Math.max(0, x.fluxo) * e.VIDA / x.inv; x.invEq = Math.max(0, x.fluxo) / x.frc;
  x.co2 = (e.CO2_0 - e.CO2_1) * x.prod / 1000; x.abat = -x.vau / x.co2; x.m2 = -x.vau / x.prod;
  x.h2 = PC.H2 * x.prod; x.omSis = x.omFv + e.OM_RESTO * (r.sis - r.por.fv.usd) + x.rede; x.lcoh = (r.sis * x.frc + x.omSis) / x.h2;
  x.fu = k.E_DIA / (k.P_INST * 24);
  x.gnEq = (x.cap + x.om - x.ecEl) * PC.BRL / x.gn;
  // depois de impostos: depreciação linear e IR + CSLL, numa fábrica lucrativa que abate o resultado do projeto
  x.dep = x.inv * e.DEPR; x.imp = (x.fluxo - x.dep) * e.IRCS; x.fli = x.fluxo - x.imp;
  x.vpli = -x.inv + x.fli / x.frc; x.tiri = tirUniforme(x.inv, x.fli, e.VIDA); x.payi = x.fli > 0 ? x.inv / x.fli : null;
  return x;
}
const taxaTxt = t => t === null ? "não existe" : `${t < 0 ? "−" : ""}${nf(Math.abs(t) * 100, 1)}%`;
const taxaAno = t => t === null ? "não existe" : `${taxaTxt(t)} ao ano`;
const anosTxt = a => a === null ? "não há" : `${nf(a, a < 20 ? 1 : 0)} anos`;
const negU = v => `${v < 0 ? "− " : ""}${$u(Math.abs(v))}`, negUsd = v => `${v < 0 ? "− " : ""}${usd$(Math.abs(v))}`;
const porUn = (usd, un, d = 0) => `${pre()} ${nf(cv(usd), d)}${un}`;
const CARTOES_E = [
  ["economia por ano", x => $u(x.ec), x => "gás natural e eletricidade que a fábrica deixa de comprar"],
  ["operação, manutenção e rede", x => $u(x.om), x => `por ano (rede: ${$u(x.rede)}); sobram ${$u(x.fluxo)}`],
  ["valor presente líquido", x => negU(x.vpl), x => `a ${nf(PE.TAXA * 100, 0)}% ao ano, em ${PE.VIDA} anos`],
  ["taxa interna de retorno", x => taxaAno(x.tir), x => `depois de impostos: ${taxaAno(x.tiri)}`],
  ["tempo de retorno", x => anosTxt(x.payb), x => `simples; em ${PE.VIDA} anos volta ${nf(x.rec * 100, 1)}% do investimento`],
  ["custo do hidrogênio", x => porUn(x.lcoh, "/kg", 2), x => `ligado à rede, o eletrolisador trabalha ${nf(x.fu * 100, 0)}% do tempo`],
  ["custo de evitar 1 t de CO₂", x => porUn(x.abat, ""), x => `${nf(x.co2, 0)} t de CO₂ evitadas por ano`],
  ["a mais por m² de porcelanato", x => porUn(x.m2, "", 2), x => "custo líquido anual ÷ produção"],
];
$("#econ-grade").innerHTML = CARTOES_E.map(([rot], i) => `<div data-abre="c_econ" data-e="${i}"><span>${rot}</span><b></b><small></small></div>`).join("");
function atualizaEcon(r) {
  const x = econ(r);
  $$("#econ-grade > div").forEach(d => { const c_ = CARTOES_E[+d.dataset.e]; $("b", d).textContent = c_[1](x); $("small", d).textContent = c_[2](x); });
}
GLOB.c_econ = {
  ey: "Custos · análise econômica", nome: "O investimento se paga?", desc: "Compara o investimento com o que a fábrica deixa de comprar de gás natural e de eletricidade, pelos critérios do capítulo 19 enviado pelo professor.",
  origem: "Valor presente líquido, valor anual uniforme, taxa interna de retorno e tempo de retorno, como em Lora e Nascimento (2004, cap. 19). Em termos reais, a 8% ao ano e 25 anos (EPE, 2025). Os preços do gás (tabela de matéria-prima da SCGÁS de 01/07/2026) e da eletricidade (R$ 600/MWh, sem fonte direta) são hipóteses do grupo. Mesmos números da aba Análise econômica da planilha.",
  contas: () => {
    const r = RC(), x = econ(r), g2 = econ(r, 2), g3 = econ(r, 3), e = PE;
    return [sec("O que a fábrica deixa de comprar por ano"),
      passo("Gás natural economizado, do ciclo 0 para o proposto:", `(2,941 − 1,058) m³/m² × ${nf(x.prod, 0)} m²/ano = ${B(x.gn / 1e6, "milhões de m³", 1)} × R$ ${N(e.P_GN, 2)}/m³ = <b>${usd$(x.ecGn)}</b>`, "preço: hipótese", "SCGÁS (2026)"),
      passo("Eletricidade da rede evitada (a turbina gera tudo):", `4,00 kWh/m² × ${nf(x.prod, 0)} m²/ano = ${B(x.el / 1000, "GWh", 1)} × R$ ${nf(e.P_EL, 0)}/MWh = <b>${usd$(x.ecEl)}</b>`, "preço: hipótese"),
      passo("Economia total:", `${usd$(x.ecGn)} + ${usd$(x.ecEl)} = <b>${usd$(x.ec)}</b> por ano`, ""),
      sec("Operação e manutenção por ano"),
      passo("Campo fotovoltaico, a R$ 60 por kW ao ano:", `${nf(r.k.P_FV, 0)} kWp × ${F("R$ 60", "6,10")} = <b>${usd$(x.omFv)}</b>`, "PDE 2035", "EPE (2025)"),
      passo("Demais equipamentos, a 1,5% do investimento ao ano:", `0,015 × (${usd$(r.total)} − ${usd$(r.por.fv.usd)}) = <b>${usd$(x.omR)}</b>`, "Tabela 19.8", "Lora e Nascimento (2004); hipótese"),
      sec("Uso da rede por ano (autoprodução na Celesc)"),
      passo("Demanda do eletrolisador fora da ponta (ele para na ponta, então não contrata demanda de ponta):", `${nf(r.k.P_INST, 0)} kW × R$ ${N(PC.TUSD_FP, 2)} × 12 = ${brl$(x.rdDem / PC.BRL)}`, "Tabela 1, p. 5 (A2 azul APE)", "ANEEL (2026), REH 3.602"),
      passo("Parcela de energia da tarifa de uso (a energia vem do próprio campo, sem TE):", `${nf(x.eAno, 0)} MWh × R$ ${N(PC.TUSD_E, 2)} = ${brl$(x.rdEn / PC.BRL)}`, "Tabela 1, p. 5", "ANEEL (2026), REH 3.602"),
      passo("Tarifa de uso da rede pela usina, sobre a potência de injeção (pico de uma hora × campo):", `${nf(x.musd, 0)} kW × R$ ${N(PC.TUSDG, 2)} × 12 = ${brl$(x.rdUs / PC.BRL)}`, "Tabela 1, p. 6; hipótese", "ANEEL (2026), REH 3.602"),
      passo("Acerto na CCEE: o campo vende ao preço da hora em que gera e o eletrolisador compra ao preço da hora em que consome (PLD do Sul, média de 2024 e 2025):", `${nf(x.eAno, 0)} MWh × R$ ${N(PC.K_PLD, 2)} = ${brl$(x.rdPld / PC.BRL)}`, "PLD horário", "CCEE (2026), Dados Abertos"),
      passo("Uso da rede por ano:", `<b>${usd$(x.rede)}</b> = ${brl$(x.rede)} · US$ ${N(x.rede / x.h2, 2)} por kg de H₂`, ""),
      passo("Fluxo de caixa anual, o que sobra para pagar o investimento:", `${usd$(x.ec)} − ${usd$(x.om)} (operação, manutenção e rede) = <b>${negUsd(x.fluxo)}</b>`, ""),
      sec("Critérios de decisão"),
      passo("Fator de recuperação de capital, a 8% ao ano em 25 anos:", `FRC = ${F("i (1 + i)<sup>n</sup>", "(1 + i)<sup>n</sup> − 1")} = ${B(x.frc, "", 4)}`, "cap. 19", "Lora e Nascimento (2004)"),
      passo("Valor presente líquido:", `VPL = −${usd$(x.inv)} + ${F(negUsd(x.fluxo), N(x.frc, 4))} = <b>${negUsd(x.vpl)}</b>`, "tem de ser positivo"),
      passo("Valor anual uniforme (o que o projeto custa por ano):", `${negUsd(x.fluxo)} − ${usd$(x.inv)} × ${N(x.frc, 4)} = <b>${negUsd(x.vau)}</b>`, ""),
      passo("Taxa interna de retorno, a que zera o VPL:", `<b>${taxaTxt(x.tir)}</b> ao ano`, "tem de passar de 8%"),
      passo("Tempo de retorno simples:", x.payb === null ? "<b>não há</b>: o fluxo anual é negativo" : `${F(usd$(x.inv), usd$(x.fluxo))} = <b>${anosTxt(x.payb)}</b>`, ""),
      passo("Índice de lucratividade (valor presente dos fluxos ÷ investimento):", `<b>${N(x.il, 3)}</b>`, "tem de passar de 1"),
      passo("Investimento que empataria a conta:", `${F(usd$(Math.max(0, x.fluxo)), N(x.frc, 4))} = <b>${usd$(x.invEq)}</b>`, ""),
      sec("Indicadores"),
      passo("Custo do hidrogênio (capital, operação e rede do sistema à parte ÷ produção):", `${F(usd$(r.sis) + " × " + N(x.frc, 4) + " + " + usd$(x.omSis), nf(x.h2, 0) + " kg/ano")} = <b>US$ ${N(x.lcoh, 2)}/kg</b>`, ""),
      passo("Ligado à rede, o eletrolisador para só na ponta dos dias úteis e na manutenção:", `fator de utilização = <b>${nf(x.fu * 100, 0)}%</b>`, ""),
      passo("Custo de evitar 1 t de CO₂:", `${F(usd$(-x.vau), nf(x.co2, 0) + " t/ano")} = <b>US$ ${nf(x.abat, 0)}/t</b>`, "(6,08 − 2,13) kg/m²"),
      passo("Custo a mais por m² de porcelanato:", `${F(usd$(-x.vau), nf(x.prod, 0) + " m²/ano")} = <b>US$ ${N(x.m2, 2)}</b> = <b>R$ ${N(x.m2 * PC.BRL, 2)}</b>`, ""),
      passo("Preço do gás natural que zeraria a conta:", `<b>R$ ${N(x.gnEq, 2)}/m³</b>, ${N(x.gnEq / e.P_GN, 1)} vezes o de hoje`, ""),
      sec("Depois de impostos"),
      passo("Depreciação linear de 4% ao ano:", `0,04 × ${usd$(x.inv)} = <b>${usd$(x.dep)}</b> por ano`, "Tabela 19.2", "Lora e Nascimento (2004)"),
      passo("O projeto dá prejuízo contábil; uma fábrica lucrativa abate esse prejuízo do imposto de renda e da contribuição social (34%):", `0,34 × (${negUsd(x.fluxo)} − ${usd$(x.dep)}) = <b>${negUsd(x.imp)}</b> de imposto por ano`, "IR 25% + CSLL 9%", "EPE (2025)"),
      passo("Fluxo anual, VPL, TIR e tempo de retorno depois de impostos:", `${negUsd(x.fli)} · VPL <b>${negUsd(x.vpli)}</b> · TIR <b>${taxaAno(x.tiri)}</b> · ${anosTxt(x.payi)}`, ""),
      sec("E se o gás natural ficasse mais caro?"),
      passo("Pelo dobro do preço:", `VPL ${negUsd(g2.vpl)} · TIR ${taxaAno(g2.tir)} · retorno em ${anosTxt(g2.payb)}`, ""),
      passo("Pelo triplo do preço:", `VPL ${negUsd(g3.vpl)} · TIR ${taxaAno(g3.tir)} · retorno em ${anosTxt(g3.payb)}`, ""),
      aviso("Use os seletores de preço do eletrolisador e da fotovoltaica, no alto da seção, para ver os outros cenários: esta análise acompanha a escolha."),
      aviso("Não entram: financiamento, troca das pilhas do eletrolisador, preço para o carbono, água e pessoal de operação. A hipótese do abatimento de impostos só vale se a fábrica tiver lucro tributável suficiente.")];
  },
  dia: () => { const x = econ(RC()); return [["valor presente líquido", negUsd(x.vpl)], ["taxa interna de retorno", taxaAno(x.tir)], ["tempo de retorno simples", anosTxt(x.payb)], ["custo do hidrogênio", `US$ ${N(x.lcoh, 2)}/kg`], ["CO₂ evitado", `US$ ${nf(x.abat, 0)}/t`]]; },
};

function atualizaCustos() {
  const r = RC();
  atualizaCadeia(r);
  atualizaEcon(r);
  ORDEM_BARRA.forEach(id => { const s = $(`#trilho-c [data-c="${id}"]`); s.style.width = (r.por[id].usd / r.total * 100) + "%"; s.title = `${ITC.find(d => d.id === id).curto}: ${$u(r.por[id].usd)} (${pct(r.por[id].usd, r.total)})`; });
  $$(".etq", desenhoC).forEach(t => { const x = r.por[t.dataset.c]; $(".vl", t).textContent = $u(x.usd); $(".pc", t).textContent = pct(x.usd, r.total); });
  const maxi = Math.max(...r.it.map(x => x.usd));
  $$("#tc-corpo tr[data-c]").forEach(tr => {
    const id = tr.dataset.c, x = r.por[id], d = ITC.find(e => e.id === id);
    tr.querySelector(".cap").textContent = d.cap(r.k);
    tr.querySelector(".orig").textContent = x.orig ? ORIG_TXT[x.orig] : "instalado";
    tr.querySelector(".orig").className = "orig o-" + (x.orig || "nd");
    tr.querySelector(".v").textContent = $u(x.usd);
    tr.querySelector(".bar span").style.width = Math.max(0.4, x.usd / maxi * 100) + "%";
    tr.querySelector(".bar em").textContent = pct(x.usd, r.total);
  });
  $("#tc-sis").textContent = $u(r.sis); $("#tc-fab").textContent = $u(r.fab); $("#tc-tot").textContent = $u(r.total);
  $("#tc-sisp").textContent = pct(r.sis, r.total); $("#tc-fabp").textContent = pct(r.fab, r.total);
  $("#tc-moeda").textContent = `${CS.moeda === "BRL" ? "R$" : "US$"} de 2026`;
  const fora = r.it.some(x => x.id !== "nd" && (r.k["F_" + { tg: "TG", duto: "DUTO", forno: "FOR", vent: "VENT", trc: "TRC", comp: "COMP" }[x.id]]));
  $("#aviso-faixa").classList.toggle("ver", fora);
  if (cartaoCAtual) preencheCartaoC(cartaoCAtual);
}
liga($("#ct-tot"), v => cv(RC().total), grandeHTML);
liga($("#ct-sub"), v => RC().total, x => `${grana(CS.moeda === "USD" ? x * PC.BRL : x, CS.moeda === "USD" ? "BRL" : "USD", true)} · instalado em Tijucas (SC), em dinheiro de 2026 · ${nf(ST.P, 0)} m²/dia`);
liga($("#ct-sis"), v => cv(RC().sis), x => `${grana(x)} <em>${pct(RC().sis, RC().total)}</em>`);
liga($("#ct-fab"), v => cv(RC().fab), x => `${grana(x)} <em>${pct(RC().fab, RC().total)}</em>`);
liga($("#ct-m2"), v => cv(RC().total / ST.P), x => `<b>${grana(x)}</b> por m²/dia de capacidade`);
liga($("#ct-aace"), v => cv(RC().total), x => `faixa da estimativa: <b>${grana(x * 0.5)} a ${grana(x * 2)}</b>`);
liga($("#ct-kwe"), v => cv(RC().fab / RC().k.P_TG), x => `fábrica: <b>${pre()} ${nf(x, 0)}/kW</b> elétrico`);

/* ── controles: moeda, preço do eletrolisador e preço da fotovoltaica ── */
function pilulaDe(sel) { const b = $(`${sel} button.on`), p = $(`${sel} .pilula`); if (b && p) { p.style.left = b.offsetLeft + "px"; p.style.width = b.offsetWidth + "px"; } }
$("#sel-elz").insertAdjacentHTML("afterbegin", PRECOS_ELZ.map(([pe, a, b]) => `<button data-pe="${pe}"${pe === CS.pe ? ' class="on"' : ""}><b>${nf(pe, 0)}</b><small>${a}${b ? " " + b : ""}</small></button>`).join(""));
$("#sel-fv").insertAdjacentHTML("afterbegin", PRECOS_FV.map(f => `<button data-fv="${f.id}"${f.id === CS.fv ? ' class="on"' : ""}><b>${f.g}</b><small>${f.s}</small></button>`).join(""));
function mudouCustos() { animaNumeros(600); atualizaCustos(); if (modalAtual && modalAtual.startsWith("c_")) abreModal(modalAtual, true); }
$$("#sel-moeda button").forEach(b => b.addEventListener("click", () => {
  CS.moeda = b.dataset.moeda; $$("#sel-moeda button").forEach(x => x.classList.toggle("on", x === b)); pilulaDe("#sel-moeda"); mudouCustos();
}));
$$("#sel-elz button").forEach(b => b.addEventListener("click", () => {
  CS.pe = +b.dataset.pe; $$("#sel-elz button").forEach(x => x.classList.toggle("on", x === b)); pilulaDe("#sel-elz"); mudouCustos();
}));
$$("#sel-fv button").forEach(b => b.addEventListener("click", () => {
  CS.fv = b.dataset.fv; $$("#sel-fv button").forEach(x => x.classList.toggle("on", x === b)); pilulaDe("#sel-fv"); mudouCustos();
}));
const pilulasC = () => { pilulaDe("#sel-moeda"); pilulaDe("#sel-elz"); pilulaDe("#sel-fv"); };
window.addEventListener("resize", pilulasC);
new ResizeObserver(pilulasC).observe($("#sel-elz"));
new ResizeObserver(pilulasC).observe($("#sel-fv"));

HOOKS.push(atualizaCustos);
spy.observe($("#custos"));
atualizaCustos(); pilulasC(); animaNumeros(900);
Object.assign(window.__site, { custos, RC, CS, atualizaCustos, PRECOS_FV, GTW, econ });
// link direto: ...netlify.app/#custos
if (location.hash === "#custos") setTimeout(() => $("#custos").scrollIntoView({ block: "start" }), 60);
