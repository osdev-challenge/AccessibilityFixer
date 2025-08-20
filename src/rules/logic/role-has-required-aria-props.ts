// src/rules/logic/role-has-required-aria-props/fixRequiredAria_SafeMode_NoSnapshot.ts
import * as vscode from "vscode";
import { RuleContext } from "../types";

const { roles } = require("aria-query") as {
  roles: Map<
    string,
    {
      abstract?: boolean;
      requiredProps?: Set<string> | string[];
      props?: Map<string, { required?: boolean }>;
    }
  >;
};

// 태그 전체 Range로 확장
function getOpeningTagRange(document: vscode.TextDocument, range: vscode.Range): vscode.Range | null {
  const text = document.getText();
  let start = document.offsetAt(range.start);
  let end = document.offsetAt(range.end);

  // 뒤로 '<' 찾기
  while (start > 0 && text.charCodeAt(start) !== 60 /* '<' */) start--;
  if (text.charCodeAt(start) !== 60) return null;

  // 앞으로 '>' 찾기 (문자열/중괄호 안전)
  let i = Math.max(end, start + 1);
  let inS = false, inD = false, depth = 0;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (!inD && ch === "'" && text[i - 1] !== "\\") inS = !inS;
    else if (!inS && ch === '"' && text[i - 1] !== "\\") inD = !inD;
    else if (!inS && !inD) {
      if (ch === "{") depth++;
      else if (ch === "}" && depth > 0) depth--;
      else if (ch === ">" && depth === 0) { i++; break; }
    }
  }
  if (i > text.length) return null;
  return new vscode.Range(document.positionAt(start), document.positionAt(i));
}

// VALID_ROLES
const VALID_ROLES: Set<string> = (() => {
  const s = new Set<string>();
  for (const [name, def] of roles) {
    if (!def?.abstract) s.add(String(name).toLowerCase());
  }
  return s;
})();

// roles 메타 테이블 구성 (requiredProps 비면 props.required 기반으로 보강)
function buildRoleTables() {
  const REQUIRED_BY_ROLE: Record<string, string[]> = {};
  const ALLOWED_BY_ROLE: Record<string, string[]> = {};

  for (const [name, def] of roles) {
    const role = String(name).toLowerCase();
    if (def?.abstract) continue;

    let required: string[] = [];
    if (def?.requiredProps instanceof Set) {
      required = Array.from(def.requiredProps).map(String);
    } else if (Array.isArray(def?.requiredProps)) {
      required = def!.requiredProps.map(String);
    }

    // ⚠️ 일부 환경에서 requiredProps가 비어 올 수 있으므로 props에서 required: true 스캔
    if (required.length === 0 && def?.props instanceof Map) {
      for (const [propName, propMeta] of def.props) {
        if ((propMeta as any)?.required) {
          required.push(String(propName));
        }
      }
    }
    REQUIRED_BY_ROLE[role] = required;

    const allowedFromSpec = Array.from(def?.props?.keys?.() ?? []).map(String);
    const commonLabeling = ["aria-label", "aria-labelledby", "aria-describedby"];
    const allowed = Array.from(new Set([...allowedFromSpec, ...commonLabeling]));
    ALLOWED_BY_ROLE[role] = allowed;
  }

  // 최소 폴백(혹시 또 비면)
  const MIN_REQUIRED_FALLBACK: Record<string, string[]> = {
    checkbox: ["aria-checked"],
    radio: ["aria-checked"],
    switch: ["aria-checked"],
    heading: ["aria-level"],
    slider: ["aria-valuenow"],
    option: ["aria-selected"],
  };
  for (const k of Object.keys(MIN_REQUIRED_FALLBACK)) {
    if (!REQUIRED_BY_ROLE[k] || REQUIRED_BY_ROLE[k].length === 0) {
      REQUIRED_BY_ROLE[k] = MIN_REQUIRED_FALLBACK[k].slice();
    }
  }

  return { REQUIRED_BY_ROLE, ALLOWED_BY_ROLE };
}

const { REQUIRED_BY_ROLE, ALLOWED_BY_ROLE } = buildRoleTables();

function defaultValue(attr: string): string {
  switch (attr) {
    case "aria-checked":
    case "aria-selected":
    case "aria-expanded":
      return `="false"`;
    case "aria-valuenow":
      return "={0}";
    case "aria-level":
      return "={2}";
    case "aria-controls":
      return `="SCROLL_TARGET"`;
    default:
      return `=""`;
  }
}

function inferValue(line: string, attr: string): string | null {
  const has = (re: RegExp) => re.test(line);
  switch (attr) {
    case "aria-checked":
    case "aria-selected":
      if (has(/\b(active|selected|checked|is-active|is-checked)\b/)) return `="true"`;
      return null;
    case "aria-expanded":
      if (has(/\b(open|expanded|is-open|is-expanded)\b/)) return `="true"`;
      return null;
    case "aria-valuenow": {
      const mPct = line.match(/(\d+)\s*%/);
      if (mPct) return `={${Number(mPct[1])}}`;
      const mVal = line.match(/\bvalue\s*=\s*{?\s*(\d+)\s*}?/);
      if (mVal) return `={${Number(mVal[1])}}`;
      return null;
    }
    case "aria-level": {
      const mH = line.match(/\bh([1-6])\b/);
      if (mH) return `={${Number(mH[1])}}`;
      return null;
    }
    default:
      return null;
  }
}

function stripUnknownAria(line: string, role: string): string {
  const allow = new Set((ALLOWED_BY_ROLE[role] ?? []).map((s) => s.toLowerCase()));
  return line.replace(
    /\s(aria-[a-z0-9_-]+)\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/gi,
    (full, name: string) => (allow.has(name.toLowerCase()) ? full : "")
  );
}

export function fixRequiredAria(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  // ✅ 태그 전체 범위로 확장
  const tagRange = getOpeningTagRange(context.document, context.range);
  if (!tagRange) return [];
  let newCode = context.document.getText(tagRange);

  // spread props 있으면 안전 보류
  if (/\{\s*\.\.\.[\s\S]*?\}/.test(newCode)) return [];

  // role 추출: "..." / '...' / {"..."} / {'...'} / {`...`}
  const roleMatch = newCode.match(
    /\brole\s*=\s*(?:"([\w-]+)"|'([\w-]+)'|\{\s*["'`]([\w-]+)["'`]\s*\})/i
  );
  if (!roleMatch) return [];
  const role = (roleMatch[1] ?? roleMatch[2] ?? roleMatch[3] ?? "").toLowerCase();
  if (!VALID_ROLES.has(role)) return [];
  if (/role\s*=\s*(?:"\s*"|'\s*'|\{\s*["'`]\s*["'`]\s*\})/i.test(newCode)) return [];

  const required = REQUIRED_BY_ROLE[role];
  if (!required || required.length === 0) return [];

  const cleaned = stripUnknownAria(newCode, role);

  // 열림 태그의 마지막 '>' 또는 '/>' 바로 앞에 삽입
  // (간단히 첫 '>' 기준으로 사용해도 충분: 열림 태그 텍스트만 다룸)
  const endIdx = (() => {
    let i = cleaned.length - 1;
    while (i >= 0 && cleaned[i] !== ">") i--;
    return i; // '>' 인덱스
  })();
  if (endIdx < 0) return [];

  // self-closing 고려: ' />' 인지 체크해서 삽입 위치 결정
  let k = endIdx - 1;
  while (k >= 0 && /\s/.test(cleaned[k])) k--;
  const isSelfClosing = cleaned[k] === "/";
  const insertAt = isSelfClosing ? k : endIdx;

  // 열림 태그 내부 슬라이스(속성 검색용)
  const openTagSlice = cleaned.slice(0, endIdx);
  const hasAttr = (name: string) => new RegExp(`\\b${name}\\s*=`, "i").test(openTagSlice);

  const additions: string[] = [];
  for (const attr of required) {
    if (!hasAttr(attr)) {
      const inferred = inferValue(cleaned, attr);
      additions.push(`${attr}${inferred ?? defaultValue(attr)}`);
    }
  }

  if (additions.length === 0) {
    // 허용 외 속성 제거만 있었다면 그 결과로 교체
    if (cleaned === newCode) return [];
    newCode = cleaned;
  } else {
    const before = cleaned.slice(0, insertAt);
    const after = cleaned.slice(insertAt);
    const spacer = /\s$/.test(before) ? "" : " ";
    newCode = before + spacer + additions.join(" ") + after;
  }

  if (newCode === context.document.getText(tagRange)) return [];

  const fix = new vscode.CodeAction(
    `필수 ARIA 속성 자동 보강`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(context.document.uri, tagRange, newCode);
  fix.diagnostics = [
    new vscode.Diagnostic(
      tagRange,
      additions.length
        ? `[a11y] role="${role}"에 필요한 속성 추가: ${additions.map(a => a.split("=")[0]).join(", ")}`
        : `[a11y] role="${role}"에서 허용되지 않는 ARIA 속성을 정리했습니다.`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}
