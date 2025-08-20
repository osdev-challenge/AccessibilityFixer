import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";

/**
 * 비인터랙티브 요소에 사용된 tabindex 속성을 제거하는 Fixer
 */
export const noNoninteractiveTabindexFix: RuleFixer = (
  context: RuleContext
): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // 'tabIndex' 속성을 제거하는 정규식
  const fixed = code.replace(/\s*tabIndex\s*=\s*\{?[^}>]*\}?/i, "");

  const fix = new vscode.CodeAction(
    `tabIndex 속성 제거`,
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, fixed);

  fix.diagnostics = [
    {
      message: `tabIndex는 비인터랙티브 요소에 사용될 수 없습니다.`,
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: "web-a11y-fixer",
    },
  ];

  return [fix];
};