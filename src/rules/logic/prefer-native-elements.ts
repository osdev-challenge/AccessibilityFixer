// src/rules/logic/prefer-native-elements.ts
import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";

export const preferNativeElementsFix: RuleFixer = (
  context: RuleContext
): vscode.CodeAction[] => {
  const { code, range, document } = context;
  const fixes: vscode.CodeAction[] = [];

  // role="link" → <a>로 교체
  const linkMatch = code.match(/<(?:\w+)\s+role="link"([^>]*)>/i);
  if (linkMatch) {
    const attrs = linkMatch[1];
    const newCode = code.replace(
      /<(?:\w+)\s+role="link"([^>]*)>/i,
      `<a href="#"${attrs}>`
    );
    const fix = new vscode.CodeAction(
      `<a> 태그로 교체 (role="link")`,
      vscode.CodeActionKind.QuickFix
    );
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(document.uri, range, newCode);
    fix.diagnostics = [
      {
        message: `role="link" 대신 네이티브 <a> 요소를 사용하세요.`,
        range,
        severity: vscode.DiagnosticSeverity.Warning,
        source: "web-a11y-fixer",
      },
    ];
    fixes.push(fix);
  }

  // role="checkbox" → <input type="checkbox">로 교체
  const checkboxMatch = code.match(/<(?:\w+)\s+role="checkbox"([^>]*)>/i);
  if (checkboxMatch) {
    const attrs = checkboxMatch[1].replace(/\saria-checked/i, "");
    const newCode = code.replace(
      /<(?:\w+)\s+role="checkbox"([^>]*)>/i,
      `<input type="checkbox"${attrs}>`
    );
    const fix = new vscode.CodeAction(
      `<input type="checkbox"> 태그로 교체`,
      vscode.CodeActionKind.QuickFix
    );
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(document.uri, range, newCode);
    fix.diagnostics = [
      {
        message: `role="checkbox" 대신 네이티브 <input type="checkbox"> 요소를 사용하세요.`,
        range,
        severity: vscode.DiagnosticSeverity.Warning,
        source: "web-a11y-fixer",
      },
    ];
    fixes.push(fix);
  }

  return fixes;
};