// src/extension.ts

import * as dotenv from "dotenv";
dotenv.config();

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
  diagnosticCollection = vscode.languages.createDiagnosticCollection("jsx-a11y");
  context.subscriptions.push(diagnosticCollection);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.scheme === "file") {
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
        { scheme: "file", language: "typescript" },       // ✅ scheme 추가
        { scheme: "file", language: "typescriptreact" },
      ],
      new HtmlLintQuickFixProvider(),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }
    )
  );

  async function lintDocument(document: vscode.TextDocument) {
    if (lintTimeout) {
      clearTimeout(lintTimeout);
    }
    lintTimeout = setTimeout(async () => {
      // 기존 진단(문제)을 함수 시작 부분에서 먼저 삭제
      diagnosticCollection.delete(document.uri);

      const filePath = document.uri.fsPath;
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

      const supportedLanguages = [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
      ];

      if (!supportedLanguages.includes(document.languageId)) return;

      // node_modules, out 파일은 스킵 (미세 최적화)
      const sep = path.sep;
      if (
        filePath.includes(`${sep}node_modules${sep}`) ||
        filePath.includes(`${sep}out${sep}`)
      ) {
        return;
      }

      // 워크스페이스 루트 우선으로 eslint.config.mjs를 찾고, 없으면 현재 프로세스 CWD를 사용
      const baseDir = workspaceRoot ?? process.cwd();
      const configFilePath = path.join(baseDir, "eslint.config.mjs");

      let effectiveEslintCwd = workspaceRoot ?? process.cwd();

      const eslint = new ESLint({
        cwd: effectiveEslintCwd,
        overrideConfigFile: configFilePath,
      });

      try {
        const results = await eslint.lintText(document.getText(), {
          filePath,
        });

        // ✅ Map을 사용하여 진단 중복 제거 (ruleId, range, message 기반)
        const uniqueDiagnosticsMap = new Map<string, vscode.Diagnostic>();

        for (const result of results) {
          const lines = result.source?.split("\n") ?? [];

          for (const msg of result.messages) {
            // VSCode Range 생성
            const range = new vscode.Range(
              new vscode.Position(Math.max(0, (msg.line ?? 1) - 1), Math.max(0, (msg.column ?? 1) - 1)),
              new vscode.Position(
                Math.max(0, (msg.endLine ?? msg.line ?? 1) - 1),
                Math.max(0, (msg.endColumn ?? (msg.column ?? 1)) - 1)
              )
            );

            const ruleIdString = getRuleIdString(msg.ruleId as any);

            // ESLint severity(1=warn, 2=error) 반영
            const severity =
              (msg as any).severity === 2
                ? vscode.DiagnosticSeverity.Error
                : vscode.DiagnosticSeverity.Warning;

            // ✅ 고유 키에 메시지 내용까지 포함하여 더 정확한 중복 제거
            const key = `${ruleIdString ?? "unknown"}-${range.start.line}:${
              range.start.character
            }-${range.end.line}:${range.end.character}-${msg.message}`;

            if (uniqueDiagnosticsMap.has(key)) {
              continue;
            }

            const diagnostic = new vscode.Diagnostic(range, msg.message, severity);
            diagnostic.source = "jsx-a11y";
            diagnostic.code = ruleIdString;

            uniqueDiagnosticsMap.set(key, diagnostic);

            const line = lines[(msg.line ?? 1) - 1] ?? "";
            console.log(
              `❌ 문제 발생: ${msg.message} (Raw Rule ID: ${
                JSON.stringify(msg.ruleId) ?? "undefined"
              })`
            );
            console.log(`   ⤷ ${filePath}:${msg.line}:${msg.column} - ${line}`);
          }
        }

        const finalDiagnostics = Array.from(uniqueDiagnosticsMap.values());

        if (finalDiagnostics.length > 0) {
          diagnosticCollection.set(document.uri, finalDiagnostics); // 중복 제거된 진단 설정
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
  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): Promise<vscode.CodeAction[]> {
    const finalCodeActions: vscode.CodeAction[] = [];
    const seenActionKeys = new Set<string>(); // 최종 CodeAction 중복 제거를 위한 Set

    // 1. 들어오는 진단(diagnostics) 자체에서 중복 제거 (ESLint 보고 중복 방지)
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
      if (!diagnosticCodeString) continue;

      const isA11y = diagnosticCodeString.startsWith("jsx-a11y");
      const isEslintDisableFix = diagnostic.message.includes("Disable");
      const isShowDocumentation = diagnostic.message.includes("Show documentation");

      if (!(isA11y && !isEslintDisableFix) && !isShowDocumentation) {
        continue;
      }

      const ruleId = diagnosticCodeString;

      if (isShowDocumentation) {
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
      });

      // ✅ 개별 오류 격리를 위한 try/catch
      let fixesFromDispatcher: vscode.CodeAction[] = [];
      try {
        fixesFromDispatcher = await dispatchRule(ruleContext);
      } catch (e) {
        console.error(`[dispatchRule 오류] ${ruleId}`, e);
        continue;
      }

      fixesFromDispatcher.forEach((fix) => {
        let fixKeyParts: string[] = [fix.title, ruleId];
        if (fix.edit) {
          fix.edit.entries().forEach(([uri, edits]) => {
            edits.forEach((edit) => {
              fixKeyParts.push(
                `${uri.fsPath}`,
                `${edit.range.start.line}:${edit.range.start.character}`,
                `${edit.range.end.line}:${edit.range.end.character}`,
                `${edit.newText}`
              );
            });
          });
        }
        const actionKey = fixKeyParts.join("|");

        if (!seenActionKeys.has(actionKey)) {
          if (!fix.diagnostics) {
            fix.diagnostics = [];
          }
          fix.diagnostics.push(diagnostic);
          finalCodeActions.push(fix);
          seenActionKeys.add(actionKey);
        }
      });
    }

    return finalCodeActions;
  }
}

export function deactivate() {
  if (lintTimeout) clearTimeout(lintTimeout);
}
