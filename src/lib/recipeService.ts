import { getDb } from "./db";
import { parseIngredientLine } from "./ingredientParser";
import type { Recipe, RecipeInput } from "./types";

type RecipeRow = {
  id: number;
  title: string;
  source_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function recipeCount() {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS count FROM recipes").get() as { count: number };
  return row.count;
}

export function listRecipes(query = ""): Array<Pick<Recipe, "id" | "title" | "sourceUrl" | "updatedAt"> & { ingredientCount: number }> {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT r.id, r.title, r.source_url, r.updated_at, COUNT(i.id) AS ingredient_count
      FROM recipes r
      LEFT JOIN recipe_ingredients i ON i.recipe_id = r.id
      WHERE lower(r.title) LIKE lower(?)
      GROUP BY r.id
      ORDER BY lower(r.title)
    `
    )
    .all(`%${query}%`) as Array<RecipeRow & { ingredient_count: number }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    sourceUrl: row.source_url,
    updatedAt: row.updated_at,
    ingredientCount: row.ingredient_count
  }));
}

export function getRecipe(id: number): Recipe | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id) as RecipeRow | undefined;
  if (!row) return null;
  const ingredients = db
    .prepare("SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY position")
    .all(id)
    .map(mapIngredient);
  const steps = db
    .prepare("SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY position")
    .all(id)
    .map((step: any) => ({
      id: step.id,
      recipeId: step.recipe_id,
      position: step.position,
      instruction: step.instruction
    }));

  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.source_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ingredients,
    steps
  };
}

export function createRecipe(input: RecipeInput) {
  const db = getDb();
  const tx = db.transaction(() => {
    const result = db
      .prepare("INSERT INTO recipes (title, source_url, notes) VALUES (?, ?, ?)")
      .run(input.title.trim(), input.sourceUrl || null, input.notes || null);
    const id = Number(result.lastInsertRowid);
    replaceRecipeParts(id, input.ingredients, input.steps);
    return id;
  });
  return tx();
}

export function updateRecipe(id: number, input: RecipeInput) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("UPDATE recipes SET title = ?, source_url = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      input.title.trim(),
      input.sourceUrl || null,
      input.notes || null,
      id
    );
    replaceRecipeParts(id, input.ingredients, input.steps);
  });
  tx();
}

export function deleteRecipe(id: number) {
  getDb().prepare("DELETE FROM recipes WHERE id = ?").run(id);
}

function replaceRecipeParts(recipeId: number, ingredients: string[], steps: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").run(recipeId);
  db.prepare("DELETE FROM recipe_steps WHERE recipe_id = ?").run(recipeId);

  const insertIngredient = db.prepare(`
    INSERT INTO recipe_ingredients
      (recipe_id, position, original_text, quantity, quantity_text, unit, item, normalized_item, parse_confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  ingredients
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const parsed = parseIngredientLine(line, index + 1, recipeId);
      insertIngredient.run(
        recipeId,
        parsed.position,
        parsed.originalText,
        parsed.quantity,
        parsed.quantityText,
        parsed.unit,
        parsed.item,
        parsed.normalizedItem,
        parsed.parseConfidence
      );
    });

  const insertStep = db.prepare("INSERT INTO recipe_steps (recipe_id, position, instruction) VALUES (?, ?, ?)");
  steps
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => insertStep.run(recipeId, index + 1, line));
}

function mapIngredient(row: any) {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    position: row.position,
    originalText: row.original_text,
    quantity: row.quantity,
    quantityText: row.quantity_text,
    unit: row.unit,
    item: row.item,
    normalizedItem: row.normalized_item,
    parseConfidence: row.parse_confidence
  };
}
