import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, Transaction, TransactionCategory } from '../../core/services/finance.service';

type FilterType = 'todos' | 'ingreso' | 'gasto';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">

      <h1 class="text-2xl font-bold">💳 Transacciones</h1>

      <!-- Formulario nueva transacción -->
      <div class="zen-card">
        <h2 class="text-base font-semibold mb-4">Nueva transacción</h2>

        <form (submit)="submit($event)" class="space-y-4">
          <!-- Tipo: Ingreso / Gasto -->
          <div class="flex gap-2">
            <button type="button" (click)="form.type = 'ingreso'"
              class="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
              [class.bg-emerald-700]="form.type === 'ingreso'"
              [class.border-emerald-600]="form.type === 'ingreso'"
              [class.text-white]="form.type === 'ingreso'"
              [class.bg-transparent]="form.type !== 'ingreso'"
              [class.border-slate-600]="form.type !== 'ingreso'"
              [class.text-slate-400]="form.type !== 'ingreso'">
              ↑ Ingreso
            </button>
            <button type="button" (click)="form.type = 'gasto'"
              class="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
              [class.bg-red-800]="form.type === 'gasto'"
              [class.border-red-700]="form.type === 'gasto'"
              [class.text-white]="form.type === 'gasto'"
              [class.bg-transparent]="form.type !== 'gasto'"
              [class.border-slate-600]="form.type !== 'gasto'"
              [class.text-slate-400]="form.type !== 'gasto'">
              ↓ Gasto
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Monto</label>
              <input type="number" [(ngModel)]="form.amount" name="amount"
                min="0.01" step="0.01" required placeholder="0.00"
                class="input-field w-full">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
              <input type="date" [(ngModel)]="form.date" name="date" required
                class="input-field w-full">
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
            <input type="text" [(ngModel)]="form.description" name="description"
              required placeholder="Ej. Supermercado, salario mensual..."
              class="input-field w-full">
          </div>

          @if (form.type === 'gasto') {
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
              <select [(ngModel)]="form.category" name="category" required class="input-field w-full">
                <option value="" disabled>Selecciona una categoría</option>
                @for (cat of categories; track cat.value) {
                  <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                }
              </select>
            </div>
          }

          @if (formError()) {
            <p class="text-red-400 text-sm">{{ formError() }}</p>
          }
          @if (formSuccess()) {
            <p class="text-emerald-400 text-sm">✓ Transacción registrada correctamente.</p>
          }

          <button type="submit" [disabled]="saving()" class="btn-primary w-full py-2.5">
            {{ saving() ? 'Guardando...' : 'Registrar transacción' }}
          </button>
        </form>
      </div>

      <!-- Resumen rápido -->
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="zen-card py-3 px-2">
          <p class="text-xs text-slate-400 mb-1">Ingresos</p>
          <p class="text-lg font-bold text-emerald-400">{{ finance.income() | currency:'USD':'symbol':'1.0-0' }}</p>
        </div>
        <div class="zen-card py-3 px-2">
          <p class="text-xs text-slate-400 mb-1">Gastos</p>
          <p class="text-lg font-bold text-slate-200">{{ finance.expenses() | currency:'USD':'symbol':'1.0-0' }}</p>
        </div>
        <div class="zen-card py-3 px-2">
          <p class="text-xs text-slate-400 mb-1">Balance</p>
          <p class="text-lg font-bold"
            [class.text-emerald-400]="finance.savings() >= 0"
            [class.text-red-400]="finance.savings() < 0">
            {{ finance.savings() | currency:'USD':'symbol':'1.0-0' }}
          </p>
        </div>
      </div>

      <!-- Filtros y lista -->
      <div class="zen-card">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 class="text-base font-semibold">Historial</h2>
          <div class="flex gap-1 bg-slate-900 p-1 rounded-lg self-start">
            @for (f of filters; track f.value) {
              <button (click)="activeFilter.set(f.value)"
                class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                [class.bg-slate-700]="activeFilter() === f.value"
                [class.text-white]="activeFilter() === f.value"
                [class.text-slate-400]="activeFilter() !== f.value">
                {{ f.label }}
              </button>
            }
          </div>
        </div>

        @if (filteredTransactions().length === 0) {
          <div class="text-center py-12">
            <p class="text-4xl mb-3">📭</p>
            <p class="text-slate-400 text-sm">No hay transacciones para mostrar.</p>
          </div>
        } @else {
          <ul class="divide-y divide-slate-700/50">
            @for (t of filteredTransactions(); track t.id) {
              <li class="flex items-center gap-3 py-3">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  [class.bg-emerald-900]="t.type === 'ingreso'"
                  [class.text-emerald-400]="t.type === 'ingreso'"
                  [class.bg-slate-700]="t.type === 'gasto'"
                  [class.text-slate-300]="t.type === 'gasto'">
                  {{ t.type === 'ingreso' ? '↑' : '↓' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white truncate">{{ t.description }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs text-slate-500">{{ t.date | date:'dd/MM/yyyy' }}</span>
                    @if (t.category) {
                      <span class="text-xs px-1.5 py-0.5 rounded" [class]="categoryBadge(t.category)">
                        {{ t.category }}
                      </span>
                    }
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <p class="text-sm font-semibold"
                    [class.text-emerald-400]="t.type === 'ingreso'"
                    [class.text-slate-300]="t.type === 'gasto'">
                    {{ t.type === 'ingreso' ? '+' : '-' }}{{ t.amount | currency:'USD':'symbol':'1.0-2' }}
                  </p>
                  <button (click)="delete(t.id!)"
                    class="text-slate-600 hover:text-red-400 transition-colors p-1 rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class TransactionsComponent implements OnInit {
  categories: { value: TransactionCategory; label: string; icon: string }[] = [
    { value: 'Necesidad', label: 'Necesidad',      icon: '🏠' },
    { value: 'Ocio',      label: 'Ocio / Deseos',  icon: '🎮' },
    { value: 'Inversión', label: 'Inversión',       icon: '📈' },
    { value: 'Trampa',    label: 'Trampa de gastos',icon: '⚠️' },
  ];

  filters = [
    { value: 'todos'   as FilterType, label: 'Todos'    },
    { value: 'ingreso' as FilterType, label: 'Ingresos' },
    { value: 'gasto'   as FilterType, label: 'Gastos'   },
  ];

  activeFilter = signal<FilterType>('todos');
  saving       = signal(false);
  formError    = signal<string | null>(null);
  formSuccess  = signal(false);

  form = {
    type:        'gasto' as 'ingreso' | 'gasto',
    amount:      null as number | null,
    description: '',
    category:    '' as TransactionCategory | '',
    date:        new Date().toISOString().split('T')[0],
  };

  filteredTransactions = computed(() => {
    const f = this.activeFilter();
    const all = this.finance.transactions();
    return f === 'todos' ? all : all.filter(t => t.type === f);
  });

  constructor(public finance: FinanceService) {}

  ngOnInit() { this.finance.loadTransactions(); }

  async submit(e: Event) {
    e.preventDefault();
    this.formError.set(null);
    this.formSuccess.set(false);

    if (!this.form.amount || this.form.amount <= 0) {
      this.formError.set('El monto debe ser mayor a 0.');
      return;
    }
    if (this.form.type === 'gasto' && !this.form.category) {
      this.formError.set('Selecciona una categoría para el gasto.');
      return;
    }

    this.saving.set(true);

    const payload: Omit<Transaction, 'id' | 'user_id' | 'created_at'> = {
      type:        this.form.type,
      amount:      this.form.amount!,
      description: this.form.description,
      category:    this.form.type === 'gasto' ? (this.form.category as TransactionCategory) : null,
      date:        this.form.date,
    };

    const { error } = await this.finance.addTransaction(payload);
    this.saving.set(false);

    if (error) {
      this.formError.set('Error al guardar. Intenta de nuevo.');
    } else {
      this.formSuccess.set(true);
      this.form.amount = null;
      this.form.description = '';
      this.form.category = '';
      this.form.date = new Date().toISOString().split('T')[0];
      setTimeout(() => this.formSuccess.set(false), 3000);
    }
  }

  async delete(id: string) {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await this.finance.deleteTransaction(id);
  }

  categoryBadge(cat: string): string {
    const map: Record<string, string> = {
      'Necesidad': 'bg-blue-900/50 text-blue-300',
      'Ocio':      'bg-purple-900/50 text-purple-300',
      'Inversión': 'bg-emerald-900/50 text-emerald-300',
      'Trampa':    'bg-red-900/50 text-red-300',
    };
    return map[cat] ?? 'bg-slate-700 text-slate-300';
  }
}
