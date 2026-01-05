import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ComparisonListComponent } from './comparison-list.component';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { DeckComparison } from '../../models/comparison.model';

describe('ComparisonListComponent', () => {
  let component: ComparisonListComponent;
  let fixture: ComponentFixture<ComparisonListComponent>;
  let mockRouter: any;
  let mockLocation: any;
  let mockComparisonService: any;

  const mockComparisons: DeckComparison[] = [
    {
      id: 1,
      deck1Id: 1,
      deck2Id: 2,
      deck1Name: 'Deck A',
      deck2Name: 'Deck B',
      deck1N: 10,
      deck2N: 8,
      createdAt: new Date('2025-01-01')
    },
    {
      id: 2,
      deck1Id: 3,
      deck2Id: 4,
      deck1Name: 'Deck C',
      deck2Name: 'Deck D',
      deck1N: 0,
      deck2N: 0,
      createdAt: new Date('2025-01-02')
    }
  ];

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn()
    };
    
    mockLocation = {
      back: vi.fn()
    };
    
    mockComparisonService = {
      loadComparisons: vi.fn().mockReturnValue(of(mockComparisons)),
      selectComparison: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ComparisonListComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: DeckComparisonService, useValue: mockComparisonService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComparisonListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load comparisons on init', () => {
      fixture.detectChanges(); // triggers ngOnInit

      expect(mockComparisonService.loadComparisons).toHaveBeenCalled();
      expect(component.comparisons()).toEqual(mockComparisons);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('');
    });

    it('should handle error when loading comparisons fails', () => {
      const error = new Error('Network error');
      mockComparisonService.loadComparisons.mockReturnValue(throwError(() => error));

      fixture.detectChanges(); // triggers ngOnInit

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to load comparisons. Please try again.');
      expect(component.comparisons()).toEqual([]);
    });
  });

  describe('loadComparisons', () => {
    it('should set loading state and load comparisons', () => {
      component.loadComparisons();

      expect(component.isLoading()).toBe(false);
      expect(component.comparisons()).toEqual(mockComparisons);
      expect(component.errorMessage()).toBe('');
    });

    it('should reset error message before loading', () => {
      component.errorMessage.set('Previous error');

      component.loadComparisons();

      expect(component.errorMessage()).toBe('');
    });
  });

  describe('viewComparison', () => {
    it('should select comparison and navigate to comparison view', () => {
      const comparison = mockComparisons[0];

      component.viewComparison(comparison);

      expect(mockComparisonService.selectComparison).toHaveBeenCalledWith(comparison);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/comparisons', comparison.id]);
    });
  });

  describe('viewStatistics', () => {
    it('should navigate to comparison statistics', () => {
      const comparison = mockComparisons[0];

      component.viewStatistics(comparison);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/comparisons', comparison.id, 'statistics']);
    });
  });

  describe('createComparison', () => {
    it('should navigate to create comparison page', () => {
      component.createComparison();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/comparisons/create']);
    });
  });

  describe('goBackToDecklists', () => {
    it('should use Location.back() to navigate back', () => {
      component.goBackToDecklists();

      expect(mockLocation.back).toHaveBeenCalled();
    });
  });

  describe('hasData', () => {
    it('should return true when deck1N has data', () => {
      const comparison: DeckComparison = {
        ...mockComparisons[0],
        deck1N: 5,
        deck2N: 0
      };

      expect(component.hasData(comparison)).toBe(true);
    });

    it('should return true when deck2N has data', () => {
      const comparison: DeckComparison = {
        ...mockComparisons[0],
        deck1N: 0,
        deck2N: 5
      };

      expect(component.hasData(comparison)).toBe(true);
    });

    it('should return true when both decks have data', () => {
      const comparison: DeckComparison = {
        ...mockComparisons[0],
        deck1N: 5,
        deck2N: 3
      };

      expect(component.hasData(comparison)).toBe(true);
    });

    it('should return false when neither deck has data', () => {
      const comparison: DeckComparison = {
        ...mockComparisons[0],
        deck1N: 0,
        deck2N: 0
      };

      expect(component.hasData(comparison)).toBe(false);
    });
  });
});
