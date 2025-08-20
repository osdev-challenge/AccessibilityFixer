import * as vscode from "vscode";
import { RuleContext } from "../types";

export function tabindexNoPositiveFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const regex = /(tabIndex\s*=\s*)(["']?|\{?)(\d+)(["']?|\}?)/;
  const match = context.code.match(regex);

  if (!match || match.length < 5) {
    console.warn(
      `[DEBUG - tabindexFix] Could not parse tabIndex value from context.code: '${context.code}'. Cannot provide fix.`
    );
    return [];
  }

  const [, prefix, opener, originalValue, closer] = match;

  // 매개변수 'targetValue'에 string 타입을 명시적으로 지정
  const createReplacementCode = (targetValue: string) => {
    return context.code.replace(match[0], `${prefix}"${targetValue}"`);
  };

  // 1. tabIndex를 "0"으로 변경하는 제안
  const fixToZero = new vscode.CodeAction(
    `tabIndex를 "0"으로 변경 (기본 포커스 순서 포함)`,
    vscode.CodeActionKind.QuickFix
  );
  fixToZero.edit = new vscode.WorkspaceEdit();

  const newCodeZero = createReplacementCode("0");

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

  const newCodeMinusOne = createReplacementCode("-1");

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