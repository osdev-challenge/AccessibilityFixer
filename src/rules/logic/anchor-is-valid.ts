import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";

export const anchorIsValidFix: RuleFixer = (
  context: RuleContext
): vscode.CodeAction[] => {
  const { code, range, document } = context;
  const fixes: vscode.CodeAction[] = [];

  // href 속성이 없거나 비어있는 경우
  if (!/\shref=["'][^"']*["']/i.test(code) || /\shref=[""]/.test(code)) {
    const fixed = code.replace(/<a(\s|>)/i, '<a href="#"$1');
    const fix = new vscode.CodeAction(
      `href="#" 속성 추가`,
      vscode.CodeActionKind.QuickFix
    );
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(document.uri, range, fixed);
    fix.diagnostics = [
      {
        message: `<a> 태그는 유효한 href 속성을 가져야 합니다.`,
        range,
        severity: vscode.DiagnosticSeverity.Warning,
        source: "web-a11y-fixer",
      },
    ];
    fixes.push(fix);
  }

  // javascript:; 등의 유효하지 않은 값 수정
  if (/\shref=["']\s*javascript:;["']/i.test(code)) {
    const fixed = code.replace(/\s*href=["']\s*javascript:;["']/i, ` href="#"`);
    const fix = new vscode.CodeAction(
      `href 속성 값을 '#'로 변경`,
      vscode.CodeActionKind.QuickFix
    );
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(document.uri, range, fixed);
    fix.diagnostics = [
      {
        message: `<a> 태그는 유효한 href 속성 값을 가져야 합니다.`,
        range,
        severity: vscode.DiagnosticSeverity.Warning,
        source: "web-a11y-fixer",
      },
    ];
    fixes.push(fix);
  }

  return fixes;
};