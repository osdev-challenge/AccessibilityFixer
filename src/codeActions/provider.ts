import * as vscode from "vscode";
import { LintManager } from "../lint/LintManager";

export class A11yCodeActionProvider implements vscode.CodeActionProvider {
  constructor(private manager: LintManager) {}

  provideCodeActions(doc: vscode.TextDocument, range: vscode.Range) {
    const cached = this.manager.getCached(doc);
    if (!cached) return [];
    return cached.codeActions.filter(a => {
      const d = a.diagnostics?.[0];
      return d ? !!d.range.intersection(range) : true;
    });
  }
}

export function registerCodeActions(ctx: vscode.ExtensionContext, manager: LintManager) {
  ctx.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { language: "javascript", scheme: "file" },
        { language: "typescript", scheme: "file" },
        { pattern: "**/*.{jsx,tsx}" }
      ],
      new A11yCodeActionProvider(manager),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    )
  );
}
