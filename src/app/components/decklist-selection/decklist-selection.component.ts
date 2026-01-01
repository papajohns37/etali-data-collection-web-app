import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DecklistService } from '../../services/decklist.service';
import { DecklistFormComponent } from '../decklist-form/decklist-form.component';
import { Decklist } from '../../models/decklist.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-decklist-selection',
  standalone: true,
  imports: [CommonModule, DecklistFormComponent, ButtonModule, CardModule, DialogModule],
  templateUrl: './decklist-selection.component.html',
  styleUrl: './decklist-selection.component.css'
})
export class DecklistSelectionComponent {
  private router = inject(Router);
  protected decklistService = inject(DecklistService);
  showModal = signal(false);

  constructor() {
    // Load decklists on init - errors are logged in service
    this.decklistService.loadDecklists().subscribe();
  }

  onDecklistSelected(decklist: Decklist): void {
    this.decklistService.selectDecklist(decklist);
    this.router.navigate(['/hand-collection']);
  }

  openAddDecklistModal(): void {
    this.showModal.set(true);
  }

  closeAddDecklistModal(): void {
    this.showModal.set(false);
  }

  onDecklistAdded(): void {
    this.closeAddDecklistModal();
  }
}
