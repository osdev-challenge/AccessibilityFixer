import { RuleContext } from "../types";
import { buildAriaRolePrompt } from "../../ai/prompt/ariaRolePrompt";
import { extractAriaRoleContext } from "../../ai/contextExtractors/ariaRoleContext";
import { callGpt } from "../../ai/aiClient";

/**
 * AI 응답에서 HTML 코드만 추출
 */
function extractOnlyHtmlFromResponse(response: string): string {
  const match = response.match(/<[\s\S]*?<\/>/i);
  return match ? match[0].trim() : response.trim();
}

/**
 * aria-role 규칙에 대한 자동 수정 실행 함수
 */
export async function fixAriaRole(context: RuleContext): Promise<string> {
  const extractedContext = extractAriaRoleContext(context);
  const prompt = buildAriaRolePrompt(extractedContext);
  const response = await callGpt(prompt);
  return extractOnlyHtmlFromResponse(response);
//   return extractOnlyHtmlFromResponse("NULL");
}