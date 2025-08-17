import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { FormHasLabelStrategy } from "../strategies/formHasLabel.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixFormHasLabel(rc: RuleContext): Promise<string> {
  const ctx = extractLabelingContext(rc);
  return runAIFix(FormHasLabelStrategy, ctx, callGpt);
}
