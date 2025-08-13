export interface RuleStrategy<TCtx = unknown> {
  id: string;
  canFixByLogic?(ctx: TCtx): boolean;
  applyLogicFix?(ctx: TCtx): string | null;   // fixedCode or null
  buildPrompt(ctx: TCtx): string;             // GPT 프롬프트
  parseResponse(resp: string): string;        // { fixedCode } 추출
}

export interface RunAIFixOptions {
  log?: boolean;     // ← 콘솔 로깅 on/off
  ruleName?: string; // ← 로그에 찍을 룰명(선택)
}

export async function runAIFix<TCtx>(
  strategy: RuleStrategy<TCtx>,
  ctx: TCtx,
  callGpt: (prompt: string) => Promise<string>,
  opts: RunAIFixOptions = {}
): Promise<string> {
  if (strategy.canFixByLogic?.(ctx)) {
    const fixed = strategy.applyLogicFix!(ctx);
    if (fixed){
      if (opts.log) {
        console.log(`[A11Y][${opts.ruleName ?? strategy.id}] logic-fixed:`);
        console.log(fixed);
      }
      return fixed;
    }
  }
  const prompt = strategy.buildPrompt(ctx);
  const resp = await callGpt(prompt);
   const fixed = strategy.parseResponse(resp);
  if (opts.log) {
    console.log(`[A11Y][${opts.ruleName ?? strategy.id}] ai-response (raw):`);
    console.log(resp);
    console.log(`[A11Y][${opts.ruleName ?? strategy.id}] fixedCode (parsed):`);
    console.log(fixed);
  }
  return fixed;
}
