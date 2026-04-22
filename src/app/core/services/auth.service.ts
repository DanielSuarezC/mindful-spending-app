import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _currentUser = signal<User | null>(null);
  
  currentUser = computed(() => this._currentUser());
  isAuthenticated = computed(() => !!this._currentUser());

  constructor(private supabase: SupabaseService, private router: Router) {
    this.supabase.auth.onAuthStateChange((event, session) => {
      this._currentUser.set(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        this.router.navigate(['/dashboard']);
      } else if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }
}
