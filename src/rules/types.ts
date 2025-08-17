// 규칙 처리 함수 타입 등 공통 타입 정의

import * as vscode from "vscode";

/**
 * ESLint 규칙 위반 시 전달되는 컨텍스트 객체 인터페이스
 */
export interface RuleContext {
  ruleName: string; // 위반된 ESLint 규칙 ID (예: "jsx-a11y/alt-text")
  code: string; // 문제가 발생한 특정 코드 스니펫 문자열
  fileCode: string; // 현재 파일의 전체 코드 내용
  lineNumber: number; // 문제가 발생한 코드의 시작 줄 번호 (0-based)
  fullLine: string; // 문제가 발생한 전체 줄의 내용
  range: vscode.Range; // VS Code에서 문제의 정확한 시작 및 끝 위치
  document: vscode.TextDocument; // 현재 활성화된 VS Code 문서 객체
}

/**
 * 각 규칙별 수정 로직 함수의 타입 정의
 * RuleContext를 인수로 받아 vscode.CodeAction 배열을 반환합니다.
 */
export type RuleFixer = (context: RuleContext) => vscode.CodeAction[];
