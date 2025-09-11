export default function HeadingHasContentViolations() {
  return (
    <>
      {/* 1) 완전 빈 헤딩 */}
      <h1>빈제목</h1>
      <h2></h2>

      {/* 2) 내용은 있지만 스크린리더에 숨김(접근 불가) */}
      <h1><span  aria-hidden="true">숨김 텍스트</span></h1>

       {/* 3 자기닫힘 */}
      <h1 />

    </>
  );
}
