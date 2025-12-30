import { Component, inject, signal, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { CardModule } from 'primeng/card';
import { HttpClient } from '@angular/common/http';
import { DragDropModule, CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { DecklistFormComponent } from './components/decklist-form/decklist-form.component';


interface Hand {
  id: number;
  cards: string[];
  seatOrder: number;
  stickers: number[];
  decklistId: number;
  decklistName: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DragDropModule, CommonModule, CdkDrag, CdkDropList, FormsModule, DecklistFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(DecklistFormComponent) decklistForm!: DecklistFormComponent;
  
  protected readonly title = signal('mtg-data');
  currentHand: string[] = [];
  battlefield: {card: string, x: number, y: number, tapped: boolean}[] = [];
  currentHandId: number = 0;
  currentDecklistId: number = 0;
  currentDecklistName: string = '';
  seatOrder: number = 0;
  stickers: number[] = [];
  canCastEtali: boolean = false;
  minimumCardsToCastEtali: number = 8;
  isLoading: boolean = false;
  evaluationMessage: string = '';
  
  private http: HttpClient = inject(HttpClient);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly baseUrl = 'https://localhost:7194';

  onRequestHand() {
    const selectedDecklistName = this.decklistForm?.selectedDecklistName();
    
    if (!selectedDecklistName || selectedDecklistName === 'None') {
      this.evaluationMessage = 'Please select a decklist first';
      return;
    }
    
    console.log('Requesting hand from server. Currently selected decklist:', selectedDecklistName);
    
    this.isLoading = true;
    this.evaluationMessage = '';
    
    const encodedDecklistName = encodeURIComponent(selectedDecklistName);
    this.http.get<Hand>(`${this.baseUrl}/hand?decklistName=${encodedDecklistName}`).subscribe({
      next: (response) => {
        this.currentHandId = response.id;
        this.currentHand = response.cards;
        this.seatOrder = response.seatOrder;
        this.stickers = response.stickers;
        this.currentDecklistId = response.decklistId;
        this.currentDecklistName = response.decklistName;
        this.battlefield = [];
        this.canCastEtali = false;
        this.minimumCardsToCastEtali = 8;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch hand:', err);
        if (err.status === 404) {
          this.evaluationMessage = `Decklist "${selectedDecklistName}" not found`;
        } else if (err.error?.error) {
          this.evaluationMessage = err.error.error;
        } else {
          this.evaluationMessage = 'Failed to fetch hand from server';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getImageUrl(cardName: string): string {
    const formattedName = cardName.replace(/ /g, '+').replace(/'/g, '%27').replace(/,/g, '%2C');
    return `https://api.scryfall.com/cards/named?exact=${formattedName}&format=image`;
  }

  onHandDrop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.currentHand, event.previousIndex, event.currentIndex);
    }
  }

  onHandCardDragEnded(event: CdkDragEnd, card: string, index: number) {
    const dropPoint = event.dropPoint;
    const battlefieldZone = document.querySelector('.battlefield-zone');
    
    if (battlefieldZone) {
      const rect = battlefieldZone.getBoundingClientRect();
      
      if (dropPoint.x >= rect.left && dropPoint.x <= rect.right &&
          dropPoint.y >= rect.top && dropPoint.y <= rect.bottom) {
        // Calculate position relative to battlefield, centering the card
        const x = dropPoint.x - rect.left - 100; // 100 = card width / 2
        const y = dropPoint.y - rect.top - 15;
        
        // Constrain within bounds
        const constrainedX = Math.max(0, Math.min(x, rect.width - 200));
        const constrainedY = Math.max(0, Math.min(y, rect.height - 280));
        
        this.battlefield.push({ card, x: constrainedX, y: constrainedY, tapped: false });
        this.currentHand.splice(index, 1);
      }
    }
  }

  onBattlefieldCardDragEnded(event: CdkDragEnd, index: number) {
    const dropPoint = event.dropPoint;
    const battlefieldZone = document.querySelector('.battlefield-zone');
    const handZone = document.querySelector('.hand-zone');
    
    // Store original position for potential reset
    const originalX = this.battlefield[index].x;
    const originalY = this.battlefield[index].y;
    
    // Check if card was dropped back on hand zone
    if (handZone) {
      const handRect = handZone.getBoundingClientRect();
      
      if (dropPoint.x >= handRect.left && dropPoint.x <= handRect.right &&
          dropPoint.y >= handRect.top && dropPoint.y <= handRect.bottom) {
        const cardData = this.battlefield[index];
        this.currentHand.push(cardData.card);
        this.battlefield.splice(index, 1);
        return;
      }
    }
    
    // Check if card was dropped within battlefield bounds
    if (battlefieldZone) {
      const battlefieldRect = battlefieldZone.getBoundingClientRect();
      const distance = event.distance;
      
      // Calculate new position based on original position plus drag distance
      let newX = originalX + distance.x;
      let newY = originalY + distance.y;
      
      // Check if new position is within battlefield bounds
      const isWithinBounds = newX >= 0 && newX <= battlefieldRect.width - 200 &&
                             newY >= 0 && newY <= battlefieldRect.height - 280;
      
      if (isWithinBounds) {
        // Update to new position
        this.battlefield[index].x = newX;
        this.battlefield[index].y = newY;
      } else {
        // Return to original position if dropped outside battlefield
        this.battlefield[index].x = originalX;
        this.battlefield[index].y = originalY;
      }
      
      // Reset the drag position to prevent double-transform
      event.source.reset();
    }
  }

  onSubmitEvaluation() {
    const payload = {
      id: this.currentHandId,
      cards: this.currentHand,
      seatOrder: this.seatOrder,
      stickers: this.stickers,
      canCastEtali: this.canCastEtali,
      minimumCardsToCastEtali: this.canCastEtali ? this.minimumCardsToCastEtali : 8,
      decklistId: this.currentDecklistId,
      decklistName: this.currentDecklistName
    };

    this.isLoading = true;
    this.http.post(`${this.baseUrl}/hand/evaluate`, payload).subscribe({
      next: (response) => {
        this.evaluationMessage = 'Hand evaluation submitted successfully!';
        this.isLoading = false;
        this.cdr.detectChanges();
        // Reset form for next hand
        setTimeout(() => {
          this.currentHand = [];
          this.battlefield = [];
          this.currentHandId = 0;
          this.currentDecklistId = 0;
          this.currentDecklistName = '';
          this.seatOrder = 0;
          this.stickers = [];
          this.canCastEtali = false;
          this.minimumCardsToCastEtali = 8;
          this.evaluationMessage = '';
        }, 2000);
      },
      error: (err) => {
        console.error('Failed to submit evaluation:', err);
        this.evaluationMessage = 'Failed to submit evaluation. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleTap(index: number) {
    this.battlefield[index].tapped = !this.battlefield[index].tapped;
  }
}
