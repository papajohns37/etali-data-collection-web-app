import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatisticsComponent } from './statistics.component';
import { DecklistService } from '../../services/decklist.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('StatisticsComponent', () => {
  let component: StatisticsComponent;
  let fixture: ComponentFixture<StatisticsComponent>;
  let mockDecklistService: any;
  let mockRouter: any;
  let mockLocation: any;

  const mockStatistics = {
    decklistId: 1,
    decklistName: 'Test Deck',
    totalHandsTested: 50,
    overallMulliganProbability: 0.75,
    overallMulliganConfidenceIntervalLower: 0.65,
    overallMulliganConfidenceIntervalUpper: 0.85,
    handSizeStatistics: [
      {
        handSize: 7,
        probability: 0.8,
        confidenceIntervalLower: 0.7,
        confidenceIntervalUpper: 0.9,
        successfulHands: 40,
        totalHands: 50
      },
      {
        handSize: 6,
        probability: 0.6,
        confidenceIntervalLower: 0.5,
        confidenceIntervalUpper: 0.7,
        successfulHands: 30,
        totalHands: 50
      }
    ]
  };

  beforeEach(async () => {
    mockDecklistService = {
      decklists: signal([
        {
          id: 1,
          name: 'Test Deck',
          cards: [],
          createdAt: new Date()
        }
      ]),
      getStatistics: vi.fn().mockReturnValue(of(mockStatistics)),
      selectDecklist: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockLocation = {
      back: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [StatisticsComponent],
      providers: [
        { provide: DecklistService, useValue: mockDecklistService },
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

    fixture = TestBed.createComponent(StatisticsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load statistics on init', () => {
    fixture.detectChanges();

    expect(mockDecklistService.getStatistics).toHaveBeenCalledWith(1);
    expect(component.statistics()).toEqual(mockStatistics);
    expect(component.loading()).toBe(false);
  });

  it('should handle missing decklist ID', () => {
    const invalidRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn(() => null)
        }
      }
    };

    TestBed.overrideProvider(ActivatedRoute, { useValue: invalidRoute });
    fixture = TestBed.createComponent(StatisticsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.error()).toBe('No decklist ID provided');
    expect(component.loading()).toBe(false);
  });

  it('should handle 404 error', () => {
    mockDecklistService.getStatistics = vi.fn().mockReturnValue(
      throwError(() => ({ status: 404 }))
    );

    fixture.detectChanges();

    expect(component.error()).toBe('Decklist not found');
    expect(component.loading()).toBe(false);
  });

  it('should handle general error', () => {
    mockDecklistService.getStatistics = vi.fn().mockReturnValue(
      throwError(() => new Error('Load failed'))
    );

    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load statistics');
    expect(component.loading()).toBe(false);
  });

  it('should use Location.back() for goBack', () => {
    fixture.detectChanges();

    component.goBack();

    expect(mockLocation.back).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should detect when statistics has data', () => {
    fixture.detectChanges();

    expect(component.hasData()).toBe(true);
  });

  it('should detect when statistics has no data', () => {
    const emptyStats = { ...mockStatistics, totalHandsTested: 0 };
    mockDecklistService.getStatistics = vi.fn().mockReturnValue(of(emptyStats));
    
    fixture.detectChanges();

    expect(component.hasData()).toBe(false);
  });

  it('should detect low sample size', () => {
    const lowSampleStats = { ...mockStatistics, totalHandsTested: 20 };
    mockDecklistService.getStatistics = vi.fn().mockReturnValue(of(lowSampleStats));
    
    fixture.detectChanges();

    expect(component.hasLowSampleSize()).toBe(true);
  });

  it('should detect adequate sample size', () => {
    fixture.detectChanges();

    expect(component.hasLowSampleSize()).toBe(false);
  });

  it('should compute hand size data correctly', () => {
    fixture.detectChanges();

    const handSizeData = component.handSizeData();

    expect(handSizeData.length).toBe(2);
    expect(handSizeData[0].handSize).toBe(7);
    expect(handSizeData[0].probabilityValue).toBe(80); // 0.8 * 100
    expect(handSizeData[1].handSize).toBe(6);
  });

  it('should sort hand size data by hand size descending', () => {
    fixture.detectChanges();

    const handSizeData = component.handSizeData();

    expect(handSizeData[0].handSize).toBeGreaterThan(handSizeData[1].handSize);
  });

  it('should navigate to hand collection', () => {
    fixture.detectChanges();

    component.goToHandCollection();

    expect(mockDecklistService.selectDecklist).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/hand-collection']);
  });

  it('should refresh statistics', () => {
    fixture.detectChanges();

    mockDecklistService.getStatistics.mockClear();

    component.refreshStatistics();

    expect(mockDecklistService.getStatistics).toHaveBeenCalledWith(1);
  });

  it('should get correct severity class for wide confidence interval', () => {
    const result = component.getSeverityClass(0.35);
    expect(result).toBe('low-confidence');
  });

  it('should get correct severity class for medium confidence interval', () => {
    const result = component.getSeverityClass(0.2);
    expect(result).toBe('medium-confidence');
  });

  it('should get correct severity class for narrow confidence interval', () => {
    const result = component.getSeverityClass(0.1);
    expect(result).toBe('high-confidence');
  });
});
