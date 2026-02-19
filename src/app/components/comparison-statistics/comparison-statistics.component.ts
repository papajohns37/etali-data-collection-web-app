import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { MulliganService } from '../../services/mulligan.service';
import { DeckComparisonStatistics, HandSizeDeltaStatistics } from '../../models/comparison.model';
import { MulliganComparisonResult, MulliganStatistics } from '../../models/mulligan.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-comparison-statistics',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    MessageModule,
    ChipModule,
    ProgressSpinnerModule,
    DividerModule,
    ProgressBarModule,
  ],
  templateUrl: './comparison-statistics.component.html',
  styleUrl: './comparison-statistics.component.css'
})
export class ComparisonStatisticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private comparisonService = inject(DeckComparisonService);
  private mulliganService = inject(MulliganService);

  statistics = signal<DeckComparisonStatistics | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  // ── Mulligan comparison ──────────────────────────────────────────────────
  mulliganComparison = signal<MulliganComparisonResult | null>(null);
  /** Fallback: individual stats for each deck when compare endpoint returns 404 */
  deck1MulliganStats = signal<MulliganStatistics | null>(null);
  deck2MulliganStats = signal<MulliganStatistics | null>(null);
  mulliganLoading = signal(false);
  mulliganError = signal('');

  hasMulliganComparison = computed(() => this.mulliganComparison() !== null);
  hasMulliganData = computed(
    () => this.mulliganComparison() !== null
      || this.deck1MulliganStats() !== null
      || this.deck2MulliganStats() !== null
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (isNaN(id)) {
      this.errorMessage.set('Invalid comparison ID');
      this.isLoading.set(false);
      return;
    }

    this.loadStatistics(id);
  }

  loadStatistics(id: number): void {
    this.comparisonService.getStatistics(id).subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.isLoading.set(false);
        this.loadMulliganComparison(stats.deck1Id, stats.deck2Id);
      },
      error: (error) => {
        if (error.status === 404) {
          this.errorMessage.set('No statistics available yet. Evaluate some hands first.');
        } else {
          this.errorMessage.set('Failed to load statistics. Please try again.');
        }
        this.isLoading.set(false);
        console.error('Error loading statistics:', error);
      }
    });
  }

  loadMulliganComparison(deck1Id: number, deck2Id: number): void {
    this.mulliganLoading.set(true);
    this.mulliganError.set('');
    this.mulliganService.compareDecks(deck1Id, deck2Id).subscribe({
      next: (result) => {
        this.mulliganComparison.set(result);
        this.mulliganLoading.set(false);
      },
      error: () => {
        // Compare endpoint failed (e.g. 404 = not enough sessions for z-test).
        // Fall back to loading individual deck stats so we can still show something.
        forkJoin([
          this.mulliganService.getStatistics(deck1Id).pipe(catchError(() => of(null))),
          this.mulliganService.getStatistics(deck2Id).pipe(catchError(() => of(null))),
        ]).subscribe(([s1, s2]) => {
          this.deck1MulliganStats.set(s1);
          this.deck2MulliganStats.set(s2);
          this.mulliganLoading.set(false);
        });
      }
    });
  }

  mulliganSuccessRateDiffDisplay(): string {
    const r = this.mulliganComparison();
    if (!r) return '';
    const sign = r.successRateDifference >= 0 ? '+' : '';
    return `${sign}${r.successRateDifference.toFixed(1)}%`;
  }

  goBack(): void {
    this.location.back();
  }

  getSignificance(lower: number, upper: number): 'better' | 'worse' | 'neutral' {
    if (lower > 0) return 'better';
    if (upper < 0) return 'worse';
    return 'neutral';
  }

  getSignificanceText(lower: number, upper: number): string {
    const sig = this.getSignificance(lower, upper);
    if (sig === 'better') return 'Significantly Better';
    if (sig === 'worse') return 'Significantly Worse';
    return 'Not Significant';
  }

  getSignificanceClass(lower: number, upper: number): string {
    const sig = this.getSignificance(lower, upper);
    if (sig === 'better') return 'sig-better';
    if (sig === 'worse') return 'sig-worse';
    return 'sig-neutral';
  }

  getDifferenceDisplay(diff: number): string {
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${(diff * 100).toFixed(1)}%`;
  }

  getConfidenceIntervalDisplay(lower: number, upper: number): string {
    return `${(lower * 100).toFixed(1)}% to ${(upper * 100).toFixed(1)}%`;
  }
}
