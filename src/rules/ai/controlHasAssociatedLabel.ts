import { RuleContext } from "../types";
import { buildControlHasAssociatedLabelPrompt } from "../../ai/prompt/controlHasAssociatedLabelPrompt";
import { callGpt } from "../../ai/aiClient";


function extractOnlyHtmlFromResponse(response: string): string {
  const match = response.match(/<button[\s\S]*?<\/button>/i);
  return match ? match[0].trim() : response.trim();
}



export async function runControlHasAssociatedLabelFixer(context: RuleContext) : Promise<string> {
    const prompt = buildControlHasAssociatedLabelPrompt(context);
    const response = await callGpt(prompt);
    return extractOnlyHtmlFromResponse(response);
}