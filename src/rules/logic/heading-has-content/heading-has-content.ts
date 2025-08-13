// src/rules/logic/heading-has-content/fixHeadingHasContent.ts

import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

/**ts-node 
 * 빈 heading 태그(<h1>~<h6>)에 "빈제목" 콘텐츠를 삽입하는 Fixer
 */
export const fixHeadingHasContent: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  const fixed = code.replace(
    /<h([1-6])([^>]*)>\s*<\/h\1>/i,
    (_match, level, attrs) => `<h${level}${attrs}>빈제목</h${level}>`
  );

  const fix = new vscode.CodeAction(
    '빈 heading 태그에 "빈제목" 삽입',
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, fixed);

  fix.diagnostics = [
    {
      message: '<h1> ~ <h6> 태그는 비어 있을 수 없습니다. "빈제목"을 추가하세요.',
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer'
    }
  ];

  return [fix];
};


