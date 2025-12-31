import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DecklistService } from '../../services/decklist.service';
import { DecklistFormComponent } from '../decklist-form/decklist-form.component';
import { Decklist } from '../../models/decklist.model';

@Component({
  selector: 'app-decklist-selection',
  standalone: true,
  imports: [CommonModule, DecklistFormComponent],
  templateUrl: './decklist-selection.component.html',
  styleUrl: './decklist-selection.component.css'
})
export class DecklistSelectionComponent implements OnInit {
  private router = inject(Router);
  protected decklistService = inject(DecklistService);
  showModal = false;

  ngOnInit(): void {
    this.decklistService.loadDecklists().subscribe({
      error: (err) => {
        console.error('Failed to load decklists:', err);
      }
    });
  }

  onDecklistSelected(decklist: Decklist): void {
    this.decklistService.selectDecklist(decklist);
    this.router.navigate(['/hand-collection']);
  }

  openAddDecklistModal(): void {
    this.showModal = true;
  }

  closeAddDecklistModal(): void {
    this.showModal = false;
  }

  onDecklistAdded(): void {
    this.closeAddDecklistModal();
  }
}
