import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";

export function buildNoNoninteractiveToInteractivePrompt(ctx: ElementA11yContext): string {
  return `
네이티브로 비인터랙티브한 요소(예: div, span 등)에 인터랙티브 role(예: "button", "link", "checkbox" 등)이 지정된 경우를 수정하세요.

원칙(보수적):
- 네이티브 시맨틱을 우선합니다. 불확실하면 role을 제거합니다.
- 강한 증거가 있을 때만(예: 클릭 핸들러 존재, 키보드 포커스 가능(tabIndex>=0), 명확한 상호작용 의도) 안전한 네이티브 요소로 태그를 교체할 수 있습니다.
  - 예) div role="button" && onClick && tabIndex>=0 → <button>으로 교체(가능하면 기존 속성/자식 보존, role 제거)
- 근거가 부족하면 태그 교체를 시도하지 말고 role만 제거하세요.
- aria-* 등 다른 속성/자식/핸들러/구조는 가능한 변경하지 않습니다.
- 결과는 단일 JSX 요소만 반환합니다.

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

예시(교체가 확실한 경우):
{ "fixedCode": "<button type=\\"button\\">열기</button>" }

예시(불확실한 경우 — role 제거만):
{ "fixedCode": "<div>열기</div>" }
`.trim();
}
