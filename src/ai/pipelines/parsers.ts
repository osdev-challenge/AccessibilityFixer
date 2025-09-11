/**
 * GPT 응답에서 { "fixedCode": "<JSX ...>" } 혹은
 * 코드펜스( ```json ... ``` / ``` ... ``` ) / 느슨한 JSON / 직접 JSX
 * 등 다양한 포맷을 보수적으로 처리.
 */
export function parseFixedCodeJson(resp: string): string {
  if (!resp) return "";

  const stripped = stripCodeFences(resp);

  // 1) JSON 파싱 시도
  const j1 = tryParseJson(stripped);
  if (j1 && typeof j1.fixedCode === "string") {
    return j1.fixedCode.trim();
  }

  // 2) 원문/스트립본에서 fixedCode 캡처
  const cap =
    tryExtractFixedCodeFromText(resp) ?? tryExtractFixedCodeFromText(stripped);
  if (cap) return cap.trim();

  // 3) GPT가 JSX만 준 경우 → 그대로
  return stripped.trim();
}

function stripCodeFences(s: string): string {
  const fence = s.match(/```[\s\S]*?```/g);
  if (fence && fence.length) {
    // 가장 긴 블록 사용
    let best = fence.reduce((a, b) => (a.length >= b.length ? a : b));
    best = best.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "");
    return best.trim();
  }
  return s.trim();
}

function tryParseJson(s: string): any | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function tryExtractFixedCodeFromText(s: string): string | null {
  // "fixedCode": " ... " (이스케이프 포함) 캡처
  const m = s.match(/["']fixedCode["']\s*:\s*(`([\s\S]*?)`|"([\s\S]*?)"|'([\s\S]*?)')/);
  if (!m) return null;
  const raw = m[2] ?? m[3] ?? m[4] ?? "";
  // 간단 언이스케이프
  return raw
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

/* ======================== 요소 범위 탐색 ======================== */

import * as vscode from "vscode";

export interface ElementRanges {
  tagName: string;
  openTag: vscode.Range;   // `<tag ...>`
  inner: vscode.Range;     // openTag.end ~ closeTag.start
  closeTag: vscode.Range;  // `</tag>`
  element: vscode.Range;   // openTag.start ~ closeTag.end
}

/**
 * 현재 position이 속한 요소의 open/inner/close 전체 범위를 찾는다.
 * (단순하지만 실용적인 구현: 첫 번째 짝 닫힘 태그를 찾음)
 * 복잡한 중첩/자가 포함 태그가 많은 케이스는 AST 사용 권장.
 */
export function findElementRanges(
  doc: vscode.TextDocument,
  pos: vscode.Position
): ElementRanges | null {
  const text = doc.getText();
  const off = doc.offsetAt(pos);

  // 뒤로 '<'를 찾고, 앞으로 '>'를 찾으면 openTag
  const lt = text.lastIndexOf("<", off);
  if (lt < 0) return null;
  const gt = text.indexOf(">", lt);
  if (gt < 0) return null;

  const open = text.slice(lt, gt + 1);
  const m = /^<\s*([a-zA-Z][\w:-]*)\b/.exec(open);
  if (!m) return null;
  const tag = m[1];

  // self-closing 이면 요소 전체를 openTag만으로 간주
  if (/\/\s*>$/.test(open)) {
    const openTag = new vscode.Range(doc.positionAt(lt), doc.positionAt(gt + 1));
    return {
      tagName: tag,
      openTag,
      inner: new vscode.Range(openTag.end, openTag.end),
      closeTag: new vscode.Range(openTag.end, openTag.end),
      element: openTag,
    };
  }

  // 해당 태그의 닫힘 태그 검색 (첫 매칭)
  const closeStart = text.indexOf(`</${tag}`, gt + 1);
  if (closeStart < 0) return null;
  const closeEnd = text.indexOf(">", closeStart);
  if (closeEnd < 0) return null;

  const openTag = new vscode.Range(doc.positionAt(lt), doc.positionAt(gt + 1));
  const closeTag = new vscode.Range(doc.positionAt(closeStart), doc.positionAt(closeEnd + 1));
  const inner = new vscode.Range(openTag.end, closeTag.start);
  const element = new vscode.Range(openTag.start, closeTag.end);

  return { tagName: tag, openTag, inner, closeTag, element };
}
