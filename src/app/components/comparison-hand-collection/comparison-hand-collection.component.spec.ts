import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparisonHandCollectionComponent } from './comparison-hand-collection.component';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { DecklistService } from '../../services/decklist.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';

describe('ComparisonHandCollectionComponent', () => {
  let component: ComparisonHandCollectionComponent;
  let fixture: ComponentFixture<ComparisonHandCollectionComponent>;
  let mockComparisonService: any;
  let mockDecklistService: any;
  let mockRouter: any;
  let mockLocation: any;
  let mockMessageService: any;

  const mockCards = [
    { name: 'Sol Ring', type: 'Artifact' },
    { name: 'Command Tower', type: 'Land' },
    { name: 'Lightning Bolt', type: 'Instant' },
    { name: 'Mountain', type: 'Land' },
    { name: 'Forest', type: 'Land' }
  ];

  const mockDecklists = [
    {
      id: 10,
      name: 'Test Deck 1',
      cards: mockCards,
      createdAt: new Date()
    }
  ];

  const mockHand = {
    id: 1,
    cards: [
      { name: 'Sol Ring', type: 'Artifact' },
      { name: 'Command Tower', type: 'Land' },
      { name: 'Lightning Bolt', type: 'Instant' }
    ],
    seatOrder: 2,
    stickers: [1, 3],
    lowestGambleOdds: 0.5,
    decklistId: 10,
    decklistName: 'Test Deck 1',
    generationAttempts: 3
  };

  beforeEach(async () => {
    mockComparisonService = {
      generateHand: vi.fn().mockReturnValue(of(mockHand)),
      submitEvaluation: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockDecklistService = {
      loadDecklists: vi.fn().mockReturnValue(of(mockDecklists)),
      decklists: signal(mockDecklists)
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
      imports: [ComparisonHandCollectionComponent],
      providers: [
        { provide: DeckComparisonService, useValue: mockComparisonService },
        { provide: DecklistService, useValue: mockDecklistService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: MessageService, useValue: mockMessageService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn((key: string) => key === 'id' ? '1' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComparisonHandCollectionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load comparison ID from route', () => {
    expect(component.comparisonId()).toBe(1);
  });

  it('should request hand on initialization', () => {
    expect(mockComparisonService.generateHand).toHaveBeenCalledWith(1);
  });

  it('should set hand data after requesting hand', () => {
    expect(component.currentHand()).toEqual(mockHand.cards);
    expect(component.currentHandData()).toEqual(mockHand);
    expect(component.isLoading()).toBe(false);
  });

  it('should compute hand metadata correctly', () => {
    const metadata = component.handMetadata();

    expect(metadata.seatOrder).toBe(2);
    expect(metadata.stickers).toEqual([1, 3]);
    expect(metadata.lowestGambleOdds).toBe(0.5);
    expect(metadata.decklistName).toBe('Test Deck 1');
    expect(metadata.whichDeck).toBe(1);
    expect(metadata.generationAttempts).toBe(3);
  });

  it('should load decklists on initialization', () => {
    expect(mockDecklistService.loadDecklists).toHaveBeenCalled();
  });

  it('should compute allCards from decklist', () => {
    const allCards = component.allCards();

    expect(allCards).toEqual(mockCards);
    expect(allCards.length).toBe(5);
  });

  it('should return empty array for allCards when no hand data', () => {
    component.currentHandData.set(null);
    const allCards = component.allCards();

    expect(allCards).toEqual([]);
  });

  it('should return empty array for allCards when decklist not found', () => {
    const handWithInvalidDecklistId = {
      ...mockHand,
      decklistId: 999 // non-existent decklist ID
    };
    component.currentHandData.set(handWithInvalidDecklistId);
    const allCards = component.allCards();

    expect(allCards).toEqual([]);
  });

  it('should handle hand generation error', () => {
    mockComparisonService.generateHand = vi.fn().mockReturnValue(
      throwError(() => new Error('Generation failed'))
    );

    component.onRequestHand();

    expect(component.isLoading()).toBe(false);
    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate hand'
      })
    );
  });

  it('should submit evaluation with correct data', () => {
    const evaluationData = {
      canCastEtali: true,
      minimumCardsToCastEtali: 5,
      cardsNeeded: 3
    };

    component.onSubmitEvaluation(evaluationData);

    expect(mockComparisonService.submitEvaluation).toHaveBeenCalledWith(
      1, // comparison ID
      1, // whichDeck
      3, // generationAttempts
      expect.objectContaining({
        id: 1,
        canCastEtali: true,
        minimumCardsToCastEtali: 5
      })
    );
  });

  it('should show success message after submitting evaluation', () => {
    const evaluationData = {
      canCastEtali: true,
      minimumCardsToCastEtali: 5,
      cardsNeeded: 3
    };

    component.onSubmitEvaluation(evaluationData);

    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Success',
        detail: 'Hand evaluation submitted'
      })
    );
    expect(component.evaluationMessage()).toBe('Evaluation submitted successfully!');
  });

  it('should request new hand after successful submission', async () => {
    const evaluationData = {
      canCastEtali: true,
      minimumCardsToCastEtali: 5,
      cardsNeeded: 3
    };

    // Reset the mock to track new calls
    mockComparisonService.generateHand.mockClear();

    component.onSubmitEvaluation(evaluationData);

    // Wait for the setTimeout in the component
    await new Promise(resolve => setTimeout(resolve, 1100));
    expect(mockComparisonService.generateHand).toHaveBeenCalledWith(1);
  });

  it('should handle evaluation submission error', () => {
    mockComparisonService.submitEvaluation = vi.fn().mockReturnValue(
      throwError(() => new Error('Submission failed'))
    );

    const evaluationData = {
      canCastEtali: true,
      minimumCardsToCastEtali: 5,
      cardsNeeded: 3
    };

    component.onSubmitEvaluation(evaluationData);

    expect(component.isLoading()).toBe(false);
    expect(component.evaluationMessage()).toBe('Failed to submit evaluation. Please try again.');
    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit evaluation'
      })
    );
  });

  it('should use Location.back() for goBack', () => {
    component.goBack();

    expect(mockLocation.back).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should update currentHand when onHandChanged is called', () => {
    const newHand = [
      { name: 'New Card', type: 'Artifact' }
    ];

    component.onHandChanged(newHand);

    expect(component.currentHand()).toEqual(newHand);
  });
});
