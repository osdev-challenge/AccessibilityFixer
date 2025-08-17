// src/rules/ai/adapter.ts
import * as vscode from "vscode";
import type { RuleContext } from "../types";

// 이 파일 안에서만 쓸 AIFixer 타입 정의
type AIFixer = (rc: RuleContext) => Promise<vscode.CodeAction[]>;

export function wrapStringFixerToAIFixer(
  legacy: (rc: RuleContext) => Promise<string | null | undefined>,
  title: string
): AIFixer {
  return async (rc: RuleContext): Promise<vscode.CodeAction[]> => {
    const newText = await legacy(rc);
    if (!newText || !newText.trim()) return [];

    const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(rc.document.uri, rc.range, newText);
    action.edit = edit;

    return [action];
  };
}
