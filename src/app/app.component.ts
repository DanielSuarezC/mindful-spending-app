import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    @if (auth.isAuthenticated()) {
      <nav class="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <a routerLink="/dashboard" class="flex items-center gap-2 shrink-0">
              <div class="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-sm">M</div>
              <span class="font-bold text-lg tracking-tight hidden sm:block">Mindful Spending</span>
            </a>

            <!-- Escritorio -->
            <div class="hidden md:flex items-center gap-1">
              <a routerLink="/dashboard" routerLinkActive="text-emerald-400 bg-slate-800"
                class="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                Inicio
              </a>
              <a routerLink="/transacciones" routerLinkActive="text-emerald-400 bg-slate-800"
                class="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                Transacciones
              </a>
              <a routerLink="/presupuesto" routerLinkActive="text-emerald-400 bg-slate-800"
                class="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                Presupuesto
              </a>
              <a routerLink="/academia" routerLinkActive="text-emerald-400 bg-slate-800"
                class="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                Academia
              </a>
              <button (click)="auth.signOut()"
                class="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all">
                Cerrar sesión
              </button>
            </div>

            <!-- Hamburguesa móvil -->
            <button (click)="toggleMenu()"
              class="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              @if (menuOpen()) {
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              } @else {
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              }
            </button>
          </div>

          <!-- Menú móvil desplegable -->
          @if (menuOpen()) {
            <div class="md:hidden border-t border-slate-800 py-3 space-y-1">
              @for (item of navItems; track item.path) {
                <a [routerLink]="item.path" routerLinkActive="text-emerald-400 bg-slate-800"
                  (click)="menuOpen.set(false)"
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                  <span class="text-lg">{{ item.icon }}</span>
                  {{ item.label }}
                </a>
              }
              <div class="border-t border-slate-800 mt-2 pt-2">
                <button (click)="auth.signOut()"
                  class="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-all">
                  <span class="text-lg">🚪</span> Cerrar sesión
                </button>
              </div>
            </div>
          }
        </div>
      </nav>
    }
    <main class="pb-8">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {
  menuOpen = signal(false);
  toggleMenu() { this.menuOpen.set(!this.menuOpen()); }

  navItems = [
    { path: '/dashboard',     label: 'Inicio',          icon: '🏠' },
    { path: '/transacciones', label: 'Transacciones',   icon: '💳' },
    { path: '/presupuesto',   label: 'Presupuesto',     icon: '📊' },
    { path: '/academia',      label: 'Academia',        icon: '📚' },
  ];

  constructor(public auth: AuthService) {}
}
