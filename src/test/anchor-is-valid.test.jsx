// src/test/anchor-is-valid.test.jsx

/**
 * a 태그에 유효한 href 속성을 추가하는 테스트 함수
 */
function fixAnchorIsValid(code) {
  if (!/\shref=["'][^"']*["']/i.test(code) || /\shref=[""]/.test(code)) {
    return code.replace(/<a(\s|>)/i, '<a href="#"$1');
  }
  if (/\shref=["']\s*javascript:;["']/i.test(code)) {
    return code.replace(/\s*href=["']\s*javascript:;["']/i, ` href="#"`);
  }
  return code;
}

// 테스트 케이스
const testCases = [
  {
    desc: 'href 속성이 없는 a 태그에 href="#" 추가',
    input: `<a onClick={() => scrollToTop()}>Top</a>`,
    expected: `<a href="#" onClick={() => scrollToTop()}>Top</a>`
  },
  {
    desc: 'href=""인 a 태그에 href="#" 추가',
    input: `<a href="">Go</a>`,
    expected: `<a href="#">Go</a>`
  },
  {
    desc: 'href="javascript:;"인 a 태그에 href="#"로 변경',
    input: `<a href="javascript:;">Click</a>`,
    expected: `<a href="#">Click</a>`
  },
  {
    desc: '유효한 href가 이미 있는 경우 변경하지 않음',
    input: `<a href="/about">About</a>`,
    expected: `<a href="/about">About</a>`
  },
];

// 실행
testCases.forEach((t, i) => {
  const result = fixAnchorIsValid(t.input);
  const pass = result === t.expected;
  console.log(`\n🧪 Test ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? '✅ PASS' : '❌ FAIL');
});