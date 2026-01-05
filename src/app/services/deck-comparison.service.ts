import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../core/tokens';
import {
  DeckComparison,
  DeckComparisonHand,
  DeckComparisonStatistics,
  CardDifferences
} from '../models/comparison.model';
import { Card } from '../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class DeckComparisonService {
  private http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  comparisons = signal<DeckComparison[]>([]);
  selectedComparison = signal<DeckComparison | null>(null);

  /**
   * Create a new deck comparison
   */
  createComparison(deck1Id: number, deck2Id: number): Observable<DeckComparison> {
    return this.http.post<DeckComparison>(`${this.baseUrl}/deck-comparisons`, {
      deck1Id,
      deck2Id
    }).pipe(
      tap(() => this.loadComparisons().subscribe())
    );
  }

  /**
   * Get all deck comparisons
   */
  loadComparisons(): Observable<DeckComparison[]> {
    return this.http.get<DeckComparison[]>(`${this.baseUrl}/deck-comparisons`).pipe(
      tap(comparisons => this.comparisons.set(comparisons))
    );
  }

  /**
   * Get a specific comparison by ID
   */
  getComparison(id: number): Observable<DeckComparison> {
    return this.http.get<DeckComparison>(`${this.baseUrl}/deck-comparisons/${id}`).pipe(
      tap(comparison => this.selectedComparison.set(comparison))
    );
  }

  /**
   * Compare two decks and get card differences
   * Works with any two decklists without requiring a formal comparison to exist
   */
  compareDecks(deck1Id: number, deck2Id: number): Observable<CardDifferences> {
    return this.http.get<CardDifferences>(`${this.baseUrl}/decklists/compare`, {
      params: { deck1Id: deck1Id.toString(), deck2Id: deck2Id.toString() }
    });
  }

  /**
   * Generate a hand for evaluation
   */
  generateHand(id: number): Observable<DeckComparisonHand> {
    return this.http.get<DeckComparisonHand>(`${this.baseUrl}/deck-comparisons/${id}/hand`);
  }

  /**
   * Submit hand evaluation
   */
  submitEvaluation(
    comparisonId: number,
    whichDeck: 1 | 2,
    generationAttempts: number,
    evaluatedHand: {
      id: number;
      cards: Card[];
      seatOrder: number;
      stickers: number[];
      canCastEtali: boolean;
      minimumCardsToCastEtali: number;
      decklistId: number;
      decklistName: string;
      lowestGambleOdds: number;
    }
  ): Observable<DeckComparisonHand> {
    return this.http.post<DeckComparisonHand>(
      `${this.baseUrl}/deck-comparisons/${comparisonId}/evaluate`,
      {
        whichDeck,
        generationAttempts,
        evaluatedHand
      }
    );
  }

  /**
   * Get statistics for a comparison
   */
  getStatistics(id: number): Observable<DeckComparisonStatistics> {
    return this.http.get<DeckComparisonStatistics>(`${this.baseUrl}/deck-comparisons/${id}/statistics`);
  }

  /**
   * Get all comparisons for a specific decklist
   */
  getComparisonsForDeck(decklistId: number): Observable<DeckComparison[]> {
    return this.http.get<DeckComparison[]>(`${this.baseUrl}/decklists/${decklistId}/comparisons`);
  }

  /**
   * Set the currently selected comparison
   */
  selectComparison(comparison: DeckComparison | null): void {
    this.selectedComparison.set(comparison);
  }
}
