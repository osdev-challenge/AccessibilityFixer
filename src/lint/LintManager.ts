import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { pathToFileURL } from "url";
import Module from "module";
import { ESLint } from "eslint";
import type { Linter } from "eslint";
import { a11yDiagnosticCollection } from "../diagnostics/collection";
import { dispatchRule } from "../ruleDispatcher";
import type { RuleContext } from "../rules/types";

type CacheEntry = {
  version: number;
  diagnostics: vscode.Diagnostic[];
  codeActions: vscode.CodeAction[];
};

function findFlatConfigPath(cwd: string): string | undefined {
  for (const name of ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs"]) {
    const p = path.join(cwd, name);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function findInternalFlatConfigPath(): string | undefined {
  const base = path.resolve(__dirname, "../../");
  for (const name of ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs"]) {
    const p = path.join(base, name);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export class LintManager {
  private cache = new Map<string, CacheEntry>(); // 파일별 진단 캐시
  private pending = new Map<string, { cts: vscode.CancellationTokenSource; timer?: NodeJS.Timeout }>();
  private debounceMs = 350; // 입력 후 lint 지연시간 
  private workspaceRoot: string;

  constructor(opts: { workspaceRoot?: string } = {}) {
    this.workspaceRoot =
      opts.workspaceRoot ??
      (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd());
  }

  /** 편집 중인 문서를 lint 스케줄링 */
  schedule(doc: vscode.TextDocument) {
    if (!this.isLintTarget(doc)) return;
    const key = doc.uri.toString();

    // 이전 실행이 있다면 취소
    const prev = this.pending.get(key);
    if (prev) {
      prev.cts.cancel();
      if (prev.timer) clearTimeout(prev.timer);
    }

    // 일정 시간 후 lint 실행
    const cts = new vscode.CancellationTokenSource();
    const timer = setTimeout(() => this.run(doc, cts.token).catch(console.error), this.debounceMs);
    this.pending.set(key, { cts, timer });
  }

  /** 캐시된 진단 반환 */
  getCached(doc: vscode.TextDocument) {
    return this.cache.get(doc.uri.toString());
  }

  /** 진단 일부 제거 (예: 수정 시 optimistic clear) */
  optimisticClear(doc: vscode.TextDocument, predicate: (d: vscode.Diagnostic) => boolean) {
    const key = doc.uri.toString();
    const c = this.cache.get(key);
    if (!c) return;
    const left = c.diagnostics.filter(d => !predicate(d));
    a11yDiagnosticCollection.set(doc.uri, left);
    this.cache.set(key, { ...c, diagnostics: left });
  }

  // LintManager 클래스 안에 추가
  private async loadJsxA11yPlugin() {
    const id = require.resolve("eslint-plugin-jsx-a11y", { paths: [__dirname] });
    try {
      const m = await import(pathToFileURL(id).href); // ESM 우선
      return (m as any).default ?? m;
    } catch {
      const cjs = require(id);
      return cjs.default ?? cjs;
    }
  }

 /** 실제 Lint 실행 */
private async run(doc: vscode.TextDocument, token: vscode.CancellationToken) {
  const key = doc.uri.toString();
  this.pending.delete(key);
  const startedVersion = doc.version;

  // 현재 작업 디렉터리 결정
  const ws = vscode.workspace.getWorkspaceFolder(doc.uri);
  let cwd =
    ws?.uri.fsPath ??
    (doc.uri.scheme === "untitled"
      ? (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd())
      : path.dirname(doc.fileName));
  console.log("[RUN] cwd:", cwd);

  // filePath 계산 + untitled면 .virtual 디렉터리 보장
  const filePath = this.toFilePath(doc);
  if (doc.uri.scheme === "untitled") {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!ws) cwd = dir; // 워크스페이스 없으면 보정
  }
  console.log("[RUN] filePath:", filePath);

  // eslint 설정 경로 (3종 모두 탐색)
  const userConfigPath = findFlatConfigPath(cwd);
  const internalConfigPath = findInternalFlatConfigPath();
  console.log("[RUN] has user config?", !!userConfigPath);

  // eslint 인스턴스 생성
  let eslint: ESLint;
  const jsxA11y = await this.loadJsxA11yPlugin(); // 플러그인 "객체"

  // 사용자 config
  if (userConfigPath) {
    try {
      const userModule = await import(pathToFileURL(userConfigPath).href);
      let userConfig = userModule.default ?? userModule;
      const userList = Array.isArray(userConfig) ? userConfig : [userConfig];

      const hasA11y = userList.some(cfg => this.hasA11yRules(cfg));

      if (hasA11y) {
        // plugins에 객체 보강
        const patched = userList.map(cfg => ({
          ...cfg,
          plugins: { ...(cfg.plugins ?? {}), "jsx-a11y": (cfg.plugins?.["jsx-a11y"] ?? jsxA11y) },
        }));

        eslint = new ESLint({
          cwd,
          overrideConfig: patched, // Flat Config 배열
        });
      } else {
        // 내부 config 읽어 병합 + 객체 보강
        const internalModule = internalConfigPath
          ? await import(pathToFileURL(internalConfigPath).href)
          : null;
        let internalConfig = internalModule?.default ?? internalModule ?? {};
        if (Array.isArray(internalConfig)) internalConfig = internalConfig[0];

        const merged = this.mergeConfigs(
          userConfig,
          {
            ...internalConfig,
            plugins: { ...(internalConfig?.plugins ?? {}), "jsx-a11y": jsxA11y },
          },
          jsxA11y
        );

        const mergedList = Array.isArray(merged) ? merged : [merged];

        eslint = new ESLint({
          cwd,
          overrideConfig: mergedList,
        });
      }
    } catch (err: any) {
      console.warn(`[A11yFix][Config] Failed to load user config: ${err.message}`);
      eslint = await this.createInternalOrFallbackESLint(cwd, internalConfigPath ?? "", jsxA11y);
    }
  } else {
    // 사용자 config 없음 → 임베디드 fallback
    eslint = await this.createInternalOrFallbackESLint(cwd, internalConfigPath ?? "", jsxA11y);
  }

  console.log(
    "[RUN] jsx-a11y loaded from:",
    require.resolve("eslint-plugin-jsx-a11y", { paths: [__dirname] })
  );

  // Lint 실행
  const t0 = performance.now();
  const results = await eslint.lintText(doc.getText(), { filePath });
  const elapsed = (performance.now() - t0).toFixed(1);

  if (token.isCancellationRequested) return;
  const result = results[0];
  if (!result) return;

  if (doc.version !== startedVersion) {
    console.log(`[LINT] drop stale v${startedVersion} -> v${doc.version}`);
    return;
  }

  const diagnostics = this.toDiagnostics(result.messages, doc);
  const codeActions = await this.buildCodeActions(doc, diagnostics);
  a11yDiagnosticCollection.set(doc.uri, diagnostics);
  this.cache.set(key, { version: doc.version, diagnostics, codeActions });

  console.log(
    `[LINT] ${path.basename(filePath)} → diag=${diagnostics.length}, actions=${codeActions.length}, time=${elapsed}ms`
  );
}


  /** 내부 config 또는 fallback 설정 생성 */
private async createInternalOrFallbackESLint(
  cwd: string,
  internalConfigPath: string,
  jsxA11y: any, // 플러그인 객체
) {
  const isInternalFixerConfig = fs.existsSync(internalConfigPath);

  // 내부 flat config 파일이 있으면 그대로 사용
  if (isInternalFixerConfig) {
    console.log(`[A11yFix][Config] Source = Internal`);
    return new ESLint({ cwd, overrideConfigFile: internalConfigPath });
  }

  // 임베디드 fallback (Flat Config 배열 + 플러그인 객체)
  console.warn(`[A11yFix][Config] Source = Embedded fallback`);
  const embeddedConfig = [{
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["node_modules/**", "dist/**", "build/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "jsx-a11y": jsxA11y }, // 문자열(X) 객체(O)
    rules: {
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-ambiguous-text": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/heading-has-content": "warn",
      "jsx-a11y/html-has-lang": "warn",
      "jsx-a11y/no-access-key": "warn",
      "jsx-a11y/no-aria-hidden-on-focusable": "warn",
      "jsx-a11y/no-distracting-elements": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "jsx-a11y/aria-activedescendant-has-tabindex": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/autocomplete-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/control-has-associated-label": "warn",
      "jsx-a11y/iframe-has-title": "warn",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/lang": "warn",
      "jsx-a11y/media-has-caption": "warn",
      "jsx-a11y/mouse-events-have-key-events": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/scope": "warn",
      "jsx-a11y/tabindex-no-positive": "warn",
    },
  }];

  //@ts-ignore
  return new ESLint({ cwd, overrideConfig: embeddedConfig });
}


  /** 접근성 규칙 존재 여부 확인 */
  private hasA11yRules(cfg: any): boolean {
    const hasPlugin = !!cfg?.plugins?.["jsx-a11y"];
    const hasRules = Object.keys(cfg?.rules ?? {}).some(r => r.startsWith("jsx-a11y/"));
    return hasPlugin || hasRules;
  }

  /** 사용자 설정과 내부 설정 병합 */
  /** 사용자 설정과 내부 설정 병합 */
private mergeConfigs(userConfig: any, internalConfig: any, jsxA11y: any) {
  const merged = Array.isArray(userConfig) ? userConfig[0] : userConfig;

  return {
    ...merged,
    files: Array.isArray(merged.files)
      ? merged.files
      : (typeof merged.files === "string" ? [merged.files] : ["**/*.{js,jsx,ts,tsx}"]),
    ignores: Array.isArray(merged.ignores)
      ? merged.ignores
      : ["node_modules/**", "dist/**", "build/**"],
    languageOptions: {
      ...(merged.languageOptions ?? {}),
      ecmaVersion: merged.languageOptions?.ecmaVersion ?? 2022,
      sourceType: merged.languageOptions?.sourceType ?? "module",
      parserOptions: {
        ...(merged.languageOptions?.parserOptions ?? {}),
        ecmaFeatures: {
          ...(merged.languageOptions?.parserOptions?.ecmaFeatures ?? {}),
          jsx: true,
        },
      },
    },
    // 플러그인은 "객체"로 보장
    plugins: {
      ...(merged.plugins ?? {}),
      ...(internalConfig?.plugins ?? {}),
      "jsx-a11y": (merged.plugins?.["jsx-a11y"] ?? internalConfig?.plugins?.["jsx-a11y"] ?? jsxA11y),
    },
    rules: Object.fromEntries(
      Object.entries({
        ...(merged.rules ?? {}),
        ...(internalConfig?.rules ?? {}),
      }).filter(([_, v]) => v !== undefined)
    ),
  };
}


  /** ESLint 진단을 VSCode 형식으로 변환 */
  private toDiagnostics(messages: Linter.LintMessage[], doc: vscode.TextDocument) {
    const out: vscode.Diagnostic[] = [];
    for (const m of messages) {
      const sl = Math.max(0, (m.line ?? 1) - 1);
      const sc = Math.max(0, (m.column ?? 1) - 1);
      const el = Math.max(sl, (m.endLine ?? m.line ?? sl + 1) - 1);
      const ec = Math.max(sc, (m.endColumn ?? m.column ?? sc + 1) - 1);
      const range = new vscode.Range(sl, sc, el, ec);
      const sev =
        m.severity === 2
          ? vscode.DiagnosticSeverity.Error
          : m.severity === 1
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information;
      const d = new vscode.Diagnostic(range, m.message, sev);
      (d as any).code = m.ruleId ?? "unknown";
      d.source = "eslint";
      out.push(d);
    }
    return out;
  }

  /** Quick Fix용 코드 액션 생성 */
  private async buildCodeActions(doc: vscode.TextDocument, diagnostics: vscode.Diagnostic[]) {
    const actions: vscode.CodeAction[] = [];
    for (const d of diagnostics) {
      const ruleName = String((d as any).code ?? "unknown");
      const ctx: RuleContext = {
        ruleName,
        code: doc.getText(d.range),
        fileCode: doc.getText(),
        lineNumber: d.range.start.line + 1,
        fullLine: doc.lineAt(d.range.start.line).text,
        range: d.range,
        document: doc,
      } as any;

      try {
        const ruleActions = await dispatchRule(ctx);
        for (const a of ruleActions) {
          a.kind = vscode.CodeActionKind.QuickFix;
          a.diagnostics = [d];
          if (!a.title.startsWith("[A11y Fix]")) a.title = `[A11y Fix] ${a.title}`;
          actions.push(a);
        }
      } catch (e) {
        console.warn(`[A11yFix] Failed to generate fix for ${ruleName}`, e);
      }
    }
    return actions;
  }

  /** Lint 대상 파일 여부 판정 */
  private isLintTarget(doc: vscode.TextDocument) {
    const f = doc.fileName.toLowerCase();
    return (
      ["javascript", "typescript"].includes(doc.languageId) ||
      /\.(jsx|tsx)$/.test(f)
    );
  }

  /** untitled 파일 처리용 가상 경로 생성 */
  private toFilePath(doc: vscode.TextDocument) {
    if (doc.uri.scheme === "untitled") {
      const base = doc.languageId.includes("typescript")
        ? "untitled.tsx"
        : "untitled.jsx";
      return path.join(this.workspaceRoot, ".virtual", base);
    }
    return doc.fileName;
  }
}
