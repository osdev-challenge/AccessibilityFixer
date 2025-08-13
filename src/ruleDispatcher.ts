<<<<<<< HEAD
// src/ruleDispatcher.ts

import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "./rules/types";

// 각 로직 파일 import
import { ariaActivedescendantHasTabindexFix } from "./rules/logic/aria-activedescendant-has-tabindex";
import { clickEventsHaveKeyEventsFix } from "./rules/logic/click-events-have-key-events";
import { interactiveSupportsFocusFix } from "./rules/logic/interactive-supports-focus";
import { mouseEventsHaveKeyEventsFix } from "./rules/logic/mouse-events-have-key-events";
import { tabindexNoPositiveFix } from "./rules/logic/tabindex-no-positive";

// 규칙 이름과 수정 로직 함수를 매핑하는 객체
const ruleFixers: { [key: string]: RuleFixer } = {
  "jsx-a11y/aria-activedescendant-has-tabindex":
    ariaActivedescendantHasTabindexFix,
  "jsx-a11y/click-events-have-key-events": clickEventsHaveKeyEventsFix,
  "jsx-a11y/interactive-supports-focus": interactiveSupportsFocusFix,
  "jsx-a11y/mouse-events-have-key-events": mouseEventsHaveKeyEventsFix,
  "jsx-a11y/tabindex-no-positive": tabindexNoPositiveFix,
};

export function dispatchRule(context: RuleContext): vscode.CodeAction[] {
  const fixFunction = ruleFixers[context.ruleName];

  if (fixFunction) {
    console.log(`✅ [${context.ruleName}] 규칙 수정 로직 실행`); // 이 로그는 유지
    return fixFunction(context);
  }

  console.warn(`⚠️ [${context.ruleName}] 규칙에 대한 수정 로직이 없습니다.`); // 이 경고는 유지
  return [];
=======
// 규칙 이름 → 처리 함수 실행 (AI/로직 기반 분기 포함)
import { RuleContext } from "./rules/types";
import {
  fixAriaProps,
  fixAriaRole,
  fixNoInteractiveToNoninteractive,
  fixNoNoninteractiveToInteractive
} from "./rules/ai/aria-role";

type Fixer = (rc: RuleContext) => Promise<string>;

const handlers: Record<string, Fixer> = {
  "aria-props": fixAriaProps,
  "aria-role": fixAriaRole,
  "no-interactive-element-to-noninteractive-role": fixNoInteractiveToNoninteractive,
  "no-noninteractive-element-to-interactive-role": fixNoNoninteractiveToInteractive,
  // labeling-content 쪽은 다음 턴에 추가
};

export function getFixer(ruleName: string): Fixer | undefined {
  return handlers[ruleName];
>>>>>>> e05bbed (feat(aria-role): 파이프라인 활용 코드 생성(refs #이슈번호))
}
