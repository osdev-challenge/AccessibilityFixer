import * as dotenv from "dotenv";
dotenv.config();

import * as vscode from "vscode";
import { LintManager } from "./lint/LintManager";
import {
  stripAllLangAttrs,
  injectLang,
  normalizeBCP47,
  COMMON_LANG_CANDIDATES,
} from "./utils/htmllang";

// LintManager
let manager: LintManager;

export function activate(context: vscode.ExtensionContext) {
  //초기화
  manager = new LintManager();

  // 이벤트 단일통로로 바꾸기
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => manager.schedule(doc)),
    vscode.workspace.onDidChangeTextDocument(e => manager.schedule(e.document)),
    vscode.workspace.onDidSaveTextDocument(doc => manager.schedule(doc)),
    vscode.window.onDidChangeActiveTextEditor(ed => { if (ed) manager.schedule(ed.document); })
  );

  vscode.workspace.textDocuments.forEach(doc => manager.schedule(doc));

  // 린트 중복 방지
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "typescriptreact" },
      ],
      new HtmlLintQuickFixProvider(manager),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    )
  );

  const pickLangCmd = vscode.commands.registerCommand(
    "a11yFix.pickHtmlLang",
    async (arg?: { uri: vscode.Uri; range: vscode.Range; original: string }) => {
      if (!arg) return;

      const picked = await vscode.window.showQuickPick(COMMON_LANG_CANDIDATES, {
        placeHolder: "언어 코드를 선택하세요 (예: en, ko, en-US, zh-CN)",
      });
      if (!picked) return;

      const lang = normalizeBCP47(picked);
      const newTag = injectLang(stripAllLangAttrs(arg.original), lang);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(arg.uri, arg.range, newTag);
      await vscode.workspace.applyEdit(edit);
    }
  );
  context.subscriptions.push(pickLangCmd);
}

class HtmlLintQuickFixProvider implements vscode.CodeActionProvider {
  constructor(private manager: LintManager) {}

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const cached = this.manager.getCached(document);
    if (!cached) return [];
    return cached.codeActions.filter(a => {
      const d = a.diagnostics?.[0];
      return d ? !!d.range.intersection(range) : true;
    });
  }
}

export function deactivate() {
}
