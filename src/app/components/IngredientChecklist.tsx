"use client";

import { useEffect, useState } from "react";

type IngredientItem = {
  id: number;
  originalText: string;
  parseConfidence: string;
};

export default function IngredientChecklist({ ingredients, recipeId }: { ingredients: IngredientItem[]; recipeId: number }) {
  const storageKey = `recipeez-ingredients-${recipeId}`;
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const ids = JSON.parse(stored);
      if (Array.isArray(ids)) {
        setChecked(new Set(ids.filter((id) => typeof id === "number")));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  function toggle(id: number, selected: boolean) {
    const next = new Set(checked);
    if (selected) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setChecked(next);
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
  }

  function reset() {
    setChecked(new Set());
    window.localStorage.removeItem(storageKey);
  }

  return (
    <div className="checklist">
      {ingredients.map((ingredient) => (
        <label className="ingredient-check" key={ingredient.id}>
          <input
            checked={checked.has(ingredient.id)}
            type="checkbox"
            onChange={(event) => toggle(ingredient.id, event.target.checked)}
          />
          <span>{ingredient.originalText}</span>
          {ingredient.parseConfidence !== "raw" && <span className="badge">{ingredient.parseConfidence}</span>}
        </label>
      ))}
      {checked.size > 0 && (
        <button className="secondary compact" type="button" onClick={reset}>
          Clear Checked
        </button>
      )}
    </div>
  );
}
