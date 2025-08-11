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
      <div
        tabIndex="0"
        role="button"
        onClick={() => alert("Pressed!")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            /* onClick={() => alert("Pressed!")} */
          }
        }}
      >
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
    </div>
  );
};

export default BadA11yComponent;
