// src/rules/logic/label-has-associated-control.ts
import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";

export const labelHasAssociatedControlFix: RuleFixer = (
  context: RuleContext
): vscode.CodeAction[] => {
  const { code, range, document } = context;
  const fixes: vscode.CodeAction[] = [];

  // 중첩 케이스: <label>안에 input을 감싸는 형태로 변경
  const fixNested = new vscode.CodeAction(
    `label 내부에 input 중첩`,
    vscode.CodeActionKind.QuickFix
  );
  fixNested.edit = new vscode.WorkspaceEdit();
  fixNested.edit.replace(
    document.uri,
    range,
    `<label>${code}</label>`
  );
  fixNested.diagnostics = [
    {
      message: `label과 input을 중첩하여 연결하세요.`,
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: "web-a11y-fixer",
    },
  ];
  fixes.push(fixNested);

  // for 속성 추가 케이스: id를 추론하여 for 속성 추가
  const inputIdMatch = context.fullLine.match(/id="([^"]+)"/);
  if (inputIdMatch) {
    const inputId = inputIdMatch[1];
    const fixedCode = code.replace(
      /<label(.*?)>/i,
      `<label for="${inputId}"$1>`
    );
    const fixFor = new vscode.CodeAction(
      `for="${inputId}" 속성 추가`,
      vscode.CodeActionKind.QuickFix
    );
    fixFor.edit = new vscode.WorkspaceEdit();
    fixFor.edit.replace(document.uri, range, fixedCode);
    fixFor.diagnostics = [
      {
        message: `label의 for 속성을 input의 id와 연결하세요.`,
        range,
        severity: vscode.DiagnosticSeverity.Warning,
        source: "web-a11y-fixer",
      },
    ];
    fixes.push(fixFor);
  }

  return fixes;
};