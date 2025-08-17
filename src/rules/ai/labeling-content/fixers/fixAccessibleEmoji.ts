import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { callGpt } from "../../../../ai/aiClient";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";
import { buildAccessibleEmojiPrompt } from "../prompts/accessibleEmojiPrompt";

export async function fixAccessibleEmoji(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);
  const prompt = buildAccessibleEmojiPrompt(ctx);
  const resp = await callGpt(prompt);
  const patched = parseFixedCodeJson(resp);
  return createReplaceAction(rc, patched, "Fix emoji accessibility (role/aria-label or aria-hidden)");
}
