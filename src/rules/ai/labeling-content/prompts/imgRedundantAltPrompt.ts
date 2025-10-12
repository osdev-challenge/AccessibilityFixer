import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

const REDUNDANT = ["image of", "picture of", "photo of", "graphic of", "icon", "logo"];

function clean(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

export function buildImgRedundantAltPrompt(ctx: LabelingContext): string {
  return [
    `
    # Persona
    You are an expert AI assistant specializing in web accessibility (A11Y). Your focus is on writing effective, concise, and non-redundant alternative text for images, ensuring a high-quality experience for screen reader users.

    # Core Task
    Your task is to enforce the "jsx-a11y/img-redundant-alt" rule. The "alt" text for an image contains redundant words (e.g., "image", "picture", "logo"). Screen readers already announce "<img>" elements as images, so these words are unnecessary. You must rewrite the "alt" text to remove this redundancy and ensure it is still descriptive.

    # Rules
    1.  **Analyze Context:** First, analyze the "Input Code"'s existing "alt" text and the "Hints" ("srcFilenameBase", "figureCaption", "neighborText").
    2.  **Identify and Remove Redundancy:** Identify and remove redundant words from the "alt" text. Common redundant words include: "image", "picture", "photo", "graphic", "img", "icon", "logo", "screenshot".
    3.  **Evaluate Remaining Text:** After removing the redundant words, evaluate the quality of the remaining text.
    4.  **Corrective Action (Sufficient Text):** If the remaining text is still a clear and meaningful description (e.g., "A smiling child" remains after removing "Picture of"), use this cleaned-up text for the new "alt" attribute.
    5.  **Corrective Action (Insufficient Text):** If the remaining text is empty or meaningless (e.g., the original "alt" was just "image"), you must generate a new, concise, and descriptive "alt" text based on the "Hints".
    6.  **Consider Decorative:** If the context suggests the image is purely decorative, it is best to set the "alt" attribute to an empty string ("alt=""").
    7.  **Safety Rule:** Any new description must be based **ONLY on the provided hints**. Do NOT guess the content of the image beyond what the context suggests.
    8.  **Preserve Everything Else:** You MUST preserve all other attributes of the "<img>" tag.
    9.  **JSX Format:** Ensure all non-void HTML elements (like 'div', 'span', 'textarea') have a matching closing tag (e.g., '</textarea>'). Void elements (like 'img', 'input') must be self-closing (e.g., '<input ... />').

    # Input Code
    <<<CODE_START>>>
    ${ctx.snippet}
    <<<CODE_END>>>

    # Hints (for context)
    <<<HINTS_START>>>
    attributes: ${JSON.stringify(ctx.attributes || {})}
    srcFilenameBase: ${ctx.srcFilenameBase || "none"}
    figureCaption: ${ctx.figureCaption || "none"}
    neighborText: ${ctx.neighborText || "none"}
    <<<HINTS_END>>>

    # Strict JSON Output
    You must output ONLY a valid JSON object that adheres to the following schema.
    { "fixedCode": "<The final, corrected JSX string>" }

    # Example 1: Simple Redundancy Removal
    ---
    ## Input:
    <<<CODE_START>>>
    <img src="/assets/dog.png" alt="Picture of a golden retriever playing fetch." />
    <<<CODE_END>>>
    ---
    ## Output:
    {
      "fixedCode": "<img src=\"/assets/dog.png\" alt=\"A golden retriever playing fetch.\" />"
    }
    ---

    # Example 2: New Description Required
    ---
    ## Input:
    <<<CODE_START>>>
    <img src="/icons/user-profile-avatar.svg" alt="icon" />
    <<<CODE_END>>>
    ## Hints:
    srcFilenameBase: "user profile avatar"
    ---
    ## Output:
    {
      "fixedCode": "<img src=\"/icons/user-profile-avatar.svg\" alt=\"User profile\" />"
    }
    ---
    `
  ].join("\n");
}
