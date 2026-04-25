import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';

interface LoginAttemptData {
  count: number;
  blockedUntil?: number;
}

const RATE_LIMIT_KEY = 'mindful_login_attempts';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 10 * 60 * 1000;

// Errores que NO son intentos de ataque — no penalizan el rate limit
const NON_PENALTY_ERRORS = new Set([
  'Email not confirmed',
  'over_email_send_rate_limit',
]);

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _currentUser = signal<User | null>(null);
  private _initialized = signal(false);

  currentUser = computed(() => this._currentUser());
  isAuthenticated = computed(() => !!this._currentUser());
  initialized = computed(() => this._initialized());

  constructor(private supabase: SupabaseService, private router: Router) {
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this._currentUser.set(session?.user ?? null);
      this._initialized.set(true);
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      this._currentUser.set(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        this.router.navigate(['/dashboard']);
      } else if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  waitForInit(): Promise<void> {
    return new Promise(resolve => {
      if (this._initialized()) { resolve(); return; }
      const interval = setInterval(() => {
        if (this._initialized()) { clearInterval(interval); resolve(); }
      }, 20);
    });
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────

  getRateLimitStatus(): { blocked: boolean; remainingMs: number; attemptsLeft: number } {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const data: LoginAttemptData = raw ? JSON.parse(raw) : { count: 0 };

    if (data.blockedUntil) {
      const remaining = data.blockedUntil - Date.now();
      if (remaining > 0) return { blocked: true, remainingMs: remaining, attemptsLeft: 0 };
      localStorage.removeItem(RATE_LIMIT_KEY);
    }

    return { blocked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS - (data.count || 0) };
  }

  private recordFailedAttempt(): void {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const data: LoginAttemptData = raw ? JSON.parse(raw) : { count: 0 };
    data.count = (data.count || 0) + 1;
    if (data.count >= MAX_ATTEMPTS) {
      data.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    }
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  }

  private resetAttempts(): void {
    localStorage.removeItem(RATE_LIMIT_KEY);
  }

  // ── Auth actions ───────────────────────────────────────────────────────────

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin
      }
    });

    if (!error && data.user) {
      const signInResult = await this.supabase.auth.signInWithPassword({ email, password });
      if (!signInResult.error) this.resetAttempts();
      return { data: signInResult.data, error: signInResult.error, userCreated: true };
    }

    return { data, error, userCreated: false };
  }

  async signIn(email: string, password: string) {
    const status = this.getRateLimitStatus();
    if (status.blocked) {
      return { data: null, error: null, blocked: true, remainingMs: status.remainingMs, needsEmailConfirmation: false };
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    const needsEmailConfirmation = error?.message === 'Email not confirmed';

    if (error && !NON_PENALTY_ERRORS.has(error.message)) {
      // Solo cuenta como intento fallido si son credenciales incorrectas
      this.recordFailedAttempt();
    } else if (!error) {
      this.resetAttempts();
    }

    return { data, error, blocked: false, remainingMs: 0, needsEmailConfirmation };
  }

  async resendConfirmationEmail(email: string) {
    return await this.supabase.auth.resend({ type: 'signup', email });
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }
}
