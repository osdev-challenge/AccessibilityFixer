import * as vscode from "vscode";
import { RuleContext } from "../types";

export function interactiveSupportsFocusFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  // 이미 tabIndex 속성이 있다면 수정을 제안하지 않음
  if (context.code.match(/\stabIndex\s*=/i)) {
    return [];
  }

  const fix = new vscode.CodeAction(
    `인터랙티브 요소에 tabIndex="0" 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  const newCode = context.code.replace(/^<(\w+)/, `<$1 tabIndex={0}`);

  fix.edit.replace(context.document.uri, context.range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `인터랙티브 역할의 요소는 tabIndex를 지원해야 합니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}