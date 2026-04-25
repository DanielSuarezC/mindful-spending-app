import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademyService {
  dailyTip = signal<Tip | null>(null);

  constructor(private supabase: SupabaseService) {}

  async fetchDailyTip() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await this.supabase.client
      .from('educational_tips')
      .select('*')
      .eq('display_date', today)
      .maybeSingle();

    if (data) {
      this.dailyTip.set(data as Tip);
    } else {
      const { data: randomTip } = await this.supabase.client
        .from('educational_tips')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (randomTip) this.dailyTip.set(randomTip as Tip);
    }
  }

  async getGlossary() {
    return await this.supabase.client
      .from('financial_concepts')
      .select('*')
      .order('term');
  }
}
