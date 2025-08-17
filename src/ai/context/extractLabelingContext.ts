import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { RuleContext } from "../../rules/types";
import {
  parseJsxFragment,
  firstOpeningElement,
  getAttrValue,
  openingNameToString,
} from "../../utils/jsxAst";

export type ElementLabelingContext = {
  ruleName: string;
  snippet: string;
  openingTag: string;
  attributes: Record<string, string | number | boolean | null>;
  innerText: string;
  neighborLines: string;
  isImage: boolean;
  isEmojiCandidate: boolean;
  hasAriaLabel: boolean;
  hasLabelForNearby: boolean;
  isFormControl: boolean;
};

function collectInnerTextOfFirstElement(fileAst: t.File, opening: t.JSXOpeningElement): string {
  let result: string[] = [];
  traverse(fileAst, {
    JSXElement(path) {
      if (path.node.openingElement === opening) {
        path.traverse({
          JSXText(p) {
            const txt = p.node.value.replace(/\s+/g, " ").trim();
            if (txt) result.push(txt);
          },
          StringLiteral(p) {
            const v = p.node.value.replace(/\s+/g, " ").trim();
            if (v) result.push(v);
          },
        });
        path.stop();
      }
    },
  });
  return result.join(" ").trim();
}

function buildAttrMap(opening: t.JSXOpeningElement) {
  const map: Record<string, string | number | boolean | null> = {};
  for (const a of opening.attributes) {
    if (!t.isJSXAttribute(a)) continue;
    const { name, value } = getAttrValue(a);
    if (!name) continue;
    map[name] = value;
  }
  return map;
}

export function extractLabelingContext(rc: RuleContext): ElementLabelingContext {
  const snippet = rc.codeSnippet?.trim() ?? "";
  const neighbor = rc.surroundingText ?? "";
  const fileAst = parseJsxFragment(snippet);

  let programPath: NodePath<t.Program> | null = null;
  traverse(fileAst, { Program(p) { programPath = p; p.stop(); } });
  if (!programPath) {
    return {
      ruleName: rc.ruleName, snippet, openingTag: "", attributes: {},
      innerText: "", neighborLines: neighbor, isImage: false, isEmojiCandidate: false,
      hasAriaLabel: false, hasLabelForNearby: false, isFormControl: false,
    };
  }

  const opening = firstOpeningElement(programPath);
  if (!opening) {
    return {
      ruleName: rc.ruleName, snippet, openingTag: "", attributes: {},
      innerText: "", neighborLines: neighbor, isImage: false, isEmojiCandidate: false,
      hasAriaLabel: false, hasLabelForNearby: false, isFormControl: false,
    };
  }

  const openingTag = openingNameToString(opening);
  const attributes = buildAttrMap(opening);
  const innerText = collectInnerTextOfFirstElement(fileAst, opening);

  const role = (attributes["role"] ?? "") as string;
  const isImage = openingTag === "img" || role === "img";
  const isFormControl = ["input", "select", "textarea"].includes(openingTag);
  const hasAriaLabel = Boolean(attributes["aria-label"] || attributes["aria-labelledby"]);

  const emojiRegex = /[\p{Extended_Pictographic}]/u;
  const isEmojiCandidate =
    emojiRegex.test(innerText) || role === "img" || (openingTag === "span" && attributes["aria-hidden"] !== true);

  const hasLabelForNearby = /<label[^>]*\sfor\s*=/.test(neighbor);

  return {
    ruleName: rc.ruleName,
    snippet,
    openingTag,
    attributes,
    innerText,
    neighborLines: neighbor,
    isImage,
    isEmojiCandidate,
    hasAriaLabel,
    hasLabelForNearby,
    isFormControl,
  };
}
