import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsxA11y from "eslint-plugin-jsx-a11y";
<<<<<<< Updated upstream

const recommendedA11yRules = jsxA11y.configs.recommended.rules;

export default [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
=======

export default [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"], // ✅ 이 부분이 모든 관련 파일을 포함하는지 확인
    ignores: ["node_modules/**", "dist/**", "build/**"],
>>>>>>> Stashed changes
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
    },
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
<<<<<<< Updated upstream
      "anchor-has-content" : "warn",
      // 수정에 관여할 규칙만 추가하기
=======
      'jsx-a11y/aria-role': "warn",
      'jsx-a11y/aria-proptypes': "warn",           
      'jsx-a11y/aria-unsupported-elements': "warn",
      'jsx-a11y/heading-has-content': "warn",
      'jsx-a11y/html-has-lang': "warn",
      'jsx-a11y/no-access-key': "warn",
      'jsx-a11y/no-aria-hidden-on-focusable': "warn",
      'jsx-a11y/no-distracting-elements': "warn",
      'jsx-a11y/no-static-element-interactions': "warn",
      'jsx-a11y/role-has-required-aria-props': "warn",
      'jsx-a11y/role-supports-aria-props': "warn",
      "jsx-a11y/aria-activedescendant-has-tabindex": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/mouse-events-have-key-events": "warn",
      "jsx-a11y/tabindex-no-positive": "warn",
>>>>>>> Stashed changes
    },
  },
];
