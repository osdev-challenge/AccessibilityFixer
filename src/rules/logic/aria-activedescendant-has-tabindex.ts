import * as vscode from "vscode";
import { RuleContext } from "../types";

export function ariaActivedescendantHasTabindexFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const fix = new vscode.CodeAction(
    `aria-activedescendant 요소에 tabIndex="0" 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  const newCode = context.code.replace(/^<(\w+)/, `<$1 tabIndex="0"`);

  fix.edit.replace(context.document.uri, context.range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `aria-activedescendant를 사용하는 요소는 tabIndex가 필요합니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}
