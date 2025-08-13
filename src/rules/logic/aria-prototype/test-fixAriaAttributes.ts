// test-fixAriaAttributes.ts

// 실제 fixer 내부에서 사용하는 ARIA 속성 분류 정의
const booleanAriaAttrs = [
  "aria-hidden", "aria-disabled", "aria-expanded", "aria-readonly",
  "aria-required", "aria-selected", "aria-pressed", "aria-atomic",
  "aria-busy", "aria-modal", "aria-multiline", "aria-multiselectable", "aria-grabbed"
];

const integerAriaAttrs = [
  "aria-level", "aria-posinset", "aria-setsize",
  "aria-colcount", "aria-colindex", "aria-colspan",
  "aria-rowcount", "aria-rowindex", "aria-rowspan"
];

const numberAriaAttrs = [
  "aria-valuenow", "aria-valuemin", "aria-valuemax"
];

const tokenAriaAttrs: Record<string, string[]> = {
  "aria-checked": ["true", "false", "mixed"],
  "aria-current": ["page", "step", "location", "date", "time", "true", "false"],
  "aria-haspopup": ["false", "true", "menu", "listbox", "tree", "grid", "dialog"],
  "aria-invalid": ["false", "true", "grammar", "spelling"],
  "aria-orientation": ["horizontal", "vertical"],
  "aria-sort": ["none", "ascending", "descending", "other"]
};

// 테스트 함수
function fixAriaAttributes(code: string): string {
  let fixed = code;

  fixed = fixed.replace(/(aria-[a-z-]+)=["'][^"']*["']/gi, (match, attr) => {
    return booleanAriaAttrs.includes(attr) ? `${attr}="false"` : match;
  });

  fixed = fixed.replace(/(aria-[a-z-]+)=["']([^"']*)["']/gi, (match, attr, val) => {
    if (integerAriaAttrs.includes(attr)) {
      const num = parseInt(val, 10);
      return `${attr}="${!isNaN(num) && num > 0 ? num : 1}"`;
    }
    return match;
  });

  fixed = fixed.replace(/(aria-[a-z-]+)=["']([^"']*)["']/gi, (match, attr, val) => {
    if (numberAriaAttrs.includes(attr)) {
      const num = parseFloat(val);
      return `${attr}="${!isNaN(num) ? num : 0}"`;
    }
    return match;
  });

  fixed = fixed.replace(/(aria-[a-z-]+)=["']([^"']*)["']/gi, (match, attr, val) => {
    if (tokenAriaAttrs[attr]) {
      const normalized = val.toLowerCase().trim();
      return tokenAriaAttrs[attr].includes(normalized)
        ? `${attr}="${normalized}"`
        : `${attr}="${tokenAriaAttrs[attr][0]}"`; // fallback
    }
    return match;
  });

  return fixed;
}

// =======================
// ✅ 테스트 케이스
// =======================

const testCases = [
  `<button aria-hidden="maybe">숨김</button>`,
  `<input aria-level="zero">`,
  `<div aria-valuemin="low" aria-valuemax="high" aria-valuenow="abc"></div>`,
  `<span aria-current="banana"></span>`,
  `<li aria-sort="ascending"></li>`,
  `<a aria-haspopup="popup"></a>`
];

testCases.forEach((original, i) => {
  const result = fixAriaAttributes(original);
  console.log(`🧪 Test ${i + 1}`);
  console.log(`  BEFORE: ${original}`);
  console.log(`  AFTER : ${result}`);
  console.log('-----------------------------');
});
