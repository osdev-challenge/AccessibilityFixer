// src/rules/logic/click-events-have-key-events.ts

import * as vscode from "vscode";
import { RuleContext } from "../types";

export function clickEventsHaveKeyEventsFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const fix = new vscode.CodeAction(
    `클릭 이벤트에 onKeyDown={handleKeyDown} 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  const onClickMatch = context.code.match(/(onClick=\{[^}]+\})/);
  if (!onClickMatch) {
    console.warn(
      `[DEBUG - clickEventsFix] onClick 속성을 찾을 수 없습니다: ${context.code}`
    );
    return [];
  }

  const onClickAttribute = onClickMatch[0];

  const newCode = context.code.replace(
    onClickAttribute,
    `${onClickAttribute} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { /* ${onClickAttribute} */ } }}`
  );

  fix.edit.replace(context.document.uri, context.range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `클릭 가능한 요소에 키보드 이벤트도 함께 제공해야 합니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}
