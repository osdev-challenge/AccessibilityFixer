import { parseJsxFragment } from "./jsxAst";

/** 로직 수정의 기본 신뢰도 임계치 */
export const MIN_CONFIDENCE = 0.6;

/** 로직 판단의 근거(증거) 유형 */
export type Evidence =
  // (라벨링/콘텐츠 계열 — 기존)
  | "deterministic"
  | "caption"
  | "labelledby"
  | "filename"
  | "decorative"
  | "emojiSemantic"
  | "emojiDecorative"
  | "actionDerived"
  | "actionFallback"
  | "derivedControl"
  | "defaultControl"
  | "idDeterministic"
  // (aria-role 계열 — 추가)
  | "invalidRole"                   // 명세에 없는 role 제거
  | "roleConflict"                  // 네이티브 시맨틱과 충돌하는 role 제거
  | "presentationalOnInteractive"   // 인터랙티브 요소에 presentation/none 제거
  | "interactiveRoleOnNoninteractive"; // 비인터랙티브 요소의 인터랙티브 role 제거

/** 증거 유형별 기본 가중치(보수적) */
const WEIGHTS: Record<Evidence, number> = {
  // 기존
  deterministic:   0.75,
  idDeterministic: 0.7,
  caption:         0.65,
  labelledby:      0.65,
  emojiSemantic:   0.65,
  emojiDecorative: 0.6,
  decorative:      0.6,
  filename:        0.55,
  actionDerived:   0.65,
  derivedControl:  0.65,
  actionFallback:  0.55,
  defaultControl:  0.55,
  // aria-role 계열 (결정성 높은 순으로 약간 차등)
  invalidRole:                 0.75,
  roleConflict:                0.72,
  presentationalOnInteractive: 0.72,
  interactiveRoleOnNoninteractive: 0.70,
};

/** 여러 증거가 있을 땐 가장 강한 근거만 채택(보수적 max 전략) */
export function scoreByEvidences(evidences: Evidence[]): number {
  if (!evidences.length) return 0;
  return Math.max(...evidences.map(e => WEIGHTS[e] ?? 0));
}

export function meetsThreshold(s: number, min = MIN_CONFIDENCE): boolean {
  return s >= min;
}

/** 변환 결과가 JSX로 유효한지 검증 */
export function validateJsx(snippet: string): boolean {
  try { parseJsxFragment(snippet); return true; }
  catch { return false; }
}

/**
 * 점수/검증을 한 번에 처리.
 * - evidences로 점수 계산
 * - 임계치 미만이면 null
 * - JSX 파싱 실패면 null
 * - 둘 다 통과하면 snippet 반환
 */
export function approveOrNull(
  snippet: string,
  evidences: Evidence[],
  min = MIN_CONFIDENCE
): string | null {
  const s = scoreByEvidences(evidences);
  if (!meetsThreshold(s, min)) return null;
  if (!validateJsx(snippet)) return null;
  return snippet;
}
