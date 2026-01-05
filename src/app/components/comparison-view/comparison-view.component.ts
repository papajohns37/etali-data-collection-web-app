import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { DeckComparison, CardDifferences } from '../../models/comparison.model';
import { CardDifferencesDisplayComponent } from '../card-differences-display/card-differences-display.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-comparison-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    MessageModule,
    CardDifferencesDisplayComponent
  ],
  templateUrl: './comparison-view.component.html',
  styleUrl: './comparison-view.component.css'
})
export class ComparisonViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private comparisonService = inject(DeckComparisonService);

  comparison = signal<DeckComparison | null>(null);
  cardDifferences = signal<CardDifferences | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (isNaN(id)) {
      this.errorMessage.set('Invalid comparison ID');
      this.isLoading.set(false);
      return;
    }

    this.loadComparison(id);
  }

  loadComparison(id: number): void {
    this.comparisonService.getComparison(id).subscribe({
      next: (comparison) => {
        this.comparison.set(comparison);
        this.isLoading.set(false);
        // Load card differences using deck IDs
        this.loadCardDifferences(comparison.deck1Id, comparison.deck2Id);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load comparison. Please try again.');
        this.isLoading.set(false);
        console.error('Error loading comparison:', error);
      }
    });
  }

  loadCardDifferences(deck1Id: number, deck2Id: number): void {
    this.comparisonService.compareDecks(deck1Id, deck2Id).subscribe({
      next: (differences) => {
        this.cardDifferences.set(differences);
      },
      error: (error) => {
        console.error('Error loading card differences:', error);
      }
    });
  }

  startEvaluation(): void {
    const comp = this.comparison();
    if (comp) {
      this.router.navigate(['/comparisons', comp.id, 'collect']);
    }
  }

  viewStatistics(): void {
    const comp = this.comparison();
    if (comp) {
      this.router.navigate(['/comparisons', comp.id, 'statistics']);
    }
  }

  goBack(): void {
    this.location.back();
  }

  viewDeck1(): void {
    const comp = this.comparison();
    if (comp) {
      this.router.navigate(['/decklists/view', comp.deck1Id]);
    }
  }

  viewDeck2(): void {
    const comp = this.comparison();
    if (comp) {
      this.router.navigate(['/decklists/view', comp.deck2Id]);
    }
  }

  hasData(): boolean {
    const comp = this.comparison();
    return comp ? (comp.deck1N > 0 || comp.deck2N > 0) : false;
  }
}