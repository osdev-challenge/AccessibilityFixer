// src/rules/logic/aria-prototype/fix.ts
import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../../types";

// 타입 선언이 없을 수 있으니 require 사용(에디터 빨간 줄 방지)
const { aria } = require("aria-query") as { aria: Map<string, any> };

type AriaMeta = {
  type?: string;      // 'boolean' | 'tristate' | 'integer' | 'number' | 'token' | 'id' | 'idlist' | 'string' ...
  values?: string[];  // token 타입의 허용값
  deprecated?: boolean;
};

/** 메타 조회 */
function getAriaMeta(name: string): AriaMeta | null {
  const meta = aria.get(String(name).toLowerCase());
  return meta ? (meta as AriaMeta) : null;
}

/** 값 정규화 (스펙 타입/허용값 기준) */
function normalizeAriaValue(attr: string, value: string | true): string | null {
  const meta = getAriaMeta(attr);
  if (!meta) return null; // 스펙에 없는 속성은 터치 안 함

  const t = (meta.type || "").toLowerCase();
  const raw = typeof value === "string" ? value.trim() : ""; // boolean 단축은 빈 문자열로 처리

  switch (t) {
    case "boolean": {
      // 존재만으로 true 가능, 값이 이상하면 false
      const v = raw.toLowerCase();
      const bool = v === "" ? true : (v === "true" ? true : (v === "false" ? false : false));
      return bool ? "true" : "false";
    }
    case "tristate": {
      // true | false | mixed
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
      if (allowed.length === 0) return raw; // 제한 정보 없으면 그대로
      const v = raw.toLowerCase();
      return allowed.includes(v) ? v : allowed[0];
    }
    // id, idlist, string 등은 별도 검증없이 그대로 유지
    default:
      return raw;
  }
}

/** 태그 문자열에서 aria-* 속성들을 찾아 타입에 맞게 교정 */
function fixAriaInTag(tagText: string): string {
  // key="..." | key='...' | key={...} | key(불리언 단축) | key=unquoted
  const attrRe = /(\baria-[\w:-]+)\s*(=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}|([^\s"'{}>/]+)))?/gi;

  return tagText.replace(
    attrRe,
    (full, name: string, _eq: string, v1?: string, v2?: string, v3?: string, v4?: string) => {
      const currentVal = v1 ?? v2 ?? v3 ?? v4 ?? true; // 값 없으면 boolean 단축
      const normalized = normalizeAriaValue(name, currentVal);
      if (normalized == null) return full;             // 스펙 모르는 속성은 그대로
      return `${name}="${normalized}"`;                // 일관성 위해 항상 name="value" 형태로 씀
    }
  );
}

/** CodeAction: ARIA 속성 값 자동 교정 */
export const fixAriaAttributes: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // 빠른 종료: aria-*가 없으면 스킵
  if (!/\baria-[a-z0-9-]+/i.test(code)) return [];

  const fixed = fixAriaInTag(code);
  if (fixed === code) return [];

  const fix = new vscode.CodeAction("ARIA 속성 값 자동 교정", vscode.CodeActionKind.QuickFix);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, fixed);
  fix.edit = edit;
  fix.isPreferred = true;
  fix.diagnostics = [
    {
      message: "ARIA 속성 값이 스펙 타입/허용값에 맞도록 자동 교정되었습니다.",
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: "web-a11y-fixer",
    },
  ];

  return [fix];
};
