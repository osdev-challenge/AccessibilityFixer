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

export function activate(context: vscode.ExtensionContext) {
  // diagnosticCollection을 activate 시점에 한 번만 생성
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("jsx-a11y");
  context.subscriptions.push(diagnosticCollection); // 확장 기능 종료 시 자동으로 정리되도록 등록

  // onDidChangeTextDocument 이벤트 리스너 추가: 타이핑 중에도 린팅 실행
  vscode.workspace.onDidChangeTextDocument((event) => {
    // 변경된 문서가 현재 활성 문서이거나, 저장된 문서와 동일하면 린팅 트리거
    if (event.document.uri.scheme === "file") {
      // 파일 시스템에 있는 파일만 처리
      lintDocument(event.document);
    }
  });
  vscode.workspace.onDidSaveTextDocument(lintDocument);
  vscode.workspace.onDidOpenTextDocument(lintDocument);

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "typescriptreact" },
      ],
      new HtmlLintQuickFixProvider(),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }
    )
  );

  async function lintDocument(document: vscode.TextDocument) {
    // 디바운스 로직: 너무 자주 린팅이 실행되는 것을 방지
    if (lintTimeout) {
      clearTimeout(lintTimeout);
    }
    lintTimeout = setTimeout(async () => {
      // 기존 진단(문제)을 함수 시작 부분에서 먼저 삭제
      diagnosticCollection.delete(document.uri);

      const filePath = document.uri.fsPath;
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const configFilePath = path.resolve(__dirname, "..", "eslint.config.mjs");

      const supportedLanguages = [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
      ];

      if (!supportedLanguages.includes(document.languageId)) return;

      // 워크스페이스 루트가 undefined일 경우, 현재 파일 경로에서 프로젝트 루트를 추정
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
        }
      }

      const eslint = new ESLint({
        cwd: effectiveEslintCwd,
        overrideConfigFile: configFilePath,
      });

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
              vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = "jsx-a11y";
            if (typeof msg.ruleId === "string") {
              diagnostic.code = msg.ruleId;
            } else if (msg.ruleId !== null && typeof msg.ruleId === "object") {
              const rawRuleId = msg.ruleId as any;
              if (typeof rawRuleId.value === "string") {
                diagnostic.code = rawRuleId.value;
              } else {
                diagnostic.code = undefined;
              }
            } else {
              diagnostic.code = undefined;
            }
            diagnostics.push(diagnostic);

            const line = lines[msg.line - 1] ?? "";
            console.log(
              `❌ 문제 발생: ${msg.message} (Raw Rule ID: ${
                JSON.stringify(msg.ruleId) ?? "undefined"
              })`
            );
            console.log(`   ⤷ ${filePath}:${msg.line}:${msg.column} - ${line}`);
          }
        }

        if (diagnostics.length > 0) {
          diagnosticCollection.set(document.uri, diagnostics);
        } else {
          diagnosticCollection.delete(document.uri);
        }
      } catch (error) {
        console.error("❌ ESLint 분석 중 오류 발생:", error);
      }
    }, 200);
  }
}

class HtmlLintQuickFixProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    return context.diagnostics
      .filter((d) => {
        if (typeof d.code !== "string") {
          return false;
        }
        const isA11y = d.code.startsWith("jsx-a11y");

        const isEslintDisableFix = d.message.includes("Disable");
        const isShowDocumentation = d.message.includes("Show documentation");

        return (isA11y && !isEslintDisableFix) || isShowDocumentation;
      })
      .flatMap((diagnostic) => {
        const ruleId = diagnostic.code as string;
        if (!ruleId) {
          console.warn(
            `[DEBUG] diagnostic.code가 없습니다 (필터링 후):`,
            diagnostic
          );
          return [];
        }

        if (diagnostic.message.includes("Show documentation")) {
          const showDocAction = new vscode.CodeAction(
            diagnostic.message,
            vscode.CodeActionKind.QuickFix
          );
          showDocAction.diagnostics = [diagnostic];
          showDocAction.command = {
            command: "eslint.showDocumentation",
            title: diagnostic.message,
            arguments: [diagnostic.code],
          };
          return [showDocAction];
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
        });

        const fixes = dispatchRule(ruleContext);

        fixes.forEach((fix) => {
          if (!fix.diagnostics) {
            fix.diagnostics = [];
          }
          fix.diagnostics.push(diagnostic);
        });

        return fixes;
      });
  }
}

export function deactivate() {}
