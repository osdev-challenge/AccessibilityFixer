export const BadAriaRole = () => (
  // jsx-a11y/aria-role
  <div role="buton">Click me</div> // "button" 오타
  
);

export const InteractiveToNoninteractiveRole = () => (
  // jsx-a11y/no-interactive-element-to-noninteractive-role
  <button role="presentation">Save</button>        
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
  <img src="/static/photo.png" />         
  
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
  <a href="/docs"></a>        
  
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
