import { RuleContext } from "../../rules/types";
import { parseJsxFragment, firstOpeningElement, getAttrValue, openingNameToString } from "../../utils/jsxAst";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export type AriaProp = { name: string; value: string | boolean | number | null };

export interface ElementA11yContext {
  code: string;
  fileContext: string;
  elementName: string;
  role?: string | null;
  ariaProps: AriaProp[];
  hasHandlers: boolean;
  href?: string | null;
  tabIndex?: number | null;
  disabled?: boolean;
  ariaDisabled?: boolean;
  nativeInteractive: boolean;
}

export function extractElementA11yContext(rc: RuleContext): ElementA11yContext {
  const lines = rc.fileCode.split("\n");
  const start = Math.max(0, rc.lineNumber - 2);
  const end = Math.min(lines.length, rc.lineNumber + 1);
  const fileContext = lines.slice(start, end).join("\n");

  const ast = parseJsxFragment(rc.code);

  let elementName = "div";
  let role: string | null = null;
  const ariaProps: AriaProp[] = [];
  let hasHandlers = false;
  let href: string | null = null;
  let tabIndex: number | null = null;
  let disabled = false;
  let ariaDisabled = false;

  traverse(ast, {
    Program(p) {
      const opening = firstOpeningElement(p);
      if (!opening) return;

      elementName = openingNameToString(opening);

      for (const attr of opening.attributes) {
        if (t.isJSXAttribute(attr)) {
          const { name, value } = getAttrValue(attr);
          if (!name) continue;

          if (name === "role" && typeof value === "string") role = value.toLowerCase();
          else if (name === "href" && typeof value === "string") href = value;
          else if (name === "tabIndex" && typeof value === "number") tabIndex = value;
          else if (name === "disabled" && value === true) disabled = true;
          else if (name === "aria-disabled" && (value === true || value === "true")) ariaDisabled = true;
          else if (name.startsWith("aria-")) ariaProps.push({ name, value });
          else if (/^on[A-Z]/.test(name)) hasHandlers = true;
        }
      }

      p.stop();
    }
  });

  // 네이티브 인터랙티브 추정
  const nativeInteractiveNames = new Set(["button", "input", "select", "textarea", "summary"]);
  const nativeInteractive = nativeInteractiveNames.has(elementName.toLowerCase())
    || (elementName.toLowerCase() === "a" && !!href)
    || hasHandlers
    || (tabIndex !== null && tabIndex >= 0);

  return {
    code: rc.code,
    fileContext,
    elementName,
    role,
    ariaProps,
    hasHandlers,
    href,
    tabIndex,
    disabled,
    ariaDisabled,
    nativeInteractive
  };
}
