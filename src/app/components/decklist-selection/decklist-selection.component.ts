import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { DecklistService } from '../../services/decklist.service';
import { DecklistFormComponent } from '../decklist-form/decklist-form.component';
import { Decklist } from '../../models/decklist.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-decklist-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, DecklistFormComponent, ButtonModule, CardModule, DialogModule, ToolbarModule, InputTextModule, TooltipModule],
  templateUrl: './decklist-selection.component.html',
  styleUrl: './decklist-selection.component.css'
})
export class DecklistSelectionComponent {
  private router = inject(Router);
  private messageService = inject(MessageService);
  protected decklistService = inject(DecklistService);
  protected authService = inject(AuthService);
  showModal = signal(false);
  
  // Rename state
  editingDecklistId = signal<number | null>(null);
  newName = signal<string>('');
  isRenaming = signal<boolean>(false);

  constructor() {
    // Load decklists on init - errors are logged in service
    this.decklistService.loadDecklists().subscribe();
  }

  onDecklistSelected(decklist: Decklist): void {
    this.decklistService.selectDecklist(decklist);
    this.router.navigate(['/hand-collection']);
  }

  viewDecklist(decklist: Decklist): void {
    this.router.navigate(['/decklists/view', decklist.id]);
  }

  viewStatistics(decklist: Decklist): void {
    this.router.navigate(['/decklists', decklist.id, 'statistics']);
  }

  viewComparisons(): void {
    this.router.navigate(['/comparisons']);
  }

  startMulligan(decklist: Decklist): void {
    this.router.navigate(['/decklists', decklist.id, 'mulligan']);
  }

  openAddDecklistModal(): void {
    this.showModal.set(true);
  }

  closeAddDecklistModal(): void {
    this.showModal.set(false);
  }

  onDecklistAdded(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Decklist added successfully!',
      life: 3000,
    });
    this.closeAddDecklistModal();
  }

  /**
   * Check if the current user can rename a specific decklist
   */
  canRename(decklist: Decklist): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    
    // Debug logging
    console.log('Permission check:', {
      decklistName: decklist.name,
      decklistCreatedBy: decklist.createdByUserId,
      decklistCreatedByType: typeof decklist.createdByUserId,
      currentUserId: user.userId,
      currentUserIdType: typeof user.userId,
      userRoles: user.roles,
      isAdmin: this.authService.isAdmin(),
      isContributor: this.authService.isContributor(),
    });
    
    // Admins can rename any decklist
    if (this.authService.isAdmin()) {
      console.log('✅ Admin can rename');
      return true;
    }
    
    // Contributors can only rename their own decklists
    if (this.authService.isContributor()) {
      // If createdByUserId is not set, can't determine ownership
      if (!decklist.createdByUserId) {
        console.log('❌ No createdByUserId on decklist');
        return false;
      }
      
      // If userId is not set on user, can't determine ownership
      if (!user.userId) {
        console.log('❌ No userId on user');
        return false;
      }
      
      // Handle both string and potential type mismatches
      const match = String(decklist.createdByUserId) === String(user.userId);
      console.log(match ? '✅ User owns this decklist' : '❌ User does not own this decklist');
      return match;
    }
    
    console.log('❌ User has no qualifying role');
    return false;
  }

  /**
   * Start editing a decklist name
   */
  startRename(decklist: Decklist): void {
    this.editingDecklistId.set(decklist.id);
    this.newName.set(decklist.name);
  }

  /**
   * Cancel editing
   */
  cancelRename(): void {
    this.editingDecklistId.set(null);
    this.newName.set('');
  }

  /**
   * Save the renamed decklist
   */
  saveRename(decklist: Decklist): void {
    const trimmedName = this.newName().trim();
    
    // Validation
    if (!trimmedName) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Name',
        detail: 'Decklist name cannot be empty',
        life: 3000,
      });
      return;
    }
    
    if (trimmedName.length > 500) {
      this.messageService.add({
        severity: 'error',
        summary: 'Name Too Long',
        detail: 'Decklist name cannot exceed 500 characters',
        life: 3000,
      });
      return;
    }
    
    // No change
    if (trimmedName === decklist.name) {
      this.cancelRename();
      return;
    }
    
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.messageService.add({
        severity: 'error',
        summary: 'Not Authorized',
        detail: 'You must be logged in to rename a decklist',
        life: 3000,
      });
      return;
    }
    
    this.isRenaming.set(true);
    
    this.decklistService.renameDecklist(decklist.id, trimmedName, user.token).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Renamed',
          detail: `Decklist renamed to "${response.newName}"`,
          life: 3000,
        });
        this.editingDecklistId.set(null);
        this.newName.set('');
        this.isRenaming.set(false);
      },
      error: (error) => {
        console.error('Failed to rename decklist:', error);
        let errorMessage = 'Failed to rename decklist';
        
        if (error.status === 401) {
          errorMessage = 'You do not have permission to rename this decklist';
        } else if (error.status === 404) {
          errorMessage = 'Decklist not found';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Rename Failed',
          detail: errorMessage,
          life: 5000,
        });
        this.isRenaming.set(false);
      }
    });
  }

  /**
   * Handle Enter key to save, Escape to cancel
   */
  onRenameKeyDown(event: KeyboardEvent, decklist: Decklist): void {
    if (event.key === 'Enter' && !this.isRenaming()) {
      this.saveRename(decklist);
    } else if (event.key === 'Escape') {
      this.cancelRename();
    }
  }
}
