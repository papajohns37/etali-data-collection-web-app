import { Injectable } from '@angular/core';
import { LAYOUT_CONSTANTS } from '../shared/constants';

export interface CardDimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface BattlefieldCard {
  x: number;
  y: number;
}

/**
 * Service for battlefield card layout calculations
 * Pure functions for positioning, collision detection, and constraints
 */
@Injectable({
  providedIn: 'root'
})
export class BattlefieldLayoutService {
  /**
   * Calculate card dimensions based on viewport size
   */
  calculateCardDimensions(): CardDimensions {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = Math.min(
      viewportWidth * LAYOUT_CONSTANTS.CARD_WIDTH_VIEWPORT_RATIO,
      viewportHeight * LAYOUT_CONSTANTS.CARD_HEIGHT_VIEWPORT_RATIO
    );
    const cardHeight = cardWidth * LAYOUT_CONSTANTS.MTG_CARD_ASPECT_RATIO;
    
    return { width: cardWidth, height: cardHeight };
  }

  /**
   * Find the next available position for a card on the battlefield
   * Starts from bottom-left, fills left-to-right, wraps up
   */
  findNextAvailablePosition(
    battlefieldRect: DOMRect,
    existingCards: BattlefieldCard[],
    cardDimensions: CardDimensions
  ): Position {
    const { width: cardWidth, height: cardHeight } = cardDimensions;
    const gap = LAYOUT_CONSTANTS.CARD_GAP_PX;
    
    let x = 0;
    let y = battlefieldRect.height - cardHeight;
    
    while (y >= 0) {
      while (x + cardWidth <= battlefieldRect.width) {
        if (!this.hasCollision({ x, y }, existingCards, cardDimensions)) {
          return this.constrainToBounds({ x, y }, battlefieldRect, cardDimensions);
        }
        x += cardWidth + gap;
      }
      
      // Move to next row up
      x = 0;
      y -= cardHeight + gap;
    }
    
    // If no space found, return top-left
    return this.constrainToBounds({ x: 0, y: 0 }, battlefieldRect, cardDimensions);
  }

  /**
   * Check if a position collides with any existing cards
   */
  hasCollision(
    position: Position,
    existingCards: BattlefieldCard[],
    cardDimensions: CardDimensions
  ): boolean {
    const { width: cardWidth, height: cardHeight } = cardDimensions;
    
    return existingCards.some(existingCard => {
      const overlapX = position.x < existingCard.x + cardWidth && 
                       position.x + cardWidth > existingCard.x;
      const overlapY = position.y < existingCard.y + cardHeight && 
                       position.y + cardHeight > existingCard.y;
      return overlapX && overlapY;
    });
  }

  /**
   * Constrain a position to stay within battlefield bounds
   */
  constrainToBounds(
    position: Position,
    battlefieldRect: DOMRect,
    cardDimensions: CardDimensions
  ): Position {
    const { width: cardWidth, height: cardHeight } = cardDimensions;
    
    return {
      x: Math.max(0, Math.min(position.x, battlefieldRect.width - cardWidth)),
      y: Math.max(0, Math.min(position.y, battlefieldRect.height - cardHeight))
    };
  }

  /**
   * Calculate new position after drag with constraints
   */
  calculateDragPosition(
    originalPosition: Position,
    dragDistance: { x: number; y: number },
    battlefieldRect: DOMRect,
    cardDimensions: CardDimensions
  ): Position {
    const newPosition = {
      x: originalPosition.x + dragDistance.x,
      y: originalPosition.y + dragDistance.y
    };
    
    return this.constrainToBounds(newPosition, battlefieldRect, cardDimensions);
  }
}
