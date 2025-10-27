import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../types";

export const labelHasAssociatedControlFix: RuleFixer = (
  context: RuleContext
): vscode.CodeAction[] => {
  const { code, range, document, fullLine } = context;
  const fixes: vscode.CodeAction[] = [];

  // 1) 현재 라벨 태그(열리는 태그) 가져오기
  const labelMatch = code.match(/<label\b([^>]*)>/i);
  if (!labelMatch) {
    // 라벨 패턴을 찾지 못하면 종료
    return [];
  }
  const labelOpenTag = labelMatch[0]; // e.g. <label> or <label class="...">
  const labelAttrs = labelMatch[1] || ""; // 속성 문자열

  // 2) 이미 htmlFor / for 속성이 있으면 수정 제안 불필요
  if (/\bhtmlFor\s*=|\bfor\s*=/.test(labelAttrs)) {
    return [];
  }

  // 3) 라벨과 연결된 input id를 찾기 — 현재 줄을 기준으로 아래/위로 탐색
  const startLine = range.start.line;
  const maxLookahead = 10; // 검색할 라인 수(요구에 따라 늘릴수 있음)
  let foundId: string | null = null;

  // 우선 현재 라인(또는 fullLine)에 id가 있는지 확인
  const idInFullLine = fullLine.match(/id\s*=\s*["']([^"']+)["']/);
  if (idInFullLine) {
    foundId = idInFullLine[1];
  }

  // 아래쪽으로 탐색
  if (!foundId) {
    for (let i = startLine; i <= Math.min(document.lineCount - 1, startLine + maxLookahead); i++) {
      const text = document.lineAt(i).text;
      const m = text.match(/id\s*=\s*["']([^"']+)["']/);
      if (m) {
        foundId = m[1];
        break;
      }
    }
  }

  // 위쪽으로 탐색 (아래에서 못 찾았을 때)
  if (!foundId) {
    for (let i = startLine - 1; i >= Math.max(0, startLine - maxLookahead); i--) {
      const text = document.lineAt(i).text;
      const m = text.match(/id\s*=\s*["']([^"']+)["']/);
      if (m) {
        foundId = m[1];
        break;
      }
    }
  }

  if (!foundId) {
    // 가까운 라인에서 id를 찾지 못하면 제안하지 않음
    return [];
  }

  // 4) 치환: 기존 attrs를 보존하고 htmlFor 속성 추가
  // labelOpenTag 예시: "<label>" or "<label class=\"x\">"
  // 새 오프닝 태그를 안전하게 생성
  // 공백 처리: 만약 attrs가 비어있으면 한 칸 띄우지 않음
  const attrsPart = labelAttrs.trim();
  const newLabelOpenTag = attrsPart.length > 0
    ? `<label ${attrsPart} htmlFor="${foundId}">`
    : `<label htmlFor="${foundId}">`;

  // code 문자열 내에서 첫 번째 라벨 오프닝 태그를 대체
  const fixedCode = code.replace(labelOpenTag, newLabelOpenTag);

  // 5) CodeAction 생성
  const fixFor = new vscode.CodeAction(
    `input id와 연결 (htmlFor="${foundId}")`,
    vscode.CodeActionKind.QuickFix
  );
  fixFor.edit = new vscode.WorkspaceEdit();
  fixFor.edit.replace(document.uri, range, fixedCode);
  fixFor.isPreferred = true;

  fixFor.diagnostics = [
    new vscode.Diagnostic(
      range,
      `label의 htmlFor 속성을 input의 id("${foundId}")와 연결하여 접근성을 향상시킵니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];

  fixes.push(fixFor);
  return fixes;
};
