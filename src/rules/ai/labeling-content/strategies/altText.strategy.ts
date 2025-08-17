import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { ensureAlt, removeRedundantAlt, guardDecorative } from "../../../../utils/codeMods";
import { buildAltTextPrompt } from "../prompts/altTextPrompt";
import { approveOrNull } from "../../../../utils/scoring";

const STOPWORDS = ["the","a","an","of","for","and","to","in","on","with","by","at","from",
  "image","picture","photo","graphic","img","icon","logo","background"];

function cleanPhrase(s: string) {
  return s.replace(/\.(png|jpe?g|gif|svg)$/i, "").replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
}
function tokenize(s: string) {
  return cleanPhrase(s)
    .split(/\s+/)
    .filter(w => w && !STOPWORDS.includes(w.toLowerCase()) && !/^[0-9a-f]{6,}$/i.test(w));
}
function pickTopWords(s: string, max = 8) { return tokenize(s).slice(0, max).join(" "); }

function extractCaptionHint(neighbor: string): string | null {
  const m =
    neighbor.match(/figcaption\s*[:\-]?\s*([^\n]+)/i) ||
    neighbor.match(/caption\s*[:\-]?\s*([^\n]+)/i) ||
    neighbor.match(/title\s*[:\-]?\s*([^\n]+)/i);
  if (!m) return null;
  const cand = pickTopWords(m[1], 12);
  return cand || null;
}
function extractLabelledByHint(neighbor: string, labelledBy?: string | number | boolean | null): string | null {
  if (!labelledBy || typeof labelledBy !== "string") return null;
  const id = labelledBy.trim().split(/\s+/)[0];
  const r = new RegExp(`${id}["'][^>]*>([^<]{1,120})<`, "i");
  const m = neighbor.match(r);
  if (m) {
    const cand = pickTopWords(m[1], 12);
    return cand || null;
  }
  return null;
}
function extractFromSrcFilename(src?: string): string | null {
  if (!src) return null;
  const file = src.split(/[\\/]/).pop() || "";
  const words = tokenize(file).slice(0, 6).join(" ");
  return words || null;
}

export const AltTextStrategy = {
  name: "alt-text",
  buildPrompt: buildAltTextPrompt,
  tryLogic(ctx: ElementLabelingContext): string | null {
    if (!ctx.isImage) return null;

    // 선처리: 금지어 제거
    let working = removeRedundantAlt(ctx.snippet);

    // 장식 힌트
    const decorativeHint =
      ctx.attributes["role"] === "presentation" ||
      ctx.attributes["aria-hidden"] === true ||
      /\b(icon|decorative|spacer|separator)\b/i.test(String(ctx.attributes["className"] || ctx.attributes["class"] || ""));

    if (!/alt\s*=/i.test(working)) {
      // alt 없음 → 보수적 생성
      let evidences: ("caption"|"labelledby"|"filename"|"decorative")[] = [];
      let alt = "";

      if (!decorativeHint) {
        const cap = extractCaptionHint(ctx.neighborLines);
        const ll = extractLabelledByHint(ctx.neighborLines, ctx.attributes["aria-labelledby"]);
        const fn = extractFromSrcFilename(typeof ctx.attributes["src"] === "string" ? ctx.attributes["src"] : undefined);
        alt = (cap || ll || fn || "");
        if (cap) evidences.push("caption");
        else if (ll) evidences.push("labelledby");
        else if (fn) evidences.push("filename");
        else evidences.push("decorative");
      } else {
        evidences.push("decorative");
      }

      working = alt ? ensureAlt(working, alt.slice(0, 80)) : guardDecorative(working);
      return approveOrNull(working, evidences);
    }

    // alt 존재: 금지어 제거로 바뀌었으면 결정적
    if (working !== ctx.snippet) {
      return approveOrNull(working, ["deterministic"]);
    }

    // 변화나 확실한 개선 없음 → AI 폴백
    return null;
  },
};
