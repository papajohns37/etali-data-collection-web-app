import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DecklistService } from '../services/decklist.service';

export const decklistGuard: CanActivateFn = (route, state) => {
  const decklistService = inject(DecklistService);
  const router = inject(Router);

  if (decklistService.hasSelectedDecklist()) {
    return true;
  }

  // Redirect to decklists page if no decklist is selected
  router.navigate(['/decklists']);
  return false;
};
