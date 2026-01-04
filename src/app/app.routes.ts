import { Routes } from '@angular/router';
import { DecklistSelectionComponent } from './components/decklist-selection/decklist-selection.component';
import { DecklistViewComponent } from './components/decklist-view/decklist-view.component';
import { HandCollectionComponent } from './components/hand-collection/hand-collection.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
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
    path: 'decklists/view/:id',
    component: DecklistViewComponent
  },
  {
    path: 'decklists/:id/statistics',
    component: StatisticsComponent
  },
  {
    path: 'hand-collection',
    component: HandCollectionComponent,
    canActivate: [decklistGuard]
  },
  {
    path: '**',
    redirectTo: '/decklists'
  }
];
