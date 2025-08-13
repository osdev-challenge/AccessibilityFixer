// src/rules/logic/no-noninteractive-tabindex.ts

import * as vscode from "vscode";
import { RuleContext } from "../types";

export function noNoninteractiveTabindexFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const fix = new vscode.CodeAction(
    `비인터랙티브 요소에서 tabIndex 제거`, // 제안 제목
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  // 현재 코드 스니펫에서 tabIndex 속성을 제거합니다.
  // 예: <div tabIndex="0"> -> <div>
  // 예: <span tabIndex={-1}> -> <span>
  const newCode = context.code.replace(
    /\s*tabIndex\s*=\s*(["']?[^"'\s>]+["']?|\{[^}]+\})/g,
    ""
  );

  // 만약 수정 후 코드가 변경되지 않았다면 (예: tabIndex가 없었다면) 제안을 제공하지 않습니다.
  if (newCode === context.code) {
    return [];
  }

  fix.edit.replace(context.document.uri, context.range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `비인터랙티브 요소에 tabIndex 사용은 권장되지 않습니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}
