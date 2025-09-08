import * as vscode from 'vscode';
import { RuleContext } from '../types';

// aria-hidden 속성을(값 형태 무관) 안전하게 제거하는 헬퍼
function stripAriaHidden(tagText: string): string {
  //  aria-hidden                =  "…"   |   '…'   |   {  …(중첩/백틱 허용)…  }   |   `…`   |   unquoted
  const re =
    /\saria-hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{(?:[^{}`]|`[^`]*`|\{[^{}]*\})*\}|`[^`]*`|[^\s/>]+))?/gi;
  return tagText.replace(re, "");
}


export function fixNoAriaHiddenOnFocusable (context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];
  const { code, range, document } = context;

  const fix = new vscode.CodeAction(
    'aria-hidden 제거',
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  const fixed = stripAriaHidden(code);
  if (fixed == code) return [];

  fix.edit.replace(document.uri, range, fixed);
  fix.isPreferred = true;
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      '검사 결과에 따라 aria-hidden 속성을 제거했습니다.',
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
};
