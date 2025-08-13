import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

/**
 * role 속성 값을 무조건 "generic"으로 변경하는 Fixer
 */
export const fixRoleToGeneric: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // role="..." → role="generic" 으로 교체
  const fixed = code.replace(/role\s*=\s*["'][^"']*["']/i, 'role="generic"');

  const fix = new vscode.CodeAction(
    'role 속성을 "generic"으로 수정',
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, fixed);

  fix.diagnostics = [
    {
      message: 'role 속성은 지원되지 않는 값일 수 있습니다. generic으로 수정하세요.',
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer'
    }
  ];

  return [fix];
};
