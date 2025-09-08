import React from 'react';

/**
 * 보고서용 웹 접근성 규칙 위반 예시 컴포넌트
 */
function AccessibilityReportExample() {
  return (
    <div>
      <h2>Quick Fix 기능 시연 예시</h2>

      {/* [문제 1: tabindex-no-positive]
          tabIndex 속성에 0보다 큰 양수 값을 사용했습니다.
          이는 키보드 탐색 순서에 혼란을 줄 수 있습니다. */}
      <div tabIndex="1">
        포커스를 받을 수 있는 첫 번째 요소
      </div>

     {/* [문제 2: role-has-required-aria-props]
          'checkbox' 역할을 가진 요소는 상태를 나타내는
          'aria-checked' 필수 속성이 누락되었습니다. */}
      <param name="movie" value="intro.mp4" role="img" />




      {/* [문제 3: aria-proptypes]
          'aria-expanded' 속성은 true 또는 false 값을 가져야 하지만,
          유효하지 않은 값('open')을 사용했습니다. */}
      <button aria-expanded="open">
        자세히 보기
      </button>

    </div>
  );
}

export default AccessibilityReportExample;