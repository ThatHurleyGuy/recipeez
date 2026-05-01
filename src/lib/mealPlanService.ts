import { getDb } from "./db";
import { formatQuantity } from "./ingredientParser";
import { createVikunjaTask } from "./vikunja";
import type { AggregatedItem, MealPlan } from "./types";

export function listMealPlans() {
  return getDb()
    .prepare(
      `
      SELECT p.id, p.name, p.updated_at, COUNT(r.recipe_id) AS recipe_count
      FROM meal_plans p
      LEFT JOIN meal_plan_recipes r ON r.meal_plan_id = p.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `
    )
    .all() as Array<{ id: number; name: string; updated_at: string; recipe_count: number }>;
}

export function createMealPlan(name: string) {
  const result = getDb().prepare("INSERT INTO meal_plans (name) VALUES (?)").run(name.trim() || "Untitled Plan");
  return Number(result.lastInsertRowid);
}

export function deleteMealPlan(id: number) {
  getDb().prepare("DELETE FROM meal_plans WHERE id = ?").run(id);
}

export function getMealPlan(id: number): MealPlan | null {
  const db = getDb();
  const plan = db.prepare("SELECT * FROM meal_plans WHERE id = ?").get(id) as any;
  if (!plan) return null;
  const recipes = db
    .prepare(
      `
      SELECT r.id, r.title
      FROM recipes r
      JOIN meal_plan_recipes mpr ON mpr.recipe_id = r.id
      WHERE mpr.meal_plan_id = ?
      ORDER BY lower(r.title)
    `
    )
    .all(id) as Array<{ id: number; title: string }>;

  return {
    id: plan.id,
    name: plan.name,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    recipes,
    items: aggregateItems(id)
  };
}

export function addRecipeToMealPlan(mealPlanId: number, recipeId: number) {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO meal_plan_recipes (meal_plan_id, recipe_id) VALUES (?, ?)").run(mealPlanId, recipeId);
  db.prepare("UPDATE meal_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(mealPlanId);
}

export function removeRecipeFromMealPlan(mealPlanId: number, recipeId: number) {
  const db = getDb();
  db.prepare("DELETE FROM meal_plan_recipes WHERE meal_plan_id = ? AND recipe_id = ?").run(mealPlanId, recipeId);
  db.prepare("UPDATE meal_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(mealPlanId);
}

export function setShoppingItemSelected(mealPlanId: number, itemKey: string, selected: boolean) {
  getDb()
    .prepare(
      `
      INSERT INTO shopping_items (meal_plan_id, item_key, selected)
      VALUES (?, ?, ?)
      ON CONFLICT(meal_plan_id, item_key) DO UPDATE SET selected = excluded.selected
    `
    )
    .run(mealPlanId, itemKey, selected ? 1 : 0);
}

export async function sendSelectedItemsToVikunja(mealPlanId: number) {
  const db = getDb();
  const plan = getMealPlan(mealPlanId);
  if (!plan) throw new Error("Meal plan not found");
  const sent: Array<{ key: string; taskId: number }> = [];

  for (const item of plan.items.filter((candidate) => candidate.selected && !candidate.vikunjaTaskId)) {
    const title = [item.displayQuantity, item.unit, item.item].filter(Boolean).join(" ");
    const description = [`Meal plan: ${plan.name}`, `Recipes: ${item.recipeTitles.join(", ")}`, "", ...item.originals].join("\n");
    const task = await createVikunjaTask(title, description);
    db.prepare(
      `
      INSERT INTO shopping_items (meal_plan_id, item_key, selected, vikunja_task_id)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(meal_plan_id, item_key) DO UPDATE SET vikunja_task_id = excluded.vikunja_task_id
    `
    ).run(mealPlanId, item.key, task.id);
    sent.push({ key: item.key, taskId: task.id });
  }

  return sent;
}

function aggregateItems(mealPlanId: number): AggregatedItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT i.*, r.title AS recipe_title, s.selected, s.vikunja_task_id
      FROM recipe_ingredients i
      JOIN meal_plan_recipes mpr ON mpr.recipe_id = i.recipe_id
      JOIN recipes r ON r.id = i.recipe_id
      LEFT JOIN shopping_items s ON s.meal_plan_id = mpr.meal_plan_id
        AND s.item_key = i.normalized_item || '|' || COALESCE(i.unit, '')
      WHERE mpr.meal_plan_id = ?
      ORDER BY i.normalized_item, i.unit, r.title
    `
    )
    .all(mealPlanId) as any[];

  const groups = new Map<string, AggregatedItem>();
  for (const row of rows) {
    const key = `${row.normalized_item}|${row.unit || ""}`;
    const existing = groups.get(key);
    const canAdd = row.quantity != null;
    if (!existing) {
      groups.set(key, {
        key,
        item: row.item,
        unit: row.unit,
        quantity: canAdd ? row.quantity : null,
        displayQuantity: canAdd ? formatQuantity(row.quantity) : "",
        originals: [row.original_text],
        recipeTitles: [row.recipe_title],
        selected: row.selected == null ? true : Boolean(row.selected),
        vikunjaTaskId: row.vikunja_task_id
      });
      continue;
    }
    if (canAdd && existing.quantity != null) {
      existing.quantity += row.quantity;
      existing.displayQuantity = formatQuantity(existing.quantity);
    } else {
      existing.quantity = null;
      existing.displayQuantity = "";
    }
    existing.originals.push(row.original_text);
    if (!existing.recipeTitles.includes(row.recipe_title)) existing.recipeTitles.push(row.recipe_title);
    if (row.vikunja_task_id) existing.vikunjaTaskId = row.vikunja_task_id;
  }

  return [...groups.values()];
}
