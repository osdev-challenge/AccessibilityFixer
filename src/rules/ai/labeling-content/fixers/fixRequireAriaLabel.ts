import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { RequireAriaLabelStrategy } from "../strategies/requireAriaLabel.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixRequireAriaLabel(rc: RuleContext): Promise<string> {
  const ctx = extractLabelingContext(rc);
  return runAIFix(RequireAriaLabelStrategy, ctx, callGpt);
}
