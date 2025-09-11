# AccessibilityFixer

> ⚡ Real-time linting and quick fixes for web accessibility in React code  
> 🚀 Improve your JSX/TSX accessibility with minimal effort

---

## Features

- 🛠️ Detects accessibility issues in `.js`, `.jsx`, `.ts`, and `.tsx` files
- 💡 Quick Fixes via VSCode’s Code Actions interface
- 🤖 AI-powered suggestions for selected rules
- 🔧 Built-in integration with `eslint-plugin-jsx-a11y`
- 🧠 Lightweight and developer-friendly

---

## Installation

Open VSCode, press `Ctrl+P` (or `Cmd+P` on Mac) and run:

```
ext install uno-accessibilityfixer.AccessibilityFixer
```

Or install from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=uno-accessibilityfixer.AccessibilityFixer)

---

## Usage

After installing, open any JavaScript/TypeScript React file (`.jsx`, `.tsx`).  
AccessibilityFixer will highlight common accessibility violations and provide auto-fix suggestions.

### Example:

```tsx
// Before
<div role="button" onClick={handleClick}></div>

// After Quick Fix
<div role="button" onClick={handleClick} tabIndex={0} onKeyDown={handleKeyDown}></div>
```

To apply fixes, click the lightbulb icon or use the shortcut `Ctrl+.` / `Cmd+.`

---

## Configuration

No setup required.  
AccessibilityFixer works out of the box, even if you don’t have `eslint-plugin-jsx-a11y` installed — though using it in your project is recommended for full customization.

---

## Supported File Types

- `.js`
- `.jsx`
- `.ts`
- `.tsx`

---

## Contributing

## Contributing

We welcome contributions from everyone in the community.  
Whether it’s fixing a bug, improving documentation, or suggesting a new feature — your help makes AccessibilityFixer better for everyone.

For detailed contribution guidelines, please check our [CONTRIBUTING.md](.docs/CONTRIBUTING.md).

📖 For a list of resolved accessibility rules, see [RULES.md](.docs/RULES.md).

---

## License

[MIT License](./LICENSE.txt)

---

## Resources

- [eslint-plugin-jsx-a11y on npm](https://www.npmjs.com/package/eslint-plugin-jsx-a11y)

---

**AccessibilityFixer** helps you improve usability for all users  
💬 Because **accessible web** is better web.
