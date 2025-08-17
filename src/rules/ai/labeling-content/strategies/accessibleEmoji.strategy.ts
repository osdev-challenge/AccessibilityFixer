import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { ensureEmojiAccessible, hideDecorativeEmoji } from "../../../../utils/codeMods";
import { buildAccessibleEmojiPrompt } from "../prompts/accessibleEmojiPrompt";
import { approveOrNull } from "../../../../utils/scoring";


const EMOJI_LABEL_DICT: Array<{ r: RegExp; label: string }> = [
  { r: /\b(success|ok|done|passed|complete|check|checked)\b/i, label: "success" },
  { r: /\b(warn|warning|caution|attention)\b/i, label: "warning" },
  { r: /\b(error|fail|failed|issue|problem|bug)\b/i, label: "error" },
  { r: /\b(info|information|details)\b/i, label: "information" },
  { r: /\b(star|favorite|bookmark)\b/i, label: "star" },
  { r: /\b(heart|love|like)\b/i, label: "love" },
  { r: /\b(smile|happy|joy)\b/i, label: "smile" },
  { r: /\b(download|save)\b/i, label: "download" },
  { r: /\b(delete|remove|trash)\b/i, label: "delete" },
  { r: /\b(close|dismiss|cancel)\b/i, label: "close" },
];

function chooseEmojiLabel(neighbor: string, attrs: Record<string, any>): string | null {
  const hay = [neighbor, String(attrs["class"]||""), String(attrs["id"]||""), String(attrs["name"]||"")].join(" ");
  const hit = EMOJI_LABEL_DICT.find(d => d.r.test(hay));
  return hit?.label ?? null;
}

export const AccessibleEmojiStrategy = {
  name: "accessible-emoji",
  buildPrompt: buildAccessibleEmojiPrompt,
  tryLogic(ctx: ElementLabelingContext): string | null {
    if (!ctx.isEmojiCandidate) return null;

    const label = chooseEmojiLabel(ctx.neighborLines, ctx.attributes);

    if (label) {
      const out = ensureEmojiAccessible(ctx.snippet, label);
      return approveOrNull(out, ["emojiSemantic"]);
    }

    const out = hideDecorativeEmoji(ctx.snippet);
    return approveOrNull(out, ["emojiDecorative"]);
  },
};
