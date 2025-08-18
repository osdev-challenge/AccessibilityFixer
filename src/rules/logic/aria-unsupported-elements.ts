import * as vscode from 'vscode';
import { RuleContext } from '../types';

/**
 * ARIA 속성을 사용할 수 없는 태그(meta, script, style)에서 aria-* 속성을 제거하는 Fixer
 */
export function fixUnsupportedElements (context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const fix = new vscode.CodeAction(
    '지원되지 않는 요소에서 aria-* 속성 제거',
    vscode.CodeActionKind.QuickFix
  );
  
  // 정규식으로 code(문제된 조각) 내 aria-* 속성 제거
  const fixed = context.code.replace(/\saria-[a-z-]+=["'][^"']*["']/gi, '');

  
  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(context.document.uri, context.range, fixed);

  fix.diagnostics = [
    new vscode.Diagnostic(
          context.range,
          '지원되지 않는 태그(meta, script, style)에서 aria-* 속성은 사용할 수 없습니다.',
          vscode.DiagnosticSeverity.Warning
        ),
  ];
  fixes.push(fix);

  return fixes;
};
