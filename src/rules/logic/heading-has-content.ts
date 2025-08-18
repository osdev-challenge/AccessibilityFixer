import * as vscode from 'vscode';
import { RuleContext } from '../types';

/** 현재 diagnostic 위치를 포함하는 정규식 매치를 문서 전체에서 찾아 Range 반환 */
function findEnclosingMatch(
  document: vscode.TextDocument,
  pos: vscode.Position,
  regex: RegExp
): { range: vscode.Range; match: RegExpExecArray } | null {
  const text = document.getText();
  const offset = document.offsetAt(pos);
  regex.lastIndex = 0; // 안전

  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (start <= offset && offset <= end) {
      const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
      return { range, match: m };
    }
    // 무한루프 방지: 빈 매치 회피
    if (regex.lastIndex === m.index) regex.lastIndex++;
  }
  return null;
}

/**
 * 1) <hN ... />  -> <hN ...>빈제목</hN>
 */
export function fixSelfClosingHeading(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  // 문서 전체에서, 커서(진단 위치)를 포함하는 자기닫힘 헤딩을 찾는다
  const m = findEnclosingMatch(
    context.document,
    context.range.start,
    /<h([1-6])([^>]*?)\s*\/>/g
  );
  if (!m) return fixes;

  const [, lvl, attrs] = m.match;
  const replaced = `<h${lvl}${attrs}>빈제목</h${lvl}>`;

  const fix = new vscode.CodeAction('빈 heading 채우기(자기닫힘)', vscode.CodeActionKind.QuickFix);
  fix.isPreferred = true; // 대표 액션 하나만
  const edit = new vscode.WorkspaceEdit();
  edit.replace(context.document.uri, m.range, replaced);
  fix.edit = edit;
  fix.diagnostics = [
    new vscode.Diagnostic(
      m.range,
      '<h1> ~ <h6> 태그는 비어 있을 수 없습니다. 텍스트를 추가하세요.',
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);
  return fixes;
}

/**
 * 2) <hN ...></hN> (공백만) -> <hN ...>빈제목</hN>
 */
export function fixEmptyPairHeading(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const m = findEnclosingMatch(
    context.document,
    context.range.start,
    /<h([1-6])([^>]*?)>\s*<\/h\1>/g
  );
  if (!m) return fixes;

  const [, lvl, attrs] = m.match;
  const replaced = `<h${lvl}${attrs}>빈제목</h${lvl}>`;

  const fix = new vscode.CodeAction('빈 heading 채우기(빈 쌍태그)', vscode.CodeActionKind.QuickFix);
  // isPreferred 설정 안 함(하나만 true 권장)
  const edit = new vscode.WorkspaceEdit();
  edit.replace(context.document.uri, m.range, replaced);
  fix.edit = edit;
  fix.diagnostics = [
    new vscode.Diagnostic(
      m.range,
      '<h1> ~ <h6> 태그는 비어 있을 수 없습니다. 텍스트를 추가하세요.',
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);
  return fixes;
}

/**
 * 3) <hN><span aria-hidden="true">…</span></hN> -> 경고만 (자동수정 없음)
 */
export function warnHiddenOnlyHeading(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const m = findEnclosingMatch(
    context.document,
    context.range.start,
    /<h([1-6])([^>]*?)>(\s*)<span[^>]*\saria-hidden=["']true["'][^>]*>[\s\S]*?<\/span>\s*<\/h\1>/g
  );
  if (!m) return fixes;

  const warn = new vscode.CodeAction(
    '헤딩 내용이 스크린리더에 숨겨져 있습니다(자동수정 없음)',
    vscode.CodeActionKind.Empty
  );
  warn.diagnostics = [
    new vscode.Diagnostic(
      m.range,
      '헤딩의 접근 가능한 이름이 없습니다. 시각적으로 숨긴 텍스트나 aria-label을 고려하세요.',
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(warn);
  return fixes;
}

/** 필요하면: 세 fixer를 한 번에 실행해 합쳐 반환 */
export function fixHeadingHasContentCombined(context: RuleContext): vscode.CodeAction[] {
  return [
    ...fixSelfClosingHeading(context),
    ...fixEmptyPairHeading(context),
    ...warnHiddenOnlyHeading(context),
  ];
}
