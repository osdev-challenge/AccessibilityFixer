import * as vscode from "vscode";
import { RuleContext } from "../types";
import {
  stripAllLangAttrs,
  injectLang,
  normalizeBCP47,
  resolveDefaultHtmlLang,
} from "../../utils/htmllang";

/**
 * <html> 태그의 lang 속성을 정리하고, 사용자 환경/설정에 맞게 주입.
 * - 우선순위: workspace 설정(webA11yFixer.defaultLang) → vscode.env.language → 'en'
 * - Quick Fix 2개 제공:
 *   1) 자동 설정(위 우선순위 반영)
 *   2) "다른 언어로 설정…" (QuickPick으로 직접 선택)
 *
 * 참고: 대문자 <Html> 컴포넌트는 제외(소문자 html만 처리)
 */
export function fixHtmlHasLang(context: RuleContext): vscode.CodeAction[] {
  const actions: vscode.CodeAction[] = [];
  const { document, range } = context;

  // 0) 언어 결정 (유틸 사용)
  const resolvedLang = resolveDefaultHtmlLang();

  // 1) 교체 대상 텍스트/범위 결정
  let textToFix = context.code ?? "";
  let replaceRange = range;

  const ensureLineRange = () => {
    const line = range.start.line;
    const lineText = document.lineAt(line).text;
    replaceRange = new vscode.Range(
      new vscode.Position(line, 0),
      new vscode.Position(line, lineText.length)
    );
  };

  // code에 <html>이 없다면 fullLine로 시도
  if (!/<html\b/.test(textToFix) && context.fullLine) {
    textToFix = context.fullLine;
    ensureLineRange();
  }

  // 소문자 html이 없으면 종료
  if (!/<html\b/.test(textToFix)) return [];

  // 2) 기존 lang 속성 제거 → 선택한 lang 삽입
  const fixedAuto = injectLang(stripAllLangAttrs(textToFix), resolvedLang);
  if (fixedAuto !== textToFix) {
    const fixAuto = new vscode.CodeAction(
      `<html> lang="${resolvedLang}" 설정`,
      vscode.CodeActionKind.QuickFix
    );
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, replaceRange, fixedAuto);
    fixAuto.edit = edit;
    fixAuto.isPreferred = true;
    actions.push(fixAuto);
  }

  // 3) "다른 언어로 설정…" 액션 (명령 실행)
  const fixPick = new vscode.CodeAction(
    `다른 언어로 설정…`,
    vscode.CodeActionKind.QuickFix
  );
  fixPick.command = {
    title: "Pick lang",
    command: "a11yFix.pickHtmlLang", // ※ extension.ts에 등록 필요
    arguments: [
      {
        uri: document.uri,
        range: replaceRange,
        original: textToFix,
      },
    ],
  };
  actions.push(fixPick);

  return actions;
}
