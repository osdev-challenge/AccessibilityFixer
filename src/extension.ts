import * as vscode from "vscode";
import { ESLint } from "eslint";
import path from "path";

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidSaveTextDocument(lintDocument);
  vscode.workspace.onDidOpenTextDocument(lintDocument);

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "javascriptreact" }, // .jsx
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "typescriptreact" }, // .tsx
      ],
      new HtmlLintQuickFixProvider(),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }
    )
  );

  async function lintDocument(document: vscode.TextDocument) {
    const filePath = document.uri.fsPath;
    const supportedLanguages = [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
    ];

    if (!supportedLanguages.includes(document.languageId)) return;

    const eslint = new ESLint({
      cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? process.cwd(),
      overrideConfigFile: path.resolve(__dirname, "..", "eslint.config.mjs"),
    });

    const diagnosticCollection =
      vscode.languages.createDiagnosticCollection("jsx-a11y");
    context.subscriptions.push(diagnosticCollection);

    try {
      const results = await eslint.lintText(document.getText(), {
        filePath,
      });

      const diagnosticSet = new Set<string>();
      const diagnostics: vscode.Diagnostic[] = [];

      for (const result of results) {
        const lines = result.source?.split("\n") ?? [];

        for (const msg of result.messages) {
          const range = new vscode.Range(
            new vscode.Position(msg.line - 1, msg.column - 1),
            new vscode.Position(
              msg.endLine ? msg.endLine - 1 : msg.line - 1,
              msg.endColumn ? msg.endColumn - 1 : msg.column
            )
          );

          const key = `${msg.ruleId}-${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`;
          if (diagnosticSet.has(key)) continue;
          diagnosticSet.add(key);

          const diagnostic = new vscode.Diagnostic(
            range,
            msg.message,
            vscode.DiagnosticSeverity.Warning // 항상 노란 줄로 설정
          );
          diagnostic.source = "jsx-a11y";
          diagnostic.code = msg.ruleId ?? undefined;
          diagnostics.push(diagnostic);

          const line = lines[msg.line - 1] ?? "";
          console.log(
            `❌ 문제 발생: ${msg.message} (${msg.ruleId ?? "unknown rule"})`
          );
          console.log(`   ⤷ ${filePath}:${msg.line}:${msg.column} - ${line}`);
          console.log(`   ⤷ ${diagnostic.code}`);
        }
      }

      diagnosticCollection.delete(document.uri);
      if (diagnostics.length > 0) {
        diagnosticCollection.set(document.uri, diagnostics);
      }
    } catch (error) {
      console.error("❌ ESLint 분석 중 오류 발생:", error);
    }
  }
}

class HtmlLintQuickFixProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    return context.diagnostics
      .filter((d) => d.code?.toString().startsWith("jsx-a11y"))
      .flatMap((diagnostic) => {
        const fixes: vscode.CodeAction[] = [];
        const ruleId = diagnostic.code?.toString(); // <-- 이게 Rule

        const problemText = document.getText(diagnostic.range);
        const fullLine = document.lineAt(diagnostic.range.start.line).text;

        console.log("📌 [문제 코드 추출]", {
          rule: ruleId,
          message: diagnostic.message,
          text: problemText,
          fullLine: fullLine,
          range: diagnostic.range,
        });

        // AI로 문제 코드를 보낼 수 있는 자리

        const fix = new vscode.CodeAction(
          `🛠 (Preview) Replace code for ${diagnostic.code}`,
          vscode.CodeActionKind.QuickFix
        );

        fix.edit = new vscode.WorkspaceEdit();

        // 예시: 고정된 테스트 응답을 적용
        const dummyAiFixedCode = `fixed code`;

        fix.edit.replace(document.uri, diagnostic.range, dummyAiFixedCode);
        fix.diagnostics = [diagnostic];
        fixes.push(fix);

        return fixes;
      });
  }
}

export function deactivate() {}
