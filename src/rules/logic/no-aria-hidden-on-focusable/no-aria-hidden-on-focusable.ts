// src/rules/logic/no-aria-hidden-on-focusable/fix.ts
import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

// aria-hidden 속성을(값 형태 무관) 안전하게 제거하는 헬퍼
function stripAriaHidden(tagText: string): string {
  // key="…" | key='…' | key={…} | key(불리언) | key=unquoted
  const re = /\saria-hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s"'>/]+))?/gi;
  return tagText.replace(re, '');
}

export const fixNoAriaHiddenOnFocusable: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // aria-hidden이 없으면 스킵
  if (!/\saria-hidden(\s*=|\s|>)/i.test(code)) return [];

  const fixed = stripAriaHidden(code);
  if (fixed === code) return [];

  const fix = new vscode.CodeAction(
    'aria-hidden 제거',
    vscode.CodeActionKind.QuickFix
  );
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, fixed);
  fix.edit = edit;
  fix.isPreferred = true;
  fix.diagnostics = [
    {
      message: '검사 결과에 따라 aria-hidden 속성을 제거했습니다.',
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer',
    },
  ];

  return [fix];
};
