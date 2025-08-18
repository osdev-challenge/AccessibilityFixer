// src/test/sample-no-aria-hidden-on-focusable.jsx
// 여러 위반 케이스를 한꺼번에 담은 테스트용 파일

import React from "react";

export default function NoAriaHiddenOnFocusableCases() {
  const isHidden = true;
  const spreadHidden = { "aria-hidden": true };
  const maybe = true;

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      {/* ❌ 1. button 자체에 aria-hidden */}
      <button aria-hidden="true">Bad: hidden button</button>

      {/* ❌ 2. a[href]는 기본 포커스 가능 */}
      <a href="https://example.com" aria-hidden="true">Bad: hidden link</a>

      {/* ❌ 3. input도 포커스 가능 */}
      <input aria-hidden="true" placeholder="Bad: hidden input" />

      {/* ❌ 4. role + tabIndex 로 포커스 가능 div */}
      <div role="button" tabIndex={0} aria-hidden="true" onClick={() => {}}>
        Bad: hidden role=button with tabIndex=0
      </div>

      {/* ❌ 5. 단순 tabIndex>=0 로 포커스 가능 */}
      <div tabIndex={1} aria-hidden="true">Bad: hidden with positive tabIndex</div>

      {/* ❌ 6. tabIndex={0} 도 포커스 가능 */}
      <div tabIndex={0} aria-hidden="true">Bad: hidden with tabIndex 0</div>

      {/* ❌ 7. tabIndex={-1} 도 “프로그램적으로는” 포커스 가능하므로 규칙에 걸림 */}
      <div tabIndex={-1} aria-hidden="true">Bad: hidden with tabIndex -1</div>

      {/* ❌ 8. contentEditable=true 도 포커스 가능 */}
      <div contentEditable aria-hidden="true">Bad: hidden contentEditable</div>

      {/* ❌ 9. 동적 값으로 aria-hidden 제어 */}
      <button aria-hidden={isHidden}>Bad: dynamic hidden button</button>

      {/* ❌ 10. 스프레드로 aria-hidden 주입 */}
      <a href="#" {...spreadHidden}>Bad: spread hidden link</a>

      {/* ❌ 11. 조건부 스프레드 내부에 aria-hidden 포함 */}
      <div
        {...(maybe && { "aria-hidden": true })}
        role="button"
        tabIndex={0}
      >
        Bad: conditional spread hidden role button
      </div>

      {/* ❌ 12. aria-hidden 문자열 케이스(대소문자/공백) */}
      <div tabIndex={0} aria-hidden={' TRUE '}>Bad: hidden with weird casing</div>

      {/* ❌ 13. aria-hidden 템플릿 리터럴 */}
      <div tabIndex={0} aria-hidden={`${true}`}>Bad: template literal hidden</div>

      {/* ❌ 14. SVG 링크(포커스 가능) */}
      <a href="#svg" aria-hidden="true">
        <svg width="20" height="20" aria-hidden="false"><circle cx="10" cy="10" r="8" /></svg>
        Bad: hidden anchor with svg
      </a>

      {/* ✅ OK 예시들(참고): 포커스 불가 요소에 aria-hidden (규칙 위반 아님) */}
      <div aria-hidden="true">OK: static hidden non-focusable</div>
      <span aria-hidden={true}>OK: static text hidden</span>
    </div>
  );
}
