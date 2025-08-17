import { parseFixedCodeJson } from "./parsers";
import { validateJsx } from "../../utils/scoring";

/**
 * 전략 인터페이스 (경량화 버전)
 * - 오직 tryLogic + AI 2단계만 지원
 * - 레거시(canFixByLogic/applyLogicFix) 제거
 */
export interface RuleStrategy<TCtx = unknown> {
  /** 규칙 식별자 (로그용) */
  id: string;

  /**
   * 1) 로직 기반 수정
   * - 확정적이면 최종 JSX 문자열 반환
   * - 불확실/불가하면 null
   */
  tryLogic?(ctx: TCtx): string | null;

  /**
   * 2) AI 호출용 프롬프트 생성
   * - 프롬프트는 JSON-only 응답을 유도해야 함:
   *   { "fixedCode": "<최종 JSX 문자열>" }
   */
  buildPrompt(ctx: TCtx): string;

  /**
   * 3) AI 응답 파서
   * - raw string → 최종 JSX 문자열
   * - 제공하지 않으면 parseFixedCodeJson을 사용
   */
  parseResponse?(resp: string): string;
}

export interface RunAIFixOptions {
  /** 콘솔 로깅 on/off (기본 false) */
  log?: boolean;
  /** 로그용 규칙명 (기본 strategy.id) */
  ruleName?: string;
  /** AI/로직 결과 JSX 파싱 검증 여부 (기본 true) */
  validateJsx?: boolean;
}

/**
 * 공통 실행기 (단일 패턴)
 * 1) tryLogic → 유효하면 그대로 반환
 * 2) AI 호출 → parse → (옵션) JSX 유효성 검증 → 반환
 *
 * 주의:
 * - 파싱 실패/빈 결과 시, 안전을 위해 raw에서 JSON 파싱을 재시도(parseFixedCodeJson).
 * - validateJsx 실패해도 소비 측에서 후속 처리할 수 있게 고정값을 그대로 반환(경고 로그만).
 */
export async function runAIFix<TCtx>(
  strategy: RuleStrategy<TCtx>,
  ctx: TCtx,
  callGpt: (prompt: string) => Promise<string>,
  opts: RunAIFixOptions = {}
): Promise<string> {
  const shouldValidate = opts.validateJsx !== false; // default: true
  const tag = `[A11Y][${opts.ruleName ?? strategy.id}]`;

  /** 1) 로직 기반 (tryLogic) */
  if (typeof strategy.tryLogic === "function") {
    try {
      const logicOut = strategy.tryLogic(ctx);
      if (typeof logicOut === "string" && logicOut.trim()) {
        if (shouldValidate && !validateJsx(logicOut)) {
          if (opts.log) console.warn(`${tag} tryLogic result failed JSX validation; falling back to AI`);
        } else {
          if (opts.log) {
            console.log(`${tag} logic-fixed (tryLogic):`);
            console.log(logicOut);
          }
          return logicOut;
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
    console.log(`${tag} ai-response (raw):`);
    console.log(raw);
  }

  // 전략 파서 우선, 없으면 공용 파서
  let fixed: string | null = null;

  try {
    const parse = strategy.parseResponse ?? parseFixedCodeJson;
    fixed = parse(raw);
  } catch (e) {
    if (opts.log) console.warn(`${tag} strategy.parseResponse threw; attempting fallback parseFixedCodeJson`, e);
    try {
      fixed = parseFixedCodeJson(raw);
    } catch (e2) {
      if (opts.log) console.warn(`${tag} fallback parseFixedCodeJson also failed; returning raw as-is`, e2);
      // 최후 수단: raw 그대로 반환 (소비 측에서 핸들)
      fixed = raw;
    }
  }

  if (opts.log) {
    console.log(`${tag} fixedCode (parsed):`);
    console.log(fixed);
  }

  if (shouldValidate && fixed && !validateJsx(fixed)) {
    if (opts.log) console.warn(`${tag} AI fixedCode failed JSX validation; returning as-is (consumer should handle)`);
  }

  return fixed ?? "";
}
