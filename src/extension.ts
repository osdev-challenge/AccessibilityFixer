/*   // 기존 코드 

import * as vscode from "vscode"; 
import { ESLint } from "eslint"; 
import * as path from "path"; 
import { dispatchRule } from "./ruleDispatcher"; 
import { RuleContext } from "./rules/types";


// ---- 여기를 extension.ts 상단 import들 아래에 추가 ----
function getRuleIdString(
  code: vscode.Diagnostic["code"] | null | undefined
): string | undefined {
  if (code == null) return undefined;

  // string | number
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);

  // VS Code 형식: { value: string | number, target?: Uri }
  const anyCode = code as any;
  if (typeof anyCode.value === "string" || typeof anyCode.value === "number") {
    return String(anyCode.value);
  }

  // 혹시 name 필드만 있는 경우까지 보수적으로 처리
  if (typeof anyCode.name === "string") return anyCode.name;

  return undefined;
}
// -------------------------------------------------------


class HtmlLintQuickFixProvider implements vscode.CodeActionProvider {
  async provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): Promise<vscode.CodeAction[]> {
    const finalCodeActions: vscode.CodeAction[] = [];
    const seenActionKeys = new Set<string>();

    // 중복 진단 제거
    const toKey = (d: vscode.Diagnostic) => {
      const r = d.range;
      const ruleId = getRuleIdString(d.code) ?? "unknown";
      return `${ruleId}-${r.start.line}:${r.start.character}-${r.end.line}:${r.end.character}-${d.message}`;
    };
    const uniqueContextDiagnostics: vscode.Diagnostic[] = [
      ...new Map(context.diagnostics.map(d => [toKey(d), d])).values(),
    ];

    for (const diagnostic of uniqueContextDiagnostics) {
      const diagnosticCodeString = getRuleIdString(diagnostic.code);
      if (!diagnosticCodeString) continue;

      const isA11y = diagnosticCodeString.startsWith("jsx-a11y");
      const isEslintDisableFix = diagnostic.message.includes("Disable");
      const isShowDocumentation = diagnostic.message.includes("Show documentation");

      if (!(isA11y && !isEslintDisableFix) && !isShowDocumentation) continue;

      const ruleId = diagnosticCodeString;

      // 문서 보기 액션
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
        const docKey = `doc-${ruleId}`;
        if (!seenActionKeys.has(docKey)) {
          finalCodeActions.push(showDocAction);
          seenActionKeys.add(docKey);
        }
        continue;
      }

      // 문제 코드/문맥 수집
      const problemText = document.getText(diagnostic.range);
      const fullLine = document.lineAt(diagnostic.range.start.line).text;
      const lineNumber = diagnostic.range.start.line + 1;

      const ruleContext: RuleContext = {
        ruleName: ruleId,
        code: problemText,
        fileCode: document.getText(),
        lineNumber,
        fullLine,
        range: diagnostic.range,
        document,
      };

      // 규칙 기반 픽서 호출
      // const fixesFromDispatcher: vscode.CodeAction[] = dispatchRule(ruleContext);
      const fixesFromDispatcher: vscode.CodeAction[] = await dispatchRule(ruleContext);

      // 액션 중복 방지하며 누적
      fixesFromDispatcher.forEach((fix: vscode.CodeAction) => {
        const keyParts: string[] = [fix.title ?? "", ruleId];

        if (fix.edit) {
          (fix.edit as vscode.WorkspaceEdit)
            .entries()
            .forEach(([uri, edits]: [vscode.Uri, vscode.TextEdit[]]) => {
              edits.forEach((edit: vscode.TextEdit) => {
                keyParts.push(
                  uri.fsPath,
                  `${edit.range.start.line}:${edit.range.start.character}`,
                  `${edit.range.end.line}:${edit.range.end.character}`,
                  edit.newText
                );
              });
            });
        }

        const actionKey = keyParts.join("|");
        if (!seenActionKeys.has(actionKey)) {
          if (!fix.diagnostics) fix.diagnostics = [];
          fix.diagnostics.push(diagnostic);
          finalCodeActions.push(fix);
          seenActionKeys.add(actionKey);
        }
      });

      // (필요시) 규칙 기반 결과가 전혀 없을 때 AI 경로를 별도 디스패처로 호출하도록 확장 가능
    }

    return finalCodeActions;
  }
}


*/



// 새로운 코드 

// src/extension.ts
import * as vscode from "vscode";
import { dispatchRule } from "./ruleDispatcher";
import { RuleContext } from "./rules/types";

/* ────────────────────────────────
   1) ruleId 추출/정규화 유틸
   ──────────────────────────────── */
function getRuleIdString(code: vscode.Diagnostic["code"] | null | undefined): string | undefined {
  if (code == null) return undefined;
  if (typeof code === "string") return code;                 // "jsx-a11y/aria-props"
  if (typeof code === "number") return String(code);         // 숫자 -> 문자열
  const anyCode = code as any;                                // { value?: string|number, target?: Uri, name?: string }
  if (typeof anyCode?.value === "string" || typeof anyCode?.value === "number") {
    return String(anyCode.value);
  }
  if (typeof anyCode?.name === "string") return anyCode.name;
  return undefined;
}

function normalizeA11yRuleId(raw: string): string {
  return raw.startsWith("jsx-a11y/") ? raw : `jsx-a11y/${raw}`;
}

/* ────────────────────────────────
   2) Quick Fix Provider
   ──────────────────────────────── */
class A11yCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly kind = [vscode.CodeActionKind.QuickFix];

  async provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): Promise<vscode.CodeAction[]> {

    console.log("[provider] invoked on", document.uri.fsPath, "diags:", context.diagnostics.length);


    const finalActions: vscode.CodeAction[] = [];
    const seenKeys = new Set<string>();

    // 진단 로그 (디버깅에 유용)
    console.log("[provider] diagnostics:",
      context.diagnostics.map(d => ({
        src: d.source, code: d.code, msg: d.message,
        range: `${d.range.start.line}:${d.range.start.character}-${d.range.end.line}:${d.range.end.character}`
      }))
    );

    // 동일 진단 중복 제거
    const makeDiagKey = (d: vscode.Diagnostic) => {
      const ruleId = getRuleIdString(d.code) ?? "unknown";
      const r = d.range;
      return `${ruleId}|${r.start.line}:${r.start.character}-${r.end.line}:${r.end.character}|${d.message}`;
    };
    const uniqueDiagnostics = [...new Map(context.diagnostics.map(d => [makeDiagKey(d), d])).values()];

    for (const d of uniqueDiagnostics) {
      // ESLint source만 처리
      if (d.source !== "eslint") continue;

      const rawId = getRuleIdString(d.code);
      if (!rawId) continue;

      // jsx-a11y 규칙만 처리
      const isA11y = rawId.startsWith("jsx-a11y") || rawId.startsWith("aria-");
      if (!isA11y) continue;

      const ruleId = normalizeA11yRuleId(rawId);
      console.log("[provider] picked a11y rule:", ruleId, "| msg:", d.message);

      // 문제 코드/문맥 수집
      const problemText = document.getText(d.range);
      const fullLine = document.lineAt(d.range.start.line).text;
      const lineNumber = d.range.start.line + 1;

      const ruleContext: RuleContext = {
        ruleName: ruleId,
        code: problemText,
        fileCode: document.getText(),
        lineNumber,
        fullLine,
        range: d.range,
        document
      };

      // 규칙별 수정 로직 호출
      const actionsFromRule = await dispatchRule(ruleContext);

      // 중복 방지하며 누적
      for (const fix of actionsFromRule) {
        const keyParts: string[] = [fix.title ?? "", ruleId];

        if (fix.edit) {
          // 편집 내용까지 키에 포함시켜 동일 액션 중복 방지
          (fix.edit as vscode.WorkspaceEdit).entries().forEach(([uri, edits]) => {
            for (const e of edits) {
              keyParts.push(
                uri.fsPath,
                `${e.range.start.line}:${e.range.start.character}`,
                `${e.range.end.line}:${e.range.end.character}`,
                e.newText
              );
            }
          });
        } else if (fix.command) {
          keyParts.push("cmd", fix.command.command, JSON.stringify(fix.command.arguments ?? []));
        }

        const dedupKey = keyParts.join("|");
        if (!seenKeys.has(dedupKey)) {
          if (!fix.diagnostics) fix.diagnostics = [];
          fix.diagnostics.push(d); // 이 액션이 어떤 진단을 해결하는지 연결
          finalActions.push(fix);
          seenKeys.add(dedupKey);
        }
      }
    }

    return finalActions;
  }
}

/* ────────────────────────────────
   3) 활성화/등록
   ──────────────────────────────── */
export function activate(context: vscode.ExtensionContext) {
  console.log("[a11y-fixer] activating…");

  const selector: vscode.DocumentSelector = [
    { language: "javascriptreact" },
    { language: "typescriptreact" },
  ];

  const provider = new A11yCodeActionProvider();
  const reg = vscode.languages.registerCodeActionsProvider(
    selector,
    provider,
    { providedCodeActionKinds: A11yCodeActionProvider.kind }
  );

  context.subscriptions.push(reg);
  console.log("[a11y-fixer] CodeActionProvider registered.");
}

export function deactivate() {
  console.log("[a11y-fixer] deactivated.");
}
