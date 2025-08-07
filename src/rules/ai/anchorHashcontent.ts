import { RuleContext } from "../types";
import { buildAnchorHasContentPrompt } from "../../ai/prompt/anchorHascontentPrompt2";
import { callGpt } from "../../ai/aiClient";

/**
 * AI 응답에서 HTML 코드만 추출
 */
function extractOnlyHtmlFromResponse(response: string): string {
  const match = response.match(/<a[\s\S]*?<\/a>/i);
  return match ? match[0].trim() : response.trim();
}

/**
 * anchor-has-content 규칙에 대한 자동 수정 실행 함수
 */
export async function runAnchorHasContentFixer(context: RuleContext): Promise<string> {
  const prompt = buildAnchorHasContentPrompt(context);
  const response = await callGpt(prompt);
  return extractOnlyHtmlFromResponse(response);
  
}
