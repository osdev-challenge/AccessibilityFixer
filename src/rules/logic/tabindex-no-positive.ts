import * as vscode from "vscode";
import { RuleContext } from "../types";

export function tabindexNoPositiveFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  // 이 정규식은 'tabIndex=' 뒤에 오는 따옴표 또는 중괄호 안의 숫자를 찾습니다.
  // Group 1: (tabIndex\s*=\s*) - "tabIndex=" 또는 "tabIndex = "
  // Group 2: (["']?|\{?) - 따옴표 또는 여는 중괄호 (선택적)
  // Group 3: (\d+) - 실제 숫자 값
  // Group 4: (["']?|\}?) - 닫는 따옴표 또는 닫는 중괄호 (선택적)
  const regex = /(tabIndex\s*=\s*)(["']?|\{?)(\d+)(["']?|\}?)/;
  const match = context.code.match(regex);

  if (!match || match.length < 5) {
    // 5개 그룹 (전체, G1, G2, G3, G4)
    console.warn(
      `[DEBUG - tabindexFix] Could not parse tabIndex value from context.code: '${context.code}'. Cannot provide fix.`
    );
    return []; // 값을 찾지 못하면 수정 제안을 제공하지 않습니다.
  }

  const [, prefix, opener, originalValue, closer] = match; // 그룹 추출

  // ✅ 교체 로직 수정: 이제 항상 tabIndex="값" 형태로 만듭니다.
  // 이렇게 하면 {2} -> "0}"과 같은 오류를 방지하고 일관된 출력을 보장합니다.
  const createReplacementCode = (targetValue: string) => {
    // match[0]은 정규식에 매칭된 전체 문자열 (예: "tabIndex={2}")
    // match[1]은 "tabIndex=" 부분
    // 나머지 부분을 버리고 `tabIndex="새로운값"` 형태로 재구성합니다.
    return `${prefix}"${targetValue}"`;
  };

  // 1. tabIndex를 "0"으로 변경하는 제안
  const fixToZero = new vscode.CodeAction(
    `tabIndex를 "0"으로 변경 (기본 포커스 순서 포함)`, // 제안 제목
    vscode.CodeActionKind.QuickFix
  );
  fixToZero.edit = new vscode.WorkspaceEdit();

  const newCodeZero = createReplacementCode("0"); // 새로운 코드 생성

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
    `tabIndex를 "-1"로 변경 (프로그래밍 방식 포커스만 가능)`, // 제안 제목
    vscode.CodeActionKind.QuickFix
  );
  fixToMinusOne.edit = new vscode.WorkspaceEdit();

  const newCodeMinusOne = createReplacementCode("-1"); // 새로운 코드 생성

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
