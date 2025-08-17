import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export function parseJsxFragment(code: string) {
  const wrapped = `<>${code}</>`;
  return parse(wrapped, { sourceType: "module", plugins: ["jsx", "typescript"] });
}

export function unwrapGenerated(code: string): string {
  return code.replace(/^\s*<>\s*/, "").replace(/\s*<\/>\s*;?\s*$/, "");
}

export function firstOpeningElement(path: NodePath): t.JSXOpeningElement | null {
  let found: t.JSXOpeningElement | null = null;
  path.traverse({
    JSXOpeningElement(p: NodePath<t.JSXOpeningElement>) {
      if (
        p.parentPath &&
        t.isJSXElement(p.parentPath.node) &&
        p.parentPath.node.openingElement === p.node &&
        !found
      ) {
        found = p.node;
        p.stop();
      }
    }
  });
  return found;
}

export function getAttrValue(attr: t.JSXAttribute | t.JSXSpreadAttribute) {
  if (!t.isJSXAttribute(attr)) return { name: "", value: null as any };
  const name = t.isJSXIdentifier(attr.name) ? attr.name.name : "";
  if (!name) return { name, value: null as any };
  if (!attr.value) return { name, value: true };
  if (t.isStringLiteral(attr.value)) return { name, value: attr.value.value };
  if (t.isJSXExpressionContainer(attr.value)) {
    const e = attr.value.expression;
    if (t.isStringLiteral(e)) return { name, value: e.value };
    if (t.isBooleanLiteral(e)) return { name, value: e.value };
    if (t.isNumericLiteral(e)) return { name, value: e.value };
    return { name, value: null as any };
  }
  return { name, value: null as any };
}

export function openingNameToString(opening: t.JSXOpeningElement): string {
  const n = opening.name;
  if (t.isJSXIdentifier(n)) return n.name;
  if (t.isJSXMemberExpression(n)) {
    const parts: string[] = [];
    let cur: t.JSXMemberExpression | t.JSXIdentifier = n;
    while (t.isJSXMemberExpression(cur)) {
      parts.unshift((cur.property as t.JSXIdentifier).name);
      cur = cur.object as any;
    }
    if (t.isJSXIdentifier(cur)) parts.unshift(cur.name);
    return parts.join(".");
  }
  return "Unknown";
}
