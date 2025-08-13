// src/rules/logic/no-invalid-role/fix.ts
import * as vscode from 'vscode';
import { RuleContext, RuleFixer } from '../../types';

const { roles, elementRoles, roleElements } = require('aria-query') as {
  roles: Map<string, any>;
  elementRoles: Map<any, Set<string>>;
  roleElements: Map<string, Set<any>>;
};

/** 스펙상 사용가능(abstract 제외) role 집합 */
const VALID_ROLES: Set<string> = (() => {
  const set = new Set<string>();
  for (const [name, def] of roles as Map<string, any>) {
    if (def?.abstract) continue;
    set.add(String(name).toLowerCase());
  }
  return set;
})();

/** 오프닝 태그에서 tag/attrs/role 리터럴 추출 (JSX/HTML 공통) */
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

/** role="...": 문자열 리터럴만 안전 파싱 */
function extractRoleLiteral(code: string): { full: string; value: string } | null {
  // role="..."/'...'/={"..."} /={'...'} /={`...`}
  const re = /\srole\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`}]*)["'`]\s*\})/i;
  const m = re.exec(code);
  if (!m) return null;
  return { full: m[0], value: (m[1] ?? m[2] ?? m[3] ?? '').trim() };
}

/** role 속성 전체 제거 */
function stripRoleAttribute(code: string): string {
  const re = /\srole\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/i;
  return code.replace(re, '');
}

/** elementRoles 기반: 태그+속성 → 암시적 role 우선 추론 */
function inferByElementRoles(tag: string, attrs: Record<string, string | true>): string | null {
  const t = tag.toLowerCase();
  const norm: Record<string, string> = {};
  for (const k of Object.keys(attrs)) {
    const v = attrs[k];
    norm[k.toLowerCase()] = typeof v === 'string' ? v.toLowerCase() : ''; // 존재만 의미
  }

  for (const [schema, rset] of (elementRoles as Map<any, Set<string>>).entries()) {
    const name = String(schema?.name ?? '').toLowerCase();
    if (name !== t) continue;
    const specs: Array<{ name: string; value?: string; values?: string[] }> = (schema?.attributes as any[]) ?? [];

    const ok = specs.every((spec) => {
      const key = String(spec.name || '').toLowerCase();
      const has = Object.prototype.hasOwnProperty.call(norm, key);
      if (!('value' in spec) && !('values' in spec)) return has; // 존재만 요구
      if ('value' in spec && spec.value != null) return has && norm[key] === String(spec.value).toLowerCase();
      if (Array.isArray(spec.values)) return has && spec.values.map(String).map(s => s.toLowerCase()).includes(norm[key]);
      return false;
    });
    if (!ok) continue;

    // 매칭되면 첫 role 반환(대부분 1개)
    const it = (rset as Set<string>).values();
    const first = it.next();
    if (!first.done) {
      const role = String(first.value).toLowerCase();
      if (VALID_ROLES.has(role)) return role;
    }
  }
  return null;
}

/** roleElements 기반: 가능한 role 목록에서 태그/속성 스키마에 맞는 후보 찾기 */
function inferByRoleElements(tag: string, attrs: Record<string, string | true>): string | null {
  const t = tag.toLowerCase();
  const norm: Record<string, string> = {};
  for (const k of Object.keys(attrs)) {
    const v = attrs[k];
    norm[k.toLowerCase()] = typeof v === 'string' ? v.toLowerCase() : '';
  }

  const candidates: string[] = [];
  for (const [role, schemas] of (roleElements as Map<string, Set<any>>).entries()) {
    const roleName = String(role).toLowerCase();
    if (!VALID_ROLES.has(roleName)) continue;

    // 이 role이 매칭 가능한 element 스키마 중 하나라도 만족하면 후보
    for (const schema of schemas) {
      const name = String(schema?.name ?? '').toLowerCase();
      if (name !== t) continue;

      const specs: Array<{ name: string; value?: string; values?: string[] }> = (schema?.attributes as any[]) ?? [];
      const ok = specs.every((spec) => {
        const key = String(spec.name || '').toLowerCase();
        const has = Object.prototype.hasOwnProperty.call(norm, key);
        if (!('value' in spec) && !('values' in spec)) return has;
        if ('value' in spec && spec.value != null) return has && norm[key] === String(spec.value).toLowerCase();
        if (Array.isArray(spec.values)) return has && spec.values.map(String).map(s => s.toLowerCase()).includes(norm[key]);
        return false;
      });
      if (ok) { candidates.push(roleName); break; }
    }
  }

  if (candidates.length === 0) return null;

  // 간단한 우선순위: 암시적 사용자 동작 위젯들을 우선
  const preferred = ['button','link','checkbox','radio','switch','textbox','combobox','menuitem','option','tab','gridcell','cell'];
  candidates.sort((a,b) => (preferred.indexOf(a) + 1 || 999) - (preferred.indexOf(b) + 1 || 999));
  return candidates[0];
}

/** 최종 역할 제안: elementRoles → roleElements 순으로 */
function suggestRole(tag: string, attrs: Record<string, string | true>): string | null {
  return inferByElementRoles(tag, attrs) ?? inferByRoleElements(tag, attrs);
}

/** Quick Fix: 잘못된 role을 제거/교체(가능하면 유효 role로 교체) */
export const fixNoInvalidRole: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  if (!/\srole\s*=/.test(code)) return [];

  const parsed = parseOpeningTag(code);
  if (!parsed) return [];

  const { tag, attrs } = parsed;

  // 문자열 리터럴만 교정 (동적 표현식은 안전하게 패스)
  const lit = extractRoleLiteral(code);
  if (!lit) return [];

  // 현재 role 값의 유효 토큰만 남겨보기
  const tokens = lit.value.split(/\s+/).map(t => t.toLowerCase()).filter(Boolean);
  const currentValid = tokens.filter(t => VALID_ROLES.has(t));
  const isAllInvalid = currentValid.length === 0;

  // 제안 role 추론
  const candidate = suggestRole(tag, attrs);

  let fixed = code;
  let title: string;
  let message: string;

  if (candidate) {
    // 후보가 있으면 그걸로 교체
    const newAttr = ` role="${candidate}"`;
    fixed = code.replace(lit.full, newAttr);
    title = `role="${candidate}"로 교체`;
    message = `알 수 없는 role 값을 제거하고, 요소 특성에 맞는 role="${candidate}"로 교체했습니다.`;
  } else {
    // 후보가 없으면 role 속성 자체 제거
    fixed = stripRoleAttribute(code);
    title = `role 속성 제거`;
    message = isAllInvalid
      ? '알 수 없는 role 값이므로 role 속성을 제거했습니다.'
      : '적합한 role을 추론할 수 없어 role 속성을 제거했습니다.';
  }

  const fix = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, fixed);
  fix.edit = edit;
  fix.isPreferred = true;
  fix.diagnostics = [
    {
      message,
      range,
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'web-a11y-fixer',
    },
  ];

  return [fix];
};
