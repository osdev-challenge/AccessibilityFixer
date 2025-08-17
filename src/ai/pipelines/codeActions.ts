// src/ai/pipelines/codeActions.ts
import * as vscode from "vscode";
import { RuleContext } from "../../rules/types";

/**
 * GPT가 돌려준 patched 코드가 비었거나 원본과 동일하면 CodeAction을 만들지 않는다.
 * 정상 패치면 해당 range에 교체하는 QuickFix를 반환한다.
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
