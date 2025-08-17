import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { AccessibleEmojiStrategy } from "../strategies/accessibleEmoji.strategy";
import { callGpt } from "../../../../ai/aiClient";

export async function fixAccessibleEmoji(rc: RuleContext): Promise<string> {
  const ctx = extractLabelingContext(rc);
  return runAIFix(AccessibleEmojiStrategy, ctx, callGpt);
}
