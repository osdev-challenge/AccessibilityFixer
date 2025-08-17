import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { AltTextStrategy } from "../strategies/altText.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixAltText(rc: RuleContext): Promise<string> {
  const ctx = extractLabelingContext(rc);
  return runAIFix(AltTextStrategy, ctx, callGpt);
}
