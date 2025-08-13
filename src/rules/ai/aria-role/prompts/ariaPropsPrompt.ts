import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

export function buildAriaPropsPrompt(ctx: ElementA11yContext): string {
  return `
다음 JSX 요소에 포함된 aria-* 속성 중 유효하지 않은 속성을 제거하거나, 적절한 속성으로 교체해 주세요.
- WAI-ARIA 명세에 존재하는 속성만 허용합니다.
- 올바른 속성은 유지합니다.
- 불확실하면 제거 대신 가장 적절한 대체 속성을 제안하세요.
- 전체 요소를 수정한 결과 코드를 반환하세요.

문제 코드:
${ctx.code}

주변 문맥:
${ctx.fileContext || "없음"}

반환 형식(JSON만):
{ "fixedCode": "<div aria-label='설명' />" }
`.trim();
}
