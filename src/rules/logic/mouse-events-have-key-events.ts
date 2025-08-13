// src/rules/logic/mouse-events-have-key-events.ts

import * as vscode from "vscode";
import { RuleContext } from "../types";

export function mouseEventsHaveKeyEventsFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const fix = new vscode.CodeAction(
    `마우스 이벤트에 onFocus/onBlur 키보드 이벤트 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  let newCode = context.code;

  if (newCode.includes("onMouseOver") && !newCode.includes("onFocus")) {
    newCode = newCode.replace(
      /onMouseOver=\{([^}]+)\}/,
      `onMouseOver={$1} onFocus={() => { /* Focus logic */ }}`
    );
  }

  if (newCode.includes("onMouseOut") && !newCode.includes("onBlur")) {
    newCode = newCode.replace(
      /onMouseOut=\{([^}]+)\}/,
      `onMouseOut={$1} onBlur={() => { /* Blur logic */ }}`
    );
  }

  if (newCode === context.code) {
    return [];
  }

  fix.edit.replace(context.document.uri, context.range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `마우스 이벤트에 키보드 이벤트도 함께 제공해야 합니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}
