// src/utils/scoring.ts
import { parseJsxFragment } from "./jsxAst";

/**
 * 로직 수정의 신뢰도 임계치.
 * 필요 시 .env/설정값으로 노출해도 됨.
 */
export const MIN_CONFIDENCE = 0.6;

/** 로직 판단의 근거(증거) 유형 */
export type Evidence =
  | "deterministic"        // 결정적 치환(금지어 제거, id 부여 등)
  | "caption"              // 캡션/figure/타이틀 기반 추정
  | "labelledby"           // aria-labelledby 대상 텍스트 기반 추정
  | "filename"             // src 파일명 기반 추정
  | "decorative"           // 장식 처리(alt="" / aria-hidden 등)
  | "emojiSemantic"        // 이모지 의미 키워드 매칭 성공
  | "emojiDecorative"      // 이모지 장식 처리
  | "actionDerived"        // 버튼/링크 행동 라벨(삭제/저장 등) 추정
  | "actionFallback"       // 버튼 기본값('Action') 같은 보수값
  | "derivedControl"       // input type/name/placeholder 기반 라벨 추정
  | "defaultControl"       // 컨트롤 기본값('Input'/'Field') 같은 보수값
  | "idDeterministic";     // ID 생성/부여(결정적)

/** 증거 유형별 기본 가중치(보수적) */
const WEIGHTS: Record<Evidence, number> = {
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
};

/**
 * 여러 증거가 있는 경우, 가장 강한 근거를 사용(보수적 max 전략).
 * 합산/평균보다 과한 낙관주의를 피하기 위함.
 */
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
 * - 점수가 임계치 미만이면 null
 * - JSX 파싱 실패면 null
 * - 둘 다 통과하면 snippet 반환
 */
export function approveOrNull(snippet: string, evidences: Evidence[], min = MIN_CONFIDENCE): string | null {
  const s = scoreByEvidences(evidences);
  if (!meetsThreshold(s, min)) return null;
  if (!validateJsx(snippet)) return null;
  return snippet;
}
