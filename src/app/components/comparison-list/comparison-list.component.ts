import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { DeckComparison } from '../../models/comparison.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-comparison-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    MessageModule,
    ProgressSpinnerModule,
    ToolbarModule
  ],
  templateUrl: './comparison-list.component.html',
  styleUrl: './comparison-list.component.css'
})
export class ComparisonListComponent implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private comparisonService = inject(DeckComparisonService);
  protected authService = inject(AuthService);

  comparisons = signal<DeckComparison[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadComparisons();
  }

  loadComparisons(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.comparisonService.loadComparisons().subscribe({
      next: (comparisons) => {
        this.comparisons.set(comparisons);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load comparisons. Please try again.');
        this.isLoading.set(false);
        console.error('Error loading comparisons:', error);
      }
    });
  }

  viewComparison(comparison: DeckComparison): void {
    this.comparisonService.selectComparison(comparison);
    this.router.navigate(['/comparisons', comparison.id]);
  }

  viewStatistics(comparison: DeckComparison): void {
    this.router.navigate(['/comparisons', comparison.id, 'statistics']);
  }

  createComparison(): void {
    this.router.navigate(['/comparisons/create']);
  }

  goBackToDecklists(): void {
    this.router.navigate(['/decklists']);
  }
}
