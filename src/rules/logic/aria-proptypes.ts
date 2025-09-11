import * as vscode from "vscode";
import { RuleContext } from "../types";

/**
 * - aria-query 라이브러리 메타데이터를 사용해 속성 타입/허용값 판별
 * - 올바르지 않은 값이면 기본값으로 교체
 * - 예: aria-hidden="yes" → aria-hidden="true"
 */
export function fixAriaAttributes (context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];
  const { code, document, range } = context;

  // Quick Fix 액션 생성
  const fix = new vscode.CodeAction("ARIA 속성 값 자동 교정", vscode.CodeActionKind.QuickFix);
  fix.edit = new vscode.WorkspaceEdit();

  // --- aria-query 메타데이터 로드 ---
  const { aria } = require("aria-query") as { aria: Map<string, any> };

  /** ARIA 메타 정보 타입 정의 */
  type AriaMeta = {
    type?: string;      // 속성 데이터 타입 (boolean, number, token 등)
    values?: string[];  // token 타입의 허용 값 목록
    deprecated?: boolean;
  };

  /** 속성 이름으로 메타 정보 조회 */
  const getAriaMeta = (name: string): AriaMeta | null => {
    const meta = aria.get(String(name).toLowerCase());
    return meta ? (meta as AriaMeta) : null;
  };

  /**
   * 주어진 값(value)을 스펙에 맞게 정규화(normalize)
   * - boolean → "true"/"false"
   * - tristate → "true"/"false"/"mixed"
   * - integer/number → 숫자 변환 실패 시 "0"
   * - token → 허용 목록 중 없으면 첫 번째 값으로 교체
   * - 그 외는 원래 값 유지
   */
  const normalizeAriaValue = (attr: string, value: string | true): string | null => {
    const meta = getAriaMeta(attr);
    if (!meta) return null; // 스펙에 없는 속성은 무시

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
        if (allowed.length === 0) return raw; // 값 제한 없음
        const v = raw.toLowerCase();
        return allowed.includes(v) ? v : allowed[0]; // 첫 번째 허용값으로 fallback
      }
      default:
        return raw;
    }
  };

  /**
   * 태그 문자열 내 aria-* 속성을 찾아 모두 normalize
   * - 정규식으로 aria-* 속성 패턴을 매칭
   * - normalizeAriaValue()를 적용 후 교정된 값으로 치환
   */
  const fixAriaInTag = (tagText: string): string => {
    const attrRe = /(\baria-[\w:-]+)\s*(=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}|([^\s"'{}>/]+)))?/gi;
    return tagText.replace(
      attrRe,
      (full, name: string, _eq: string, v1?: string, v2?: string, v3?: string, v4?: string) => {
        const currentVal = v1 ?? v2 ?? v3 ?? v4 ?? true;
        const normalized = normalizeAriaValue(name, currentVal);
        if (normalized == null) return full; // 교정 불필요
        return `${name}="${normalized}"`;   // 항상 표준 HTML 속성 형태로 치환
      }
    );
  };

  // --- 실제 교정 실행 ---
  const fixed = fixAriaInTag(code);
  if (fixed === code) return []; // 교정할 부분 없음

  // 문서 수정 적용
  fix.edit.replace(document.uri, range, fixed);

  // ESLint 다이애그노스틱처럼 메시지도 함께 표시
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
