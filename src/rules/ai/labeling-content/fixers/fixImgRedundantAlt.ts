import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractLabelingContext, LabelingContext } from "../../../../ai/context/extractLabelingContext";
import { callGpt } from "../../../../ai/aiClient";
import { parseFixedCodeJson, findElementRanges } from "../../../../ai/pipelines/parsers";
import { buildReplaceWholeElementAction } from "../../../../ai/pipelines/codeActions";
import { buildImgRedundantAltPrompt } from "../prompts/imgRedundantAltPrompt";
import { runAIFix, RuleStrategy, AiFixResult } from "../../../../ai/pipelines/runAIFix";

// Inline Strategy 정의
const ImgRedundantAltStrategy: RuleStrategy<LabelingContext> = {
  id: 'img-redundant-alt',
  buildPrompt: buildImgRedundantAltPrompt,
  parseResponse: parseFixedCodeJson,
};

export async function fixImgRedundantAlt(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);

  const result: AiFixResult = await runAIFix(ImgRedundantAltStrategy, ctx, callGpt, {
    log: true,
    ruleName: 'img-redundant-alt',
    validateJsx: true,
  });
  
  if (result.kind === 'whole-element') {
    const elementRanges = findElementRanges(rc.document, rc.range.start);

    if (elementRanges) {
      const replaceAction = buildReplaceWholeElementAction(
        rc.document,
        elementRanges.element,
        result.html,
        "Remove redundant words from img alt"
      );
      return [replaceAction];
    } else {
      console.warn('[A11Y][img-redundant-alt] Could not find element ranges to apply whole-element fix.');
    }
  }

  return [];
}