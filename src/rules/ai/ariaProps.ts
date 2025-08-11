import { RuleContext } from "../types";
import { buildAriaPropsPrompt } from "../../ai/prompt/ariaPropsPrompt";
import { extractAriaPropsContext } from "../../ai/contextExtractors/ariaPropsContext";
import { callGpt } from "../../ai/aiClient";

/**
 * AI 응답에서 HTML 코드만 추출
 */
function extractOnlyHtmlFromResponse(response: string): string {
  const match = response.match(/<[\s\S]*?>/i);
  return match ? match[0].trim() : response.trim();
}

/**
 * aria-props 규칙에 대한 자동 수정 실행 함수
 */
export async function fixAriaProps(context: RuleContext): Promise<string> {
  const extractedContext = extractAriaPropsContext(context);
  const prompt = buildAriaPropsPrompt(extractedContext);
  const response = await callGpt(prompt);
  return extractOnlyHtmlFromResponse(response);
}
