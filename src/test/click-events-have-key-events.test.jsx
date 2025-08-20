// src/test/click-events-have-key-events.test.jsx

/**
 * onClick 핸들러에 onKeyDown 핸들러를 추가하는 테스트 함수
 */
function fixClickEvents(code) {
  const onClickMatch = code.match(/onClick=\{([\s\S]*?)\}/);
  if (!onClickMatch) {
    return code;
  }
  
  const onClickBody = onClickMatch[1].trim();
  
  // onKeyDown이 이미 존재하면 변경하지 않음
  if (code.includes("onKeyDown")) {
    return code;
  }
  
  const newCode = code.replace(
    onClickMatch[0],
    `${onClickMatch[0]} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { ${onClickBody} } }}`
  );
  return newCode;
}

// 테스트 케이스
const testCases = [
  {
    desc: 'onClick 핸들러에 onKeyDown 핸들러 추가',
    input: `<div onClick={() => alert("Clicked!")}>클릭 미</div>`,
    expected: `<div onClick={() => alert("Clicked!")} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { () => alert("Clicked!") } }}>클릭 미</div>`
  },
  {
    desc: 'onClick 핸들러에 여러 코드가 있는 경우',
    input: `<span onClick={() => { log("Clicked"); doSomething(); }}>...</span>`,
    expected: `<span onClick={() => { log("Clicked"); doSomething(); }}>...</span> onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { log("Clicked"); doSomething(); } }}>...</span>`
  },
  {
    desc: '이미 onKeyDown이 있는 경우',
    input: `<button onClick={doClick} onKeyDown={doKey}>버튼</button>`,
    expected: `<button onClick={doClick} onKeyDown={doKey}>버튼</button>`
  }
];

// 실행
testCases.forEach((t, i) => {
  const result = fixClickEvents(t.input);
  const pass = result === t.expected;
  console.log(`\n🧪 Test ${i + 1}: ${t.desc}`);
  console.log(`  INPUT   : ${t.input}`);
  console.log(`  EXPECTED: ${t.expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? '✅ PASS' : '❌ FAIL');
});