import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HandCollectionComponent } from './hand-collection.component';
import { DecklistService } from '../../services/decklist.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Card } from '../../models/card.model';
import { vi } from 'vitest';

describe('HandCollectionComponent', () => {
  let component: HandCollectionComponent;
  let fixture: ComponentFixture<HandCollectionComponent>;
  let mockDecklistService: any;
  let mockRouter: any;
  let mockLocation: any;
  let mockMessageService: any;

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

    mockLocation = {
      back: vi.fn()
    };

    mockMessageService = {
      add: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HandCollectionComponent],
      providers: [
        { provide: DecklistService, useValue: mockDecklistService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: MessageService, useValue: mockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HandCollectionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request hand on initialization', () => {
    expect(mockDecklistService.getRandomHand).toHaveBeenCalled();
  });

  it('should set hand data correctly', () => {
    expect(component.currentHand().length).toBe(7);
    expect(component.currentHandId()).toBe(1);
    expect(component.handMetadata().seatOrder).toBe(2);
  });

  it('should handle no selected decklist', () => {
    mockDecklistService.selectedDecklist = signal(null);
    
    component.onRequestHand();

    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        detail: 'Please select a decklist first'
      })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/decklists']);
  });

  it('should submit evaluation with correct data', () => {
    const evaluationData = {
      canCastEtali: true,
      minimumCardsToCastEtali: 5,
      cardsNeeded: 5
    };

    component.onSubmitEvaluation(evaluationData);

    expect(mockDecklistService.submitHandEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        canCastEtali: true,
        minimumCardsToCastEtali: 5
      })
    );
  });

  it('should show success message after submission', () => {
    const evaluationData = {
      canCastEtali: true,
      minimumCardsToCastEtali: 5,
      cardsNeeded: 5
    };

    component.onSubmitEvaluation(evaluationData);

    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        detail: 'Hand evaluation submitted successfully!'
      })
    );
  });

  it('should use Location.back() for goBackToDecklists', () => {
    component.goBackToDecklists();

    expect(mockLocation.back).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to statistics', () => {
    component.viewStatistics();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/decklists', 1, 'statistics']);
  });

  it('should update currentHand when onHandChanged is called', () => {
    const newHand = [
      { name: 'New Card', type: 'Artifact' }
    ];

    component.onHandChanged(newHand);

    expect(component.currentHand()).toEqual(newHand);
  });

  it('should compute allCards from selected decklist', () => {
    const allCards = component.allCards();

    expect(allCards).toEqual(mockCards);
  });

  // Note: The following tests for filteredLibraryCards, battlefield, etc. belong to 
  // shared-hand-evaluation component and are tested in shared-hand-evaluation.component.spec.ts
});
