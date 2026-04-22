import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademyService } from '../../core/services/academy.service';

@Component({
  selector: 'app-academy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto p-4 lg:p-8 space-y-12">
      <header class="text-center">
        <h1 class="text-5xl font-bold text-white mb-4">The Money Academy</h1>
        <p class="text-slate-400 text-lg">Financial literacy is the ultimate tool for freedom.</p>
      </header>

      <section class="space-y-6">
        <h2 class="text-2xl font-bold text-emerald-500 flex items-center gap-2">
          <span>📚</span> Financial Glossary
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (concept of concepts(); track concept.id) {
            <div class="zen-card group">
              <h3 class="font-bold text-lg text-emerald-400">{{ concept.term }}</h3>
              <p class="text-slate-400 mt-2 text-sm leading-relaxed">{{ concept.definition }}</p>
              <button class="mt-4 text-xs font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Mark as Learned ✓</button>
            </div>
          } @empty {
            <div class="col-span-2 zen-card text-center p-12">
              <p class="text-slate-500 italic">No concepts found in your current level...</p>
            </div>
          }
        </div>
      </section>

      <section class="zen-card bg-emerald-900/10">
        <h2 class="text-2xl font-bold mb-4">The 50/30/20 Rule</h2>
        <div class="space-y-4 text-slate-300">
          <p><strong class="text-white">50% Needs:</strong> Rent, groceries, utilities. Survival first.</p>
          <p><strong class="text-white">30% Wants:</strong> Leisure, dining out, hobbies. This is where the "Rat Race Trap" usually hides.</p>
          <p><strong class="text-white">20% Savings/Debt:</strong> Your future self. Investing in freedom.</p>
        </div>
      </section>
    </div>
  `,
})
export class AcademyComponent implements OnInit {
  concepts = signal<any[]>([]);

  constructor(private academy: AcademyService) {}

  async ngOnInit() {
    // Mock data if database is empty for demo
    const { data } = await this.academy.getGlossary();
    if (data && data.length > 0) {
      this.concepts.set(data);
    } else {
      this.concepts.set([
        { id: '1', term: 'Compound Interest', definition: 'The interest on a loan or deposit calculated based on both the initial principal and the accumulated interest from previous periods.' },
        { id: '2', term: 'Index Fund', definition: 'A type of mutual fund or exchange-traded fund with a portfolio constructed to match or track the components of a financial market index.' },
        { id: '3', term: 'Latte Factor', definition: 'The idea that small, recurring expenses (like a daily coffee) can add up to large sums over time if invested instead.' },
        { id: '4', term: 'Rat Race', definition: 'A way of life in which people are caught up in a fierce struggle for wealth or power.' }
      ]);
    }
  }
}
