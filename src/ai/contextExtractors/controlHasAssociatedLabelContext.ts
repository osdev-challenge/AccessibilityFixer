import { RuleContext } from "../../rules/types";
import { PartialHTMLElement } from "../../rules/types";


export function extractControlHasAssociatedLabelContext(node: RuleContext): RuleContext {

    const lines = node.fileCode.split('\n');
    const startLine = Math.max(0, node.lineNumber - 6); // lineNumber는 1-based니까 -6
    const endLine = Math.min(lines.length, node.lineNumber + 5); // 포함하고자 하는 범위

    const contextSnippet = lines.slice(startLine, endLine).join('\n');



  return {
    ruleName: "anchor-has-content",
    code: node.code,
    fileCode: node.fileCode,
    lineNumber: node.lineNumber,
    fullLine: node.fullLine,
    range: node.range,
    document: node.document,
    peripheralCode: contextSnippet
  };
}