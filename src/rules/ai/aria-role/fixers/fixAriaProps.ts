import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { AriaPropsStrategy } from "../strategies/ariaProps.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixAriaProps(rc: RuleContext): Promise<string> {
  const ctx = extractElementA11yContext(rc);
  return runAIFix(AriaPropsStrategy, ctx, callGpt);
}
