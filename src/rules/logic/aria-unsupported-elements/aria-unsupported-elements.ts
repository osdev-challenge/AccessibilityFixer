import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

/**
 * ARIA 속성을 사용할 수 없는 태그(meta, script, style)에서 aria-* 속성을 제거하는 Fixer
 */
export const fixUnsupportedElements: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // 정규식으로 code(문제된 조각) 내 aria-* 속성 제거
  const fixed = code.replace(/\saria-[a-z-]+=["'][^"']*["']/gi, '');

  const fix = new vscode.CodeAction(
    '지원되지 않는 요소에서 aria-* 속성 제거',
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, fixed);

  fix.diagnostics = [
    {
      message: '지원되지 않는 태그(meta, script, style)에서 aria-* 속성은 사용할 수 없습니다.',
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer'
    }
  ];

  return [fix];
};
