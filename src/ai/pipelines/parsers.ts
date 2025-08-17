/**
 * GPT 응답에서 { "fixedCode": "<JSX ...>" } 혹은
 * 코드펜스( ```json ... ``` / ``` ... ``` ) / 느슨한 JSON / 직접 JSX
 * 등 다양한 포맷을 보수적으로 처리.
 */
function stripCodeFences(s: string): string {
  // ```json ... ``` 또는 ``` ... ```
  const fence = s.match(/```[\s\S]*?```/g);
  if (fence && fence.length) {
    // 가장 긴 블록을 선택
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
  // "fixedCode": " ... " (이스케이프 포함) 형태 캡쳐
  const m = s.match(/"fixedCode"\s*:\s*"([\s\S]*?)"/);
  if (!m) return null;
  // 간단한 언이스케이프
  return m[1]
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .trim();
}

export function parseFixedCodeJson(resp: string): string {
  if (!resp) return "";

  // 1) 코드펜스 제거 시도
  const stripped = stripCodeFences(resp);

  // 2) JSON 파싱 시도
  const j1 = tryParseJson(stripped);
  if (j1 && typeof j1.fixedCode === "string") {
    return j1.fixedCode.trim();
  }

  // 3) 원문 전체에서 fixedCode 문자열 캡쳐 시도
  const cap = tryExtractFixedCodeFromText(resp) ?? tryExtractFixedCodeFromText(stripped);
  if (cap) return cap.trim();

  // 4) 혹시 GPT가 바로 JSX만 준 경우 → 그대로 반환
  return stripped.trim();
}
