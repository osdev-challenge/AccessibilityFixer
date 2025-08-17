import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { callGpt } from "../../../../ai/aiClient";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";
import { buildAltTextPrompt } from "../prompts/altTextPrompt";

export async function fixAltText(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);
  const prompt = buildAltTextPrompt(ctx);
  const resp = await callGpt(prompt);
  const patched = parseFixedCodeJson(resp);
  return createReplaceAction(rc, patched, "Add or refine <img> alt text");
}
