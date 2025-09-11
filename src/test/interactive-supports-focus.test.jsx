
/**
 * 인터랙티브 요소에 tabIndex="0"을 추가하는 테스트 함수
 */
function fixInteractiveSupportsFocus(code) {
  if (code.match(/\stabIndex\s*=/i)) {
    return code;
  }
  return code.replace(/^<(\w+)/, `<$1 tabIndex="0"`);
}

// 테스트 케이스
const testCases = [
  {
    desc: 'role="button" div에 tabIndex 추가',
    input: `<div role="button" onClick={() => alert("Pressed!")}>Custom Button</div>`,
    expected: `<div tabIndex="0" role="button" onClick={() => alert("Pressed!")}>Custom Button</div>`
  },
  {
    desc: 'role="link" span에 tabIndex 추가',
    input: `<span role="link" onClick={() => go()}>Link</span>`,
    expected: `<span tabIndex="0" role="link" onClick={() => go()}>Link</span>`
  },
  {
    desc: '이미 tabIndex가 있는 요소는 변경하지 않음',
    input: `<div role="button" tabIndex={0}>버튼</div>`,
    expected: `<div role="button" tabIndex={0}>버튼</div>`
  },
];

// 실행
testCases.forEach((t, i) => {
  const result = fixInteractiveSupportsFocus(t.input);
  const pass = result === t.expected;
  console.log(`\nTest ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? 'PASS' : 'FAIL');
});