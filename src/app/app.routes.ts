import { Routes } from '@angular/router';
import { DecklistSelectionComponent } from './components/decklist-selection/decklist-selection.component';
import { HandCollectionComponent } from './components/hand-collection/hand-collection.component';
import { decklistGuard } from './guards/decklist.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/decklists',
    pathMatch: 'full'
  },
  {
    path: 'decklists',
    component: DecklistSelectionComponent
  },
  {
    path: 'hand-collection',
    component: HandCollectionComponent,
    canActivate: [decklistGuard]
  }
];
