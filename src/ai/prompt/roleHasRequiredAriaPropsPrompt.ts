import { RuleContext } from "../../rules/types";
import { extractroleHasRequiredAriaPropsContext } from "../contextExtractors/roleHasRequiredAriaPropsContext";


export function buildRoleHasRequiredAriaPropsPrompt(context: RuleContext): string {

    const peripheralCode: RuleContext = extractroleHasRequiredAriaPropsContext(context);

  return `
    아래 HTML 코드는 웹 접근성 규칙 '${peripheralCode.ruleName}'를 위반했습니다.
    이 규칙은 ARIA 역할(role) 이 부여된 요소는, 해당 역할에 필수로 요구되는 ARIA 속성(attribute) 들을 반드시 포함해야 합니다.

    문제의 코드와 주변 코드를 이용하여 aira 역할에 부합하는 aria 속성을 제안해주세요. 

    - 문제의 HTML 코드:
    ${peripheralCode.fullLine} 

    - 주변 5줄 코드 : 
    ${peripheralCode.peripheralCode} 

    답변은 문제가 있는 코드의 수정사항만 제시해주세요. 설명은 생략해주세요. 
    `.trim();
}

