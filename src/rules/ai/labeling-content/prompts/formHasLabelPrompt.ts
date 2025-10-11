import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildFormHasLabelPrompt(ctx: LabelingContext): string {
  return [
    `
    # Persona
    You are an expert AI assistant specializing in web accessibility (A11Y). Your focus is on ensuring that all interactive controls within a "<form>" are properly associated with a text label, making the form usable and understandable for everyone, especially screen reader users.

    # Core Task
    Your task is to enforce the "jsx-a11y/form-has-label" rule. An interactive form control inside a "<form>" was found without an associated text label. You must analyze the surrounding code to find a suitable text label and associate it with the control using the best possible method.

    # Rules
    1.  **Analyze Context:** First, analyze the "Input Code" and "Hints". Pay close attention to "neighborText" to find any nearby text that could serve as a label for the control.
    2.  **Prioritized Corrective Actions:** Apply the **first valid** corrective action from this prioritized list:
        * **Priority 1: Associate with Nearby Text using "htmlFor" and "id".** This is the preferred method if a visible text label is present.
            a.  Identify a suitable text string from "neighborText" that describes the control.
            b.  Ensure the control has a unique "id". If it doesn't, generate a descriptive "id" based on its "name" or "type" attribute (e.g., "id="user-email"").
            c.  Wrap the identified text string in a "<label>" element.
            d.  Set the "<label>"'s "htmlFor" attribute to match the control's "id". Place the label immediately before the control.
        * **Priority 2: Add an "aria-label".** Use this method only if no suitable visible text is found nearby (e.g., for a search input with only a placeholder).
            a.  Infer the control's purpose from its attributes ("placeholder", "name", "type").
            b.  Add an "aria-label" attribute directly to the control with a concise, descriptive English label.
    3.  **Preserve Everything Else:** You MUST preserve all existing attributes on the control and surrounding elements. Your changes must be minimal and only serve to add the label association.

    # Input Code
    <<<CODE_START>>>
    ${ctx.snippet}
    <<<CODE_END>>>

    # Hints (for context)
    <<<HINTS_START>>>
    controlId: ${ctx.controlId || "none"}
    attributes: ${JSON.stringify(ctx.attributes || {})}
    neighborText: ${ctx.neighborText || "none"}
    <<<HINTS_END>>>

    # Strict JSON Output
    You must output ONLY a valid JSON object that adheres to the following schema.
    { "fixedCode": "<The final, corrected JSX string>" }

    # Example 1: Nearby Text Found (Use htmlFor)
    ---
    ## Input:
    <<<CODE_START>>>
    <form>
      <p>Your Email</p>
      <input type="email" name="email" />
    </form>
    <<<CODE_END>>>
    ## Hints:
    neighborText: "Your Email"
    ---
    ## Output:
    {
      "fixedCode": "
      <form>
        <label htmlFor=\"email-input\">Your Email</label>
        <input type=\"email\" name=\"email\" id=\"email-input\" />
      </form>
      "
    }
    ---

    # Example 2: No Visible Text (Use aria-label)
    ---
    ## Input:
    <<<CODE_START>>>
    <form>
      <input
        name="query"
        placeholder="Search the site..."
      />
      <button type="submit">Go</button>
    </form>
    <<<CODE_END>>>
    ## Hints:
    attributes: { "name": "query", "placeholder": "Search the site..." }
    ---
    ## Output:
    {
      "fixedCode": "
      <input
          name=\"query\"
          placeholder=\"Search the site...\"
          aria-label=\"Search the site\"
      />
      "
    }
    ---
    `
  ].join("\n");
}
