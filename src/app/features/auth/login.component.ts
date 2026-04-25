import { Component, signal, OnDestroy } from '@angular/core';
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
            <label class="block text-sm font-medium text-slate-300 mb-2">Correo electrónico</label>
            <input type="email" [(ngModel)]="email" name="email" class="input-field w-full"
              placeholder="tu@ejemplo.com" required [disabled]="isBlocked()">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" class="input-field w-full"
              placeholder="••••••••" required [disabled]="isBlocked()">
          </div>

          @if (isRegistering()) {
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Nombre completo</label>
              <input type="text" [(ngModel)]="fullName" name="fullName" class="input-field w-full"
                placeholder="Juan Pérez" required>
            </div>
          }

          <!-- Mensaje de éxito -->
          @if (successMessage()) {
            <div class="flex items-start gap-2 text-emerald-400 text-sm bg-emerald-900/20 p-3 rounded-lg border border-emerald-800">
              <span class="mt-0.5">✓</span>
              <span>{{ successMessage() }}</span>
            </div>
          }

          <!-- Error general -->
          @if (error()) {
            <div class="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">
              <span class="mt-0.5">✕</span>
              <span>{{ error() }}</span>
            </div>
          }

          <!-- Correo no confirmado: opción de reenviar -->
          @if (needsEmailConfirmation()) {
            <div class="text-sm bg-yellow-900/20 p-3 rounded-lg border border-yellow-800 space-y-2">
              <p class="text-yellow-300">
                Tu correo aún no está confirmado. Revisa tu bandeja de entrada (también el spam).
              </p>
              <button type="button" (click)="resendConfirmation()"
                [disabled]="resendLoading() || resendCooldown() > 0"
                class="text-yellow-400 underline hover:text-yellow-300 disabled:opacity-50 disabled:no-underline transition-colors">
                @if (resendLoading()) {
                  Enviando...
                } @else if (resendCooldown() > 0) {
                  Reenviar en {{ resendCooldown() }}s
                } @else {
                  Reenviar correo de confirmación
                }
              </button>
            </div>
          }

          <!-- Bloqueado por rate limit -->
          @if (isBlocked()) {
            <div class="flex items-start gap-2 text-yellow-400 text-sm bg-yellow-900/20 p-3 rounded-lg border border-yellow-800">
              <span class="mt-0.5">⚠</span>
              <span>
                Demasiados intentos fallidos. Podrás intentarlo de nuevo en
                <strong>{{ remainingTime() }}</strong>.
              </span>
            </div>
          }

          <button type="submit" class="btn-primary w-full py-3 text-lg"
            [disabled]="loading() || isBlocked()">
            {{ loading() ? 'Procesando...' : (isRegistering() ? 'Crear cuenta' : 'Iniciar sesión') }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button (click)="toggleMode()" class="text-emerald-700 hover:text-emerald-600 text-sm font-medium transition-colors">
            {{ isRegistering() ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nuevo aquí? Regístrate' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnDestroy {
  email = '';
  password = '';
  fullName = '';
  isRegistering = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isBlocked = signal(false);
  remainingTime = signal('');
  needsEmailConfirmation = signal(false);
  resendLoading = signal(false);
  resendCooldown = signal(0);

  private blockTimer?: ReturnType<typeof setInterval>;
  private cooldownTimer?: ReturnType<typeof setInterval>;

  constructor(private auth: AuthService) {
    this.checkBlockStatus();
  }

  private checkBlockStatus(): void {
    const status = this.auth.getRateLimitStatus();
    if (status.blocked) {
      this.isBlocked.set(true);
      this.startBlockCountdown(status.remainingMs);
    }
  }

  private startBlockCountdown(remainingMs: number): void {
    this.updateRemainingTime(remainingMs);
    clearInterval(this.blockTimer);
    let remaining = remainingMs;
    this.blockTimer = setInterval(() => {
      remaining -= 1000;
      if (remaining <= 0) {
        clearInterval(this.blockTimer);
        this.isBlocked.set(false);
        this.remainingTime.set('');
        this.error.set(null);
      } else {
        this.updateRemainingTime(remaining);
      }
    }, 1000);
  }

  private updateRemainingTime(ms: number): void {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    this.remainingTime.set(`${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`);
  }

  toggleMode(): void {
    this.isRegistering.update(v => !v);
    this.error.set(null);
    this.successMessage.set(null);
    this.needsEmailConfirmation.set(false);
  }

  async onSubmit() {
    if (this.isBlocked()) return;

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);
    this.needsEmailConfirmation.set(false);

    if (this.isRegistering()) {
      await this.handleSignUp();
    } else {
      await this.handleSignIn();
    }

    this.loading.set(false);
  }

  private async handleSignUp() {
    const result = await this.auth.signUp(this.email, this.password, this.fullName);

    if (!result.userCreated && result.error) {
      this.error.set(this.translateError(result.error.message));
      return;
    }

    if (result.userCreated) {
      this.successMessage.set('¡Usuario registrado exitosamente! Bienvenido a Mindful Spending.');
      if (result.error?.message === 'Email not confirmed') {
        this.needsEmailConfirmation.set(true);
      } else if (result.error) {
        this.error.set(this.translateError(result.error.message));
      }
    }
  }

  private async handleSignIn() {
    const result = await this.auth.signIn(this.email, this.password);

    if (result.blocked) {
      this.isBlocked.set(true);
      this.startBlockCountdown(result.remainingMs);
      return;
    }

    if (result.needsEmailConfirmation) {
      this.needsEmailConfirmation.set(true);
      return;
    }

    if (result.error) {
      const status = this.auth.getRateLimitStatus();
      let msg = this.translateError(result.error.message);

      if (status.blocked) {
        this.isBlocked.set(true);
        this.startBlockCountdown(status.remainingMs);
      } else if (status.attemptsLeft <= 2 && status.attemptsLeft > 0) {
        msg += ` Te queda${status.attemptsLeft === 1 ? '' : 'n'} ${status.attemptsLeft} intento${status.attemptsLeft === 1 ? '' : 's'}.`;
      }

      this.error.set(msg);
    }
  }

  async resendConfirmation() {
    if (!this.email || this.resendLoading() || this.resendCooldown() > 0) return;

    this.resendLoading.set(true);
    const { error } = await this.auth.resendConfirmationEmail(this.email);
    this.resendLoading.set(false);

    if (error) {
      this.error.set(this.translateError(error.message));
    } else {
      this.successMessage.set('Correo de confirmación reenviado. Revisa tu bandeja de entrada.');
      this.startResendCooldown(60);
    }
  }

  private startResendCooldown(seconds: number): void {
    this.resendCooldown.set(seconds);
    clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown.update(v => {
        if (v <= 1) { clearInterval(this.cooldownTimer); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  private translateError(message: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Credenciales incorrectas. Verifica tu correo y contraseña.',
      'Email not confirmed': 'Correo no confirmado. Revisa tu bandeja de entrada.',
      'User already registered': 'Este correo ya está registrado. Intenta iniciar sesión.',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
      'Unable to validate email address: invalid format': 'Formato de correo inválido.',
      'signup is disabled': 'El registro está deshabilitado temporalmente.',
      'over_email_send_rate_limit': 'Demasiados correos enviados. Espera unos minutos antes de reintentar.',
    };
    return errorMap[message] ?? message;
  }

  ngOnDestroy(): void {
    clearInterval(this.blockTimer);
    clearInterval(this.cooldownTimer);
  }
}
