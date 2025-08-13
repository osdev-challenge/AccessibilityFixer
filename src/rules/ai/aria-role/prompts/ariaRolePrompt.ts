import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

export function buildAriaRolePrompt(ctx: ElementA11yContext): string {
  return `
다음 JSX 요소의 role 속성 값을 검토하여, WAI-ARIA 명세에 존재하는 유효한 non-abstract role만 사용되도록 수정하세요.
- 잘못된 role 값은 제거하거나, 요소 의미/문맥에 맞는 올바른 role로 교체하세요.
- 네이티브 시맨틱과 불필요하게 충돌하는 경우에는 role을 제거하는 것이 바람직합니다.
- 전체 요소를 수정한 결과 코드를 반환하세요.

문제 코드:
${ctx.code}

주변 문맥:
${ctx.fileContext || "없음"}

반환 형식(JSON만):
{ "fixedCode": "<div role=\\"button\\">열기</div>" }
`.trim();
}
