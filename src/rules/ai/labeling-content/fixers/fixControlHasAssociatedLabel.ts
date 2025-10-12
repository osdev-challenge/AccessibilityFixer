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
import { buildControlHasAssociatedLabelPrompt } from "../prompts/controlLabelingPrompt";
import {
  runAIFix,
  RuleStrategy,
  AiFixResult,
} from "../../../../ai/pipelines/runAIFix";

// Inline Strategy 정의
const ControlHasAssociatedLabelStrategy: RuleStrategy<LabelingContext> = {
  id: "control-has-associated-label",
  buildPrompt: buildControlHasAssociatedLabelPrompt,
  parseResponse: parseFixedCodeJson,
};

export async function fixControlHasAssociatedLabel(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);
  const callGpt = getGpt();

  const result: AiFixResult = await runAIFix(
    ControlHasAssociatedLabelStrategy,
    ctx,
    callGpt,
    {
      log: true,
      ruleName: "control-has-associated-label",
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
        "컨트롤에 레이블 연결"
      );
      return [replaceAction];
    } else {
      console.warn(
        "[A11Y][control-has-associated-label] Could not find element ranges to apply whole-element fix."
      );
    }
  }

  return [];
}
