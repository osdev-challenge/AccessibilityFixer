import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "./rules/types";
import {
  ariaActivedescendantHasTabindexFix,
  clickEventsHaveKeyEventsFix,
  interactiveSupportsFocusFix,
  mouseEventsHaveKeyEventsFix,
  tabindexNoPositiveFix,
  fixAriaAttributes,
  fixUnsupportedElements,
  fixHeadingHasContentCombined,
  fixNoAccessKey,
  fixHtmlHasLang,
  fixNoAriaHiddenOnFocusable,
  fixNoDistractingElements,
  fixNoStaticElementInteractions,
  fixRequiredAria,
  fixRoleSupportsAriaProps,
  noNoninteractiveTabindexFix,
  preferNativeElementsFix,
  labelHasAssociatedControlFix,
  anchorIsValidFix,
} from "./rules/logic";

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
  "jsx-a11y/aria-activedescendant-has-tabindex": ariaActivedescendantHasTabindexFix,
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
  "jsx-a11y/no-noninteractive-tabindex": noNoninteractiveTabindexFix,
  "jsx-a11y/prefer-native-elements": preferNativeElementsFix,
  "jsx-a11y/label-has-associated-control": labelHasAssociatedControlFix,
  "jsx-a11y/anchor-is-valid": anchorIsValidFix,
};
  

const a11yDiagnosticCollection =
  vscode.languages.createDiagnosticCollection("a11y");

export function dispatchRule(context: RuleContext): vscode.CodeAction[] {
  const fixFunction = ruleFixers[context.ruleName];

  if (!fixFunction) {
    console.warn(
      `[A11y Fix]:[${context.ruleName}] 규칙에 대한 수정 로직이 없습니다.`
    );
    return [];
  }

  console.log(`[A11y Fix]:[${context.ruleName}] 규칙 수정 로직 실행`);

  const codeActions = fixFunction(context);

  codeActions.forEach((action) => {
    if (!action.title.startsWith("[A11y Fix]")) {
      action.title = `[A11y Fix] ${action.title}`;
    }
  });

  const diagnosticSet = new Set<string>();
  const diagnostics: vscode.Diagnostic[] = [];

  for (const fix of codeActions) {
    if (fix.diagnostics && fix.diagnostics.length > 0) {
      for (const d of fix.diagnostics) {
        const key = `${d.code}-${d.range.start.line}:${d.range.start.character}-${d.range.end.line}:${d.range.end.character}`;
        if (diagnosticSet.has(key)) continue; // 중복 방지
        diagnosticSet.add(key);
        diagnostics.push(d);
      }
    }
  }

  if (diagnostics.length > 0) {
    a11yDiagnosticCollection.delete(context.document.uri); // 기존 진단 제거
    a11yDiagnosticCollection.set(context.document.uri, diagnostics);
  }
  return codeActions;
}
