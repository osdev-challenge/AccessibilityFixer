import * as vscode from "vscode";
import { RuleContext } from "../types";

type Pair = {
  tag: "marquee" | "blink";
  outerStart: number;   // <tag ...> 시작
  openEnd: number;      // > 위치
  closeStart: number;   // </tag> 시작
  outerEnd: number;     // </tag> 끝(> 다음)
};

export function fixNoDistractingElements(context: RuleContext): vscode.CodeAction[] {
  const actions: vscode.CodeAction[] = [];
  const { document, range } = context;

  const text = document.getText();
  const toOff = (p: vscode.Position) => document.offsetAt(p);
  const toPos = (o: number) => document.positionAt(o);
  const caret = toOff(range.start);

  // 1) 모든 <marquee>/<blink> 쌍을 스택으로 수집 (중첩 안전)
  const OPEN = /<(marquee|blink)\b[^>]*>/gi;
  const CLOSE = /<\/(marquee|blink)\s*>/gi;

  const pairs: Pair[] = [];
  const stack: { tag: "marquee" | "blink"; outerStart: number; openEnd: number }[] = [];

  // 한 번에 좌→우 스캔: 여는/닫는 태그를 시간순으로 순회
  const events: { type: "open" | "close"; tag: "marquee" | "blink"; idx: number; len: number }[] = [];
  for (let m; (m = OPEN.exec(text)); ) {
    events.push({ type: "open", tag: m[1].toLowerCase() as any, idx: m.index, len: m[0].length });
  }
  for (let m; (m = CLOSE.exec(text)); ) {
    events.push({ type: "close", tag: m[1].toLowerCase() as any, idx: m.index, len: m[0].length });
  }
  events.sort((a, b) => a.idx - b.idx);

  for (const e of events) {
    if (e.type === "open") {
      const openEnd = text.indexOf(">", e.idx);
      if (openEnd === -1) continue;
      stack.push({ tag: e.tag, outerStart: e.idx, openEnd });
    } else {
      // close
      // 같은 태그의 마지막 open을 pop
      let i = stack.length - 1;
      while (i >= 0 && stack[i].tag !== e.tag) i--;
      if (i < 0) continue; // 비정상: 짝 없음
      const { tag, outerStart, openEnd } = stack.splice(i, 1)[0];
      pairs.push({
        tag,
        outerStart,
        openEnd,
        closeStart: e.idx,
        outerEnd: e.idx + e.len,
      });
    }
  }

  // 2) caret이 포함된 쌍을 찾는다 [outerStart, outerEnd)
  const hit = pairs.find(p => p.outerStart <= caret && caret < p.outerEnd);
  if (!hit) {
    // self-closing 대응: <marquee /> / <blink />
    const self = /<(marquee|blink)\b[^>]*\/>/gi;
    let m: RegExpExecArray | null;
    while ((m = self.exec(text))) {
      const s = m.index, e = s + m[0].length;
      if (s <= caret && caret < e) {
        const a = new vscode.CodeAction("방해 요소(<marquee/>, <blink/>) 제거", vscode.CodeActionKind.QuickFix);
        a.isPreferred = true;
        const edit = new vscode.WorkspaceEdit();
        edit.delete(document.uri, new vscode.Range(toPos(s), toPos(e)));
        a.edit = edit;
        actions.push(a);
        return actions;
      }
    }
    return actions; // 해당 없음
  }

  // 3) 언랩: 바깥 태그 제거, 내부만 남김
  const inner = text.slice(hit.openEnd + 1, hit.closeStart);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, new vscode.Range(toPos(hit.outerStart), toPos(hit.outerEnd)), inner);

  const action = new vscode.CodeAction("방해 요소(<marquee>, <blink>) 제거", vscode.CodeActionKind.QuickFix);
  action.isPreferred = true;
  action.edit = edit;

  // 우리 진단은 넣지 않음(ESLint 것만 보이게)
  actions.push(action);
  return actions;
}
