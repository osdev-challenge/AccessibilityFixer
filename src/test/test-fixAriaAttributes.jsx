// ai-a11y-samples.tsx
// 목적: 19개 규칙의 "위반 예시"를 한 파일에서 재현하고, 바로 아래에 "주석으로 수정 예시"를 표기
// 사용법: 이 파일을 열고 Problems 패널/Quick Fix (Ctrl+.) 동작을 확인

import React from "react";

/* ─────────────────────────────
   1) aria-proptypes
   - 잘못된 타입/허용값(예: "yes", "maybe")을 사용
───────────────────────────── */
export const AriaPropTypes = () => (
  <div aria-checked="false">
    Bad aria values
  </div>
);
// FIX: <div aria-hidden="false"> 

/* ─────────────────────────────
   2) role-has-required-aria-props
   - 특정 role에 필요한 aria-* 누락
───────────────────────────── */
export const RoleMissingRequiredProps = () => (
  <div role="checkbox" aria-checked="false">Check me</div>
);
// FIX: <div role="checkbox" aria-checked="false">…</div>

/* ─────────────────────────────
   3) role-supports-aria-props
   - 해당 role이 지원하지 않는 aria-* 사용
───────────────────────────── */
export const RoleUnsupportedAria = () => (
  <div role="img" />
);
// FIX: 불허 속성 제거 → <div role="img" />

/* ─────────────────────────────
   4) aria-unsupported-elements
   - ARIA/role을 지원하지 않는 요소에 aria/role 사용
───────────────────────────── */
export const AriaUnsupportedElements = () => (
  <meta/>
);
// FIX: <meta /> (role/aria-* 제거)

/* ─────────────────────────────
   5) aria-activedescendant-has-tabindex
   - aria-activedescendant가 있으면 포커스 가능해야 함
───────────────────────────── */
export const ActiveDescendantNeedsTabIndex = () => (
  <div tabIndex="0" role="combobox" aria-activedescendant="opt-1">
    Combobox
  </div>
);
// FIX: <div role="combobox" aria-activedescendant="opt-1" tabIndex={0}>…</div>

/* ─────────────────────────────
   6) no-noninteractive-tabindex
   - 비인터랙티브 요소에 tabIndex 부여 금지
───────────────────────────── */
export const NoNoninteractiveTabIndex = () => <div tabIndex={0}>Static</div>;
// FIX: <div>Static</div>  (또는 진짜 인터랙티브로 전환)

/* ─────────────────────────────
   7) tabindex-no-positive
   - 양수 tabIndex 금지
───────────────────────────── */
export const TabIndexNoPositive = () => (
  <div role="button" onClick={() => {}} tabIndex={3}>
    Bad tab order
  </div>
);
// FIX: tabIndex={0} 또는 tabIndex={-1}

/* ─────────────────────────────
   8) mouse-events-have-key-events
   - 마우스 오버/아웃에 대응하는 포커스/블러 없음
───────────────────────────── */
export const MouseNeedsKeyboardParity = () => (
  <div onMouseOver={() => {}} onMouseOut={() => {}}>
    Hover me
  </div>
);
// FIX: onFocus/onBlur 동일 핸들러 보강
// <div onMouseOver={h} onMouseOut={h} onFocus={h} onBlur={h}>

/* ─────────────────────────────
   9) anchor-is-valid
   - href 누락, 빈값, 무효한 URL 스킴
───────────────────────────── */
export const AnchorIsValid = () => (
  <>
    <a>Docs</a>
    <a href="javascript:;">Bad</a>
  </>
);
// FIX: <a href="/docs">Docs</a> / <a href="#">Bad</a> (실제 링크로 교체 권장)

/* ─────────────────────────────
   10) heading-has-content
   - 빈 헤딩, 자기닫힘 헤딩, 숨김-only 헤딩
───────────────────────────── */
export const HeadingHasContent = () => (
  <>
    <h1></h1>
    <h2 />
    <h3><span aria-hidden="true">•••</span></h3>
  </>
);
// FIX: <h1>제목</h1> / <h2>제목</h2>
// 숨김-only는 자동수정 대신 경고 → 시각적으로 숨긴 텍스트/aria-label 등으로 보완

/* ─────────────────────────────
   11) label-has-associated-control
   - label과 입력 컨트롤 연결 누락
───────────────────────────── */
export const LabelHasAssociatedControl = () => (
  <>
    {/* 연결 누락: label에 htmlFor가 없고, input과 분리되어 있음 */}
    <label>Username</label>
    <input id="user-id" type="text" />
  </>
);
// FIX: 중첩 연결 또는 htmlFor/id 연결
// <label htmlFor="user-id">Username</label><input id="user-id" type="text" />
// 또는 <label>Username <input type="text" /></label>

/* ─────────────────────────────
   12) html-has-lang
   - <html>에 lang 미설정
───────────────────────────── */
export const HtmlHasLang = () => (
  // 프레임워크(예: Next.js _document.tsx) 문맥을 가정한 테스트
  <html>
    <head><title>Doc</title></head>
    <body><div>Content</div></body>
  </html>
);
// FIX: <html lang="en">…</html>  (프로젝트/에디터 설정에 맞는 기본 언어로)

/* ─────────────────────────────
   13) no-access-key
   - accessKey 사용 금지
───────────────────────────── */
export const NoAccessKey = () => (
  <button accessKey="s" onClick={() => {}}>Save</button>
);
// FIX: <button onClick={…}>Save</button>  (accessKey 제거)

/* ─────────────────────────────
   14) no-distracting-elements
   - 방해 요소 사용 금지 (<marquee>, <blink>)
───────────────────────────── */
export const NoDistractingElements = () => (
  <div>
    <marquee>Scrolling Text</marquee>
    {/* <blink>는 일부 환경에서 렌더링되지 않지만 규칙상 금지 */}
    <blink>Blinking</blink>
  </div>
);
// FIX: 바깥 태그 제거(언랩) → 텍스트/콘텐츠만 남기기
// <div>Scrolling Text Blinking</div>

/* ─────────────────────────────
   15) no-aria-hidden-on-focusable
   - 포커스 가능한 요소에 aria-hidden 사용 금지
───────────────────────────── */
export const NoAriaHiddenOnFocusable = () => (
  <>
    <button aria-hidden="true">Submit</button>
    <a href="#" aria-hidden="true">Link</a>
  </>
);
// FIX: aria-hidden 제거
// <button>Submit</button> / <a href="#">Link</a>

