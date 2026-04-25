import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AcademyService } from '../../core/services/academy.service';

interface Concept { id: string; term: string; definition: string; category: string; }

@Component({
  selector: 'app-academy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto p-4 lg:p-8 space-y-10">

      <!-- Cabecera -->
      <header class="text-center space-y-2">
        <h1 class="text-3xl sm:text-4xl font-bold text-white">📚 Academia Financiera</h1>
        <p class="text-slate-400">La educación financiera es la herramienta definitiva para la libertad.</p>
      </header>

      <!-- Consejo del día -->
      @if (academy.dailyTip(); as tip) {
        <div class="zen-card bg-emerald-900/10 border-emerald-800/30">
          <p class="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">💡 Consejo del día</p>
          <h2 class="text-xl font-bold mb-2">{{ tip.title }}</h2>
          <p class="text-slate-300 text-sm leading-relaxed">{{ tip.content }}</p>
        </div>
      }

      <!-- Glosario -->
      <section class="space-y-4">
        <h2 class="text-xl font-bold text-emerald-400 flex items-center gap-2">
          📖 Glosario financiero
        </h2>

        <!-- Filtro por categoría -->
        <div class="flex flex-wrap gap-2">
          @for (cat of categoryFilters; track cat) {
            <button (click)="activeCategory.set(cat)"
              class="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
              [class.bg-emerald-700]="activeCategory() === cat"
              [class.border-emerald-600]="activeCategory() === cat"
              [class.text-white]="activeCategory() === cat"
              [class.bg-transparent]="activeCategory() !== cat"
              [class.border-slate-600]="activeCategory() !== cat"
              [class.text-slate-400]="activeCategory() !== cat">
              {{ cat }}
            </button>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (concept of filteredConcepts(); track concept.id) {
            <div class="zen-card group hover:border-emerald-700/60">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-bold text-emerald-400">{{ concept.term }}</h3>
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 shrink-0">
                  {{ concept.category }}
                </span>
              </div>
              <p class="text-slate-400 text-sm leading-relaxed">{{ concept.definition }}</p>
            </div>
          } @empty {
            <div class="col-span-2 zen-card text-center py-10">
              <p class="text-slate-500 italic">No hay conceptos en esta categoría.</p>
            </div>
          }
        </div>
      </section>

      <!-- Regla 50/30/20 explicada -->
      <section class="space-y-4">
        <h2 class="text-xl font-bold flex items-center gap-2">⚖️ La Regla 50/30/20</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="zen-card border-blue-800/40 bg-blue-900/10 text-center">
            <p class="text-3xl font-black text-blue-400 mb-2">50%</p>
            <h3 class="font-bold mb-2">Necesidades</h3>
            <p class="text-slate-400 text-sm">Arriendo, comida, servicios públicos, transporte. Lo esencial para vivir.</p>
          </div>
          <div class="zen-card border-purple-800/40 bg-purple-900/10 text-center">
            <p class="text-3xl font-black text-purple-400 mb-2">30%</p>
            <h3 class="font-bold mb-2">Deseos</h3>
            <p class="text-slate-400 text-sm">Entretenimiento, salidas, suscripciones. Aquí se esconde la trampa del consumo.</p>
          </div>
          <div class="zen-card border-emerald-800/40 bg-emerald-900/10 text-center">
            <p class="text-3xl font-black text-emerald-400 mb-2">20%</p>
            <h3 class="font-bold mb-2">Ahorro e Inversión</h3>
            <p class="text-slate-400 text-sm">Tu yo futuro. Fondo de emergencia, inversiones, libertad financiera.</p>
          </div>
        </div>
        <div class="zen-card bg-slate-800/30 text-sm text-slate-300 leading-relaxed">
          <p>
            La regla 50/30/20 fue popularizada por la senadora Elizabeth Warren en su libro
            <em>"All Your Worth"</em>. Es una guía simple pero poderosa: si destinas más del
            30% a deseos, estás en la <strong class="text-red-400">"trampa de la rata"</strong>
            — trabajando para gastar en lugar de gastar para construir riqueza.
          </p>
          <a routerLink="/presupuesto" class="mt-3 inline-block text-emerald-400 hover:underline">
            Ver mi presupuesto →
          </a>
        </div>
      </section>

      <!-- Hábitos clave -->
      <section class="space-y-4">
        <h2 class="text-xl font-bold flex items-center gap-2">🏆 Hábitos de personas financieramente libres</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (habit of habits; track habit.title) {
            <div class="flex gap-3 zen-card py-4">
              <span class="text-2xl shrink-0">{{ habit.icon }}</span>
              <div>
                <p class="font-semibold text-sm">{{ habit.title }}</p>
                <p class="text-slate-400 text-xs mt-1">{{ habit.desc }}</p>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class AcademyComponent implements OnInit {
  concepts     = signal<Concept[]>([]);
  activeCategory = signal<string>('Todos');

  categoryFilters = ['Todos', 'Inversión', 'Ahorro', 'Deuda', 'Mentalidad'];

  filteredConcepts = () => {
    const cat = this.activeCategory();
    const all = this.concepts();
    return cat === 'Todos' ? all : all.filter(c => c.category === cat);
  };

  habits = [
    { icon: '📊', title: 'Registran cada gasto',      desc: 'Lo que no se mide no se puede mejorar.' },
    { icon: '⚡', title: 'Pagan primero a sí mismos', desc: 'Ahorran antes de gastar, no al revés.' },
    { icon: '📈', title: 'Invierten constantemente',   desc: 'Hacen que su dinero trabaje para ellos.' },
    { icon: '📚', title: 'Se educan continuamente',    desc: 'Leen y aprenden sobre finanzas personales.' },
    { icon: '🎯', title: 'Tienen metas claras',        desc: 'Saben exactamente cuánto quieren y para qué.' },
    { icon: '🚫', title: 'Evitan la deuda de consumo', desc: 'No usan tarjeta de crédito para deseos.' },
  ];

  constructor(public academy: AcademyService) {}

  async ngOnInit() {
    this.academy.fetchDailyTip();
    const { data } = await this.academy.getGlossary();
    if (data && data.length > 0) {
      this.concepts.set(data as Concept[]);
    } else {
      this.concepts.set([
        { id: '1', term: 'Interés compuesto',    category: 'Inversión', definition: 'El interés que se calcula tanto sobre el capital inicial como sobre los intereses acumulados. Einstein lo llamó "la octava maravilla del mundo".' },
        { id: '2', term: 'Fondo de emergencia',  category: 'Ahorro',    definition: 'Reserva de dinero equivalente a 3–6 meses de gastos. Es tu primera línea de defensa ante imprevistos.' },
        { id: '3', term: 'Fondo indexado',        category: 'Inversión', definition: 'Instrumento que replica un índice bursátil (como el S&P 500). Bajo costo, diversificado y con rendimientos históricamente superiores a fondos activos.' },
        { id: '4', term: 'El factor latte',       category: 'Mentalidad', definition: 'Pequeños gastos cotidianos (como un café diario) que al invertirse en cambio generarían grandes sumas a lo largo del tiempo.' },
        { id: '5', term: 'Trampa de la rata',     category: 'Mentalidad', definition: 'Ciclo de trabajar para ganar dinero, gastar ese dinero y volver a trabajar, sin acumular riqueza real.' },
        { id: '6', term: 'Libertad financiera',   category: 'Mentalidad', definition: 'Estado en el que los ingresos pasivos cubren todos tus gastos. Ya no necesitas trabajar por obligación.' },
        { id: '7', term: 'Deuda buena',           category: 'Deuda',     definition: 'Deuda que genera activos o aumenta tus ingresos futuros, como un crédito educativo o una hipoteca de inversión.' },
        { id: '8', term: 'Deuda mala',            category: 'Deuda',     definition: 'Deuda para financiar gastos de consumo. Tarjetas de crédito con saldo pendiente son el ejemplo más común.' },
        { id: '9', term: 'Regla del 4%',          category: 'Inversión', definition: 'Puedes retirar el 4% de tu portafolio cada año sin agotarlo. Determina cuánto necesitas para jubilarte.' },
        { id: '10',term: 'Ingresos pasivos',      category: 'Inversión', definition: 'Dinero que recibes sin trabajar activamente: dividendos, alquileres, regalías, intereses.' },
      ]);
    }
  }
}
