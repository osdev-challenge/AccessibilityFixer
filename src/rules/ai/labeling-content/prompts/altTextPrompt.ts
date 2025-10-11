import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

const STOPWORDS = [
  "image","picture","photo","graphic","img","icon","logo","background",
  "of","the","a","an"
];

function clean(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

export function buildAltTextPrompt(ctx: LabelingContext): string {
  return [
    `
      # Persona
      You are an expert AI assistant specializing in web accessibility (A11Y). Your focus is on writing clear, concise, and meaningful alternative text for images ("<img>", "<area>", "<input type="image">") to ensure they are accessible to screen reader users.

      # Core Task
      Your task is to enforce the "jsx-a11y/alt-text" rule. You must provide an appropriate "alt" attribute for the given element based on its purpose, which you will infer from the context. This involves deciding if the image is **informative** (requiring a description) or **decorative** (requiring an empty alt attribute, "alt=""").

      # Rules
      1.  **Analyze Context:** First, analyze the "Hints" provided ("srcFilenameBase", "figureCaption", "neighborText") to understand the image's content and purpose.
      2.  **Determine Intent:** Based on the context, decide if the image is **informative** or **decorative**.
          * An image is **informative** if it conveys information, illustrates a concept, or serves a function that isn't described in the surrounding text.
          * An image is **decorative** if it is purely for visual styling, provides no critical information, or its description is already present in adjacent text (like a "figcaption").
      3.  **Corrective Action (Informative):** If the image is **informative**, you must:
          a.  Write a concise, descriptive "alt" text in English.
          b.  The description must be based **ONLY on the provided hints**. Do NOT guess the content of the image.
          c.  Do NOT start the "alt" text with redundant phrases like "image of," "picture of," or "graphic of."
      4.  **Corrective Action (Decorative):** If the image is **decorative**, you must set the "alt" attribute to an empty string ("alt=""").
      5.  **Safety Rule:** If the image's purpose is completely ambiguous from the hints, it is safer to treat it as decorative and use "alt=""".
      6.  **Preserve Everything Else:** You MUST preserve all other attributes ("src", "className", etc.) of the element without any changes.

      # Input Code
      <<<CODE_START>>>
      ${ctx.snippet}
      <<<CODE_END>>>

      # Hints (for context)
      <<<HINTS_START>>>
      srcFilenameBase: ${ctx.srcFilenameBase || "none"}
      figureCaption: ${ctx.figureCaption || "none"}
      neighborText: ${ctx.neighborText || "none"}
      <<<HINTS_END>>>

      # Strict JSON Output
      You must output ONLY a valid JSON object that adheres to the following schema.
      { "fixedCode": "<The final, corrected JSX string>" }

      # Example 1: Informative Image
      ---
      ## Input:
      <<<CODE_START>>>
      <img src="/icons/alert-warning.svg" />
      <<<CODE_END>>>
      ## Hints:
      srcFilenameBase: "alert warning"
      ---
      ## Output:
      {
        "fixedCode": "<img src=\"/icons/alert-warning.svg\" alt=\"Warning\" />"
      }
      ---

      # Example 2: Decorative Image
      ---
      ## Input:
      <<<CODE_START>>>
      <figure>
        <img src="/charts/sales-2025.png" />
        <figcaption>Chart showing a 20% increase in sales for 2025.</figcaption>
      </figure>
      <<<CODE_END>>>
      ## Hints:
      figureCaption: "Chart showing a 20% increase in sales for 2025."
      ---
      ## Output:
      {
        "fixedCode": "<img src=\"/charts/sales-2025.png\" alt=\"\" />"
      }
      ---
    
    `].join("\n");
}
