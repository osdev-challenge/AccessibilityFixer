import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { callGpt } from "../../../../ai/aiClient";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";
import { buildImgRedundantAltPrompt } from "../prompts/imgRedundantAltPrompt";

export async function fixImgRedundantAlt(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);
  const prompt = buildImgRedundantAltPrompt(ctx);
  const resp = await callGpt(prompt);
  const patched = parseFixedCodeJson(resp);
  return createReplaceAction(rc, patched, "Remove redundant words from img alt");
}
