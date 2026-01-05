import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { DecklistService } from '../../services/decklist.service';
import { DecklistStatistics } from '../../models/statistics.model';
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
    TooltipModule,
    PercentagePipe
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit {
  private decklistService = inject(DecklistService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  statistics = signal<DecklistStatistics | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

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

    this.loadStatistics(parseInt(decklistId, 10));
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
    this.router.navigate(['/decklists']);
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

  refreshStatistics(): void {
    const stats = this.statistics();
    if (stats) {
      this.loadStatistics(stats.decklistId);
    }
  }
}
