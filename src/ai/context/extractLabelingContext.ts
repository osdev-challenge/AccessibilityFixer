import { RuleContext } from "../../rules/types";
export type LabelingContext = {
  // 위치/범위
  filePath: string;
  line: number;              // 1-based 표시용
  snippet: string;           // 문제 구간 코드 스니펫
  neighborText?: string;     // 주변 텍스트(±N줄) — 프롬프트 힌트

  // 대상 노드 정보
  tagName?: string;          // img, input, button, label, form 등
  attributes?: Record<string, string | true>;
  textContent?: string;      // 내부 텍스트(이모지 포함)
  roleComputed?: string;     // role 속성 또는 단순 휴리스틱으로 계산

  // 구조/연결 정보
  idMap?: Record<string, { text?: string; tag?: string }>;  // id -> 텍스트/태그
  labelForMap?: Record<string, string[]>;                   // for/htmlFor -> label 텍스트들
  controlId?: string;                                       // 대상 컨트롤의 id
  associatedLabelText?: string;                             // label/aria-labelledby 기반 텍스트
  isFormAncestor?: boolean;                                 // 주변에 form 존재 추정
  controlType?: "text" | "button" | "checkbox" | "radio" | "select" | "textarea" | "other";

  // 이미지 전용 힌트
  srcFilenameBase?: string;   // 파일명(확장자 제거, 구분자 정리)
  figureCaption?: string;     // 인근 figcaption 텍스트

  // 이모지 힌트
  emojiSequence?: string[];
};

/** JSX 태그 제거 + {…} 표현 최소 제거 후 평문만 남기기 */
function stripJsxToText(s: string): string {
  // 제거 순서: 주석 -> script/style -> 태그 -> JSX 표현 -> 공백 정리
  return s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[A-Za-z][\w:-]*\b[^>]*>/g, " ")
    .replace(/<\/[A-Za-z][\w:-]*>/g, " ")
    .replace(/\{[\s\S]*?\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 간단한 JSX 시작 태그에서 태그명 추출 */
function detectTagName(snippet: string): string | undefined {
  const m = snippet.match(/<\s*([A-Za-z][\w:-]*)\b/);
  return m?.[1]?.toLowerCase();
}

/** JSX 속성 파싱(문자열/JSX 표현/불리언 속성 대응, 단순 휴리스틱) */
function parseAttributes(snippet: string): Record<string, string | true> {
  const attrs: Record<string, string | true> = {};
  const openTag = snippet.match(/<\s*[A-Za-z][\w:-]*\b([^>]*)>/);
  if (!openTag) return attrs;
  const raw = openTag[1] ?? "";

  // key="value" | key='value' | key={`...`} | key={"..."} | key | key={true}
  const attrRegex =
    /\b([:@A-Za-z_][\w:-]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\{[\s\S]*?\})|\b([:@A-Za-z_][\w:-]*)\b/g;

  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(raw))) {
    if (m[1] && m[2]) {
      const key = m[1];
      let val = m[2].trim();

      if (val.startsWith("{") && val.endsWith("}")) {
        // JSX 표현 — 문자열 리터럴이면 추출
        const inner = val.slice(1, -1).trim();
        const strLit = inner.match(/^["'`](.*)["'`]$/);
        attrs[key] = strLit ? strLit[1] : inner; // 표현식 원문 보관
      } else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        attrs[key] = val.slice(1, -1);
      } else {
        attrs[key] = val;
      }
    } else if (m[3]) {
      const key = m[3];
      attrs[key] = true; // 불리언 속성
    }
  }
  return attrs;
}

/** 시작/종료 태그 사이 텍스트(대략) */
function extractInnerText(snippet: string): string | undefined {
  // 단일 태그(img,input 등)는 내부 텍스트 없음
  if (/\/\s*>$/.test(snippet)) return undefined;
  const open = snippet.match(/<\s*([A-Za-z][\w:-]*)\b[^>]*>/);
  if (!open) return undefined;
  const tag = open[1];
  const re = new RegExp(`<\\s*${tag}\\b[^>]*>([\\s\\S]*?)<\\/\\s*${tag}\\s*>`, "i");
  const m = snippet.match(re);
  if (!m) return undefined;
  const text = stripJsxToText(m[1]);
  return text || undefined;
}

/** 파일 전체에서 id -> 텍스트/태그 매핑(얕은 휴리스틱) */
function buildIdMap(fileCode: string): Record<string, { text?: string; tag?: string }> {
  const map: Record<string, { text?: string; tag?: string }> = {};
  const tagRegex =
    /<\s*([A-Za-z][\w:-]*)\b([^>]*)>([\s\S]*?)<\/\s*\1\s*>|<\s*([A-Za-z][\w:-]*)\b([^>]*)\/\s*>/g;

  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(fileCode))) {
    const tagName = (m[1] || m[4])?.toLowerCase();
    const attrsRaw = (m[2] || m[5]) ?? "";
    const idMatch = attrsRaw.match(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{["'`]([^"'`]+)["'`]\})/);
    if (!idMatch) continue;
    const id = idMatch[1] || idMatch[2] || idMatch[3];
    const inner = m[3] ?? "";
    map[id] = {
      tag: tagName,
      text: stripJsxToText(inner),
    };
  }
  return map;
}

/** label htmlFor/for -> label 텍스트 배열 매핑 */
function buildLabelForMap(fileCode: string): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  const labelRegex =
    /<\s*label\b([^>]*)>([\s\S]*?)<\/\s*label\s*>|<\s*label\b([^>]*)\/\s*>/gi;

  let m: RegExpExecArray | null;
  while ((m = labelRegex.exec(fileCode))) {
    const attrsRaw = (m[1] || m[3]) ?? "";
    const text = stripJsxToText(m[2] ?? "");
    const forMatch =
      attrsRaw.match(/\b(htmlFor|for)\s*=\s*(?:"([^"]+)"|'([^']+)'|\{["'`]([^"'`]+)["'`]\})/i);
    if (!forMatch) continue;
    const target = forMatch[2] || forMatch[3] || forMatch[4];
    if (!map[target]) map[target] = [];
    if (text) map[target].push(text);
  }
  return map;
}

/** control 타입 */
function guessControlType(
  tag?: string,
  attrs?: Record<string, string | true>
): LabelingContext["controlType"] {
  const t = (tag ?? "").toLowerCase();
  const typeAttr = typeof attrs?.type === "string" ? String(attrs!.type).toLowerCase() : "";

  if (t === "textarea") return "textarea";
  if (t === "select") return "select";
  if (t === "input") {
    if (["button", "submit", "reset"].includes(typeAttr)) return "button";
    if (["checkbox"].includes(typeAttr)) return "checkbox";
    if (["radio"].includes(typeAttr)) return "radio";
    return "text";
  }
  if (t === "button") return "button";
  return "other";
}

/** 간단한 role 계산 */
function computeRole(tag?: string, attrs?: Record<string, string | true>): string | undefined {
  const roleAttr = typeof attrs?.role === "string" ? String(attrs!.role) : undefined;
  if (roleAttr) return roleAttr;

  const t = (tag ?? "").toLowerCase();
  const hasHref = !!attrs?.["href"];
  const typeAttr = typeof attrs?.type === "string" ? String(attrs!.type).toLowerCase() : "";

  if (t === "button" || (t === "input" && ["button", "submit", "reset"].includes(typeAttr))) return "button";
  if (t === "a" && hasHref) return "link";
  if (t === "img") return "img";
  if (t === "label") return "label";
  if (t === "form") return "form";
  return undefined;
}

/** 파일명 기반 텍스트 */
function baseNameFromSrc(src?: string): string | undefined {
  if (!src || typeof src !== "string") return undefined;
  const m = src.match(/[^/\\]+$/);
  if (!m) return undefined;
  const name = m[0].replace(/\.(png|jpe?g|gif|svg|webp|avif)$/i, "");
  return name.replace(/[_\-]+/g, " ").trim();
}

/** 인근 figcaption 텍스트(±10줄) */
function findNearbyFigcaption(lines: string[], lineNumber: number): string | undefined {
  const start = Math.max(0, lineNumber - 10);
  const end = Math.min(lines.length - 1, lineNumber + 10);
  const slice = lines.slice(start, end + 1).join("\n");
  const m = slice.match(/<\s*figcaption\b[^>]*>([\s\S]*?)<\/\s*figcaption\s*>/i);
  if (!m) return undefined;
  const text = stripJsxToText(m[1]);
  return text || undefined;
}

/** 주변에 form이 있는지(±20줄) */
function isNearForm(lines: string[], lineNumber: number): boolean {
  const start = Math.max(0, lineNumber - 20);
  const end = Math.min(lines.length - 1, lineNumber + 20);
  const slice = lines.slice(start, end + 1).join("\n");
  return /<\s*form\b/i.test(slice);
}

/** 이모지 시퀀스 추출(간단 범위 기반) */
function extractEmojis(text?: string): string[] | undefined {
  if (!text) return undefined;
  // BMP 기반 + 일부 확장 — 실용적 커버리지
  const re = /[\u203C-\u3299\u1F000-\u1FAFF\u1F300-\u1FAD6\u1F600-\u1F64F\u1F680-\u1F6FF\u2600-\u27BF]/g;
  const list = text.match(re) || [];
  return list.length ? list : undefined;
}

/** aria-labelledby -> 연결 텍스트 생성 */
function computeAssociatedLabelText(
  attrs: Record<string, string | true> | undefined,
  idMap: Record<string, { text?: string; tag?: string }> | undefined,
  labelForMap: Record<string, string[]> | undefined,
  controlId: string | undefined
): string | undefined {
  // 1) aria-labelledby 우선
  const labelledby = typeof attrs?.["aria-labelledby"] === "string" ? String(attrs!["aria-labelledby"]) : undefined;
  if (labelledby) {
    const ids = labelledby.split(/\s+/).filter(Boolean);
    const texts = ids
      .map((id) => idMap?.[id]?.text)
      .filter((t): t is string => !!t);
    if (texts.length) return texts.join(" ").trim();
  }
  // 2) controlId와 labelForMap
  if (controlId && labelForMap?.[controlId]?.length) {
    return labelForMap[controlId].join(" ").trim();
  }
  return undefined;
}

/** RuleContext -> LabelingContext */
export function extractLabelingContext(rc: RuleContext): LabelingContext {
  const { document, fileCode, code, lineNumber } = rc;

  const lines = fileCode.split(/\r?\n/);
  const neighborStart = Math.max(0, lineNumber - 6);
  const neighborEnd = Math.min(lines.length - 1, lineNumber + 6);
  const neighborSlice = lines.slice(neighborStart, neighborEnd + 1).join("\n");
  const neighborText = stripJsxToText(neighborSlice);

  const tagName = detectTagName(code);
  const attributes = parseAttributes(code);
  const textContent = extractInnerText(code);

  const idMap = buildIdMap(fileCode);
  const labelForMap = buildLabelForMap(fileCode);

  const controlId =
    (typeof attributes.id === "string" ? (attributes.id as string) : undefined) || undefined;

  const associatedLabelText = computeAssociatedLabelText(attributes, idMap, labelForMap, controlId);

  const roleComputed = computeRole(tagName, attributes);
  const isFormAncestor = isNearForm(lines, lineNumber);
  const controlType = guessControlType(tagName, attributes);

  const src =
    (typeof attributes.src === "string" ? (attributes.src as string) : undefined) || undefined;
  const srcFilenameBase = baseNameFromSrc(src);
  const figureCaption = findNearbyFigcaption(lines, lineNumber);

  const emojis = extractEmojis(textContent);

  return {
    filePath: document.uri.fsPath,
    line: lineNumber + 1, // 1-based
    snippet: code,
    neighborText,

    tagName,
    attributes,
    textContent,
    roleComputed,

    idMap,
    labelForMap,
    controlId,
    associatedLabelText,
    isFormAncestor,
    controlType,

    srcFilenameBase,
    figureCaption,

    emojiSequence: emojis,
  };
}
