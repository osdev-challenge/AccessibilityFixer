// test-fixRequiredAria_SafeMode_NoSnapshot.ts
// 확장용 로직을 "code(스니펫)"만으로 테스트할 수 있게 축약/모사한 버전

// ====== 원본 로직과 동일한 테이블 ======
const REQUIRED_BY_ROLE: Record<string, string[]> = {
  checkbox: ["aria-checked"],
  radio: ["aria-checked"],
  menuitemcheckbox: ["aria-checked"],
  menuitemradio: ["aria-checked"],
  switch: ["aria-checked"],
  option: ["aria-selected"],
  combobox: ["aria-expanded"],
  slider: ["aria-valuenow"],
  scrollbar: ["aria-controls", "aria-valuenow"],
  meter: ["aria-valuenow"],
  heading: ["aria-level"],
};

const ALLOWED_BY_ROLE: Record<string, string[]> = {
  checkbox: ["aria-checked", "aria-label", "aria-labelledby"],
  radio: ["aria-checked", "aria-label", "aria-labelledby"],
  menuitemcheckbox: ["aria-checked", "aria-label", "aria-labelledby"],
  menuitemradio: ["aria-checked", "aria-label", "aria-labelledby"],
  switch: ["aria-checked", "aria-label", "aria-labelledby"],
  option: ["aria-selected", "aria-label", "aria-labelledby"],
  combobox: [
    "aria-expanded","aria-controls","aria-haspopup",
    "aria-autocomplete","aria-activedescendant",
    "aria-label","aria-labelledby"
  ],
  slider: [
    "aria-valuenow","aria-valuemin","aria-valuemax",
    "aria-orientation","aria-valuetext","aria-label","aria-labelledby"
  ],
  scrollbar: [
    "aria-controls","aria-valuenow","aria-valuemin",
    "aria-valuemax","aria-orientation"
  ],
  meter: ["aria-valuenow","aria-valuemin","aria-valuemax","aria-valuetext"],
  heading: ["aria-level","aria-label","aria-labelledby"],
};

// ====== 원본과 동일한 헬퍼들 ======
function defaultValue(attr: string, role: string): string {
  switch (attr) {
    case "aria-checked":
    case "aria-selected":
    case "aria-expanded":
      return `="false"`;
    case "aria-valuenow":
      return "={0}";
    case "aria-level":
      return "={2}";
    case "aria-controls":
      return `="SCROLL_TARGET"`;
    default:
      return `=""`;
  }
}

function inferValue(line: string, role: string, attr: string): string | null {
  const has = (re: RegExp) => re.test(line);
  switch (attr) {
    case "aria-checked":
    case "aria-selected":
      if (has(/\b(active|selected|checked|is-active|is-checked)\b/)) return `="true"`;
      return null;
    case "aria-expanded":
      if (has(/\b(open|expanded|is-open|is-expanded)\b/)) return `="true"`;
      return null;
    case "aria-valuenow": {
      const mPct = line.match(/(\d+)\s*%/);
      if (mPct) return `={${Number(mPct[1])}}`;
      const mVal = line.match(/\bvalue\s*=\s*{?\s*(\d+)\s*}?/);
      if (mVal) return `={${Number(mVal[1])}}`;
      return null;
    }
    case "aria-level": {
      const mH = line.match(/\bh([1-6])\b/);
      if (mH) return `={${Number(mH[1])}}`;
      return null;
    }
    case "aria-controls":
      return null; // 플레이스홀더 유지
    default:
      return null;
  }
}

function stripUnknownAria(line: string, role: string): string {
  const allow = new Set((ALLOWED_BY_ROLE[role] ?? []).map(s => s.toLowerCase()));
  return line.replace(
    /\s(aria-[a-z0-9_-]+)\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/gi,
    (full, name: string) => allow.has(name.toLowerCase()) ? full : ""
  );
}

// ====== 테스트용 순수 함수 (VS Code 의존성 없음) ======
function applyFix(code: string): string {
  // 1) 멀티라인 spread props 있으면 보류 (변경 없음)
  if (/\{\s*\.\.\.[\s\S]*?\}/.test(code)) return code;

  // 2) role 추출
  const roleMatch = code.match(/\brole\s*=\s*["']([\w-]+)["']/i);
  if (!roleMatch) return code;
  const role = roleMatch[1].toLowerCase();

  const required = REQUIRED_BY_ROLE[role];
  if (!required) return code;

  // 3) 안전모드: 허용 외 aria-* 제거
  const cleaned = stripUnknownAria(code, role);

  // 4) "열림 태그"의 닫힘 위치(첫 번째 >)를 정확히 찾는다
  //    - 따옴표/중괄호 내부의 > 는 무시
  const start = cleaned.indexOf('<');
  if (start < 0) return code;

  let i = start + 1;
  let inS = false, inD = false, depth = 0, end = -1;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (!inD && ch === "'" && cleaned[i - 1] !== '\\') inS = !inS;
    else if (!inS && ch === '"' && cleaned[i - 1] !== '\\') inD = !inD;
    else if (!inS && !inD) {
      if (ch === '{') depth++;
      else if (ch === '}' && depth > 0) depth--;
      else if (ch === '>' && depth === 0) { end = i; break; }
    }
    i++;
  }
  if (end === -1) return code;

  // self-closing 여부: 바로 앞이 '/' 인지
  const isSelfClosing = cleaned[end - 1] === '/';

  // 5) 누락 속성 결정
  const hasAttr = (name: string) => new RegExp(`\\b${name}\\s*=`, 'i').test(cleaned.slice(start, end));
  const additions: string[] = [];
  for (const attr of required) {
    if (!hasAttr(attr)) {
      const inferred = inferValue(cleaned, role, attr);
      additions.push(`${attr}${inferred ?? defaultValue(attr, role)}`);
    }
  }
  if (!additions.length) return cleaned;

  // 6) 삽입: 열림 태그의 닫힘 직전에 한 칸 띄우고 삽입
  //    - self-closing 이면 ' />' 되도록 공백 처리
  const before = cleaned.slice(0, isSelfClosing ? end - 1 : end);
  const after  = cleaned.slice(isSelfClosing ? end - 1 : end);
  const spacer = before.endsWith(' ') ? '' : ' ';
  const fixed  = before + spacer + additions.join(' ') + after;

  return fixed;
}


// ====== 테스트 케이스 ======
type T = { desc: string; input: string; expected: string };

const cases: T[] = [
  {
    desc: "checkbox: aria-checked 누락 → 기본 false 주입",
    input: `<div role="checkbox">선택</div>`,
    expected: `<div role="checkbox" aria-checked="false">선택</div>`
  },
  {
    desc: "switch: 텍스트 힌트(is-checked) → true 추론",
    input: `<div role="switch" className="is-checked">토글</div>`,
    expected: `<div role="switch" className="is-checked" aria-checked="true">토글</div>`
  },
  {
    desc: "option: selected 힌트 → aria-selected=true",
    input: `<div role="option" className="selected">옵션</div>`,
    expected: `<div role="option" className="selected" aria-selected="true">옵션</div>`
  },
  {
    desc: "combobox: aria-expanded 누락 → false 기본값",
    input: `<div role="combobox" aria-controls="list1">검색</div>`,
    expected: `<div role="combobox" aria-controls="list1" aria-expanded="false">검색</div>`
  },
  {
    desc: "slider: % 힌트로 aria-valuenow 추론(75%)",
    input: `<div role="slider">진행 75%</div>`,
    expected: `<div role="slider" aria-valuenow={75}>진행 75%</div>`
  },
  {
    desc: "scrollbar: 필수 2개(controls, valuenow) 주입 + controls는 플레이스홀더",
    input: `<div role="scrollbar" />`,
    expected: `<div role="scrollbar" aria-controls="SCROLL_TARGET" aria-valuenow={0} />`
  },
  {
    desc: "heading: aria-level 주입(기본 2) — 추론 실패 케이스",
    input: `<div role="heading">제목</div>`,
    expected: `<div role="heading" aria-level={2}>제목</div>`
  },
  {
    desc: "heading: h3 힌트로 level=3 추론",
    input: `<div role="heading" class="h3">제목</div>`,
    expected: `<div role="heading" class="h3" aria-level={3}>제목</div>`
  },
  {
    desc: "안전모드: 허용 외 aria-* 제거 (combobox에서 aria-foo 제거)",
    input: `<div role="combobox" aria-foo="x" aria-expanded="false">검색</div>`,
    expected: `<div role="combobox" aria-expanded="false">검색</div>`
  },
  {
    desc: "meter: aria-valuenow 누락 → 0 기본값",
    input: `<div role="meter" class="m">표시</div>`,
    expected: `<div role="meter" class="m" aria-valuenow={0}>표시</div>`
  },
  {
    desc: "multiline spread props → 보류(변경 없음)",
    input: `<div
  role="checkbox"
  {...props}
>체크</div>`,
    expected: `<div
  role="checkbox"
  {...props}
>체크</div>`
  },
  {
    desc: "self-closing 태그: slider에 aria-valuenow 삽입 위치 확인",
    input: `<input role="slider" />`,
    expected: `<input role="slider" aria-valuenow={0} />`
  },
];

// ====== 실행 ======
let passAll = true;
cases.forEach((c, i) => {
  const result = applyFix(c.input);
  const pass = result === c.expected;
  passAll = passAll && pass;
  console.log(`🧪 Test ${i + 1}: ${c.desc}`);
  console.log(`INPUT   : ${c.input}`);
  console.log(`EXPECTED: ${c.expected}`);
  console.log(`RESULT  : ${result}`);
  console.log(pass ? "✅ PASS\n" : "❌ FAIL\n");
});

if (!passAll) {
  process.exitCode = 1;
}
