import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

export function buildAnchorHasContentPrompt(ctx: ElementA11yContext): string {
  return `
<a> 요소가 시각/스크린리더 모두에서 인지 가능한 "콘텐츠"를 가지도록 수정하세요.

원칙:
- 텍스트 노드, 아이콘(+ aria-label/aria-labelledby/title) 등으로 반드시 인지 가능해야 함.
- 불필요한 구조 변경 금지. 확신 없으면 aria-label 추가.
- 결과는 하나의 JSX만.

문제 코드:
<<<CODE_START>>>
${ctx.code}
<<<CODE_END>>>

주변 문맥(참고용):
<<<CONTEXT_START>>>
${ctx.fileContext || "없음"}
<<<CONTEXT_END>>>

반환(JSON만):
{ "fixedCode": "<a ...>...</a>" }
`.trim();
}
