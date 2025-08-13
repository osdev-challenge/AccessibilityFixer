// src/extension.ts
<<<<<<< HEAD

=======
>>>>>>> e05bbed (feat(aria-role): 파이프라인 활용 코드 생성(refs #이슈번호))
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

// ▼ JSX 요소 전체 범위로 확장에 필요한 AST 유틸
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

// ▼ 우리 디스패처/타입
import { getFixer } from "./ruleDispatcher";
import { RuleContext as FixRuleContext } from "./rules/types";

/** 규칙 ID 정규화: "jsx-a11y/aria-role" -> "aria-role" */
function normalizeRuleId(ruleIdFull: string): string {
  return ruleIdFull.replace(/^jsx-a11y\//, "");
}

/** diagnostic.range 를 감싸는 가장 가까운 JSXElement 전체 범위로 확장 */
// ✅ 기존 expandRangeToJsxElement 를 이 버전으로 교체
function expandRangeToJsxElement(
  document: vscode.TextDocument,
  original: vscode.Range
): vscode.Range {
  try {
    const code = document.getText();
    const startOffset = document.offsetAt(original.start);
    const endOffset = document.offsetAt(original.end);

    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      // Babel은 기본적으로 node.start/node.end를 제공합니다.
    });

    // ✅ 객체 대신 숫자 두 개로만 추적
    let bestStart: number | null = null;
    let bestEnd: number | null = null;

    traverse(ast, {
      JSXElement(path) {
        const n = path.node;
        const s = typeof n.start === "number" ? n.start : null;
        const e = typeof n.end === "number" ? n.end : null;
        if (
          s !== null &&
          e !== null &&
          s <= startOffset &&
          endOffset <= e
        ) {
          // 더 안쪽(짧은) 요소를 택함
          if (
            bestStart === null ||
            bestEnd === null ||
            (e - s) < (bestEnd - bestStart)
          ) {
            bestStart = s;
            bestEnd = e;
          }
        }
      },
    });

    if (bestStart !== null && bestEnd !== null) {
      const startPos = document.positionAt(bestStart);
      const endPos = document.positionAt(bestEnd);
      return new vscode.Range(startPos, endPos);
    }
  } catch (e) {
    console.warn("[expandRangeToJsxElement] fallback to original range:", e);
  }
  return original;
}


export function activate(context: vscode.ExtensionContext) {
<<<<<<< HEAD
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("jsx-a11y");
  context.subscriptions.push(diagnosticCollection);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.scheme === "file") {
      lintDocument(event.document);
    }
  });
=======
  // 문서 열기/저장 시 ESLint 실행
>>>>>>> e05bbed (feat(aria-role): 파이프라인 활용 코드 생성(refs #이슈번호))
  vscode.workspace.onDidSaveTextDocument(lintDocument);
  vscode.workspace.onDidOpenTextDocument(lintDocument);

  // Quick Fix 제공자 등록
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "typescript" },
        { scheme: "file", language: "typescriptreact" },
      ],
      new HtmlLintQuickFixProvider(),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    )
  );

  // 👉 Quick Fix가 실제 수정을 적용하는 명령
  const aiFixCmd = vscode.commands.registerCommand(
    "a11yFix.aiFix",
    async (rc: FixRuleContext) => {
      try {
        const fixer = getFixer(rc.ruleName);
        if (!fixer) {
          vscode.window.showWarningMessage(
            `[web-a11y-fixer] No fixer for rule: ${rc.ruleName}`
          );
          return;
        }
        const fixedCode = await fixer(rc);
        if (!fixedCode || fixedCode === rc.code) {
          vscode.window.showInformationMessage(
            `[web-a11y-fixer] No change for: ${rc.ruleName}`
          );
          return;
        }
        const edit = new vscode.WorkspaceEdit();
        edit.replace(rc.document.uri, rc.range, fixedCode); // ✅ 확장된 범위 통째 교체
        await vscode.workspace.applyEdit(edit);
      } catch (e: any) {
        vscode.window.showErrorMessage(
          `[web-a11y-fixer] Fix failed: ${e?.message || e}`
        );
      }
    }
  );
  context.subscriptions.push(aiFixCmd);

  // 내부: ESLint 실행해 Diagnostics 생성
  async function lintDocument(document: vscode.TextDocument) {
<<<<<<< HEAD
    if (lintTimeout) {
      clearTimeout(lintTimeout);
    }
    lintTimeout = setTimeout(async () => {
      // 기존 진단(문제)을 함수 시작 부분에서 먼저 삭제
      diagnosticCollection.delete(document.uri);

      const filePath = document.uri.fsPath;
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const configFilePath = path.resolve(__dirname, "..", "eslint.config.mjs");
=======
    const filePath = document.uri.fsPath;
    const supported = new Set([
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
    ]);
    if (!supported.has(document.languageId)) return;
>>>>>>> e05bbed (feat(aria-role): 파이프라인 활용 코드 생성(refs #이슈번호))

      const supportedLanguages = [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
      ];

      if (!supportedLanguages.includes(document.languageId)) return;

<<<<<<< HEAD
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
=======
    try {
      const results = await eslint.lintText(document.getText(), { filePath });

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
          diagnostic.code = msg.ruleId ?? undefined;
          diagnostics.push(diagnostic);

          const line = lines[msg.line - 1] ?? "";
          console.log(
            `❌ ESLint: ${msg.message} (${msg.ruleId ?? "unknown"}) at ${filePath}:${msg.line}:${msg.column}`
          );
          console.log(`   ⤷ ${line}`);
>>>>>>> e05bbed (feat(aria-role): 파이프라인 활용 코드 생성(refs #이슈번호))
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
  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
<<<<<<< HEAD
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
=======
    return context.diagnostics
      .filter((d) => (d.code ?? "").toString().startsWith("jsx-a11y"))
      .map((diagnostic) => {
        const ruleIdFull = String(diagnostic.code || "");
        const ruleName = normalizeRuleId(ruleIdFull);

        // ✅ 2) 교체 범위를 JSX 요소 전체로 확장
        const targetRange = expandRangeToJsxElement(document, diagnostic.range);

        // ✅ 1) AI/로직에 전달할 코드도 요소 전체로
        const rc: FixRuleContext = {
          ruleName,
          code: document.getText(targetRange),
          fileCode: document.getText(),
          lineNumber: targetRange.start.line, // 0-based
          fullLine: document.lineAt(targetRange.start.line).text,
          range: targetRange,
          document,
        };

        const fix = new vscode.CodeAction(
          `🛠 Fix with AI: ${ruleIdFull}`,
          vscode.CodeActionKind.QuickFix
        );
        // ✅ 3) 명령에 확장된 범위/코드를 그대로 넘긴다
        fix.command = {
          title: `Apply AI fix for ${ruleIdFull}`,
          command: "a11yFix.aiFix",
          arguments: [rc],
        };
        fix.diagnostics = [diagnostic];
        fix.isPreferred = true;

        return fix;
>>>>>>> e05bbed (feat(aria-role): 파이프라인 활용 코드 생성(refs #이슈번호))
      });

      const fixesFromDispatcher = dispatchRule(ruleContext);

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

export function deactivate() {}
