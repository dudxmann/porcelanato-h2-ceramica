// Motor comum dos scripts do artigo_v2: carrega o modelo técnico do site (site/model.js) e a parte de cálculo do
// modelo econômico (site/custos.js, que bate com a planilha de precificação), como fazem o robustez.js e o incerteza.js.
const fs = require("fs"), path = require("path"), vm = require("vm");
const SITE = path.join(__dirname, "..", "site");
const M = require(path.join(SITE, "model.js"));

// custos.js foi escrito para o navegador: roda num contexto com o DOM trocado por um objeto que aceita tudo
const tudo = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => "" : tudo), apply: () => tudo, set: () => true });
const ctx = { console, Math, JSON, Object, Array, Number, String, Symbol, Proxy, Set, Map, isFinite, parseFloat,
  window: new Proxy({ __site: {} }, { get: (t, k) => (k in t ? t[k] : tudo), set: (t, k, v) => ((t[k] = v), true) }),
  document: tudo, $: () => tudo, $$: () => [], ST: { P: 30000 }, GLOB: {}, JAN: {}, animaNumeros: () => {}, abreModal: () => {}, modalAtual: null,
  nf: (x, d = 2) => x.toFixed(d), requestAnimationFrame: () => 0, setTimeout: () => 0, getComputedStyle: () => tudo };
vm.createContext(ctx);
const SRC = fs.readFileSync(path.join(SITE, "custos.js"), "utf8");
const p1 = SRC.slice(0, SRC.indexOf("const CS = "));
const i2 = SRC.indexOf("const PE = "), i3 = SRC.indexOf("\nconst taxaTxt", i2);
vm.runInContext(p1 + "\n" + SRC.slice(i2, i3) + "\n;this.__x = { PC, PE, PRECOS_FV, custos, econ, tirUniforme };", ctx);
const { PC, PE, PRECOS_FV, custos, econ, tirUniforme } = ctx.__x;
const PC0 = JSON.parse(JSON.stringify(PC)), PE0 = { ...PE };

// volta as premissas ao caso-base e passa ao modelo econômico as capacidades e consumos do modelo técnico v
function prepara(v) {
  Object.assign(PC, JSON.parse(JSON.stringify(PC0)));
  Object.assign(PE, PE0);
  Object.assign(PC, { H2: v.H2_TOT, DUTO: v.DUTO, QF: v.Q_F, AR: v.AR_REC, TRC: v.TRC, KWH: v.KWH_KG, E: v.E_TG });
  Object.assign(PE, { GN1: v.GN_NM3, CO2_1: v.CO2_P, CO2_0: v.CO2_0, GN0: v.V_GN0 });
}
// se o ar de resfriamento já cobre o secador (calor do trocador ≤ 0), sai o trocador, com os 15% de dutos sobre ele
function semTrocador(r, v) {
  if (v.TRC > 0) return false;
  const tira = r.por.trc.usd * 1.15;
  r.total -= tira; r.fab -= tira;
  return true;
}
module.exports = { M, PC, PE, PC0, PE0, PRECOS_FV, custos, econ, tirUniforme, prepara, semTrocador };
