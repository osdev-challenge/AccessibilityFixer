import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { callGpt } from "../../../../ai/aiClient";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";
import { buildRequireAriaLabelPrompt } from "../prompts/requireAriaLabelPrompt";

export async function fixRequireAriaLabel(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);
  const prompt = buildRequireAriaLabelPrompt(ctx);
  const resp = await callGpt(prompt);
  const patched = parseFixedCodeJson(resp);
  return createReplaceAction(rc, patched, "Add accessible name (aria-label/aria-labelledby)");
}
