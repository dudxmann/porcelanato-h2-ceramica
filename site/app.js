/* ═══════════════════════ formatação (pt-BR) ═══════════════════════ */
const nf = (x, d = 2) => (Math.abs(x) < 1e-12 ? 0 : x).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
function sig(x, s = 3) {
  if (!isFinite(x) || x === 0) return "0";
  const dig = Math.floor(Math.log10(Math.abs(x))) + 1;
  return nf(x, Math.max(0, Math.min(3, s - dig)));
}
// grandezas com unidade automática → [número, unidade]
const U = {
  massa: kg => kg < 1000 ? [sig(kg), "kg"] : kg < 1e7 ? [sig(kg / 1e3), "t"] : [sig(kg / 1e6), "mil t"],
  energia: mj => mj < 1000 ? [sig(mj), "MJ"] : mj < 1e6 ? [sig(mj / 1e3), "GJ"] : [sig(mj / 1e6), "TJ"],
  eletr: kwh => kwh < 1000 ? [sig(kwh), "kWh"] : kwh < 1e6 ? [sig(kwh / 1e3), "MWh"] : [sig(kwh / 1e6), "GWh"],
  pot: kw => kw < 1 ? [sig(kw * 1000), "W"] : kw < 1000 ? [sig(kw), "kW"] : [sig(kw / 1000), "MW"],
  potp: kwp => kwp < 1000 ? [sig(kwp), "kWp"] : [sig(kwp / 1000), "MWp"],
  area: m2 => m2 < 10000 ? [sig(m2), "m²"] : [sig(m2 / 1e4), "ha"],
  nm3: v => v < 1000 ? [sig(v), "m³"] : [sig(v / 1000), "mil m³"],
  m3: v => [sig(v), "m³"],
  litros: l => l < 1000 ? [sig(l), "L"] : l < 1e6 ? [sig(l / 1000), "m³"] : [sig(l / 1e6), "mil m³"],
  qtd: n => n < 1000 ? [nf(Math.round(n), 0), ""] : n < 1e6 ? [sig(n / 1000), "mil"] : [sig(n / 1e6), "milhões"],
  pct: x => [nf(x * 100, 0), "%"],
};
const txt = (k, x) => U[k](x).join(" ").trim();
const html = (k, x, suf = "") => { const [a, b] = U[k](x); return b || suf ? `${a}<small>${b}${suf}</small>` : a; };

/* ═══════════════════════ estado ═══════════════════════ */
const ST = { P: 30000, v: calcular(30000) };
const HOOKS = [];   // funções chamadas quando a produção muda (ex.: custos)
const PMIN = 1, PMAX = 100000;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ELE = { s1: .18, s2: .17, s4: .60, s5: 1.19, s6: .32, s7: 1.88, s8: .37, s9: .85, s10: .97, s11: .70, s12: .24 };
let MODO = "P";   // "P" = ciclo proposto · "0" = ciclo 0
const eleDe = (k, v) => k === "s3" ? v.E_MOAG : k === "s10" ? ELE.s10 + (MODO === "0" ? 0 : v.E_VENT) : (ELE[k] || 0);
const COR = { h2: "#C0392B", el: "#1D4ED8", esc: "#E08A1E", trc: "#7C3AED", rec: "#15803D", o2: "#4FA3D9", gn: "#A0522D", vap: "#9AA6B2" };

/* ── números animados ── */
const LIGADOS = [];   // {el, f: v => número, fmt: x => html, atual}
function liga(el, f, fmt) { if (el) LIGADOS.push({ el, f, fmt, atual: null }); }
const ease = t => 1 - Math.pow(1 - t, 3);
let rafNum = 0;
// Uma animação só: um pedido novo cancela o anterior e parte do valor que está na tela.
// Cada número só é reescrito quando o texto muda (antes, arrastar a produção empilhava dezenas de laços).
function animaNumeros(dur = 700) {
  cancelAnimationFrame(rafNum);
  const ini = performance.now();
  const alvos = LIGADOS.map(o => ({ o, de: o.atual === null ? 0 : o.atual, para: o.f(ST.v) }));
  function passo(t) {
    const k = Math.min(1, (t - ini) / dur), e = ease(k);
    for (const { o, de, para } of alvos) {
      const x = k < 1 ? de + (para - de) * e : para;
      o.atual = x;
      const h = o.fmt(x);
      if (h !== o.ult) { o.el.innerHTML = h; o.ult = h; }
    }
    if (k < 1) rafNum = requestAnimationFrame(passo);
  }
  rafNum = requestAnimationFrame(passo);
}

/* ═══════════════════════ produção ═══════════════════════ */
const slider = $("#slider"), campo = $("#campoP");
const p2s = P => Math.log10(P) / Math.log10(PMAX) * 1000;
const s2p = s => {
  const P = Math.pow(10, s / 1000 * Math.log10(PMAX));
  const passo = P < 20 ? 1 : P < 200 ? 5 : P < 2000 ? 50 : P < 20000 ? 500 : 1000;
  return Math.max(PMIN, Math.min(PMAX, Math.round(P / passo) * passo));
};
function definirP(P, origem) {
  P = Math.max(PMIN, Math.min(PMAX, Math.round(P)));
  if (P === ST.P && origem !== "inicio") return;
  ST.P = P; ST.v = calcular(P);
  if (origem !== "slider") slider.value = p2s(P);
  slider.style.setProperty("--p", (p2s(P) / 10) + "%");
  if (document.activeElement !== campo) campo.value = nf(P, 0);
  $$(".atalhos button").forEach(b => b.classList.toggle("on", +b.dataset.p === P));
  animaNumeros(origem === "inicio" ? 1400 : 650);
  atualizaTabela(origem !== "inicio");
  mapa.alvo(ST.v.A_TER);
  if (cartaoAtual) preencheCartao(cartaoAtual);
  HOOKS.forEach(f => f(origem));
  if (modalAtual) abreModal(modalAtual, true);
  if (typeof resumoCiclo === "function" && $("#resumo-ciclo")) resumoCiclo();
}
// O controle pode disparar vários eventos por quadro: a conta roda uma vez por quadro, com o último valor.
let pSlider = null, rafSl = 0;
slider.addEventListener("input", () => {
  pSlider = s2p(+slider.value);
  if (!rafSl) rafSl = requestAnimationFrame(() => { rafSl = 0; definirP(pSlider, "slider"); });
});
function aplicaSlider() { if (rafSl) { cancelAnimationFrame(rafSl); rafSl = 0; definirP(pSlider, "slider"); } }
campo.addEventListener("focus", () => { campo.value = String(ST.P); campo.select(); });
campo.addEventListener("keydown", e => { if (e.key === "Enter") campo.blur(); });
campo.addEventListener("blur", () => {
  const x = parseFloat(campo.value.replace(/\./g, "").replace(",", "."));
  if (isFinite(x)) definirP(x, "campo"); campo.value = nf(ST.P, 0);
});
$$(".atalhos button").forEach(b => b.addEventListener("click", () => definirP(+b.dataset.p, "atalho")));

/* ═══════════════════════ notação das equações ═══════════════════════ */
const S = (b, s) => `<i>${b}</i>${s ? `<sub>${s}</sub>` : ""}`;
const F = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
const N = (x, d = 2) => nf(x, d);
const B = (x, u, d = 2) => `<b>${nf(x, d)}</b>${u ? " " + u : ""}`;
const MJt = "MJ<sub>t</sub>/m²", MJe = "MJ<sub>e</sub>/m²";
const passo = (t, eq, ref, src) => ({ t, eq, ref, src });
const sec = h => ({ h });
const aviso = a => ({ aviso: a });
// valores na produção escolhida
const dia = {
  calor: mj => `${txt("energia", mj * ST.P)}/dia · ${txt("pot", mj * ST.P / 86.4)} médios`,
  eletr: mj => `${txt("eletr", mj * ST.P / 3.6)}/dia · ${txt("pot", mj * ST.P / 86.4)} médios`,
  massa: kg => `${txt("massa", kg * ST.P)}/dia`,
};
const elePasso = (k, v) => (k === "s10" && MODO !== "0") ? passo("Acionamento dos rolos e ventiladores do forno (rateio) mais os ventiladores da recuperação de calor:",
    `${S("E", "e,10")} = 0,97 + ${N(ST.v.E_VENT)} = ${B(eleDe(k, ST.v), MJe)}`, "Figura 3", "rateio estimado")
  : passo(MODO === "0" ? "Parcela da eletricidade da rede atribuída à etapa (rateio dos 7,47 MJ<sub>e</sub>/m² que não são da moagem):" : "Parcela do consumo elétrico que não é da moagem, rateada entre as etapas:",
    `${S("E", "e")} = ${B(eleDe(k, ST.v), MJe)}`, "Figura 3", "rateio estimado");
const co2Rede = (k, v) => passo("Eletricidade comprada da rede (fator médio do SIN em 2023):", `${S("CO₂", "2")} = ${F(N(eleDe(k, v)), "3,6")} × 0,0385 = ${B(eleDe(k, v) / 3.6 * v.FE_SIN, "kg/m²", 3)}`, "Eq. (34)", "Brasil (2024c)");

/* ═══════════════════════ elementos da planta ═══════════════════════ */
// rendimento de catálogo da turbina que a seção Custos escolhe para a produção do momento (Gas Turbine World, 2018)
function turbCatalogo() {
  const k = window.__site && window.__site.custos ? window.__site.custos(ST.P).k : null;
  if (!k || !k.TG) return { txt: "", fonte: "Boyce (2012)" };
  return { txt: ` (o catálogo dá ${N(k.TG[3], 1)}% para a máquina escolhida nesta produção, a ${k.TG[0]})`, fonte: "Boyce (2012); Gas Turbine World (2018)" };
}

const EL = {
  s1: { n: 1, nome: "Recepção", desc: "Recebimento e estocagem das matérias-primas: argilas, feldspatos e areias.",
    massa: v => [v.M_MP_REC, v.M_MP, `perda de manuseio de ${N(v.M_MAN)} kg/m²`],
    cond: v => ["temperatura ambiente", "umidade de 4% (b.u.)", "perda de 0,5%"],
    contas: v => [sec("Massa"),
      passo("A massa úmida que segue para a moagem vem dos sólidos secos do suporte (Eq. 7) com 4% de umidade:", `${S("m", "MP")} = ${F(S("m", "s"), "1 − " + S("x", "MP"))} = ${F(N(v.MS), "1 − 0,04")} = ${B(v.M_MP, "kg/m²")}`, "Eq. (16)", "umidade: hipótese"),
      passo("Com 0,5% de perda de manuseio, a planta precisa receber:", `${S("m", "MP,rec")} = ${F(S("m", "MP"), "1 − " + S("f", "man"))} = ${F(N(v.M_MP), N(1 - v.F_MAN, 3))} = ${B(v.M_MP_REC, "kg/m²")}`, "Eq. (18)", "hipótese"),
      passo("A perda de manuseio é a diferença:", `${S("m", "man")} = ${N(v.M_MP_REC)} − ${N(v.M_MP)} = ${B(v.M_MAN, "kg/m²")}`, "Eq. (18)"),
      sec("Energia elétrica"), elePasso("s1", v)],
    dia: v => [["matéria-prima recebida", dia.massa(v.M_MP_REC)], ["perda de manuseio", dia.massa(v.M_MAN)], ["eletricidade", dia.eletr(eleDe("s1", v))]] },
  s2: { n: 2, nome: "Dosagem", desc: "Pesagem gravimétrica de cada matéria-prima conforme a formulação.",
    massa: v => [v.M_MP, v.M_MP, "sem perda"], cond: v => ["balança gravimétrica", "temperatura ambiente"],
    contas: v => [sec("Massa"), passo("A dosagem só pesa e mistura; a massa não muda:", `${S("m", "entra")} = ${S("m", "sai")} = ${S("m", "MP")} = ${B(v.M_MP, "kg/m²")}`, "Tabela 4"),
      sec("Energia elétrica"), elePasso("s2", v)],
    dia: v => [["matéria-prima dosada", dia.massa(v.M_MP)], ["eletricidade", dia.eletr(eleDe("s2", v))]] },
  s3: { n: 3, nome: "Moagem", desc: "Moagem a úmido em moinho contínuo de quatro módulos: a matéria-prima vira barbotina.",
    massa: v => [v.M_MP + v.A_ADD, v.M_BARB, `inclui ${N(v.A_ADD)} kg de água`], cond: v => ["moinho contínuo, 4 módulos", "80 kWh por tonelada", "barbotina com 33,8% de umidade"],
    contas: v => [sec("Energia elétrica"),
      passo("Adotaram-se 80 kWh por tonelada de matéria-prima recebida: segundo a Portobello, o moinho contínuo da unidade de Tijucas consome na ordem do dobro da faixa de 36 a 43 kWh/t citada por Alves et al. (2023b):", `${S("E", "moag")} = ${S("e", "moag")} ${F(S("m", "MP,rec"), "1000")} × 3,6 = 80 × ${F(N(v.M_MP_REC), "1000")} × 3,6 = ${B(v.E_MOAG, MJe)}`, "Eq. (27)", "adotado; Rigobelo (2026)"),
      passo("Por tonelada de sólido seco, o consumo fica acima da referência de 52 ± 15 kWh/t:", `${F(N(v.E_MOAG), "3,6")} × ${F("1000", N(v.MS))} = ${B(v.E_MOAG / 3.6 / v.MS * 1000, "kWh/t", 1)}`, "Tabela 6", "Monfort et al. (2010)"),
      sec("Massa"),
      passo("A barbotina sai com 33,8% de umidade:", `${S("m", "barb")} = ${F(S("m", "s"), "1 − " + S("x", "b"))} = ${F(N(v.MS), "1 − " + N(v.X_B, 4))} = ${B(v.M_BARB, "kg/m²")}`, "Eq. (11)", "Oliveira e Hotza (2015)"),
      passo("A água adicionada no moinho completa a água da barbotina:", `${S("a", "add")} = (${S("m", "barb")} − ${S("m", "s")}) − (${S("m", "MP")} − ${S("m", "s")}) = ${N(v.M_BARB - v.MS)} − ${N(v.M_MP - v.MS)} = ${B(v.A_ADD, "kg/m²")}`, "Eq. (17)")],
    dia: v => [["eletricidade do moinho", dia.eletr(v.E_MOAG)], ["água adicionada", dia.massa(v.A_ADD)], ["barbotina", dia.massa(v.M_BARB)]] },
  s4: { n: 4, nome: "Peneiramento", desc: "Peneiras vibratórias e desferrização retiram grumos e partículas metálicas.",
    massa: v => [v.M_BARB, v.M_BARB, "sem perda"], cond: v => ["peneiras vibratórias", "tanques agitados"],
    contas: v => [sec("Massa"), passo("A barbotina passa sem mudar de massa:", `${S("m", "barb")} = ${B(v.M_BARB, "kg/m²")}`, "Eq. (11)"), sec("Energia elétrica"), elePasso("s4", v)],
    dia: v => [["barbotina", dia.massa(v.M_BARB)], ["eletricidade", dia.eletr(eleDe("s4", v))]] },
  s5: { n: 5, nome: "Atomização", desc: "A barbotina é pulverizada em gás quente e vira pó com 6% de umidade.",
    term: v => [["escape da turbina", v.ESC, COR.esc], ["ar de resfriamento do forno", v.AR_AT, COR.rec], ["H₂ no queimador de duto", v.DUTO, COR.h2]],
    massa: v => [v.M_BARB, v.M_PO, `evapora ${N(v.EV_AT)} kg de água`],
    cond: v => ["gás a 550 °C na entrada", `${N(v.T_PRE, 0)} °C antes do queimador`, "exaustão a 105 °C", "bicos a 30 bar"],
    contas: v => [sec("Demanda"),
      passo("O atomizador recebe 37,5% do calor do ciclo 0:", `${S("Q", "at")} = ${S("φ", "at")} ${S("Q", "t,0")} = 0,375 × ${N(v.Q_T0)} = ${B(v.Q_AT, MJt)}`, "Tabela 5", "grupo: meio das faixas consideradas realistas por Rigobelo (2026)"),
      passo("Água evaporada:", `${S("Δm", "at")} = (${S("m", "barb")} − ${S("m", "s")}) − (${S("m", "pó")} − ${S("m", "s")}) = ${N(v.M_BARB - v.MS)} − ${N(v.M_PO - v.MS)} = ${B(v.EV_AT, "kg/m²")}`, "Eq. (12)"),
      passo("Consumo por kg de água, dentro da faixa de 3,8 a 4,6 MJ/kg:", `${S("e", "at")} = ${F(S("Q", "at"), S("Δm", "at"))} = ${F(N(v.Q_AT), N(v.EV_AT))} = ${B(v.E_AT_ESP, "MJ/kg")}`, "Eq. (32)", "Negre et al. (2000)"),
      sec("Limite de massa a 550 °C"),
      passo("O gás precisa entrar a 550 °C; a massa que cabe nessa condição é:", `${S("m", "at,máx")} = ${F(S("Q", "at") + " × 1000", S("c", "p,g") + " (550 − 25)")} = ${F(N(v.Q_AT) + " × 1000", N(v.CP_G) + " × 525")} = ${B(v.M_AT_MAX, "kg/m²", 1)}`, "Eq. (43)", "Della, Melo e Melo (2012)"),
      sec("Fontes de calor"),
      passo("Todo o escape da turbina vai para o atomizador:", `${S("Q", "esc")} = ${S("F", "TG")} − ${S("E", "e")} = ${N(v.F_TG)} − ${N(v.E_TG)} = ${B(v.ESC, MJt)}`, "Eq. (46)"),
      passo("Massa do escape a 500 °C:", `${S("m", "esc")} = ${F(N(v.ESC) + " × 1000", N(v.CP_TG) + " × (500 − 25)")} = ${B(v.M_ESC, "kg/m²", 1)}`, "Eq. (50)"),
      passo("O ar de resfriamento do forno (225 °C) completa a massa admissível:", `${S("m", "ar,at")} = ${F(N(v.Q_AT) + " × 1000 − " + N(v.M_ESC) + " × " + N(v.CP_TG) + " × 525", N(v.CP) + " × 525")} = ${B(v.M_AR_AT, "kg/m²")}`, "Eq. (53)"),
      passo("Calor que esse ar traz:", `${S("Q", "ar,at")} = ${N(v.M_AR_AT)} × ${N(v.CP)} × 200 / 1000 = ${B(v.AR_AT, MJt)}`, "Seção 7.3"),
      passo("O queimador de duto completa a energia, queimando H₂ no oxigênio que sobra no escape:", `${S("Q", "duto")} = ${S("Q", "at")} − ${S("Q", "esc")} − ${S("Q", "ar,at")} = ${N(v.Q_AT)} − ${N(v.ESC)} − ${N(v.AR_AT)} = ${B(v.DUTO, MJt)}`, "Eq. (54)"),
      passo("H₂ do queimador de duto:", `${S("m", "H₂,duto")} = ${F(N(v.DUTO), "120")} = ${B(v.H2_DUTO, "kg/m²", 3)}`, "Eq. (54) ÷ PCI"),
      passo("Antes do queimador, a mistura de escape e ar está a:", `${S("T", "pré")} = 25 + ${F("(" + N(v.ESC) + " + " + N(v.AR_AT) + ") × 1000", N(v.M_ESC) + " × " + N(v.CP_TG) + " + " + N(v.M_AR_AT) + " × " + N(v.CP))} ≈ ${B(v.T_PRE, "°C", 0)}`, "Seção 7.3"),
      sec("Energia elétrica"), passo("Bombas de alta pressão e ventiladores (rateio):", `${S("E", "e")} = ${B(1.19, MJe)}`, "Figura 3", "rateio estimado")],
    dia: v => [["calor", dia.calor(v.Q_AT)], ["água evaporada", dia.massa(v.EV_AT)], ["H₂ do queimador de duto", dia.massa(v.H2_DUTO)], ["pó atomizado", dia.massa(v.M_PO)]] },
  s6: { n: 6, nome: "Repouso", desc: "O pó descansa em silos para homogeneizar a umidade.",
    massa: v => [v.M_PO, v.M_PO, "sem perda"], cond: v => ["48 a 72 h em silos", "pó com 6% de umidade"],
    contas: v => [sec("Massa"), passo("Pó atomizado com 6% de umidade:", `${S("m", "pó")} = ${F(S("m", "s"), "1 − " + S("x", "pó"))} = ${F(N(v.MS), "1 − 0,06")} = ${B(v.M_PO, "kg/m²")}`, "Eq. (10)", "Negre et al. (2000)"), sec("Energia elétrica"), elePasso("s6", v)],
    dia: v => [["pó em repouso", dia.massa(v.M_PO)], ["eletricidade", dia.eletr(eleDe("s6", v))]] },
  s7: { n: 7, nome: "Prensagem", desc: "Prensas hidráulicas conformam as placas a seco.",
    massa: v => [v.M_PO, v.M_PO, "refugo verde reciclado internamente"], cond: v => ["400 a 450 kgf/cm²", "pó a 6% de umidade"],
    contas: v => [sec("Massa"), passo("O refugo verde volta ao processo, então a massa se mantém:", `${S("m", "prensada")} = ${S("m", "pó")} = ${B(v.M_PO, "kg/m²")}`, "Tabela 4"), sec("Energia elétrica"), elePasso("s7", v)],
    dia: v => [["peças prensadas", dia.massa(v.M_PO)], ["eletricidade", dia.eletr(eleDe("s7", v))]] },
  s8: { n: 8, nome: "Secagem", desc: "Secador vertical leva a umidade da peça para 0,3%, sem queimar combustível.",
    term: v => [["ar de resfriamento do forno", v.AR_SEC, COR.rec], ["ar do trocador", v.TRC, COR.trc]],
    massa: v => [v.M_PO, v.M_SECA, `evapora ${N(v.EV_SEC)} kg de água`],
    cond: v => [`entrada a ${N(v.T_SEC_IN, 0)} °C`, "exaustão a 110 °C", "umidade final de 0,3%"],
    contas: v => [sec("Demanda"),
      passo("O secador recebe 10,5% do calor do ciclo 0:", `${S("Q", "sec")} = 0,105 × ${N(v.Q_T0)} = ${B(v.Q_SEC, MJt)}`, "Tabela 5", "grupo: meio das faixas consideradas realistas por Rigobelo (2026)"),
      passo("Água evaporada:", `${S("Δm", "sec")} = ${S("m", "pó")} − ${S("m", "seca")} = ${N(v.M_PO)} − ${N(v.M_SECA)} = ${B(v.EV_SEC, "kg/m²")}`, "Eq. (13)"),
      sec("Fontes de calor"),
      passo("Do ar de resfriamento, 85% chega ao uso final:", `${S("Q", "ar,rec")} = 0,85 × ${N(v.Q_RES0)} = ${B(v.AR_REC, MJt)}`, "Eq. (36)", "hipótese (85%)"),
      passo("O que não foi para o atomizador vai para o secador:", `${S("Q", "ar,sec")} = ${S("Q", "ar,rec")} − ${S("Q", "ar,at")} = ${N(v.AR_REC)} − ${N(v.AR_AT)} = ${B(v.AR_SEC, MJt)}`, "Eq. (55)"),
      passo("O trocador gás-gás completa a demanda:", `${S("Q", "trc")} = ${S("Q", "sec")} − ${S("Q", "ar,sec")} = ${N(v.Q_SEC)} − ${N(v.AR_SEC)} = ${B(v.TRC, MJt)}`, "Eq. (56)"),
      passo("Massas de ar: 225 °C (resfriamento) e 150 °C (trocador):", `${S("m", "ar,sec")} = ${F(N(v.AR_SEC) + " × 1000", "1,05 × 200")} = ${B(v.M_AR_SEC, "kg")} · ${S("m", "trc")} = ${F(N(v.TRC) + " × 1000", "1,05 × 125")} = ${B(v.M_TRC, "kg")}`, "Eq. (37)"),
      v.TRC < 0
        ? passo("O ar de resfriamento sobra: entra só o necessário, e a entrada fica na temperatura do ar:", `${S("T", "sec")} = ${B(v.T_SEC_IN, "°C", 0)} (sobram ${N(-v.TRC)} ${MJt})`, "Eq. (57)")
        : passo("Temperatura da mistura na entrada do secador:", `${S("T", "sec")} = 25 + ${F(N(v.Q_SEC) + " × 1000", "(" + N(v.M_AR_SEC) + " + " + N(v.M_TRC) + ") × 1,05")} = ${B(v.T_SEC_IN, "°C", 0)}`, "Eq. (57)"),
      sec("Energia elétrica"), elePasso("s8", v)],
    dia: v => [["calor", dia.calor(v.Q_SEC)], ["água evaporada", dia.massa(v.EV_SEC)], ["peças secas", dia.massa(v.M_SECA)]] },
  s9: { n: 9, nome: "Esmaltação", desc: "Aplicação de engobe e esmalte em linha contínua.",
    massa: v => [v.M_SECA + v.M_ESM, v.M_ESMALT, `${N(v.M_ESM)} kg de suspensão`], cond: v => ["suspensão com 70% de sólidos", "1,10 kg/m²"],
    contas: v => [sec("Massa"),
      passo("A suspensão tem 70% de sólidos:", `${S("s", "esm")} = ${S("m", "esm")} ${S("f", "s")} = 1,10 × 0,70 = ${B(v.S_ESMS, "kg/m²")} · ${S("a", "esm")} = ${B(v.A_ESM, "kg/m²")}`, "Eq. (6)", "hipótese"),
      passo("Peça esmaltada:", `${S("m", "esmaltada")} = ${S("m", "seca")} + ${S("m", "esm")} = ${N(v.M_SECA)} + ${N(v.M_ESM)} = ${B(v.M_ESMALT, "kg/m²")}`, "Eq. (14)"),
      sec("Energia elétrica"), elePasso("s9", v)],
    dia: v => [["suspensão de esmalte", dia.massa(v.M_ESM)], ["eletricidade", dia.eletr(eleDe("s9", v))]] },
  s10: { n: 10, nome: "Queima", desc: "Forno a rolos: H₂ queimado com o O₂ da eletrólise, sem ar de combustão.",
    term: v => [["H₂ com O₂ puro", v.Q_F, COR.h2]],
    massa: v => [v.M_ESMALT, v.M_QUEIM, `água ${N(v.A_FORNO)} + perda ao fogo ${N(v.M_PF)} kg`],
    cond: v => ["1.180 a 1.220 °C", "ciclo de 35 a 80 min", `exaustão 200 → ${N(v.T_FOR_OUT, 0)} °C`, "H₂ e O₂ a 0,25 bar"],
    contas: v => [sec("Referência: forno a gás natural (ciclo 0)"),
      passo("O forno recebe 52% do calor do ciclo 0:", `${S("Q", "forno")} = 0,52 × ${N(v.Q_T0)} = ${B(v.Q_FOR0, MJt)}`, "Tabela 5", "grupo: meio das faixas consideradas realistas por Rigobelo (2026)"),
      passo("Saídas para fornos cerâmicos: 51,3% na exaustão e 27,8% no ar de resfriamento:", `${S("Q", "exa,0")} = 0,513 × ${N(v.Q_FOR0)} = ${B(v.Q_EXA0, MJt)} · ${S("Q", "res,0")} = 0,278 × ${N(v.Q_FOR0)} = ${B(v.Q_RES0, MJt)}`, "Eqs. (28)–(29)", "Brown, Hamel e Hedman (1996)"),
      sec("Forno com oxigênio"),
      passo("Vazão da exaustão do forno a gás (200 °C):", `${S("m", "exa")} = ${F(N(v.Q_EXA0) + " × 1000", "1,05 × (200 − 25)")} = ${B(v.M_FOR_GN, "kg/m²")}`, "Eq. (38)"),
      passo("Ar de combustão (λ = 1,15) — deixa de existir com O₂ puro:", `${S("m", "ar,comb")} = ${N(v.Q_FOR0)} × 0,344 × 1,15 = ${B(v.AR_COMB, "kg/m²")}`, "Eq. (58)", "λ: hipótese"),
      passo("O ar de processo continua atravessando o forno:", `${S("m", "ar,proc")} = ${N(v.M_FOR_GN)} − ${N(v.AR_COMB)} − ${N(v.M_GN_FOR)} = ${B(v.M_AR_PROC, "kg/m²")}`, "Eq. (59)"),
      passo("A energia que não depende da exaustão permanece:", `${S("Q", "fixo")} = ${N(v.Q_FOR0)} − ${N(v.Q_EXA0)} = ${B(v.FIXO, MJt)}`, "Eq. (60)"),
      passo("A nova exaustão é o ar de processo mais o vapor da queima do H₂:", `${S("Q", "F")} = ${S("Q", "fixo")} + ${S("m", "ar,proc")} ${S("c", "p")} (200 − 25) + ${F(S("Q", "F"), "PCI")} 8,94 ${S("c", "p,v")} (200 − 25)`, "Eq. (61)"),
      passo(`Com a = ${N(v.KA)} MJ/m² e b = ${N(v.KB, 4)}:`, `${S("Q", "F")} = ${F(S("Q", "fixo") + " + a", "1 − b")} = ${F(N(v.FIXO) + " + " + N(v.KA), "1 − " + N(v.KB, 4))} = ${B(v.Q_F, MJt)}`, "Eq. (62)"),
      passo("Economia em relação ao forno a gás:", `${N(v.Q_FOR0)} − ${N(v.Q_F)} = ${B(v.ECON_F, MJt)}`, "Seção 7.5"),
      sec("Hidrogênio e oxigênio"),
      passo("H₂ e O₂ consumidos no forno (7,94 kg de O₂ por kg de H₂):", `${S("m", "H₂")} = ${F(N(v.Q_F), "120")} = ${B(v.H2_FOR, "kg/m²", 3)} · ${S("m", "O₂")} = ${N(v.H2_FOR, 3)} × 7,94 = ${B(v.O2_FOR, "kg/m²")}`, "Eq. (65)"),
      sec("Massa"),
      passo("Saem a água residual, a água do esmalte e a perda ao fogo:", `${S("m", "queimado")} = ${N(v.M_ESMALT)} − ${N(v.A_FORNO)} − ${N(v.M_PF)} = ${B(v.M_QUEIM, "kg/m²")}`, "Eqs. (7) e (15)"),
      sec("Exaustão e trocador"),
      passo("O trocador retira calor da exaustão, que esfria de 200 °C para:", `${S("T", "saída")} = 200 − ${F(N(v.TRC) + "/0,85 × 1000", N(v.M_AR_PROC) + " × 1,05 + " + N(v.H2O_FOR) + " × 1,90")} = ${B(v.T_FOR_OUT, "°C", 0)}`, "Eq. (63)"),
      sec("Energia elétrica"), elePasso("s10", v)],
    dia: v => [["calor do forno", dia.calor(v.Q_F)], ["H₂ do forno", dia.massa(v.H2_FOR)], ["O₂ do forno", dia.massa(v.O2_FOR)], ["eletricidade", dia.eletr(eleDe("s10", v))]] },
  s11: { n: 11, nome: "Retífica", desc: "Retífica e polimento ajustam bordas e superfície; a lama é recolhida.",
    massa: v => [v.M_QUEIM, v.M_P, `lama de ${N(v.M_LAMA)} kg`], cond: v => ["corte a úmido", "3,4% da massa queimada"],
    contas: v => [sec("Massa"), passo("A retífica remove a lama do produto queimado:", `${S("m", "queimado")} = ${S("m", "P")} + ${S("m", "lama")} = ${N(v.M_P)} + ${N(v.M_LAMA)} = ${B(v.M_QUEIM, "kg/m²")}`, "Eq. (5)", "hipótese; Sartor et al. (2021): cerca de 1,00 kg/m² na retífica a seco"), sec("Energia elétrica"), elePasso("s11", v)],
    dia: v => [["lama de retífica", dia.massa(v.M_LAMA)], ["eletricidade", dia.eletr(eleDe("s11", v))]] },
  s12: { n: 12, nome: "Expedição", desc: "Classificação, embalagem e estoque do produto acabado.",
    massa: v => [v.M_P, v.M_P, "produto acabado"], cond: v => ["22,00 kg por m²"],
    contas: v => [sec("Massa"), passo("Unidade funcional: 1 m² de porcelanato acabado.", `${S("m", "P")} = ${B(v.M_P, "kg/m²")}`, "Seção 1.2", "Alves et al. (2023a)"),
      passo("Na produção escolhida:", `${S("m", "P")} × ${S("P")} = ${N(v.M_P)} × ${nf(ST.P, 0)} = ${B(v.M_P * ST.P / 1000, "t/dia", 1)}`, "Eq. (2)"),
      sec("Energia elétrica"), elePasso("s12", v)],
    dia: v => [["porcelanato", dia.massa(v.M_P)], ["eletricidade", dia.eletr(eleDe("s12", v))]] },
  tg: { icone: "⚡", nome: "Turbina a gás", desc: "Gera toda a eletricidade da planta; o escape quente vai para o atomizador.",
    energia: v => [["combustível: H₂", v.F_H2_TG, COR.h2, "MJ/m²"], ["combustível: gás natural", v.GN_TG, COR.gn, "MJ/m²"], ["eletricidade gerada", v.E_TG, COR.el, "MJ<sub>e</sub>/m²"], ["escape para o atomizador", v.ESC, COR.esc, "MJ<sub>t</sub>/m²"]],
    massaTxt: v => [["H₂", `${N(v.H2_TG, 4)} kg/m²`], ["gás natural", `${N(v.GN_NM3, 3)} m³/m²`], ["escape", `${N(v.M_ESC, 1)} kg/m² a 500 °C`]],
    cond: v => ["η = 35%", "escape a 500 °C", "30% H₂ + 70% GN (vol.)", `${txt("pot", v.P_TG)} elétricos`],
    contas: v => [sec("Energia"),
      passo("Eletricidade da planta (14,40 MJ<sub>e</sub>/m² do ciclo 0) mais os ventiladores da recuperação:", `${S("E", "e")} = ${N(v.E_E0)} + ${N(v.E_VENT)} = ${B(v.E_TG, MJe)}`, "Seção 5.2"),
      passo(`Com rendimento elétrico de 35%, adotado para turbinas industriais de ciclo simples${turbCatalogo().txt}:`, `${S("F", "TG")} = ${F(S("E", "e"), "η")} = ${F(N(v.E_TG), "0,35")} = ${B(v.F_TG, "MJ/m²")}`, "Eq. (45)", turbCatalogo().fonte),
      passo("A energia não convertida sai no escape:", `${S("Q", "esc")} = ${S("F", "TG")} − ${S("E", "e")} = ${N(v.F_TG)} − ${N(v.E_TG)} = ${B(v.ESC, MJt)}`, "Eq. (46)"),
      sec("Mistura de combustível"),
      passo("Combustores secos de baixa emissão admitem 20% a 30% de H₂ em volume; adotou-se 30% (o PCI do H₂ está a 0 °C e o do gás a 20 °C; nas mesmas condições, a mistura tem 31,5% de H₂ em volume):", `${S("x", "E")} = ${F(S("x", "V") + " PCI<sub>H₂</sub>", S("x", "V") + " PCI<sub>H₂</sub> + (1 − " + S("x", "V") + ") PCI<sub>GN</sub>")} = ${F("0,30 × 10,78", "0,30 × 10,78 + 0,70 × 35,9")} = ${B(v.X_H2E, "", 3)}`, "Eq. (47)", "NETL (2022)"),
      passo("Hidrogênio da turbina:", `${S("F", "H₂,TG")} = ${N(v.X_H2E, 3)} × ${N(v.F_TG)} = ${B(v.F_H2_TG, "MJ/m²")} ⇒ ${S("m", "H₂,TG")} = ${F(N(v.F_H2_TG), "120")} = ${B(v.H2_TG, "kg/m²", 4)}`, "Eq. (48)"),
      passo("Gás natural da turbina:", `${S("F", "GN,TG")} = (1 − ${N(v.X_H2E, 3)}) × ${N(v.F_TG)} = ${B(v.GN_TG, "MJ/m²")} ⇒ ${S("V", "GN")} = ${F(N(v.GN_TG), "35,9")} = ${B(v.GN_NM3, "m³/m²", 3)}`, "Eq. (49)"),
      sec("Escape e potência"),
      passo("Massa do escape a 500 °C:", `${S("m", "esc")} = ${F(N(v.ESC) + " × 1000", "1,10 × (500 − 25)")} = ${B(v.M_ESC, "kg/m²", 1)}`, "Eq. (50)"),
      passo("Potência elétrica média na produção escolhida:", `${S("P", "TG")} = ${F(S("E", "e") + " " + S("P"), "86 400")} = ${F(N(v.E_TG) + " × " + nf(ST.P, 0), "86 400")} = <b>${txt("pot", v.P_TG)}</b>`, "Eq. (51)"),
      sec("Emissões"),
      passo("O gás natural da turbina é o único combustível fóssil do ciclo:", `${S("CO₂", "P")} = ${N(v.GN_TG)} × 0,0561 = ${B(v.CO2_P, "kg/m²")}`, "Eq. (82)", "IPCC (2006)")],
    dia: v => [["potência elétrica", txt("pot", v.P_TG)], ["H₂ da turbina", dia.massa(v.H2_TG)], ["gás natural", `${txt("nm3", v.GN_DIA)}/dia`], ["escape", dia.calor(v.ESC)]] },
  h2t: { icone: "H₂", nome: "Tanque de hidrogênio", desc: "Excedente de H₂ do eletrolisador alcalino, comprimido e estocado a 200 bar.",
    energia: v => [["para a turbina", v.F_H2_TG, COR.h2, "MJ/m²"], ["queimador de duto", v.DUTO, COR.esc, "MJ/m²"], ["forno", v.Q_F, "#B91C1C", "MJ/m²"]],
    massaTxt: v => [["H₂ total", `${N(v.H2_TOT, 3)} kg/m²`], ["turbina · duto · forno", `${N(v.H2_TG, 3)} · ${N(v.H2_DUTO, 3)} · ${N(v.H2_FOR, 3)} kg`]],
    cond: v => ["200 bar, 25 °C", "ρ = 14,4 kg/m³", `1 dia = ${txt("m3", v.V_EST)}`],
    contas: v => [sec("Consumo"),
      passo("O H₂ soma a turbina, o queimador de duto e o forno:", `${S("m", "H₂")} = ${F(S("F", "H₂,TG") + " + " + S("Q", "duto") + " + " + S("Q", "F"), "PCI<sub>H₂</sub>")} = ${F(N(v.F_H2_TG) + " + " + N(v.DUTO) + " + " + N(v.Q_F), "120")} = ${B(v.H2_TOT, "kg/m²", 3)}`, "Eq. (64)", "PCI: Çengel e Boles (2013)"),
      sec("Estocagem"),
      passo("Massa específica a 200 bar e 25 °C, com o desvio do gás ideal (Z ≈ 1,13):", `ρ = ${F(S("p") + " " + S("M"), S("Z") + " " + S("R") + " " + S("T"))} = ${F("200 × 10<sup>5</sup> × 2,016 × 10<sup>−3</sup>", "1,13 × 8,314 × 298,15")} = ${B(v.RHO_CALC, "kg/m³")}`, "Eq. (68)", "Z: hipótese; gás ideal: Çengel e Boles (2013)"),
      passo("Um dia de estoque na produção escolhida:", `${S("V", "est")} = ${F(S("m", "H₂") + " " + S("P"), "ρ")} = ${F(N(v.H2_TOT, 4) + " × " + nf(ST.P, 0), "14,4")} = <b>${txt("m3", v.V_EST)}</b>`, "Eq. (69)")],
    dia: v => [["H₂ por dia", dia.massa(v.H2_TOT)], ["volume a 200 bar", txt("m3", v.V_EST)], ["energia do H₂", `${txt("energia", v.H2_TOT * 120 * ST.P)}/dia`]] },
  o2t: { icone: "O₂", nome: "Tanque de oxigênio", desc: "O₂ que sai da eletrólise junto com o H₂; o forno usa parte, o resto pode ser vendido.",
    massaTxt: v => [["O₂ produzido", `${N(v.O2_TOT)} kg/m²`], ["usado no forno", `${N(v.O2_FOR)} kg/m²`], ["disponível para venda", `${N(v.O2_VENDA)} kg/m²`]],
    cond: v => ["30 bar", "forno a 0,25 bar"],
    contas: v => [sec("Estequiometria"),
      passo("Da reação H₂ + ½ O₂ → H₂O, com massas molares 2,016 e 32,00 g/mol:", `${F(S("m", "O₂"), S("m", "H₂"))} = ${F("0,5 × 32,00", "2,016")} = ${B(v.O2_H2, "")}`, "Eq. (65)", "Çengel e Boles (2013)"),
      sec("Balanço de O₂"),
      passo("A eletrólise produz:", `${N(v.H2_TOT, 3)} × 7,94 = ${B(v.O2_TOT, "kg/m²")}`, "Seção 7.6"),
      passo("O forno usa:", `${N(v.H2_FOR, 3)} × 7,94 = ${B(v.O2_FOR, "kg/m²")}`, "Seção 7.6"),
      passo("Sobram para venda:", `${N(v.O2_TOT)} − ${N(v.O2_FOR)} = ${B(v.O2_VENDA, "kg/m²")}`, "Seção 7.6")],
    dia: v => [["O₂ produzido", dia.massa(v.O2_TOT)], ["no forno", dia.massa(v.O2_FOR)], ["para venda", dia.massa(v.O2_VENDA)]] },
  gn: { icone: "GN", nome: "Gás natural", desc: "Vem da rede e só é queimado na turbina, misturado ao H₂.",
    energia: v => [["energia na turbina", v.GN_TG, COR.gn, "MJ/m²"]],
    massaTxt: v => [["volume", `${N(v.GN_NM3, 3)} m³/m²`], ["ciclo 0", `${N(v.V_GN0, 3)} m³/m² (−${nf(v.RED_GN * 100, 0)}%)`], ["CO₂", `${N(v.CO2_P)} kg/m²`]],
    cond: v => ["PCI de 35,9 MJ/m³ (20 °C)", "25 bar na turbina", "70% da mistura em volume"],
    contas: v => [sec("Consumo"),
      passo("Parcela do gás natural na energia da turbina:", `${S("F", "GN,TG")} = (1 − ${S("x", "E")}) ${S("F", "TG")} = (1 − ${N(v.X_H2E, 3)}) × ${N(v.F_TG)} = ${B(v.GN_TG, "MJ/m²")}`, "Eq. (49)"),
      passo("Em volume:", `${S("V", "GN")} = ${F(N(v.GN_TG), "35,9")} = ${B(v.GN_NM3, "m³/m²", 3)}`, "Eq. (49)"),
      passo("Comparado ao ciclo 0, que queimava todo o calor em gás natural:", `${S("V", "GN,0")} = ${F(N(v.Q_T0), "35,9")} = ${B(v.V_GN0, "m³/m²", 3)} ⇒ −${nf(v.RED_GN * 100, 0)}%`, "Eq. (26)"),
      sec("Emissões"),
      passo("Fator de emissão de 56,1 kg CO₂/GJ:", `${S("CO₂", "P")} = ${N(v.GN_TG)} × 0,0561 = ${B(v.CO2_P, "kg/m²")}`, "Eq. (82)", "IPCC (2006)")],
    dia: v => [["gás natural", `${txt("nm3", v.GN_DIA)}/dia`], ["CO₂", dia.massa(v.CO2_P)]] },
  trc: { icone: "≋", nome: "Trocador gás-gás", desc: "A exaustão do forno aquece ar limpo, que vai para o secador.",
    energia: v => [["calor entregue ao ar", v.TRC, COR.trc, "MJ<sub>t</sub>/m²"]],
    massaTxt: v => [["ar aquecido", `${N(v.M_TRC, 1)} kg/m² a 150 °C`], ["exaustão do forno", `${N(v.M_EXA, 1)} kg/m²`]],
    cond: v => ["ε = 85%", `exaustão 200 → ${N(v.T_FOR_OUT, 0)} °C`, "acima do orvalho ácido"],
    contas: v => [sec("Calor"),
      passo("O trocador fornece o que falta no secador:", `${S("Q", "trc")} = ${N(v.Q_SEC)} − ${N(v.AR_SEC)} = ${B(v.TRC, MJt)}`, "Eq. (56)"),
      passo("Com rendimento de 85% (fração do calor cedido que chega ao ar), a exaustão cede:", `${F(S("Q", "trc"), "ε")} = ${F(N(v.TRC), "0,85")} = ${B(v.TRC / v.EF_TRC, MJt)}`, "Seção 7.5", "ε: hipótese"),
      passo("A exaustão do forno a O₂ (ar de processo + vapor) esfria para:", `${S("T", "saída")} = 200 − ${F(N(v.TRC / v.EF_TRC) + " × 1000", N(v.M_AR_PROC) + " × 1,05 + " + N(v.H2O_FOR) + " × 1,90")} = ${B(v.T_FOR_OUT, "°C", 0)}`, "Eq. (63)")],
    dia: v => [["calor entregue", dia.calor(v.TRC)], ["ar aquecido", dia.massa(v.M_TRC)]] },
};


/* ── ciclo 0: o que muda em cada elemento ── */
const gnPasso = (q, v, qx = q) => [passo("Volume de gás natural:", `${S("V", "GN")} = ${F(N(q), "35,9")} = ${B(qx / v.PCI_GN, "m³/m²", 3)}`, "Eq. (26)", "PCI: hipótese (Seção 3.4)"),
  passo("Emissão direta (56,1 kg CO₂/GJ):", `${S("CO₂", "1")} = ${N(q)} × 0,0561 = ${B(q * v.FE_GN, "kg/m²")}`, "Eq. (33)", "IPCC (2006)")];
const EL0 = {
  s5: { ...EL.s5, desc: "A barbotina é pulverizada em gás quente de um queimador a gás natural.",
    term: v => [["gás natural", v.Q_AT, COR.gn]],
    cond: v => ["queimador a gás natural", "gás a 550 °C na entrada", "exaustão a 105 °C", "bicos a 30 bar"],
    contas: v => [sec("Demanda"), ...EL.s5.contas(v).slice(1, 4), sec("Gás natural"), ...gnPasso(v.Q_AT, v, v.Q_T0 * v.FR_AT), sec("Energia elétrica"), elePasso("s5", v), co2Rede("s5", v)],
    dia: v => [["calor", dia.calor(v.Q_AT)], ["gás natural", `${txt("nm3", v.Q_AT / v.PCI_GN * ST.P)}/dia`], ["CO₂", `${txt("massa", v.Q_AT * v.FE_GN * ST.P)}/dia`], ["água evaporada", dia.massa(v.EV_AT)]] },
  s8: { ...EL.s8, desc: "Secador vertical aquecido por um queimador a gás natural.",
    term: v => [["gás natural", v.Q_SEC, COR.gn]],
    cond: v => ["queimador a gás natural", "150 a 220 °C", "exaustão a 110 °C", "umidade final de 0,3%"],
    contas: v => [sec("Demanda"), ...EL.s8.contas(v).slice(1, 3), sec("Gás natural"), ...gnPasso(v.Q_SEC, v, v.Q_T0 * v.FR_SEC), sec("Energia elétrica"), elePasso("s8", v), co2Rede("s8", v)],
    dia: v => [["calor", dia.calor(v.Q_SEC)], ["gás natural", `${txt("nm3", v.Q_SEC / v.PCI_GN * ST.P)}/dia`], ["CO₂", `${txt("massa", v.Q_SEC * v.FE_GN * ST.P)}/dia`], ["água evaporada", dia.massa(v.EV_SEC)]] },
  s10: { ...EL.s10, desc: "Forno a rolos com queimadores a gás natural e ar; a exaustão e o ar de resfriamento vão para a atmosfera.",
    term: v => [["gás natural com ar", v.Q_FOR0, COR.gn]],
    cond: v => ["1.180 a 1.220 °C", "queimadores a gás com ar (λ = 1,15)", "exaustão a 200 °C descartada", "ar de resfriamento descartado"],
    contas: v => {
      const qprod = v.M_P * 1.0 * (40 - 25) / 1000, qpar = v.Q_FOR0 - v.Q_EXA0 - v.Q_RES0 - 1.5 - qprod;
      return [sec("Demanda"), EL.s10.contas(v)[1], sec("Gás natural"), ...gnPasso(v.Q_FOR0, v, v.Q_T0 * v.FR_FOR),
        sec("Destino da energia do forno"),
        EL.s10.contas(v)[2],
        passo("O produto sai a cerca de 40 °C:", `${S("Q", "prod")} = 22,00 × 1,0 × (40 − 25)/1000 = ${B(qprod, MJt)}`, "Eq. (30)"),
        passo("Paredes e radiação, por diferença (reações endotérmicas de 1,50 MJ<sub>t</sub>/m²):", `${S("Q", "par")} = ${N(v.Q_FOR0)} − ${N(v.Q_EXA0)} − ${N(v.Q_RES0)} − 1,50 − ${N(qprod)} = ${B(qpar, MJt)}`, "Eq. (31)", "endotérmicas: hipótese"),
        passo("No ciclo 0, exaustão e ar de resfriamento são descartados:", `${N(v.Q_EXA0)} + ${N(v.Q_RES0)} = ${B(v.Q_EXA0 + v.Q_RES0, MJt)}`, "Seção 5.3"),
        passo("Vazão da exaustão (200 °C):", `${S("m", "exa")} = ${F(N(v.Q_EXA0) + " × 1000", "1,05 × (200 − 25)")} = ${B(v.M_FOR_GN, "kg/m²")}`, "Eq. (38)"),
        sec("Massa"), EL.s10.contas(v).find(p => p.ref === "Eqs. (7) e (15)"),
        sec("Energia elétrica"), elePasso("s10", v), co2Rede("s10", v)];
    },
    dia: v => [["calor do forno", dia.calor(v.Q_FOR0)], ["gás natural", `${txt("nm3", v.Q_FOR0 / v.PCI_GN * ST.P)}/dia`], ["calor descartado", `${txt("energia", (v.Q_EXA0 + v.Q_RES0) * ST.P)}/dia`], ["CO₂", `${txt("massa", v.Q_FOR0 * v.FE_GN * ST.P)}/dia`]] },
  gn: { icone: "GN", nome: "Gás natural · ciclo 0", desc: "No ciclo 0, todo o calor da fábrica vem da queima de gás natural.",
    energia: v => [["forno", v.Q_FOR0, "#B91C1C", "MJ<sub>t</sub>/m²"], ["atomizador", v.Q_AT, COR.esc, "MJ<sub>t</sub>/m²"], ["secador", v.Q_SEC, COR.trc, "MJ<sub>t</sub>/m²"], ["total", v.Q_T0, COR.gn, "MJ<sub>t</sub>/m²"]],
    massaTxt: v => [["volume", `${N(v.V_GN0, 3)} m³/m²`], ["CO₂ direto", `${N(v.CO2_S1)} kg/m²`]],
    cond: v => ["PCI de 35,9 MJ/m³ (20 °C)", "88% do consumo total", "forno, atomizador e secador"],
    contas: v => [sec("Consumo da indústria de referência"),
      passo("Consumo específico consolidado de 0,12 GJ/m² (33,33 kWh/m²):", `${S("E", "tot")} = 33,33 × 3,6 = ${B(v.E_TOT, "MJ/m²")}`, "Eq. (23)", "Portobello (2026)"),
      passo("Fração térmica de 88%:", `${S("Q", "t,0")} = 0,88 × ${N(v.E_TOT)} = ${B(v.Q_T0, MJt)}`, "Eq. (24)", "adotada; conferida com Portobello (2026)"),
      passo("Repartição entre as operações (52% / 37,5% / 10,5%):", `forno ${B(v.Q_FOR0, "")} · atomizador ${B(v.Q_AT, "")} · secador ${B(v.Q_SEC, MJt)}`, "Tabela 5", "grupo: meio das faixas consideradas realistas por Rigobelo (2026)"),
      passo("Volume de gás natural:", `${S("V", "GN,0")} = ${F(N(v.Q_T0), "35,9")} = ${B(v.V_GN0, "m³/m²", 3)}`, "Eq. (26)"),
      passo("Emissão direta (escopo 1):", `${S("CO₂", "1")} = ${N(v.Q_T0)} × 0,0561 = ${B(v.CO2_S1, "kg/m²")}`, "Eq. (33)", "IPCC (2006)"),
      aviso("O ciclo 0 é uma indústria de referência sem reaproveitamento: a unidade de Tijucas, de onde vêm o consumo específico e o do moinho, já reaproveita parte do ar de resfriamento (Rigobelo, 2026) e atende 73,5% do consumo elétrico com autoprodução eólica (Portobello, 2026).")],
    dia: v => [["gás natural", `${txt("nm3", v.V_GN0 * ST.P)}/dia`], ["calor", `${txt("energia", v.Q_T0 * ST.P)}/dia`], ["CO₂ direto", `${txt("massa", v.CO2_S1 * ST.P)}/dia`]] },
  rede0: { icone: "⚡", nome: "Rede elétrica (SIN)", desc: "No ciclo 0, toda a eletricidade da fábrica é comprada da rede.",
    energia: v => [["eletricidade da rede", v.E_E0, COR.el, "MJ<sub>e</sub>/m²"], ["dos quais, moagem", v.E_MOAG, "#60A5FA", "MJ<sub>e</sub>/m²"]],
    massaTxt: v => [["por m²", `${N(v.E_E0 / 3.6)} kWh`], ["CO₂ (escopo 2)", `${N(v.CO2_S2)} kg/m²`]],
    cond: v => ["fator do SIN 2023: 0,0385 kg/kWh", "2021 (ano seco): 0,1264 kg/kWh"],
    contas: v => [sec("Consumo"),
      passo("Os 12% restantes do consumo consolidado são eletricidade:", `${S("E", "e,0")} = ${N(v.E_TOT)} − ${N(v.Q_T0)} = ${B(v.E_E0, MJe)} = ${B(v.E_E0 / 3.6, "kWh/m²")}`, "Eq. (25)", "Portobello (2026)"),
      EL.s3.contas(v)[1],
      passo("O restante é rateado entre as demais etapas (estimativa):", `${N(v.E_E0)} − ${N(v.E_MOAG)} = ${B(v.E_E0 - v.E_MOAG, MJe)}`, "Figura 3", "rateio estimado"),
      sec("Emissões"),
      passo("Escopo 2, com o fator médio do SIN em 2023:", `${S("CO₂", "2")} = ${F(N(v.E_E0), "3,6")} × 0,0385 = ${B(v.CO2_S2, "kg/m²")}`, "Eq. (34)", "Brasil (2024c)"),
      passo("Com o fator de 2021 (ano seco):", `${F(N(v.E_E0), "3,6")} × 0,1264 = ${B(v.E_E0 / 3.6 * 0.1264, "kg/m²")}`, "Seção 5.5"),
      aviso("Na unidade de Tijucas, 73,5% da eletricidade vem de autoprodução eólica (Portobello, 2026); o ciclo 0 usa o fator médio do SIN para medir separadamente o efeito de cada medida.")],
    dia: v => [["eletricidade", `${txt("eletr", v.E_E0 / 3.6 * ST.P)}/dia`], ["potência média", txt("pot", v.E_E0 * ST.P / 86.4)], ["CO₂ (escopo 2)", `${txt("massa", v.CO2_S2 * ST.P)}/dia`]] },
};
const pegaEl = k => (MODO === "0" && EL0[k]) || EL[k];

/* ── janelas globais (destaques, energia, emissões, FV) ── */
const GLOB = {
  co2: { ey: "Emissões", nome: "CO₂: ciclo 0 × ciclo proposto", desc: "Emissões diretas (escopo 1) e da eletricidade comprada (escopo 2), por m² de porcelanato.",
    contas: v => [sec("Ciclo 0"),
      passo("Gás natural (56,1 kg CO₂/GJ):", `${S("CO₂", "1")} = ${N(v.Q_T0)} × 0,0561 = ${B(v.CO2_S1, "kg/m²")}`, "Eq. (33)", "IPCC (2006)"),
      passo("Rede elétrica, fator médio do SIN em 2023:", `${S("CO₂", "2")} = ${F(N(v.E_E0), "3,6")} × 0,0385 = ${B(v.CO2_S2, "kg/m²")}`, "Eq. (34)", "Brasil (2024c)"),
      passo("Total do ciclo 0:", `${S("CO₂", "0")} = ${N(v.CO2_S1)} + ${N(v.CO2_S2)} = ${B(v.CO2_0, "kg/m²")}`, "Eq. (35)"),
      sec("Ciclo proposto"),
      passo("Sem rede elétrica; só o gás natural da turbina emite:", `${S("CO₂", "P")} = ${N(v.GN_TG)} × 0,0561 = ${B(v.CO2_P, "kg/m²")}`, "Eq. (82)"),
      passo("Redução:", `Δ = 1 − ${F(N(v.CO2_P), N(v.CO2_0))} = ${B(v.RED_CO2 * 100, "%", 1)}`, "Eq. (83)"),
      passo("Com o fator do SIN de 2021 (ano seco, 0,1264 kg/kWh), a referência sobe e a redução também:", `Δ = 1 − ${F(N(v.CO2_P), N(v.CO2_S1 + v.E_E0 / 3.6 * 0.1264))} = ${B((1 - v.CO2_P / (v.CO2_S1 + v.E_E0 / 3.6 * 0.1264)) * 100, "%", 1)}`, "Seção 8.1"),
      sec("Fora do gate-to-gate"),
      passo("Ciclo de vida da fotovoltaica (mediana de 48 g CO₂e/kWh), sobre a energia gerada, que inclui 3% de perdas na rede:", `${S("CO₂", "FV")} = ${N(v.E_PV_M2)} × ${N(1 + v.PERDAS, 2)} × 0,048 = ${B(v.CO2_FV, "kg/m²")} · por kg de H₂: 58 × ${N(1 + v.PERDAS, 2)} × 0,048 = ${B(58 * (1 + v.PERDAS) * 0.048, "kg")}`, "Eqs. (85)–(86)", "Schlömer et al. (2014)"),
      aviso("2,87 kg CO₂e por kg de H₂ fica abaixo do limite de 7 kg CO₂e/kg de H₂ da Lei nº 14.948/2024 (Brasil, 2024a) para hidrogênio de baixa emissão. Como a energia passa pela rede, a conta vale por balanço anual entre o que o campo gera e o que o eletrolisador consome.")],
    dia: v => [["ciclo 0", `${txt("massa", v.CO2_0_DIA)}/dia`], ["ciclo proposto", `${txt("massa", v.CO2_DIA)}/dia`], ["evitado por ano", `${txt("massa", (v.CO2_0_DIA - v.CO2_DIA) * 365)}`]] },
  h2gn: { ey: "Combustíveis", nome: "Hidrogênio e gás natural", desc: "Consumo por m² e na produção escolhida.",
    contas: v => [...EL.h2t.contas(v).slice(0, 2), ...EL.gn.contas(v).slice(1, 3),
      sec("Na produção escolhida"),
      passo("Hidrogênio por dia:", `${N(v.H2_TOT, 4)} × ${nf(ST.P, 0)} = <b>${txt("massa", v.H2_DIA)}</b>/dia`, "Eq. (64) × P"),
      passo("Gás natural por dia:", `${N(v.GN_NM3, 4)} × ${nf(ST.P, 0)} = <b>${txt("nm3", v.GN_DIA)}</b>/dia`, "Eq. (49) × P")],
    dia: v => [["H₂", `${txt("massa", v.H2_DIA)}/dia`], ["gás natural", `${txt("nm3", v.GN_DIA)}/dia`], ["O₂ para venda", `${txt("massa", v.O2_VENDA_DIA)}/dia`]] },
  fv: { ey: "Sistema à parte", nome: "Eletrolisador alcalino e campo fotovoltaico", desc: "Fora do balanço da fábrica, como pede o projeto. Valores na produção escolhida.",
    contas: v => [sec("Eletrolisador"),
      passo("Eletrolisador alcalino, com 58 kWh/kg: a IEA dá 58% de eficiência (PCI) na China em 2024, ou 57,5 kWh/kg; a compressão leva ao estoque só o excedente e soma cerca de 0,13 kWh/kg na média; arredondado para cima:", `${S("e", "IEA")} = ${F("120", "0,58 × 3,6")} = 57,5 kWh/kg · ${S("e", "ELZ")} = ${B(v.KWH_KG, "kWh/kg", 0)}`, "Seção 7.8", "IEA (2025)"),
      passo("Eletricidade por m² e por dia:", `${S("E", "ELZ")} = ${N(v.H2_TOT, 4)} × 58 = ${B(v.E_PV_M2, "kWh/m²")} · ${S("E", "ELZ,dia")} = ${N(v.E_PV_M2)} × ${nf(ST.P, 0)} = <b>${txt("eletr", v.E_ELZ)}</b>/dia`, "Eq. (71)"),
      passo("Potência média (24 h):", `${S("P", "ELZ,méd")} = ${F(S("E", "ELZ,dia"), "24")} = <b>${txt("pot", v.P_MED)}</b>`, "Eq. (72)"),
      passo("O campo e o eletrolisador são ligados à rede: o campo vende a sobra do meio-dia e o eletrolisador compra de volta à noite. Ele para só na ponta da Celesc (18h30 às 21h30) nos dias úteis, 21,86 h por dia na média, com 95% de disponibilidade:", `${S("P", "ELZ,inst")} = ${F(S("E", "ELZ,dia"), "21,86 h × 0,95")} = <b>${txt("pot", v.P_INST)}</b> · fator de capacidade ${nf(v.P_MED / v.P_INST * 100, 0)}%`, "Eq. (73)", "ANEEL (2026), REH 3.602, Art. 12"),
      sec("Campo fotovoltaico leste-oeste"),
      passo("Adotaram-se 1.300 kWh/kWp·ano para placas ao norte em SC (a Canal Solar dá de 1.222 a 1.423) e a perda de 12,5% do leiaute leste-oeste, meio da faixa de 10% a 15%:", `${S("Y", "LO")} = 1.300 × (1 − 0,125) = ${B(v.Y_LO, "kWh/(kWp·ano)", 1)}`, "Eq. (74)", "Canal Solar (2022); PV Magazine USA (2021)"),
      passo(`Potência do campo: ligado à rede, nada é cortado; o campo gera a energia do ano mais ${nf(v.PERDAS * 100, 0)}% de perdas na rede (hipótese):`, `${S("P", "FV")} = ${F(S("E", "ELZ,dia") + " × 365 × " + N(1 + v.PERDAS, 2), S("Y", "LO"))} = <b>${txt("potp", v.P_FV)}</b>`, "Eq. (75)"),
      passo("Placas de 620 Wp (2,382 × 1,134 m):", `${S("N")} = ${F(S("P", "FV"), "620 Wp")} = <b>${txt("qtd", v.N_PLACAS)}</b> placas · ${S("A", "placas")} = <b>${txt("area", v.A_PLACAS)}</b>`, "Eqs. (76)–(77)"),
      passo("Terreno, com 1,35 MWp/ha no leiaute leste-oeste:", `${S("A", "terreno")} = ${F(S("P", "FV"), S("D", "LO"))} = <b>${txt("area", v.A_TER)}</b> ≈ ${sig(v.N_CAMPOS)} campos de futebol`, "Eq. (78)", "PV Magazine USA (2021)"),
      passo("Por m²/dia de produção (vale para qualquer escala):", `${S("p", "FV")} = ${F(N(v.E_PV_M2) + " × 365 × " + N(1 + v.PERDAS, 2), N(v.Y_LO, 1))} = ${B(v.KWP_M2, "kWp por m²/dia")} ≈ ${nf(v.KWP_M2 * 1000 / 620, 0)} placas e ${nf(v.KWP_M2 / 1.35 * 10, 0)} m² de terreno`, "Eq. (79)")],
    dia: v => [["campo FV", txt("potp", v.P_FV)], ["terreno", txt("area", v.A_TER)], ["eletrolisador", `${txt("pot", v.P_MED)} médios`], ["instalado", txt("pot", v.P_INST)]] },
  fech: { ey: "Balanço de energia", nome: "Fechamento de energia do ciclo proposto", desc: "A energia que entra na planta iguala a demanda térmica dos processos mais a eletricidade gerada.",
    contas: v => [sec("Fechamento"),
      passo("Entradas: H₂, gás natural e calor recuperado do forno; saídas: forno, atomizador, secador e eletricidade:", `${S("m", "H₂")} PCI + ${S("F", "GN")} + ${S("Q", "rec")} = ${S("Q", "F")} + ${S("Q", "at")} + ${S("Q", "sec")} + ${S("E", "e")}`, "Eq. (81)"),
      passo("Substituindo:", `${N(v.H2_TOT * 120)} + ${N(v.GN_TG)} + ${N(v.REC_TOT)} = ${N(v.Q_F)} + ${N(v.Q_AT)} + ${N(v.Q_SEC)} + ${N(v.E_TG)}`, "Eq. (81)"),
      passo("Resultado:", `${B(v.ENT_TOT, "", 1)} = ${B(v.USO_TOT, "MJ/m²", 1)}`, "Eq. (81)"),
      sec("Energia total"),
      passo("Energia comprada pela fábrica (H₂ + gás natural) contra 119,99 MJ/m² do ciclo 0:", `${N(v.H2_TOT * 120)} + ${N(v.GN_TG)} = ${B(v.ENT_FAB, "MJ/m²")} (${nf((v.ENT_FAB / v.E_TOT - 1) * 100, 0)}%)`, "Seção 8.3"),
      passo("Contando a eletricidade da FV no lugar do H₂:", `${S("E", "total,P")} = ${N(v.GN_TG)} + 3,6 × ${N(v.E_PV_M2)} = ${B(v.GN_TG + 3.6 * v.E_PV_M2, "MJ/m²")} (+${nf(((v.GN_TG + 3.6 * v.E_PV_M2) / v.E_TOT - 1) * 100, 0)}%)`, "Eq. (84)"),
      aviso("A troca é de energia fóssil por renovável, com perdas na eletrólise e na reconversão do H₂ em calor e eletricidade.")],
    dia: v => [["energia que entra", `${txt("energia", v.ENT_TOT * ST.P)}/dia`], ["calor recuperado", `${txt("energia", v.REC_TOT * ST.P)}/dia`], ["eletricidade gerada", `${txt("eletr", v.E_TG * ST.P / 3.6)}/dia`]] },
};
GLOB.rede = { ...EL.tg, ey: "Eletricidade", nome: "0 kWh da rede", desc: "A turbina a gás gera toda a eletricidade da planta, inclusive os ventiladores da recuperação de calor." };

/* ═══════════════════════ cartão do hover ═══════════════════════ */
const planta = $("#planta"), cartao = $("#cartao"), pcard = $(".planta-card");
let cartaoAtual = null, timerSai = null;
function linhaE(rot, val, cor, un, k) {
  return `<div class="linha"><span><i style="background:${cor}"></i>${rot}</span><a class="clic" data-abre="${k}">${nf(val)} <small>${un}</small></a></div>`;
}
function preencheCartao(k) {
  const e = pegaEl(k), v = ST.v; let h = "";
  const corIc = { tg: "#E08A1E", rede0: "#1D4ED8", h2t: "#C0392B", o2t: "#4FA3D9", gn: "#A0522D", trc: "#7C3AED" }[k];
  h += `<div class="topo"><div class="n${e.icone ? " icone" : ""}"${corIc ? ` style="background:${corIc}"` : ""}>${e.icone || e.n}</div><h4>${e.nome}</h4></div><p class="desc">${e.desc}</p>`;
  // energia
  let en = "";
  if (e.term) {
    const t = e.term(v); const tot = t.reduce((a, x) => a + x[1], 0);
    t.forEach(([r, x, c]) => en += linhaE(r, x, c, "MJ<sub>t</sub>/m²", k));
    if (t.length > 1) en += `<div class="linha"><span class="total-t">calor total</span><a class="clic" data-abre="${k}">${nf(tot)} <small>MJ<sub>t</sub>/m²</small></a></div>`;
    en += `<div class="dia">na produção: ${dia.calor(tot)}</div>`;
  }
  if (e.energia) e.energia(v).forEach(([r, x, c, un]) => en += linhaE(r, x, c, un, k));
  if (k.startsWith("s")) {
    const ee = eleDe(k, v);
    en += linhaE("eletricidade", ee, COR.el, "MJ<sub>e</sub>/m²", k);
    en += `<div class="dia">na produção: ${dia.eletr(ee)}</div>`;
  }
  if (en) h += `<div class="bloco"><b>Energia${MODO === "0" ? " · ciclo 0" : ""}</b>${en}</div>`;
  if (MODO === "0" && k.startsWith("s")) {
    const gnq = e.term ? e.term(v).reduce((a, x) => a + x[1], 0) : 0, co2 = gnq * v.FE_GN + eleDe(k, v) / 3.6 * v.FE_SIN;
    h += `<div class="bloco"><b>CO₂ · ciclo 0</b><div class="linha"><span>${gnq ? "gás natural + rede" : "eletricidade da rede"}</span><a class="clic" data-abre="${k}">${nf(co2, co2 < .1 ? 3 : 2)} <small>kg/m²</small></a></div><div class="dia">na produção: ${txt("massa", co2 * ST.P)}/dia</div></div>`;
  }
  // massa
  if (e.massa) {
    const [a, b, nota] = e.massa(v);
    h += `<div class="bloco"><b>Massa</b><div class="linha"><span>entra → sai</span><a class="clic" data-abre="${k}">${nf(a)} → ${nf(b)} <small>kg/m²</small></a></div>
      <div class="dia">${txt("massa", a * ST.P)} → ${txt("massa", b * ST.P)} por dia · ${nota}</div></div>`;
  }
  if (e.massaTxt) h += `<div class="bloco"><b>Massa e vazões</b>${e.massaTxt(v).map(([r, t]) => `<div class="linha"><span>${r}</span><a class="clic" data-abre="${k}">${t}</a></div>`).join("")}</div>`;
  h += `<div class="bloco"><b>Condições</b><div class="cond">${e.cond(v).map(c => `<span>${c}</span>`).join("")}</div></div>`;
  h += `<div class="vercontas"><em>clique em qualquer número</em><a data-abre="${k}">Ver as contas ›</a></div>`;
  cartao.innerHTML = h;
}
function posicionaCartao(g) {
  const r = g.getBoundingClientRect(), c = pcard.getBoundingClientRect();
  const w = cartao.offsetWidth, hgt = cartao.offsetHeight;
  let x = r.right - c.left + 14, y = r.top - c.top + r.height / 2 - hgt / 2;
  if (x + w > c.width - 8) x = r.left - c.left - w - 14;
  if (x < 8) {   // não cabe ao lado: vai para cima ou para baixo, centrado
    x = Math.max(8, Math.min(c.width - w - 8, r.left - c.left + r.width / 2 - w / 2));
    y = (r.top - c.top - hgt - 12 >= 8) ? r.top - c.top - hgt - 12 : r.bottom - c.top + 12;
  }
  y = Math.max(8, Math.min(c.height - hgt - 8, y));
  cartao.style.left = x + "px"; cartao.style.top = y + "px";
}
function foca(k) {
  clearTimeout(timerSai);
  cartaoAtual = k;
  planta.classList.add("foco");
  $$(".st,.eq", planta).forEach(g => g.classList.toggle("on", g.dataset.id === k));
  $$(".tubo", planta).forEach(t => t.classList.toggle("on", (t.dataset.k || "").split(" ").includes(k)));
  preencheCartao(k);
  posicionaCartao($(`[data-id="${k}"]`, planta));
  cartao.classList.add("ver");
}
function desfoca() {
  cartaoAtual = null;
  planta.classList.remove("foco");
  $$(".on", planta).forEach(g => g.classList.remove("on"));
  cartao.classList.remove("ver");
}
$$(".st,.eq", planta).forEach(g => {
  g.setAttribute("tabindex", "0");
  g.addEventListener("pointerenter", ev => { if (ev.pointerType !== "touch") foca(g.dataset.id); });
  g.addEventListener("pointerleave", ev => { if (ev.pointerType !== "touch") timerSai = setTimeout(desfoca, 240); });
  g.addEventListener("click", ev => {
    if (ev.pointerType === "touch" || (ev.detail === 0)) { foca(g.dataset.id); return; }
    abreModal(g.dataset.id);
  });
  g.addEventListener("focus", () => foca(g.dataset.id));
  g.addEventListener("keydown", ev => { if (ev.key === "Enter") abreModal(g.dataset.id); });
});
cartao.addEventListener("pointerenter", () => clearTimeout(timerSai));
cartao.addEventListener("pointerleave", () => { timerSai = setTimeout(desfoca, 240); });
document.addEventListener("click", ev => {
  const a = ev.target.closest("[data-abre]");
  if (a) { ev.preventDefault(); abreModal(a.dataset.abre); return; }
  if (cartaoAtual && !ev.target.closest(".cartao") && !ev.target.closest("#planta")) desfoca();
});

/* ═══════════════════════ janela das contas ═══════════════════════ */
const modal = $("#modal"), janela = $("#janela");
let modalAtual = null;
function abreModal(k, soAtualiza) {
  const e = pegaEl(k) || GLOB[k]; if (!e) return;
  const v = ST.v; modalAtual = k;
  let contas = e.contas(v);
  if (MODO === "0" && EL[k] && !EL0[k] && k.startsWith("s")) contas = [...contas, co2Rede(k, v)];
  let h = `<button class="fechar" aria-label="Fechar">×</button>`;
  h += `<div class="ey">${e.ey || (e.n ? "Etapa " + e.n : "Sistema energético")}${MODO === "0" && (EL[k] || EL0[k]) ? " · ciclo 0" : ""}</div><h3>${e.nome}</h3><p class="lead">${e.desc}</p>`;
  h += `<div class="dia-box">${e.dia(v).map(([r, t]) => `<div>${r}<b>${t}</b></div>`).join("")}<div>produção escolhida<b>${nf(ST.P, 0)} m²/dia</b></div></div>`;
  contas.forEach(p => {
    if (p.h) h += `<h5>${p.h}</h5>`;
    else if (p.aviso) h += `<div class="aviso">${p.aviso}</div>`;
    else h += `<div class="passo"><div class="t">${p.t}</div><div class="ref">${p.ref ? `<span class="eqn">${p.ref}</span>` : ""}${p.src ? `<br>${p.src}` : ""}</div><div class="eq">${p.eq}</div></div>`;
  });
  h += `<h5>Origem</h5><p class="fontes">${e.origem || `Equações numeradas como no memorial de cálculo do Grupo 3. Dados de processo cedidos pela Portobello (uso acadêmico); os demais vêm da literatura citada ou são hipóteses indicadas.`}</p>`;
  const sc = janela.scrollTop;
  janela.classList.toggle("atualiza", !!soAtualiza);   // ao atualizar com a janela aberta, o conteúdo não entra de novo em cascata
  janela.innerHTML = h;
  if (soAtualiza) { janela.scrollTop = sc; return; }
  janela.scrollTop = 0;
  if (!modal.classList.contains("aberta")) origemJanela();
  modal.classList.add("aberta"); document.body.style.overflow = "hidden";
}
function fechaModal() { modal.classList.remove("aberta"); modalAtual = null; document.body.style.overflow = ""; }
modal.addEventListener("click", ev => { if (ev.target === modal || ev.target.closest(".fechar")) fechaModal(); });
document.addEventListener("keydown", ev => { if (ev.key === "Escape") { if (modalAtual) fechaModal(); else desfoca(); } });

/* ═══════════════════════ destaques da abertura ═══════════════════════ */
liga($("#k-co2"), v => v.RED_CO2 * 100, x => `−${nf(x, 0)}<small>%</small>`);
liga($("#k-co2d"), v => v.CO2_DIA, x => `<b>${txt("massa", x)}</b> de CO₂ por dia`);
liga($("#k-co2c"), v => v.CO2_0_DIA, x => `contra ${txt("massa", x)} no ciclo 0`);
liga($("#k-rede"), v => 0, x => `0<small>kWh</small>`);
liga($("#k-tg"), v => v.P_TG, x => `turbina de <b>${txt("pot", x)}</b> gera tudo`);
liga($("#k-h2"), v => v.H2_DIA, x => html("massa", x));
liga($("#k-gn"), v => v.GN_DIA, x => `de H₂ por dia · <b>${txt("nm3", x)}</b> de gás natural`);
liga($("#k-fv"), v => v.A_TER, x => html("area", x));
liga($("#k-elz"), v => v.P_MED, x => `de FV · eletrolisador de <b>${txt("pot", x)}</b> médios`);
liga($("#k-elz2"), v => v.P_INST, x => `${txt("pot", x)} instalados, ligado à rede`);

/* ═══════════════════════ balanço de energia ═══════════════════════ */
const ENT = [["H₂", v => v.H2_TOT * 120, "#C0392B"], ["gás natural", v => v.GN_TG, "#A0522D"], ["recuperado", v => v.REC_TOT, "#15803D"]];
const USO = [["forno", v => v.Q_F, "#B91C1C"], ["atomizador", v => v.Q_AT, "#E08A1E"], ["secador", v => v.Q_SEC, "#7C3AED"], ["eletricidade", v => v.E_TG, "#1D4ED8"]];
function montaTrilho(el, lista) {
  el.innerHTML = lista.map(([n, f, c], i) => `<div class="seg" data-abre="fech" style="background:${c}"><b>${n}</b><small id="${el.id}-${i}"></small></div>`).join("");
  lista.forEach(([n, f], i) => liga($(`#${el.id}-${i}`), f, x => `${nf(x)} MJ/m²`));
}
montaTrilho($("#tr-ent"), ENT); montaTrilho($("#tr-uso"), USO);
function larguras() {
  const v = ST.v, tot = v.ENT_TOT;
  $$("#tr-ent .seg").forEach((s, i) => s.style.width = (ENT[i][1](v) / tot * 100) + "%");
  $$("#tr-uso .seg").forEach((s, i) => s.style.width = (USO[i][1](v) / tot * 100) + "%");
}
liga($("#e-tit"), v => v.ENT_TOT, x => `${nf(x, 1)} MJ entram.<br>${nf(x, 1)} MJ são usados.`);
liga($("#e-ent"), v => v.ENT_TOT, x => `${nf(x, 2)} MJ/m²`);
liga($("#e-uso"), v => v.USO_TOT, x => `${nf(x, 2)} MJ/m²`);
liga($("#e-dia"), v => v.ENT_TOT * ST.P, x => `${txt("energia", x)} por dia na produção escolhida`);
liga($("#n-fab"), v => v.ENT_FAB, x => `${nf(x)}<small>MJ/m²</small>`);
liga($("#n-fos"), v => v.GN_TG, x => `${nf(x)}<small>MJ/m²</small>`);
liga($("#n-tot"), v => v.GN_TG + 3.6 * v.E_PV_M2, x => `${nf(x)}<small>MJ/m²</small>`);

/* ═══════════════════════ emissões ═══════════════════════ */
function emissoes(anima) {
  const v = ST.v, H = 300, k = H / 6.5;
  $("#col0 .pilha").innerHTML = `<div style="height:${v.CO2_S1 * k}px;background:#6B7280"></div><div style="height:${v.CO2_S2 * k}px;background:#93C5FD"></div>`;
  $("#colP .pilha").innerHTML = `<div style="height:${v.CO2_P * k}px;background:#15803D"></div><div style="height:${v.CO2_FV * k}px;background:repeating-linear-gradient(45deg,rgba(21,128,61,.18) 0 6px,rgba(21,128,61,.05) 6px 12px);border:1.5px dashed #15803D;border-bottom:0;border-radius:12px 12px 0 0"></div>`;
  if (anima) { $("#col0 .pilha").style.height = (v.CO2_0 * k) + "px"; $("#colP .pilha").style.height = ((v.CO2_P + v.CO2_FV) * k) + "px"; }
}
liga($("#c0v"), v => v.CO2_0, x => `${nf(x)}<small> kg/m²</small>`);
liga($("#cPv"), v => v.CO2_P, x => `${nf(x)}<small> kg/m²</small>`);
liga($("#em-red"), v => v.RED_CO2 * 100, x => `−${nf(x, 0)}%`);
liga($("#em-0"), v => v.CO2_0_DIA, x => `${txt("massa", x)}/dia · ${txt("massa", x * 365)}/ano`);
liga($("#em-p"), v => v.CO2_DIA, x => `${txt("massa", x)}/dia · ${txt("massa", x * 365)}/ano`);
liga($("#em-ev"), v => v.CO2_0_DIA - v.CO2_DIA, x => `${txt("massa", x)}/dia · ${txt("massa", x * 365)}/ano`);

/* ═══════════════════════ sistema à parte: estatísticas ═══════════════════════ */
liga($("#f-mwp"), v => v.P_FV, x => html("potp", x));
liga($("#f-placas"), v => v.N_PLACAS, x => `${txt("qtd", x)} placas de 620 Wp · ${txt("area", ST.v.A_PLACAS)} de placas`);
liga($("#f-elz"), v => v.P_MED, x => html("pot", x));
liga($("#f-elz2"), v => v.P_INST, x => `médios (24 h) · ${txt("pot", x)} instalados, ligado à rede e parado só na ponta`);
liga($("#f-h2"), v => v.H2_DIA, x => html("massa", x, "/dia"));
liga($("#f-h2b"), v => v.E_ELZ, x => `${txt("eletr", x)}/dia de eletricidade · 58 kWh/kg`);
liga($("#f-est"), v => v.V_EST, x => html("m3", x));
liga($("#f-agua"), v => v.AGUA_DIA, x => html("litros", x, "/dia"));
liga($("#f-o2"), v => v.O2_DIA, x => html("massa", x, "/dia"));
liga($("#f-o2b"), v => v.O2_VENDA_DIA, x => `${txt("massa", x)}/dia disponíveis para venda`);
liga($("#m-area"), v => v.A_TER, x => html("area", x));
liga($("#m-campos"), v => v.N_CAMPOS, x => x < 1 ? `<b>${nf(x * 100, 0)}%</b> de um campo de futebol` : `<b>${sig(x)}</b> campos de futebol`);

/* ═══════════════════════ mapa em escala ═══════════════════════ */
const mapa = (() => {
  const svg = $("#mapa"), card = $(".mapa-card");
  const NS = "http://www.w3.org/2000/svg";
  let A = ST.v.A_TER, alvoA = A, raf = null;
  const el = (t, a, p = svg) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  svg.innerHTML = `<defs>
    <pattern id="pvRows" patternUnits="userSpaceOnUse" width="4.6" height="40"><rect width="4.6" height="40" fill="#0B1E36"/><rect x=".2" width="2.1" height="40" fill="#1E4E8C"/><rect x="2.3" width="2.1" height="40" fill="#2A63AD"/><rect y="19.6" width="4.6" height=".8" fill="#0B1E36"/></pattern>
    <pattern id="pvDyn" patternUnits="userSpaceOnUse" width="20" height="160"><rect id="pd0" width="20" height="160" fill="#0B1E36"/><rect id="pd1" x="1" width="9" height="160" fill="#1E4E8C"/><rect id="pd2" x="10" width="9" height="160" fill="#2A63AD"/><rect id="pd3" y="79" width="20" height="2" fill="#0B1E36"/></pattern>
    <radialGradient id="solo" cx=".5" cy=".55" r=".75"><stop offset="0" stop-color="#16324A"/><stop offset="1" stop-color="#0A1622"/></radialGradient>
  </defs>`;
  const fundo = el("rect", { fill: "url(#solo)" });
  const gFV = el("g", {});
  const pv = el("rect", { fill: "url(#pvRows)", stroke: "#7CB7FF", "stroke-width": 1.4, "vector-effect": "non-scaling-stroke" }, gFV);
  const gC = el("g", {});
  const campo = el("rect", { fill: "#2F7D32", stroke: "#fff", "stroke-width": 1.2, "vector-effect": "non-scaling-stroke" }, gC);
  const linhasC = el("path", { fill: "none", stroke: "#fff", "stroke-width": 1, "vector-effect": "non-scaling-stroke", opacity: .9 }, gC);
  const tFV = el("text", { fill: "#DCEBFF", "font-weight": 600 });
  const tC = el("text", { fill: "#C8F0C9", "font-weight": 600 });
  const guia = el("path", { stroke: "#C8F0C9", "stroke-width": 1, "vector-effect": "non-scaling-stroke", fill: "none", opacity: .7 });
  const esc = el("g", {});
  const escL = el("path", { stroke: "#E8E8ED", "stroke-width": 2, "vector-effect": "non-scaling-stroke", fill: "none" }, esc);
  const escT = el("text", { fill: "#E8E8ED", "font-weight": 600 }, esc);
  const nice = x => { const p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  const geo = Aatual => {
    const s = Math.sqrt(Aatual), cw = card.clientWidth || 800, ch = card.clientHeight || 520, asp = cw / ch;
    const g = Math.max(s, 105) * 0.22, W0 = s + g + 105, H0 = Math.max(s, 68);
    return { s, cw, asp, g, W0, H0, req: Math.max(W0 / 0.62, H0 / 0.5 * asp) };
  };
  // zoom em degraus "redondos" (1–2–5): dentro de um degrau o campo cresce visivelmente
  const degrau = req => { const p = Math.pow(10, Math.floor(Math.log10(req))); for (const m of [1, 2, 5, 10]) if (m * p >= req * 0.999) return m * p; return 10 * p; };
  let VW = degrau(geo(A).req);
  function desenha(Aatual) {
    const { s, cw, asp, g, W0, H0 } = geo(Aatual);
    const vw = VW, vh = vw / asp;
    const x0 = -(vw - W0) * 0.5, y0 = -H0 - (vh - H0) * 0.6;
    svg.setAttribute("viewBox", `${x0} ${y0} ${vw} ${vh}`);
    fundo.setAttribute("x", x0); fundo.setAttribute("y", y0); fundo.setAttribute("width", vw); fundo.setAttribute("height", vh);
    pv.setAttribute("x", 0); pv.setAttribute("y", -s); pv.setAttribute("width", s); pv.setAttribute("height", s);
    const pxm = cw / vw;   // pixels por metro
    if (4.6 * pxm >= 3.2) pv.setAttribute("fill", "url(#pvRows)");
    else {   // passo das fileiras exagerado só como textura quando a escala não permite desenhá-las
      const p = 7 / pxm, pd = svg.querySelector("#pvDyn");
      pd.setAttribute("width", p); pd.setAttribute("height", p * 8);
      const r = i => svg.querySelector("#pd" + i);
      r(0).setAttribute("width", p); r(0).setAttribute("height", p * 8);
      r(1).setAttribute("x", p * .05); r(1).setAttribute("width", p * .45); r(1).setAttribute("height", p * 8);
      r(2).setAttribute("x", p * .5); r(2).setAttribute("width", p * .45); r(2).setAttribute("height", p * 8);
      r(3).setAttribute("y", p * 3.9); r(3).setAttribute("width", p); r(3).setAttribute("height", p * .2);
      pv.setAttribute("fill", "url(#pvDyn)");
    }
    const cx = s + g;
    campo.setAttribute("x", cx); campo.setAttribute("y", -68); campo.setAttribute("width", 105); campo.setAttribute("height", 68);
    linhasC.setAttribute("d", `M${cx + 52.5} -68 V0 M${cx + 52.5 + 9.15} -34 A9.15 9.15 0 1 0 ${cx + 52.5 - 9.15} -34 A9.15 9.15 0 1 0 ${cx + 52.5 + 9.15} -34 M${cx} -54.16 H${cx + 16.5} V-13.84 H${cx} M${cx + 105} -54.16 H${cx + 88.5} V-13.84 H${cx + 105}`);
    const fs = vw * 0.019;
    tFV.setAttribute("font-size", fs); tC.setAttribute("font-size", fs * 0.9);
    tFV.textContent = "campo fotovoltaico leste-oeste";
    tFV.setAttribute("x", 0); tFV.setAttribute("y", s < 68 ? fs * 1.5 : -s - fs * 0.7);
    tC.textContent = "campo de futebol (105 × 68 m)";
    const campoPx = 105 * pxm;
    if (campoPx > 150) { tC.setAttribute("x", cx); tC.setAttribute("y", -68 - fs * 0.6); tC.setAttribute("text-anchor", "start"); guia.setAttribute("d", ""); }
    else { tC.setAttribute("x", cx + 52.5); tC.setAttribute("y", fs * 1.5); tC.setAttribute("text-anchor", "middle"); guia.setAttribute("d", ""); }
    const L = nice(vw * 0.18), bx = x0 + vw * 0.05, by = y0 + vh * 0.93;
    escL.setAttribute("d", `M${bx} ${by - vh * 0.012} V${by} H${bx + L} V${by - vh * 0.012}`);
    escT.setAttribute("font-size", fs * 0.85); escT.setAttribute("x", bx); escT.setAttribute("y", by - vh * 0.025);
    escT.textContent = L >= 1000 ? `${nf(L / 1000, L % 1000 ? 1 : 0)} km` : `${nf(L, 0)} m`;
  }
  function alvo(novo) {
    alvoA = novo; cancelAnimationFrame(raf);
    const de = Math.sqrt(A), para = Math.sqrt(novo), ini = performance.now(), dur = 1100;
    const vw0 = VW, vw1 = degrau(geo(novo).req);
    function f(t) {
      const k = Math.min(1, (t - ini) / dur), e = 1 - Math.pow(1 - k, 3);
      const s = Math.exp(Math.log(de) + (Math.log(para) - Math.log(de)) * e);
      VW = Math.exp(Math.log(vw0) + (Math.log(vw1) - Math.log(vw0)) * e);
      A = s * s; desenha(A);
      if (k < 1) raf = requestAnimationFrame(f);
    }
    raf = requestAnimationFrame(f);
  }
  new ResizeObserver(() => { VW = degrau(geo(A).req); desenha(A); }).observe(card);
  desenha(A);
  return { alvo };
})();

/* ═══════════════════════ tabela ═══════════════════════ */
function fmtDef(d, x) {
  if (d.fmt === "%") return nf(x * 100, Math.abs(x * 100) < 10 ? 2 : 1) + "%";
  return nf(x, d.fmt);
}
const corpo = $("#tab-corpo");
(function montaTabela() {
  let h = "", g = null;
  DEFS.forEach(d => {
    if (d.grupo !== g) { g = d.grupo; h += `<tr class="g"><td colspan="5">${g}</td></tr>`; }
    h += `<tr class="${typeof d.x === "string" ? "" : "dado"}" data-id="${d.id}"><td>${d.nome}</td><td class="sym">${d.sym.replace(/^([^_]+)_(.+)$/, "$1<sub>$2</sub>")}</td><td class="v"></td><td>${d.un}</td><td class="ref">${d.ref}</td></tr>`;
  });
  corpo.innerHTML = h;
  $("#n-valores").textContent = DEFS.length;
})();
const ultimo = {};
const LINHAS = $$("tr[data-id]", corpo).map(tr => ({ d: DEFS[IDX[tr.dataset.id]], td: tr.children[2] }));
function atualizaTabela(flash) {
  const pisca = flash && $("#tab-wrap").classList.contains("aberta");
  for (const l of LINHAS) {
    const x = ST.v[l.d.id], t = fmtDef(l.d, x);
    if (l.td.textContent !== t) {
      l.td.textContent = t;
      if (pisca && ultimo[l.d.id] !== undefined) {
        if (l.anim) l.anim.cancel();
        l.anim = l.td.animate([{ backgroundColor: "#FFF4CC" }, { backgroundColor: "rgba(255,244,204,0)" }], { duration: 1000, easing: "cubic-bezier(.22,.8,.24,1)" });
      }
    }
    ultimo[l.d.id] = x;
  }
}
$("#btn-tab").addEventListener("click", () => {
  const w = $("#tab-wrap"); w.classList.toggle("aberta");
  $("#btn-tab").textContent = w.classList.contains("aberta") ? "Ocultar tabela" : "Mostrar tabela";
});

/* ═══════════════════════ planilha .xlsx (com fórmulas) ═══════════════════════ */
const XLSX = (() => {
  const enc = new TextEncoder();
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(arqs) {
    const partes = [], central = []; let off = 0;
    arqs.forEach(({ nome, txt }) => {
      const nm = enc.encode(nome), dados = enc.encode(txt), crc = crc32(dados);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, dados.length, true); lh.setUint32(22, dados.length, true);
      lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      partes.push(new Uint8Array(lh.buffer), nm, dados);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, dados.length, true); ch.setUint32(24, dados.length, true);
      ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + dados.length;
    });
    const tamC = central.reduce((a, b) => a + b.length, 0);
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arqs.length, true); fim.setUint16(10, arqs.length, true); fim.setUint32(12, tamC, true); fim.setUint32(16, off, true);
    const tudo = [...partes, ...central, new Uint8Array(fim.buffer)];
    const out = new Uint8Array(tudo.reduce((a, b) => a + b.length, 0)); let p = 0; tudo.forEach(b => { out.set(b, p); p += b.length; });
    return out;
  }
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const col = i => String.fromCharCode(65 + i);
  // estilos
  const FMT = { 0: 164, 1: 165, 2: 166, 3: 167, 4: 168, "%": 170 };
  const XF = [], xf = (num, font, fill) => { const k = `${num}|${font}|${fill}`; let i = XF.findIndex(x => x.k === k); if (i < 0) { XF.push({ k, num, font, fill }); i = XF.length - 1; } return i; };
  xf(0, 0, 0);
  const S_TIT = xf(0, 2, 0), S_NOTA = xf(0, 5, 0), S_CAB = xf(0, 4, 3), S_GRP = xf(0, 1, 4), S_TXT = xf(0, 0, 0), S_SYM = xf(0, 6, 0);
  function estilos() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="6"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="#,##0.0"/><numFmt numFmtId="166" formatCode="#,##0.00"/><numFmt numFmtId="167" formatCode="#,##0.000"/><numFmt numFmtId="168" formatCode="#,##0.0000"/><numFmt numFmtId="170" formatCode="0.00%"/></numFmts>
<fonts count="7"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF12324A"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF12324A"/><name val="Calibri"/></font><font><sz val="11"/><color rgb="FF1D4ED8"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF6E6E73"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF424245"/><name val="Cambria"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF12324A"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF2F6"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${XF.length}">${XF.map(x => `<xf numFmtId="${x.num}" fontId="${x.font}" fillId="${x.fill}" borderId="0" xfId="0"${x.num ? ' applyNumberFormat="1"' : ""}${x.font ? ' applyFont="1"' : ""}${x.fill ? ' applyFill="1"' : ""}/>`).join("")}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  }
  const cS = (r, c, t, s = S_TXT) => `<c r="${col(c)}${r}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${esc(t)}</t></is></c>`;
  const cN = (r, c, x, s) => `<c r="${col(c)}${r}" s="${s}"><v>${x}</v></c>`;
  const cF = (r, c, f, x, s) => `<c r="${col(c)}${r}" s="${s}"><f>${esc(f)}</f><v>${x}</v></c>`;
  function gerar(P) {
    const v = calcular(P);
    // folha 1: memorial
    const linha = {}; let r = 4; const rows = []; const merges = ["A1:G1", "A2:G2"];
    rows.push(`<row r="1" ht="22" customHeight="1">${cS(1, 0, "Porcelanato com hidrogênio — memorial de cálculo (Projeto II · Grupo 3 · UNIFEI)", S_TIT)}</row>`);
    let g = null; const plano = [];
    DEFS.forEach(d => { if (d.grupo !== g) { g = d.grupo; plano.push({ cab: g }); } plano.push(d); });
    // endereços
    let rr = 4; plano.forEach(p => { if (p.cab) rr++; else { linha[p.id] = rr; rr++; } });
    const ref = id => `D${linha[id]}`;
    rows.push(`<row r="2">${cS(2, 0, `Altere a produção diária na célula ${ref("P")}: todas as fórmulas se recalculam. Azul = dado de entrada; preto = fórmula. Equações numeradas como no memorial.`, S_NOTA)}</row>`);
    rows.push(`<row r="3">${["Nº", "Grandeza", "Símbolo", "Valor", "Unidade", "Fórmula", "Referência / fonte"].map((t, i) => cS(3, i, t, S_CAB)).join("")}</row>`);
    let nro = 0;
    plano.forEach(p => {
      if (p.cab) { rows.push(`<row r="${r}">${cS(r, 0, p.cab, S_GRP)}${[1, 2, 3, 4, 5, 6].map(i => `<c r="${col(i)}${r}" s="${S_GRP}"/>`).join("")}</row>`); merges.push(`A${r}:G${r}`); r++; return; }
      const d = p; nro++;
      const num = FMT[d.fmt] || 166;
      let cel;
      const val = d.id === "P" ? P : v[d.id];
      if (typeof d.x === "string") {
        const f = d.x.replace(/\{(\w+)\}/g, (m, k) => ref(k)).replace(/;/g, ",");
        cel = cF(r, 3, f, val, xf(num, 0, 0));
      } else cel = cN(r, 3, val, xf(num, 3, d.id === "P" ? 2 : 0));
      const ftxt = typeof d.x === "string" ? d.x.replace(/\{(\w+)\}/g, (m, k) => DEFS[IDX[k]].sym).replace(/\*/g, " × ").replace(/\//g, " / ").replace(/ROUND\(/g, "ARRED(").replace(/;/g, "; ") : "dado";
      rows.push(`<row r="${r}">${cN(r, 0, nro, S_TXT)}${cS(r, 1, d.nome)}${cS(r, 2, d.sym, S_SYM)}${cel}${cS(r, 4, d.un)}${cS(r, 5, ftxt, S_NOTA)}${cS(r, 6, d.ref, S_NOTA)}</row>`);
      r++;
    });
    const folha1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0" tabSelected="1"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="${ref("P")}" sqref="${ref("P")}"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols><col min="1" max="1" width="5" customWidth="1"/><col min="2" max="2" width="52" customWidth="1"/><col min="3" max="3" width="16" customWidth="1"/><col min="4" max="4" width="16" customWidth="1"/><col min="5" max="5" width="14" customWidth="1"/><col min="6" max="6" width="58" customWidth="1"/><col min="7" max="7" width="32" customWidth="1"/></cols>
<sheetData>${rows.join("")}</sheetData>
<mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>
</worksheet>`;
    // folha 2: etapas
    const M = id => `Memorial!$D$${linha[id]}`;
    const etapas = [
      [1, "Recepção", "M_MP_REC", "M_MP", null, "0.18"], [2, "Dosagem", "M_MP", "M_MP", null, "0.17"],
      [3, "Moagem", "M_MP+A_ADD", "M_BARB", null, "ROUND(E_MOAG,2)"], [4, "Peneiramento", "M_BARB", "M_BARB", null, "0.6"],
      [5, "Atomização", "M_BARB", "M_PO", "Q_AT", "1.19"], [6, "Repouso", "M_PO", "M_PO", null, "0.32"],
      [7, "Prensagem", "M_PO", "M_PO", null, "1.88"], [8, "Secagem", "M_PO", "M_SECA", "Q_SEC", "0.37"],
      [9, "Esmaltação", "M_SECA+M_ESM", "M_ESMALT", null, "0.85"], [10, "Queima", "M_ESMALT", "M_QUEIM", "Q_F", "0.97+E_VENT"],
      [11, "Retífica", "M_QUEIM", "M_P", null, "0.7"], [12, "Expedição", "M_P", "M_P", null, "0.24"]];
    const tr = s => s.replace(/[A-Z][A-Z0-9_]+/g, k => linha[k] ? M(k) : k);
    const evalE = s => compila(s)(v);
    const r2 = [`<row r="1" ht="22" customHeight="1">${cS(1, 0, `Etapas — por m² e por dia (produção em Memorial!${ref("P")})`, S_TIT)}</row>`,
      `<row r="2">${["Nº", "Etapa", "Massa entra (kg/m²)", "Massa sai (kg/m²)", "Calor (MJt/m²)", "Eletricidade (MJe/m²)", "Massa entra (t/dia)", "Calor (GJ/dia)", "Eletricidade (MWh/dia)"].map((t, i) => cS(2, i, t, S_CAB)).join("")}</row>`];
    const PP = M("P");
    etapas.forEach(([n, nome, me, ms, q, e], i) => {
      const R = i + 3, qv = q ? v[q] : 0;
      r2.push(`<row r="${R}">${cN(R, 0, n, S_TXT)}${cS(R, 1, nome)}${cF(R, 2, tr(me), evalE(me), xf(166, 0, 0))}${cF(R, 3, tr(ms), evalE(ms), xf(166, 0, 0))}` +
        (q ? cF(R, 4, M(q), qv, xf(166, 0, 0)) : cN(R, 4, 0, xf(166, 0, 0))) + (/^[\d.]+$/.test(e) ? cN(R, 5, +e, xf(166, 3, 0)) : cF(R, 5, tr(e), evalE(e), xf(166, 0, 0))) +
        cF(R, 6, `C${R}*${PP}/1000`, evalE(me) * P / 1000, xf(166, 0, 0)) + cF(R, 7, `E${R}*${PP}/1000`, qv * P / 1000, xf(166, 0, 0)) + cF(R, 8, `F${R}*${PP}/3600`, evalE(e) * P / 3600, xf(166, 0, 0)) + `</row>`);
    });
    const RT = 15, sumE = etapas.reduce((a, x) => a + evalE(x[5]), 0), sumQ = etapas.reduce((a, x) => a + (x[4] ? v[x[4]] : 0), 0);
    r2.push(`<row r="${RT}">${cS(RT, 1, "Total", S_GRP)}${cF(RT, 4, "SUM(E3:E14)", sumQ, xf(166, 1, 4))}${cF(RT, 5, "SUM(F3:F14)", sumE, xf(166, 1, 4))}${cF(RT, 7, "SUM(H3:H14)", sumQ * P / 1000, xf(166, 1, 4))}${cF(RT, 8, "SUM(I3:I14)", sumE * P / 3600, xf(166, 1, 4))}</row>`);
    r2.push(`<row r="${RT + 1}">${cS(RT + 1, 1, "Verificação: eletricidade total = gerada pela turbina (E_e)", S_NOTA)}${cF(RT + 1, 5, M("E_TG"), v.E_TG, xf(166, 0, 0))}</row>`);
    r2.push(`<row r="${RT + 3}">${cS(RT + 3, 1, "Eletricidade por etapa: moagem: 80 kWh/t adotados a partir de Rigobelo (2026); demais etapas por rateio estimado (Figura 3 do memorial). Queima inclui 0,60 MJe/m² dos ventiladores da recuperação.", S_NOTA)}</row>`);
    const folha2 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols><col min="1" max="1" width="5" customWidth="1"/><col min="2" max="2" width="22" customWidth="1"/><col min="3" max="9" width="19" customWidth="1"/></cols>
<sheetData>${r2.join("")}</sheetData>
</worksheet>`;
    const arqs = [
      { nome: "[Content_Types].xml", txt: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
      { nome: "_rels/.rels", txt: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { nome: "xl/workbook.xml", txt: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Memorial" sheetId="1" r:id="rId1"/><sheet name="Etapas" sheetId="2" r:id="rId2"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>` },
      { nome: "xl/_rels/workbook.xml.rels", txt: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { nome: "xl/worksheets/sheet1.xml", txt: folha1 },
      { nome: "xl/worksheets/sheet2.xml", txt: folha2 },
      { nome: "xl/styles.xml", txt: estilos() },
    ];
    return { bytes: zip(arqs), linha };
  }
  return { gerar };
})();
$("#btn-xlsx").addEventListener("click", () => {
  const { bytes } = XLSX.gerar(ST.P);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `Porcelanato_H2_memorial_${ST.P}m2dia.xlsx`; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
});


/* ═══════════════════════ ciclo 0 × proposto, menu ═══════════════════════ */
const seletor = $(".seletor-planta"), pilula = $(".seletor-planta .pilula");
function posPilula() { const b = $(".seletor-planta button.on"); if (b) { pilula.style.left = b.offsetLeft + "px"; pilula.style.width = b.offsetWidth + "px"; } }
function resumoCiclo() {
  const v = ST.v, ch = (cor, rot, val, k) => `<span data-abre="${k}"><i style="background:${cor}"></i>${rot} <b>${val}</b></span>`;
  $("#resumo-ciclo").innerHTML = MODO === "0"
    ? ch(COR.gn, "gás natural", `${nf(v.Q_T0)} MJ/m²`, "gn") + ch(COR.el, "rede elétrica", `${nf(v.E_E0)} MJ<sub>e</sub>/m²`, "rede0") + ch(COR.vap, "calor do forno descartado", `${nf(v.Q_EXA0 + v.Q_RES0)} MJ/m²`, "s10") + ch("#6B7280", "CO₂", `${nf(v.CO2_0)} kg/m² · ${txt("massa", v.CO2_0_DIA)}/dia`, "co2")
    : ch(COR.h2, "H₂", `${nf(v.H2_TOT * 120)} MJ/m²`, "h2t") + ch(COR.gn, "gás natural", `${nf(v.GN_TG)} MJ/m²`, "gn") + ch(COR.el, "rede elétrica", "0 kWh", "rede") + ch(COR.rec, "calor recuperado", `${nf(v.REC_TOT)} MJ/m²`, "fech") + ch("#15803D", "CO₂", `${nf(v.CO2_P)} kg/m² · ${txt("massa", v.CO2_DIA)}/dia`, "co2");
}
function setModo(m, opc = {}) {
  if (m !== "0" && m !== "P") return;
  MODO = m; desfoca();
  planta.classList.toggle("modo0", m === "0");
  $$(".seletor-planta button").forEach(b => b.classList.toggle("on", b.dataset.modo === m));
  posPilula(); resumoCiclo(); marcaMenu();
  if (modalAtual) abreModal(modalAtual, true);
  if (opc.hash !== false) history.replaceState(null, "", m === "0" ? "#ciclo0" : "#proposto");
  if (opc.rolar) rolaPara(pcard);
}
$$(".seletor-planta button").forEach(b => b.addEventListener("click", () => trocaModo(b.dataset.modo)));
// menu
const menu = $("#menu"), menuBtn = $("#menu-btn");
let ativa = "inicio";
function marcaMenu() {
  $$("a", menu).forEach(a => {
    const alvo = a.getAttribute("href").slice(1);
    a.classList.toggle("on", alvo === ativa && (!a.dataset.modo || a.dataset.modo === MODO));
  });
}
$$("a", menu).forEach(a => a.addEventListener("click", ev => {
  menu.classList.remove("aberto"); menuBtn.setAttribute("aria-expanded", "false");
  if (a.dataset.modo) { ev.preventDefault(); setModo(a.dataset.modo, { rolar: true }); }
}));
menuBtn.addEventListener("click", () => { const ab = menu.classList.toggle("aberto"); menuBtn.setAttribute("aria-expanded", ab); });
const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { ativa = e.target.id; marcaMenu(); } }), { rootMargin: "-45% 0px -50% 0px" });
["inicio", "fabrica", "energia", "sistema", "emissoes", "planilha"].forEach(id => spy.observe($("#" + id)));
window.addEventListener("resize", posPilula);

/* ═══════════════════════ movimento: rolagem, troca de ciclo, janelas ═══════════════════════ */
// Tudo anima com requestAnimationFrame ou só com transform e opacidade, então acompanha a taxa da tela (60, 120 ou 144 Hz).
const calmoSO = matchMedia("(prefers-reduced-motion: reduce)");
const raiz = document.documentElement;
// O Windows com "Efeitos de animação" desligado faz o navegador pedir menos movimento, e o site desligava tudo.
// Quem quiser pode ligar as animações só aqui (fica guardado neste navegador).
const guarda = { le: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, poe: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
if (guarda.le("porcelanato-mov") === "total") raiz.classList.add("mov-total");
const calmo = { get matches() { return calmoSO.matches && !raiz.classList.contains("mov-total"); } };
(function avisoMovimento() {
  if (!calmoSO.matches || raiz.classList.contains("mov-total")) return;
  try { if (sessionStorage.getItem("porcelanato-mov-aviso")) return; } catch (e) {}
  const av = document.createElement("div"); av.className = "aviso-mov"; av.setAttribute("role", "status");
  av.innerHTML = `<span>O sistema está com as animações desligadas, então o site está parado.</span><button type="button" class="liga">Ligar animações</button><button type="button" class="x" aria-label="Fechar aviso">×</button>`;
  document.body.appendChild(av);
  requestAnimationFrame(() => av.classList.add("on"));
  const some = () => { av.classList.remove("on"); setTimeout(() => av.remove(), 400); try { sessionStorage.setItem("porcelanato-mov-aviso", "1"); } catch (e) {} };
  av.querySelector(".liga").addEventListener("click", () => { raiz.classList.add("mov-total"); guarda.poe("porcelanato-mov", "total"); some(); });
  av.querySelector(".x").addEventListener("click", some);
})();
// rolagem com curva própria ao clicar nos links internos
let rafRola = 0;
const ezRola = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function rolaPara(el) {
  if (!el) return;
  const mt = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const max = raiz.scrollHeight - innerHeight;
  const y0 = scrollY, y1 = Math.max(0, Math.min(max, el.getBoundingClientRect().top + scrollY - mt)), d = y1 - y0;
  cancelAnimationFrame(rafRola); rafRola = 0;
  if (Math.abs(d) < 2) return;
  raiz.classList.add("sem-suave");
  if (calmo.matches) { scrollTo(0, y1); raiz.classList.remove("sem-suave"); return; }
  const dur = Math.min(1250, 420 + Math.sqrt(Math.abs(d)) * 8), ini = performance.now();
  const f = t => {
    const k = Math.min(1, (t - ini) / dur);
    scrollTo(0, y0 + d * ezRola(k));
    if (k < 1) rafRola = requestAnimationFrame(f); else { rafRola = 0; raiz.classList.remove("sem-suave"); }
  };
  rafRola = requestAnimationFrame(f);
}
const paraRolagem = () => { if (rafRola) { cancelAnimationFrame(rafRola); rafRola = 0; raiz.classList.remove("sem-suave"); } };
["wheel", "touchstart"].forEach(e => addEventListener(e, paraRolagem, { passive: true }));
document.addEventListener("click", ev => {
  const a = ev.target.closest('a[href^="#"]');
  if (!a || a.dataset.modo || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
  const id = a.getAttribute("href").slice(1), el = id && document.getElementById(id);
  if (!el) return;
  ev.preventDefault(); rolaPara(el); history.replaceState(null, "", "#" + id);
});
// barra de progresso da leitura, no pé da barra fixa
const progBar = document.createElement("div"); progBar.className = "progresso"; $("header.bar").appendChild(progBar);
let rafProg = 0;
const progresso = () => { rafProg = 0; const max = raiz.scrollHeight - innerHeight; progBar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`; };
addEventListener("scroll", () => { if (!rafProg) rafProg = requestAnimationFrame(progresso); }, { passive: true });
addEventListener("resize", progresso, { passive: true });
progresso();
// troca ciclo 0 × proposto com transição de vista (Chrome, Edge e Safari recentes; nos outros, troca direta)
function trocaModo(m) {
  if (m === MODO) return;
  if (!document.startViewTransition || calmo.matches) return setModo(m);
  raiz.dataset.vt = m === "0" ? "volta" : "vai";
  const t = document.startViewTransition(() => setModo(m));
  const limpa = () => { delete raiz.dataset.vt; };
  t.finished.finally(limpa);
  setTimeout(limpa, 1500);   // garantia: em aba escondida a transição pode não terminar, e o nome deixaria a planta pesada ao rolar
}
// janelas: crescem a partir do ponto clicado
let ultimoToque = null;
addEventListener("pointerdown", e => { ultimoToque = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { capture: true, passive: true });
function origemJanela() {
  const ok = ultimoToque && performance.now() - ultimoToque.t < 1500;
  janela.style.setProperty("--ox", ok ? Math.round((ultimoToque.x - innerWidth / 2) * .3) + "px" : "0px");
  janela.style.setProperty("--oy", ok ? Math.round((ultimoToque.y - innerHeight / 2) * .3) + "px" : "0px");
}

/* ═══════════════════════ revelar ao rolar ═══════════════════════ */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("visivel"); io.unobserve(e.target);
  if (e.target.id === "bloco-energia") larguras();
  if (e.target.id === "bloco-emis") emissoes(true);
}), { threshold: .18 });
$$(".revela").forEach(el => io.observe(el));
const reaplica = () => { aplicaSlider(); if ($("#bloco-energia").classList.contains("visivel")) larguras(); if ($("#bloco-emis").classList.contains("visivel")) emissoes(true); };
slider.addEventListener("change", reaplica); $$(".atalhos button").forEach(b => b.addEventListener("click", reaplica)); campo.addEventListener("blur", reaplica);
emissoes(false);
definirP(30000, "inicio");
if (location.hash === "#ciclo0") setModo("0", { hash: false, rolar: true }); else { resumoCiclo(); posPilula(); }
window.__site = { ST, definirP, abreModal, foca, desfoca, XLSX, setModo };
