// src/test/sample-role-supports-aria-props.jsx
// 여러 위반 케이스 모음 (jsx-a11y/role-supports-aria-props)

import React from "react";

export default function RoleSupportsAriaPropsCases() {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      {/* ❌ role="img"는 aria-checked/aria-expanded 지원 안 함 (라벨링 정도만 허용) */}
      <div role="img" aria-checked="true">Bad: img with aria-checked</div>
      <div role="img" aria-expanded="true">Bad: img with aria-expanded</div>

      {/* ❌ role="button"은 aria-pressed 사용 (토글 상태), aria-checked는 체크박스류에 쓰임 */}
      <span role="button" aria-checked="true">Bad: button with aria-checked</span>

      {/* ✅ 올바른 예: role="button" + aria-pressed */}
      <span role="button" aria-pressed="false">OK: button with aria-pressed</span>

      {/* ❌ role="textbox"는 aria-checked/expanded/selected 등을 지원하지 않음 */}
      <div role="textbox" aria-checked="true">Bad: textbox with aria-checked</div>

      {/* ✅ 올바른 예: role="textbox" + 적절한 속성(placeholder/readonly/multiline 등) */}
      <div role="textbox" aria-placeholder="검색어를 입력하세요">OK: textbox with aria-placeholder</div>

      {/* ❌ role="heading"은 aria-level만 허용(필수). aria-checked는 지원 안 함 */}
      <h2 role="heading" aria-checked="true">Bad: heading with aria-checked</h2>

      {/* ✅ 올바른 예: role="heading" + aria-level */}
      <div role="heading" aria-level={2}>OK: heading with aria-level=2</div>

      {/* ❌ role="progressbar"는 valuemin/valuenow/valuemax 등을 쓰며, aria-checked는 지원 안 함 */}
      <div role="progressbar" aria-checked="true">Bad: progressbar with aria-checked</div>

      {/* ✅ 올바른 예: role="progressbar" + value 관련 속성 */}
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={30}>
        OK: progressbar with value props
      </div>

      {/* ❌ role="switch"는 aria-checked 필요/허용. aria-level은 지원 안 함 */}
      <div role="switch" aria-level="2">Bad: switch with aria-level</div>

      {/* ✅ 올바른 예: role="switch" + aria-checked */}
      <div role="switch" aria-checked="false">OK: switch with aria-checked</div>

      {/* ❌ role="tab"는 aria-selected/aria-controls 등. aria-checked는 지원 안 함 */}
      <li role="tab" aria-checked="true">Bad: tab with aria-checked</li>

      {/* ✅ 올바른 예: role="tab" + aria-selected */}
      <li role="tab" aria-selected="false">OK: tab with aria-selected</li>

      {/* ❌ role="checkbox"에서는 aria-checked를 써야 하며, aria-level은 지원 안 함
          (이 예시는 role-has-required-aria-props도 위반) */}
      <div role="checkbox" aria-level={2}>Bad: checkbox with aria-level</div>
    </div>
  );
}
