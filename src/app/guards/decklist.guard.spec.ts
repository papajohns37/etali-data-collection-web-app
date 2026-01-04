import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { decklistGuard } from './decklist.guard';
import { DecklistService } from '../services/decklist.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('decklistGuard', () => {
  let mockRouter: any;
  let mockDecklistService: any;

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn()
    };
    mockDecklistService = {
      selectedDecklist: signal(null)
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: DecklistService, useValue: mockDecklistService }
      ]
    });
  });

  it('should allow navigation when decklist is selected', () => {
    mockDecklistService.selectedDecklist.set({
      id: 1,
      name: 'Test Deck',
      cards: [],
      createdAt: new Date()
    });

    const result = TestBed.runInInjectionContext(() =>
      decklistGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to decklists when no decklist is selected', () => {
    mockDecklistService.selectedDecklist.set(null);

    const result = TestBed.runInInjectionContext(() =>
      decklistGuard({} as any, {} as any)
    );

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/decklists']);
  });
});
