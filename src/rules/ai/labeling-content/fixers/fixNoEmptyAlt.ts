import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";
import { fixAltText } from "./fixAltText";

/** alt=""로 정규화 */
function setAltEmpty(code: string) {
  const hasAlt = /\balt\s*=/.test(code);
  if (hasAlt) {
    return code.replace(/\balt\s*=\s*["'][^"']*["']/i, `alt=""`);
  }
  return code.replace(/<\s*img/i, `<img alt=""`);
}

/**
 * jsx-a11y/no-empty-alt:
 * - 확정 장식( role="presentation" || aria-hidden="true" )이면 alt=""를 보장하여 즉시 수정
 * - 그 외(장식 확정이 아님)인 경우엔 alt-text 로직(= fixAltText)으로 위임 → AI/로직이 적절히 처리
 */
export async function fixNoEmptyAlt(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const lc = extractLabelingContext(rc);

  // img가 아니면 스킵
  if ((lc.tagName ?? "").toLowerCase() !== "img") return [];

  const role = typeof lc.attributes?.role === "string" ? String(lc.attributes!.role).toLowerCase() : undefined;
  const ariaHidden = typeof lc.attributes?.["aria-hidden"] === "string"
    ? String(lc.attributes!["aria-hidden"]).toLowerCase()
    : undefined;

  const isDecorativeDefinite =
    role === "presentation" || ariaHidden === "true";

  if (isDecorativeDefinite) {
    // 확정 장식: alt="" 보장만 수행 
    const patched = setAltEmpty(lc.snippet);
    return createReplaceAction(rc, patched, "장식용 이미지로 간주하여 alt=\"\" 속성 보장");
  }

  // 장식 '확정'이 아니면 → alt-text로 위임 
  return await fixAltText(rc);
}
