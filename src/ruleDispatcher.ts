// src/ruleDispatcher.ts
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
} from "./rules/logic"; // ✅ 배럴에서 모아 임포트


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
