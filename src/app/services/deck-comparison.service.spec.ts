import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DeckComparisonService } from './deck-comparison.service';
import { API_BASE_URL } from '../core/tokens';
import {
  DeckComparison,
  DeckComparisonHand,
  DeckComparisonStatistics,
  CardDifferences
} from '../models/comparison.model';
import { Card } from '../models/card.model';

describe('DeckComparisonService', () => {
  let service: DeckComparisonService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:5000/api';

  const mockComparison: DeckComparison = {
    id: 1,
    deck1Id: 1,
    deck2Id: 2,
    deck1Name: 'Deck A',
    deck2Name: 'Deck B',
    deck1N: 10,
    deck2N: 8,
    createdAt: new Date('2025-01-01')
  };

  const mockComparisons: DeckComparison[] = [mockComparison];

  const mockCard: Card = {
    name: 'Test Card',
    type: 'Creature'
  };

  const mockHand: DeckComparisonHand = {
    id: 1,
    comparisonId: 1,
    whichDeck: 1,
    cards: [mockCard],
    seatOrder: 1,
    stickers: [],
    decklistId: 1,
    decklistName: 'Deck A',
    lowestGambleOdds: 0.75,
    generationAttempts: 1
  };

  const mockStatistics: DeckComparisonStatistics = {
    comparisonId: 1,
    deck1Id: 1,
    deck1Name: 'Deck A',
    deck2Id: 2,
    deck2Name: 'Deck B',
    deck1TotalHandsEvaluated: 100,
    deck2TotalHandsEvaluated: 100,
    deck1N: 10,
    deck2N: 8,
    handSizeDeltaStatistics: [],
    overallProbabilityDifference: 0.05,
    overallConfidenceIntervalLower: 0.01,
    overallConfidenceIntervalUpper: 0.09
  };

  const mockCardDifferences: CardDifferences = {
    cardsOnlyInDeck1: [mockCard],
    cardsOnlyInDeck2: [],
    sharedCards: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl }
      ]
    });
    service = TestBed.inject(DeckComparisonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createComparison', () => {
    it('should create a new comparison', () => {
      service.createComparison(1, 2).subscribe(comparison => {
        expect(comparison).toEqual(mockComparison);
      });

      const req = httpMock.expectOne(`${baseUrl}/deck-comparisons`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ deck1Id: 1, deck2Id: 2 });
      req.flush(mockComparison);

      // Should trigger loadComparisons
      const loadReq = httpMock.expectOne(`${baseUrl}/deck-comparisons`);
      expect(loadReq.request.method).toBe('GET');
      loadReq.flush(mockComparisons);
    });

    it('should update comparisons signal after creation', () => {
      service.createComparison(1, 2).subscribe(() => {
        expect(service.comparisons()).toEqual(mockComparisons);
      });

      const createReq = httpMock.expectOne(`${baseUrl}/deck-comparisons`);
      createReq.flush(mockComparison);

      const loadReq = httpMock.expectOne(`${baseUrl}/deck-comparisons`);
      loadReq.flush(mockComparisons);
    });
  });

  describe('loadComparisons', () => {
    it('should load all comparisons', () => {
      service.loadComparisons().subscribe(comparisons => {
        expect(comparisons).toEqual(mockComparisons);
        expect(service.comparisons()).toEqual(mockComparisons);
      });

      const req = httpMock.expectOne(`${baseUrl}/deck-comparisons`);
      expect(req.request.method).toBe('GET');
      req.flush(mockComparisons);
    });
  });

  describe('getComparison', () => {
    it('should get a specific comparison by ID', () => {
      service.getComparison(1).subscribe(comparison => {
        expect(comparison).toEqual(mockComparison);
        expect(service.selectedComparison()).toEqual(mockComparison);
      });

      const req = httpMock.expectOne(`${baseUrl}/deck-comparisons/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockComparison);
    });
  });

  describe('compareDecks', () => {
    it('should compare two decks and return card differences', () => {
      service.compareDecks(1, 2).subscribe(differences => {
        expect(differences).toEqual(mockCardDifferences);
      });

      const req = httpMock.expectOne(`${baseUrl}/decklists/compare?deck1Id=1&deck2Id=2`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCardDifferences);
    });
  });

  describe('generateHand', () => {
    it('should generate a hand for evaluation', () => {
      service.generateHand(1).subscribe(hand => {
        expect(hand).toEqual(mockHand);
      });

      const req = httpMock.expectOne(`${baseUrl}/deck-comparisons/1/hand`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHand);
    });
  });

  describe('selectComparison', () => {
    it('should set the selected comparison', () => {
      service.selectComparison(mockComparison);

      expect(service.selectedComparison()).toEqual(mockComparison);
    });

    it('should allow setting selected comparison to null', () => {
      service.selectComparison(mockComparison);
      service.selectComparison(null);

      expect(service.selectedComparison()).toBeNull();
    });
  });
});
