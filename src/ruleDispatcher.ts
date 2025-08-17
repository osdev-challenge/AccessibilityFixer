// 규칙 이름 → 처리 함수 실행 (AI/로직 기반 분기 포함)
import { RuleContext } from "./rules/types";
import {
  fixAriaProps,
  fixAriaRole,
  fixNoInteractiveToNoninteractive,
  fixNoNoninteractiveToInteractive
} from "./rules/ai/aria-role";

type Fixer = (rc: RuleContext) => Promise<string>;

const handlers: Record<string, Fixer> = {
  "aria-props": fixAriaProps,
  "aria-role": fixAriaRole,
  "no-interactive-element-to-noninteractive-role": fixNoInteractiveToNoninteractive,
  "no-noninteractive-element-to-interactive-role": fixNoNoninteractiveToInteractive,
  // labeling-content 쪽은 다음 턴에 추가
};

export function getFixer(ruleName: string): Fixer | undefined {
  return handlers[ruleName];
}
