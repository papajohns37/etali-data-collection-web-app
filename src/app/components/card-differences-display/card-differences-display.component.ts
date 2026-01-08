import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardDifferences } from '../../models/comparison.model';
import { Card } from '../../models/card.model';
import { CachedImageDirective } from '../../shared/directives/cached-image.directive';
import { PluralizePipe } from '../../shared/pipes/pluralize.pipe';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-card-differences-display',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AccordionModule,
    ChipModule,
    TooltipModule,
    CachedImageDirective,
    PluralizePipe
  ],
  templateUrl: './card-differences-display.component.html',
  styleUrl: './card-differences-display.component.css'
})
export class CardDifferencesDisplayComponent {
  // Inputs
  cardDifferences = input.required<CardDifferences>();
  deck1Name = input.required<string>();
  deck2Name = input.required<string>();
  
  // View state
  viewMode = signal<'text' | 'image'>('text');
  hoveredCard = signal<string | null>(null);
  mouseX = signal(0);
  mouseY = signal(0);
  
  // Type priority for grouping
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
  
  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'text' ? 'image' : 'text');
  }
  
  groupCardsByType(cards: Card[]): { type: string; cards: Card[] }[] {
    const groups = new Map<string, Card[]>();
    
    cards.forEach(card => {
      const primaryType = this.getPrimaryType(card.type);
      if (!groups.has(primaryType)) {
        groups.set(primaryType, []);
      }
      groups.get(primaryType)!.push(card);
    });
    
    groups.forEach(groupCards => {
      groupCards.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    const result: { type: string; cards: Card[] }[] = [];
    
    this.TYPE_PRIORITY.forEach(type => {
      if (groups.has(type)) {
        result.push({ type, cards: groups.get(type)! });
        groups.delete(type);
      }
    });
    
    Array.from(groups.keys())
      .sort()
      .forEach(type => {
        result.push({ type, cards: groups.get(type)! });
      });
    
    return result;
  }
  
  private getPrimaryType(typeLine: string): string {
    const supertypes = ['Legendary', 'Basic', 'Snow', 'World'];
    const parts = typeLine.split('—')[0].trim().split(' ');
    
    for (const part of parts) {
      if (!supertypes.includes(part)) {
        return part;
      }
    }
    
    return parts[0] || 'Other';
  }
  
  onCardHover(cardName: string, event: MouseEvent): void {
    this.hoveredCard.set(cardName);
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  }
  
  onCardMouseMove(event: MouseEvent): void {
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  }
  
  onCardLeave(): void {
    this.hoveredCard.set(null);
  }
}
