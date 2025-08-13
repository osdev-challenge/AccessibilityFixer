import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { AriaRoleStrategy } from "../strategies/ariaRole.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixAriaRole(rc: RuleContext): Promise<string> {
  const ctx = extractElementA11yContext(rc);
  return runAIFix(AriaRoleStrategy, ctx, callGpt);
}
