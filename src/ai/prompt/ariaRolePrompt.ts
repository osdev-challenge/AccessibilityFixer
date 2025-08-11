/**
 * aria-role 규칙 위반에 대해 GPT에 줄 프롬프트 생성
 */
export function buildAriaRolePrompt({
  code,
  fileContext,
}: {
  code: string;
  fileContext: string;
}): string {
  return `
다음 JSX 요소는 HTML 시맨틱 요소에 부적절한 role 속성을 사용하고 있습니다.

🔹 문제 코드:
${code}

🔹 주변 코드 문맥:
${fileContext || '없음'}

🛠️ 수정 지침:
- HTML 요소의 기본 시맨틱 역할을 고려하여 role 속성을 적절히 설정하세요.
- 불필요하거나 부적절한 role은 제거하거나 올바른 role로 교체하세요.
- 전체 JSX 요소를 수정한 결과를 반환하세요.

답변은 문제가 있는 코드의 수정사항만 제시해주세요. 설명은 생략해주세요. 
예시:
{<section aria-label='소개 섹션'>}
`.trim();
}
