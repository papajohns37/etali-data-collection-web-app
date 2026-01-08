import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { DeckComparisonStatistics, HandSizeDeltaStatistics } from '../../models/comparison.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

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
    ProgressSpinnerModule
  ],
  templateUrl: './comparison-statistics.component.html',
  styleUrl: './comparison-statistics.component.css'
})
export class ComparisonStatisticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private comparisonService = inject(DeckComparisonService);

  statistics = signal<DeckComparisonStatistics | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

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
