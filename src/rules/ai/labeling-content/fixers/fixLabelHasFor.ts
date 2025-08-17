import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { LabelHasForStrategy } from "../strategies/labelHasFor.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixLabelHasFor(rc: RuleContext): Promise<string> {
  const ctx = extractLabelingContext(rc);
  return runAIFix(LabelHasForStrategy, ctx, callGpt);
}
