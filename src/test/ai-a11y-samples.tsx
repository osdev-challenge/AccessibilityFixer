// src/test/ai-a11y-samples.tsx
// 목적: ruleDispatcher + AI fixers가 실제로 Quick Fix를 내는지 한 눈에 점검
// 사용법: 이 파일을 열고 문제(Problems) 탭에서 각 경고에 커서 → Ctrl+. (Quick Fix)

export const BadAriaRole = () => (
  // jsx-a11y/aria-role
  <div role="buton">Click me</div> // "button" 오타
  //<div <div>Click me</div>>Click me</div> 
);

export const InteractiveToNoninteractiveRole = () => (
  // jsx-a11y/no-interactive-element-to-noninteractive-role
  <button role="presentation">Save</button>         // [jsx-a11y/prefer-tag-over-role] 규칙에 대한 수정 로직이 없습니다. 
);

export const NoninteractiveToInteractiveRole = () => (
  // jsx-a11y/no-noninteractive-element-to-interactive-role
  <div role="button">Pretend button</div>       // 규칙수정로직이 없음 
);

export const BadAriaProps = () => (
  <div
    // jsx-a11y/aria-props: 존재하지 않는 aria-* 속성
    aria-foobar="true"          
    // jsx-a11y/require-aria-label (커스텀 규칙 가정): 문자열이 아닌 값
    aria-label={123 as unknown as string}
  >
    Bad aria props
  </div>
);

export const MissingAltText = () => (
  // jsx-a11y/alt-text
  <img src="/static/photo.png" />         // 해결은 되는데 결과가 조금 이상한듯 
);

export const EmptyAltButNotDecorative = () => (
  // jsx-a11y/no-empty-alt
  <img src="/static/user.png" alt="" />
);

export const RedundantAlt = () => (
  // jsx-a11y/img-redundant-alt
  <img src="/static/logo.png" alt="image of logo" />    
);

export const AnchorHasNoContent = () => (
  // jsx-a11y/anchor-has-content
  <a href="/docs"></a>        // 수정은 되는데, 오류가 뜸 -> [dispatchRule 오류] jsx-a11y/anchor-has-content SyntaxError: Expected corresponding JSX closing tag for <a>
);

export const ControlHasNoAssociatedLabel = () => (
  // jsx-a11y/control-has-associated-label
  <div>
    <input id="email" type="email" placeholder="email" />    
    {/* 라벨 누락      */}
  </div>
);

export const FormHasNoLabel = () => (
  // jsx-a11y/form-has-label
  <form>
    <input type="text" name="nickname" />       
    {/* 이 입력을 설명하는 label/aria-label/aria-labelledby 없음 */}
  </form>
);

// (선택) deprecated이지만 구현 확인용
export const AccessibleEmoji_Deprecated = () => (
  // jsx-a11y/accessible-emoji (deprecated) / 대체: emoji-has-accessible-name
  <span role="img">🔥</span>
);

// 보너스: 혼합 이슈 컴포넌트 (한 번에 여러 Quick Fix 확인)
export const KitchenSink = () => (
  <section>
    {/* role 오타 + 잘못된 aria prop */}
    <div role="tabpannel" aria-unknow="x">Tab?</div>

    {/* a11y anchor 내용 없음 */}
    <a href="/go"></a>

    {/* alt 없음 */}
    <img src="/img/banner.jpg" />

    {/* noninteractive → interactive role */}
    <div role="checkbox">check?</div>

    {/* interactive → noninteractive role */}
    <a href="https://example.com" role="presentation">go</a>

    {/* control label 없음 */}
    <input type="password" />

    {/* redundant alt */}
    <img src="/img/brand.png" alt="company logo image" />
  </section>
);
