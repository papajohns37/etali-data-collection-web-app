import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DecklistService } from './decklist.service';
import { Decklist } from '../models/decklist.model';
import { Hand } from '../models/hand.model';
import { Card } from '../models/card.model';

describe('DecklistService', () => {
  let service: DecklistService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://localhost:7194';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DecklistService]
    });
    service = TestBed.inject(DecklistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadDecklists', () => {
    it('should fetch decklists from API and update signal', () => {
      const mockDecklists: Decklist[] = [
        {
          id: 1,
          name: 'Test Deck',
          cards: [
            { name: 'Sol Ring', type: 'Artifact' },
            { name: 'Command Tower', type: 'Land' }
          ],
          moxfieldUrl: 'https://moxfield.com/decks/test',
          createdAt: new Date('2024-01-15')
        }
      ];

      service.loadDecklists().subscribe(decklists => {
        expect(decklists).toEqual(mockDecklists);
        expect(service.decklists()).toEqual(mockDecklists);
      });

      const req = httpMock.expectOne(`${baseUrl}/decklists`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDecklists);
    });

    it('should handle empty decklists response', () => {
      service.loadDecklists().subscribe(decklists => {
        expect(decklists).toEqual([]);
        expect(service.decklists()).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/decklists`);
      req.flush([]);
    });

    it('should handle API errors', () => {
      service.loadDecklists().subscribe({
        next: () => {
          throw new Error('should have failed with 500 error');
        },
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/decklists`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getRandomHand', () => {
    it('should fetch random hand for decklist', () => {
      const mockHand: Hand = {
        id: 1,
        cards: [
          { name: 'Sol Ring', type: 'Artifact' },
          { name: 'Command Tower', type: 'Land' }
        ],
        seatOrder: 2,
        stickers: [1, 3],
        lowestGambleOdds: 0.5,
        decklistId: 1,
        decklistName: 'Test Deck'
      };

      service.getRandomHand('Test Deck').subscribe(hand => {
        expect(hand).toEqual(mockHand);
      });

      const req = httpMock.expectOne(`${baseUrl}/hand?decklistName=Test%20Deck`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHand);
    });

    it('should handle 404 for non-existent decklist', () => {
      service.getRandomHand('Non Existent').subscribe({
        next: () => {
          throw new Error('should have failed with 404 error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/hand?decklistName=Non%20Existent`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('submitHandEvaluation', () => {
    it('should send Card[] array in evaluation payload', () => {
      const evaluation = {
        id: 1,
        cards: [
          { name: 'Sol Ring', type: 'Artifact' },
          { name: 'Command Tower', type: 'Land' }
        ],
        seatOrder: 2,
        stickers: [1, 3],
        canCastEtali: true,
        minimumCardsToCastEtali: 5,
        decklistId: 1,
        decklistName: 'Test Deck'
      };

      service.submitHandEvaluation(evaluation).subscribe(response => {
        expect(response).toEqual({ success: true });
      });

      const req = httpMock.expectOne(`${baseUrl}/hand/evaluate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(evaluation);
      expect(req.request.body.cards[0]).toEqual({ name: 'Sol Ring', type: 'Artifact' });
      req.flush({ success: true });
    });

    it('should handle evaluation submission errors', () => {
      const evaluation = {
        id: 1,
        cards: [],
        seatOrder: 1,
        stickers: [],
        canCastEtali: false,
        minimumCardsToCastEtali: 8,
        decklistId: 1,
        decklistName: 'Test Deck'
      };

      service.submitHandEvaluation(evaluation).subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/hand/evaluate`);
      req.flush('Invalid data', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('selectDecklist', () => {
    it('should update selectedDecklist signal', () => {
      const mockDecklist: Decklist = {
        id: 1,
        name: 'Test Deck',
        cards: [],
        createdAt: new Date()
      };

      service.selectDecklist(mockDecklist);
      expect(service.selectedDecklist()).toEqual(mockDecklist);
    });

    it('should allow clearing selection', () => {
      const mockDecklist: Decklist = {
        id: 1,
        name: 'Test Deck',
        cards: [],
        createdAt: new Date()
      };

      service.selectDecklist(mockDecklist);
      expect(service.selectedDecklist()).toEqual(mockDecklist);

      service.selectDecklist(null);
      expect(service.selectedDecklist()).toBeNull();
    });
  });

  describe('addDecklist', () => {
    it('should post new decklist and reload list', () => {
      const mockDecklists: Decklist[] = [
        { id: 1, name: 'New Deck', cards: [], createdAt: new Date() }
      ];

      service.addDecklist('https://moxfield.com/decks/test', 'New Deck').subscribe();

      // First request: add decklist
      const addReq = httpMock.expectOne(
        `${baseUrl}/decklist?link=https%3A%2F%2Fmoxfield.com%2Fdecks%2Ftest&name=New%20Deck`
      );
      expect(addReq.request.method).toBe('POST');
      addReq.flush({ success: true });

      // Second request: reload decklists
      const loadReq = httpMock.expectOne(`${baseUrl}/decklists`);
      expect(loadReq.request.method).toBe('GET');
      loadReq.flush(mockDecklists);
    });
  });

  describe('getStatistics', () => {
    it('should fetch statistics for decklist', () => {
      const mockStats = {
        totalHands: 100,
        canCastEtaliCount: 75
      };

      service.getStatistics(1).subscribe(stats => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${baseUrl}/decklists/1/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });
});
