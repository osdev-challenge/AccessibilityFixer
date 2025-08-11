/**
 * alt-text 규칙 위반에 대해 GPT에 줄 프롬프트 생성
 */
export function buildAltTextPrompt(context: {
  code: string;
  fileContext: string;
}): string {
  return `
다음 JSX 요소에는 alt 속성이 없거나 빈 값입니다.
웹접근성을 만족하도록 주변 문맥을 고려해서 적절한 alt 텍스트를 작성해주세요.

요소 코드:
${context.code}

주변 문맥:
${context.fileContext || '없음'}

조건:
- 이미지가 장식용이면 alt는 빈 문자열("")로.
- 의미 있는 경우에는 내용을 설명하는 짧은 문장을 alt로 추천.
- alt에 불필요한 단어("image", "picture", "사진", "이미지" 등)를 포함하지 않는다.

 답변은 문제가 있는 코드의 수정사항만 제시해주세요. 설명은 생략해주세요. 
예시: { alt= "제품을 보여주는 이미지" }
`.trim();
}
