import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";
import { findElementRanges } from "../../ai/pipelines/parsers"; // 범위 탐색 유틸리티 재사용

export const preferNativeElementsFix: RuleFixer = (
  context: RuleContext
): vscode.CodeAction[] => {
  const { code, document } = context;
  const fixes: vscode.CodeAction[] = [];

  const roleMatch = code.match(/role="(link|checkbox)"/);
  if (!roleMatch) return [];

  const role = roleMatch[1];
  const elementRanges = findElementRanges(document, context.range.start);
  if (!elementRanges) return [];

  if (role === 'link') {
    const newOpenTag = `<a href="#"${elementRanges.openTag.toString().replace(/<(?:\w+)\s*role="link"/i, '')}`;
    const fix = new vscode.CodeAction(`<a> 태그로 교체 (role="link")`, vscode.CodeActionKind.QuickFix);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, elementRanges.openTag, newOpenTag);
    edit.replace(document.uri, elementRanges.closeTag, '</a>'); // 닫는 태그 교체
    fix.edit = edit;
    fixes.push(fix);
  }

  if (role === 'checkbox') {
    const attrs = elementRanges.openTag.toString().replace(/<(?:\w+)\s*role="checkbox"|aria-checked="[^"]*"/ig, '');
    const newOpenTag = `<input type="checkbox"${attrs.replace(/>$/, ' />')}`; // Self-closing으로 변경
    const fix = new vscode.CodeAction(`<input type="checkbox"> 태그로 교체`, vscode.CodeActionKind.QuickFix);
    const edit = new vscode.WorkspaceEdit();
    // input 태그는 내용이 없으므로 요소 전체를 교체
    edit.replace(document.uri, elementRanges.element, newOpenTag);
    fix.edit = edit;
    fixes.push(fix);
  }

  return fixes;
};