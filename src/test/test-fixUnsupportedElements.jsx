// 의도적으로 전부 위반 예시입니다.
export default function AriaUnsupportedElementsViolations() {
  return (
    <>
      {/* 1) <meta> : role/aria 금지 */}
      <meta role="button" />
      <meta />

      {/* 2) <style> : role/aria 금지 */}
      <style role="region">{`
        .x { color: red; }
      `}</style>

      {/* 3) <script> : role/aria 금지 */}
      <script role="dialog">
        {`console.log('스크립트 태그는 ARIA 불가');`}
      </script>

      {/* 4) <base> : role/aria 금지 */}
      <base href="/" />

      {/* 5) <param> : role/aria 금지 */}
      <param name="movie" value="intro.mp4" role="img" />

      {/* 6) <title> : role/aria 금지 */}
      <title role="heading" aria-level="1">제목</title>

      {/* 7) <head> : role/aria 금지 */}
      <head role="banner"></head>

      {/* 8) <html> : role/aria 금지 */}
      <html lang="ko" role="application"></html>

      {/* 보너스) 금지 요소 안쪽 자식에 aria를 두는 것도 흔한 실수 (부모 자체가 금지인 케이스) */}
      <script>
        {`
          // 내부 주석: 부모 <script> 자체가 ARIA 금지이므로
          // 여기에 aria-*를 넣어도 소용없고, 린트 위반입니다.
        `}
      </script>
    </>
  );
}
