import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import {
  extractElementA11yContext,
  ElementA11yContext,
} from "../../../../ai/context/extractElementA11yContext";
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
const AnchorHasContentInlineStrategy: RuleStrategy<ElementA11yContext> = {
  id: "anchor-has-content",

  // 보수적 tryLogic: 내용 없으면 aria-label="link"만 부여
  tryLogic(ctx) {
    const code = ctx.code || "";
    const isAnchor = /<\s*a[\s>]/i.test(code);
    if (!isAnchor) return null;

    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(code);
    const hasLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/i.test(code);
    const hasTitle = /\btitle\s*=\s*["'][^"']+["']/i.test(code);
    const hasContentText = />\s*[^<>\s][\s\S]*<\/\s*a\s*>/i.test(code);
    if (hasAriaLabel || hasLabelledBy || hasTitle || hasContentText)
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
  const ctx = extractElementA11yContext(rc);
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
        "Apply AI: anchor-has-content"
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
