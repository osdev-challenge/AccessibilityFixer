## [2.2.1](https://github.com/osdev-challenge/AccessibilityFixer/compare/v2.2.0...v2.2.1) (2025-10-28)


### Bug Fixes

* 6 rules detail fix ([#53](https://github.com/osdev-challenge/AccessibilityFixer/issues/53)) ([49ba255](https://github.com/osdev-challenge/AccessibilityFixer/commit/49ba255cb384f2aeddba2445f5e8fec6f4c1eade)), closes [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [feature/#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29)


### Reverts

* Revert "fix: 6 rules detail fix ([#53](https://github.com/osdev-challenge/AccessibilityFixer/issues/53))" ([#54](https://github.com/osdev-challenge/AccessibilityFixer/issues/54)) ([86fa1ce](https://github.com/osdev-challenge/AccessibilityFixer/commit/86fa1cee8e14b2277c79b3eb449b8de1df8c1c37))

# [2.2.0](https://github.com/osdev-challenge/AccessibilityFixer/compare/v2.1.3...v2.2.0) (2025-10-27)


### Features

* filepath and config refactor ([#50](https://github.com/osdev-challenge/AccessibilityFixer/issues/50)) ([e051381](https://github.com/osdev-challenge/AccessibilityFixer/commit/e0513819cb6a55732032a1b05733cda4b019dae8)), closes [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [feature/#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29)

## [2.1.3](https://github.com/osdev-challenge/AccessibilityFixer/compare/v2.1.2...v2.1.3) (2025-10-15)


### Bug Fixes

* edit license notices ([#47](https://github.com/osdev-challenge/AccessibilityFixer/issues/47)) ([0b8f48e](https://github.com/osdev-challenge/AccessibilityFixer/commit/0b8f48eedfc72649f337c912cbd38b1b127f395f)), closes [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [feature/#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29)

## [2.1.2](https://github.com/osdev-challenge/AccessibilityFixer/compare/v2.1.1...v2.1.2) (2025-10-12)


### Bug Fixes

* exclude .env and sensitive files from VSIX package ([#46](https://github.com/osdev-challenge/AccessibilityFixer/issues/46)) ([ed61ddd](https://github.com/osdev-challenge/AccessibilityFixer/commit/ed61ddd62ac6767da427600a7876fe2c95db74c1)), closes [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [feature/#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29)
* resolve duplicate fix issue and improve quick fix UX & AI prompt ([#42](https://github.com/osdev-challenge/AccessibilityFixer/issues/42)) ([82969a2](https://github.com/osdev-challenge/AccessibilityFixer/commit/82969a28a9b04aa05a29e4ce21ea1fbc09ff4ad1)), closes [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [feature/#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29)
* resolve duplicate fix issue and improve quick fix UX & AI prompt(fixed) ([#45](https://github.com/osdev-challenge/AccessibilityFixer/issues/45)) ([eab3bdb](https://github.com/osdev-challenge/AccessibilityFixer/commit/eab3bdb98520840ccd702368556683f423381358)), closes [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29) [feature/#29](https://github.com/osdev-challenge/AccessibilityFixer/issues/29)


### Reverts

* Revert "fix: resolve duplicate fix issue and improve quick fix UX & AI prompt…" ([#44](https://github.com/osdev-challenge/AccessibilityFixer/issues/44)) ([b874a73](https://github.com/osdev-challenge/AccessibilityFixer/commit/b874a736ee30640adfa0079fe391c96cb197b201))

# Change Log

All notable changes to the "AccessibilityFixer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.1.0] - 2025-09-28

### Added

- Added interactive setup for OpenAI API Key and GPT model selection
- Added command `a11yFix.resetAndReconfigureGpt` to reset and reconfigure GPT settings
- AI suggestions now support multiple GPT models (gpt-3.5, gpt-4, gpt-4o, gpt-4o-mini)

### Changed

- Improved initialization flow for GPT-powered accessibility suggestions
- Refactored code to reduce duplication in settings prompts

## [2.0.1]

- Initial public release with real-time accessibility linting and quick fixes
- ⚠️ **AI-powered suggestions were not supported in this version.**
- 🔔 Please update to the **latest version** (2.1.0 or higher) to unlock GPT-based accessibility fixes.
