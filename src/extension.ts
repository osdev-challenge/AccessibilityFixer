<<<<<<< Updated upstream
import * as vscode from "vscode";
import { ESLint } from "eslint";
import path from "path";

export function activate(context: vscode.ExtensionContext) {
=======
// src/extension.ts

import * as vscode from "vscode";
import { ESLint } from "eslint";
import * as path from "path";
import { dispatchRule } from "./ruleDispatcher";
import { RuleContext } from "./rules/types";

// diagnosticCollection을 activate 함수 외부(전역) 또는 activate 함수 내에서 한 번만 선언
let diagnosticCollection: vscode.DiagnosticCollection;
// lintTimeout 변수 추가
let lintTimeout: NodeJS.Timeout | undefined;

// 헬퍼 함수: Diagnostic Code에서 규칙 ID 문자열을 안전하게 추출
function getRuleIdString(
  code: vscode.Diagnostic["code"] | null
): string | undefined {
  if (code === null) {
    return undefined;
  }
  if (typeof code === "string") {
    return code;
  }
  if (code && typeof code === "object") {
    if (typeof (code as any).value === "string") {
      return (code as any).value;
    }
    if (typeof (code as any).name === "string") {
      return (code as any).name;
    }
  }
  return undefined;
}

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("jsx-a11y");
  context.subscriptions.push(diagnosticCollection);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.scheme === "file") {
      lintDocument(event.document);
    }
  });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const filePath = document.uri.fsPath;
    const supportedLanguages = [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
    ];
=======
    if (lintTimeout) {
      clearTimeout(lintTimeout);
    }
    lintTimeout = setTimeout(async () => {
      // 기존 진단(문제)을 함수 시작 부분에서 먼저 삭제
      diagnosticCollection.delete(document.uri);

      const filePath = document.uri.fsPath;
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const configFilePath = path.resolve(__dirname, "..", "eslint.config.mjs");
>>>>>>> Stashed changes

    if (!supportedLanguages.includes(document.languageId)) return;

    const eslint = new ESLint({
      cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? process.cwd(),
      overrideConfigFile: path.resolve(__dirname, "..", "eslint.config.mjs"),
    });

    const diagnosticCollection =
      vscode.languages.createDiagnosticCollection("jsx-a11y");
    context.subscriptions.push(diagnosticCollection);

<<<<<<< Updated upstream
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
=======
      let effectiveEslintCwd = workspaceRoot;
      if (!effectiveEslintCwd) {
        const pathSegments = filePath.split(path.sep);
        const projectRootIndex = pathSegments.indexOf(
          "web-a11y-fixer-extension"
        );
        if (projectRootIndex !== -1) {
          effectiveEslintCwd = path.join(
            ...pathSegments.slice(0, projectRootIndex + 1)
          );
        } else {
          effectiveEslintCwd = process.cwd();
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
    const finalCodeActions: vscode.CodeAction[] = [];
    const seenActionKeys = new Set<string>(); // 최종 CodeAction 중복 제거를 위한 Set

    // 1. 들어오는 진단(diagnostics) 자체에서 중복 제거 (ESLint 보고 중복 방지)
    // 이 부분은 lintDocument에서 이미 처리되므로, 여기서는 필터링만 집중
    const uniqueDiagnosticsMap = new Map<string, vscode.Diagnostic>();
    for (const diag of context.diagnostics) {
      const ruleId = getRuleIdString(diag.code);
      if (ruleId) {
        const key = `${ruleId}-${diag.range.start.line}:${diag.range.start.character}-${diag.range.end.line}:${diag.range.end.character}-${diag.message}`;
        uniqueDiagnosticsMap.set(key, diag);
      }
    }
    const uniqueContextDiagnostics = Array.from(uniqueDiagnosticsMap.values());

    for (const diagnostic of uniqueContextDiagnostics) {
      const diagnosticCodeString = getRuleIdString(diagnostic.code);

      if (!diagnosticCodeString) {
        continue;
      }

      const isA11y = diagnosticCodeString.startsWith("jsx-a11y");

      const isEslintDisableFix = diagnostic.message.includes("Disable");
      const isShowDocumentation =
        diagnostic.message.includes("Show documentation");

      if (!(isA11y && !isEslintDisableFix) && !isShowDocumentation) {
        continue;
      }

      const ruleId = diagnosticCodeString;

      if (!ruleId) {
        console.warn(
          `[DEBUG] diagnostic.code에서 ruleId 추출 실패 (flatMap 내부):`,
          diagnostic.code
        );
        return []; // 이 경우는 이미 필터링에서 걸러졌어야 하지만 안전을 위해 유지
      }

      if (isShowDocumentation) {
        // isShowDocumentation 변수 사용
        const showDocAction = new vscode.CodeAction(
          diagnostic.message,
          vscode.CodeActionKind.QuickFix
        );
        showDocAction.diagnostics = [diagnostic];
        showDocAction.command = {
          command: "eslint.showDocumentation",
          title: diagnostic.message,
          arguments: [ruleId],
        };
        const actionKey = `doc-${ruleId}`;
        if (!seenActionKeys.has(actionKey)) {
          finalCodeActions.push(showDocAction);
          seenActionKeys.add(actionKey);
        }
        continue;
      }

      const problemText = document.getText(diagnostic.range);
      const fullLine = document.lineAt(diagnostic.range.start.line).text;
      const lineNumber = diagnostic.range.start.line + 1;

      const ruleContext: RuleContext = {
        ruleName: ruleId,
        code: problemText,
        fileCode: document.getText(),
        lineNumber: lineNumber,
        fullLine: fullLine,
        range: diagnostic.range,
        document: document,
      };

      console.log("📌 [문제 코드 추출]", {
        rule: ruleId,
        message: diagnostic.message,
        text: problemText,
        fullLine: fullLine,
        range: diagnostic.range,
>>>>>>> Stashed changes
      });
  }
}

export function deactivate() {}