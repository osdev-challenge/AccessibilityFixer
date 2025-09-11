import { parseJsxFragment, unwrapGenerated } from "./jsxAst";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import { isValidAriaProp } from "./ariaSpec";

/* ============================================================================
 * 내부 헬퍼: 첫 JSXOpeningElement에만 적용하는 안전한 AST 수정기
 * ==========================================================================*/

function editFirstOpeningAttr(
  code: string,
  editor: (opening: t.JSXOpeningElement, getTagName: () => string) => void
): string {
  const ast = parseJsxFragment(code);

  traverse(ast, {
    JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
      // 파일 내 첫 JSX 요소의 openingElement만 대상으로 함
      if (
        path.parentPath &&
        t.isJSXElement(path.parentPath.node) &&
        path.parentPath.node.openingElement === path.node
      ) {
        const opening = path.node;
        const getTagName = () => {
          const n = opening.name;
          if (t.isJSXIdentifier(n)) return n.name;
          if (t.isJSXMemberExpression(n)) {
            // <X.Y> 같은 복합은 첫 파트만 기준 태그로 인식
            let cur: t.JSXMemberExpression | t.JSXIdentifier = n;
            while (t.isJSXMemberExpression(cur)) cur = cur.object as any;
            return t.isJSXIdentifier(cur) ? cur.name : "Unknown";
          }
          return "Unknown";
        };
        editor(opening, getTagName);
        path.stop();
      }
    },
  });

  const out = generate(ast, { jsescOption: { minimal: true } }).code;
  return unwrapGenerated(out);
}

function findAttrIndex(opening: t.JSXOpeningElement, name: string): number {
  return opening.attributes.findIndex(
    (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === name
  );
}

function upsertStringAttr(opening: t.JSXOpeningElement, name: string, value: string) {
  const idx = findAttrIndex(opening, name);
  const literal = t.stringLiteral(value);
  const attr = t.jsxAttribute(t.jsxIdentifier(name), literal);

  if (idx >= 0) {
    const cur = opening.attributes[idx];
    if (t.isJSXAttribute(cur)) {
      cur.value = literal;
    } else {
      opening.attributes[idx] = attr;
    }
  } else {
    opening.attributes.push(attr);
  }
}

function upsertBooleanAttr(opening: t.JSXOpeningElement, name: string, boolValue: boolean) {
  const idx = findAttrIndex(opening, name);
  const boolExpr = t.jsxExpressionContainer(t.booleanLiteral(boolValue));
  const attr = t.jsxAttribute(t.jsxIdentifier(name), boolExpr);

  if (idx >= 0) {
    const cur = opening.attributes[idx];
    if (t.isJSXAttribute(cur)) {
      cur.value = boolExpr;
    } else {
      opening.attributes[idx] = attr;
    }
  } else {
    opening.attributes.push(attr);
  }
}

function removeAttr(opening: t.JSXOpeningElement, name: string) {
  const idx = findAttrIndex(opening, name);
  if (idx >= 0) opening.attributes.splice(idx, 1);
}

function readStringAttr(opening: t.JSXOpeningElement, name: string): string | null {
  const idx = findAttrIndex(opening, name);
  if (idx < 0) return null;
  const attr = opening.attributes[idx];
  if (!t.isJSXAttribute(attr) || !attr.value) return null;
  if (t.isStringLiteral(attr.value)) return attr.value.value;
  if (t.isJSXExpressionContainer(attr.value) && t.isStringLiteral(attr.value.expression)) {
    return attr.value.expression.value;
  }
  return null;
}

/* ============================================================================
 * aria-role 계열 (기존 함수 유지)
 * ==========================================================================*/

// 첫 JSX 요소에서 role 속성 제거
export function removeRoleAst(code: string): string {
  return editFirstOpeningAttr(code, (opening) => {
    removeAttr(opening, "role");
  });
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
        path.node.attributes = path.node.attributes.filter((attr) => {
          if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
            const n = attr.name.name;
            if (n.startsWith("aria-") && !isValidAriaProp(n)) return false;
          }
          return true;
        });
        path.stop();
      }
    },
  });
  const out = generate(ast, { jsescOption: { minimal: true } }).code;
  return unwrapGenerated(out);
}

/* ============================================================================
 * labeling-content 계열: alt / emoji / id / aria-label
 *  - 모두 AST 기반으로 안전 수정
 * ==========================================================================*/

/** 금지어 패턴 제거용(alt 값 내부) */
const ALT_REDUNDANT_RE = /\b(?:image|picture|photo|graphic)\s+of\s*/gi;

/** img 또는 role="img" 판단 */
function isImageOpening(opening: t.JSXOpeningElement, getTagName: () => string): boolean {
  const tag = getTagName().toLowerCase();
  const role = readStringAttr(opening, "role")?.toLowerCase();
  return tag === "img" || role === "img";
}

/** alt 값의 금지 표현 제거 (alt 없으면 변경 없음) */
export function removeRedundantAlt(code: string): string {
  return editFirstOpeningAttr(code, (opening, getTagName) => {
    if (!isImageOpening(opening, getTagName)) return;
    const cur = readStringAttr(opening, "alt");
    if (cur == null) return;
    const next = cur.replace(ALT_REDUNDANT_RE, "");
    if (next !== cur) upsertStringAttr(opening, "alt", next);
  });
}

/** alt 보장: 이미지 요소면 alt를 nextAlt로 추가/치환 */
export function ensureAlt(code: string, nextAlt: string): string {
  return editFirstOpeningAttr(code, (opening, getTagName) => {
    if (!isImageOpening(opening, getTagName)) return;
    upsertStringAttr(opening, "alt", nextAlt);
  });
}

/** 장식적 이미지 처리: alt="" 강제 */
export function guardDecorative(code: string): string {
  return editFirstOpeningAttr(code, (opening, getTagName) => {
    if (!isImageOpening(opening, getTagName)) return;
    upsertStringAttr(opening, "alt", "");
  });
}

/** 의미 있는 이모지: role="img" + aria-label */
export function ensureEmojiAccessible(code: string, label?: string): string {
  return editFirstOpeningAttr(code, (opening) => {
    upsertStringAttr(opening, "role", "img");
    if (label) upsertStringAttr(opening, "aria-label", label);
  });
}

/** 장식적 이모지: aria-hidden=true */
export function hideDecorativeEmoji(code: string): string {
  return editFirstOpeningAttr(code, (opening) => {
    upsertBooleanAttr(opening, "aria-hidden", true);
  });
}

/** id 보장(없으면 부여, 있으면 유지) */
export function ensureId(code: string, idValue: string): string {
  return editFirstOpeningAttr(code, (opening) => {
    const cur = readStringAttr(opening, "id");
    if (cur == null) upsertStringAttr(opening, "id", idValue);
  });
}

/** aria-label 값을 지정(있으면 치환, 없으면 추가) */
export function addAriaLabel(code: string, label: string): string {
  return editFirstOpeningAttr(code, (opening) => {
    upsertStringAttr(opening, "aria-label", label);
  });
}
