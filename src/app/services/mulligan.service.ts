import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/tokens';
import {
  MulliganStartRequest,
  MulliganStartResponse,
  MulliganEvaluationRequest,
  MulliganEvaluationResponse,
  MulliganStatistics,
  MulliganComparisonResult,
} from '../models/mulligan.model';

/**
 * Service for all mulligan-related API calls.
 *
 * Authenticated endpoints (POST /mulligan/start and POST /mulligan/evaluate) rely
 * on the global auth interceptor to attach the JWT token automatically.
 */
@Injectable({
  providedIn: 'root',
})
export class MulliganService {
  private http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Start a new mulligan session for the given decklist.
   * The backend deals the first 7-card hand.
   * Requires authentication.
   */
  startSession(decklistId: number): Observable<MulliganStartResponse> {
    const request: MulliganStartRequest = { decklistId };
    return this.http.post<MulliganStartResponse>(`${this.baseUrl}/mulligan/start`, request);
  }

  /**
   * Submit the user's evaluation/decision for the current hand.
   * Returns either the next hand or a session summary.
   * Requires authentication.
   */
  evaluateHand(request: MulliganEvaluationRequest): Observable<MulliganEvaluationResponse> {
    return this.http.post<MulliganEvaluationResponse>(`${this.baseUrl}/mulligan/evaluate`, request);
  }

  /**
   * Fetch mulligan statistics for a single decklist.
   * Public endpoint — no authentication required.
   */
  getStatistics(decklistId: number): Observable<MulliganStatistics> {
    return this.http.get<MulliganStatistics>(`${this.baseUrl}/mulligan/statistics/${decklistId}`);
  }

  /**
   * Compare mulligan statistics between two decklists.
   * Public endpoint — no authentication required.
   */
  compareDecks(decklistId1: number, decklistId2: number): Observable<MulliganComparisonResult> {
    return this.http.post<MulliganComparisonResult>(`${this.baseUrl}/mulligan/statistics/compare`, {
      decklistId1,
      decklistId2,
    });
  }
}
