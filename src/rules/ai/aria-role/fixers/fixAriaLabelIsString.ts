import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

/**
 * aria-label 값이 문자열 리터럴이 아닌 경우 → 문자열 리터럴로 강제 변환
 *  - 숫자/불리언/표현식/객체/배열/템플릿리터럴 등도 모두 "텍스트"로 만들어 감쌈
 *  - 유효성/허용 여부는 이후 aria-props 단계에서 재검증
 */
export async function fixAriaLabelIsString(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  const ctx = extractElementA11yContext(rc);

  // aria-label 유무 + 현재 타입 확인 (문자열이면 수정 불필요)
  const ariaLabel = ctx.ariaProps.find((p) => p.name === "aria-label");
  if (!ariaLabel) return [];
  if (typeof ariaLabel.value === "string") return [];

  const src = rc.code;

  // aria-label=... 전체 구간을 찾는다 (따옴표/중괄호/토큰 케이스 포괄)
  //  - 1그룹: 값( {…} | "…" | '…' | 공백아닌토큰 )
  const attrRe = /\baria-label\s*=\s*(\{[\s\S]*?\}|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s>]+)/i;
  const m = src.match(attrRe);
  if (!m) return [];

  const fullAttr = m[0];
  const raw = m[1].trim();

  // 이미 문자열 리터럴이면 종료 (방어)
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return [];
  }

  // 내부 값을 "텍스트"로 추출 → 이스케이프 → 큰따옴표 문자열 리터럴로 치환
  const inner = unwrapBraces(raw); // {expr} → expr / 그 외 그대로
  const text = coerceToText(inner);
  const escaped = escapeForDoubleQuotedAttr(text);
  const nextAttr = `aria-label="${escaped}"`;

  const patched = src.replace(fullAttr, nextAttr);
  return createReplaceAction(rc, patched, "aria-label 값을 문자열로 수정");
}

/** { ... } 로 감싼 JSX 표현식이면 중괄호 제거 */
function unwrapBraces(s: string): string {
  if (s.startsWith("{") && s.endsWith("}")) {
    return s.slice(1, -1).trim();
  }
  return s;
}

/**
 * 표현식/숫자/불리언/객체/배열/템플릿 등을 "사람이 읽을 수 있는 텍스트"로 만든다.
 * - 순수 숫자/불리언/null: 그대로 문자열화
 * - 순수 템플릿(내부에 ${} 없는 경우): 리터럴 텍스트만 추출
 * - 객체/배열/그 외 복합 표현식: 원문을 그대로 텍스트로 사용 (따옴표만 이스케이프)
 */
function coerceToText(expr: string): string {
  const s = expr.trim();

  // 숫자 리터럴
  if (/^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i.test(s)) return s;

  // 불리언
  if (/^(true|false)$/i.test(s)) return s.toLowerCase();

  // null/undefined → placeholder
  if (/^(null|undefined)$/i.test(s)) return "unknown";

  // 이미 문자열 리터럴
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }

  // 템플릿 리터럴
  if (s.startsWith("`") && s.endsWith("`")) {
    const body = s.slice(1, -1);
    if (!/\$\{[\s\S]*?\}/.test(body)) {
      return body;
    }
    return s;
  }

  // 그 외 (객체, 배열, 함수 호출, 식별자 등) → 그대로 텍스트
  return s;
}


/** HTML 더블쿼트 속성값으로 넣기 위한 이스케이프 */
function escapeForDoubleQuotedAttr(text: string): string {
  // 큰따옴표/역슬래시/줄바꿈 정도만 이스케이프
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ");
}
