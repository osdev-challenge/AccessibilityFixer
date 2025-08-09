// src/rules/logic/tabindex-no-positive.ts

import * as vscode from "vscode";
import { RuleContext } from "../types";

export function tabindexNoPositiveFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const regex = /(tabIndex\s*=\s*)(["']?)(\d+)(["']?)/;
  const match = context.code.match(regex);

  if (!match || match.length < 5) {
    console.warn(
      `[DEBUG - tabindexFix] Could not parse tabIndex value from context.code: '${context.code}'. Cannot provide fix.`
    );
    return [];
  }

  const [, prefix, quote1, originalValue, quote2] = match;

  // 1. tabIndex를 "0"으로 변경하는 제안
  const fixToZero = new vscode.CodeAction(
    `tabIndex를 "0"으로 변경 (기본 포커스 순서 포함)`,
    vscode.CodeActionKind.QuickFix
  );
  fixToZero.edit = new vscode.WorkspaceEdit();

  const newCodeZero = `${prefix}${quote1}0${quote2}`;

  console.log(`[DEBUG - tabindexFix] Original Code: '${context.code}'`);
  console.log(
    `[DEBUG - tabindexFix] Extracted Original Value: '${originalValue}'`
  );
  console.log(
    `[DEBUG - tabindexFix] Proposed newCode (to 0): '${newCodeZero}'`
  );
  console.log(
    `[DEBUG - tabindexFix] Range Start: ${context.range.start.line}:${context.range.start.character}`
  );
  console.log(
    `[DEBUG - tabindexFix] Range End: ${context.range.end.line}:${context.range.end.character}`
  );

  fixToZero.edit.replace(context.document.uri, context.range, newCodeZero);
  fixToZero.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `tabIndex에 양수 값 사용은 접근성을 저해할 수 있습니다. (권장: tabIndex="0")`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fixToZero);

  // 2. tabIndex를 "-1"로 변경하는 제안
  const fixToMinusOne = new vscode.CodeAction(
    `tabIndex를 "-1"로 변경 (프로그래밍 방식 포커스만 가능)`,
    vscode.CodeActionKind.QuickFix
  );
  fixToMinusOne.edit = new vscode.WorkspaceEdit();

  const newCodeMinusOne = `${prefix}${quote1}-1${quote2}`;

  console.log(
    `[DEBUG - tabindexFix] Proposed newCode (to -1): '${newCodeMinusOne}'`
  );

  fixToMinusOne.edit.replace(
    context.document.uri,
    context.range,
    newCodeMinusOne
  );
  fixToMinusOne.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `tabIndex에 양수 값 사용은 접근성을 저해할 수 있습니다. (대안: tabIndex="-1")`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fixToMinusOne);

  return fixes;
}
