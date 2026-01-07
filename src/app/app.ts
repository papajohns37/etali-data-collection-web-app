import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { UserMenuComponent } from './components/user-menu/user-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ToastModule, UserMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
