import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DecklistService } from '../../services/decklist.service';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { Decklist } from '../../models/decklist.model';
import { CardDifferences } from '../../models/comparison.model';
import { CardDifferencesDisplayComponent } from '../card-differences-display/card-differences-display.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-deck-compare',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectModule,
    ProgressSpinnerModule,
    CardDifferencesDisplayComponent
  ],
  templateUrl: './deck-compare.component.html',
  styleUrl: './deck-compare.component.css'
})
export class DeckCompareComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private decklistService = inject(DecklistService);
  private comparisonService = inject(DeckComparisonService);

  currentDeck = signal<Decklist | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  
  // Comparison feature
  compareToDeckId = signal<number | null>(null);
  cardDifferences = signal<CardDifferences | null>(null);
  isLoadingComparison = signal(false);
  
  // Available decks for comparison (excluding current deck)
  availableDecksForComparison = computed(() => {
    const currentDeckId = this.currentDeck()?.id;
    return this.decklistService.decklists().filter(d => d.id !== currentDeckId);
  });
  
  // Name of the deck being compared to
  comparedDeckName = computed(() => {
    const deckId = this.compareToDeckId();
    if (!deckId) return '';
    return this.availableDecksForComparison().find(d => d.id === deckId)?.name || '';
  });

  ngOnInit(): void {
    const decklistId = this.route.snapshot.paramMap.get('id');
    
    if (!decklistId) {
      this.errorMessage.set('No decklist ID provided');
      this.isLoading.set(false);
      return;
    }
    
    const id = Number(decklistId);
    this.loadDecklist(id);
  }

  private loadDecklist(id: number): void {
    const existingDecklist = this.decklistService.decklists().find(d => d.id === id);
    
    if (existingDecklist) {
      this.currentDeck.set(existingDecklist);
      this.isLoading.set(false);
      return;
    }
    
    this.decklistService.loadDecklists().subscribe({
      next: (decklists) => {
        const decklist = decklists.find(d => d.id === id);
        if (decklist) {
          this.currentDeck.set(decklist);
        } else {
          this.errorMessage.set('Decklist not found.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load decklists:', err);
        this.errorMessage.set('Failed to load decklist. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  onCompareToChange(deckId: number | null): void {
    this.compareToDeckId.set(deckId);
    
    if (deckId === null) {
      this.cardDifferences.set(null);
      return;
    }
    
    const currentDeckId = this.currentDeck()?.id;
    if (!currentDeckId) return;
    
    this.isLoadingComparison.set(true);
    this.comparisonService.compareDecks(currentDeckId, deckId).subscribe({
      next: (differences) => {
        this.cardDifferences.set(differences);
        this.isLoadingComparison.set(false);
      },
      error: (err) => {
        console.error('Failed to compare decks:', err);
        this.isLoadingComparison.set(false);
      }
    });
  }
  
  goBack(): void {
    this.location.back();
  }
}
