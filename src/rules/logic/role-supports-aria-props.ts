// src/rules/logic/role-supports-aria-props/fix.ts
import * as vscode from "vscode";
import { RuleContext } from "../types";
import { ALLOWED_BY_ROLE } from "./scripts-data/allowed-by-role.gen";

const { elementRoles } = require("aria-query") as { elementRoles: Map<any, Set<string>> };

/** aria-query의 elementRoles 데이터로 암시적 role 추론 */
function inferImplicitRole(tag: string, attrs: Record<string, string | true>): string | null {
  const t = tag.toLowerCase();
  const norm: Record<string, string | true> = {};
  for (const k of Object.keys(attrs)) {
    const v = attrs[k];
    norm[k.toLowerCase()] = typeof v === "string" ? v.toLowerCase() : true;
  }
  for (const [schema, roles] of elementRoles.entries()) {
    const name = String(schema?.name ?? "").toLowerCase();
    if (name !== t) continue;

    const specs: Array<{ name: string; value?: string; values?: string[] }> =
      (schema?.attributes as any[]) ?? [];

    const ok = specs.every((spec) => {
      const key = String(spec.name || "").toLowerCase();
      const has = Object.prototype.hasOwnProperty.call(norm, key);
      if (!("value" in spec) && !("values" in spec)) return has;
      if ("value" in spec && spec.value != null) {
        return has && norm[key] === String(spec.value).toLowerCase();
      }
      if (Array.isArray(spec.values)) {
        if (!has) return false;
        const val = String(norm[key]);
        return spec.values.map(String).map((s) => s.toLowerCase()).includes(val);
      }
      return false;
    });

    if (!ok) continue;

    const it = (roles as Set<string>).values();
    const first = it.next();
    if (!first.done) return String(first.value).toLowerCase();
  }
  return null;
}

function parseOpeningTag(tagText: string): { tag: string; attrs: Record<string, string | true> } | null {
  if (/<\s*\//.test(tagText)) return null; // </...> 제외
  const tagM = tagText.match(/<\s*([A-Za-z][\w:-]*)\b/);
  if (!tagM) return null;
  const tag = tagM[1];

  const attrs: Record<string, string | true> = {};
  // key="..." | key='...' | key={...} | key | key=unquoted
  const attrRe = /(\b[\w:-]+)\s*(=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}|([^\s"'{}>/]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(tagText))) {
    const key = m[1];
    const val = m[3] ?? m[4] ?? m[5] ?? m[6];
    attrs[key] = (val == null) ? true : String(val).trim();
  }
  return { tag, attrs };
}

/** role 결정: 명시적 우선, 없으면 암시적(aria-query 기반) */
function resolveRole(attrs: Record<string, string | true>, tag: string): string | null {
  const raw = (attrs["role"] as string | undefined)?.trim();
  if (raw) return raw.split(/\s+/)[0].toLowerCase();
  return inferImplicitRole(tag, attrs);
}

function findUnsupported(attrs: Record<string, string | true>, allowed: Set<string>): string[] {
  return Object.keys(attrs)
    .filter((n) => /^aria-[a-z0-9-]+$/i.test(n))
    .filter((n) => !allowed.has(n.toLowerCase()));
}

function stripAttributesInTag(tagText: string, dropNames: string[]): string {
  if (dropNames.length === 0) return tagText;
  const pattern = dropNames
    .map((n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|");
  // key="…" | key='…' | key={…} | key(불리언) | key=unquoted
  const re = new RegExp(`\\s+(?:${pattern})(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|\\{[^}]*\\}|[^\\s"'>/]+))?`, "gi");
  return tagText.replace(re, "");
}

// ── rule fixer ────────────────────────────────────────────────────────────────
export function fixRoleSupportsAriaProps (context: RuleContext): vscode.CodeAction[] {
  const { code, range, document } = context;
  const fixes: vscode.CodeAction[] = [];

  // 빠른 bail-out: aria-* 없으면 패스
  if (!/\saria-[a-z0-9-]+/i.test(code)) return [];

  const parsed = parseOpeningTag(code);
  if (!parsed) return [];

  const role = resolveRole(parsed.attrs, parsed.tag);

  const list = role ? (ALLOWED_BY_ROLE[role] ?? []) : [];
  const allowed = new Set(list.map((s) => s.toLowerCase()));

  const unsupported = findUnsupported(parsed.attrs, allowed);
  if (unsupported.length === 0) return [];

  const fixedText = stripAttributesInTag(code, unsupported);
  if (fixedText === code) return [];

  const fix = new vscode.CodeAction(
    `Unsupported ARIA 제거: ${unsupported.join(", ")}`,
    vscode.CodeActionKind.QuickFix
  );
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, fixedText);

  // ✅ 빠졌던 부분!
  fix.edit = edit;

  fix.isPreferred = true;
  fix.diagnostics = [
    new vscode.Diagnostic(
      context.range,
      `role="${role ?? "∅"}"에서 지원하지 않는 ARIA: ${unsupported.join(", ")}`,
      vscode.DiagnosticSeverity.Warning
    ),
  ];

  fixes.push(fix);
  return fixes;
}
