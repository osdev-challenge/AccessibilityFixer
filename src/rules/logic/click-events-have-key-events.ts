import * as vscode from "vscode";
import { RuleContext } from "../types";

export function clickEventsHaveKeyEventsFix(
  context: RuleContext
): vscode.CodeAction[] {
  const { code, range, document } = context;

  // 이미 onKeyDown 핸들러가 있으면 수정하지 않음
  if (/\bonKeyDown\s*=/.test(code)) {
    return [];
  }

  // onClick 핸들러와 그 내용을 추출
  const onClickMatch = code.match(/\bonClick\s*=\s*({[\s\S]*?})/);
  if (!onClickMatch) {
    return [];
  }
  
  const onClickAttribute = onClickMatch[0]; // ex: onClick={() => alert('hi')}
  const onClickValue = onClickMatch[1]; // ex: {() => alert('hi')}

  // onKeyDown 핸들러를 새로 생성
  const onKeyDownAttribute = ` onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { (${onClickValue.slice(1, -1)})(event); } }}`;

  // 기존 onClick 속성 바로 뒤에 onKeyDown 속성을 추가
  const newCode = code.replace(onClickAttribute, onClickAttribute + onKeyDownAttribute);

  if (newCode === code) {
    return [];
  }

  const fix = new vscode.CodeAction(
    `키보드 이벤트(onKeyDown) 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      range,
      `클릭 가능한 요소에는 키보드 이벤트도 함께 제공해야 합니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  
  return [fix];
}