# AccessibilityFixer Rules

AccessibilityFixer detects and fixes accessibility issues in React/JSX/TSX code.  
Some rules are resolved automatically with **AI suggestions**, while others are handled with **built-in logic**.

---

## Rules Resolved with AI

These rules are automatically analyzed and fixed using AI-powered suggestions:

| #   | Rule Name                                       | Description                                                            |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `alt-text`                                      | `<img>`, `<area>`, `<input type="image">` must have an `alt` attribute |
| 2   | `anchor-has-content`                            | `<a>` elements must have content (avoid empty `<a></a>`)               |
| 3   | `aria-props`                                    | Only valid ARIA properties should be used                              |
| 4   | `aria-role`                                     | Only valid ARIA roles should be used                                   |
| 5   | `control-has-associated-label`                  | Form control elements must have an associated label                    |
| 6   | `img-redundant-alt`                             | Avoid redundant `alt` text like `alt="image"`                          |
| 7   | `no-interactive-element-to-noninteractive-role` | Interactive elements must not be assigned non-interactive roles        |
| 8   | `no-noninteractive-element-to-interactive-role` | Non-interactive elements must not be assigned interactive roles        |
| 9   | `form-has-label`                                | All form controls inside a `<form>` must have labels                   |
| 10  | `accessible-emoji`                              | Emojis must have `aria-label` or `role="img"`                          |
| 11  | `aria-label-is-string`                          | `aria-label` must always be a string                                   |
| 12  | `no-empty-alt`                                  | Empty `alt=""` is only allowed for decorative images                   |
| 13  | `form-control-has-label`                        | All form controls must have visible or screen-reader accessible labels |

---

## Rules Resolved with Built-in Logic

These rules are handled directly through static analysis and logic, without AI involvement:

| #   | Rule Name                            | Description                                                                      |
| --- | ------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | `anchor-is-valid`                    | `<a>` elements must have a valid `href` or proper role (e.g., `button`)          |
| 2   | `aria-activedescendant-has-tabindex` | Elements using `aria-activedescendant` must have a `tabIndex`                    |
| 3   | `aria-proptypes`                     | ARIA property values must have correct types                                     |
| 4   | `aria-unsupported-elements`          | Do not use ARIA properties on unsupported elements like `<meta>` or `<script>`   |
| 5   | `click-events-have-key-events`       | Clickable elements must also support keyboard events                             |
| 6   | `heading-has-content`                | Heading tags (`<h1>` ~ `<h6>`) must not be empty                                 |
| 7   | `html-has-lang`                      | `<html>` element must have a `lang` attribute                                    |
| 8   | `interactive-supports-focus`         | Interactive roles (button, link) must support `tabIndex`                         |
| 9   | `label-has-associated-control`       | `<label>` must be associated with a form control (`for` or nesting)              |
| 10  | `mouse-events-have-key-events`       | Mouse events like `onMouseOver`/`onMouseOut` must have keyboard equivalents      |
| 11  | `no-access-key`                      | Avoid using `accessKey` (can cause accessibility conflicts)                      |
| 12  | `no-aria-hidden-on-focusable`        | Do not use `aria-hidden="true"` on focusable elements                            |
| 13  | `no-distracting-elements`            | Avoid `<marquee>`, `<blink>`, etc.                                               |
| 14  | `no-noninteractive-tabindex`         | Non-interactive elements must not use `tabIndex`                                 |
| 15  | `no-static-element-interactions`     | Static elements with event handlers must have an appropriate role                |
| 16  | `role-has-required-aria-props`       | Roles must include their required ARIA properties                                |
| 17  | `role-supports-aria-props`           | Roles must only use supported ARIA properties                                    |
| 18  | `tabindex-no-positive`               | Avoid positive `tabIndex` values (e.g., `tabIndex={1}`)                          |
| 19  | `prefer-native-elements`             | Use native elements instead of ARIA roles (`<a>` instead of `role="link"`, etc.) |

---

## Notes

- **AI-powered rules** provide more flexible and context-aware fixes.
- **Logic-based rules** are handled deterministically by the extension.
- The rule set is continuously expanding as AccessibilityFixer evolves.

We welcome new rule proposals and improvements!
Please check out our [CONTRIBUTING.md](.docs/RULES.md) for details on how to contribute.
