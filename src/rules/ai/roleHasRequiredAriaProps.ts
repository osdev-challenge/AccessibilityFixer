import { RuleContext } from "../types";
import { buildRoleHasRequiredAriaPropsPrompt } from "../../ai/prompt/roleHasRequiredAriaPropsPrompt";
import { callGpt } from "../../ai/aiClient";


function extractOnlyHtmlFromResponse(response: string): string {
  const match = response.match(/<[\s\S]*?>/i);
  return match ? match[0].trim() : response.trim();
}



export async function runControlHasAssociatedLabelFixer(context: RuleContext) : Promise<string> {
    const prompt = buildRoleHasRequiredAriaPropsPrompt(context);
    const response = await callGpt(prompt);
    return extractOnlyHtmlFromResponse(response);
}