// test-fixNoStaticElementInteractions.ts

// === 추론 함수 & 로직 ===
function inferRoleFromCode(code: string): string {
  const hints: { pattern: RegExp; role: string }[] = [
    { pattern: /\shref\s*=/i, role: 'link' },
    { pattern: /\s(aria-)?checked\s*=/i, role: 'checkbox' },
    { pattern: /\s(aria-)?selected\s*=/i, role: 'option' },
    { pattern: /\s(aria-)?expanded\s*=/i, role: 'button' },
    { pattern: /\bclass\s*=\s*["'][^"']*\bslider\b[^"']*["']/i, role: 'slider' },
    { pattern: /\bclass\s*=\s*["'][^"']*\b(switch|toggle)\b[^"']*["']/i, role: 'switch' },
    { pattern: /\bclass\s*=\s*["'][^"']*\bradio\b[^"']*["']/i, role: 'radio' },
  ];
  for (const h of hints) if (h.pattern.test(code)) return h.role;
  return 'button';
}

function fixNoStaticElementInteractionsTest(code: string): string {
  if (!/^<(div|span|p)\b/i.test(code)) return code;

  if (!/\son(Click|KeyDown|KeyUp|KeyPress|MouseDown|MouseUp)\s*=\s*{/.test(code)) return code;

  const hasRole = /role\s*=\s*["'][^"']*["']/i.test(code);
  const emptyRole = /role\s*=\s*["']\s*["']/i.test(code);

  if (hasRole && !emptyRole) return code;

  const role = inferRoleFromCode(code);

  if (emptyRole) {
    return code.replace(/role\s*=\s*["']\s*["']/i, `role="${role}"`);
  } else {
    return code.replace(/^<(\w+)(\s[^>]*?)?>/, (_m, tag, attrs = '') => `<${tag} role="${role}"${attrs}>`);
  }
}

// === 테스트 케이스 ===
const tests = [
  {
    desc: 'role 없음 - 클릭 이벤트 있음',
    input: `<div onClick={() => alert('Clicked!')}>Click me</div>`,
    expected: `<div role="button" onClick={() => alert('Clicked!')}>Click me</div>`
  },
  {
    desc: 'role 비어 있음',
    input: `<div onClick={() => alert('Clicked!')} role="">Click me</div>`,
    expected: `<div onClick={() => alert('Clicked!')} role="button">Click me</div>`
  },
  {
    desc: 'role 있음(유효성은 검사 안함)',
    input: `<div onClick={() => alert('Invalid role')} role="abc">Click me</div>`,
    expected: `<div onClick={() => alert('Invalid role')} role="abc">Click me</div>`
  },
  {
    desc: 'href 속성 있음 → link 추론',
    input: `<div onClick={() => alert('Go')} href="#">Go</div>`,
    expected: `<div role="link" onClick={() => alert('Go')} href="#">Go</div>`
  },
  {
    desc: 'aria-checked 있음 → checkbox 추론',
    input: `<span onClick={() => alert('Toggle')} aria-checked="true">Check</span>`,
    expected: `<span role="checkbox" onClick={() => alert('Toggle')} aria-checked="true">Check</span>`
  },
  {
    desc: '이벤트 없음 → 변화 없음',
    input: `<div>Just text</div>`,
    expected: `<div>Just text</div>`
  }
];

// === 실행 ===
tests.forEach((t, i) => {
  const result = fixNoStaticElementInteractionsTest(t.input);
  const pass = result === t.expected;
  console.log(`🧪 Test ${i + 1}: ${t.desc}`);
  console.log(`INPUT   : ${t.input}`);
  console.log(`EXPECTED: ${t.expected}`);
  console.log(`RESULT  : ${result}`);
  console.log(pass ? '✅ PASS' : '❌ FAIL', '\n');
});
