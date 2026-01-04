export interface HandSizeStatistics {
  handSize: number;                    // 3, 4, 5, 6, or 7
  totalHands: number;
  successfulHands: number;
  probability: number;                 // 0.0 to 1.0
  confidenceIntervalLower: number;     // 90% CI lower bound
  confidenceIntervalUpper: number;     // 90% CI upper bound
}

export interface DecklistStatistics {
  decklistId: number;
  decklistName: string;
  totalHandsTested: number;
  handSizeStatistics: HandSizeStatistics[];
  overallMulliganProbability: number;
  overallMulliganConfidenceIntervalLower: number;
  overallMulliganConfidenceIntervalUpper: number;
}
