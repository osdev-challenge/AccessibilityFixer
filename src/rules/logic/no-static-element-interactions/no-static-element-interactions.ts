// src/rules/logic/no-static-element-interactions/fixNoStaticElementInteractions.ts
import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

// 필요 시: 단서 기반 추론
function inferRoleFromCode(code: string): string {
  const hints: { pattern: RegExp; role: string }[] = [
    { pattern: /\shref\s*=/i, role: 'link' },
    { pattern: /\s(aria-)?checked\s*=/i, role: 'checkbox' },
    { pattern: /\s(aria-)?selected\s*=/i, role: 'option' },
    { pattern: /\s(aria-)?expanded\s*=/i, role: 'button' },
    { pattern: /\bclass\s*=\s*["'][^"']*\bslider\b[^"']*["']/i, role: 'slider' },
    { pattern: /\bclass\s*=\s*["'][^"']*\b(switch|toggle)\b[^"']*["']/i, role: 'switch' },
    { pattern: /\bclass\s*=\s*["'][^"']*\bradio\b[^"']*["']/i, role: 'radio' },
  ];
  for (const h of hints) if (h.pattern.test(code)) return h.role;
  return 'button';
}

export const fixNoStaticElementInteractions: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // 대상 태그 축소(프로젝트에서 실제로 감지되는 요소만)
  if (!/^<(div|span|p)\b/i.test(code)) return [];

  // 이벤트 핸들러(감지되는 핸들러만)
  if (!/\son(Click|KeyDown|KeyUp|KeyPress|MouseDown|MouseUp)\s*=\s*{/.test(code)) return [];

  const hasRole = /role\s*=\s*["'][^"']*["']/i.test(code);
  const emptyRole = /role\s*=\s*["']\s*["']/i.test(code);

  // role 값이 이미 존재(비어있지 않음)하면 이 규칙에서는 수정하지 않음
  if (hasRole && !emptyRole) return [];

  const role = inferRoleFromCode(code);

  let fixed: string;
  if (emptyRole) {
    // role="" 같은 빈 값인 경우 값을 채운다
    fixed = code.replace(/role\s*=\s*["']\s*["']/i, `role="${role}"`);
  } else {
    // role 자체가 없는 경우 role을 삽입
    fixed = code.replace(/^<(\w+)(\s[^>]*?)?>/, (_m, tag, attrs = '') => `<${tag} role="${role}"${attrs}>`);
  }

  const fix = new vscode.CodeAction(`role="${role}" 자동 추가`, vscode.CodeActionKind.QuickFix);
  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, fixed);
  fix.diagnostics = [
    {
      message: `정적 요소에 이벤트 핸들러가 있으나 role이 없거나 비어 있습니다. role="${role}"을(를) 추가합니다.`,
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer',
    },
  ];
  return [fix];
};
