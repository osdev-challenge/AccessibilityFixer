// 여러 위반 케이스 모음 (jsx-a11y/no-distracting-elements)

import React from "react";

export default function NoDistractingElementsCases() {
  const flag = true;
  const mProps = { direction: "left", behavior: "alternate", scrollamount: 10 };
  const tag = "marquee"; // 동적 태그명
  const innerHtml = { __html: "<marquee>Injected marquee (bad)</marquee>" };

  return (
    <div style={{ display: "grid", gap: 12, padding: 16 }}>
      {/* 1. 기본 marquee */}
      <marquee>Scrolling text (bad)</marquee>

      {/* 2. 기본 blink */}
      <blink>Blinking text (bad)</blink>

      {/* 3. 속성 포함 marquee */}
      <marquee direction="up" scrollamount="5">
        Vertical scrolling text (bad)
      </marquee>

      {/* 4. 스타일/클래스가 있어도 금지 */}
      <blink className="warn" style={{ color: "red" }}>
        Blink with class (bad)
      </blink>

      {/* 5. 중첩 사용 */}
      <marquee>
        Outer marquee (bad)
        <blink>Inner blink (also bad)</blink>
      </marquee>

      {/* 6. self-closing 형태 */}
      <marquee />

      {/* 7. props 스프레드 */}
      <marquee {...mProps}>Spread props marquee (bad)</marquee>

      {/* 8. 조건부 렌더링 */}
      {flag && <marquee>Conditional marquee (bad)</marquee>}

      {/* 9. 삼항 연산자 */}
      {flag ? <blink>Conditional blink (bad)</blink> : <span>ok</span>}

      {/* 10. React.createElement 로 생성 */}
      {React.createElement("marquee", { direction: "right" }, "createElement marquee (bad)")}

      {/* 11. 동적 태그명 (린터가 못 잡을 수도 있지만 실제로는 marquee 렌더링) */}
      {React.createElement(tag, { scrollamount: 3 }, "dynamic tag marquee (bad)")}

      {/* 12. dangerouslySetInnerHTML 로 금지 태그 주입 */}
      <div dangerouslySetInnerHTML={innerHtml} />

      {/* 13. Fragment 내부 */}
      <>
        <blink>Inside fragment (bad)</blink>
      </>

      {/* 대문자 시작 사용자 컴포넌트는 규칙 대상 아님 */}
      <Marquee>Custom component named Marquee (ok)</Marquee>
    </div>
  );
}

// 사용자 컴포넌트 (OK 케이스)
function Marquee({ children }) {
  return <div style={{ fontWeight: 700 }}>{children}</div>;
}
