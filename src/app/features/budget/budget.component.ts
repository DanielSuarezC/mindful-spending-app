import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FinanceService } from '../../core/services/finance.service';

interface BudgetCategory {
  label:      string;
  icon:       string;
  goal:       number;
  actual:     () => number;
  actualPct:  () => number;
  recommended:() => number;
  color:      string;
  barColor:   string;
  description:string;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
    <div class="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">

      <h1 class="text-2xl font-bold">📊 Mi Presupuesto</h1>

      <!-- Sin ingresos registrados -->
      @if (finance.income() === 0) {
        <div class="zen-card text-center py-14">
          <p class="text-5xl mb-4">💰</p>
          <h2 class="text-xl font-bold mb-2">Registra tus ingresos primero</h2>
          <p class="text-slate-400 text-sm mb-6">
            Para calcular tu presupuesto 50/30/20 necesitamos saber cuánto ganas.
          </p>
          <a routerLink="/transacciones" class="btn-primary inline-block">
            Agregar ingreso
          </a>
        </div>
      } @else {

        <!-- Resumen general -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="zen-card text-center">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-2">💰 Ingresos</p>
            <p class="text-2xl font-bold text-emerald-400">{{ finance.income() | currency:'USD':'symbol':'1.0-0' }}</p>
          </div>
          <div class="zen-card text-center">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-2">💸 Gastos</p>
            <p class="text-2xl font-bold text-slate-200">{{ finance.expenses() | currency:'USD':'symbol':'1.0-0' }}</p>
          </div>
          <div class="zen-card text-center"
            [class.border-emerald-700]="finance.savings() >= 0"
            [class.border-red-700]="finance.savings() < 0">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-2">🏦 Ahorro</p>
            <p class="text-2xl font-bold"
              [class.text-emerald-400]="finance.savings() >= 0"
              [class.text-red-400]="finance.savings() < 0">
              {{ finance.savings() | currency:'USD':'symbol':'1.0-0' }}
            </p>
          </div>
        </div>

        <!-- Estado general -->
        <div class="zen-card" [class]="overallStatusClass()">
          <div class="flex items-start gap-3">
            <span class="text-2xl shrink-0">{{ overallStatusIcon() }}</span>
            <div>
              <h3 class="font-semibold">{{ overallStatusTitle() }}</h3>
              <p class="text-sm mt-1 opacity-80">{{ overallStatusMessage() }}</p>
            </div>
          </div>
        </div>

        <!-- Categorías de la regla 50/30/20 -->
        <div class="space-y-4">
          @for (cat of categories; track cat.label) {
            <div class="zen-card space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ cat.icon }}</span>
                  <div>
                    <h3 class="font-semibold">{{ cat.label }}</h3>
                    <p class="text-xs text-slate-500">{{ cat.description }}</p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-sm font-bold" [style.color]="statusColor(cat)">
                    {{ cat.actualPct() | number:'1.0-1' }}%
                    <span class="text-slate-500 font-normal">/ {{ cat.goal }}% recomendado</span>
                  </span>
                </div>
              </div>

              <!-- Barra de progreso -->
              <div class="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                <!-- Meta recomendada (línea) -->
                <div class="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                  [style.left.%]="cat.goal">
                </div>
                <!-- Barra actual -->
                <div class="h-full rounded-full transition-all duration-700"
                  [style.width.%]="barWidth(cat)"
                  [style.background-color]="statusColor(cat)">
                </div>
              </div>

              <!-- Montos -->
              <div class="flex flex-col sm:flex-row justify-between text-xs text-slate-400 gap-1">
                <span>
                  Real: <strong class="text-slate-200">{{ cat.actual() | currency:'USD':'symbol':'1.0-0' }}</strong>
                </span>
                <span>
                  Recomendado: <strong class="text-slate-200">{{ cat.recommended() | currency:'USD':'symbol':'1.0-0' }}</strong>
                </span>
                <span [style.color]="statusColor(cat)">
                  {{ diffLabel(cat) }}
                </span>
              </div>

              <!-- Alerta individual -->
              @if (cat.actualPct() > cat.goal * 1.1) {
                <p class="text-xs px-3 py-2 rounded-lg bg-red-900/30 text-red-300 border border-red-800/40">
                  ⚠ Estás gastando un
                  <strong>{{ (cat.actualPct() - cat.goal) | number:'1.0-1' }}%</strong>
                  más de lo recomendado en esta categoría.
                </p>
              }
            </div>
          }
        </div>

        <!-- Regla explicada -->
        <div class="zen-card bg-slate-800/30">
          <h2 class="text-base font-bold mb-4">📖 ¿Qué es la regla 50/30/20?</h2>
          <div class="space-y-3 text-sm text-slate-300">
            <div class="flex gap-3">
              <span class="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center text-blue-300 font-bold shrink-0">50%</span>
              <div>
                <p class="font-semibold text-white">Necesidades</p>
                <p class="text-slate-400">Arriendo, comida, servicios, transporte. Lo indispensable para vivir.</p>
              </div>
            </div>
            <div class="flex gap-3">
              <span class="w-10 h-10 rounded-xl bg-purple-900/50 flex items-center justify-center text-purple-300 font-bold shrink-0">30%</span>
              <div>
                <p class="font-semibold text-white">Deseos y Ocio</p>
                <p class="text-slate-400">Entretenimiento, salidas, hobbies. Aquí se esconde la "trampa del consumo".</p>
              </div>
            </div>
            <div class="flex gap-3">
              <span class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center text-emerald-300 font-bold shrink-0">20%</span>
              <div>
                <p class="font-semibold text-white">Ahorro e Inversión</p>
                <p class="text-slate-400">Tu futuro financiero. Fondo de emergencia, inversiones, retiro anticipado.</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class BudgetComponent implements OnInit {

  categories: BudgetCategory[] = [
    {
      label:       'Necesidades',
      icon:        '🏠',
      goal:        50,
      description: 'Arriendo, comida, servicios, transporte',
      color:       '#3b82f6',
      barColor:    '#3b82f6',
      actual:      () => this.finance.needsTotal(),
      actualPct:   () => this.finance.needsPct(),
      recommended: () => this.finance.income() * 0.50,
    },
    {
      label:       'Deseos y Ocio',
      icon:        '🎮',
      goal:        30,
      description: 'Entretenimiento, salidas, hobbies',
      color:       '#a855f7',
      barColor:    '#a855f7',
      actual:      () => this.finance.wantsTotal(),
      actualPct:   () => this.finance.wantsPct(),
      recommended: () => this.finance.income() * 0.30,
    },
    {
      label:       'Inversión',
      icon:        '📈',
      goal:        20,
      description: 'Ahorro, fondos, inversiones, retiro',
      color:       '#10b981',
      barColor:    '#10b981',
      actual:      () => this.finance.investmentTotal(),
      actualPct:   () => this.finance.investmentPct(),
      recommended: () => this.finance.income() * 0.20,
    },
  ];

  constructor(public finance: FinanceService) {}

  ngOnInit() { this.finance.loadTransactions(); }

  barWidth(cat: BudgetCategory): number {
    return Math.min(cat.actualPct(), 100);
  }

  statusColor(cat: BudgetCategory): string {
    const ratio = cat.actualPct() / cat.goal;
    if (cat.label === 'Inversión') {
      if (ratio >= 1) return '#10b981';
      if (ratio >= 0.5) return '#f59e0b';
      return '#ef4444';
    }
    if (ratio <= 1) return '#10b981';
    if (ratio <= 1.2) return '#f59e0b';
    return '#ef4444';
  }

  diffLabel(cat: BudgetCategory): string {
    const diff = cat.actual() - cat.recommended();
    const label = cat.label === 'Inversión'
      ? (diff >= 0 ? `+${Math.abs(diff).toFixed(0)} por encima` : `${Math.abs(diff).toFixed(0)} por debajo`)
      : (diff > 0  ? `+${Math.abs(diff).toFixed(0)} sobre el límite` : `${Math.abs(diff).toFixed(0)} disponibles`);
    return label;
  }

  overallStatusClass(): string {
    const bad = this.finance.isNeedsWarning() || this.finance.isWantsWarning();
    const low = this.finance.isSavingsLow();
    if (bad) return 'bg-red-900/20 border-red-700/40';
    if (low) return 'bg-yellow-900/20 border-yellow-700/40';
    return 'bg-emerald-900/20 border-emerald-700/40';
  }
  overallStatusIcon(): string {
    if (this.finance.isNeedsWarning() || this.finance.isWantsWarning()) return '🚨';
    if (this.finance.isSavingsLow()) return '⚠️';
    return '✅';
  }
  overallStatusTitle(): string {
    if (this.finance.isNeedsWarning() || this.finance.isWantsWarning()) return 'Presupuesto fuera de balance';
    if (this.finance.isSavingsLow()) return 'Ahorro por debajo de lo recomendado';
    return '¡Vas por buen camino!';
  }
  overallStatusMessage(): string {
    if (this.finance.isNeedsWarning()) return 'Tus necesidades superan el 50% recomendado. Revisa si hay gastos que puedas reducir.';
    if (this.finance.isWantsWarning()) return 'Tus gastos en ocio superan el 30%. Considera redirigir parte de ese dinero al ahorro.';
    if (this.finance.isSavingsLow()) return `Estás ahorrando el ${this.finance.savingsPct().toFixed(1)}%. La meta es llegar al 20%.`;
    return `Estás ahorrando el ${this.finance.savingsPct().toFixed(1)}% de tus ingresos. Sigue así.`;
  }
}
