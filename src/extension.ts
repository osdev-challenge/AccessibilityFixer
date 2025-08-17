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
