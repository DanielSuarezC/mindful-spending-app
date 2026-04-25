import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FinanceService } from '../../core/services/finance.service';
import { AcademyService } from '../../core/services/academy.service';
import { AuthService } from '../../core/services/auth.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">

      <!-- Cabecera con saludo -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-white">
            {{ greeting() }}, <span class="text-emerald-400">{{ userName() }}</span> 👋
          </h1>
          <p class="text-slate-400 mt-1 text-sm">{{ today }}</p>
        </div>
        <a routerLink="/transacciones"
          class="btn-primary inline-flex items-center gap-2 self-start sm:self-auto">
          <span class="text-lg">+</span> Nueva transacción
        </a>
      </header>

      <!-- Alertas -->
      @if (finance.isNeedsWarning()) {
        <div class="bg-orange-900/30 border border-orange-700/50 p-4 rounded-xl flex items-start gap-3">
          <span class="text-xl shrink-0">⚠️</span>
          <p class="text-orange-200 text-sm">
            Tus <strong>necesidades</strong> representan el {{ finance.needsPct() | number:'1.0-1' }}% de tus ingresos.
            La regla 50/30/20 recomienda no superar el 50%.
          </p>
        </div>
      }
      @if (finance.isWantsWarning()) {
        <div class="bg-red-900/30 border border-red-700/50 p-4 rounded-xl flex items-start gap-3">
          <span class="text-xl shrink-0">🚨</span>
          <p class="text-red-200 text-sm">
            Tus <strong>deseos y ocio</strong> representan el {{ finance.wantsPct() | number:'1.0-1' }}% de tus ingresos.
            Intenta mantenerlos por debajo del 30%.
          </p>
        </div>
      }
      @if (finance.isSavingsLow()) {
        <div class="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-xl flex items-start gap-3">
          <span class="text-xl shrink-0">💡</span>
          <p class="text-yellow-200 text-sm">
            Tu tasa de ahorro es del {{ finance.savingsPct() | number:'1.0-1' }}%.
            Apunta a ahorrar al menos el 20% de tus ingresos.
          </p>
        </div>
      }

      <!-- Tarjetas de resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="zen-card">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">💰 Ingresos</p>
          <p class="text-2xl sm:text-3xl font-bold text-emerald-400">
            {{ finance.income() | currency:'USD':'symbol':'1.0-2' }}
          </p>
          <p class="text-slate-500 text-xs mt-1">este período</p>
        </div>
        <div class="zen-card">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">💸 Gastos</p>
          <p class="text-2xl sm:text-3xl font-bold text-slate-100">
            {{ finance.expenses() | currency:'USD':'symbol':'1.0-2' }}
          </p>
          <p class="text-slate-500 text-xs mt-1">este período</p>
        </div>
        <div class="zen-card" [class.border-emerald-700]="finance.savings() >= 0"
             [class.border-red-700]="finance.savings() < 0">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">🏦 Balance</p>
          <p class="text-2xl sm:text-3xl font-bold"
            [class.text-emerald-400]="finance.savings() >= 0"
            [class.text-red-400]="finance.savings() < 0">
            {{ finance.savings() | currency:'USD':'symbol':'1.0-2' }}
          </p>
          <p class="text-slate-500 text-xs mt-1">ahorro disponible</p>
        </div>
      </div>

      <!-- Gráfica + Últimas transacciones -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Distribución 50/30/20 -->
        <div class="zen-card">
          <h2 class="text-base font-bold mb-4">Distribución 50/30/20</h2>
          @if (finance.income() > 0) {
            <div class="flex flex-col sm:flex-row items-center gap-6">
              <div class="relative w-44 h-44 shrink-0">
                <canvas #distributionChart></canvas>
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p class="text-xs text-slate-400">ahorro</p>
                  <p class="text-xl font-bold text-emerald-400">{{ finance.savingsPct() | number:'1.0-0' }}%</p>
                </div>
              </div>
              <div class="space-y-3 w-full">
                @for (item of chartLegend; track item.label) {
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full inline-block" [style.background]="item.color"></span>
                        {{ item.label }}
                      </span>
                      <span class="font-medium">{{ item.pct() | number:'1.0-1' }}%
                        <span class="text-slate-500">/ {{ item.goal }}%</span>
                      </span>
                    </div>
                    <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                        [style.width.%]="min(item.pct(), 100)"
                        [style.background]="item.color">
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center py-10 text-center">
              <p class="text-4xl mb-3">📊</p>
              <p class="text-slate-400 text-sm">Registra tus ingresos y gastos<br>para ver tu distribución.</p>
              <a routerLink="/transacciones" class="mt-4 text-emerald-400 text-sm hover:underline">
                Agregar transacción →
              </a>
            </div>
          }
        </div>

        <!-- Últimas transacciones -->
        <div class="zen-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold">Últimas transacciones</h2>
            <a routerLink="/transacciones" class="text-emerald-400 text-xs hover:underline">Ver todas</a>
          </div>
          @if (finance.recentTransactions().length > 0) {
            <ul class="space-y-2">
              @for (t of finance.recentTransactions(); track t.id) {
                <li class="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                    [class.bg-emerald-900]="t.type === 'ingreso'"
                    [class.bg-slate-700]="t.type === 'gasto'">
                    {{ t.type === 'ingreso' ? '↑' : '↓' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ t.description }}</p>
                    <p class="text-xs text-slate-500">
                      {{ t.date | date:'dd MMM':'':'es' }}
                      @if (t.category) { · <span [class]="badgeClass(t.category)">{{ t.category }}</span> }
                    </p>
                  </div>
                  <p class="text-sm font-semibold shrink-0"
                    [class.text-emerald-400]="t.type === 'ingreso'"
                    [class.text-slate-300]="t.type === 'gasto'">
                    {{ t.type === 'ingreso' ? '+' : '-' }}{{ t.amount | currency:'USD':'symbol':'1.0-2' }}
                  </p>
                </li>
              }
            </ul>
          } @else {
            <div class="flex flex-col items-center justify-center py-10 text-center">
              <p class="text-4xl mb-3">💳</p>
              <p class="text-slate-400 text-sm">Aún no hay transacciones.</p>
              <a routerLink="/transacciones" class="mt-4 text-emerald-400 text-sm hover:underline">
                Registrar primera transacción →
              </a>
            </div>
          }
        </div>
      </div>

      <!-- Consejo del día -->
      @if (academy.dailyTip(); as tip) {
        <div class="zen-card bg-emerald-900/10 border-emerald-800/30">
          <p class="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-3">Academia · Consejo del día</p>
          <h3 class="text-lg font-bold mb-2">{{ tip.title }}</h3>
          <p class="text-slate-300 text-sm leading-relaxed">{{ tip.content }}</p>
          <a routerLink="/academia" class="mt-4 inline-block text-emerald-400 text-sm hover:underline">
            Ir a la Academia →
          </a>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('distributionChart') chartRef!: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  today = new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  chartLegend = [
    { label: 'Necesidades', color: '#3b82f6', goal: 50, pct: () => this.finance.needsPct() },
    { label: 'Deseos / Ocio', color: '#a855f7', goal: 30, pct: () => this.finance.wantsPct() },
    { label: 'Inversión',    color: '#10b981', goal: 20, pct: () => this.finance.investmentPct() },
  ];

  constructor(
    public finance: FinanceService,
    public academy: AcademyService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.finance.loadTransactions().then(() => this.updateChart());
    this.academy.fetchDailyTip();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  userName(): string {
    const meta = this.auth.currentUser()?.user_metadata;
    return (meta?.['full_name'] as string)?.split(' ')[0] ?? 'Usuario';
  }

  badgeClass(category: string): string {
    const map: Record<string, string> = {
      'Necesidad': 'text-blue-400',
      'Ocio':      'text-purple-400',
      'Inversión': 'text-emerald-400',
      'Trampa':    'text-red-400',
    };
    return map[category] ?? 'text-slate-400';
  }

  min(a: number, b: number) { return Math.min(a, b); }

  private initChart() {
    if (!this.chartRef) return;
    const ctx = this.chartRef.nativeElement.getContext('2d')!;
    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Necesidades', 'Deseos', 'Inversión', 'Ahorro'],
        datasets: [{
          data: [0, 0, 0, 100],
          backgroundColor: ['#3b82f6', '#a855f7', '#10b981', '#1e293b'],
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (c) => ` ${(c.parsed as number).toFixed(1)}%` }
          }
        }
      }
    });
    this.updateChart();
  }

  private updateChart() {
    if (!this.chartInstance) return;
    const n = this.finance.needsPct();
    const w = this.finance.wantsPct();
    const i = this.finance.investmentPct();
    const s = this.finance.savingsPct();
    this.chartInstance.data.datasets[0].data = [n, w, i, s];
    this.chartInstance.update('none');
  }

  ngOnDestroy() { this.chartInstance?.destroy(); }
}
