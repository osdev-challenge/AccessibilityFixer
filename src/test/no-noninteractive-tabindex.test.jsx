// src/test/no-noninteractive-tabindex.test.jsx

/**
 * 비인터랙티브 요소의 tabIndex 속성을 제거하는 테스트 함수
 */
function fixNoNoninteractiveTabindex(code) {
  // 로직과 동일하게 정규식 수정
  return code.replace(/\s+tabIndex\s*=\s*(?:".*?"|'.*?'|{[^}]*})/, "");
}

// 테스트 케이스
const testCases = [
  {
    desc: 'tabIndex={0} 제거',
    input: `<div tabIndex={0}>컨텐츠</div>`,
    expected: `<div>컨텐츠</div>`
  },
  {
    desc: 'tabIndex="-1" 제거',
    input: `<span tabIndex="-1" class="text">텍스트</span>`,
    expected: `<span class="text">텍스트</span>`
  },
  {
    desc: '다른 속성과 함께 있는 tabIndex 제거',
    input: `<p class="info" tabIndex="0" id="para">단락</p>`,
    expected: `<p class="info" id="para">단락</p>`
  },
];

// 실행
testCases.forEach((t, i) => {
  const result = fixNoNoninteractiveTabindex(t.input);
  const pass = result === t.expected;
  console.log(`\n🧪 Test ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? '✅ PASS' : '❌ FAIL');
});