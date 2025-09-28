import * as vscode from "vscode";
import * as path from "path";
import { ESLint } from "eslint";
import type { Linter } from "eslint";
import { a11yDiagnosticCollection } from "../diagnostics/collection";
import { dispatchRule } from "../ruleDispatcher"; 
import type { RuleContext } from "../rules/types";       
import * as fs from "fs";

type CacheEntry = {
  version: number;
  diagnostics: vscode.Diagnostic[]; //진단
  codeActions: vscode.CodeAction[]; //퀵픽스
};

export class LintManager {
  private eslint: ESLint;
  private cache = new Map<string, CacheEntry>();
  private pending = new Map<string, { cts: vscode.CancellationTokenSource; timer?: NodeJS.Timeout }>();
  private debounceMs = 350; // 디바운스 시간 설정
  private workspaceRoot: string;

  constructor(opts: { eslint?: ESLint; workspaceRoot?: string } = {}) {
    this.eslint = opts.eslint ?? new ESLint({});
    this.workspaceRoot = opts.workspaceRoot ?? (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd());
  }

  //문서 변경 하는 거 타이밍 조절
  schedule(doc: vscode.TextDocument) {
    if (!this.isLintTarget(doc)) return;
    const key = doc.uri.toString();

    const prev = this.pending.get(key); // 이전에 쌓인 것들 취소
    if (prev) {
      prev.cts.cancel();
      if (prev.timer) clearTimeout(prev.timer);
    }
    const cts = new vscode.CancellationTokenSource();
    const timer = setTimeout(() => this.run(doc, cts.token).catch(console.error), this.debounceMs);
    this.pending.set(key, { cts, timer });
  }

  // 캐시 가져오기
  getCached(doc: vscode.TextDocument) {
    return this.cache.get(doc.uri.toString());
  }

  // 퀵픽스 후 바로 반영시키기
  optimisticClear(doc: vscode.TextDocument, predicate: (d: vscode.Diagnostic)=>boolean) {
    const key = doc.uri.toString();
    const c = this.cache.get(key);
    if (!c) return;
    const left = c.diagnostics.filter(d => !predicate(d));
    a11yDiagnosticCollection.set(doc.uri, left);
    this.cache.set(key, { ...c, diagnostics: left });
  }

  //elsint 실행
  private async run(doc: vscode.TextDocument, token: vscode.CancellationToken) {
  const key = doc.uri.toString();
  this.pending.delete(key);

  const startedVersion = doc.version;

  // 워크스페이스 설정 빼오기
  const ws = vscode.workspace.getWorkspaceFolder(doc.uri);
  const cwdFromWs = ws?.uri.fsPath;
  const cwd =
    cwdFromWs ??
    (doc.uri.scheme === "untitled"
      ? (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd())
      : path.dirname(doc.fileName));

  const configPath = path.join(cwd, "eslint.config.mjs");
  const eslintOpts: ESLint.Options = { cwd };
  if (fs.existsSync(configPath)) {
    eslintOpts.overrideConfigFile = configPath;
  } else {
    console.warn(`[A11yFix] eslint.config.mjs not found in ${cwd}; using ESLint auto-resolve`);
  }

  const eslint = new ESLint(eslintOpts);

  const filePath =
    doc.uri.scheme === "file" ? doc.fileName : path.join(cwd, "untitled.jsx");

  // 실행 및 성능 로그
  const t0 = performance.now();
  console.log(`[LINT] cwd=${cwd} file=${filePath}`);
  const results = await eslint.lintText(doc.getText(), { filePath });
  const elapsed = (performance.now() - t0).toFixed(1);

  if (token.isCancellationRequested) return;
  const result = results[0];
  if (!result) return;

  // 오래된 결과 폐기
  if (doc.version !== startedVersion) {
    console.log(`[LINT] drop stale v${startedVersion} -> v${doc.version}`);
    return;
  }

  //진단, 퀵픽스 생성
  const diagnostics = this.toDiagnostics(result.messages, doc);
  const codeActions = await this.buildCodeActions(doc, diagnostics);

  //최종 반영
  a11yDiagnosticCollection.set(doc.uri, diagnostics);
  this.cache.set(key, { version: doc.version, diagnostics, codeActions });

  console.log(`[LINT] done diag=${diagnostics.length} actions=${codeActions.length} in ${elapsed}ms`);
}

  // 진단을 퀵픽스로 변환
  private async buildCodeActions(doc: vscode.TextDocument,diagnostics: vscode.Diagnostic[]): Promise<vscode.CodeAction[]> {
  const actions: vscode.CodeAction[] = [];

  for (const d of diagnostics) { //진단 1개씩 처리
    const ruleName = String((d as any).code ?? "unknown");

    const problemText = doc.getText(d.range);
    const startLine = d.range.start.line;
    const fullLine = doc.lineAt(startLine).text;
    const lineNumber = startLine + 1;

    const ctx: RuleContext = {
      ruleName,
      code: problemText,
      fileCode: doc.getText(),
      lineNumber,
      fullLine,
      range: d.range,
      document: doc,
    } as any;

    try {
      const ruleActions = await dispatchRule(ctx);

      for (const a of ruleActions) {
        a.kind = vscode.CodeActionKind.QuickFix;
        a.diagnostics = [d];
        if (!a.title.startsWith("[A11y Fix]")) {
          a.title = `[A11y Fix] ${a.title}`;
        }
        actions.push(a);
      }
    } catch (e) {
      console.warn(`[A11y] actions failed for ${ruleName}`, e);
    }
  }

  return actions;
}

  //eslint 메시지 -> 진단으로 변환
  private toDiagnostics(messages: Linter.LintMessage[], doc: vscode.TextDocument) {
    const out: vscode.Diagnostic[] = [];
    for (const m of messages) {
      const sl = Math.max(0, (m.line ?? 1) - 1);
      const sc = Math.max(0, (m.column ?? 1) - 1);
      const el = Math.max(sl, (m.endLine ?? m.line ?? sl + 1) - 1);
      const ec = Math.max(sc, (m.endColumn ?? m.column ?? sc + 1) - 1);
      const range = new vscode.Range(sl, sc, el, ec);
      const sev =
        m.severity === 2 ? vscode.DiagnosticSeverity.Error :
        m.severity === 1 ? vscode.DiagnosticSeverity.Warning :
        vscode.DiagnosticSeverity.Information;
      const d = new vscode.Diagnostic(range, m.message, sev);
      (d as any).code = m.ruleId ?? "unknown";
      d.source = "eslint";
      out.push(d);
    }
    return out;
  }

  // 린트 대상 파일 필터링하는 것
  private isLintTarget(doc: vscode.TextDocument) {
    const f = doc.fileName.toLowerCase();
    return ["javascript","typescript"].includes(doc.languageId) ||
           /\.(jsx|tsx)$/.test(f);
  }

  // 가짜파일거르기
  private toFilePath(doc: vscode.TextDocument) {
    if (doc.uri.scheme === "untitled") {
      const base = doc.languageId.includes("typescript") ? "untitled.tsx" : "untitled.jsx";
      return path.join(this.workspaceRoot, ".virtual", base);
    }
    return doc.fileName;
  }
}
