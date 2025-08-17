// src/rules/ai/adapter.ts
import * as vscode from "vscode";
import { RuleContext, AIFixer } from "../types";

export function wrapStringFixerToAIFixer(
  legacy: (rc: RuleContext) => Promise<string>,
  title: string
): AIFixer {
  return async (rc: RuleContext): Promise<vscode.CodeAction[]> => {
    const newText = await legacy(rc);
    if (!newText || !newText.trim()) return [];

    const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(rc.document.uri, rc.range, newText);
    action.edit = edit;

    // 진단 연결은 provider 쪽에서 해주므로 여기선 생략
    return [action];
  };
}
