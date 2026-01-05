import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { DeckCompareComponent } from './deck-compare.component';
import { DecklistService } from '../../services/decklist.service';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { Decklist } from '../../models/decklist.model';
import { CardDifferences } from '../../models/comparison.model';
import { Card } from '../../models/card.model';

describe('DeckCompareComponent', () => {
  let component: DeckCompareComponent;
  let fixture: ComponentFixture<DeckCompareComponent>;
  let mockRouter: any;
  let mockLocation: any;
  let mockActivatedRoute: any;
  let mockDecklistService: any;
  let mockComparisonService: any;

  const mockDecklist: Decklist = {
    id: 1,
    name: 'Test Deck',
    moxfieldUrl: 'https://moxfield.com/test',
    cards: [{ name: 'Sol Ring', type: 'Artifact' }],
    createdAt: new Date('2025-01-01')
  };

  const mockDecklists: Decklist[] = [
    mockDecklist,
    {
      id: 2,
      name: 'Compare Deck',
      moxfieldUrl: 'https://moxfield.com/compare',
      cards: [{ name: 'Command Tower', type: 'Land' }],
      createdAt: new Date('2025-01-02')
    }
  ];

  const mockCardDifferences: CardDifferences = {
    cardsOnlyInDeck1: [],
    cardsOnlyInDeck2: [],
    sharedCards: []
  };

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn()
    };
    
    mockLocation = {
      back: vi.fn()
    };
    
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1')
        }
      }
    };
    
    mockDecklistService = {
      decklists: signal<Decklist[]>(mockDecklists),
      loadDecklists: vi.fn().mockReturnValue(of(mockDecklists))
    };
    
    mockComparisonService = {
      compareDecks: vi.fn().mockReturnValue(of(mockCardDifferences))
    };

    await TestBed.configureTestingModule({
      imports: [DeckCompareComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DecklistService, useValue: mockDecklistService },
        { provide: DeckComparisonService, useValue: mockComparisonService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeckCompareComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load decklist from service cache if available', () => {
      fixture.detectChanges(); // triggers ngOnInit

      expect(component.currentDeck()).toEqual(mockDecklist);
      expect(component.isLoading()).toBe(false);
      expect(mockDecklistService.loadDecklists).not.toHaveBeenCalled();
    });

    it('should load decklists from API if not in cache', () => {
      mockDecklistService.decklists.set([]);

      fixture.detectChanges(); // triggers ngOnInit

      expect(mockDecklistService.loadDecklists).toHaveBeenCalled();
      expect(component.currentDeck()).toEqual(mockDecklist);
      expect(component.isLoading()).toBe(false);
    });

    it('should set error message if decklist not found', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('999');
      mockDecklistService.decklists.set([]);

      fixture.detectChanges(); // triggers ngOnInit

      expect(component.errorMessage()).toBe('Decklist not found.');
      expect(component.currentDeck()).toBeNull();
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error when loading decklists fails', () => {
      mockDecklistService.decklists.set([]);
      const error = new Error('Network error');
      mockDecklistService.loadDecklists.mockReturnValue(throwError(() => error));

      fixture.detectChanges(); // triggers ngOnInit

      expect(component.errorMessage()).toBe('Failed to load decklist. Please try again.');
      expect(component.isLoading()).toBe(false);
    });

    it('should set error message if no decklist ID provided', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);

      fixture.detectChanges(); // triggers ngOnInit

      expect(component.errorMessage()).toBe('No decklist ID provided');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('onCompareToChange', () => {
    beforeEach(() => {
      fixture.detectChanges(); // Load current deck
    });

    it('should set compareToDeckId when deck selected', () => {
      component.onCompareToChange(2);

      expect(component.compareToDeckId()).toBe(2);
    });

    it('should clear card differences when deck selection cleared', () => {
      component.cardDifferences.set(mockCardDifferences);
      
      component.onCompareToChange(null);

      expect(component.compareToDeckId()).toBeNull();
      expect(component.cardDifferences()).toBeNull();
    });

    it('should load card differences when valid deck selected', () => {
      component.onCompareToChange(2);

      expect(mockComparisonService.compareDecks).toHaveBeenCalledWith(1, 2);
      expect(component.cardDifferences()).toEqual(mockCardDifferences);
      expect(component.isLoadingComparison()).toBe(false);
    });

    it('should handle error when loading card differences fails', () => {
      const error = new Error('Comparison failed');
      mockComparisonService.compareDecks.mockReturnValue(throwError(() => error));

      component.onCompareToChange(2);

      expect(component.isLoadingComparison()).toBe(false);
    });
  });

  describe('goBack', () => {
    it('should use Location.back() to navigate back', () => {
      component.goBack();

      expect(mockLocation.back).toHaveBeenCalled();
    });
  });
});
