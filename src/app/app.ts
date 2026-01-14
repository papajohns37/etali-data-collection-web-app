import { Component, inject, OnInit, Renderer2, Inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationEnd, RouterLinkActive } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuItem } from 'primeng/api';
import { UserMenuComponent } from './components/user-menu/user-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, ToolbarModule, UserMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  
  menuItems: MenuItem[] = [
    {
      label: 'Decklists',
      icon: 'pi pi-list',
      routerLink: '/decklists',
      styleClass: 'menu-item-decklists'
    },
    {
      label: 'Comparisons',
      icon: 'pi pi-arrows-h',
      routerLink: '/comparisons',
      styleClass: 'menu-item-comparisons'
    }
  ];

  constructor() {
    // Force dark mode by adding the class that PrimeNG looks for
    this.renderer.addClass(this.document.documentElement, 'app-dark');
  }

  ngOnInit() {
    // Set initial active state
    const initialUrl = this.router.routerState.snapshot.url || '/decklists';
    this.updateActiveMenuItem(initialUrl);
    
    // Update active state on navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveMenuItem(event.urlAfterRedirects);
      });
  }

  private updateActiveMenuItem(url: string) {
    // Handle root path as decklists
    const currentPath = url === '/' ? '/decklists' : url;
    
    this.menuItems.forEach(item => {
      const routerLink = item.routerLink as string;
      const isActive = currentPath.startsWith(routerLink);
      
      // Clean and update styleClass
      const baseClass = item.styleClass?.replace(' active-menu-item', '').trim() || '';
      item.styleClass = isActive ? `${baseClass} active-menu-item`.trim() : baseClass;
    });
    // Force menubar to re-render
    this.menuItems = [...this.menuItems];
  }
}
