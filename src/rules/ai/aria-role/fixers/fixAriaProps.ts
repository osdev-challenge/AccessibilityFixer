import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix, AiFixResult } from "../../../../ai/pipelines/runAIFix";
import { AriaPropsStrategy } from "../strategies/ariaProps.strategy";
import { getGpt } from "../../../../ai/aiSingleton";
import { findElementRanges } from "../../../../ai/pipelines/parsers";
import { buildReplaceWholeElementAction } from "../../../../ai/pipelines/codeActions";

export async function fixAriaProps(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  const ctx = extractElementA11yContext(rc);
  const callGpt = getGpt();

  const result: AiFixResult = await runAIFix(AriaPropsStrategy, ctx, callGpt, {
    log: true,
    ruleName: "aria-props",
    validateJsx: true,
  });

  // AI 수정 결과가 'whole-element' 인지 확인합니다.
  if (result.kind === "whole-element") {
    // 현재 오류 위치를 기준으로 전체 요소의 범위를 찾습니다.
    const elementRanges = findElementRanges(rc.document, rc.range.start);

    if (elementRanges) {
      // 요소 전체를 교체하는 CodeAction을 생성합니다.
      const replaceAction = buildReplaceWholeElementAction(
        rc.document,
        elementRanges.element, // 요소 전체 범위
        result.html, // AI가 생성한 완성된 HTML
        "Apply AI: Fix aria-props (replace element)"
      );
      return [replaceAction];
    } else {
      console.warn(
        "[A11Y][aria-props] Could not find element ranges to apply whole-element fix."
      );
    }
  }

  // AI가 수정을 제안하지 않았거나, 요소 범위를 찾지 못한 경우 빈 배열을 반환합니다.
  return [];
}
