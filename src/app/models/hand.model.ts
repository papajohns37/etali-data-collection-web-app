export interface Hand {
  id: number;
  cards: string[];
  seatOrder: number;
  stickers: number[];
  lowestGambleOdds: number;
  decklistId: number;
  decklistName: string;
}
