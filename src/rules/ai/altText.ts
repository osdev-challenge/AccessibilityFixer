import { RuleContext } from "../types";
import { buildAltTextPrompt } from "../../ai/prompt/altTextPrompt1";
import { extractAltTextContext } from "../../ai/contextExtractors/altTextContext1";
import { callGpt } from "../../ai/aiClient";

/**
 * AI 응답에서 HTML 코드만 추출
 */
function extractOnlyHtmlFromResponse(response: string): string {
  const match = response.match(/<[\s\S]*?<\/>/i);
  return match ? match[0].trim() : response.trim();
}

/**
 * alt-text 규칙에 대한 자동 수정 실행 함수
 */
export async function fixAltText(context: RuleContext): Promise<string> {
  const extractedContext = extractAltTextContext(context); // { code, fileContext }
  const prompt = buildAltTextPrompt(extractedContext);
  const response = await callGpt(prompt);
  return extractOnlyHtmlFromResponse(response);
}
