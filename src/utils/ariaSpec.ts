import { aria, roles, type ARIARoleDefinitionKey, type ARIARoleDefinition } from "aria-query";

// 유효 aria-* 속성
const VALID_ARIA_PROPS = new Set<string>(Array.from(aria.keys()));

// 유효 role (존재 && abstract=false)
export function isValidRole(role: string): boolean {
  const key = role.toLowerCase() as ARIARoleDefinitionKey;
  const def = roles.get(key) as ARIARoleDefinition | undefined;
  return !!def && def.abstract === false;
}

export function isValidAriaProp(name: string): boolean {
  return VALID_ARIA_PROPS.has(name);
}

// 네이티브 의미와 충돌하는 role인지(간단 휴리스틱)
export function isNativeConflictRole(elementName: string, role: string): boolean {
  const el = (elementName || "").toLowerCase();
  const nonInteractiveRoles = new Set(["none", "presentation"]);

  // 네이티브 인터랙티브 요소 목록
  const nativeInteractive = new Set(["button", "input", "select", "textarea", "summary"]);
  if (el === "a" || nativeInteractive.has(el)) {
    if (nonInteractiveRoles.has(role)) return true;
  }
  return false;
}
