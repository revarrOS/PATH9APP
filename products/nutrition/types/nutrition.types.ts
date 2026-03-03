export type EntryType = 'meal' | 'snack' | 'drink' | 'supplement';

export type AIInterpretation = {
  confidence: 'high' | 'moderate' | 'low';
  foodCategories: string[];
  preparationMethod: string;
  portionEstimate: 'small' | 'moderate' | 'large';
  supportAreas: string[];
  observableNotes: string;
};

export type NutritionEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  entry_type: EntryType;
  image_path: string | null;
  ai_interpretation: AIInterpretation | null;
  user_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NutritionPreferences = {
  user_id: string;
  condition_verified: boolean;
  condition_verified_at: string | null;
  verified_diagnosis: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportAreaFrequency = {
  supportAreaId: string;
  label: string;
  count: number;
  totalEntries: number;
  percentage: number;
};

export type NutritionTrends = {
  totalEntries: number;
  dateRange: {
    start: string;
    end: string;
  };
  supportAreas: SupportAreaFrequency[];
  entriesByType: {
    meal: number;
    snack: number;
    drink: number;
    supplement: number;
  };
};

export type CreateNutritionEntryInput = {
  entry_date: string;
  entry_type: EntryType;
  image_uri?: string;
  user_notes?: string;
};

export type UpdateNutritionEntryInput = {
  entry_date?: string;
  entry_type?: EntryType;
  user_notes?: string;
};
