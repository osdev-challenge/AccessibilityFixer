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
import { buildAccessibleEmojiPrompt } from "../prompts/accessibleEmojiPrompt";
import {
  runAIFix,
  RuleStrategy,
  AiFixResult,
} from "../../../../ai/pipelines/runAIFix";

// Inline Strategy 정의
const AccessibleEmojiStrategy: RuleStrategy<LabelingContext> = {
  id: "accessible-emoji",
  buildPrompt: buildAccessibleEmojiPrompt,
  parseResponse: parseFixedCodeJson,
};

export async function fixAccessibleEmoji(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);
  const callGpt = getGpt();

  const result: AiFixResult = await runAIFix(
    AccessibleEmojiStrategy,
    ctx,
    callGpt,
    {
      log: true,
      ruleName: "accessible-emoji",
      validateJsx: true,
    }
  );

  if (result.kind === "whole-element") {
    const elementRanges = findElementRanges(rc.document, rc.range.start);

    if (elementRanges) {
      const replaceAction = buildReplaceWholeElementAction(
        rc.document,
        elementRanges.element,
        result.html,
        "이모지에 접근성 속성 추가"
      );
      return [replaceAction];
    } else {
      console.warn(
        "[A11Y][accessible-emoji] Could not find element ranges to apply whole-element fix."
      );
    }
  }

  return [];
}
