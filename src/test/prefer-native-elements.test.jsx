// src/test/prefer-native-elements.test.jsx

/**
 * role을 네이티브 요소로 변경하는 테스트 함수
 */
function fixPreferNativeElements(code) {
  let newCode = code;

  if (newCode.includes('role="link"')) {
    const linkMatch = newCode.match(/<(?:\w+)\s+role="link"([^>]*)>/i);
    if (linkMatch) {
      const attrs = linkMatch[1];
      newCode = newCode.replace(
        /<(?:\w+)\s+role="link"([^>]*)>/i,
        `<a href="#"${attrs}>`
      );
    }
  }

  if (newCode.includes('role="checkbox"')) {
    const checkboxMatch = newCode.match(/<(?:\w+)\s+role="checkbox"([^>]*)>/i);
    if (checkboxMatch) {
      // aria-checked 속성을 이름과 값까지 완전히 제거하도록 수정
      const attrs = checkboxMatch[1].replace(/\s*aria-checked="[^"]*"/i, "");
      newCode = newCode.replace(
        /<(?:\w+)\s+role="checkbox"([^>]*)>/i,
        `<input type="checkbox"${attrs}>`
      );
    }
  }

  return newCode;
}

// 테스트 케이스
const testCases = [
  {
    desc: 'div role="link"를 a 태그로 변경',
    input: `<div role="link" onClick={() => navigate("/page")}>페이지 이동</div>`,
    expected: `<a href="#" onClick={() => navigate("/page")}>페이지 이동</div>`
  },
  {
    desc: 'span role="checkbox"를 input 태그로 변경',
    input: `<span role="checkbox" aria-checked="false">선택</span>`,
    expected: `<input type="checkbox">선택</span>`
  },
];

// 실행
testCases.forEach((t, i) => {
  const result = fixPreferNativeElements(t.input);
  const pass = result === t.expected;
  console.log(`\n🧪 Test ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? '✅ PASS' : '❌ FAIL');
});