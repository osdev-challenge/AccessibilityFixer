
/**
 * tabIndex 양수 값을 0으로 변경하는 테스트 함수
 */
function fixTabindex(code) {
  const regex = /(tabIndex\s*=\s*)(["']?|\{?)(\d+)(["']?|\}?)/;
  const match = code.match(regex);
  if (!match || Number(match[3]) <= 0) {
    return code;
  }
  const [, prefix] = match;
  // 전체 코드에서 일치하는 속성만 교체하여 반환하도록 수정
  return code.replace(match[0], `${prefix}"0"`);
}

// 테스트 케이스
const testCases = [
  {
    desc: 'tabIndex={2}를 tabIndex="0"으로 변경',
    input: `<div tabIndex={2}>I have a positive tabIndex</div>`,
    expected: `<div tabIndex="0">I have a positive tabIndex</div>`
  },
  {
    desc: 'tabIndex="1"을 tabIndex="0"으로 변경',
    input: `<span tabIndex="1">Another positive tabIndex</span>`,
    expected: `<span tabIndex="0">Another positive tabIndex</span>`
  },
  {
    desc: 'tabIndex가 0인 경우 변경하지 않음',
    input: `<a href="#" tabIndex="0">Link</a>`,
    expected: `<a href="#" tabIndex="0">Link</a>`
  },
  {
    desc: 'tabIndex가 음수인 경우 변경하지 않음',
    input: `<button tabIndex="-1">Button</button>`,
    expected: `<button tabIndex="-1">Button</button>`
  },
];

// 실행
testCases.forEach((t, i) => {
  const result = fixTabindex(t.input);
  const pass = result === t.expected;
  console.log(`\nTest ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? 'PASS' : 'FAIL');
});