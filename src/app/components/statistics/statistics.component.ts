import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { DecklistService } from '../../services/decklist.service';
import { MulliganService } from '../../services/mulligan.service';
import { DecklistStatistics } from '../../models/statistics.model';
import { MulliganStatistics } from '../../models/mulligan.model';
import { PercentagePipe } from '../../shared/pipes/percentage.pipe';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ButtonModule,
    MessageModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    TooltipModule,
    ToolbarModule,
    DividerModule,
    TagModule,
    PercentagePipe
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit {
  private decklistService = inject(DecklistService);
  private mulliganService = inject(MulliganService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  statistics = signal<DecklistStatistics | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  currentDecklistId = signal<number>(0);

  // ── Mulligan statistics ──────────────────────────────────────────────────
  mulliganStats = signal<MulliganStatistics | null>(null);
  mulliganLoading = signal<boolean>(false);
  mulliganError = signal<string | null>(null);

  hasMulliganData = computed(() => {
    const s = this.mulliganStats();
    return s !== null && s.totalSessions > 0;
  });

  mulliganSuccessByHandSize = computed(() => {
    const s = this.mulliganStats();
    if (!s) return [];
    return Object.entries(s.successByHandSize)
      .map(([hs, count]) => ({ handSize: +hs, successes: count }))
      .sort((a, b) => b.handSize - a.handSize);
  });

  mulliganDistributionData = computed(() => {
    const s = this.mulliganStats();
    if (!s) return [];
    return Object.entries(s.mulliganDistribution)
      .map(([m, count]) => ({ mulligans: +m, sessions: count }))
      .sort((a, b) => a.mulligans - b.mulligans);
  });

  // Computed values for display
  hasData = computed(() => {
    const stats = this.statistics();
    return stats !== null && stats.totalHandsTested > 0;
  });

  hasLowSampleSize = computed(() => {
    const stats = this.statistics();
    return stats !== null && stats.totalHandsTested < 30;
  });

  handSizeData = computed(() => {
    const stats = this.statistics();
    if (!stats) return [];
    
    return [...stats.handSizeStatistics]
      .sort((a, b) => b.handSize - a.handSize)
      .map(hs => ({
        handSize: hs.handSize,
        probability: hs.probability,
        confidenceIntervalLower: hs.confidenceIntervalLower,
        confidenceIntervalUpper: hs.confidenceIntervalUpper,
        ciWidth: hs.confidenceIntervalUpper - hs.confidenceIntervalLower,
        sampleSize: `${hs.successfulHands}/${hs.totalHands}`,
        probabilityValue: hs.probability * 100,
        successfulHands: hs.successfulHands,
        totalHands: hs.totalHands
      }));
  });

  overallProbability = computed(() => this.statistics()?.overallMulliganProbability ?? 0);

  overallConfidenceIntervalLower = computed(() => this.statistics()?.overallMulliganConfidenceIntervalLower ?? 0);

  overallConfidenceIntervalUpper = computed(() => this.statistics()?.overallMulliganConfidenceIntervalUpper ?? 0);

  ngOnInit(): void {
    const decklistId = this.route.snapshot.paramMap.get('id');
    
    if (!decklistId) {
      this.error.set('No decklist ID provided');
      this.loading.set(false);
      return;
    }

    const id = parseInt(decklistId, 10);
    this.currentDecklistId.set(id);
    this.loadStatistics(id);
    this.loadMulliganStatistics(id);
  }

  loadStatistics(decklistId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.decklistService.getStatistics(decklistId).subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.error.set(err.status === 404 ? 'Decklist not found' : 'Failed to load statistics');
        this.loading.set(false);
      }
    });
  }

  getSeverityClass(ciWidth: number): string {
    if (ciWidth > 0.3) return 'low-confidence';
    if (ciWidth > 0.15) return 'medium-confidence';
    return 'high-confidence';
  }

  goBack(): void {
    this.location.back();
  }

  goToHandCollection(): void {
    const stats = this.statistics();
    if (!stats) return;

    const decklist = this.decklistService.decklists().find(d => d.id === stats.decklistId);
    if (decklist) {
      this.decklistService.selectDecklist(decklist);
      this.router.navigate(['/hand-collection']);
    }
  }

  loadMulliganStatistics(decklistId: number): void {
    this.mulliganLoading.set(true);
    this.mulliganError.set(null);
    this.mulliganService.getStatistics(decklistId).subscribe({
      next: (stats) => {
        this.mulliganStats.set(stats);
        this.mulliganLoading.set(false);
      },
      error: (err) => {
        // 404 simply means no data yet — not a real error
        if (err.status !== 404) {
          this.mulliganError.set('Failed to load mulligan statistics');
        }
        this.mulliganLoading.set(false);
      }
    });
  }

  refreshStatistics(): void {
    const id = this.currentDecklistId();
    if (id) {
      this.loadStatistics(id);
      this.loadMulliganStatistics(id);
    }
  }

  goToMulliganSession(): void {
    this.router.navigate(['/decklists', this.currentDecklistId(), 'mulligan']);
  }
}
