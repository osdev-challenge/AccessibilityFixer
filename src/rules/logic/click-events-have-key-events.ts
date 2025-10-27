import * as vscode from "vscode";
import { RuleContext } from "../types";

export function clickEventsHaveKeyEventsFix(
  context: RuleContext
): vscode.CodeAction[] {
  const { code, range, document } = context;

  // 이미 onKeyDown 핸들러가 있으면 수정하지 않음
  if (/\bonKeyDown\s*=/.test(code)) return [];

  // onClick 핸들러 추출
  const onClickMatch = code.match(/\bonClick\s*=\s*(\{[^}]+\}|\{[\s\S]*?\})/);
  if (!onClickMatch) return [];

  const onClickAttribute = onClickMatch[0];
  const onClickValue = onClickMatch[1];

  // onClick 내용 정제
  let handlerCall = onClickValue.slice(1, -1).trim();
  if (!handlerCall.endsWith(")")) {
    handlerCall += "(event)";
  }

  // onKeyDown 핸들러 생성
  const onKeyDownAttribute = ` onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { ${handlerCall}; } }}`;

  // 새로운 코드 생성
  const newCode = code.replace(onClickAttribute, onClickAttribute + onKeyDownAttribute);

  // Quick Fix 생성
  const fix = new vscode.CodeAction(
    `키보드 이벤트(onKeyDown) 추가`,
    vscode.CodeActionKind.QuickFix
  );
  fix.isPreferred = true;
  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, range, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      range,
      `클릭 이벤트만 있는 요소는 키보드 접근성이 부족할 수 있습니다. onKeyDown 핸들러를 추가하여 Enter/Space 키 입력을 처리하세요.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];

  return [fix];
}
