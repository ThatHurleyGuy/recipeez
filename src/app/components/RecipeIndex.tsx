"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Recipe } from "@/lib/types";

type RecipeSummary = Pick<Recipe, "id" | "title" | "sourceUrl" | "updatedAt"> & {
  ingredientCount: number;
};

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

export default function RecipeIndex({ initialQuery, recipes }: { initialQuery: string; recipes: RecipeSummary[] }) {
  const [query, setQuery] = useState(initialQuery);
  const visibleRecipes = useMemo(() => recipes.filter((recipe) => fuzzyMatch(recipe.title, query)), [query, recipes]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Recipes</h1>
          <p className="lede">{visibleRecipes.length} recipes available.</p>
        </div>
        <Link className="button" href="/recipes/new">
          Add Recipe
        </Link>
      </div>
      <div className="panel">
        <label>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a recipe" />
        </label>
      </div>
      <div className="grid">
        {visibleRecipes.map((recipe) => (
          <Link className="card" href={`/recipes/${recipe.id}`} key={recipe.id}>
            <h2>{recipe.title}</h2>
            <p className="muted">{recipe.ingredientCount} ingredients</p>
            {recipe.sourceUrl && <span className="badge">Imported</span>}
          </Link>
        ))}
      </div>
      {visibleRecipes.length === 0 && <p className="muted">No recipes match that search.</p>}
    </>
  );
}
