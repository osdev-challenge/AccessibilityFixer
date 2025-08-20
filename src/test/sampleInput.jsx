// sampleInput.jsx

import React from "react";

const BadA11yComponent = () => {
  return (
    <div>
      {/* ❌ aria-activedescendant-has-tabindex */}
      <ul aria-activedescendant="item-2">
        <li id="item-1">Item 1</li>
        <li id="item-2">Item 2</li>
      </ul>

      {/* ❌ click-events-have-key-events */}
      <div onClick={() => alert("Clicked!")}>
        Click me (no keyboard support)
      </div>

      {/* ❌ interactive-supports-focus */}
      <div role="button" onClick={() => alert("Pressed!")}>
        Custom Button (no tabIndex)
      </div>

      {/* ❌ mouse-events-have-key-events */}
      <div
        onMouseOver={() => console.log("Hovered")}
        onMouseOut={() => console.log("Unhovered")}
      >
        Hover me (no keyboard equivalent)
      </div>

      {/* ❌ tabindex-no-positive */}
      <div tabIndex="0">I have a positive tabIndex</div>

      {/* ❌ prefer-native-elements (role="link") */}
      <div role="link" onClick={() => navigate("/page")}>페이지 이동</div>

      {/* ❌ prefer-native-elements (role="checkbox") */}
      <span role="checkbox" aria-checked="false">선택</span>

      {/* ❌ label-has-associated-control (for 없음) */}
      <label>
        이름
      </label>
      <input type="text" id="name" />
      
      {/* ❌ anchor-is-valid (href 없음) */}
      <a onClick={() => scrollToTop()}>
        Top
      </a>

      {/* ❌ no-noninteractive-tabindex */}
      <div tabIndex={0}>
        나는 비인터랙티브 요소지만 탭 포커스가 가능해
      </div>
    </div>
  );
};

export default BadA11yComponent;