// src/ruleDispatcher.ts

import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "./rules/types";
import {
  ariaActivedescendantHasTabindexFix,
  clickEventsHaveKeyEventsFix,
  interactiveSupportsFocusFix,
  mouseEventsHaveKeyEventsFix,
  tabindexNoPositiveFix,
} from "./rules/logic";

// 규칙 이름과 수정 로직 함수를 매핑하는 객체
const ruleFixers: { [key: string]: RuleFixer } = {
  "jsx-a11y/aria-activedescendant-has-tabindex":
    ariaActivedescendantHasTabindexFix,
  "jsx-a11y/click-events-have-key-events": clickEventsHaveKeyEventsFix,
  "jsx-a11y/interactive-supports-focus": interactiveSupportsFocusFix,
  "jsx-a11y/mouse-events-have-key-events": mouseEventsHaveKeyEventsFix,
  "jsx-a11y/tabindex-no-positive": tabindexNoPositiveFix,
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

  const diagnostics: vscode.Diagnostic[] = [];
  for (const fix of codeActions) {
    if (fix.diagnostics && fix.diagnostics.length > 0) {
      diagnostics.push(...fix.diagnostics);
    }
  }

  if (diagnostics.length > 0) {
    a11yDiagnosticCollection.set(context.document.uri, diagnostics);
  }
  return codeActions;
}
