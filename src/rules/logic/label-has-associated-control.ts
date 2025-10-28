import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";

export const labelHasAssociatedControlFix: RuleFixer = (
  context: RuleContext
): vscode.CodeAction[] => {
  const { code, range, document, fullLine } = context;
  const fixes: vscode.CodeAction[] = [];

  // 1. 같은 줄에 있는 input의 id를 찾아 for(htmlFor) 속성으로 연결하는 것이 가장 안정적입니다.
  // fullLine에서 id="some-id" 패턴을 찾습니다.
  const inputIdMatch = fullLine.match(/id="([^"]+)"/);

  // 만약 연결할 input의 id를 찾았다면, for 속성을 추가하는 수정 제안을 생성합니다.
  if (inputIdMatch) {
    const inputId = inputIdMatch[1];
    
    // <label> 태그에 for="some-id"를 추가합니다.
    const fixedCode = code.replace(
      /<label(.*?)>/i,
      `<label htmlFor="${inputId}"$1>`
    );

    const fixFor = new vscode.CodeAction(
      `input id와 연결 (htmlFor="${inputId}")`,
      vscode.CodeActionKind.QuickFix
    );
    fixFor.edit = new vscode.WorkspaceEdit();
    fixFor.edit.replace(document.uri, range, fixedCode);
    fixFor.isPreferred = true; // 이 수정을 가장 우선적으로 추천합니다.

    fixFor.diagnostics = [
      {
        message: `label의 htmlFor 속성을 input의 id와 연결하여 접근성을 향상시킵니다.`,
        range,
        severity: vscode.DiagnosticSeverity.Warning,
        source: "a11y-fixer",
      },
    ];
    fixes.push(fixFor);
  }

  // 2. 오류가 있던 '중첩' 로직은 제거하여 혼동을 방지합니다.
  // 만약 for 속성으로 연결할 id를 찾지 못했다면, AI 기반 수정(control-has-associated-label)이
  // 더 복잡한 문맥을 이해하고 해결책을 제시할 수 있으므로, 여기서는 추가적인 제안을 하지 않습니다.

  return fixes;
};