import { parseJsxFragment, unwrapGenerated } from "./jsxAst";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import { isValidAriaProp } from "./ariaSpec";

// 첫 JSX 요소에서 role 속성 제거
export function removeRoleAst(code: string): string {
  const ast = parseJsxFragment(code);
  traverse(ast, {
    JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
      if (
        path.parentPath &&
        t.isJSXElement(path.parentPath.node) &&
        path.parentPath.node.openingElement === path.node
      ) {
        path.node.attributes = path.node.attributes.filter(attr => {
          return !(t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === "role");
        });
        path.stop();
      }
    }
  });
  const out = generate(ast, { jsescOption: { minimal: true } }).code;
  return unwrapGenerated(out);
}

// 첫 JSX 요소에서 유효하지 않은 aria-* 제거
export function removeInvalidAriaPropsAst(code: string): string {
  const ast = parseJsxFragment(code);
  traverse(ast, {
    JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
      if (
        path.parentPath &&
        t.isJSXElement(path.parentPath.node) &&
        path.parentPath.node.openingElement === path.node
      ) {
        path.node.attributes = path.node.attributes.filter(attr => {
          if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
            const n = attr.name.name;
            if (n.startsWith("aria-") && !isValidAriaProp(n)) return false;
          }
          return true;
        });
        path.stop();
      }
    }
  });
  const out = generate(ast, { jsescOption: { minimal: true } }).code;
  return unwrapGenerated(out);
}
