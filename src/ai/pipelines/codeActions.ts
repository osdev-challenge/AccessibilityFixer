// src/ai/pipelines/codeActions.ts
import * as vscode from "vscode";
import { RuleContext } from "../../rules/types";

/**
 * (기존) rc.range 전체를 교체하는 QuickFix
 * - GPT가 라인/부분 범위에 맞춘 패치를 줄 때 사용
 */
export function createReplaceAction(
  rc: RuleContext,
  patched: string,
  title: string
): vscode.CodeAction[] {
  if (!patched) return [];
  const next = patched.trim();
  const prev = rc.code.trim();
  if (!next || next === prev) return [];

  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(rc.document.uri, rc.range, next);
  action.edit = edit;
  action.isPreferred = true;
  return [action];
}

/* ===================== B안: 요소 전체 교체용 ===================== */

/**
 * 요소 전체(elementRange)를 새 HTML로 한 번에 교체하는 QuickFix
 */
export function buildReplaceWholeElementAction(
  doc: vscode.TextDocument,
  elementRange: vscode.Range,
  newHtml: string,
  title = "Replace element with AI suggestion"
): vscode.CodeAction {
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  const edit = new vscode.WorkspaceEdit();
  edit.set(doc.uri, [vscode.TextEdit.replace(elementRange, newHtml)]);
  action.edit = edit;
  action.isPreferred = true;
  return action;
}

/**
 * (선택) 한 줄 전체를 통째로 교체하는 QuickFix
 * - 여러 요소가 한 줄에 섞여 있을 수 있어 위험할 수 있으니, 가급적 element 교체를 권장
 */
export function buildReplaceWholeLineAction(
  doc: vscode.TextDocument,
  line: number,
  newLineText: string,
  title = "Replace whole line"
): vscode.CodeAction {
  const lineRange = doc.lineAt(line).range;
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  const edit = new vscode.WorkspaceEdit();
  edit.set(doc.uri, [vscode.TextEdit.replace(lineRange, newLineText)]);
  action.edit = edit;
  return action;
}
