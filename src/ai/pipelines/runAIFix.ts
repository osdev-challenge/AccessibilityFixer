import { parseFixedCodeJson } from "./parsers";
import { validateJsx, MIN_CONFIDENCE } from "../../utils/scoring";

/**
 * 전략 인터페이스(신규): tryLogic 기반
 * - tryLogic이 있으면 그 결과(string|null)를 우선 사용
 * - 없으면 레거시(canFixByLogic/applyLogicFix)를 지원
 */
export interface RuleStrategy<TCtx = unknown> {
  id: string;

  /** 신규 API: 로직으로 수정안을 만들면 문자열, 불확실/불가 시 null */
  tryLogic?(ctx: TCtx): string | null;

  /** 레거시 API (하위호환): */
  canFixByLogic?(ctx: TCtx): boolean;
  applyLogicFix?(ctx: TCtx): string | null;

  /** AI 단계 */
  buildPrompt(ctx: TCtx): string;
  parseResponse(resp: string): string;
}

export interface RunAIFixOptions {
  log?: boolean;             // 콘솔 로깅 on/off
  ruleName?: string;         // 로그용 규칙명
  validateJsx?: boolean;     // AI/로직 결과를 JSX 파싱 검증할지 여부 (기본 true)
  minConfidence?: number;    // 향후 확신도 쓰고 싶을 때(지금은 scoring.ts가 관리)
}

/**
 * 공통 실행기
 * 1) tryLogic → (결과가 유효하면) 반환
 * 2) 레거시 canFixByLogic/applyLogicFix → 동일
 * 3) AI 호출 → parseFixedCodeJson 등으로 정규화 → (옵션) JSX 검증
 */
export async function runAIFix<TCtx>(
  strategy: RuleStrategy<TCtx>,
  ctx: TCtx,
  callGpt: (prompt: string) => Promise<string>,
  opts: RunAIFixOptions = {}
): Promise<string> {
  const shouldValidate = opts.validateJsx !== false; // default: true
  const tag = `[A11Y][${opts.ruleName ?? strategy.id}]`;

  // 1) 신규: tryLogic
  if (typeof strategy.tryLogic === "function") {
    try {
      const logicOut = strategy.tryLogic(ctx);
      if (typeof logicOut === "string" && logicOut.trim()) {
        if (shouldValidate && !validateJsx(logicOut)) {
          if (opts.log) console.warn(`${tag} logic result failed JSX validation; falling back to AI`);
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

  // 2) 레거시: canFixByLogic/applyLogicFix
  if (typeof strategy.canFixByLogic === "function" && strategy.canFixByLogic(ctx)) {
    if (typeof strategy.applyLogicFix === "function") {
      try {
        const fixed = strategy.applyLogicFix(ctx);
        if (typeof fixed === "string" && fixed.trim()) {
          if (shouldValidate && !validateJsx(fixed)) {
            if (opts.log) console.warn(`${tag} legacy logic result failed JSX validation; falling back to AI`);
          } else {
            if (opts.log) {
              console.log(`${tag} logic-fixed (legacy):`);
              console.log(fixed);
            }
            return fixed;
          }
        }
      } catch (e) {
        if (opts.log) console.warn(`${tag} legacy applyLogicFix threw; falling back to AI`, e);
      }
    }
  }

  // 3) AI 단계
  const prompt = strategy.buildPrompt(ctx);
  const raw = await callGpt(prompt);
  const fixed = strategy.parseResponse ? strategy.parseResponse(raw) : parseFixedCodeJson(raw);

  if (opts.log) {
    console.log(`${tag} ai-response (raw):`);
    console.log(raw);
    console.log(`${tag} fixedCode (parsed):`);
    console.log(fixed);
  }

  if (shouldValidate && fixed && !validateJsx(fixed)) {
    // AI 응답이 invalid JSX면, 안전을 위해 원본 ctx에서 스니펫을 꺼낼 수 있다면 그걸 유지(여기선 그대로 반환)
    if (opts.log) console.warn(`${tag} AI fixedCode failed JSX validation; returning as-is (consumer should handle)`);
  }

  return fixed;
}
