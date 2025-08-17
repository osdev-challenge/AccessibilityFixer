// aria-role 규칙 테스트 스크립트
import { getFixer } from "../ruleDispatcher";
import { RuleContext } from "../rules/types";

// 테스트용 가짜 VS Code 객체들
const mockDocument = {
  uri: { fsPath: "/test/file.tsx" },
  getText: () => "test content",
  lineAt: (line: number) => ({ text: "test line" })
} as any;

const mockRange = {
  start: { line: 0, character: 0 },
  end: { line: 0, character: 10 }
} as any;

// 테스트 케이스들
const testCases = [
  {
    name: "aria-role: 잘못된 role",
    ruleName: "aria-role",
    code: '<div role="buton">Click</div>',
    expected: '<div>Click</div>' // role 제거 예상
  },
  {
    name: "aria-role: 네이티브 충돌",
    ruleName: "aria-role", 
    code: '<button role="presentation">Save</button>',
    expected: '<button>Save</button>' // role 제거 예상
  },
  {
    name: "aria-props: 잘못된 aria-*",
    ruleName: "aria-props",
    code: '<div aria-label="valid" aria-invalid-prop="test">Hello</div>',
    expected: '<div aria-label="valid">Hello</div>' // 잘못된 aria-* 제거 예상
  },
  {
    name: "no-interactive-element-to-noninteractive-role",
    ruleName: "no-interactive-element-to-noninteractive-role",
    code: '<div role="button">OK</div>',
    expected: '<div>OK</div>' // role 제거 예상
  },
  {
    name: "no-noninteractive-element-to-interactive-role", 
    ruleName: "no-noninteractive-element-to-interactive-role",
    code: '<span role="button">Click</span>',
    expected: '<span>Click</span>' // role 제거 예상
  }
];

async function testAriaRoleRules() {
  console.log("🧪 aria-role 규칙 테스트 시작\n");

  for (const testCase of testCases) {
    console.log(`📋 테스트: ${testCase.name}`);
    console.log(`   입력: ${testCase.code}`);
    console.log(`   예상: ${testCase.expected}`);

    const fixer = getFixer(testCase.ruleName);
    if (!fixer) {
      console.log(`   ❌ 픽서 없음: ${testCase.ruleName}`);
      continue;
    }

    const context: RuleContext = {
      ruleName: testCase.ruleName,
      code: testCase.code,
      fileCode: testCase.code,
      lineNumber: 0,
      fullLine: testCase.code,
      range: mockRange,
      document: mockDocument
    };

    try {
      const result = await fixer(context);
      console.log(`   결과: ${result}`);
      
      if (result === testCase.expected) {
        console.log(`   ✅ 성공`);
      } else {
        console.log(`   ❌ 실패 - 예상과 다름`);
      }
    } catch (error) {
      console.log(`   ❌ 오류: ${error}`);
    }
    
    console.log("");
  }

  console.log("🏁 테스트 완료");
}

// 테스트 실행 (Node.js 환경에서만)
if (typeof process !== 'undefined') {
  testAriaRoleRules().catch(console.error);
}

export { testAriaRoleRules };
