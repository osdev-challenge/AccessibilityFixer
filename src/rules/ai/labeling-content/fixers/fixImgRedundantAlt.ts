import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { ImgRedundantAltStrategy } from "../strategies/imgRedundantAlt.strategy";
import { callGpt } from "../../../../ai/aiClient";
import { fixAltText } from "./fixAltText";

export async function fixImgRedundantAlt(rc: RuleContext): Promise<string> {
  const ctx = extractLabelingContext(rc);
  const first = await runAIFix(ImgRedundantAltStrategy, ctx, callGpt);
  // alt가 비게 되거나 사라졌다면 alt-text로 재보강
  if (!/alt\s*=/.test(first) || /alt\s*=\s*["']\s*["']/.test(first)) {
    return fixAltText({ ...rc, codeSnippet: first });
  }
  return first;
}
