const testCases = [
  {
    input: `<button aria-hidden="true">버튼</button>`,
    expected: `<button>버튼</button>`
  },
  {
    input: `<input type="text" aria-hidden="true" />`,
    expected: `<input type="text" />`
  },
  {
    input: `<a href="#" aria-hidden="true">링크</a>`,
    expected: `<a href="#">링크</a>`
  },
  {
    input: `<div contenteditable aria-hidden="true">편집 가능</div>`,
    expected: `<div contenteditable>편집 가능</div>`
  },
  {
    input: `<div tabindex="0" aria-hidden="true">포커스 가능 div</div>`,
    expected: `<div tabindex="0">포커스 가능 div</div>`
  },
  {
    input: `<div aria-hidden="true">일반 div</div>`,
    expected: `<div aria-hidden="true">일반 div</div>`
  },
  {
    input: `<a aria-hidden="true">링크 없음</a>`,
    expected: `<a aria-hidden="true">링크 없음</a>`
  },
  {
    input: `<div tabindex="-1" aria-hidden="true">프로그래밍 포커스</div>`,
    expected: `<div tabindex="-1" aria-hidden="true">프로그래밍 포커스</div>`
  }
];

function fixNoAriaHiddenOnFocusable(code: string): string {
  return code.replace(
    /<(button|input|select|textarea|a|div|span)([^>]*)>/gi,
    (match, tagName, attributes) => {
      const hasAriaHidden = /\saria-hidden\s*=\s*["']true["']/i.test(attributes);
      if (!hasAriaHidden) return match;

      const isFocusable =
        tagName === 'button' ||
        tagName === 'input' ||
        tagName === 'select' ||
        tagName === 'textarea' ||
        (/^a/i.test(tagName) && /\shref\s*=\s*["'][^"']+["']/i.test(attributes)) ||
        /\stabindex\s*=\s*["'](?!-1)(\d+)["']/i.test(attributes) ||
        /\scontenteditable/i.test(attributes);

      if (isFocusable) {
        const newAttrs = attributes.replace(/\saria-hidden\s*=\s*["']true["']/i, '');
        return `<${tagName}${newAttrs}>`;
      } else {
        return match;
      }
    }
  );
}


// 실행
testCases.forEach(({ input, expected }, i) => {
  const result = fixNoAriaHiddenOnFocusable(input);
  const pass = result === expected;
  console.log(`🧪 Test ${i + 1}`);
  console.log(`  INPUT   : ${input}`);
  console.log(`  EXPECTED: ${expected}`);
  console.log(`  RESULT  : ${result}`);
  console.log(pass ? '✅ PASS\n' : '❌ FAIL\n');
});
