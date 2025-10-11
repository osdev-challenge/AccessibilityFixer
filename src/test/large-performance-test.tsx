import React from 'react';

/**
 * AccessibilityFixer 확장 프로그램의 대규모 성능 평가를 위한 테스트 컴포넌트입니다.
 * 수백 개의 의도적인 접근성 규칙 위반 사례를 포함하여, 확장 프로그램의 린팅 및 수정 제안 속도를 극한 상황에서 테스트합니다.
 */

// 테스트 케이스를 반복 생성하기 위한 헬퍼 함수
const repeat = <T,>(item: T, count: number): T[] => Array(count).fill(item);

const LargePerformanceTestComponent = () => {
  const handleClick = () => console.log('Clicked');
  const handleMouseOver = () => console.log('MouseOver');
  const handleMouseOut = () => console.log('MouseOut');

  return (
    <div>
      <h1>대규모 성능 테스트</h1>
      <p>이 파일은 수백 개의 접근성 오류를 포함하고 있습니다. 확장 프로그램이 모든 문제를 진단하는 데 걸리는 시간을 측정하세요.</p>

      {/* ========== 섹션 1: 논리 기반 규칙 위반 (대량 반복) ========== */}
      <section>
        <h2>논리 기반 규칙 테스트 (반복)</h2>
        {repeat(0, 50).map((_, i) => (
          <div key={`logic-test-${i}`}>
            {/* 1. tabindex-no-positive */}
            <span tabIndex={i + 1}>양수 tabIndex</span>

            {/* 2. anchor-is-valid */}
            <a href="javascript:;">유효하지 않은 링크 #{i}</a>
            <a>href가 없는 링크 #{i}</a>

            {/* 3. mouse-events-have-key-events */}
            <div onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
              키보드 이벤트 없는 마우스 이벤트 #{i}
            </div>
            
            {/* 4. no-access-key */}
            <button accessKey={String.fromCharCode(65 + (i % 26))}>Access Key #{i}</button>

            {/* 5. no-distracting-elements */}
            <marquee>움직이는 텍스트 #{i}</marquee>
          </div>
        ))}
      </section>

      {/* ========== 섹션 2: AI 기반 규칙 위반 (대량 반복) ========== */}
      <section>
        <h2>AI 기반 규칙 테스트 (반복)</h2>
        {repeat(0, 50).map((_, i) => (
          <div key={`ai-test-${i}`}>
            {/* 6. alt-text */}
            <img src={`image-${i}.jpg`} />

            {/* 7. aria-role */}
            <div role="buton">잘못된 Role #{i}</div>

            {/* 8. anchor-has-content */}
            <a href={`/page/${i}`}></a>

            {/* 9. control-has-associated-label */}
            <input type="text" id={`user-${i}`} />
            <label>사용자명</label>

            {/* 10. img-redundant-alt */}
            <img src={`icon-${i}.png`} alt={`icon image ${i}`} />
            
            {/* 11. accessible-emoji */}
            <span>⭐</span><span>👍</span>

            {/* 12. no-interactive-element-to-noninteractive-role */}
            <button role="presentation">저장 #{i}</button>

            {/* 13. no-noninteractive-element-to-interactive-role */}
            <div role="button" onClick={handleClick}>클릭 Div #{i}</div>
          </div>
        ))}
      </section>

      {/* ========== 섹션 3: 복합적인 위반 사례 (중첩 및 조합) ========== */}
      <section>
        <h2>복합 규칙 위반 테스트</h2>
        {repeat(0, 30).map((_, i) => (
          <div key={`complex-test-${i}`} onMouseOver={handleMouseOver}>
            <h3 role="heading" aria-level={-1}>잘못된 제목 <blink>!</blink></h3>
            <img src={`complex-${i}.gif`} />
            <a onClick={handleClick}>
              <span>아이콘</span>
            </a>
            <div role="buton" tabIndex={i + 100} onClick={handleClick} accessKey="x">
              복합 버튼
              <span>🔥</span>
            </div>
            <input id={`complex-input-${i}`} />
          </div>
        ))}
      </section>

      {/* ========== 섹션 4: 더 많은 단일 위반 사례 ========== */}
      <section>
          <h2>추가 단일 위반 사례</h2>
          {repeat(0, 50).map((_, i) => (
              <React.Fragment key={`single-more-${i}`}>
                  {/* heading-has-content */}
                  <h2></h2>
                  {/* aria-proptypes */}
                  <div aria-expanded="maybe">확장 가능?</div>
                  {/* role-has-required-aria-props */}
                  <div role="slider"></div>
                  {/* no-noninteractive-tabindex */}
                  <p tabIndex={0}>포커스 가능한 문단</p>
              </React.Fragment>
          ))}
      </section>
    </div>
  );
};

export default LargePerformanceTestComponent;