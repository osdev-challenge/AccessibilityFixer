import { parseFixedCodeJson } from "./parsers";
import { validateJsx } from "../../utils/scoring";

/**
 * 반환 타입:
 * - whole-element: 요소 전체를 새 HTML로 교체
 * - none: 적용할 것이 없음
 *
 * (필요하면 이후 patch-ops 등으로 확장 가능)
 */
export type AiFixResult =
  | { kind: "whole-element"; html: string }
  | { kind: "none" };

/**
 * 전략 인터페이스 (경량화 버전)
 * - tryLogic 결과나 AI 결과가 "완성 태그"면 whole-element로 래핑해 반환
 */
export interface RuleStrategy<TCtx = unknown> {
  /** 규칙 식별자 (로그용) */
  id: string;

  /**
   * 1) 로직 기반 수정
   * - 확정적이면 최종 JSX/HTML 문자열 반환
   * - 불확실/불가하면 null
   */
  tryLogic?(ctx: TCtx): string | null;

  /**
   * 2) AI 호출용 프롬프트 생성
   * - 프롬프트는 JSON-only 응답을 유도:
   *   { "fixedCode": "<최종 JSX/HTML 문자열>" }
   */
  buildPrompt(ctx: TCtx): string;

  /**
   * 3) AI 응답 파서 
   * - raw string → 최종 JSX/HTML 문자열
   * - 제공하지 않으면 parseFixedCodeJson 사용
   */
  parseResponse?(resp: string): string;
}

export interface RunAIFixOptions {
  /** 콘솔 로깅 on/off (기본 false) */
  log?: boolean;
  /** 로그용 규칙명 (기본 strategy.id) */
  ruleName?: string;
  /** 결과 JSX 유효성 검증 여부 (기본 true) */
  validateJsx?: boolean;
}

/** 문자열이 "완성 태그(열림+닫힘)" 형태인지 간단 검사 */
/** 문자열이 "완성 태그(열림+닫힘)" 형태인지 간단 검사 */
function looksLikeWholeElement(html: string): boolean {
  const s = html.trim();
  if (!s) return false;

  // 꺽쇠 괄호의 개수가 짝이 맞는지 확인하여 잘린 태그를 방지
  const openBrackets = (s.match(/</g) || []).length;
  const closeBrackets = (s.match(/>/g) || []).length;
  if (openBrackets === 0 || openBrackets !== closeBrackets) {
    return false;
  }


  const isSelfClosing = /\/\s*>$/.test(s);
  if (isSelfClosing) {
    return /^<\s*([a-zA-Z][\w:-]*)\b[\s\S]*\/\s*>$/.test(s);
  } else {
    return /^<\s*([a-zA-Z][\w:-]*)\b[\s\S]*<\/\s*\1\s*>$/.test(s);
  }
}

/**
 * 공통 실행기 
 * 1) tryLogic → 문자열이면 whole-element 판단 → 반환
 * 2) AI 호출 → parse → whole-element 판단 → 반환
 * 3) 실패/없음 → { kind: "none" }
 */
export async function runAIFix<TCtx>(
  strategy: RuleStrategy<TCtx>,
  ctx: TCtx,
  callGpt: (prompt: string) => Promise<string>,
  opts: RunAIFixOptions = {}
): Promise<AiFixResult> {
  const shouldValidate = opts.validateJsx !== false; // default: true
  const tag = `[A11Y][${opts.ruleName ?? strategy.id}]`;

  /** 1) 로직 기반 (tryLogic) */
  if (typeof strategy.tryLogic === "function") {
    try {
      const logicOut = strategy.tryLogic(ctx);
      if (typeof logicOut === "string" && logicOut.trim()) {
        const html = logicOut.trim();
        if (looksLikeWholeElement(html)) {
          if (shouldValidate && !validateJsx(html)) {
            if (opts.log) console.warn(`${tag} tryLogic result failed JSX validation; falling back to AI`);
          } else {
            if (opts.log) {
              console.log(`${tag} logic-fixed (whole-element):\n${html}`);
            }
            return { kind: "whole-element", html };
          }
        } else {
          if (opts.log) console.warn(`${tag} tryLogic is not a whole element; falling back to AI`);
        }
      }
    } catch (e) {
      if (opts.log) console.warn(`${tag} tryLogic threw; falling back to AI`, e);
    }
  }

  /** 2) AI 단계 */
  const prompt = strategy.buildPrompt(ctx);
  const raw = await callGpt(prompt);

  if (opts.log) {
    console.log(`${tag} ai-response (raw):\n${raw}`);
  }

  // 전략 파서 우선, 없으면 공용 파서
  let fixed = "";
  try {
    const parse = strategy.parseResponse ?? parseFixedCodeJson;
    fixed = (parse(raw) ?? "").trim();
  } catch (e) {
    if (opts.log) console.warn(`${tag} strategy.parseResponse threw; attempting fallback parseFixedCodeJson`, e);
    try {
      fixed = (parseFixedCodeJson(raw) ?? "").trim();
    } catch (e2) {
      if (opts.log) console.warn(`${tag} fallback parseFixedCodeJson failed`, e2);
      fixed = "";
    }
  }

  if (!fixed) return { kind: "none" };

  if (looksLikeWholeElement(fixed)) {
    if (shouldValidate && !validateJsx(fixed)) {
      if (opts.log) console.warn(`${tag} AI fixedCode failed JSX validation; returning anyway for consumer to handle`);
    }
    if (opts.log) {
      console.log(`${tag} ai-fixed (whole-element):\n${fixed}`);
    }
    return { kind: "whole-element", html: fixed };
  }

  if (opts.log) console.warn(`${tag} AI output is not a whole element; skipping`);
  return { kind: "none" };
}
