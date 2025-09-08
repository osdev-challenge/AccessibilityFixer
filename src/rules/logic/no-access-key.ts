import * as vscode from "vscode";
import { RuleContext } from "../types";

/**
 * accessKey 속성을 제거하는 Fixer
 * - 직접 속성: accessKey=… (문자열/표현식/숫자 등) 제거
 * - 스프레드: {...{ accessKey: 'm', ... }} 에서 accessKey 프로퍼티만 제거 (빈 객체면 스프레드 제거)
 * - 조건부 스프레드: {...(cond && { accessKey: 'o', ...})} 내부 객체에서도 동일 처리
 * - code에 없으면 fullLine로 fallback
 */
export function fixNoAccessKey(context: RuleContext): vscode.CodeAction[] {
  const fixes: vscode.CodeAction[] = [];

  const { document, range } = context;

  // 0) 대상 텍스트 (code → fullLine fallback)
  let textToFix = context.code ?? "";
  let replaceRange = range;

  const ensureLineRange = () => {
    const lineIdx = range.start.line;
    const lineText = document.lineAt(lineIdx).text;
    replaceRange = new vscode.Range(
      new vscode.Position(lineIdx, 0),
      new vscode.Position(lineIdx, lineText.length)
    );
  };

  if (!/\baccesskey\b/i.test(textToFix) && context.fullLine) {
    textToFix = context.fullLine;
    ensureLineRange();
  }

  // 대상 텍스트에 accessKey 흔적이 없으면 종료
  if (!/\baccesskey\b/i.test(textToFix)) return [];

  // 1) 직접 속성 제거: accessKey= "..." | '...' | {...}
  //  - 앞쪽 공백까지 포함해서 깔끔히 제거
  //  - 여러 개 있을 수 있으므로 g 플래그
  const removeDirectAttribute = (src: string) =>
    src.replace(
      /\s*\baccesskey\b\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|\S+)/gi,
      ""
    );

  // 2) 객체 리터럴 텍스트에서 accessKey: ... 프로퍼티만 제거하고 콤마/공백 정리
  //   - 중첩 객체까지 완벽 파싱은 아니지만, 일반적인 한 레벨 프로퍼티 나열은 안정적으로 커버
  //   - 예: "{ a:1, accessKey: 'm', b:2 }" -> "{ a:1, b:2 }"
  //   -    "{ accessKey: 'm' }" -> "{}"
  const stripAccessKeyPropertyInObjectLiteral = (objText: string) => {
    // objText는 바깥 중괄호 없이 "a:1, accessKey:'m', b:2" 형태로 들어온다
    // 1) 단순 접근: key: value 쌍을 콤마 기준으로 쪼개고 accessKey만 제거
    //    (괄호/중괄호/대괄호가 값에 있을 수 있지만, 일반적으로 테스트 입력은 한 레벨)
    const parts = objText.split(",");
    const kept: string[] = [];
    for (let p of parts) {
      const segment = p.trim();
      if (!segment) continue;
      // accessKey(대소문자 무시)로 시작하는 프로퍼티 탐지: "accessKey:" 또는 "'accessKey':" 등도 고려
      // 따옴표 유무 허용
      if (/^(['"]?\s*accesskey\s*['"]?\s*:)/i.test(segment)) {
        continue; // 버림
      }
      kept.push(segment);
    }
    const joined = kept.join(", ");
    return joined.trim();
  };

  // 3) 스프레드 객체 리터럴에서 accessKey 제거
  //    패턴: {...{ ...여기에 key:value 나열... }}
  //    그룹1: 앞부분 "{...{"
  //    그룹2: 내부 객체 텍스트
  //    그룹3: 뒷부분 "}}"
  const removeFromSpreadObjectLiterals = (src: string) =>
    src.replace(
      /\{\s*\.\.\.\s*\{\s*([^{}]*)\s*\}\s*\}/g,
      (_all, inner: string) => {
        const cleaned = stripAccessKeyPropertyInObjectLiteral(inner);
        if (!cleaned) {
          // 빈 객체가 되면 스프레드 자체를 제거
          return "";
        }
        return `{...{ ${cleaned} }}`;
      }
    );

  // 4) 조건부 스프레드 내부의 객체 리터럴에서 accessKey 제거
  //    패턴: {...(cond && { a:1, accessKey:'x' })}
  //    너무 일반화하면 어려우니 "&& { ... }"만 캐치
  const removeFromConditionalSpread = (src: string) =>
    src.replace(
      /\{\s*\.\.\.\s*\(\s*([^()]+?)\s*\)\s*\}/g,
      (_all, expr: string) => {
        // expr 예: "maybe && { accessKey: 'o' }" 또는 "flag ? { accessKey:'x' } : null" 등
        // 여기서는 가장 흔한 "&& { ... }"만 처리
        const replaced = expr.replace(
          /&&\s*\{\s*([^{}]*)\s*\}/g,
          (_a, innerObj: string) => {
            const cleaned = stripAccessKeyPropertyInObjectLiteral(innerObj);
            if (!cleaned) {
              // 빈 객체면 && {} -> && {} 를 날리면 "&&"만 남지 않게 주의.
              // "cond && {}"는 falsy 처리로 의미가 바뀔 수 있어 전체를 ""로 치우기
              return "";
            }
            return `&& { ${cleaned} }`;
          }
        );
        // 바뀐 expr로 다시 구성. 만약 위 치환으로 공백/연산자만 남는다면 스프레드 자체 제거
        const trimmed = replaced.trim();
        if (!trimmed || trimmed === "&&" || trimmed === "||") {
          return "";
        }
        return `{...(${trimmed})}`;
      }
    );

  // 5) 대문자/케이스 → 이미 모든 정규식에 i 플래그로 처리 (accessKey/ACCESSKEY/accesskey)

  // ─ 변환 파이프라인 실행
  let out = textToFix;
  out = removeDirectAttribute(out);
  out = removeFromSpreadObjectLiterals(out);
  out = removeFromConditionalSpread(out);

  // 변화 없으면 종료
  if (out === textToFix) return [];

  // 적용
  const fix = new vscode.CodeAction("accessKey 속성 제거", vscode.CodeActionKind.QuickFix);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, replaceRange, out);
  fix.edit = edit;
  fix.isPreferred = true;
  fix.diagnostics = [
    new vscode.Diagnostic(
      replaceRange,
      "accessKey 속성은 접근성에 문제가 될 수 있습니다. 제거를 권장합니다.",
      vscode.DiagnosticSeverity.Warning
    ),
  ];
  fixes.push(fix);

  return fixes;
}
