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

  /** 실제 Lint 실행 */
  private async run(doc: vscode.TextDocument, token: vscode.CancellationToken) {
    const key = doc.uri.toString();
    this.pending.delete(key);
    const startedVersion = doc.version;

    // 현재 작업 디렉터리 결정
    const ws = vscode.workspace.getWorkspaceFolder(doc.uri);
    const cwd =
      ws?.uri.fsPath ??
      (doc.uri.scheme === "untitled"
        ? (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd())
        : path.dirname(doc.fileName));

    // eslint 설정 경로 탐색
    const userConfigPath = path.join(cwd, "eslint.config.mjs");
    const internalConfigPath = path.join(__dirname, "../../eslint.config.mjs");
    const nodeModulesPath = path.join(cwd, "node_modules");

    // 외부 node_modules 참조 허용 
    if (fs.existsSync(nodeModulesPath)) {
      (Module as any).globalPaths.push(nodeModulesPath);
    }

    let eslint: ESLint;

    // === 1️⃣ 사용자 config 존재할 경우 ===
    if (fs.existsSync(userConfigPath)) {
      try {
        const userModule = await import(pathToFileURL(userConfigPath).href);
        const userConfig = userModule.default ?? userModule;
        const hasA11y =
          Array.isArray(userConfig)
            ? userConfig.some(cfg => this.hasA11yRules(cfg))
            : this.hasA11yRules(userConfig);

        // 접근성 규칙이 있으면 그대로 사용
        if (hasA11y) {
          console.log(`[A11yFix][Config] Source = User (${userConfigPath})`);
          eslint = new ESLint({ cwd, overrideConfigFile: userConfigPath });
        } 
        // 접근성 규칙이 없으면 내부 규칙 병합
        else {
          console.log(`[A11yFix][Config] Source = User + Internal Merge`);
          const internalModule = fs.existsSync(internalConfigPath)
            ? await import(pathToFileURL(internalConfigPath).href)
            : null;
          let internalConfig = internalModule?.default ?? internalModule ?? {};
          if (Array.isArray(internalConfig)) internalConfig = internalConfig[0];
          const mergedConfig = this.mergeConfigs(userConfig, internalConfig);
          eslint = new ESLint({ cwd, overrideConfig: mergedConfig });
        }
      } catch (err: any) {
        console.warn(`[A11yFix][Config] Failed to load user config: ${err.message}`);
        eslint = await this.createInternalOrFallbackESLint(cwd, internalConfigPath);
      }
    } 
    // === 2️⃣ 사용자 config 없음 ===
    else {
      eslint = await this.createInternalOrFallbackESLint(cwd, internalConfigPath);
    }

    // === 3️⃣ Lint 실행 ===
    const filePath =
      doc.uri.scheme === "file"
        ? doc.fileName
        : path.join(cwd, "untitled.jsx");

    const t0 = performance.now();
    const results = await eslint.lintText(doc.getText(), { filePath });
    const elapsed = (performance.now() - t0).toFixed(1);

    if (token.isCancellationRequested) return;
    const result = results[0];
    if (!result) return;

    // 문서 버전 확인 (변경 시 결과 폐기)
    if (doc.version !== startedVersion) {
      console.log(`[LINT] drop stale v${startedVersion} -> v${doc.version}`);
      return;
    }

    // 결과 저장 및 표시
    const diagnostics = this.toDiagnostics(result.messages, doc);
    const codeActions = await this.buildCodeActions(doc, diagnostics);
    a11yDiagnosticCollection.set(doc.uri, diagnostics);
    this.cache.set(key, { version: doc.version, diagnostics, codeActions });

    console.log(`[LINT] ${path.basename(filePath)} → diag=${diagnostics.length}, actions=${codeActions.length}, time=${elapsed}ms`);
  }

  /** 내부 config 또는 fallback 설정 생성 */
  private async createInternalOrFallbackESLint(cwd: string, internalConfigPath: string) {
    const isInternalFixerConfig =
      internalConfigPath.includes("AccessibilityFixer") && fs.existsSync(internalConfigPath);

    // ✅ AccessibilityFixer 내부 config 사용
    if (isInternalFixerConfig) {
      console.log(`[A11yFix][Config] Source = Internal`);
      return new ESLint({ cwd, overrideConfigFile: internalConfigPath });
    }

    // 내부 config가 없으면 강제로 아래 규칙 넣어버림
    console.warn(`[A11yFix][Config] Source = Embedded fallback`);
    const jsxA11y = require("eslint-plugin-jsx-a11y");

    const rules: Record<string, string> = {
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
    };

    const embeddedConfig = {
      files: ["**/*.{js,jsx,ts,tsx}"],
      ignores: ["node_modules/**", "dist/**", "build/**"],
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { "jsx-a11y": jsxA11y },
      rules,
    };
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
  private mergeConfigs(userConfig: any, internalConfig: any) {
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
      plugins: {
        ...(merged.plugins ?? {}),
        "jsx-a11y": merged.plugins?.["jsx-a11y"] ?? require("eslint-plugin-jsx-a11y"),
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
