// src/rules/logic/prefer-tag-over-role.ts

import * as vscode from "vscode";
import { RuleContext } from "../types";

export function preferTagOverRoleFix(
  context: RuleContext
): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  let newCode = context.code;
  let fixTitle = ``;
  let isFixable = false;

  // 정규식을 사용하여 태그의 이름, 속성, 내용을 분리하여 캡처합니다.
  // Group 1: (\w+) - 태그 이름 (예: div)
  // Group 2: (\s+[^>]*?) - 속성들 (예: ' role="link" onClick={...}')
  // Group 3: (?:>(.*?)<\/\1>|\s*\/>) - 내용과 닫는 태그 또는 self-closing 태그
  //   - (?:...) : 비캡처 그룹
  //   - >(.*?)<\/\1> : 내용과 닫는 태그 (예: >Go Home</div>)
  //   - \s*\/> : self-closing 태그 (예: />)
  // s 플래그는 .이 개행 문자를 포함하도록 합니다.
  const elementParseRegex = /<(\w+)(\s+[^>]*?)?(?:>(.*?)<\/\1>|\s*\/>)/s;
  const match = context.code.match(elementParseRegex);

  if (!match) {
    console.warn(
      `[DEBUG - preferTagOverRoleFix] Could not parse element structure: ${context.code}`
    );
    return [];
  }

  const originalTagName = match[1]; // 예: "div"
  const originalAttributes = match[2] || ""; // 예: ' role="link" onClick={...}'
  const originalContent = match[3] || ""; // 예: "Go Home" (내용이 없으면 빈 문자열)

  // role 속성 제거
  let modifiedAttributes = originalAttributes
    .replace(/\s*role="[^"]*"/, "")
    .trim();

  // Case 1: div role="link" -> <a>
  if (originalTagName === "div" && originalAttributes.includes('role="link"')) {
    const newTagName = "a";
    fixTitle = `div role="link"를 <a>로 변경`;
    // <a> 태그는 내용을 유지하고 닫는 태그가 필요합니다.
    newCode = `<${newTagName}${
      modifiedAttributes ? ` ${modifiedAttributes}` : ""
    }>${originalContent}</${newTagName}>`;
    isFixable = true;
  }
  // Case 2: div role="checkbox" -> <input type="checkbox">
  else if (
    originalTagName === "div" &&
    originalAttributes.includes('role="checkbox"')
  ) {
    const newTagName = "input";
    const newTypeAttribute = 'type="checkbox"';
    fixTitle = `div role="checkbox"를 <input type="checkbox">로 변경`;
    // ✅ <input> 태그는 스스로 닫히며 내용을 가질 수 없습니다.
    //    속성만 포함하고, 마지막에 " />"로 닫습니다.
    newCode = `<${newTagName} ${newTypeAttribute}${
      modifiedAttributes ? ` ${modifiedAttributes}` : ""
    } />`;
    isFixable = true;
  }

  if (isFixable) {
    const fix = new vscode.CodeAction(fixTitle, vscode.CodeActionKind.QuickFix);
    fix.edit = new vscode.WorkspaceEdit();

    console.log(
      `[DEBUG - preferTagOverRoleFix] Original Code: '${context.code}'`
    );
    console.log(
      `[DEBUG - preferTagOverRoleFix] Proposed newCode: '${newCode}'`
    );

    fix.edit.replace(context.document.uri, context.range, newCode);
    fix.diagnostics = [
      new vscode.Diagnostic(
        context.range,
        `네이티브 HTML 요소를 사용하는 것이 권장됩니다.`,
        vscode.DiagnosticSeverity.Warning
      ),
    ];
    fixes.push(fix);
  }

  return fixes;
}
