"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { AggregatedItem } from "@/lib/types";

type RecipeChoice = {
  id: number;
  title: string;
  ingredientCount?: number;
};

export function NewMealPlanForm() {
  const router = useRouter();
  const [name, setName] = useState("");

  async function create() {
    const response = await fetch("/api/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const payload = await response.json();
    router.push(`/meal-plans/${payload.id}`);
    router.refresh();
  }

  return (
    <div className="row">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Plan name" />
      <button type="button" onClick={create}>
        New Plan
      </button>
    </div>
  );
}

function fuzzyMatch(value: string, query: string) {
  const haystack = value.toLowerCase();
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (haystack.includes(needle)) return true;

  let index = 0;
  for (const character of haystack) {
    if (character === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
}

export function MealPlanRecipePicker({
  mealPlanId,
  recipes,
  selectedRecipes
}: {
  mealPlanId: number;
  recipes: RecipeChoice[];
  selectedRecipes: RecipeChoice[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [optimisticSelectedIds, setOptimisticSelectedIds] = useState(() => selectedRecipes.map((recipe) => recipe.id));
  const [pendingRecipeIds, setPendingRecipeIds] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIds = useMemo(() => new Set(optimisticSelectedIds), [optimisticSelectedIds]);

  useEffect(() => {
    setOptimisticSelectedIds(selectedRecipes.map((recipe) => recipe.id));
    setPendingRecipeIds(new Set());
  }, [selectedRecipes]);

  useEffect(() => {
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  function scheduleRefresh() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      startTransition(() => router.refresh());
    }, 150);
  }

  const visibleRecipes = recipes.filter((recipe) => selectedIds.has(recipe.id) || fuzzyMatch(recipe.title, query));
  const sortedRecipes = visibleRecipes.sort((first, second) => {
    const firstSelected = selectedIds.has(first.id);
    const secondSelected = selectedIds.has(second.id);
    if (firstSelected !== secondSelected) return firstSelected ? -1 : 1;
    return first.title.localeCompare(second.title);
  });

  async function add(recipeId: number) {
    if (selectedIds.has(recipeId) || pendingRecipeIds.has(recipeId)) return;
    setOptimisticSelectedIds((ids) => (ids.includes(recipeId) ? ids : [...ids, recipeId]));
    setPendingRecipeIds((ids) => new Set(ids).add(recipeId));
    const response = await fetch(`/api/meal-plans/${mealPlanId}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId })
    });
    if (!response.ok) {
      setOptimisticSelectedIds((ids) => ids.filter((id) => id !== recipeId));
    }
    setPendingRecipeIds((ids) => {
      const next = new Set(ids);
      next.delete(recipeId);
      return next;
    });
    scheduleRefresh();
  }

  async function remove(recipeId: number) {
    if (pendingRecipeIds.has(recipeId)) return;
    setOptimisticSelectedIds((ids) => ids.filter((id) => id !== recipeId));
    setPendingRecipeIds((ids) => new Set(ids).add(recipeId));
    const response = await fetch(`/api/meal-plans/${mealPlanId}/recipes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId })
    });
    if (!response.ok) {
      setOptimisticSelectedIds((ids) => (ids.includes(recipeId) ? ids : [...ids, recipeId]));
    }
    setPendingRecipeIds((ids) => {
      const next = new Set(ids);
      next.delete(recipeId);
      return next;
    });
    scheduleRefresh();
  }

  return (
    <div className="recipe-picker">
      <label>
        Find Recipes
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title" />
      </label>
      <div className="recipe-picker-list">
        {sortedRecipes.map((recipe) => {
          const selected = selectedIds.has(recipe.id);
          const pending = pendingRecipeIds.has(recipe.id);
          const content = (
            <>
              <span>
                <strong>{recipe.title}</strong>
                {typeof recipe.ingredientCount === "number" && <small>{recipe.ingredientCount} ingredients</small>}
              </span>
              {selected ? (
                <span className="recipe-choice-actions">
                  <span className="badge">{pending ? "Saving" : "Selected"}</span>
                  <button className="secondary compact" disabled={pending} type="button" onClick={() => remove(recipe.id)}>
                    Remove
                  </button>
                </span>
              ) : (
                <span className="badge">Add</span>
              )}
            </>
          );

          if (!selected) {
            return (
              <button className="recipe-choice" disabled={pending} key={recipe.id} type="button" onClick={() => add(recipe.id)}>
                {content}
              </button>
            );
          }

          return (
            <div className="recipe-choice selected" key={recipe.id}>
              {content}
            </div>
          );
        })}
      </div>
      {sortedRecipes.length === 0 && <p className="muted">No recipes match that search.</p>}
    </div>
  );
}

export function RemoveRecipeButton({ mealPlanId, recipeId }: { mealPlanId: number; recipeId: number }) {
  const router = useRouter();
  async function remove() {
    await fetch(`/api/meal-plans/${mealPlanId}/recipes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId })
    });
    router.refresh();
  }
  return (
    <button className="secondary" type="button" onClick={remove}>
      Remove
    </button>
  );
}

export function ShoppingItemToggle({ mealPlanId, item }: { mealPlanId: number; item: AggregatedItem }) {
  const router = useRouter();
  async function toggle(selected: boolean) {
    await fetch(`/api/meal-plans/${mealPlanId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemKey: item.key, selected })
    });
    router.refresh();
  }

  return (
    <input
      aria-label={`Need ${item.item}`}
      checked={item.selected}
      disabled={Boolean(item.vikunjaTaskId)}
      type="checkbox"
      onChange={(event) => toggle(event.target.checked)}
    />
  );
}

export function SendToVikunjaButton({ mealPlanId }: { mealPlanId: number }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  async function send() {
    setStatus("Sending...");
    const response = await fetch(`/api/meal-plans/${mealPlanId}/send`, { method: "POST" });
    if (!response.ok) {
      setStatus(await response.text());
      return;
    }
    const payload = await response.json();
    setStatus(`Sent ${payload.sent.length} items.`);
    router.refresh();
  }
  return (
    <div className="row">
      <button type="button" onClick={send}>
        Send Selected To Vikunja
      </button>
      {status && <span className="muted">{status}</span>}
    </div>
  );
}

export function DeleteMealPlanButton({ mealPlanId }: { mealPlanId: number }) {
  const router = useRouter();
  async function deletePlan() {
    await fetch(`/api/meal-plans/${mealPlanId}`, { method: "DELETE" });
    router.push("/meal-plans");
    router.refresh();
  }
  return (
    <button className="danger" type="button" onClick={deletePlan}>
      Delete Plan
    </button>
  );
}
