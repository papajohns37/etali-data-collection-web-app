import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedHandEvaluationComponent, HandMetadata } from './shared-hand-evaluation.component';
import { BattlefieldLayoutService } from '../../services/battlefield-layout.service';
import { Card } from '../../models/card.model';
import { vi } from 'vitest';

describe('SharedHandEvaluationComponent', () => {
  let component: SharedHandEvaluationComponent;
  let fixture: ComponentFixture<SharedHandEvaluationComponent>;
  let mockBattlefieldLayoutService: any;

  const mockCards: Card[] = [
    { name: 'Sol Ring', type: 'Artifact' },
    { name: 'Command Tower', type: 'Land' },
    { name: 'Lightning Bolt', type: 'Instant' },
    { name: 'Gamble', type: 'Sorcery' },
    { name: 'Mountain', type: 'Basic Land' },
    { name: 'Mana Crypt', type: 'Artifact' },
    { name: 'Etali, Primal Storm', type: 'Legendary Creature — Elder Dinosaur' }
  ];

  const mockMetadata: HandMetadata = {
    seatOrder: 2,
    stickers: [1, 3],
    lowestGambleOdds: 0.5,
    decklistName: 'Test Deck'
  };

  beforeEach(async () => {
    mockBattlefieldLayoutService = {
      getCardPosition: vi.fn().mockReturnValue({ x: 100, y: 100 })
    };

    await TestBed.configureTestingModule({
      imports: [SharedHandEvaluationComponent],
      providers: [
        { provide: BattlefieldLayoutService, useValue: mockBattlefieldLayoutService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SharedHandEvaluationComponent);
    component = fixture.componentInstance;
    
    // Set input signals using componentRef.setInput
    fixture.componentRef.setInput('hand', mockCards.slice(0, 7));
    fixture.componentRef.setInput('metadata', mockMetadata);
    fixture.componentRef.setInput('allCards', mockCards);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasGambleInHand', () => {
    it('should detect Gamble card in hand', () => {
      fixture.componentRef.setInput('hand', [
        { name: 'Sol Ring', type: 'Artifact' },
        { name: 'Gamble', type: 'Sorcery' }
      ]);
      fixture.detectChanges();

      expect(component.hasGambleInHand()).toBe(true);
    });

    it('should return false when no Gamble in hand', () => {
      fixture.componentRef.setInput('hand', [
        { name: 'Sol Ring', type: 'Artifact' },
        { name: 'Lightning Bolt', type: 'Instant' }
      ]);
      fixture.detectChanges();

      expect(component.hasGambleInHand()).toBe(false);
    });

    it('should be case-insensitive', () => {
      fixture.componentRef.setInput('hand', [
        { name: 'gamble', type: 'Sorcery' }
      ]);
      fixture.detectChanges();

      expect(component.hasGambleInHand()).toBe(true);
    });
  });

  describe('currentGambleOdds', () => {
    it('should calculate odds correctly', () => {
      fixture.componentRef.setInput('hand', [
        { name: 'Card 1', type: 'Artifact' },
        { name: 'Card 2', type: 'Artifact' },
        { name: 'Card 3', type: 'Artifact' },
        { name: 'Card 4', type: 'Artifact' },
        { name: 'Card 5', type: 'Artifact' }
      ]);
      component.cardsNeeded.set(2);
      fixture.detectChanges();

      // (5 - 2) / 5 = 0.6
      expect(component.currentGambleOdds()).toBe(0.6);
    });

    it('should return 0 when cardsNeeded is 1', () => {
      fixture.componentRef.setInput('hand', [
        { name: 'Card 1', type: 'Artifact' }
      ]);
      component.cardsNeeded.set(1);
      fixture.detectChanges();

      expect(component.currentGambleOdds()).toBe(0);
    });
  });

  describe('gamblePasses', () => {
    it('should return true when odds are above threshold', () => {
      fixture.componentRef.setInput('hand', [
        { name: 'Card 1', type: 'Artifact' },
        { name: 'Card 2', type: 'Artifact' },
        { name: 'Card 3', type: 'Artifact' },
        { name: 'Card 4', type: 'Artifact' },
        { name: 'Card 5', type: 'Artifact' }
      ]);
      fixture.componentRef.setInput('metadata', { ...mockMetadata, lowestGambleOdds: 0.5 });
      component.cardsNeeded.set(1);
      fixture.detectChanges();

      // (5 - 1) / 5 = 0.8 > 0.5
      expect(component.gamblePasses()).toBe(true);
    });

    it('should return false when odds are below threshold', () => {
      fixture.componentRef.setInput('hand', [
        { name: 'Card 1', type: 'Artifact' },
        { name: 'Card 2', type: 'Artifact' },
        { name: 'Card 3', type: 'Artifact' },
        { name: 'Card 4', type: 'Artifact' },
        { name: 'Card 5', type: 'Artifact' }
      ]);
      fixture.componentRef.setInput('metadata', { ...mockMetadata, lowestGambleOdds: 0.8 });
      component.cardsNeeded.set(1);
      fixture.detectChanges();

      // (5 - 1) / 5 = 0.8, not greater than 0.8
      expect(component.gamblePasses()).toBe(false);
    });
  });

  describe('minCardsForGamblePass', () => {
    it('should calculate minimum cards needed for gamble to pass', () => {
      fixture.componentRef.setInput('metadata', { ...mockMetadata, lowestGambleOdds: 0.6 });
      component.cardsNeeded.set(2);
      fixture.detectChanges();

      expect(component.minCardsForGamblePass()).toBe(5);
    });

    it('should return 0 when lowestGambleOdds is 0', () => {
      fixture.componentRef.setInput('metadata', { ...mockMetadata, lowestGambleOdds: 0 });
      component.cardsNeeded.set(1);
      fixture.detectChanges();

      expect(component.minCardsForGamblePass()).toBe(0);
    });
  });

  describe('onCanCastEtaliChange', () => {
    it('should calculate minimum cards when checked and no battlefield', () => {
      fixture.componentRef.setInput('hand', mockCards.slice(0, 7));
      component.battlefield.set([]);
      component.canCastEtali.set(true);
      fixture.detectChanges();

      component.onCanCastEtaliChange();

      expect(component.minimumCardsToCastEtali()).toBe(4); // 7 - 3
    });

    it('should calculate minimum cards when checked with battlefield', () => {
      fixture.componentRef.setInput('hand', mockCards.slice(0, 7));
      component.battlefield.set([
        { card: mockCards[0], x: 0, y: 0, tapped: false }
      ]);
      component.canCastEtali.set(true);
      fixture.detectChanges();

      component.onCanCastEtaliChange();

      expect(component.minimumCardsToCastEtali()).toBe(7); // 7 + 1 - 3 + 2
    });

    it('should not change value when unchecked', () => {
      component.canCastEtali.set(false);
      component.minimumCardsToCastEtali.set(8);
      fixture.detectChanges();

      component.onCanCastEtaliChange();

      expect(component.minimumCardsToCastEtali()).toBe(8);
    });
  });

  describe('libraryCards', () => {
    it('should return cards not in hand or battlefield', () => {
      fixture.componentRef.setInput('hand', [mockCards[0], mockCards[1]]);
      component.battlefield.set([
        { card: mockCards[2], x: 0, y: 0, tapped: false }
      ]);
      fixture.componentRef.setInput('allCards', mockCards);
      fixture.detectChanges();

      const library = component.libraryCards();

      expect(library.some(c => c.name === 'Gamble')).toBe(true);
      expect(library.some(c => c.name === 'Mountain')).toBe(true);
      expect(library.some(c => c.name === 'Sol Ring')).toBe(false);
      expect(library.some(c => c.name === 'Command Tower')).toBe(false);
    });

    it('should return all cards when hand and battlefield are empty', () => {
      fixture.componentRef.setInput('hand', []);
      component.battlefield.set([]);
      fixture.componentRef.setInput('allCards', mockCards);
      fixture.detectChanges();

      const library = component.libraryCards();

      expect(library.length).toBe(mockCards.length);
    });
  });

  describe('filteredLibraryCards', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('hand', []);
      component.battlefield.set([]);
      fixture.componentRef.setInput('allCards', mockCards);
      fixture.detectChanges();
    });

    it('should filter by search query', () => {
      component.searchQuery.set('ring');
      fixture.detectChanges();

      const filtered = component.filteredLibraryCards();

      expect(filtered.some(c => c.name === 'Sol Ring')).toBe(true);
      expect(filtered.some(c => c.name === 'Gamble')).toBe(false);
    });

    it('should be case-insensitive', () => {
      component.searchQuery.set('GAMBLE');
      fixture.detectChanges();

      const filtered = component.filteredLibraryCards();

      expect(filtered.some(c => c.name === 'Gamble')).toBe(true);
    });

    it('should return all library cards when query is empty', () => {
      component.searchQuery.set('');
      fixture.detectChanges();

      const filtered = component.filteredLibraryCards();

      expect(filtered.length).toBe(mockCards.length);
    });
  });

  describe('clearBattlefield', () => {
    it('should clear battlefield and reset evaluation state', () => {
      component.battlefield.set([
        { card: mockCards[0], x: 0, y: 0, tapped: false },
        { card: mockCards[1], x: 100, y: 0, tapped: false }
      ]);
      component.canCastEtali.set(true);
      component.minimumCardsToCastEtali.set(8);
      fixture.detectChanges();

      component.battlefield.set([]);
      component.canCastEtali.set(false);

      expect(component.battlefield().length).toBe(0);
      expect(component.canCastEtali()).toBe(false);
      expect(component.minimumCardsToCastEtali()).toBe(8);
    });
  });

  describe('onRequestHand', () => {
    it('should emit requestHand event', () => {
      const spy = vi.fn();
      component.requestHand.subscribe(spy);

      component.requestHand.emit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    it('should emit submitEvaluation with correct data', () => {
      const spy = vi.fn();
      component.submitEvaluation.subscribe(spy);
      component.canCastEtali.set(true);
      component.minimumCardsToCastEtali.set(5);
      component.cardsNeeded.set(3);

      component.submitEvaluation.emit({
        canCastEtali: true,
        minimumCardsToCastEtali: 5,
        cardsNeeded: 3
      });

      expect(spy).toHaveBeenCalledWith({
        canCastEtali: true,
        minimumCardsToCastEtali: 5,
        cardsNeeded: 3
      });
    });
  });

  describe('onGoBack', () => {
    it('should emit goBack event', () => {
      const spy = vi.fn();
      component.goBack.subscribe(spy);

      component.goBack.emit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('skip button', () => {
    it('should be visible when showSkipButton is true', () => {
      fixture.componentRef.setInput('showSkipButton', true);
      fixture.detectChanges();

      expect(component.showSkipButton()).toBe(true);
    });

    it('should not be visible when showSkipButton is false', () => {
      fixture.componentRef.setInput('showSkipButton', false);
      fixture.detectChanges();

      expect(component.showSkipButton()).toBe(false);
    });
  });

  describe('hand effect', () => {
    it('should sync internal hand state when hand input changes', () => {
      const newHand = [
        { name: 'New Card 1', type: 'Artifact' },
        { name: 'New Card 2', type: 'Land' }
      ];
      
      fixture.componentRef.setInput('hand', newHand);
      fixture.detectChanges();

      expect(component.currentHand()).toEqual(newHand);
    });
  });
});
