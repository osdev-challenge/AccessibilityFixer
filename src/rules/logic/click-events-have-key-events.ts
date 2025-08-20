import * as vscode from "vscode";
import { RuleContext } from "../types";

export function clickEventsHaveKeyEventsFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const fix = new vscode.CodeAction(
    `클릭 이벤트에 onKeyDown={...} 키보드 이벤트 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  // onClick 핸들러의 내용을 추출하는 정규식
  const onClickMatch = context.code.match(/onClick=\{([^{}]*)\}/);
  if (!onClickMatch || !onClickMatch[1]) {
    console.warn(
      `[DEBUG - clickEventsFix] onClick 속성에서 핸들러 내용을 찾을 수 없습니다: ${context.code}`
    );
    return [];
  }

  const onClickBody = onClickMatch[1].trim(); // 함수 본문 추출
  let newCode = context.code;

  if (!newCode.includes("onKeyDown")) {
    // onKeyDown이 없는 경우
    newCode = newCode.replace(
      onClickMatch[0],
      `${onClickMatch[0]} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { ${onClickBody} } }}`
    );
  } else {
    // onKeyDown이 이미 있는 경우 (onClick 코드만 재사용)
    newCode = newCode.replace(
      /onKeyDown=\{[^{}]*\}/,
      `onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { ${onClickBody} } }}`
    );
  }

  fix.edit.replace(context.document.uri, context.range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `클릭 가능한 요소에 키보드 이벤트도 함께 제공해야 합니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}