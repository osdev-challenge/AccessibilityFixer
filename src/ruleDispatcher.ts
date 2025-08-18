// src/ruleDispatcher.ts
import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "./rules/types";
  
// 각 로직 파일 import
import { ariaActivedescendantHasTabindexFix } from "./rules/logic/aria-activedescendant-has-tabindex";
import { clickEventsHaveKeyEventsFix } from "./rules/logic/click-events-have-key-events";
import { interactiveSupportsFocusFix } from "./rules/logic/interactive-supports-focus";
import { mouseEventsHaveKeyEventsFix } from "./rules/logic/mouse-events-have-key-events";
import { tabindexNoPositiveFix } from "./rules/logic/tabindex-no-positive";
import { fixAriaAttributes } from "./rules/logic/aria-proptypes";
import { fixUnsupportedElements } from "./rules/logic/aria-unsupported-elements";
import { fixHeadingHasContentCombined } from "./rules/logic/heading-has-content";
import { fixNoAccessKey } from "./rules/logic/no-access-key";
import { fixHtmlHasLang } from "./rules/logic/html-has-lang";
import { fixNoAriaHiddenOnFocusable } from "./rules/logic/no-aria-hidden-on-focusable";
import { fixNoDistractingElements } from "./rules/logic/no-distracting-elements";
import { fixNoStaticElementInteractions } from "./rules/logic/no-static-element-interactions";
import { fixRequiredAria } from "./rules/logic/role-has-required-aria-props";
import { fixRoleSupportsAriaProps } from "./rules/logic/role-supports-aria-props";

// 규칙 이름과 수정 로직 함수를 매핑하는 객체
const ruleFixers: { [key: string]: RuleFixer } = {
  "jsx-a11y/aria-activedescendant-has-tabindex": ariaActivedescendantHasTabindexFix,
  "jsx-a11y/click-events-have-key-events": clickEventsHaveKeyEventsFix,
  "jsx-a11y/interactive-supports-focus": interactiveSupportsFocusFix,
  "jsx-a11y/mouse-events-have-key-events": mouseEventsHaveKeyEventsFix,
  "jsx-a11y/tabindex-no-positive": tabindexNoPositiveFix,
  "jsx-a11y/aria-proptypes": fixAriaAttributes,
  "jsx-a11y/aria-unsupported-elements": fixUnsupportedElements,
  "jsx-a11y/heading-has-content": fixHeadingHasContentCombined,
  "jsx-a11y/no-access-key": fixNoAccessKey,
  "jsx-a11y/html-has-lang": fixHtmlHasLang,
  "jsx-a11y/no-aria-hidden-on-focusable": fixNoAriaHiddenOnFocusable,
  "jsx-a11y/no-distracting-elements": fixNoDistractingElements,
  "jsx-a11y/no-static-element-interactions" : fixNoStaticElementInteractions,
  "jsx-a11y/role-has-required-aria-props" : fixRequiredAria,
  "jsx-a11y/role-supports-aria-props" : fixRoleSupportsAriaProps,
};

export function dispatchRule(context: RuleContext): vscode.CodeAction[] {
  const fixFunction = ruleFixers[context.ruleName];

  // ✅ 여기서 로깅 (diagnostic 필요 없음)
  console.log('FIXER keys =', Object.keys(ruleFixers)); // 또는 FIXERS 쓰는 중이면 그 변수명
  console.log("ruleName =", context.ruleName);
  console.log('ruleName =', context.ruleName);
  console.log("FIXER exists?", !!fixFunction);


  if (fixFunction) {
    console.log(`✅ [${context.ruleName}] 규칙 수정 로직 실행`); // 이 로그는 유지
    return fixFunction(context);
  }

  console.warn(`⚠️ [${context.ruleName}] 규칙에 대한 수정 로직이 없습니다.`); // 이 경고는 유지
  return [];
}
