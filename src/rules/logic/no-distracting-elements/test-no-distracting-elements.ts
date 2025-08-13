// test-no-distracting-elements.ts

/**
 * <marquee>와 <blink> 태그를 제거하는 테스트 함수
 */
function removeDistractingElements(code: string): string {
  return code.replace(/<\/?(marquee|blink)[^>]*>/gi, '');
}

// =======================
// ✅ 테스트 케이스
// =======================

const testCases = [
  `<marquee>움직이는 텍스트</marquee>`,
  `<blink>깜빡이는 텍스트</blink>`,
  `<marquee behavior="alternate">속성 포함</marquee>`,
  `<div><blink>중첩된 요소</blink></div>`,
  `<marquee><strong>강조된</strong> 텍스트</marquee>`,
  `<div>정상 텍스트</div>`
];

testCases.forEach((original, i) => {
  const result = removeDistractingElements(original);
  console.log(`🧪 Test ${i + 1}`);
  console.log(`  BEFORE: ${original}`);
  console.log(`  AFTER : ${result}`);
  console.log('-----------------------------');
});
