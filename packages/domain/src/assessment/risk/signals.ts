export type RiskSignal = {
  id: string;
  pattern: RegExp;
  description: string;
};

/** Señales configurables (REQ-ETH-08). Sin números de emergencia en código. */
export const USER_RISK_SIGNALS: RiskSignal[] = [
  { id: "suicide_ideation", pattern: /\b(suicid|suicidarme|quitarme la vida|no quiero vivir|matarme|quiero morir)\b/i, description: "Ideación suicida" },
  { id: "self_harm", pattern: /\b(cortarme|cortar|autolesion|hacerme daño)\b/i, description: "Autolesión" },
  { id: "plan", pattern: /\b(tengo un plan|voy a hacerlo esta noche)\b/i, description: "Plan concreto" },
  { id: "means", pattern: /\b((tengo|conseguí|ya conseguí).*(pastillas|arma|cuerda)|(pastillas|arma|cuerda).*(tengo|conseguí))\b/i, description: "Medios" },
  { id: "goodbye", pattern: /\b(despedirme de todos|dejar una carta)\b/i, description: "Despedida" },
  { id: "hopeless", pattern: /\b(no hay salida|sin esperanza|nada que perder)\b/i, description: "Desesperanza severa" },
  { id: "end_life", pattern: /\b(acabar con (todo|mi vida))\b/i, description: "Fin de vida" },
  { id: "hurt_others", pattern: /\b(hacerle daño a (alguien|mi))\b/i, description: "Daño a terceros" },
];

export const MODEL_RISK_SIGNALS: RiskSignal[] = [
  { id: "model_crisis", pattern: /\bcrisis\b/i, description: "Mención de crisis en salida" },
  { id: "model_diagnosis", pattern: /\b(diagnóstico|trastorno|dsm|cie-)\b/i, description: "Lenguaje clínico" },
  { id: "model_emergency", pattern: /\bemergencia\b/i, description: "Emergencia en salida" },
];