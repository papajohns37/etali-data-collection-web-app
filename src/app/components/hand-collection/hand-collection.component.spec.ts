import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HandCollectionComponent } from './hand-collection.component';
import { DecklistService } from '../../services/decklist.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Card } from '../../models/card.model';
import { vi } from 'vitest';

describe('HandCollectionComponent', () => {
  let component: HandCollectionComponent;
  let fixture: ComponentFixture<HandCollectionComponent>;
  let mockDecklistService: any;
  let mockRouter: any;

  const mockCards: Card[] = [
    { name: 'Sol Ring', type: 'Artifact' },
    { name: 'Command Tower', type: 'Land' },
    { name: 'Lightning Bolt', type: 'Instant' },
    { name: 'Gamble', type: 'Sorcery' },
    { name: 'Mountain', type: 'Basic Land' }
  ];

  beforeEach(async () => {
    mockDecklistService = {
      selectedDecklist: signal({
        id: 1,
        name: 'Test Deck',
        cards: mockCards,
        createdAt: new Date()
      }),
      getRandomHand: vi.fn().mockReturnValue(of({
        id: 1,
        cards: mockCards.slice(0, 7),
        seatOrder: 2,
        stickers: [1, 3],
        lowestGambleOdds: 0.5,
        decklistId: 1,
        decklistName: 'Test Deck'
      })),
      submitHandEvaluation: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HandCollectionComponent],
      providers: [
        { provide: DecklistService, useValue: mockDecklistService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HandCollectionComponent);
    component = fixture.componentInstance;
  });

  describe('hasGambleInHand', () => {
    it('should detect Gamble card in hand', () => {
      component.currentHand.set([
        { name: 'Sol Ring', type: 'Artifact' },
        { name: 'Gamble', type: 'Sorcery' }
      ]);

      expect(component.hasGambleInHand()).toBe(true);
    });

    it('should return false when no Gamble in hand', () => {
      component.currentHand.set([
        { name: 'Sol Ring', type: 'Artifact' },
        { name: 'Lightning Bolt', type: 'Instant' }
      ]);

      expect(component.hasGambleInHand()).toBe(false);
    });

    it('should be case-insensitive', () => {
      component.currentHand.set([
        { name: 'gamble', type: 'Sorcery' }
      ]);

      expect(component.hasGambleInHand()).toBe(true);
    });
  });

  describe('currentGambleOdds', () => {
    it('should calculate odds correctly', () => {
      component.currentHand.set([
        { name: 'Card 1', type: 'Artifact' },
        { name: 'Card 2', type: 'Artifact' },
        { name: 'Card 3', type: 'Artifact' },
        { name: 'Card 4', type: 'Artifact' },
        { name: 'Card 5', type: 'Artifact' }
      ]);
      component.cardsNeeded.set(2);

      // (5 - 2) / 5 = 0.6
      expect(component.currentGambleOdds()).toBe(0.6);
    });

    it('should return 0 when hand is empty', () => {
      component.currentHand.set([]);
      component.cardsNeeded.set(1);

      expect(component.currentGambleOdds()).toBe(0);
    });
  });

  describe('gamblePasses', () => {
    it('should return true when odds meet or exceed threshold', () => {
      component.currentHand.set([
        { name: 'Card 1', type: 'Artifact' },
        { name: 'Card 2', type: 'Artifact' },
        { name: 'Card 3', type: 'Artifact' },
        { name: 'Card 4', type: 'Artifact' }
      ]);
      component.cardsNeeded.set(1);
      component.lowestGambleOdds = 0.5;

      // (4 - 1) / 4 = 0.75 >= 0.5
      expect(component.gamblePasses()).toBe(true);
    });

    it('should return false when odds below threshold', () => {
      component.currentHand.set([
        { name: 'Card 1', type: 'Artifact' },
        { name: 'Card 2', type: 'Artifact' }
      ]);
      component.cardsNeeded.set(1);
      component.lowestGambleOdds = 0.8;

      // (2 - 1) / 2 = 0.5 < 0.8
      expect(component.gamblePasses()).toBe(false);
    });
  });

  describe('minCardsForGamblePass', () => {
    it('should calculate minimum cards needed for gamble to pass', () => {
      component.cardsNeeded.set(2);
      component.lowestGambleOdds = 0.6;

      // N >= 2 / (1 - 0.6) = 2 / 0.4 = 5
      expect(component.minCardsForGamblePass()).toBe(5);
    });

    it('should return 0 when threshold is 0', () => {
      component.cardsNeeded.set(1);
      component.lowestGambleOdds = 0;

      expect(component.minCardsForGamblePass()).toBe(0);
    });
  });

  describe('onCanCastEtaliChange', () => {
    it('should set minimumCardsToCastEtali to 7 minus hand size', () => {
      component.currentHand.set([
        { name: 'Card 1', type: 'Artifact' },
        { name: 'Card 2', type: 'Artifact' },
        { name: 'Card 3', type: 'Artifact' }
      ]);
      component.canCastEtali = true;

      component.onCanCastEtaliChange();

      expect(component.minimumCardsToCastEtali).toBe(4); // 7 - 3
    });

    it('should handle empty hand', () => {
      component.currentHand.set([]);
      component.canCastEtali = true;

      component.onCanCastEtaliChange();

      expect(component.minimumCardsToCastEtali).toBe(7);
    });

    it('should not change value when checkbox unchecked', () => {
      component.currentHand.set([
        { name: 'Card 1', type: 'Artifact' }
      ]);
      component.canCastEtali = false;
      component.minimumCardsToCastEtali = 8;

      component.onCanCastEtaliChange();

      expect(component.minimumCardsToCastEtali).toBe(8);
    });
  });

  describe('libraryCards', () => {
    it('should filter out cards in hand and battlefield', () => {
      component.currentHand.set([
        mockCards[0], // Sol Ring
        mockCards[1]  // Command Tower
      ]);
      component.battlefield.set([
        { card: mockCards[2], x: 0, y: 0, tapped: false } // Lightning Bolt
      ]);

      const library = component.libraryCards();

      expect(library.length).toBe(2); // Gamble and Mountain remain
      expect(library.some(c => c.name === 'Gamble')).toBe(true);
      expect(library.some(c => c.name === 'Mountain')).toBe(true);
      expect(library.some(c => c.name === 'Sol Ring')).toBe(false);
    });

    it('should return empty array when no decklist selected', () => {
      mockDecklistService.selectedDecklist.set(null);

      const library = component.libraryCards();

      expect(library).toEqual([]);
    });
  });

  describe('filteredLibraryCards', () => {
    beforeEach(() => {
      component.currentHand.set([]);
      component.battlefield.set([]);
    });

    it('should filter cards by search query', () => {
      component.searchQuery.set('ring');

      const filtered = component.filteredLibraryCards();

      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Sol Ring');
    });

    it('should be case-insensitive', () => {
      component.searchQuery.set('GAMBLE');

      const filtered = component.filteredLibraryCards();

      expect(filtered.some(c => c.name === 'Gamble')).toBe(true);
    });

    it('should sort results alphabetically', () => {
      component.searchQuery.set('');

      const filtered = component.filteredLibraryCards();

      for (let i = 0; i < filtered.length - 1; i++) {
        expect(filtered[i].name.localeCompare(filtered[i + 1].name)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('onRequestHand', () => {
    it('should fetch new hand and reset state', async () => {
      fixture.detectChanges(); // Trigger ngOnInit

      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockDecklistService.getRandomHand).toHaveBeenCalledWith('Test Deck');
      expect(component.currentHand().length).toBeGreaterThan(0);
      expect(component.battlefield().length).toBe(0);
      expect(component.canCastEtali).toBe(false);
      expect(component.minimumCardsToCastEtali).toBe(8);
    });

    it('should redirect when no decklist selected', () => {
      mockDecklistService.selectedDecklist.set(null);

      component.onRequestHand();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/decklists']);
      expect(component.evaluationMessage).toContain('Please select a decklist first');
    });

    it('should handle API errors gracefully', async () => {
      mockDecklistService.getRandomHand.mockReturnValue(
        throwError(() => ({ status: 404, error: { error: 'Decklist not found' } }))
      );

      component.onRequestHand();

      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(component.evaluationMessage).toContain('Decklist');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('onSubmitEvaluation', () => {
    it('should submit evaluation with Card array', async () => {
      component.currentHandId = 1;
      component.currentHand.set([mockCards[0]]);
      component.seatOrder = 2;
      component.stickers = [1];
      component.lowestGambleOdds = 0.5;
      component.canCastEtali = true;
      component.minimumCardsToCastEtali = 5;
      component.currentDecklistId = 1;
      component.currentDecklistName = 'Test Deck';

      component.onSubmitEvaluation();

      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockDecklistService.submitHandEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({
          cards: [mockCards[0]],
          canCastEtali: true,
          minimumCardsToCastEtali: 5
        })
      );
    });
  });
});
