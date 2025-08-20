// src/ruleDispatcher.ts

import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "./rules/types";

// 각 로직 파일 import
import { ariaActivedescendantHasTabindexFix } from "./rules/logic/aria-activedescendant-has-tabindex";
import { clickEventsHaveKeyEventsFix } from "./rules/logic/click-events-have-key-events";
import { interactiveSupportsFocusFix } from "./rules/logic/interactive-supports-focus";
import { mouseEventsHaveKeyEventsFix } from "./rules/logic/mouse-events-have-key-events";
import { tabindexNoPositiveFix } from "./rules/logic/tabindex-no-positive";

// AI 기반 규칙들 import
import { fixAriaLabelIsString } from "./rules/ai/aria-role/fixers/fixAriaLabelIsString";
import { fixAriaRole } from "./rules/ai/aria-role/fixers/fixAriaRole";
import { fixAriaProps } from "./rules/ai/aria-role/fixers/fixAriaProps";
import { fixNoInteractiveToNoninteractive } from "./rules/ai/aria-role/fixers/fixNoInteractiveToNoninteractive";
import { fixNoNoninteractiveToInteractive } from "./rules/ai/aria-role/fixers/fixNoNoninteractiveToInteractive";

import { fixAltText } from "./rules/ai/labeling-content/fixers/fixAltText";
import { fixNoEmptyAlt } from "./rules/ai/labeling-content/fixers/fixNoEmptyAlt";
import { fixAnchorHasContent } from "./rules/ai/labeling-content/fixers/fixAnchorHasContent";
import { fixImgRedundantAlt } from "./rules/ai/labeling-content/fixers/fixImgRedundantAlt";
import { fixAccessibleEmoji } from "./rules/ai/labeling-content/fixers/fixAccessibleEmoji";
import { fixControlHasAssociatedLabel } from "./rules/ai/labeling-content/fixers/fixControlHasAssociatedLabel";
import { fixFormHasLabel } from "./rules/ai/labeling-content/fixers/fixFormHasLabel";

// 규칙 이름과 수정 로직 함수를 매핑하는 객체
const ruleFixers: { [key: string]: RuleFixer } = {
  "jsx-a11y/aria-activedescendant-has-tabindex":
    ariaActivedescendantHasTabindexFix,
  "jsx-a11y/click-events-have-key-events": clickEventsHaveKeyEventsFix,
  "jsx-a11y/interactive-supports-focus": interactiveSupportsFocusFix,
  "jsx-a11y/mouse-events-have-key-events": mouseEventsHaveKeyEventsFix,
  "jsx-a11y/tabindex-no-positive": tabindexNoPositiveFix,
  
  // AI 기반 규칙들
  "jsx-a11y/aria-role": fixAriaRole,
  "jsx-a11y/aria-props": fixAriaProps,
  "jsx-a11y/no-interactive-element-to-noninteractive-role": fixNoInteractiveToNoninteractive,
  "jsx-a11y/no-noninteractive-element-to-interactive-role": fixNoNoninteractiveToInteractive,
  "jsx-a11y/require-aria-label": fixAriaLabelIsString,

  "jsx-a11y/alt-text": fixAltText,
  "jsx-a11y/no-empty-alt": fixNoEmptyAlt,
  "jsx-a11y/anchor-has-content": fixAnchorHasContent,
  "jsx-a11y/img-redundant-alt": fixImgRedundantAlt,
  "jsx-a11y/accessible-emoji": fixAccessibleEmoji,
  "jsx-a11y/control-has-associated-label": fixControlHasAssociatedLabel,
  "jsx-a11y/form-has-label": fixFormHasLabel,
};

export async function dispatchRule(context: RuleContext): Promise<vscode.CodeAction[]> {
  const fixFunction = ruleFixers[context.ruleName];

  if (fixFunction) {
    console.log(`✅ [${context.ruleName}] 규칙 수정 로직 실행`); // 이 로그는 유지
    return await fixFunction(context);
  }

  console.warn(`⚠️ [${context.ruleName}] 규칙에 대한 수정 로직이 없습니다.`); // 이 경고는 유지
  return [];
}
