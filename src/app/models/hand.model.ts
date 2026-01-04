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
