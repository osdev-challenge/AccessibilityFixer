import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { NoInteractiveToNoninteractiveStrategy } from "../strategies/noInteractiveToNoninteractive.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixNoInteractiveToNoninteractive(rc: RuleContext): Promise<string> {
  const ctx = extractElementA11yContext(rc);
  return runAIFix(NoInteractiveToNoninteractiveStrategy, ctx, callGpt);
}
