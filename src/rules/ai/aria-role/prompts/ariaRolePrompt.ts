import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

export function buildAriaRolePrompt(ctx: ElementA11yContext): string {
  return `
다음 JSX 요소의 role 속성을 점검하여, WAI-ARIA 명세에 존재하는 유효한 non-abstract role만 사용되도록 하세요.

원칙:
- role 값이 유효하지 않거나, 네이티브 시맨틱과 충돌/중복이면 role을 제거합니다.
- 확실하고 안전한 경우에만 의미에 맞는 올바른 role로 교체합니다. 확신이 없으면 제거합니다.
- aria-* 등 다른 속성/자식/핸들러는 가능한 변경하지 않습니다.
- 결과는 원소 하나의 최종 JSX로 반환합니다.

참고 신호:
- elementName: ${ctx.elementName}
- role: ${ctx.role ?? "없음"}
- nativeInteractive: ${ctx.nativeInteractive}

문제 코드:
<<<CODE_START>>>
${ctx.code}
<<<CODE_END>>>

주변 문맥(참고용):
<<<CONTEXT_START>>>
${ctx.fileContext || "없음"}
<<<CONTEXT_END>>>

반환 형식(중요):
- JSON만 출력하고 추가 텍스트/마크다운 금지
- 스키마: { "fixedCode": "<최종 JSX 문자열>" }

예시:
{ "fixedCode": "<div>열기</div>" }
`.trim();
}
