import { RuleContext } from "../../rules/types";
import { PartialHTMLElement } from "../../rules/types";


export function extractAnchorHasContentContext(node: RuleContext): RuleContext {
  return {
    ruleName: "anchor-has-content",
    code: node.code,
    fileCode: node.fileCode,
    lineNumber: node.lineNumber,
    fullLine: node.fullLine,
    range: node.range,
    document: node.document
  };
}