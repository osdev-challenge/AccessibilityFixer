import { RuleStrategy } from "../../../../ai/pipelines/runAIFix";
import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { buildNoNoninteractiveToInteractivePrompt } from "../prompts/noNoninteractiveElementToInteractiveRolePrompt";
import { isValidRole, isNativeConflictRole } from "../../../../utils/ariaSpec";
import { removeRoleAst } from "../../../../utils/codeMods";
import { approveOrNull } from "../../../../utils/scoring";

export const NoNoninteractiveElementToInteractiveRoleStrategy: RuleStrategy<ElementA11yContext> = {
  id: "no-noninteractive-element-to-interactive-role",

  tryLogic(ctx) {
    const role = ctx.role ?? null;
    if (!role) return null;

    if (ctx.nativeInteractive) return null; 

    let evidence: ("invalidRole" | "interactiveRoleOnNoninteractive" | "roleConflict") | null = null;

    if (!isValidRole(role)) evidence = "invalidRole";
    else if (isNativeConflictRole(ctx.elementName, role)) {
      // 비인터랙티브 요소에 인터랙티브 role을 억지로 부여한 케이스 포함
      evidence = "interactiveRoleOnNoninteractive";
    } else {
      // 명시적 충돌 판정까진 아니더라도 비인터랙티브에 인터랙티브 role이면 보수적으로 처리 가능
      // (여기선 isNativeConflictRole이 포괄한다면 이 분기는 생략 가능)
    }

    if (!evidence) return null;

    const fixed = removeRoleAst(ctx.code);
    return fixed !== ctx.code ? approveOrNull(fixed, [evidence]) : null;
  },

  buildPrompt: buildNoNoninteractiveToInteractivePrompt,
  parseResponse: parseFixedCodeJson
};
