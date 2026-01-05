import { Routes } from '@angular/router';
import { decklistGuard } from './guards/decklist.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/decklists',
    pathMatch: 'full'
  },
  {
    path: 'decklists',
    loadComponent: () => import('./components/decklist-selection/decklist-selection.component').then(m => m.DecklistSelectionComponent)
  },
  {
    path: 'decklists/view/:id',
    loadComponent: () => import('./components/decklist-view/decklist-view.component').then(m => m.DecklistViewComponent)
  },
  {
    path: 'decklists/:id/statistics',
    loadComponent: () => import('./components/statistics/statistics.component').then(m => m.StatisticsComponent)
  },
  {
    path: 'hand-collection',
    loadComponent: () => import('./components/hand-collection/hand-collection.component').then(m => m.HandCollectionComponent),
    canActivate: [decklistGuard]
  },
  {
    path: '**',
    redirectTo: '/decklists'
  }
];
