import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    @if (auth.isAuthenticated()) {
      <nav class="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-bold">M</div>
            <span class="font-bold text-xl tracking-tight">Mindful Spending</span>
          </div>
          <div class="flex items-center gap-6">
            <a routerLink="/dashboard" routerLinkActive="text-emerald-500" class="text-sm font-medium hover:text-emerald-400 transition-colors">Dashboard</a>
            <a routerLink="/academy" routerLinkActive="text-emerald-500" class="text-sm font-medium hover:text-emerald-400 transition-colors text-slate-400">Academy</a>
            <button (click)="auth.signOut()" class="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Sign Out</button>
          </div>
        </div>
      </nav>
    }
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
