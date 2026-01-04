/**
 * Represents a Magic: The Gathering card with its basic properties.
 */
export interface Card {
  /**
   * The name of the card.
   * @example "Sol Ring"
   */
  name: string;
  
  /**
   * The type line of the card (e.g., "Artifact", "Creature — Human Wizard", "Instant").
   * @example "Artifact"
   */
  type: string;
}
