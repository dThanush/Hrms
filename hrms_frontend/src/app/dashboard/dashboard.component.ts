import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminComponent } from '../admin/admin.component';
import { UserComponent } from '../user/user.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AdminComponent, UserComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  userRole: 'admin' | 'employee' | null = null;
  selectedSection: string = 'dashboard';
  username: string = '';

  constructor(private router: Router) {
    this.initializeUser();
  }

  private initializeUser(): void {
    const storedRole = localStorage.getItem('user_type');
    const storedId = localStorage.getItem('user_id');
    this.username = localStorage.getItem('username') || '';

    console.log('Stored Role:', storedRole);
    console.log('Stored ID:', storedId);

    if (!storedId) {
      this.router.navigate(['/login']);
      return;
    }

    if (storedRole === '1') {
      this.userRole = 'admin';
    } else if (storedRole === '2') {
      this.userRole = 'employee';
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.selectedSection = 'dashboard';
    console.log('Assigned Role:', this.userRole);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('username');
    this.router.navigate(['/login']);
  }

  changeSection(section: string): void {
    this.selectedSection = section;
    console.log('Selected Section:', this.selectedSection);
  }
}
