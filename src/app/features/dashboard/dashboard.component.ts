import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../core/services/finance.service';
import { AcademyService } from '../../core/services/academy.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold text-white tracking-tight">Financial <span class="text-emerald-700">Equilibrium</span></h1>
          <p class="text-slate-400 mt-2">The path to freedom starts with mindfulness.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="zen-card py-2 px-4 flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xl">1</div>
             <div>
               <p class="text-xs text-slate-400 uppercase tracking-widest">Mindfulness Level</p>
               <p class="font-bold">Novice Seeker</p>
             </div>
          </div>
        </div>
      </header>

      <!-- Alert for Wants > 30% -->
      @if (finance.isWantsWarning()) {
        <div class="bg-red-900/30 border border-red-800/50 p-6 rounded-2xl flex items-start gap-4 animate-pulse">
          <span class="text-3xl text-red-500">⚠️</span>
          <div>
            <h3 class="text-xl font-bold text-red-200">Alert: The "Wants" Trap</h3>
            <p class="text-red-300 mt-1">Your non-essential spending is at {{ finance.wantsPercentage() | number:'1.0-1' }}%. The 50/30/20 rule suggests keeping it below 30% to escape the rat race.</p>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Income Summary -->
        <div class="zen-card">
          <p class="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Monthly Influx</p>
          <p class="text-3xl font-bold text-emerald-500">{{ finance.income() | currency }}</p>
        </div>
        <!-- Expenses Summary -->
        <div class="zen-card">
           <p class="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Current Outflow</p>
           <p class="text-3xl font-bold text-slate-100">{{ finance.expenses() | currency }}</p>
        </div>
        <!-- Savings Summary -->
        <div class="zen-card bg-emerald-900/20 border-emerald-800/30">
           <p class="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Mindful Margin (Savings)</p>
           <p class="text-3xl font-bold text-emerald-400">{{ (finance.income() - finance.expenses()) | currency }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Daily Insight -->
        <div class="zen-card relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
            <svg class="w-32 h-32 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <p class="text-emerald-700 font-bold uppercase tracking-widest text-xs mb-4">The Money Academy • Daily Insight</p>
          @if (academy.dailyTip(); as tip) {
            <h2 class="text-2xl font-bold mb-4">{{ tip.title }}</h2>
            <p class="text-slate-300 leading-relaxed">{{ tip.content }}</p>
          } @else {
            <p class="text-slate-400 animate-pulse italic">Reflecting on today's lesson...</p>
          }
          <button class="mt-8 text-emerald-500 font-medium hover:underline">Explore Academy &rarr;</button>
        </div>

        <!-- Progress Tracking -->
        <div class="zen-card flex flex-col justify-center items-center gap-4">
           <h3 class="text-xl font-bold">50/30/20 Distribution</h3>
           <!-- Circular Chart placeholder -->
           <div class="relative w-48 h-48 rounded-full border-8 border-slate-700 flex items-center justify-center">
              <div class="text-center">
                <p class="text-sm text-slate-400">Survival</p>
                <p class="text-2xl font-bold">50%</p>
              </div>
           </div>
           <p class="text-xs text-slate-500 italic mt-4 text-center">Charts will dynamically update once real data is synchronized.</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  constructor(
    public finance: FinanceService,
    public academy: AcademyService
  ) {}

  ngOnInit() {
    this.finance.loadTransactions();
    this.academy.fetchDailyTip();
  }
}
