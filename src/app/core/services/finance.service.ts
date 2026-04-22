import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Transaction {
  id?: string;
  user_id?: string;
  amount: number;
  description: string;
  category: 'Essential' | 'Leisure' | 'Investment' | 'Rat Race Trap';
  type: 'income' | 'expense';
  date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  transactions = signal<Transaction[]>([]);
  
  income = computed(() => 
    this.transactions().filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0)
  );

  expenses = computed(() => 
    this.transactions().filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0)
  );

  wantsExpenses = computed(() => 
    this.transactions().filter(t => t.type === 'expense' && (t.category === 'Leisure' || t.category === 'Rat Race Trap'))
      .reduce((acc, t) => acc + Number(t.amount), 0)
  );

  wantsPercentage = computed(() => {
    const totalIncome = this.income();
    if (totalIncome === 0) return 0;
    return (this.wantsExpenses() / totalIncome) * 100;
  });

  isWantsWarning = computed(() => this.wantsPercentage() > 30);

  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  async loadTransactions() {
    const user = this.auth.currentUser();
    if (!user) return;

    const { data, error } = await this.supabase.client
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (data) {
      this.transactions.set(data as Transaction[]);
    }
    return { data, error };
  }

  async addTransaction(transaction: Transaction) {
    const user = this.auth.currentUser();
    if (!user) return;

    const { data, error } = await this.supabase.client
      .from('transactions')
      .insert([{ ...transaction, user_id: user.id }])
      .select();

    if (data) {
      this.transactions.update(prev => [data[0] as Transaction, ...prev]);
    }
    return { data, error };
  }
}
