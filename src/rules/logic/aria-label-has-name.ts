// src/rules/logic/aria-label-has-name.ts

import * as vscode from "vscode";
import { RuleContext } from "../types";

export function ariaLabelHasNameFix(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const fix = new vscode.CodeAction(
    `aria-label="" 속성 추가`, // 제안 제목
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  // 현재 코드 스니펫 (예: <button>)에서
  // 첫 번째 태그 이름 뒤에 aria-label=""을 삽입합니다.
  // 예: <button -> <button aria-label=""
  const newCode = context.code.replace(
    /^<(\w+)/, // 태그 시작 (<태그이름)을 찾습니다.
    `<$1 aria-label=""` // 찾은 태그이름 뒤에 aria-label=""을 추가합니다.
  );

  fix.edit.replace(context.document.uri, context.range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `aria-label이 필요한 요소에 레이블이 없습니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}
