import { Hand } from './hand.model';

/**
 * Request body to start a new mulligan session.
 */
export interface MulliganStartRequest {
  decklistId: number;
}

/**
 * Response from POST /mulligan/start.
 * Contains the first hand and session metadata.
 */
export interface MulliganStartResponse {
  sessionId: number;
  currentHand: Hand;
  handNumber: number;
  targetHandSize: number;
  canMulligan: boolean;
}

/**
 * Request body for POST /mulligan/evaluate.
 * Submits the user's evaluation decision for the current hand.
 */
export interface MulliganEvaluationRequest {
  sessionId: number;
  handNumber: number;
  canCastEtaliByTurn2: boolean;
  keepHand: boolean;
  activateSerumPowder?: boolean;
  /** Zero-based indices into currentHand.cards for cards to place on the bottom of the library */
  cardsToBottomIndices?: number[];
}

/**
 * Summary returned when a mulligan session completes.
 */
export interface MulliganSessionSummary {
  sessionId: number;
  foundSuccessfulHand: boolean;
  finalHandSize: number;
  totalMulligans: number;
  totalSerumPowderActivations: number;
}

/**
 * Response from POST /mulligan/evaluate.
 * Either continues the session with a new hand or marks the session complete.
 */
export interface MulliganEvaluationResponse {
  sessionComplete: boolean;
  nextHand: Hand | null;
  nextHandNumber: number | null;
  nextTargetHandSize: number | null;
  canMulligan: boolean;
  summary: MulliganSessionSummary | null;
}

/**
 * Aggregated statistics for a single decklist's mulligan performance.
 */
export interface MulliganStatistics {
  decklistId: number;
  decklistName: string;
  totalSessions: number;
  successfulSessions: number;
  successRate: number;
  averageMulligans: number;
  /** Number of successes keyed by hand size (3–7) */
  successByHandSize: Record<number, number>;
  /** Number of sessions keyed by number of mulligans taken */
  mulliganDistribution: Record<number, number>;
  totalSerumPowderActivations: number;
  averageSerumPowderActivations: number;
  sessionsWithSerumPowder: number;
  successRateWithSerumPowder: number;
  successRateWithoutSerumPowder: number;
}

/**
 * Statistical significance test result comparing two decklists.
 */
export interface MulliganStatisticalTest {
  zScore: number;
  pValue: number;
  isSignificant: boolean;
  interpretation: string;
}

/**
 * Response from POST /mulligan/statistics/compare.
 */
export interface MulliganComparisonResult {
  decklist1Stats: MulliganStatistics;
  decklist2Stats: MulliganStatistics;
  successRateDifference: number;
  statisticalTest: MulliganStatisticalTest;
}

/**
 * The user's chosen action after evaluating a hand.
 */
export type MulliganAction = 'keep' | 'mulligan' | 'serum-powder';
