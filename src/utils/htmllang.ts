import * as vscode from "vscode";

/**
 * <html> 태그에서 모든 lang 속성을 제거합니다.
 * - 값 형태: "..." | '...' | {...} | 식별자(ko 등) 모두 대응
 */
export function stripAllLangAttrs(tag: string): string {
  return tag.replace(
    /\s+\blang\b\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+)/gi,
    ""
  );
}

/**
 * <html> 태그에 lang="xx"를 주입합니다.
 * - 기존 속성이 있어도 안전하게 주입 (속성 순서만 조정될 수 있음)
 * - 대소문자 무시(i)로 매칭
 */
export function injectLang(tag: string, lang: string): string {
  return tag.replace(/^<html\b([^>]*)>/i, (_all, attrs) => {
    const trimmed = (attrs || "").replace(/\s+/g, " ").trim();
    return trimmed ? `<html lang="${lang}" ${trimmed}>` : `<html lang="${lang}">`;
  });
}

/**
 * BCP 47 코드 정규화
 * - 언어는 소문자, 지역(2글자)은 대문자, 스크립트(4글자)는 첫 글자 대문자
 *   예) "zh-cn" -> "zh-CN", "pt-br" -> "pt-BR"
 */
export function normalizeBCP47(code: string): string {
  const c = (code || "").toLowerCase().replace(/_/g, "-").trim();
  if (!c) return "en";
  const parts = c.split("-");
  return parts
    .map((p, i) => {
      if (i === 0) return p;            // lang
      if (p.length === 2) return p.toUpperCase();              // region
      if (p.length === 4) return p[0].toUpperCase() + p.slice(1); // script
      return p; // variants/extensions
    })
    .join("-");
}

/**
 * VS Code & 확장 설정을 기반으로 기본 언어 결정
 * 우선순위: workspace 설정(webA11yFixer.defaultLang) → vscode.env.language → 'en'
 */
export function resolveDefaultHtmlLang(): string {
  const cfg = vscode.workspace.getConfiguration("webA11yFixer");
  const cfgLang = (cfg.get<string>("defaultLang") || "").trim();
  const envLang = (vscode.env.language || "").trim(); // ex) "ko", "en", "zh-cn"
  return normalizeBCP47(cfgLang || envLang || "en");
}

/** 팀에서 QuickPick 등에 노출할 추천 코드 목록(원하면 수정/확장하세요) */
export const COMMON_LANG_CANDIDATES = [
  "en", "en-US", "en-GB",
  "ko",
  "ja",
  "zh-CN", "zh-TW",
  "fr", "de", "es", "it",
  "pt-BR",
  "ru",
  "ar",
];
