export type RecipeInput = {
  title: string;
  sourceUrl?: string | null;
  notes?: string | null;
  ingredients: string[];
  steps: string[];
};

export type Recipe = {
  id: number;
  title: string;
  sourceUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

export type RecipeIngredient = {
  id: number;
  recipeId: number;
  position: number;
  originalText: string;
  quantity: number | null;
  quantityText: string | null;
  unit: string | null;
  item: string;
  normalizedItem: string;
  parseConfidence: "parsed" | "partial" | "raw";
};

export type RecipeStep = {
  id: number;
  recipeId: number;
  position: number;
  instruction: string;
};

export type AggregatedItem = {
  key: string;
  item: string;
  unit: string | null;
  quantity: number | null;
  displayQuantity: string;
  originals: string[];
  recipeTitles: string[];
  selected: boolean;
  vikunjaTaskId: number | null;
};

export type MealPlan = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  recipes: Array<{ id: number; title: string }>;
  items: AggregatedItem[];
};
