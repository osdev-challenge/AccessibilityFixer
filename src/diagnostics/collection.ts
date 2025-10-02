import * as vscode from "vscode";

// 프로젝트 전역에서 단 하나만 쓰는 DiagnosticCollection
export const a11yDiagnosticCollection =
  vscode.languages.createDiagnosticCollection("a11y");
