import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import {
  // 1. ElementA11yContext 대신 LabelingContext 관련 함수와 타입을 가져옵니다.
  extractLabelingContext,
  LabelingContext,
} from "../../../../ai/context/extractLabelingContext";
import {
  runAIFix,
  RuleStrategy,
  AiFixResult,
} from "../../../../ai/pipelines/runAIFix";
import {
  findElementRanges,
  parseFixedCodeJson,
} from "../../../../ai/pipelines/parsers";
import { buildReplaceWholeElementAction } from "../../../../ai/pipelines/codeActions";
import { approveOrNull } from "../../../../utils/scoring";
import { buildAnchorHasContentPrompt } from "../prompts/anchorHasContentPrompt";
import { getGpt } from "../../../../ai/aiSingleton";

/** labeling-content는 strategy 파일을 분리하지 않고, fixer 내부에 inline strategy를 둡니다. */
// 2. Strategy가 사용하는 컨텍스트 타입을 LabelingContext로 변경합니다.
const AnchorHasContentInlineStrategy: RuleStrategy<LabelingContext> = {
  id: "anchor-has-content",

  // 보수적 tryLogic: 내용 없으면 aria-label="link"만 부여
  tryLogic(ctx) {
    // 3. LabelingContext의 'snippet' 속성을 사용하도록 수정합니다. (기존 code -> snippet)
    const code = ctx.snippet || "";
    const isAnchor = /<\s*a[\s>]/i.test(code);
    if (!isAnchor) return null;

    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(code);
    const hasLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/i.test(code);
    const hasTitle = /\btitle\s*=\s*["'][^"']+["']/i.test(code);
    // 4. LabelingContext의 'textContent'를 사용하여 콘텐츠 유무를 더 정확히 판단합니다.
    if (hasAriaLabel || hasLabelledBy || hasTitle || ctx.textContent)
      return null;

    if (/<\s*a[^>]*>[\s]*<\/\s*a\s*>/i.test(code)) {
      const withLabel = code.replace(
        /<\s*a([^>]*)>/i,
        (_m, attrs) => `<a${attrs} aria-label="link">`
      );
      return approveOrNull(withLabel, ["deterministic"]);
    }
    return null;
  },

  buildPrompt: buildAnchorHasContentPrompt,
  parseResponse: parseFixedCodeJson,
};

export async function fixAnchorHasContent(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  // 5. extractLabelingContext를 호출하도록 수정합니다.
  const ctx = extractLabelingContext(rc);
  const callGpt = getGpt();

  const result: AiFixResult = await runAIFix(
    AnchorHasContentInlineStrategy,
    ctx,
    callGpt,
    {
      log: true,
      ruleName: "anchor-has-content",
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
        "링크에 콘텐츠 추가"
      );
      return [replaceAction];
    } else {
      console.warn(
        "[A11Y][anchor-has-content] Could not find element ranges to apply whole-element fix."
      );
    }
  }

  return [];
}