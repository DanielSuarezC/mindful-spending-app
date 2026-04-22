-- Supabase Schema for Mindful Spending App

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  monthly_income_goal NUMERIC DEFAULT 0,
  financial_literacy_level TEXT CHECK (financial_literacy_level IN ('Beginner', 'Intermediate', 'Expert')) DEFAULT 'Beginner',
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_budget_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transactions Table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Essential', 'Leisure', 'Investment', 'Rat Race Trap')),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Educational Tips Table
CREATE TABLE educational_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  display_date DATE UNIQUE, -- For daily rotation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Financial Concepts (Glossary)
CREATE TABLE financial_concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Progress (Learned Concepts)
CREATE TABLE user_lessons (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES financial_concepts(id) ON DELETE CASCADE,
  learned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, concept_id)
);

-- RLS (Row Level Security)

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lessons ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Transactions Policies
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Educational Tips (Read only for everyone authenticated)
CREATE POLICY "Anyone can view educational tips" ON educational_tips FOR SELECT USING (TRUE);

-- Financial Concepts (Read only for everyone authenticated)
CREATE POLICY "Anyone can view concepts" ON financial_concepts FOR SELECT USING (TRUE);

-- User Lessons Policies
CREATE POLICY "Users can view their own lessons" ON user_lessons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can record their own lessons" ON user_lessons FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
