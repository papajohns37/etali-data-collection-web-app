import { Card } from './card.model';

export interface Hand {
  id: number;
  cards: Card[];
  seatOrder: number;
  stickers: number[];
  lowestGambleOdds: number;
  decklistId: number;
  decklistName: string;
}

export interface MaximumManaHandEvaluation {
  id: number;
  cards: Card[];
  seatOrder: number;
  stickers: number[];
  lowestGambleOdds: number;
  decklistId: number;
  decklistName: string;
  maximumManaIn7CardHand: number;
  maximumManaIn6CardHand: number;
  maximumManaIn5CardHand: number;
  maximumManaIn4CardHand: number;
  maximumManaIn3CardHand: number;
}
