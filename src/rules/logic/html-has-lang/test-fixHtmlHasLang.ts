// test-fixHtmlHasLang.ts

function fixHtmlHasLang(code: string): string {
  // 이미 lang 속성이 있으면 그대로 반환
  if (/lang\s*=\s*["'][^"']*["']/i.test(code)) {
    return code;
  }

  // <html> 태그에서 lang="ko" 속성을 추가
  return code.replace(/<html(\s*[^>]*)?>/i, (_match, attrs = '') => {
    const insert = attrs.trim() ? ` lang="ko" ${attrs.trim()}` : ` lang="ko"`;
    return `<html${insert}>`;
  });
}

// =======================
// ✅ 테스트 케이스
// =======================

const testCases = [
  `<html>`,
  `<html class="light">`,
  `<html lang="en" class="light">`, // 수정되지 않아야 함
  `<html id="main" data-theme="dark">`,
  `<HTML>`, // 대소문자 대응
  `<html    >`
];

testCases.forEach((code, i) => {
  const result = fixHtmlHasLang(code);
  console.log(`🧪 Test ${i + 1}`);
  console.log(`  BEFORE: ${code}`);
  console.log(`  AFTER : ${result}`);
  console.log('-----------------------------');
});
