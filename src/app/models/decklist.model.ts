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
  
  /**
   * The ID of the user who created this decklist.
   * Optional for legacy decklists created before user tracking.
   */
  createdByUserId?: string;
}

/**
 * Response from renaming a decklist
 */
export interface RenameResponse {
  message: string;
  id: number;
  oldName: string;
  newName: string;
}
