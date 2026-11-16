import { MODEL_RISK_SIGNALS, USER_RISK_SIGNALS, type RiskSignal } from "./signals";

export type RiskEvaluation = {
  triggered: boolean;
  signalIds: string[];
};

function matchSignals(text: string, signals: RiskSignal[]): string[] {
  const ids: string[] = [];
  for (const signal of signals) {
    if (signal.pattern.test(text)) {
      ids.push(signal.id);
    }
  }
  return ids;
}

export function evaluateUserMessage(text: string): RiskEvaluation {
  const signalIds = matchSignals(text, USER_RISK_SIGNALS);
  return { triggered: signalIds.length > 0, signalIds };
}

export function evaluateModelOutput(text: string): RiskEvaluation {
  const signalIds = matchSignals(text, MODEL_RISK_SIGNALS);
  return { triggered: signalIds.length > 0, signalIds };
}