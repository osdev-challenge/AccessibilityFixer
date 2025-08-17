// aria-role 규칙 테스트 샘플들

// 1. aria-role 규칙: 잘못된 role 값
export const BadRole = () => <div role="buton">Click</div>; // "button" 오타
export const InvalidRole = () => <div role="invalid-role">Content</div>; // 존재하지 않는 role

// 2. aria-role 규칙: 네이티브 의미와 충돌하는 role
export const ButtonWithPresentation = () => <button role="presentation">Save</button>; // button에 presentation
export const LinkWithNone = () => <a href="#" role="none">Link</a>; // a에 none

// 3. aria-props 규칙: 잘못된 aria-* 속성
export const BadAriaProp = () => <div aria-label='설명' aria-invalid-prop="value">Hello</div>; // 잘못된 aria-*
export const MultipleBadAriaProps = () => <div aria-fake="test" aria-wrong="value" aria-label="valid">Content</div>;

// 4. no-interactive-element-to-noninteractive-role 규칙
export const DivWithButtonRoleNoHandlers = () => <div role="button">OK</div>; // div에 button role
export const SpanWithLinkRole = () => <span role="link">Click me</span>; // span에 link role

// 5. no-noninteractive-element-to-interactive-role 규칙
export const DivWithInteractiveRole = () => <div role="menuitem">Menu Item</div>; // div에 menuitem
export const SpanWithButtonRole = () => <span role="button">Click</span>; // span에 button

// 6. 복합적인 경우들
export const ComplexCase = () => (
  <div role="buton" aria-invalid-prop="test" aria-label="valid">
    <button role="presentation">Save</button>
  </div>
);

// 7. 정상적인 경우들 (참고용)
export const ValidButton = () => <button>Click me</button>;
export const ValidDiv = () => <div>Content</div>;
export const ValidAriaLabel = () => <div aria-label="Description">Content</div>;
