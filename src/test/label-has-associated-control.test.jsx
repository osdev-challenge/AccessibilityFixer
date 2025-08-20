// src/test/label-has-associated-control.test.jsx

/**
 * label에 for 속성을 추가하거나 input을 중첩시키는 테스트 함수
 */
function fixLabelHasAssociatedControl(code, fullLine) {
  const inputIdMatch = fullLine.match(/id="([^"]+)"/);
  if (inputIdMatch) {
    const inputId = inputIdMatch[1];
    return code.replace(
      /<label(.*?)>/i,
      `<label for="${inputId}"$1>`
    );
  }
  return `<label>${code}</label>`;
}

// 테스트 케이스
const testCases = [
  {
    desc: 'label과 input을 중첩시키는 경우',
    input: `<label>이름</label>`,
    fullLine: `<label>이름</label>`,
    expected: `<label><label>이름</label></label>`
  },
  {
    desc: 'input의 id를 기반으로 for 속성 추가',
    input: `<label>이름</label>`,
    fullLine: `<label>이름</label><input type="text" id="name" />`,
    expected: `<label for="name">이름</label>`
  },
];

// 실행
testCases.forEach((t, i) => {
  const result = fixLabelHasAssociatedControl(t.input, t.fullLine);
  const pass = result === t.expected;
  console.log(`\n🧪 Test ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? '✅ PASS' : '❌ FAIL');
});