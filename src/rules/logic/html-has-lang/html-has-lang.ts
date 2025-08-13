import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

/**
 * <html> 태그에 lang="ko" 속성을 추가하는 Fixer
 */
export const fixHtmlHasLang: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // 이미 lang 속성이 있다면 패스 (실제로는 오지 않겠지만 안전하게)
  if (/lang\s*=\s*["'][^"']*["']/i.test(code)) {
    return [];
  }

  // lang 속성이 없다면 lang="ko" 추가
  const fixed = code.replace(/<html(\s*[^>]*)?>/i, (_match, attrs = '') => {
    const insert = attrs.trim() ? ` lang="ko" ${attrs.trim()}` : ` lang="ko"`;
    return `<html${insert}>`;
  });

  const fix = new vscode.CodeAction(
    '<html> 태그에 lang="ko" 속성 추가',
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, fixed);

  fix.diagnostics = [
    {
      message: '<html> 태그에 lang 속성이 없습니다. lang="ko"를 추가해야 합니다.',
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer'
    }
  ];

  return [fix];
};
