/**
 * aria-props 규칙 위반에 대해 GPT에 줄 프롬프트 생성
 */
export function buildAriaPropsPrompt({
  code,
  fileContext,
}: {
  code: string;
  fileContext: string;
}): string {
  return `
다음 JSX 요소에는 유효하지 않은 aria-* 속성이 포함되어 있을 수 있습니다.

🔹 문제 코드:
${code}

🔹 주변 코드 문맥:
${fileContext || '없음'}

🛠️ 수정 지침:
- WAI-ARIA 명세에 정의된 **유효한 aria 속성**만 유지하세요.
- 잘못된 속성은 **제거하거나 올바른 속성으로 교체**하세요.
- 전체 요소를 고친 결과를 반환하세요.

답변은 문제가 있는 코드의 수정사항만 제시해주세요. 설명은 생략해주세요. 
예시:
{<div role='button' aria-label='설명'>}
`.trim();
}
