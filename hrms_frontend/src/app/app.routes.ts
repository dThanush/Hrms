import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AppComponent } from './app.component';

export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'login', component: LoginComponent },
  { path: 'user', component: UserComponent , data: { role: 'employee' } },
  { path: 'dashboard', component: DashboardComponent , data: { role: 'admin' } },
  { path: '', redirectTo: '/login', pathMatch: 'full' } // Default redirect
];
