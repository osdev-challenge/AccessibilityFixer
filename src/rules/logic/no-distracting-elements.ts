import * as vscode from 'vscode';
import { RuleContext } from '../types';

/**
 * <marquee> 또는 <blink> 요소를 제거하는 Fixer
 */
export function fixNoDistractingElements (context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];
  const { fullLine, range, document } = context;

  const fix = new vscode.CodeAction(
    '<marquee>, <blink> 요소 제거',
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  // <marquee>, <blink> 태그 제거 (열림/닫힘 모두)
  const fixed = fullLine.replace(/<\/?(marquee|blink)[^>]*>/gi, '');

  fix.edit.replace(document.uri, range, fixed);

  fix.diagnostics = [
    new vscode.Diagnostic(
          context.range,
          '<marquee> 또는 <blink> 요소는 시각적으로 방해가 되므로 제거됩니다.',
          vscode.DiagnosticSeverity.Warning
        ),
  ];
  fixes.push(fix);

  return fixes;
};
