import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { NoNoninteractiveToInteractiveStrategy } from "../strategies/noNoninteractiveToInteractive.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixNoNoninteractiveToInteractive(rc: RuleContext): Promise<string> {
  const ctx = extractElementA11yContext(rc);
  return runAIFix(NoNoninteractiveToInteractiveStrategy, ctx, callGpt);
}
