import { RuleContext } from "../../rules/types";
import { parseJsxFragment, firstOpeningElement, getAttrValue, openingNameToString } from "../../utils/jsxAst";
import traverse from "@babel/traverse";
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
  /** 보강: 추가 신호 (optional) */
  inputType?: string | null;
  contentEditable?: boolean | null;
  mediaControls?: boolean | null; // audio/video controls
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

  // 보강: 추가 탐지용
  let inputType: string | null = null;
  let contentEditable: boolean | null = null;
  let mediaControls: boolean | null = null;

  traverse(ast, {
    Program(p) {
      const opening = firstOpeningElement(p);
      if (!opening) return;

      elementName = openingNameToString(opening);
      const el = elementName.toLowerCase();

      for (const attr of opening.attributes) {
        if (!t.isJSXAttribute(attr)) continue;
        const { name, value } = getAttrValue(attr);
        if (!name) continue;

        if (name === "role" && typeof value === "string") {
          role = value.toLowerCase();
        } else if (name === "href" && typeof value === "string") {
          href = value;
        } else if (name === "tabIndex" && typeof value === "number") {
          tabIndex = value;
        } else if (name === "disabled" && value === true) {
          disabled = true;
        } else if (name === "aria-disabled" && (value === true || value === "true")) {
          ariaDisabled = true;
        } else if (name.startsWith("aria-")) {
          ariaProps.push({ name, value });
        } else if (/^on[A-Z]/.test(name)) {
          hasHandlers = true;
        }

        // 보강: 요소별 추가 신호
        if (el === "input" && name === "type" && typeof value === "string") {
          inputType = value.toLowerCase();
        }
        if (name === "contentEditable") {
          // true | "true" | ""(존재만) 처리
          contentEditable = value === true || value === "true" || value === "";
        }
        if ((el === "audio" || el === "video") && name === "controls") {
          mediaControls = value === true || value === "" || value === "true";
        }
      }

      p.stop();
    }
  });

  // 네이티브 인터랙티브 추정
  const el = elementName.toLowerCase();
  const nativeInteractiveNames = new Set(["button", "input", "select", "textarea", "summary"]);

  const isAnchorInteractive = el === "a" && !!href; // href 없는 a는 비인터랙티브 취급
  const isInputInteractive =
    el === "input" && (inputType === null || inputType !== "hidden"); // hidden은 제외
  const isMediaInteractive =
    (el === "audio" || el === "video") && !!mediaControls; // controls 있을 때만
  const hasFocusByTabIndex = tabIndex !== null && tabIndex >= 0;
  const isContentEditable = contentEditable === true;

  const nativeInteractive =
    nativeInteractiveNames.has(el) ||
    isAnchorInteractive ||
    isInputInteractive ||
    isMediaInteractive ||
    hasHandlers ||
    isContentEditable ||
    hasFocusByTabIndex;

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
    inputType,
    contentEditable,
    mediaControls,
    nativeInteractive
  };
}
