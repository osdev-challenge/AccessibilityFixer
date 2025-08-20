// src/test/aria-activedescendant-has-tabindex.test.jsx

/**
 * aria-activedescendant가 있는 요소에 tabindex="0"을 추가하는 테스트 함수
 */
function fixAriaActivedescendant(code) {
  if (code.match(/\stabIndex\s*=/i)) {
    return code;
  }
  return code.replace(/^<(\w+)/, `<$1 tabIndex="0"`);
}

// 테스트 케이스
const testCases = [
  {
    desc: 'tabIndex가 없는 ul 태그에 추가',
    input: `<ul aria-activedescendant="item-2">...</ul>`,
    expected: `<ul tabIndex="0" aria-activedescendant="item-2">...</ul>`
  },
  {
    desc: '기존 tabIndex가 -1인 ul 태그는 변경하지 않음',
    input: `<ul tabIndex="-1" aria-activedescendant="item-2">...</ul>`,
    expected: `<ul tabIndex="-1" aria-activedescendant="item-2">...</ul>`
  },
  {
    desc: '다른 속성이 있는 div 태그에 추가',
    input: `<div className="list" aria-activedescendant="item-1"></div>`,
    expected: `<div tabIndex="0" className="list" aria-activedescendant="item-1"></div>`
  },
  {
    desc: '다른 tabIndex 속성이 있는 ul 태그는 변경하지 않음',
    input: `<ul tabIndex={1} aria-activedescendant="item-2">...</ul>`,
    expected: `<ul tabIndex={1} aria-activedescendant="item-2">...</ul>`
  },
];

// 실행
testCases.forEach((t, i) => {
  const result = fixAriaActivedescendant(t.input);
  const pass = result === t.expected;
  console.log(`\n🧪 Test ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? '✅ PASS' : '❌ FAIL');
});