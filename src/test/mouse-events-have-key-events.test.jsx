// src/test/mouse-events-have-key-events.test.jsx

/**
 * 마우스 이벤트 핸들러에 대응하는 키보드 이벤트 핸들러를 추가하는 테스트 함수
 */
function fixMouseEventsHaveKeyEvents(code) {
  let newCode = code;
  let isModified = false;

  const onMouseOverMatch = newCode.match(/onMouseOver=\{([^}]+)\}/);
  if (onMouseOverMatch && !newCode.includes("onFocus")) {
    const handlerName = onMouseOverMatch[1].trim();
    newCode = newCode.replace(
      /onMouseOver=\{[^}]+\}/,
      `onMouseOver={${handlerName}} onFocus={${handlerName}}`
    );
    isModified = true;
  }

  const onMouseOutMatch = newCode.match(/onMouseOut=\{([^}]+)\}/);
  if (onMouseOutMatch && !newCode.includes("onBlur")) {
    const handlerName = onMouseOutMatch[1].trim();
    newCode = newCode.replace(
      /onMouseOut=\{[^}]+}/,
      `onMouseOut={${handlerName}} onBlur={${handlerName}}`
    );
    isModified = true;
  }

  return isModified ? newCode : code;
}

// 테스트 케이스
const testCases = [
  {
    desc: 'onMouseOver만 있을 때 onFocus 추가',
    input: `<div onMouseOver={handleHover}>Hover me</div>`,
    expected: `<div onMouseOver={handleHover} onFocus={handleHover}>Hover me</div>`
  },
  {
    desc: 'onMouseOut만 있을 때 onBlur 추가',
    input: `<div onMouseOut={handleUnhover}>Unhover me</div>`,
    expected: `<div onMouseOut={handleUnhover} onBlur={handleUnhover}>Unhover me</div>`
  },
  {
    desc: '두 이벤트 모두 있을 때 두 키보드 이벤트 추가',
    input: `<div onMouseOver={handleOver} onMouseOut={handleOut}>...</div>`,
    expected: `<div onMouseOver={handleOver} onFocus={handleOver} onMouseOut={handleOut} onBlur={handleOut}>...</div>`
  },
  {
    desc: '이미 모든 이벤트가 있을 때 변경하지 않음',
    input: `<div onMouseOver={handleOver} onMouseOut={handleOut} onFocus={handleOver} onBlur={handleOut}>...</div>`,
    expected: `<div onMouseOver={handleOver} onMouseOut={handleOut} onFocus={handleOver} onBlur={handleOut}>...</div>`
  },
];

// 실행
testCases.forEach((t, i) => {
  const result = fixMouseEventsHaveKeyEvents(t.input);
  const pass = result === t.expected;
  console.log(`\n🧪 Test ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? '✅ PASS' : '❌ FAIL');
});