import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { ControlHasAssociatedLabelStrategy } from "../strategies/controlHasAssociatedLabel.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixControlHasAssociatedLabel(rc: RuleContext): Promise<string> {
  const ctx = extractLabelingContext(rc);
  return runAIFix(ControlHasAssociatedLabelStrategy, ctx, callGpt);
}
