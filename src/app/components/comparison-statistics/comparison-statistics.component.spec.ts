import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparisonStatisticsComponent } from './comparison-statistics.component';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('ComparisonStatisticsComponent', () => {
  let component: ComparisonStatisticsComponent;
  let fixture: ComponentFixture<ComparisonStatisticsComponent>;
  let mockComparisonService: any;
  let mockRouter: any;
  let mockLocation: any;

  const mockStatistics = {
    comparisonId: 1,
    deck1Name: 'Test Deck 1',
    deck2Name: 'Test Deck 2',
    deck1N: 50,
    deck2N: 45,
    overallDifference: 0.15,
    overallDifferenceLower: 0.05,
    overallDifferenceUpper: 0.25,
    handSizeDeltaStatistics: [
      {
        handSizeDelta: 0,
        probability: 0.5,
        confidenceIntervalLower: 0.4,
        confidenceIntervalUpper: 0.6
      },
      {
        handSizeDelta: 1,
        probability: 0.3,
        confidenceIntervalLower: 0.2,
        confidenceIntervalUpper: 0.4
      }
    ]
  };

  beforeEach(async () => {
    mockComparisonService = {
      getStatistics: vi.fn().mockReturnValue(of(mockStatistics))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockLocation = {
      back: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ComparisonStatisticsComponent],
      providers: [
        { provide: DeckComparisonService, useValue: mockComparisonService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
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

    fixture = TestBed.createComponent(ComparisonStatisticsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load statistics on init', () => {
    fixture.detectChanges();

    expect(mockComparisonService.getStatistics).toHaveBeenCalledWith(1);
    expect(component.statistics()).toEqual(mockStatistics);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle invalid comparison ID', () => {
    const invalidRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn(() => 'invalid')
        }
      }
    };

    TestBed.overrideProvider(ActivatedRoute, { useValue: invalidRoute });
    fixture = TestBed.createComponent(ComparisonStatisticsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Invalid comparison ID');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle 404 error with appropriate message', () => {
    mockComparisonService.getStatistics = vi.fn().mockReturnValue(
      throwError(() => ({ status: 404 }))
    );

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('No statistics available yet. Evaluate some hands first.');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle general error', () => {
    mockComparisonService.getStatistics = vi.fn().mockReturnValue(
      throwError(() => new Error('Load failed'))
    );

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Failed to load statistics. Please try again.');
    expect(component.isLoading()).toBe(false);
  });

  it('should use Location.back() for goBack', () => {
    fixture.detectChanges();

    component.goBack();

    expect(mockLocation.back).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should determine better significance correctly', () => {
    expect(component.getSignificance(0.1, 0.3)).toBe('better');
  });

  it('should determine worse significance correctly', () => {
    expect(component.getSignificance(-0.3, -0.1)).toBe('worse');
  });

  it('should determine neutral significance correctly', () => {
    expect(component.getSignificance(-0.1, 0.1)).toBe('neutral');
  });
});
