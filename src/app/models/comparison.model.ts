import { Card } from './card.model';

export interface DeckComparison {
  id: number;
  deck1Id: number;
  deck1Name: string;
  deck2Id: number;
  deck2Name: string;
  deck1N: number;
  deck2N: number;
  createdAt: Date;
}

export interface DeckComparisonHand {
  id: number;
  comparisonId: number;
  whichDeck: 1 | 2;
  cards: Card[];
  seatOrder: number;
  stickers: number[];
  decklistId: number;
  decklistName: string;
  lowestGambleOdds: number;
  generationAttempts: number;
}

export interface HandSizeDeltaStatistics {
  handSize: number;
  probabilityDifference: number;
  confidenceIntervalLower: number;
  confidenceIntervalUpper: number;
}

export interface DeckComparisonStatistics {
  comparisonId: number;
  deck1Id: number;
  deck1Name: string;
  deck2Id: number;
  deck2Name: string;
  deck1TotalHandsEvaluated: number;
  deck2TotalHandsEvaluated: number;
  handSizeDeltaStatistics: HandSizeDeltaStatistics[];
  overallProbabilityDifference: number;
  overallConfidenceIntervalLower: number;
  overallConfidenceIntervalUpper: number;
}

export interface CardDifferences {
  cardsOnlyInDeck1: Card[];
  cardsOnlyInDeck2: Card[];
  sharedCards: Card[];
}
