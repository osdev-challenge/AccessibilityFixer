import * as vscode from 'vscode';
import { RuleContext } from '../types';

/**
 * 🔍 현재 Diagnostic 위치를 포함하는 정규식 매치를 문서 전체에서 탐색
 * - 문서 전체 텍스트를 검색하면서 pos(커서/진단 위치)가 포함된 매치를 반환
 * - 매치 범위(Range)와 정규식 결과(RegExpExecArray)를 함께 반환
 */
function findEnclosingMatch(
  document: vscode.TextDocument,
  pos: vscode.Position,
  regex: RegExp
): { range: vscode.Range; match: RegExpExecArray } | null {
  const text = document.getText();
  const offset = document.offsetAt(pos);
  regex.lastIndex = 0; // 안전: 매번 처음부터 실행

  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (start <= offset && offset <= end) {
      const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
      return { range, match: m };
    }
    // 무한 루프 방지: 정규식이 빈 문자열 매치 시 index를 강제로 증가
    if (regex.lastIndex === m.index) regex.lastIndex++;
  }
  return null;
}

/**
 * 1) 자기닫힘 헤딩 (<h1 ... />)을 찾아 → <h1 ...>빈제목</h1> 으로 교정
 * - HTML 스펙상 heading은 비어있으면 안 되므로 더미 텍스트를 채워 넣음
 */
export function fixSelfClosingHeading(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  // <hN ... /> 패턴 찾기
  const m = findEnclosingMatch(
    context.document,
    context.range.start,
    /<h([1-6])([^>]*?)\s*\/>/g
  );
  if (!m) return fixes;

  const [, lvl, attrs] = m.match;
  const replaced = `<h${lvl}${attrs}>빈제목</h${lvl}>`;

  const fix = new vscode.CodeAction('빈 heading 채우기(자기닫힘)', vscode.CodeActionKind.QuickFix);
  fix.isPreferred = true; // 대표 QuickFix
  const edit = new vscode.WorkspaceEdit();
  edit.replace(context.document.uri, m.range, replaced);
  fix.edit = edit;

  // 경고 메시지 추가
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
 * 2) 빈 쌍태그 헤딩 (<h1></h1> 또는 공백만 있는 경우) → <h1>빈제목</h1>
 */
export function fixEmptyPairHeading(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  // <hN ...></hN> (공백만 허용) 패턴 찾기
  const m = findEnclosingMatch(
    context.document,
    context.range.start,
    /<h([1-6])([^>]*?)>\s*<\/h\1>/g
  );
  if (!m) return fixes;

  const [, lvl, attrs] = m.match;
  const replaced = `<h${lvl}${attrs}>빈제목</h${lvl}>`;

  const fix = new vscode.CodeAction('빈 heading 채우기(빈 쌍태그)', vscode.CodeActionKind.QuickFix);
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
 * 3) <h1><span aria-hidden="true">...</span></h1>
 *    → 스크린리더에는 내용이 숨겨진 상태 (접근 가능한 이름 없음)
 *    → 자동 수정은 하지 않고 "경고만" 제공
 */
export function warnHiddenOnlyHeading(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  // aria-hidden="true"인 span만 포함된 heading 패턴
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

/**
 * ✨ 최종 Export: 세 가지 Fixer를 모두 실행
 * - 1) 자기닫힘 헤딩 교정
 * - 2) 빈 쌍태그 헤딩 교정
 * - 3) 숨김-only 헤딩 경고
 */
export function fixHeadingHasContentCombined(context: RuleContext): vscode.CodeAction[] {
  return [
    ...fixSelfClosingHeading(context),
    ...fixEmptyPairHeading(context),
    ...warnHiddenOnlyHeading(context),
  ];
}
