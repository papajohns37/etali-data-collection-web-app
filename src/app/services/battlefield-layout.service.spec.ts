import { TestBed } from '@angular/core/testing';
import { BattlefieldLayoutService, CardDimensions, Position, BattlefieldCard } from './battlefield-layout.service';
import { LAYOUT_CONSTANTS } from '../shared/constants';

describe('BattlefieldLayoutService', () => {
  let service: BattlefieldLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BattlefieldLayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateCardDimensions', () => {
    it('should calculate card dimensions based on aspect ratio', () => {
      const dimensions = service.calculateCardDimensions();

      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.height / dimensions.width).toBeCloseTo(LAYOUT_CONSTANTS.MTG_CARD_ASPECT_RATIO, 2);
    });
  });

  describe('findNextAvailablePosition', () => {
    const cardDimensions: CardDimensions = { width: 100, height: 140 };
    const battlefieldRect: DOMRect = {
      x: 0,
      y: 0,
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      bottom: 500,
      right: 500,
      toJSON: () => ({})
    };

    it('should return bottom-left position when battlefield is empty', () => {
      const position = service.findNextAvailablePosition(battlefieldRect, [], cardDimensions);

      expect(position.x).toBe(0);
      expect(position.y).toBe(battlefieldRect.height - cardDimensions.height);
    });

    it('should place second card to the right of first card', () => {
      const existingCards: BattlefieldCard[] = [
        { x: 0, y: battlefieldRect.height - cardDimensions.height }
      ];

      const position = service.findNextAvailablePosition(battlefieldRect, existingCards, cardDimensions);

      const gap = LAYOUT_CONSTANTS.CARD_GAP_PX;
      expect(position.x).toBe(cardDimensions.width + gap);
      expect(position.y).toBe(battlefieldRect.height - cardDimensions.height);
    });

    it('should wrap to next row when bottom row is full', () => {
      const gap = LAYOUT_CONSTANTS.CARD_GAP_PX;
      const existingCards: BattlefieldCard[] = [
        { x: 0, y: battlefieldRect.height - cardDimensions.height },
        { x: cardDimensions.width + gap, y: battlefieldRect.height - cardDimensions.height },
        { x: (cardDimensions.width + gap) * 2, y: battlefieldRect.height - cardDimensions.height },
        { x: (cardDimensions.width + gap) * 3, y: battlefieldRect.height - cardDimensions.height }
      ];

      const position = service.findNextAvailablePosition(battlefieldRect, existingCards, cardDimensions);

      expect(position.x).toBe(0);
      expect(position.y).toBe(battlefieldRect.height - (cardDimensions.height * 2 + gap));
    });

    it('should return top-left when no space available', () => {
      // Fill the entire battlefield
      const existingCards: BattlefieldCard[] = [];
      for (let y = 0; y < battlefieldRect.height; y += cardDimensions.height + LAYOUT_CONSTANTS.CARD_GAP_PX) {
        for (let x = 0; x < battlefieldRect.width; x += cardDimensions.width + LAYOUT_CONSTANTS.CARD_GAP_PX) {
          existingCards.push({ x, y });
        }
      }

      const position = service.findNextAvailablePosition(battlefieldRect, existingCards, cardDimensions);

      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });
  });

  describe('hasCollision', () => {
    const cardDimensions: CardDimensions = { width: 100, height: 140 };

    it('should return false when no existing cards', () => {
      const position: Position = { x: 0, y: 0 };

      const hasCollision = service.hasCollision(position, [], cardDimensions);

      expect(hasCollision).toBe(false);
    });

    it('should return true when position overlaps with existing card', () => {
      const existingCards: BattlefieldCard[] = [{ x: 50, y: 50 }];
      const position: Position = { x: 60, y: 60 };

      const hasCollision = service.hasCollision(position, existingCards, cardDimensions);

      expect(hasCollision).toBe(true);
    });

    it('should return false when position does not overlap', () => {
      const existingCards: BattlefieldCard[] = [{ x: 0, y: 0 }];
      const position: Position = { x: 200, y: 200 };

      const hasCollision = service.hasCollision(position, existingCards, cardDimensions);

      expect(hasCollision).toBe(false);
    });

    it('should return false when cards are exactly adjacent horizontally', () => {
      const existingCards: BattlefieldCard[] = [{ x: 0, y: 0 }];
      const position: Position = { x: cardDimensions.width, y: 0 };

      const hasCollision = service.hasCollision(position, existingCards, cardDimensions);

      expect(hasCollision).toBe(false);
    });

    it('should return false when cards are exactly adjacent vertically', () => {
      const existingCards: BattlefieldCard[] = [{ x: 0, y: 0 }];
      const position: Position = { x: 0, y: cardDimensions.height };

      const hasCollision = service.hasCollision(position, existingCards, cardDimensions);

      expect(hasCollision).toBe(false);
    });

    it('should detect collision with multiple cards', () => {
      const existingCards: BattlefieldCard[] = [
        { x: 0, y: 0 },
        { x: 200, y: 200 },
        { x: 50, y: 50 }
      ];
      const position: Position = { x: 60, y: 60 };

      const hasCollision = service.hasCollision(position, existingCards, cardDimensions);

      expect(hasCollision).toBe(true);
    });
  });

  describe('constrainToBounds', () => {
    const cardDimensions: CardDimensions = { width: 100, height: 140 };
    const battlefieldRect: DOMRect = {
      x: 0,
      y: 0,
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      bottom: 500,
      right: 500,
      toJSON: () => ({})
    };

    it('should not modify position when within bounds', () => {
      const position: Position = { x: 100, y: 100 };

      const constrained = service.constrainToBounds(position, battlefieldRect, cardDimensions);

      expect(constrained).toEqual(position);
    });

    it('should constrain position when x is negative', () => {
      const position: Position = { x: -50, y: 100 };

      const constrained = service.constrainToBounds(position, battlefieldRect, cardDimensions);

      expect(constrained.x).toBe(0);
      expect(constrained.y).toBe(100);
    });

    it('should constrain position when y is negative', () => {
      const position: Position = { x: 100, y: -50 };

      const constrained = service.constrainToBounds(position, battlefieldRect, cardDimensions);

      expect(constrained.x).toBe(100);
      expect(constrained.y).toBe(0);
    });

    it('should constrain position when card extends beyond right edge', () => {
      const position: Position = { x: 450, y: 100 };

      const constrained = service.constrainToBounds(position, battlefieldRect, cardDimensions);

      expect(constrained.x).toBe(battlefieldRect.width - cardDimensions.width);
      expect(constrained.y).toBe(100);
    });

    it('should constrain position when card extends beyond bottom edge', () => {
      const position: Position = { x: 100, y: 450 };

      const constrained = service.constrainToBounds(position, battlefieldRect, cardDimensions);

      expect(constrained.x).toBe(100);
      expect(constrained.y).toBe(battlefieldRect.height - cardDimensions.height);
    });

    it('should constrain both x and y when position is completely out of bounds', () => {
      const position: Position = { x: -100, y: 600 };

      const constrained = service.constrainToBounds(position, battlefieldRect, cardDimensions);

      expect(constrained.x).toBe(0);
      expect(constrained.y).toBe(battlefieldRect.height - cardDimensions.height);
    });
  });

  describe('calculateDragPosition', () => {
    const cardDimensions: CardDimensions = { width: 100, height: 140 };
    const battlefieldRect: DOMRect = {
      x: 0,
      y: 0,
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      bottom: 500,
      right: 500,
      toJSON: () => ({})
    };

    it('should calculate new position after drag', () => {
      const originalPosition: Position = { x: 100, y: 100 };
      const dragDistance = { x: 50, y: 50 };

      const newPosition = service.calculateDragPosition(
        originalPosition,
        dragDistance,
        battlefieldRect,
        cardDimensions
      );

      expect(newPosition.x).toBe(150);
      expect(newPosition.y).toBe(150);
    });

    it('should constrain drag to battlefield bounds', () => {
      const originalPosition: Position = { x: 400, y: 400 };
      const dragDistance = { x: 200, y: 200 };

      const newPosition = service.calculateDragPosition(
        originalPosition,
        dragDistance,
        battlefieldRect,
        cardDimensions
      );

      expect(newPosition.x).toBe(battlefieldRect.width - cardDimensions.width);
      expect(newPosition.y).toBe(battlefieldRect.height - cardDimensions.height);
    });

    it('should prevent negative positions during drag', () => {
      const originalPosition: Position = { x: 50, y: 50 };
      const dragDistance = { x: -100, y: -100 };

      const newPosition = service.calculateDragPosition(
        originalPosition,
        dragDistance,
        battlefieldRect,
        cardDimensions
      );

      expect(newPosition.x).toBe(0);
      expect(newPosition.y).toBe(0);
    });
  });
});
