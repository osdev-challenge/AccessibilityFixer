import * as vscode from "vscode";
import { RuleContext } from "../types";

export async function mouseEventsHaveKeyEventsFix(
  context: RuleContext
): Promise<vscode.CodeAction[]> {
  const fixes: vscode.CodeAction[] = [];
  let newCode = context.code;
  let isModified = false;

  // onMouseOver 핸들러 이름 추출
  const onMouseOverMatch = newCode.match(/onMouseOver=\{([^}]+)\}/);
  if (onMouseOverMatch && !newCode.includes("onFocus")) {
    const handlerName = onMouseOverMatch[1].trim();
    newCode = newCode.replace(
      /onMouseOver=\{[^}]+\}/,
      `onMouseOver={${handlerName}} onFocus={${handlerName}}`
    );
    isModified = true;
  }

  // onMouseOut 핸들러 이름 추출
  const onMouseOutMatch = newCode.match(/onMouseOut=\{([^}]+)\}/);
  if (onMouseOutMatch && !newCode.includes("onBlur")) {
    const handlerName = onMouseOutMatch[1].trim();
    newCode = newCode.replace(
      /onMouseOut=\{[^}]+}/,
      `onMouseOut={${handlerName}} onBlur={${handlerName}}`
    );
    isModified = true;
  }

  if (!isModified) {
    return [];
  }

  const fix = new vscode.CodeAction(
    `마우스 이벤트에 키보드 포커스 이벤트 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(context.document.uri, context.range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `마우스 이벤트에 키보드 이벤트도 함께 제공해야 합니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}