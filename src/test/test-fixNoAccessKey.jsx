export default function NoAccessKeyViolations() {
  const props = { accessKey: 'x' };
  const dynamicKey = 'y';
  const maybe = true;

  return (
    <>
      {/* 1) 네이티브 요소에 accessKey */}
      <button accessKey="a">버튼</button>
      <a href="/" accessKey="b">링크</a>
      <input type="text" accessKey="c" />
      <label htmlFor="i1" accessKey="d">라벨</label>
      <textarea accessKey="e" />
      <select accessKey="f"><option>옵션</option></select>
      <img src="#" alt="이미지" accessKey="g" />
      <svg accessKey="h"><title>아이콘</title></svg>
      <div role="button" accessKey="i">div 버튼처럼</div>

      {/* 2) 커스텀 컴포넌트에 accessKey 전달 */}
      <MyButton accessKey="j">커스텀</MyButton>
      <Card accessKey="k" title="카드" />

      {/* 3) 스프레드로 유입 */}
      <div {...props}>스프레드로 accessKey</div>
      <span {...{ accessKey: 'm' }}>즉석 스프레드</span>

      {/* 4) 동적 값/표현식 */}
      <p accessKey={dynamicKey}>동적 키</p>
      <section accessKey={'n'}>문자열 리터럴</section>

      {/* 5) 조건부로 넣기 (truthy면 위반) */}
      <article {...(maybe && { accessKey: 'o' })}>조건부</article>

      {/* 6) 대문자/케이스 변형 (JSX에선 camelCase가 실제 속성 매핑됨 → 여전히 위반) */}
      <div accessKey={"P"}>대문자 값</div>

      {/* 7) JSX 프래그먼트 안 다양한 태그 */}
      <>
        <nav accessKey="q">네비</nav>
        <footer accessKey="r">푸터</footer>
      </>
    </>
  );
}

// 더미 커스텀 컴포넌트
function MyButton(props) { return <button {...props} />; }
function Card(props) { return <div {...props} />; }
