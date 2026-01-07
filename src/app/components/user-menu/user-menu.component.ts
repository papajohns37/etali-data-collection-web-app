import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

/**
 * User menu component displayed in the navigation bar
 * Shows user info and logout option when authenticated
 */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    MenuModule
  ],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css']
})
export class UserMenuComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  menuItems: MenuItem[] = [];

  constructor() {
    this.updateMenuItems();
  }

  /**
   * Build menu items based on user role
   */
  private updateMenuItems(): void {
    const user = this.authService.getCurrentUser();
    
    this.menuItems = [
      {
        label: user?.email || 'User',
        icon: 'pi pi-user',
        disabled: true,
        styleClass: 'user-email-item'
      },
      {
        separator: true
      }
    ];

    // Add admin-specific menu items
    if (this.authService.isAdmin()) {
      this.menuItems.push({
        label: 'Manage Users',
        icon: 'pi pi-users',
        command: () => this.router.navigate(['/admin/users'])
      });
      this.menuItems.push({
        separator: true
      });
    }

    // Add logout
    this.menuItems.push({
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    });
  }

  /**
   * Handle logout action
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Get user role badge label
   */
  getUserRoleLabel(): string {
    if (this.authService.isAdmin()) {
      return 'Admin';
    } else if (this.authService.isContributor()) {
      return 'Contributor';
    }
    return '';
  }

  /**
   * Get role badge CSS class
   */
  getRoleBadgeClass(): string {
    if (this.authService.isAdmin()) {
      return 'role-badge admin';
    } else if (this.authService.isContributor()) {
      return 'role-badge contributor';
    }
    return '';
  }
}
