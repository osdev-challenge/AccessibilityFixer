import * as vscode from "vscode";
import { RuleContext } from "../types";

/**
 * jsx-a11y/aria-unsupported-elements Quick Fix
 * - 진단이 잡아준 범위(context.range) 내에서
 *   모든 aria-*와 role 속성을 제거
 * - 값 형태: "..." | '...' | {...} | (불리언 단축) 모두 지원
 * - JSX spread({...props})는 안전상 건드리지 않음
 */
export function fixUnsupportedElements(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];
  const { document, range } = context;

  const original = (context as any).code ?? document.getText(range);

  // 값 패턴: "..." | '...' | {...}
  const VALUE = `(?:"[^"]*"|'[^']*'|\\{[^{}]*\\})`;

  // aria-* 제거 (값 유무 모두)
  const RE_ARIA = new RegExp(String.raw`\s+aria-[a-zA-Z0-9_-]+(?:\s*=\s*${VALUE})?`, "g");

  // role 제거 (값 유무 모두)
  const RE_ROLE = new RegExp(String.raw`\s+role(?:\s*=\s*${VALUE})?`, "g");

  // 실제 제거
  let fixed = original.replace(RE_ARIA, "").replace(RE_ROLE, "");

  // 정리: 중복 공백, 닫힘 전 공백
  fixed = fixed
    .replace(/\s{2,}/g, " ")
    .replace(/\s+(\/?>)/g, "$1");

  if (fixed === original) return fixes;

  const fix = new vscode.CodeAction(
    "지원되지 않는 요소에서 role/aria-* 속성 제거",
    vscode.CodeActionKind.QuickFix
  );
  fix.isPreferred = true;

  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, fixed);
  fix.edit = edit;

  fix.diagnostics = [
    new vscode.Diagnostic(
      range,
      "해당 요소는 ARIA/role을 지원하지 않습니다. 금지 속성을 제거했습니다.",
      vscode.DiagnosticSeverity.Warning
    ),
  ];

  fixes.push(fix);
  return fixes;
}
