import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { parseIngredientLine } from "./ingredientParser";
import { findMarkdownRecipes } from "./markdown";

let database: Database.Database | null = null;
let imported = false;

function databasePath() {
  return process.env.DATABASE_PATH || path.join(process.cwd(), "data", "recipeez.db");
}

export function getDb() {
  if (database) return database;

  const dbPath = databasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  database = new Database(dbPath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  migrate(database);
  importMarkdownOnFirstRun();
  return database;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      quantity REAL,
      quantity_text TEXT,
      unit TEXT,
      item TEXT NOT NULL,
      normalized_item TEXT NOT NULL,
      parse_confidence TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      instruction TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_plan_recipes (
      meal_plan_id INTEGER NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      PRIMARY KEY (meal_plan_id, recipe_id)
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_plan_id INTEGER NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
      item_key TEXT NOT NULL,
      selected INTEGER NOT NULL DEFAULT 1,
      vikunja_task_id INTEGER,
      UNIQUE (meal_plan_id, item_key)
    );

    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);
  `);
}

function importMarkdownOnFirstRun() {
  if (imported || process.env.AUTO_IMPORT_MARKDOWN === "false") return;
  imported = true;
  const count = database!.prepare("SELECT COUNT(*) AS count FROM recipes").get() as { count: number };
  if (count.count > 0) return;

  for (const { recipe } of findMarkdownRecipes()) {
    importRecipe(recipe);
  }
}

function importRecipe(recipe: { title: string; sourceUrl?: string | null; notes?: string | null; ingredients: string[]; steps: string[] }) {
  const db = database!;
  const result = db
    .prepare("INSERT INTO recipes (title, source_url, notes) VALUES (?, ?, ?)")
    .run(recipe.title, recipe.sourceUrl || null, recipe.notes || null);
  const recipeId = Number(result.lastInsertRowid);
  const insertIngredient = db.prepare(`
    INSERT INTO recipe_ingredients
      (recipe_id, position, original_text, quantity, quantity_text, unit, item, normalized_item, parse_confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  recipe.ingredients.forEach((line, index) => {
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
  recipe.steps.forEach((step, index) => insertStep.run(recipeId, index + 1, step));
}
