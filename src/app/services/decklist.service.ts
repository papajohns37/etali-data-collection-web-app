import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Decklist, RenameResponse } from '../models/decklist.model';
import { Hand, MaximumManaHandEvaluation } from '../models/hand.model';
import { Card } from '../models/card.model';
import { DecklistStatistics } from '../models/statistics.model';
import { API_BASE_URL } from '../core/tokens';

@Injectable({
  providedIn: 'root'
})
export class DecklistService {
  private http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

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
   * Get a random maximum mana hand for the specified decklist
   */
  getMaximumManaHand(decklistName: string): Observable<Hand> {
    const encodedDecklistName = encodeURIComponent(decklistName);
    return this.http.get<Hand>(`${this.baseUrl}/maximum-mana-hand?decklistName=${encodedDecklistName}`);
  }

  /**
   * Submit maximum mana hand evaluation to the server
   */
  submitMaximumManaHandEvaluation(evaluation: MaximumManaHandEvaluation): Observable<any> {
    return this.http.post(`${this.baseUrl}/maximum-mana-hand/evaluate`, evaluation);
  }

  /**
   * Retrieve all evaluated maximum mana hands
   */
  getMaximumManaEvaluatedHands(): Observable<MaximumManaHandEvaluation[]> {
    return this.http.get<MaximumManaHandEvaluation[]>(`${this.baseUrl}/maximum-mana-hands/evaluated`);
  }

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

  /**
   * Rename a decklist
   */
  renameDecklist(decklistId: number, newName: string, token: string): Observable<RenameResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.patch<RenameResponse>(
      `${this.baseUrl}/decklist/${decklistId}/rename?newName=${encodeURIComponent(newName)}`,
      {},
      { headers }
    ).pipe(
      tap((response) => {
        // Update the decklist in the local cache
        const decklists = this.decklists();
        const index = decklists.findIndex(d => d.id === decklistId);
        if (index !== -1) {
          const updatedDecklists = [...decklists];
          updatedDecklists[index] = { ...updatedDecklists[index], name: response.newName };
          this.decklists.set(updatedDecklists);
          
          // Update selected decklist if it's the one being renamed
          if (this.selectedDecklist()?.id === decklistId) {
            this.selectedDecklist.set(updatedDecklists[index]);
          }
        }
      })
    );
  }
}
