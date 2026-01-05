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
    path: 'decklists/:id/compare',
    loadComponent: () => import('./components/deck-compare/deck-compare.component').then(m => m.DeckCompareComponent)
  },
  {
    path: 'hand-collection',
    loadComponent: () => import('./components/hand-collection/hand-collection.component').then(m => m.HandCollectionComponent),
    canActivate: [decklistGuard]
  },
  {
    path: 'comparisons',
    loadComponent: () => import('./components/comparison-list/comparison-list.component').then(m => m.ComparisonListComponent)
  },
  {
    path: 'comparisons/create',
    loadComponent: () => import('./components/comparison-create/comparison-create.component').then(m => m.ComparisonCreateComponent)
  },
  {
    path: 'comparisons/:id',
    loadComponent: () => import('./components/comparison-view/comparison-view.component').then(m => m.ComparisonViewComponent)
  },
  {
    path: 'comparisons/:id/collect',
    loadComponent: () => import('./components/comparison-hand-collection/comparison-hand-collection.component').then(m => m.ComparisonHandCollectionComponent)
  },
  {
    path: 'comparisons/:id/statistics',
    loadComponent: () => import('./components/comparison-statistics/comparison-statistics.component').then(m => m.ComparisonStatisticsComponent)
  },
  {
    path: '**',
    redirectTo: '/decklists'
  }
];
