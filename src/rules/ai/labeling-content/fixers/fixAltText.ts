import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import {
  extractLabelingContext,
  LabelingContext,
} from "../../../../ai/context/extractLabelingContext";
import { getGpt } from "../../../../ai/aiSingleton";
import {
  parseFixedCodeJson,
  findElementRanges,
} from "../../../../ai/pipelines/parsers";
import { buildReplaceWholeElementAction } from "../../../../ai/pipelines/codeActions";
import { buildAltTextPrompt } from "../prompts/altTextPrompt";
import {
  runAIFix,
  RuleStrategy,
  AiFixResult,
} from "../../../../ai/pipelines/runAIFix";

// Inline Strategy 정의
const AltTextStrategy: RuleStrategy<LabelingContext> = {
  id: "alt-text",
  buildPrompt: buildAltTextPrompt,
  parseResponse: parseFixedCodeJson,
};

export async function fixAltText(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);
  const callGpt = getGpt();

  // runAIFix 파이프라인 사용
  const result: AiFixResult = await runAIFix(AltTextStrategy, ctx, callGpt, {
    log: true,
    ruleName: "alt-text",
    validateJsx: true,
  });

  if (result.kind === "whole-element") {
    const elementRanges = findElementRanges(rc.document, rc.range.start);

    if (elementRanges) {
      const replaceAction = buildReplaceWholeElementAction(
        rc.document,
        elementRanges.element,
        result.html,
        "이미지에 alt 속성 추가/개선"
      );
      return [replaceAction];
    } else {
      console.warn(
        "[A11Y][alt-text] Could not find element ranges to apply whole-element fix."
      );
    }
  }

  return [];
}
