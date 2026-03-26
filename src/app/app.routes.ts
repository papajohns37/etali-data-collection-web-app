import { Routes } from '@angular/router';
import { decklistGuard } from './guards/decklist.guard';
import { authGuard, adminGuard, contributorGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/decklists',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent),
    canActivate: [adminGuard] // Admin only
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
    path: 'decklists/:id/mulligan',
    loadComponent: () => import('./components/mulligan-session/mulligan-session.component').then(m => m.MulliganSessionComponent),
    canActivate: [authGuard] // Requires authentication to record mulligan sessions
  },
  {
    path: 'decklists/:id/maximum-mana',
    loadComponent: () => import('./components/maximum-mana-hand-collection/maximum-mana-hand-collection.component').then(m => m.MaximumManaHandCollectionComponent),
    canActivate: [contributorGuard] // Requires contributor/admin to record maximum mana hands
  },
  {
    path: 'hand-collection',
    loadComponent: () => import('./components/hand-collection/hand-collection.component').then(m => m.HandCollectionComponent),
    canActivate: [decklistGuard, authGuard] // Requires both decklist selection and authentication
  },
  {
    path: 'comparisons',
    loadComponent: () => import('./components/comparison-list/comparison-list.component').then(m => m.ComparisonListComponent)
  },
  {
    path: 'comparisons/create',
    loadComponent: () => import('./components/comparison-create/comparison-create.component').then(m => m.ComparisonCreateComponent),
    canActivate: [authGuard] // Requires authentication to create comparisons
  },
  {
    path: 'comparisons/:id',
    loadComponent: () => import('./components/comparison-view/comparison-view.component').then(m => m.ComparisonViewComponent)
  },
  {
    path: 'comparisons/:id/collect',
    loadComponent: () => import('./components/comparison-hand-collection/comparison-hand-collection.component').then(m => m.ComparisonHandCollectionComponent),
    canActivate: [authGuard] // Requires authentication to collect hands
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
