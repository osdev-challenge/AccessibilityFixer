// // 테스트용 - vscode 없이 실행
// const testCases = [
//   `<h1></h1>`,
//   `<h2>     </h2>`,
//   `<h3 id="test" class="t"></h3>`,
//   `<h4 class="a">   </h4>`,
// ];

// testCases.forEach((code, i) => {
//   const result = code.replace(
//     /<h([1-6])([^>]*)>\s*<\/h\1>/i,
//     (_match, level, attrs) => `<h${level}${attrs}>빈제목</h${level}>`
//   );

//   console.log(`🧪 Test ${i + 1}`);
//   console.log(`  BEFORE: ${code}`);
//   console.log(`  AFTER : ${result}`);
//   console.log('--------------------');
// });
