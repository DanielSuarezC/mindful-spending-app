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
    
    const { data, error } = await this.supabase.client
      .from('educational_tips')
      .select('*')
      .eq('display_date', today)
      .single();

    if (data) {
      this.dailyTip.set(data as Tip);
    } else {
      // Fallback or fetch any tip if none for today
      const { data: randomTip } = await this.supabase.client
        .from('educational_tips')
        .select('*')
        .limit(1)
        .single();
      
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
