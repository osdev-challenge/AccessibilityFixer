import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

/**
 * <marquee> 또는 <blink> 요소를 제거하는 Fixer
 */
export const fixNoDistractingElements: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // <marquee>, <blink> 태그 제거 (열림/닫힘 모두)
  const fixed = code.replace(/<\/?(marquee|blink)[^>]*>/gi, '');

  const fix = new vscode.CodeAction(
    '⚠️ <marquee>, <blink> 요소 제거',
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, fixed);

  fix.diagnostics = [
    {
      message: '<marquee> 또는 <blink> 요소는 시각적으로 방해가 되므로 제거됩니다.',
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer'
    }
  ];

  return [fix];
};
