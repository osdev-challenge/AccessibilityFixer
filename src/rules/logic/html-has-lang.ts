// src/rules/logic/html-has-lang/html-has-lang.ts
import * as vscode from "vscode";
import { RuleContext } from "../types";

/**
 * <html> 태그에서 기존 lang 속성(빈 값/중복/임의 값 포함)을 모두 제거하고
 * lang="ko" 하나만 깔끔하게 주입한다.
 * - code에 <html> 없으면 fullLine로 fallback
 * - 대문자 <Html> 컴포넌트는 제외(소문자 html만 처리)
 */
export function fixHtmlHasLang(context: RuleContext): vscode.CodeAction[] {
  const actions: vscode.CodeAction[] = [];
  const { document, range } = context;

  // 기본 언어 (설정으로 바꾸고 싶으면 webA11yFixer.defaultLang 활용)
  const defaultLang = "ko";

  // 현재 교체 대상 텍스트 결정: 우선 code, 없다면 한 줄 전체
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

  // 현재 code에 <html …>가 없으면 한 줄 전체에서 시도
  if (!/<html\b/.test(textToFix) && context.fullLine) {
    textToFix = context.fullLine;
    ensureLineRange();
  }

  // 소문자 <html>이 없으면 스킵(대문자 <Html> 컴포넌트는 제외)
  if (!/<html\b/.test(textToFix)) return [];

  // 1) 태그 내부의 lang 속성(값 무관/빈 값/표현식 포함) 전부 제거
  //    예: lang="", lang={'  '}, lang={`ko`}, lang={expr}, lang=ko 등
  const stripAllLangAttrs = (tag: string) =>
    tag.replace(
      /\s+\blang\b\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+)/g,
      ""
    );

  // 2) lang="ko" 주입 (태그에 속성이 없어도 안전)
  const injectDefaultLang = (tag: string) =>
    tag.replace(
      /^<html\b([^>]*)>/,
      (_all, attrs) => {
        const trimmed = (attrs || "").replace(/\s+/g, " ").trim();
        return trimmed
          ? `<html lang="${defaultLang}" ${trimmed}>`
          : `<html lang="${defaultLang}">`;
      }
    );

  // 3) 실제 변환 수행
  const fixed = injectDefaultLang(stripAllLangAttrs(textToFix));

  if (fixed === textToFix) return [];

  const fix = new vscode.CodeAction(
    `<html> lang="${defaultLang}" 재설정`,
    vscode.CodeActionKind.QuickFix
  );
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, replaceRange, fixed);
  fix.edit = edit;
  fix.isPreferred = true;
  fix.diagnostics = [
    new vscode.Diagnostic(
      replaceRange,
      `<html>의 기존 lang 속성을 정리하고 lang="${defaultLang}"로 재설정했습니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];

  actions.push(fix);
  return actions;
}
