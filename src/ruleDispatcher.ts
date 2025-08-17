import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "./rules/types";
import { fixAccessibleEmoji } from "./rules/ai/labeling-content/fixers/fixAccessibleEmoji";
import { fixAriaProps } from "./rules/ai/aria-role/fixers/fixAriaProps";

const ruleFixers: Record<string, RuleFixer> = {
  "jsx-a11y/accessible-emoji": fixAccessibleEmoji,
  "jsx-a11y/aria-props": fixAriaProps
};

export async function dispatchRule(
  context: RuleContext
): Promise<vscode.CodeAction[]> {
  const fixer = ruleFixers[context.ruleName];
  if (fixer) {
    console.log(`✅ [${context.ruleName}] 규칙 수정 로직 실행`);
    return await Promise.resolve(fixer(context)); // 동기/비동기 둘 다 처리
  }
  console.warn(`⚠️ [${context.ruleName}] 규칙에 대한 수정 로직이 없습니다.`);
  return [];
}
