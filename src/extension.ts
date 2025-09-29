import * as vscode from "vscode";
import { LintManager } from "./lint/LintManager";
import {
  stripAllLangAttrs,
  injectLang,
  normalizeBCP47,
  COMMON_LANG_CANDIDATES,
} from "./utils/htmllang";
import { initGpt } from "./ai/aiSingleton";
import { aiSettings } from "./ai/aiSettings";

// LintManager
let manager: LintManager;

export async function activate(context: vscode.ExtensionContext) {
  manager = new LintManager();

  initGpt(context); // 한 번만 실행
  const resetAndReconfigureGpt = vscode.commands.registerCommand(
    "a11yFix.resetAndReconfigureGpt",
    async () => {
      await context.globalState.update("OPENAI_API_KEY", undefined);
      await context.globalState.update("AI_MODEL", undefined);

      vscode.window.showInformationMessage(
        "[A11y Fix] 기존 GPT 설정이 초기화되었습니다. 새로 설정을 진행합니다."
      );

      const success = await aiSettings(context);
      if (!success) return;
    }
  );

  context.subscriptions.push(resetAndReconfigureGpt);

  // 이벤트 단일통로로 바꾸기
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => manager.schedule(doc)),
    vscode.workspace.onDidChangeTextDocument((e) =>
      manager.schedule(e.document)
    ),
    vscode.workspace.onDidSaveTextDocument((doc) => manager.schedule(doc)),
    vscode.window.onDidChangeActiveTextEditor((ed) => {
      if (ed) manager.schedule(ed.document);
    })
  );

  vscode.workspace.textDocuments.forEach((doc) => manager.schedule(doc));

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
    async (arg?: {
      uri: vscode.Uri;
      range: vscode.Range;
      original: string;
    }) => {
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
    return cached.codeActions.filter((a) => {
      const d = a.diagnostics?.[0];
      return d ? !!d.range.intersection(range) : true;
    });
  }
}

export function deactivate() {}
