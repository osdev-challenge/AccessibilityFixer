import { RuleContext } from "../../rules/types";

/**
 * alt-text 오류가 발생한 JSX 코드의 문맥 정보 생성
 */
export function extractAltTextContext(context: RuleContext) {
  const lines = context.fileCode.split("\n");
  const start = Math.max(0, context.lineNumber - 2);
  const end = Math.min(lines.length, context.lineNumber + 1);
  const fileContext = lines.slice(start, end).join("\n");

  return {
    ruleName: context.ruleName,
    code: context.code,
    fileContext,
  };
}
