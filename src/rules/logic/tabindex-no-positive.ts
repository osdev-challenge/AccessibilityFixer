import * as vscode from "vscode";
import { RuleContext } from "../types";

export function tabindexNoPositiveFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  // 캡처 그룹 1: 값 부분 (예: "{2}", "'2'", '"2"')
  const regex = /tabIndex\s*=\s*(\{?\s*['"]?\s*\d+\s*['"]?\s*\}?)/;
  const match = context.code.match(regex);

  // [수정됨]
  // match.length는 2여야 합니다 (match[0]: 전체, match[1]: 캡처 그룹).
  if (!match || match.length < 2) { 
    console.warn(
      `[DEBUG - tabindexFix] Could not parse tabIndex value from context.code: '${context.code}'. Cannot provide fix.`
    );
    return [];
  }

  // 값 부분(match[1])에서 숫자만 추출합니다.
  const valueMatch = match[1].match(/\d+/);
  if (!valueMatch || parseInt(valueMatch[0], 10) <= 0) {
    // 숫자를 찾지 못했거나 양수가 아니면 종료
    return [];
  }

  // targetValue는 0 또는 -1 숫자입니다.
  const createReplacementCode = (targetValue: number) => {
    // [수정됨]
    // context.code에서 값 부분(match[1])을 새로운 JSX 표현식(예: {0})으로 교체합니다.
    // (이전 로직은 if문이 중복되어 하나로 통일했습니다.)
    return context.code.replace(match[1], `{${targetValue}}`);
  };

  // 1. tabIndex를 {0}으로 변경하는 제안
  const fixToZero = new vscode.CodeAction(
    `tabIndex를 {0}으로 변경 (기본 포커스 순서 포함)`,
    vscode.CodeActionKind.QuickFix
  );
  fixToZero.edit = new vscode.WorkspaceEdit();
  fixToZero.isPreferred = true;
  const newCodeZero = createReplacementCode(0);
  fixToZero.edit.replace(context.document.uri, context.range, newCodeZero);
  fixToZero.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `tabIndex에 양수 값 사용은 접근성을 저해할 수 있습니다. (권장: tabIndex={0})`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fixToZero);

  // 2. tabIndex를 {-1}로 변경하는 제안
  const fixToMinusOne = new vscode.CodeAction(
    `tabIndex를 {-1}로 변경 (프로그래밍 방식 포커스만 가능)`,
    vscode.CodeActionKind.QuickFix
  );
  fixToMinusOne.edit = new vscode.WorkspaceEdit();
  const newCodeMinusOne = createReplacementCode(-1);
  fixToMinusOne.edit.replace(
    context.document.uri,
    context.range,
    newCodeMinusOne
  );
  fixToMinusOne.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `tabIndex에 양수 값 사용은 접근성을 저해할 수 있습니다. (대안: tabIndex={-1})`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fixToMinusOne);

  return fixes;
}