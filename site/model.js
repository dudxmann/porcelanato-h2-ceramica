/* Modelo de cálculo do memorial (porcelanato com H₂) — uma só fonte para o site e para a planilha.
   Cada linha: [id, grandeza, símbolo, unidade, valor | "expressão", referência, formato]
   Expressões usam {ID} para outras grandezas, ROUND(x;n) e MAX(a;b); valem igual em JS e no Excel.
   formato: número de casas decimais ou "%" (fração exibida em %). */
const GRUPOS = [
 ["Produção", [
  ["P", "Produção diária", "P", "m²/dia", 30000, "escolhida no site", 0],
 ]],
 ["Balanço de massa (por m² de produto)", [
  ["M_P", "Massa do produto acabado (UF)", "m_P", "kg/m²", 22.00, "Alves et al. (2023a)", 2],
  ["X_MP", "Umidade das matérias-primas", "x_MP", "b.u.", 0.04, "hipótese (na região, até 22%; Rigobelo, 2026)", "%"],
  ["F_MAN", "Perda de manuseio na recepção", "f_man", "–", 0.005, "hipótese", "%"],
  ["X_B", "Umidade da barbotina", "x_b", "b.u.", 0.3381, "Oliveira e Hotza (2015)", "%"],
  ["X_PO", "Umidade do pó atomizado", "x_pó", "b.u.", 0.06, "Negre et al. (2000)", "%"],
  ["X_SEC", "Umidade após a secagem", "x_sec", "b.u.", 0.003, "Oliveira e Hotza (2015)", "%"],
  ["M_ESM", "Suspensão de engobe e esmalte", "m_esm", "kg/m²", 1.10, "hipótese", 2],
  ["S_ESM", "Teor de sólidos da suspensão", "f_s", "–", 0.70, "hipótese", "%"],
  ["M_LAMA", "Lama de retífica", "m_lama", "kg/m²", 0.78, "hipótese; cerca de 1,00 kg/m² de pó na retífica a seco, em empresa com matriz no sul de SC (Sartor et al., 2021)", 2],
  ["M_PF", "Perda ao fogo na queima", "m_PF", "kg/m²", 0.97, "hipótese (4%, realista segundo Rigobelo, 2026)", 2],
  ["V_CAPT", "Captação de água medida na unidade de Tijucas", "V_capt", "L/m²", 12.16, "Portobello (2026)", 2],
  ["M_QUEIM", "Massa que sai do forno", "m_queimado", "kg/m²", "{M_P}+{M_LAMA}", "Eq. (5)", 2],
  ["S_ESMS", "Sólidos do esmalte", "s_esm", "kg/m²", "{M_ESM}*{S_ESM}", "Eq. (6)", 2],
  ["A_ESM", "Água do esmalte", "a_esm", "kg/m²", "{M_ESM}-{S_ESMS}", "Eq. (6)", 2],
  ["MS", "Sólidos secos do suporte", "m_s", "kg/m²", "{M_QUEIM}+{M_PF}-{S_ESMS}", "Eq. (7)", 2],
  ["F_PF", "Perda ao fogo relativa à massa seca", "f_PF", "–", "{M_PF}/({MS}+{S_ESMS})", "Eq. (8)", "%"],
  ["M_SECA", "Peça seca", "m_seca", "kg/m²", "{MS}/(1-{X_SEC})", "Eq. (9)", 2],
  ["M_PO", "Pó atomizado", "m_pó", "kg/m²", "{MS}/(1-{X_PO})", "Eq. (10)", 2],
  ["M_BARB", "Barbotina", "m_barb", "kg/m²", "{MS}/(1-{X_B})", "Eq. (11)", 2],
  ["EV_AT", "Água evaporada no atomizador", "Δm_at", "kg/m²", "({M_BARB}-{MS})-({M_PO}-{MS})", "Eq. (12)", 2],
  ["EV_SEC", "Água evaporada no secador", "Δm_sec", "kg/m²", "{M_PO}-{M_SECA}", "Eq. (13)", 2],
  ["M_ESMALT", "Peça esmaltada", "m_esmaltada", "kg/m²", "{M_SECA}+{M_ESM}", "Eq. (14)", 2],
  ["A_FORNO", "Água eliminada no forno", "Δm_água,forno", "kg/m²", "({M_SECA}-{MS})+{A_ESM}", "Eq. (15)", 2],
  ["M_MP", "Matéria-prima úmida na moagem", "m_MP", "kg/m²", "{MS}/(1-{X_MP})", "Eq. (16)", 2],
  ["A_ADD", "Água adicionada no moinho", "a_add", "kg/m²", "({M_BARB}-{MS})-({M_MP}-{MS})", "Eq. (17)", 2],
  ["M_MP_REC", "Matéria-prima recebida", "m_MP,rec", "kg/m²", "{M_MP}/(1-{F_MAN})", "Eq. (18)", 2],
  ["M_MAN", "Perda de manuseio", "m_man", "kg/m²", "{M_MP_REC}-{M_MP}", "Eq. (18)", 2],
  ["ENT", "Soma das entradas", "Σm_entra", "kg/m²", "{M_MP_REC}+{A_ADD}+{M_ESM}", "Eq. (19)", 2],
  ["SAI", "Soma das saídas", "Σm_sai", "kg/m²", "{M_P}+{EV_AT}+{EV_SEC}+{A_FORNO}+{M_PF}+{M_LAMA}+{M_MAN}", "Eq. (20)", 2],
  ["AGUA_EV", "Água eliminada pelo processo", "Δm_água", "kg/m²", "{EV_AT}+{EV_SEC}+{A_FORNO}", "Eq. (21)", 2],
  ["DESVIO", "Desvio em relação à captação medida", "δ", "–", "({AGUA_EV}-{V_CAPT})/{V_CAPT}", "Eq. (22)", "%"],
 ]],
 ["Ciclo 0 — referência (gás natural + rede)", [
  ["E_TOT_KWH", "Consumo específico total", "E_tot", "kWh/m²", 33.33, "Portobello (2026), p. 51, de Tijucas; tomado como hipótese", 2],
  ["F_TERM", "Fração térmica do consumo", "f_t", "–", 0.88, "adotada; conferida com Portobello (2026)", "%"],
  ["FR_FOR", "Fração térmica da queima", "φ_forno", "–", 0.52, "grupo: meio das faixas consideradas realistas por Rigobelo (2026)", "%"],
  ["FR_AT", "Fração térmica da atomização", "φ_at", "–", 0.375, "grupo: meio das faixas consideradas realistas por Rigobelo (2026)", "%"],
  ["FR_SEC", "Fração térmica da secagem", "φ_sec", "–", 0.105, "grupo: meio das faixas consideradas realistas por Rigobelo (2026)", "%"],
  ["PCI_GN", "PCI do gás natural", "PCI_GN", "MJ/m³", 35.9, "hipótese, a 20 °C e 1 atm (Seção 3.4)", 1],
  ["E_MOAG_T", "Consumo da moagem", "e_moag", "kWh/t", 80, "adotado; Rigobelo (2026)", 0],
  ["F_EXA", "Fração do gás do forno que sai na exaustão", "f_exa", "–", 0.513, "Brown, Hamel e Hedman (1996)", "%"],
  ["F_RES", "Fração do gás do forno que sai no ar de resfriamento", "f_res", "–", 0.278, "Brown, Hamel e Hedman (1996)", "%"],
  ["FE_GN", "Fator de emissão do gás natural", "FE_GN", "kg CO₂/MJ", 0.0561, "IPCC (2006)", 4],
  ["FE_SIN", "Fator de emissão do SIN (2023)", "FE_SIN", "kg CO₂/kWh", 0.0385, "Brasil (2024c)", 4],
  ["E_TOT", "Energia total", "E_tot", "MJ/m²", "{E_TOT_KWH}*3.6", "Eq. (23)", 2],
  ["Q_T0", "Energia térmica (gás natural)", "Q_t,0", "MJt/m²", "{F_TERM}*{E_TOT}", "Eq. (24)", 2],
  ["E_E0", "Energia elétrica (rede)", "E_e,0", "MJe/m²", "{E_TOT}-{Q_T0}", "Eq. (25)", 2],
  ["Q_FOR0", "Calor da queima", "Q_forno", "MJt/m²", "ROUND({FR_FOR}*{Q_T0};2)", "Tabela 5", 2],
  ["Q_AT", "Calor da atomização", "Q_at", "MJt/m²", "ROUND({FR_AT}*{Q_T0};2)", "Tabela 5", 2],
  ["Q_SEC", "Calor da secagem", "Q_sec", "MJt/m²", "ROUND({FR_SEC}*{Q_T0};2)", "Tabela 5", 2],
  ["V_GN0", "Gás natural do ciclo 0", "V_GN,0", "m³/m²", "{Q_T0}/{PCI_GN}", "Eq. (26)", 3],
  ["E_MOAG", "Energia da moagem", "E_moag", "MJe/m²", "{E_MOAG_T}*{M_MP_REC}/1000*3.6", "Eq. (27)", 2],
  ["Q_EXA0", "Gases de exaustão do forno", "Q_exa,0", "MJt/m²", "ROUND({F_EXA}*{Q_FOR0};2)", "Eq. (28)", 2],
  ["Q_RES0", "Ar de resfriamento do forno", "Q_res,0", "MJt/m²", "ROUND({F_RES}*{Q_FOR0};2)", "Eq. (29)", 2],
  ["CO2_S1", "CO₂ direto (escopo 1)", "CO₂,1", "kg/m²", "{Q_T0}*{FE_GN}", "Eq. (33)", 2],
  ["CO2_S2", "CO₂ da rede (escopo 2)", "CO₂,2", "kg/m²", "{E_E0}/3.6*{FE_SIN}", "Eq. (34)", 2],
  ["CO2_0", "CO₂ do ciclo 0", "CO₂,0", "kg/m²", "{CO2_S1}+{CO2_S2}", "Eq. (35)", 2],
 ]],
 ["Recuperação de calor do forno", [
  ["ETA_REC", "Fração aproveitada do ar de resfriamento", "η_rec", "–", 0.85, "hipótese", "%"],
  ["CP", "cp do ar e dos gases de exaustão", "c_p", "kJ/(kg·K)", 1.05, "Çengel e Boles (2013)", 2],
  ["T_ARQ", "Temperatura do ar de resfriamento", "T_ar", "°C", 225, "hipótese", 0],
  ["T_TRC", "Temperatura do ar do trocador", "T_trc", "°C", 150, "hipótese", 0],
  ["T_EXA", "Temperatura da exaustão do forno", "T_exa", "°C", 200, "hipótese", 0],
  ["EF_TRC", "Rendimento do trocador gás-gás (calor que chega ao ar)", "ε", "–", 0.85, "hipótese", "%"],
  ["AR_REC", "Ar de resfriamento aproveitado", "Q_ar,rec", "MJt/m²", "ROUND({ETA_REC}*{Q_RES0};2)", "Eq. (36)", 2],
  ["D_AR", "Ar de resfriamento descartado", "Q_ar,desc", "MJt/m²", "{Q_RES0}-{AR_REC}", "Eq. (36)", 2],
  ["M_AR", "Vazão do ar de resfriamento", "m_ar", "kg/m²", "{Q_RES0}*1000/({CP}*({T_ARQ}-25))", "Eq. (37)", 1],
 ]],
 ["Turbina a gás (30% H₂ + gás natural)", [
  ["ETA", "Rendimento elétrico da turbina", "η", "–", 0.35, "adotado a partir de Boyce (2012)", "%"],
  ["T_EX", "Temperatura do escape", "T_esc", "°C", 500, "Boyce (2012)", 0],
  ["CP_TG", "cp do escape da turbina", "c_p,esc", "kJ/(kg·K)", 1.10, "estimado de Çengel e Boles (2013)", 2],
  ["E_VENT", "Ventiladores da recuperação de calor", "E_vent", "MJe/m²", 0.60, "estimativa do grupo (hipótese)", 2],
  ["X_H2V", "H₂ na mistura (volume)", "x_V", "–", 0.30, "NETL (2022)", "%"],
  ["PCI_H2V", "PCI volumétrico do H₂", "PCI_H₂", "MJ/Nm³", 10.78, "estimado de Çengel e Boles (2013), a 0 °C", 2],
  ["PCI", "PCI do hidrogênio", "PCI", "MJ/kg", 120, "Çengel e Boles (2013)", 1],
  ["RHO_GN", "Massa específica do gás natural", "ρ_GN", "kg/m³", 0.75, "hipótese, a 20 °C; ANP (2026): 0,74 kg/m³", 2],
  ["E_TG", "Eletricidade gerada (planta + ventiladores)", "E_e", "MJe/m²", "ROUND({E_E0};2)+{E_VENT}", "Seção 5.2", 2],
  ["F_TG", "Energia do combustível da turbina", "F_TG", "MJ/m²", "{E_TG}/{ETA}", "Eq. (45)", 2],
  ["ESC", "Calor do escape", "Q_esc", "MJt/m²", "{F_TG}-{E_TG}", "Eq. (46)", 2],
  ["X_H2E", "Fração do H₂ em energia", "x_E", "–", "{X_H2V}*{PCI_H2V}/({X_H2V}*{PCI_H2V}+(1-{X_H2V})*{PCI_GN})", "Eq. (47)", 3],
  ["F_H2_TG", "Energia do H₂ na turbina", "F_H₂,TG", "MJ/m²", "{X_H2E}*{F_TG}", "Eq. (48)", 2],
  ["H2_TG", "H₂ da turbina", "m_H₂,TG", "kg/m²", "{F_H2_TG}/{PCI}", "Eq. (48)", 4],
  ["GN_TG", "Energia do gás natural na turbina", "F_GN,TG", "MJ/m²", "(1-{X_H2E})*{F_TG}", "Eq. (49)", 2],
  ["GN_NM3", "Gás natural da turbina", "V_GN", "m³/m²", "{GN_TG}/{PCI_GN}", "Eq. (49)", 3],
  ["GN_KG", "Gás natural da turbina (massa)", "m_GN", "kg/m²", "{GN_NM3}*{RHO_GN}", "Tabela 8", 3],
  ["M_ESC", "Vazão do escape", "m_esc", "kg/m²", "{ESC}*1000/({CP_TG}*({T_EX}-25))", "Eq. (50)", 2],
 ]],
 ["Atomizador", [
  ["T_AT", "Temperatura do gás na entrada do atomizador", "T_at", "°C", 550, "Della, Melo e Melo (2012)", 0],
  ["CP_G", "cp do gás de combustão", "c_p,g", "kJ/(kg·K)", 1.07, "estimado de Çengel e Boles (2013)", 2],
  ["M_AT_MAX", "Massa admissível de gás a 550 °C", "m_at,máx", "kg/m²", "{Q_AT}*1000/({CP_G}*({T_AT}-25))", "Eq. (43)", 1],
  ["M_AR_AT", "Ar de resfriamento enviado ao atomizador", "m_ar,at", "kg/m²", "({Q_AT}*1000-{M_ESC}*{CP_TG}*({T_AT}-25))/({CP}*({T_AT}-25))", "Eq. (53)", 2],
  ["AR_AT", "Calor do ar de resfriamento no atomizador", "Q_ar,at", "MJt/m²", "{M_AR_AT}*{CP}*({T_ARQ}-25)/1000", "Seção 7.3", 2],
  ["DUTO", "Queimador de duto (H₂)", "Q_duto", "MJt/m²", "{Q_AT}-{ESC}-{AR_AT}", "Eq. (54)", 2],
  ["H2_DUTO", "H₂ do queimador de duto", "m_H₂,duto", "kg/m²", "{DUTO}/{PCI}", "Eq. (54) ÷ PCI", 3],
  ["T_PRE", "Temperatura antes do queimador de duto", "T_pré", "°C", "25+({ESC}+{AR_AT})*1000/({M_ESC}*{CP_TG}+{M_AR_AT}*{CP})", "Seção 7.3", 0],
  ["M_GAS_AT", "Gás que entra no atomizador", "m_gás,at", "kg/m²", "{M_ESC}+{M_AR_AT}", "Seção 7.3", 2],
  ["E_AT_ESP", "Consumo por kg de água evaporada", "e_at", "MJ/kg", "{Q_AT}/{EV_AT}", "Eq. (32)", 2],
 ]],
 ["Secador", [
  ["AR_SEC", "Ar de resfriamento enviado ao secador", "Q_ar,sec", "MJt/m²", "{AR_REC}-{AR_AT}", "Eq. (55)", 2],
  ["TRC", "Calor do ar do trocador", "Q_trc", "MJt/m²", "{Q_SEC}-{AR_SEC}", "Eq. (56)", 2],
  ["M_AR_SEC", "Massa de ar de resfriamento no secador", "m_ar,sec", "kg/m²", "{AR_SEC}*1000/({CP}*({T_ARQ}-25))", "Seção 7.4", 2],
  ["M_TRC", "Massa de ar do trocador", "m_trc", "kg/m²", "{TRC}*1000/({CP}*({T_TRC}-25))", "Seção 7.4", 2],
  ["T_SEC_IN", "Temperatura de entrada no secador", "T_sec", "°C", "25+{Q_SEC}*1000/(MAX({M_AR_SEC}+{M_TRC},{Q_SEC}*1000/({CP}*({T_ARQ}-25)))*{CP})", "Eq. (57); com ar de sobra, entra só o necessário e a mistura não passa de T_ar", 0],
 ]],
 ["Forno a H₂ com O₂ da eletrólise", [
  ["LAMBDA", "Excesso de ar no forno a gás", "λ", "–", 1.15, "hipótese", 2],
  ["A_EST", "Ar estequiométrico do gás natural", "a_est", "kg/MJ", 0.344, "estimado de Çengel e Boles (2013)", 3],
  ["PCI_GN_M", "PCI mássico do gás natural", "PCI_GN,m", "MJ/kg", 50, "Çengel e Boles (2013)", 0],
  ["CP_V", "cp do vapor d’água", "c_p,v", "kJ/(kg·K)", 1.90, "Çengel e Boles (2013)", 2],
  ["MM_H2", "Massa molar do H₂", "M_H₂", "g/mol", 2.016, "Çengel e Boles (2013)", 3],
  ["MM_O2", "Massa molar do O₂", "M_O₂", "g/mol", 32.00, "Çengel e Boles (2013)", 2],
  ["MM_H2O", "Massa molar da água", "M_H₂O", "g/mol", 18.02, "Çengel e Boles (2013)", 2],
  ["PCI_CH4", "PCI molar do metano", "PCI_CH₄", "kJ/mol", 802, "Çengel e Boles (2013)", 0],
  ["O2_H2", "O₂ estequiométrico por kg de H₂", "m_O₂/m_H₂", "kg/kg", "ROUND(0.5*{MM_O2}/{MM_H2};2)", "Eq. (65)", 2],
  ["H2O_H2", "Água formada por kg de H₂", "m_H₂O/m_H₂", "kg/kg", "ROUND({MM_H2O}/{MM_H2};2)", "Eq. (66)", 2],
  ["H2O_GNE", "Água formada por MJ de gás natural", "m_H₂O/F_GN", "kg/MJ", "ROUND(2*{MM_H2O}/{PCI_CH4};3)", "Eq. (67)", 3],
  ["M_FOR_GN", "Exaustão do forno a gás", "m_exa", "kg/m²", "{Q_EXA0}*1000/({CP}*({T_EXA}-25))", "Eq. (38)", 2],
  ["AR_COMB", "Ar de combustão do forno a gás", "m_ar,comb", "kg/m²", "{Q_FOR0}*{A_EST}*{LAMBDA}", "Eq. (58)", 2],
  ["M_GN_FOR", "Gás natural do forno (massa)", "m_GN", "kg/m²", "{Q_FOR0}/{PCI_GN_M}", "Eq. (59)", 2],
  ["M_AR_PROC", "Ar de processo que atravessa o forno", "m_ar,proc", "kg/m²", "{M_FOR_GN}-{AR_COMB}-{M_GN_FOR}", "Eq. (59)", 2],
  ["FIXO", "Energia do forno que não depende da exaustão", "Q_fixo", "MJt/m²", "{Q_FOR0}-{Q_EXA0}", "Eq. (60)", 2],
  ["KA", "Calor do ar de processo na exaustão", "a", "MJ/m²", "{M_AR_PROC}*{CP}*({T_EXA}-25)/1000", "Eq. (61)", 2],
  ["KB", "Fração do calor que sai no vapor", "b", "–", "{H2O_H2}*{CP_V}*({T_EXA}-25)/1000/{PCI}", "Eq. (61)", 4],
  ["Q_F", "Calor do forno a H₂ + O₂", "Q_F", "MJt/m²", "({FIXO}+{KA})/(1-{KB})", "Eq. (62)", 2],
  ["ECON_F", "Economia do forno a O₂", "ΔQ_F", "MJt/m²", "{Q_FOR0}-{Q_F}", "Seção 7.5", 2],
  ["H2_FOR", "H₂ do forno", "m_H₂,forno", "kg/m²", "{Q_F}/{PCI}", "Seção 7.6", 3],
  ["H2O_FOR", "Vapor formado no forno", "m_v", "kg/m²", "{H2_FOR}*{H2O_H2}", "Seção 7.5", 2],
  ["M_EXA", "Exaustão do forno a O₂", "m_exa,F", "kg/m²", "{M_AR_PROC}+{H2O_FOR}", "Seção 7.5", 1],
  ["Q_EXA", "Calor da exaustão do forno a O₂", "Q_exa", "MJt/m²", "{KA}+{H2O_FOR}*{CP_V}*({T_EXA}-25)/1000", "Seção 7.5", 2],
  ["T_FOR_OUT", "Temperatura da exaustão após o trocador", "T_saída", "°C", "{T_EXA}-{TRC}/{EF_TRC}*1000/({M_AR_PROC}*{CP}+{H2O_FOR}*{CP_V})", "Eq. (63)", 0],
 ]],
 ["Hidrogênio, oxigênio, água e energia (por m²)", [
  ["L_KG", "Água consumida pelo eletrolisador", "–", "L/kg H₂", 10, "hipótese", 0],
  ["H2_TOT", "H₂ total", "m_H₂", "kg/m²", "({F_H2_TG}+{DUTO}+{Q_F})/{PCI}", "Eq. (64)", 3],
  ["H2_Q", "H₂ dos queimadores (forno + duto)", "m_H₂,q", "kg/m²", "({Q_F}+{DUTO})/{PCI}", "Tabela 8", 3],
  ["O2_TOT", "O₂ produzido na eletrólise", "m_O₂", "kg/m²", "{H2_TOT}*{O2_H2}", "Seção 7.6", 2],
  ["O2_FOR", "O₂ usado no forno", "m_O₂,F", "kg/m²", "{H2_FOR}*{O2_H2}", "Seção 7.6", 2],
  ["O2_VENDA", "O₂ disponível para venda", "m_O₂,venda", "kg/m²", "{O2_TOT}-{O2_FOR}", "Seção 7.6", 2],
  ["H2O_COMB", "Água formada na combustão", "m_H₂O", "kg/m²", "{H2_TOT}*{H2O_H2}+{GN_TG}*{H2O_GNE}", "Seção 7.6", 2],
  ["AGUA_ELZ", "Água para a eletrólise", "V_ELZ", "L/m²", "{H2_TOT}*{L_KG}", "Seção 7.6", 1],
  ["REC_TOT", "Calor recuperado do forno", "Q_rec", "MJt/m²", "{AR_REC}+{TRC}", "Eq. (81)", 2],
  ["ENT_TOT", "Energia que entra (H₂ + GN + recuperado)", "Σ entra", "MJ/m²", "{H2_TOT}*{PCI}+{GN_TG}+{REC_TOT}", "Eq. (81)", 2],
  ["USO_TOT", "Energia usada (forno + atomizador + secador + eletricidade)", "Σ usos", "MJ/m²", "{Q_F}+{Q_AT}+{Q_SEC}+{E_TG}", "Eq. (81)", 2],
  ["ENT_FAB", "Energia comprada pela fábrica (H₂ + GN)", "E_fáb", "MJ/m²", "{H2_TOT}*{PCI}+{GN_TG}", "Seção 8.3", 2],
 ]],
 ["Emissões", [
  ["FE_FV", "Ciclo de vida da FV (mediana)", "FE_FV", "kg CO₂e/kWh", 0.048, "Schlömer et al. (2014)", 3],
  ["CO2_P", "CO₂ do ciclo proposto", "CO₂,P", "kg/m²", "{GN_TG}*{FE_GN}", "Eq. (82)", 2],
  ["RED_CO2", "Redução de CO₂ em relação ao ciclo 0", "Δ_CO₂", "–", "1-{CO2_P}/{CO2_0}", "Eq. (83)", "%"],
  ["RED_GN", "Redução de gás natural", "Δ_GN", "–", "1-{GN_NM3}/{V_GN0}", "Tabela 9", "%"],
 ]],
 ["Eletrolisador alcalino e campo fotovoltaico", [
  ["YIELD_N", "Produtividade da FV (placas ao norte)", "Y_N", "kWh/(kWp·ano)", 1300, "adotado; Canal Solar (2022): 1.222 a 1.423", 0],
  ["F_LO", "Perda do leiaute leste-oeste", "f_LO", "–", 0.125, "meio da faixa de 10% a 15% (PV Magazine USA, 2021)", "%"],
  ["DENS", "Densidade do campo leste-oeste", "D_LO", "MWp/ha", 1.35, "meio da faixa de 1,2 a 1,5 (PV Magazine USA, 2021)", 2],
  ["MOD_W", "Potência da placa", "P_placa", "Wp", 620, "catálogo (TOPCon)", 0],
  ["MOD_L", "Comprimento da placa", "–", "m", 2.382, "catálogo", 3],
  ["MOD_B", "Largura da placa", "–", "m", 1.134, "catálogo", 3],
  ["F_PICO", "Pico da FV / potência do campo (memorial)", "–", "–", 0.72, "estimativa", 2],
  ["H_OP", "Horas de funcionamento do eletrolisador por dia (parado na ponta dos dias úteis)", "h_op", "h/dia", 21.857142857, "ANEEL, REN 1.000/2021 (dias úteis) e REH 3.602/2026, Art. 12", 2],
  ["DISP", "Disponibilidade do eletrolisador", "η_disp", "–", 0.95, "hipótese", "%"],
  ["PERDAS", "Perdas na rede entre o campo e a fábrica", "f_perdas", "–", 0.03, "hipótese", "%"],
  ["Z_H2", "Fator de compressibilidade do H₂ a 200 bar", "Z", "–", 1.13, "hipótese", 2],
  ["P_ARM", "Pressão de estocagem", "p", "bar", 200, "hipótese", 0],
  ["R_U", "Constante universal dos gases", "R", "J/(mol·K)", 8.314, "Çengel e Boles (2013)", 3],
  ["T_K", "Temperatura de estocagem", "T", "K", 298.15, "25 °C", 2],
  ["CAMPO", "Área de um campo de futebol (105 × 68 m)", "–", "m²", 7140, "referência", 0],
  ["KWH_KG", "Consumo do eletrolisador alcalino por kg de H₂", "e_ELZ", "kWh/kg", 58, "calculado de IEA (2025): 57,5 na China + compressão (hipótese), arredondado", 0],
  ["E_PV_M2", "Eletricidade da FV por m²", "E_ELZ", "kWh/m²", "{H2_TOT}*{KWH_KG}", "Eq. (71)", 2],
  ["CO2_FV", "CO₂ de ciclo de vida da FV (com as perdas na rede)", "CO₂,FV", "kg/m²", "{E_PV_M2}*(1+{PERDAS})*{FE_FV}", "Eq. (85)", 2],
  ["Y_LO", "Produtividade no leiaute leste-oeste", "Y_LO", "kWh/(kWp·ano)", "{YIELD_N}*(1-{F_LO})", "Eq. (74)", 1],
  ["RHO_CALC", "Massa específica do H₂ a 200 bar", "ρ", "kg/m³", "{P_ARM}*100000*{MM_H2}/1000/({Z_H2}*{R_U}*{T_K})", "Eq. (68)", 2],
  ["RHO_200", "Massa específica adotada", "ρ", "kg/m³", "ROUND({RHO_CALC};1)", "Eq. (69)", 1],
  ["KWP_M2", "Potência FV por m²/dia de produção", "p_FV", "kWp/(m²/dia)", "{E_PV_M2}*365*(1+{PERDAS})/{Y_LO}", "Eq. (79)", 2],
 ]],
 ["Na produção escolhida (por dia)", [
  ["H2_DIA", "H₂ por dia", "m_H₂·P", "kg/dia", "{H2_TOT}*{P}", "Eq. (64) × P", 1],
  ["GN_DIA", "Gás natural por dia", "V_GN·P", "m³/dia", "{GN_NM3}*{P}", "Eq. (49) × P", 1],
  ["O2_DIA", "O₂ produzido por dia", "m_O₂·P", "kg/dia", "{O2_TOT}*{P}", "Seção 7.6 × P", 1],
  ["O2_VENDA_DIA", "O₂ para venda por dia", "–", "kg/dia", "{O2_VENDA}*{P}", "Seção 7.6 × P", 1],
  ["AGUA_DIA", "Água para a eletrólise por dia", "–", "L/dia", "{AGUA_ELZ}*{P}", "Seção 7.6 × P", 1],
  ["CO2_DIA", "CO₂ do ciclo proposto por dia", "–", "kg/dia", "{CO2_P}*{P}", "Eq. (82) × P", 1],
  ["CO2_0_DIA", "CO₂ do ciclo 0 por dia", "–", "kg/dia", "{CO2_0}*{P}", "Eq. (35) × P", 1],
  ["P_TG", "Potência elétrica da turbina", "P_TG", "kW", "{E_TG}*{P}/86.4", "Eq. (51)", 1],
  ["E_ELZ", "Eletricidade do eletrolisador por dia", "E_ELZ,dia", "kWh/dia", "{H2_DIA}*{KWH_KG}", "Eq. (71)", 1],
  ["P_MED", "Potência média do eletrolisador", "P_ELZ,méd", "kW", "{E_ELZ}/24", "Eq. (72)", 1],
  ["P_FV", "Potência do campo fotovoltaico", "P_FV", "kWp", "{E_ELZ}*365*(1+{PERDAS})/{Y_LO}", "Eq. (75)", 1],
  ["P_INST", "Potência instalada do eletrolisador (ligado à rede)", "P_ELZ,inst", "kW", "{E_ELZ}/({H_OP}*{DISP})", "ligação à rede", 1],
  ["N_PLACAS", "Número de placas", "N", "–", "{P_FV}*1000/{MOD_W}", "Eq. (76)", 0],
  ["A_PLACAS", "Área de placas", "A_placas", "m²", "{N_PLACAS}*{MOD_L}*{MOD_B}", "Eq. (77)", 1],
  ["A_TER", "Terreno do campo fotovoltaico", "A_terreno", "m²", "{P_FV}/1000/{DENS}*10000", "Eq. (78)", 1],
  ["A_TER_HA", "Terreno do campo fotovoltaico", "A_terreno", "ha", "{A_TER}/10000", "Eq. (78)", 2],
  ["N_CAMPOS", "Terreno em campos de futebol", "–", "campos", "{A_TER}/{CAMPO}", "comparação", 2],
  ["V_EST", "Estoque de H₂ para 1 dia a 200 bar", "V_est", "m³", "{H2_DIA}/{RHO_200}", "Eq. (69)", 1],
 ]],
];

/* ── avaliação ── */
const DEFS = [];
GRUPOS.forEach(([g, linhas]) => linhas.forEach(l => DEFS.push({ id: l[0], nome: l[1], sym: l[2], un: l[3], x: l[4], ref: l[5], fmt: l[6], grupo: g })));
const IDX = {}; DEFS.forEach((d, i) => { if (IDX[d.id] !== undefined) throw new Error("id repetido " + d.id); IDX[d.id] = i; });
function ROUND_(x, n) { const f = Math.pow(10, n); return Math.round((x + Math.sign(x) * 1e-12) * f) / f; }
/* avaliador de expressões sem eval (funciona em páginas com CSP restrita) */
function compila(src) {
  const tk = []; const re = /\s*(\{\w+\}|[A-Za-z_][A-Za-z0-9_]*|\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+|[-+*\/(),;])/g; let m, pos = 0;
  while (pos < src.length && (m = re.exec(src)) && m.index === pos) { tk.push(m[1]); pos = re.lastIndex; }
  if (pos < src.trim().length && pos < src.length && src.slice(pos).trim()) throw new Error("expressão inválida: " + src);
  let i = 0; const ver = () => tk[i], prox = () => tk[i++];
  const FUN = { ROUND: (a, b) => ROUND_(a, b), MAX: Math.max, MIN: Math.min };
  function expr() { let a = termo(); while (ver() === "+" || ver() === "-") { const op = prox(), l = a, r = termo(); a = op === "+" ? v => l(v) + r(v) : v => l(v) - r(v); } return a; }
  function termo() { let a = fator(); while (ver() === "*" || ver() === "/") { const op = prox(), l = a, r = fator(); a = op === "*" ? v => l(v) * r(v) : v => l(v) / r(v); } return a; }
  function fator() {
    const t = prox();
    if (t === "-") { const f = fator(); return v => -f(v); }
    if (t === "(") { const e = expr(); prox(); return e; }
    if (/^[\d.]/.test(t)) { const n = parseFloat(t); return () => n; }
    if (t[0] === "{") { const k = t.slice(1, -1); return v => v[k]; }
    if (FUN[t] && ver() === "(") { prox(); const args = [expr()]; while (ver() === "," || ver() === ";") { prox(); args.push(expr()); } prox(); const fn = FUN[t]; return v => fn(...args.map(a => a(v))); }
    return v => v[t];
  }
  const raiz = expr(); if (i !== tk.length) throw new Error("expressão inválida: " + src);
  return raiz;
}
DEFS.forEach(d => {
  if (typeof d.x === "string") {
    d.deps = [...d.x.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
    d.deps.forEach(k => { if (IDX[k] === undefined || IDX[k] >= IDX[d.id]) throw new Error(`dependência inválida ${k} em ${d.id}`); });
    d.fn = compila(d.x);
  }
});
function calcular(P, extra) {
  const v = {};
  DEFS.forEach(d => {
    if (d.id === "P") v.P = P;
    else if (extra && extra[d.id] !== undefined && typeof d.x !== "string") v[d.id] = extra[d.id];
    else v[d.id] = (typeof d.x === "string") ? d.fn(v) : d.x;
  });
  return v;
}
if (typeof module !== "undefined") module.exports = { GRUPOS, DEFS, IDX, calcular, compila };
