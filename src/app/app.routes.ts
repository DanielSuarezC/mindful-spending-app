import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AcademyComponent } from './features/academy/academy.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { BudgetComponent } from './features/budget/budget.component';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';

const authGuard = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitForInit();
  if (auth.isAuthenticated()) return true;
  return router.navigate(['/login']);
};

export const routes: Routes = [
  { path: 'login',          component: LoginComponent },
  { path: 'dashboard',      component: DashboardComponent,    canActivate: [authGuard] },
  { path: 'transacciones',  component: TransactionsComponent, canActivate: [authGuard] },
  { path: 'presupuesto',    component: BudgetComponent,       canActivate: [authGuard] },
  { path: 'academia',       component: AcademyComponent,      canActivate: [authGuard] },
  { path: '',               redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**',             redirectTo: '/dashboard' }
];
