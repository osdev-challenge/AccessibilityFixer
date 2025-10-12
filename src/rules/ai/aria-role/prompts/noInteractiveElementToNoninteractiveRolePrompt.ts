import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

export function buildNoInteractiveToNoninteractivePrompt(ctx: ElementA11yContext): string {
  return `
네이티브로 인터랙티브한 요소(예: button, a[href], input, select, textarea, summary 등)에 비인터랙티브/표시용 role이 지정된 경우를 수정하세요.

목표:
- 네이티브 인터랙션 의미를 보호합니다.
- 비인터랙티브 role(예: "presentation", "none") 또는 네이티브 의미와 충돌/중복되는 role은 제거합니다.
- 확실한 근거가 없는 한 role을 새 값으로 교체하지 않습니다(교체보다 제거 우선).
- aria-* 등 다른 속성/자식/핸들러/코드 구조는 가능한 변경하지 않습니다.
- 결과는 단일 JSX 요소만 반환합니다.

참고 신호:
- elementName: ${ctx.elementName}
- role: ${ctx.role ?? "없음"}
- nativeInteractive: ${ctx.nativeInteractive}
- 파일 문맥은 참고용이며 불필요한 변경의 근거로 사용하지 마세요.

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
{ "fixedCode": "<button>저장</button>" }
`.trim();
}
