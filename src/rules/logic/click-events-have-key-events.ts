import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";

export function clickEventsHaveKeyEventsFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];
  const fix = new vscode.CodeAction(
    `클릭 이벤트에 onKeyDown={...} 키보드 이벤트 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();

  // onClick 핸들러의 내용을 추출하는 정규식. 중괄호 {} 내부의 모든 문자를 찾도록 수정
  const onClickMatch = context.code.match(/onClick=\{([\s\S]*?)\}/);
  if (!onClickMatch || !onClickMatch[1]) {
    return [];
  }

  let onClickBody = onClickMatch[1].trim();

  // 화살표 함수인 경우 실행 가능한 코드만 추출
  const arrowFunctionMatch = onClickBody.match(/^\(\) => ([\s\S]+)$/);
  if (arrowFunctionMatch) {
    onClickBody = arrowFunctionMatch[1].trim();
    // 중괄호로 감싸인 경우 중괄호 제거
    if (onClickBody.startsWith('{') && onClickBody.endsWith('}')) {
      onClickBody = onClickBody.slice(1, -1).trim();
    }
  }

  let newCode = context.code;

  // onKeyDown이 이미 존재하면 수정하지 않음
  if (newCode.includes("onKeyDown")) {
    return [];
  }
  
  newCode = newCode.replace(
    onClickMatch[0],
    `${onClickMatch[0]} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { ${onClickBody} } }}`
  );

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