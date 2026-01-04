import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Decklist } from '../models/decklist.model';
import { Hand } from '../models/hand.model';
import { Card } from '../models/card.model';
import { DecklistStatistics } from '../models/statistics.model';

@Injectable({
  providedIn: 'root'
})
export class DecklistService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://localhost:7194';

  // State management
  decklists = signal<Decklist[]>([]);
  selectedDecklist = signal<Decklist | null>(null);

  /**
   * Load all decklists from the API
   */
  loadDecklists(): Observable<Decklist[]> {
    return this.http.get<Decklist[]>(`${this.baseUrl}/decklists`).pipe(
      tap(decklists => {
        this.decklists.set(decklists);
      })
    );
  }

  /**
   * Get a random hand for the currently selected decklist
   */
  getRandomHand(decklistName: string): Observable<Hand> {
    const encodedDecklistName = encodeURIComponent(decklistName);
    return this.http.get<Hand>(`${this.baseUrl}/hand?decklistName=${encodedDecklistName}`);
  }

  /**
   * Submit hand evaluation to the server
   */
  submitHandEvaluation(evaluation: {
    id: number;
    cards: Card[];
    seatOrder: number;
    stickers: number[];
    canCastEtali: boolean;
    minimumCardsToCastEtali: number;
    decklistId: number;
    decklistName: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/hand/evaluate`, evaluation);
  }

  /**
   * Add a new decklist from a Moxfield link
   */
  addDecklist(moxfieldLink: string, name: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/decklist?link=${encodeURIComponent(moxfieldLink)}&name=${encodeURIComponent(name)}`,
      {}
    ).pipe(
      tap(() => this.loadDecklists().subscribe())
    );
  }

  /**
   * Set the currently selected decklist
   */
  selectDecklist(decklist: Decklist | null): void {
    this.selectedDecklist.set(decklist);
  }

  /**
   * Get statistics for a specific decklist
   */
  getStatistics(decklistId: number): Observable<DecklistStatistics> {
    return this.http.get<DecklistStatistics>(`${this.baseUrl}/decklists/${decklistId}/statistics`);
  }
}
