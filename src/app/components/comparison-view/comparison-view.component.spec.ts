import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparisonViewComponent } from './comparison-view.component';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('ComparisonViewComponent', () => {
  let component: ComparisonViewComponent;
  let fixture: ComponentFixture<ComparisonViewComponent>;
  let mockComparisonService: any;
  let mockRouter: any;
  let mockLocation: any;
  let mockActivatedRoute: any;

  const mockComparison = {
    id: 1,
    deck1Id: 10,
    deck2Id: 20,
    deck1Name: 'Test Deck 1',
    deck2Name: 'Test Deck 2',
    deck1N: 50,
    deck2N: 45,
    createdAt: new Date()
  };

  const mockCardDifferences = {
    deck1Only: [
      { name: 'Sol Ring', type: 'Artifact' }
    ],
    deck2Only: [
      { name: 'Mana Crypt', type: 'Artifact' }
    ],
    shared: [
      { name: 'Command Tower', type: 'Land' }
    ]
  };

  beforeEach(async () => {
    mockComparisonService = {
      getComparison: vi.fn().mockReturnValue(of(mockComparison)),
      compareDecks: vi.fn().mockReturnValue(of(mockCardDifferences))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockLocation = {
      back: vi.fn()
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((key: string) => key === 'id' ? '1' : null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ComparisonViewComponent],
      providers: [
        { provide: DeckComparisonService, useValue: mockComparisonService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComparisonViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load comparison on init', () => {
    fixture.detectChanges();

    expect(mockComparisonService.getComparison).toHaveBeenCalledWith(1);
    expect(component.comparison()).toEqual(mockComparison);
    expect(component.isLoading()).toBe(false);
  });

  it('should load card differences after loading comparison', () => {
    fixture.detectChanges();

    expect(mockComparisonService.compareDecks).toHaveBeenCalledWith(10, 20);
    expect(component.cardDifferences()).toEqual(mockCardDifferences);
  });

  it('should handle invalid comparison ID', () => {
    mockActivatedRoute.snapshot.paramMap.get = vi.fn(() => 'invalid');
    
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Invalid comparison ID');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle comparison load error', () => {
    mockComparisonService.getComparison = vi.fn().mockReturnValue(
      throwError(() => new Error('Load failed'))
    );

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Failed to load comparison. Please try again.');
    expect(component.isLoading()).toBe(false);
  });

  it('should navigate to evaluation page', () => {
    fixture.detectChanges();

    component.startEvaluation();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/comparisons', 1, 'collect']);
  });

  it('should navigate to statistics page', () => {
    fixture.detectChanges();

    component.viewStatistics();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/comparisons', 1, 'statistics']);
  });

  it('should use Location.back() for goBack', () => {
    fixture.detectChanges();

    component.goBack();

    expect(mockLocation.back).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to deck 1 view', () => {
    fixture.detectChanges();

    component.viewDeck1();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/decklists/view', 10]);
  });

  it('should navigate to deck 2 view', () => {
    fixture.detectChanges();

    component.viewDeck2();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/decklists/view', 20]);
  });

  it('should detect when comparison has data', () => {
    fixture.detectChanges();

    expect(component.hasData()).toBe(true);
  });

  it('should detect when comparison has no data', () => {
    const comparisonNoData = { ...mockComparison, deck1N: 0, deck2N: 0 };
    mockComparisonService.getComparison = vi.fn().mockReturnValue(of(comparisonNoData));
    
    fixture.detectChanges();

    expect(component.hasData()).toBe(false);
  });
});
