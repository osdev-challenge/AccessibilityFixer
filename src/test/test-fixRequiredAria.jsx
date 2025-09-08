// 여러 위반 케이스 모음 (jsx-a11y/role-has-required-aria-props)

import React from "react";

export default function RoleHasRequiredAriaPropsCases() {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      {/* checkbox → aria-checked 필수 */}
      <div role="checkbox" aria-checked="false">Bad: checkbox without aria-checked</div>

      {/* radio → aria-checked 필수 */}
      <div role="radio">Bad: radio without aria-checked</div>

      {/* switch → aria-checked 필수 */}
      <div role="switch">Bad: switch without aria-checked</div>

      {/* menuitemcheckbox → aria-checked 필수 */}
      <div role="menuitemcheckbox">Bad: menuitemcheckbox without aria-checked</div>

      {/* menuitemradio → aria-checked 필수 */}
      <div role="menuitemradio">Bad: menuitemradio without aria-checked</div>

      {/* option → aria-selected 필수 */}
      <li role="option">Bad: option without aria-selected</li>

      {/* heading → aria-level 필수 */}
      <div role="heading">Bad: heading without aria-level</div>

      {/* slider → aria-valuenow (보통 valuemin/valuemax도 함께 사용) */}
      <div role="slider">Bad: slider without aria-valuenow</div>

      {/* spinbutton → aria-valuenow (보통 valuemin/valuemax도 함께 사용) */}
      <div role="spinbutton">Bad: spinbutton without aria-valuenow</div>

      {/* scrollbar → aria-valuenow (및 관련 값/controls 필요) */}
      <div role="scrollbar">Bad: scrollbar without aria-valuenow/controls</div>

      {/* OK 예시들 (참고용) */}
      <div role="checkbox" aria-checked="false">OK: checkbox with aria-checked</div>
      <div role="radio" aria-checked="true">OK: radio with aria-checked</div>
      <div role="switch" aria-checked="mixed">OK: switch with aria-checked="mixed"</div>
      <li role="option" aria-selected="false">OK: option with aria-selected</li>
      <div role="heading" aria-level={2}>OK: heading with aria-level</div>
      <div role="slider" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
        OK: slider with values
      </div>
      <div role="spinbutton" aria-valuenow={3} aria-valuemin={1} aria-valuemax={5}>
        OK: spinbutton with values
      </div>
      <div
        role="scrollbar"
        aria-controls="scrollTarget"
        aria-valuenow={30}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        OK: scrollbar with values & controls
      </div>
    </div>
  );
}
