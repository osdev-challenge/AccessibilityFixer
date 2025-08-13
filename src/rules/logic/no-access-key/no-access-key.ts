import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

/**
 * accessKey 속성을 제거하는 Fixer (code만 수정)
 */
export const fixNoAccessKey: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // 이미 넘어온 code 조각에서 accessKey 제거
  const fixed = code.replace(/\s*accesskey\s*=\s*["'][^"']*["']/i, '');

  const fix = new vscode.CodeAction(
    'accessKey 속성 제거',
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, fixed);

  // diagnostics 추가 (이 Quick Fix가 어떤 문제를 고치는지 명시)
  fix.diagnostics = [
    {
      message: 'accessKey 속성은 접근성에 문제가 될 수 있습니다. 제거를 권장합니다.',
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer'
    }
  ];

  return [fix];
};
