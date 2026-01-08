import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { DecklistService } from '../../services/decklist.service';
import { Decklist } from '../../models/decklist.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-comparison-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    MessageModule,
    ProgressSpinnerModule
  ],
  templateUrl: './comparison-create.component.html',
  styleUrl: './comparison-create.component.css'
})
export class ComparisonCreateComponent implements OnInit {
  private router = inject(Router);
  private comparisonService = inject(DeckComparisonService);
  private decklistService = inject(DecklistService);

  decklists = signal<Decklist[]>([]);
  selectedDeck1 = signal<Decklist | null>(null);
  selectedDeck2 = signal<Decklist | null>(null);
  isLoading = signal(false);
  isLoadingDecklists = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadDecklists();
  }

  loadDecklists(): void {
    this.decklistService.loadDecklists().subscribe({
      next: (decklists) => {
        this.decklists.set(decklists);
        this.isLoadingDecklists.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load decklists. Please try again.');
        this.isLoadingDecklists.set(false);
        console.error('Error loading decklists:', error);
      }
    });
  }

  createComparison(): void {
    const deck1 = this.selectedDeck1();
    const deck2 = this.selectedDeck2();

    if (!deck1 || !deck2) {
      this.errorMessage.set('Please select both decks to compare.');
      return;
    }

    if (deck1.id === deck2.id) {
      this.errorMessage.set('Cannot compare a deck to itself. Please select different decks.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.comparisonService.createComparison(deck1.id, deck2.id).subscribe({
      next: (comparison) => {
        this.isLoading.set(false);
        this.router.navigate(['/comparisons', comparison.id]);
      },
      error: (error) => {
        this.isLoading.set(false);
        
        if (error.status === 409) {
          this.errorMessage.set('A comparison between these decks already exists.');
        } else if (error.status === 400) {
          this.errorMessage.set('Invalid comparison request. Please select different decks.');
        } else if (error.status === 404) {
          this.errorMessage.set('One or both selected decks could not be found.');
        } else {
          this.errorMessage.set('Failed to create comparison. Please try again.');
        }
        
        console.error('Error creating comparison:', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/comparisons']);
  }

  canCreate(): boolean {
    return !!this.selectedDeck1() && !!this.selectedDeck2() && !this.isLoading();
  }
}
