import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div class="zen-card w-full max-auto max-w-md">
        <h2 class="text-3xl font-bold text-center mb-2 text-emerald-700">Mindful Spending</h2>
        <p class="text-slate-400 text-center mb-8 italic">Cultivate your financial peace of mind</p>

        <form (submit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" class="input-field w-full" placeholder="you@example.com" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input type="password" [(ngModel)]="password" name="password" class="input-field w-full" placeholder="••••••••" required>
          </div>
          
          @if (isRegistering()) {
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input type="text" [(ngModel)]="fullName" name="fullName" class="input-field w-full" placeholder="John Doe" required>
            </div>
          }

          @if (error()) {
            <p class="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">{{ error() }}</p>
          }

          <button type="submit" class="btn-primary w-full py-3 text-lg" [disabled]="loading()">
            {{ loading() ? 'Processing...' : (isRegistering() ? 'Create Account' : 'Sign In') }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button (click)="isRegistering.set(!isRegistering())" class="text-emerald-700 hover:text-emerald-600 text-sm font-medium transition-colors">
            {{ isRegistering() ? 'Already have an account? Sign In' : 'New here? Register now' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  fullName = '';
  isRegistering = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService) {}

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    
    const { error } = this.isRegistering() 
      ? await this.auth.signUp(this.email, this.password, this.fullName)
      : await this.auth.signIn(this.email, this.password);

    if (error) {
      this.error.set(error.message);
    }
    this.loading.set(false);
  }
}
