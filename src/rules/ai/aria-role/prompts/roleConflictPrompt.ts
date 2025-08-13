import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

export function buildRoleConflictPrompt(ctx: ElementA11yContext): string {
  return `
다음 JSX 요소는 네이티브 시맨틱과 role 속성이 충돌할 수 있습니다.
- 네이티브 의미를 우선하며, 불필요한 role은 제거하세요.
- 정말 필요한 경우에만 적절한 대체 role을 지정하세요.
- 전체 요소를 수정한 결과 코드를 반환하세요.

문제 코드:
${ctx.code}

주변 문맥:
${ctx.fileContext || "없음"}

반환 형식(JSON만):
{ "fixedCode": "<button aria-label=\\"저장\\">저장</button>" }
`.trim();
}
