// src/rules/logic/no-static-element-interactions/fixNoStaticElementInteractions.ts
import * as vscode from 'vscode';
import { RuleContext } from '../types';

// 간단 휴리스틱: 코드 단서로 role 추정
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

export function fixNoStaticElementInteractions(context: RuleContext): vscode.CodeAction[] {
  const { code, range, document } = context;
  const fixes: vscode.CodeAction[] = [];

  // 1) 대상 static 요소 확대: div|span|p|section|li|img 등
  if (!/^<\s*(div|span|p|section|li|img)\b/i.test(code)) return [];

  // 2) 인터랙션 핸들러 확대: 마우스/키/포커스 대부분 커버
  const hasInteractiveHandler =
    /\s(onClick|onDoubleClick|onKeyDown|onKeyUp|onKeyPress|onMouseDown|onMouseUp|onMouseOver|onMouseOut|onFocus|onBlur)\s*=\s*{/.test(
      code
    );
  if (!hasInteractiveHandler) return [];

  // 3) role 존재/빈 값 판정 보강: role="..", role={..}
  const hasRoleAny = /\srole\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/i.test(code);
  const isEmptyRole =
    /\srole\s*=\s*(?:"\s*"|'\s*'|\{\s*["']\s*["']\s*\})/i.test(code);

  // 이미 role이 있고 빈 값이 아니면 이 fixer는 건드리지 않음
  if (hasRoleAny && !isEmptyRole) return [];

  const role = inferRoleFromCode(code);

  let newCode = code;
  if (isEmptyRole) {
    // role="" / role={""} / role={'   '} → 값 채우기
    newCode = newCode.replace(
      /\srole\s*=\s*(?:"\s*"|'\s*'|\{\s*["']\s*["']\s*\})/i,
      ` role="${role}"`
    );
  } else if (!hasRoleAny) {
    // role 자체가 없으면 추가 (첫 여는 태그에 삽입)
    newCode = newCode.replace(
      /^<\s*(\w+)(\s[^>]*?)?>/i,
      (_m, tag, attrs = '') => `<${tag} role="${role}"${attrs || ''}>`
    );
  }

  // 변경 없으면 액션 없음
  if (newCode === code) return [];

  const fix = new vscode.CodeAction(
    `role="${role}" 자동 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      range,
      `정적 요소에 이벤트 핸들러가 있으나 role이 없거나 비어 있습니다. role="${role}"을(를) 추가합니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}
