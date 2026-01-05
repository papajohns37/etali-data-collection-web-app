import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DecklistService } from '../../services/decklist.service';
import { Decklist } from '../../models/decklist.model';
import { Card } from '../../models/card.model';
import { CardImageUrlPipe } from '../../shared/pipes/card-image-url.pipe';
import { PluralizePipe } from '../../shared/pipes/pluralize.pipe';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

interface CardGroup {
  type: string;
  cards: Card[];
}

@Component({
  selector: 'app-decklist-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    MessageModule,
    TooltipModule,
    CardImageUrlPipe,
    PluralizePipe
  ],
  templateUrl: './decklist-view.component.html',
  styleUrl: './decklist-view.component.css'
})
export class DecklistViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private decklistService = inject(DecklistService);
  
  decklist = signal<Decklist | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  viewMode = signal<'text' | 'image'>('text');
  
  // Mouse tracking for card preview
  hoveredCard = signal<string | null>(null);
  mouseX = signal(0);
  mouseY = signal(0);
  
  // Type priority for grouping (highest priority first)
  private readonly TYPE_PRIORITY = [
    'Land',
    'Creature',
    'Planeswalker',
    'Artifact',
    'Enchantment',
    'Battle',
    'Instant',
    'Sorcery'
  ];
  
  // Group cards by type
  cardGroups = computed(() => {
    const deck = this.decklist();
    if (!deck || !deck.cards) return [];
    
    const groups = new Map<string, Card[]>();
    
    // Group cards by primary type
    deck.cards.forEach(card => {
      const primaryType = this.getPrimaryType(card.type);
      if (!groups.has(primaryType)) {
        groups.set(primaryType, []);
      }
      groups.get(primaryType)!.push(card);
    });
    
    // Sort cards within each group alphabetically
    groups.forEach(cards => {
      cards.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    // Convert to array and sort by type priority
    const result: CardGroup[] = [];
    
    // Add types in priority order
    this.TYPE_PRIORITY.forEach(type => {
      if (groups.has(type)) {
        result.push({ type, cards: groups.get(type)! });
        groups.delete(type);
      }
    });
    
    // Add any remaining types alphabetically
    Array.from(groups.keys())
      .sort()
      .forEach(type => {
        result.push({ type, cards: groups.get(type)! });
      });
    
    return result;
  });
  
  // Total card count
  totalCards = computed(() => {
    const deck = this.decklist();
    return deck?.cards?.length ?? 0;
  });
  
  // Format created date
  formattedDate = computed(() => {
    const deck = this.decklist();
    if (!deck?.createdAt) return '';
    
    const date = new Date(deck.createdAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });
  
  ngOnInit() {
    const decklistId = this.route.snapshot.paramMap.get('id');
    
    if (!decklistId) {
      this.errorMessage.set('No decklist ID provided');
      this.isLoading.set(false);
      return;
    }
    
    this.loadDecklist(Number(decklistId));
  }
  
  private loadDecklist(id: number) {
    // First, check if the decklist is already loaded in the service
    const existingDecklist = this.decklistService.decklists().find(d => d.id === id);
    
    if (existingDecklist) {
      this.decklist.set(existingDecklist);
      this.isLoading.set(false);
      return;
    }
    
    // If not found, load all decklists and then find it
    this.decklistService.loadDecklists().subscribe({
      next: (decklists) => {
        const decklist = decklists.find(d => d.id === id);
        if (decklist) {
          this.decklist.set(decklist);
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
  
  private getPrimaryType(typeLine: string): string {
    // Extract the primary type from the type line
    // e.g., "Legendary Creature — Dragon" -> "Creature"
    // e.g., "Artifact Land" -> "Artifact" (first non-supertype)
    
    const supertypes = ['Legendary', 'Basic', 'Snow', 'World'];
    const parts = typeLine.split('—')[0].trim().split(' ');
    
    // Find first part that's not a supertype
    for (const part of parts) {
      if (!supertypes.includes(part)) {
        return part;
      }
    }
    
    // Fallback to first part if all are supertypes (shouldn't happen)
    return parts[0] || 'Other';
  }
  
  toggleViewMode() {
    this.viewMode.update(mode => mode === 'text' ? 'image' : 'text');
  }
  
  onCardHover(cardName: string, event: MouseEvent) {
    this.hoveredCard.set(cardName);
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  }
  
  onCardMouseMove(event: MouseEvent) {
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  }
  
  onCardLeave() {
    this.hoveredCard.set(null);
  }
  
  goBack() {
    this.router.navigate(['/decklists']);
  }
}
