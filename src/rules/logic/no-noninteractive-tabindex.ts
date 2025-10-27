import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";

/**
 * 비인터랙티브 요소에 사용된 tabindex 속성을 제거하는 Fixer
 */
export const noNoninteractiveTabindexFix: RuleFixer = (
  context: RuleContext
): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // ✅ 정확히 tabIndex={0} 또는 "0" 등을 매칭
  const tabIndexRegex = /\s*tabIndex\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/;
  const match = code.match(tabIndexRegex);

  if (!match) {
    console.warn(`[DEBUG] tabIndex not found in code: ${code}`);
    return [];
  }

  const matchText = match[0];
  const startOffset = code.indexOf(matchText);
  const endOffset = startOffset + matchText.length;

  // 실제로 교체할 범위 계산 (range 기준 상대 위치로)
  const tabIndexRange = new vscode.Range(
    document.positionAt(document.offsetAt(range.start) + startOffset),
    document.positionAt(document.offsetAt(range.start) + endOffset)
  );

  const fix = new vscode.CodeAction(
    `tabIndex 속성 제거`,
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, tabIndexRange, ""); 

  fix.isPreferred = true;
  fix.diagnostics = [
    {
      message: `tabIndex는 비인터랙티브 요소에 사용될 수 없습니다.`,
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: "web-a11y-fixer",
    },
  ];

  return [fix];
};
