// src/rules/logic/aria-prototype/aria-prototype.ts
import * as vscode from "vscode";
import { RuleContext } from "../types";

export function fixAriaAttributes (context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const fix = new vscode.CodeAction("ARIA 속성 값 자동 교정", vscode.CodeActionKind.QuickFix);
  fix.edit = new vscode.WorkspaceEdit();

  // --- 내부 유틸 함수들 ---
  const { aria } = require("aria-query") as { aria: Map<string, any> };
  
  type AriaMeta = {
    type?: string;
    values?: string[];
    deprecated?: boolean;
  };

  const getAriaMeta = (name: string): AriaMeta | null => {
    const meta = aria.get(String(name).toLowerCase());
    return meta ? (meta as AriaMeta) : null;
  };

  const normalizeAriaValue = (attr: string, value: string | true): string | null => {
    const meta = getAriaMeta(attr);
    if (!meta) return null; // 스펙에 없는 속성은 터치 안 함

    const t = (meta.type || "").toLowerCase();
    const raw = typeof value === "string" ? value.trim() : "";

    switch (t) {
      case "boolean": {
        const v = raw.toLowerCase();
        const bool = v === "" ? true : (v === "true" ? true : (v === "false" ? false : false));
        return bool ? "true" : "false";
      }
      case "tristate": {
        const v = raw.toLowerCase();
        return (v === "true" || v === "false" || v === "mixed") ? v : "false";
      }
      case "integer": {
        const n = parseInt(raw, 10);
        return Number.isFinite(n) ? String(n) : "0";
      }
      case "number": {
        const n = parseFloat(raw);
        return Number.isFinite(n) ? String(n) : "0";
      }
      case "token": {
        const allowed = (meta.values || []).map(s => String(s).toLowerCase());
        if (allowed.length === 0) return raw;
        const v = raw.toLowerCase();
        return allowed.includes(v) ? v : allowed[0];
      }
      default:
        return raw;
    }
  };

  const fixAriaInTag = (tagText: string): string => {
    const attrRe = /(\baria-[\w:-]+)\s*(=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}|([^\s"'{}>/]+)))?/gi;
    return tagText.replace(
      attrRe,
      (full, name: string, _eq: string, v1?: string, v2?: string, v3?: string, v4?: string) => {
        const currentVal = v1 ?? v2 ?? v3 ?? v4 ?? true;
        const normalized = normalizeAriaValue(name, currentVal);
        if (normalized == null) return full;
        return `${name}="${normalized}"`;
      }
    );
  };
  // --- 유틸 함수 끝 ---

  const fixed = fixAriaInTag(context.code);
  if (fixed === context.code) return [];

  
  fix.edit.replace(context.document.uri, context.range, fixed);
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      "ARIA 속성 값이 스펙 타입/허용값에 맞도록 자동 교정되었습니다.",
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
};