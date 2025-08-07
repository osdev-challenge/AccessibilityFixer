import { RuleContext } from "../../rules/types";


export function buildAnchorHasContentPrompt(context: RuleContext): string {

  return `
    아래 HTML 코드는 웹 접근성 규칙 'anchor-has-content'를 위반했습니다.
    이 규칙은 <a> 태그 내부에 사용자에게 보여지는 텍스트 콘텐츠가 없으면, 시각장애인을 포함한 사용자들이 링크의 목적을 파악하기 어렵기 때문에 문제가 됩니다.

    링크의 목적을 유추할 수 있도록 주변의 코드를 이용하여 아래 코드에 적절한 링크 텍스트나 aria-label을 제안해주세요. 

    문제의 HTML 코드:
    ${context.fullLine} 

    답변은 문제가 있는 코드의 수정사항만 제시해주세요. 설명은 생략해주세요. 
    `.trim();
}

