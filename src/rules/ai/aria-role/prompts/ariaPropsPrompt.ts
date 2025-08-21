import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

export function buildAriaPropsPrompt(ctx: ElementA11yContext): string {
  return `
다음 JSX 요소의 aria-* 속성을 점검하여, WAI-ARIA 명세에 존재하는 유효한 속성만 남기고 나머지는 제거하세요.

원칙:
- 유효하지 않거나 존재하지 않는 aria-* 속성은 제거합니다.
- **가장 중요: 유효하지 않은 속성을 제외한 모든 기존 속성, 자식 요소, 텍스트 내용은 반드시 그대로 보존해야 합니다.**
- 값 타입/형식이 잘못된 aria-* 속성은 올바른 값으로 수정합니다. (예: aria-label={123} -> aria-label="123")
- 새로운 속성을 추가하지 않습니다.
- 결과는 원소 하나의 최종 JSX로 반환합니다.

참고 신호:
- elementName: ${ctx.elementName}
- role: ${ctx.role ?? "없음"}
- nativeInteractive: ${ctx.nativeInteractive}
- 파일 문맥은 참고용이며, 불필요한 변경의 근거로 사용하지 마세요.

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
{ "fixedCode": "<div aria-label=\"123\">Bad aria props</div>" } // 콘텐츠 보존 및 값 타입 수정
`.trim();
}
