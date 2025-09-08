// 여러 위반 케이스 모음 (jsx-a11y/no-static-element-interactions)

import React from "react";

export default function NoStaticElementInteractionsCases() {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      {/* 1. div에 onClick 붙였지만 role 없음 */}
      <div tabIndex="0" role="button" onClick={() => alert("clicked!")} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { /* onClick={() => alert("clicked!")} */ } }}>
        Bad: div with onClick but no role/tabIndex
      </div>

      {/* 2. span에 onKeyDown 붙였지만 보강 없음 */}
      <span onKeyDown={(e) => console.log("keydown", e)}>
        Bad: span with onKeyDown
      </span>

      {/* 3. p에 onDoubleClick 붙였지만 보강 없음 */}
      <p onDoubleClick={() => console.log("dblclick")}>
        Bad: p with onDoubleClick
      </p>

      {/* 4. div에 onMouseOver + onMouseOut */}
      <div role="button"
        onMouseOver={() => console.log("hover start")}
        onMouseOut={() => console.log("hover end")}
      >
        Bad: div hover interactions without role
      </div>

      {/* 5. li에 onClick만 있음 */}
      <ul>
        <li onClick={() => console.log("li clicked")}>Bad: li clickable</li>
      </ul>

      {/* 6. section에 onFocus 있음 */}
      <section role="button" onFocus={() => console.log("focus")}>
        Bad: section focusable without tabIndex
      </section>

      {/* 7. img 태그 onClick, alt 있지만 role 없음 */}
      <img
        src="foo.png"
        alt="foo"
        onClick={() => console.log("img clicked")}
      />

      {/* 8. aria만 있고 role/tabIndex 없는 경우도 위반 */}
      <div aria-label="click me" onClick={() => console.log("click")}>
        Bad: aria-label만 있고 interactive semantics 없음
      </div>

      {/* 올바른 예시 (참고용) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => alert("OK")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") alert("OK with keyboard");
        }}
      >
        OK: div as accessible button
      </div>
    </div>
  );
}
