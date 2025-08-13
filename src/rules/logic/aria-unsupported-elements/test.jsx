export default function App() {
  return (
    <>
      {/* ✅ 잘못된 aria-* 속성이 있는 meta/script/style */}
      <meta aria-hidden="true" charSet="UTF-8" />
      <script aria-label="this should not be here">
        console.log('hello');
      </script>
      <style aria-hidden="false">{`
        body { background-color: #f4f4f4; }
      `}</style>

      {/* ✅ 정상적인 aria 사용: 수정 대상 아님 */}
      <div aria-hidden="true">숨겨진 요소</div>
      <button aria-label="닫기">닫기</button>
    </>
  );
}
