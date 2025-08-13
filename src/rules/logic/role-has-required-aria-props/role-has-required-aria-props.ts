import * as vscode from "vscode";
import { RuleContext, RuleFixer } from "../../types";

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
      return null;
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

/** 🔹 멀티라인 spread 감지용: 현재 range를 기준으로 열림 태그 전체 텍스트 잠깐 뽑기 */
function getOpeningTagText(document: vscode.TextDocument, range: vscode.Range): string | null {
  const text = document.getText();
  let i = document.offsetAt(range.start);
  // 뒤로 '<' 찾기
  while (i > 0 && text.charCodeAt(i) !== 60 /* '<' */) i--;
  if (text.charCodeAt(i) !== 60) return null;
  // 앞으로 '>' 찾기 (문자열/중괄호 내부의 '>'는 무시)
  let j = document.offsetAt(range.end);
  if (j < i) j = i + 1;
  let inS = false, inD = false, depth = 0;
  while (j < text.length) {
    const ch = text[j];
    if (!inD && ch === "'" && text[j-1] !== '\\') inS = !inS;
    else if (!inS && ch === '"' && text[j-1] !== '\\') inD = !inD;
    else if (!inS && !inD) {
      if (ch === '{') depth++;
      else if (ch === '}' && depth > 0) depth--;
      else if (ch === '>' && depth === 0) break;
    }
    j++;
  }
  if (j >= text.length || text[j] !== '>') return null;
  return text.slice(i, j + 1);
}

/** 🔧 열림 태그의 닫힘 기호(> 또는 />)의 정확한 삽입 위치 계산 */
function findOpenTagInsertIndex(s: string): { insertAt: number; start: number; end: number } | null {
  const start = s.indexOf('<');
  if (start < 0) return null;

  let i = start + 1;
  let inS = false, inD = false, depth = 0, end = -1;
  while (i < s.length) {
    const ch = s[i];
    if (!inD && ch === "'" && s[i - 1] !== '\\') inS = !inS;
    else if (!inS && ch === '"' && s[i - 1] !== '\\') inD = !inD;
    else if (!inS && !inD) {
      if (ch === '{') depth++;
      else if (ch === '}' && depth > 0) depth--;
      else if (ch === '>' && depth === 0) { end = i; break; }
    }
    i++;
  }
  if (end === -1) return null;

  // self-closing 여부: end 바로 앞의 공백을 건너뛰고 '/' 인지 확인
  let k = end - 1;
  while (k > start && /\s/.test(s[k])) k--;
  const isSelfClosing = s[k] === '/';

  // 삽입 위치: self-closing이면 '/' 앞, 아니면 '>' 앞
  const insertAt = isSelfClosing ? k : end;
  return { insertAt, start, end };
}

export const fixRequiredAria_SafeMode_NoSnapshot: RuleFixer = (context: RuleContext): vscode.CodeAction[] => {
  const { code, range, document } = context;

  // 1) 멀티라인 spread props 감지만 태그 전체 기준으로
  const tagText = getOpeningTagText(document, range);
  if (tagText && /\{\s*\.\.\.[\s\S]*?\}/.test(tagText)) {
    return []; // 보류
  }

  // 2) 이후 로직은 코드 기준으로 그대로 진행
  const roleMatch = code.match(/\brole\s*=\s*["']([\w-]+)["']/i);
  if (!roleMatch) return [];
  const role = roleMatch[1].toLowerCase();
  const required = REQUIRED_BY_ROLE[role];
  if (!required) return [];

  // 안전모드: 허용 외 aria-* 제거
  const cleaned = stripUnknownAria(code, role);

  // 열림 태그 닫힘 위치 계산 (첫 '>')
  const pos = findOpenTagInsertIndex(cleaned);
  if (!pos) return [];
  const { insertAt, start, end } = pos;

  // 열림 태그 내부에 이미 속성이 있는지 검사(열림 태그 범위만 검사)
  const openTagSlice = cleaned.slice(start, end);
  const hasAttr = (name: string) => new RegExp(`\\b${name}\\s*=`, 'i').test(openTagSlice);

  // 필수 속성 누락만 채움 (값 추론 → 기본값)
  const additions: string[] = [];
  for (const attr of required) {
    if (!hasAttr(attr)) {
      const inferred = inferValue(cleaned, role, attr);
      additions.push(`${attr}${inferred ?? defaultValue(attr, role)}`);
    }
  }

  // 주입할 게 없으면 변경 없음
  if (!additions.length) {
    // stripUnknownAria로 변경이 있었는지 확인
    if (cleaned === code) return [];
    // 허용 외 속성 제거만 발생 → 그 결과로 교체
    const onlyCleanEdit = new vscode.WorkspaceEdit();
    onlyCleanEdit.replace(document.uri, range, cleaned);
    const onlyCleanAction = new vscode.CodeAction(
      `[a11y] cleanup ARIA for role=${role}`,
      vscode.CodeActionKind.QuickFix
    );
    onlyCleanAction.edit = onlyCleanEdit;
    return [onlyCleanAction];
  }

  // 삽입: 열림 태그 닫힘 직전에 한 칸 띄우고 삽입
  const before = cleaned.slice(0, insertAt);
  const after  = cleaned.slice(insertAt);
  const spacer = /\s$/.test(before) ? '' : ' ';
  const fixed  = before + spacer + additions.join(' ') + after;

  if (fixed === code) return [];

  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, fixed);

  const action = new vscode.CodeAction(
    `[a11y] add required ARIA (${role}): ${additions.map(a => a.split("=")[0]).join(", ")}`,
    vscode.CodeActionKind.QuickFix
  );
  action.edit = edit;
  return [action];
};
