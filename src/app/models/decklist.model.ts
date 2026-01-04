import { Card } from './card.model';

export interface Decklist {
  id: number;
  name: string;
  
  /**
   * Array of all cards in the decklist with their properties.
   * Typically contains 99 cards for Commander format.
   */
  cards: Card[];
  
  /**
   * The public URL to view this decklist on Moxfield.
   */
  moxfieldUrl?: string;
  
  /**
   * The UTC timestamp when this decklist was added to the system.
   */
  createdAt: Date;
}
