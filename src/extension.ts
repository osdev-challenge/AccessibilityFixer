// src/extension.ts

import * as vscode from "vscode";
import { ESLint } from "eslint";
import * as path from "path";
import { dispatchRule } from "./ruleDispatcher";
import { RuleContext } from "./rules/types";
import { dispatchAIRule } from "./ruleDispatcher";

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
  vscode.workspace.onDidSaveTextDocument(lintDocument);
  vscode.workspace.onDidOpenTextDocument(lintDocument);

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "typescript" },
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
      const configFilePath = path.resolve(__dirname, "..", "eslint.config.mjs");

      const supportedLanguages = [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
      ];

      if (!supportedLanguages.includes(document.languageId)) return;

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

        // ✅ Map을 사용하여 진단 중복 제거 (ruleId, range, message 기반)
        const uniqueDiagnosticsMap = new Map<string, vscode.Diagnostic>();

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

            const ruleIdString = getRuleIdString(msg.ruleId);
            // ✅ 고유 키에 메시지 내용까지 포함하여 더 정확한 중복 제거
            const key = `${ruleIdString ?? "unknown"}-${range.start.line}:${
              range.start.character
            }-${range.end.line}:${range.end.character}-${msg.message}`;

            if (uniqueDiagnosticsMap.has(key)) {
              // console.log(`[DEBUG - lintDocument] Duplicate diagnostic skipped: ${key}`); // 디버그용
              continue;
            }

            const diagnostic = new vscode.Diagnostic(
              range,
              msg.message,
              vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = "jsx-a11y";
            diagnostic.code = ruleIdString;

            uniqueDiagnosticsMap.set(key, diagnostic); // 맵에 추가

            const line = lines[msg.line - 1] ?? "";
            console.log(
              `❌ 문제 발생: ${msg.message} (Raw Rule ID: ${
                JSON.stringify(msg.ruleId) ?? "undefined"
              })`
            );
            console.log(`   ⤷ ${filePath}:${msg.line}:${msg.column} - ${line}`);
          }
        }

        const finalDiagnostics = Array.from(uniqueDiagnosticsMap.values()); // 맵의 값들을 배열로 변환

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
  // 기존: provideCodeActions(...): vscode.CodeAction[]
  // [CHANGE] async로 변경하고 Promise 반환
  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): Promise<vscode.CodeAction[]> {               // ← 여기만 변경
    const finalCodeActions: vscode.CodeAction[] = [];
    const seenActionKeys = new Set<string>(); // 최종 CodeAction 중복 제거를 위한 Set

    // ... (기존 코드 그대로 유지)

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
        // (문서 보기 액션) 기존 그대로 유지
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

      // 1) 기존 로직 기반 수정기 호출 (동기)
      const fixesFromDispatcher = dispatchRule(ruleContext);

      // 기존 dedupe + push (그대로 유지)
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

      // [ADD] 2) 로직 기반 결과가 없으면 → AI 기반 수정기 시도 (비동기)
      if (fixesFromDispatcher.length === 0) {
        try {
          const aiFixes = await dispatchAIRule(ruleContext); // ← 추가 호출
          aiFixes.forEach((fix) => {
            let fixKeyParts: string[] = [fix.title ?? "AI Fix", ruleId];
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
              if (!fix.diagnostics) fix.diagnostics = [];
              fix.diagnostics.push(diagnostic);
              finalCodeActions.push(fix);
              seenActionKeys.add(actionKey);
            }
          });
        } catch (e) {
          console.warn(`[AI Fix Error] ${ruleId}`, e);
        }
      }
    }

    return finalCodeActions;
  }
}


export function deactivate() {}