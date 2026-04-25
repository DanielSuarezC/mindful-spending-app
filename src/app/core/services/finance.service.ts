import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export type TransactionCategory = 'Necesidad' | 'Ocio' | 'Inversión' | 'Trampa';
export type TransactionType = 'ingreso' | 'gasto';

export interface Transaction {
  id?: string;
  user_id?: string;
  amount: number;
  description: string;
  category: TransactionCategory | null;
  type: TransactionType;
  date: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  transactions = signal<Transaction[]>([]);

  income = computed(() =>
    this.transactions().filter(t => t.type === 'ingreso').reduce((s, t) => s + Number(t.amount), 0)
  );
  expenses = computed(() =>
    this.transactions().filter(t => t.type === 'gasto').reduce((s, t) => s + Number(t.amount), 0)
  );
  savings = computed(() => this.income() - this.expenses());

  needsTotal = computed(() =>
    this.transactions().filter(t => t.type === 'gasto' && t.category === 'Necesidad')
      .reduce((s, t) => s + Number(t.amount), 0)
  );
  wantsTotal = computed(() =>
    this.transactions().filter(t => t.type === 'gasto' && (t.category === 'Ocio' || t.category === 'Trampa'))
      .reduce((s, t) => s + Number(t.amount), 0)
  );
  investmentTotal = computed(() =>
    this.transactions().filter(t => t.type === 'gasto' && t.category === 'Inversión')
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  needsPct      = computed(() => this.income() > 0 ? (this.needsTotal() / this.income()) * 100 : 0);
  wantsPct      = computed(() => this.income() > 0 ? (this.wantsTotal() / this.income()) * 100 : 0);
  investmentPct = computed(() => this.income() > 0 ? (this.investmentTotal() / this.income()) * 100 : 0);
  savingsPct    = computed(() => this.income() > 0 ? Math.max((this.savings() / this.income()) * 100, 0) : 0);

  isWantsWarning = computed(() => this.wantsPct() > 30);
  isNeedsWarning = computed(() => this.needsPct() > 50);
  isSavingsLow   = computed(() => this.income() > 0 && this.savingsPct() < 20);
  recentTransactions = computed(() => this.transactions().slice(0, 5));

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  async loadTransactions() {
    const user = this.auth.currentUser();
    if (!user) return { data: null, error: null };
    const { data, error } = await this.supabase.client
      .from('transactions').select('*')
      .eq('user_id', user.id).order('date', { ascending: false });
    if (data) this.transactions.set(data as Transaction[]);
    return { data, error };
  }

  async addTransaction(t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) {
    const user = this.auth.currentUser();
    if (!user) return { data: null, error: new Error('No autenticado') };
    const { data, error } = await this.supabase.client
      .from('transactions').insert([{ ...t, user_id: user.id }]).select().single();
    if (data) this.transactions.update(prev => [data as Transaction, ...prev]);
    return { data, error };
  }

  async deleteTransaction(id: string) {
    const { error } = await this.supabase.client.from('transactions').delete().eq('id', id);
    if (!error) this.transactions.update(prev => prev.filter(t => t.id !== id));
    return { error };
  }
}
