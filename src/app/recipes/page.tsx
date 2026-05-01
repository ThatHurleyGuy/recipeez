import Link from "next/link";
import { listRecipes } from "@/lib/recipeService";

export const dynamic = "force-dynamic";

export default async function RecipesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const recipes = listRecipes(params.q || "");

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Recipes</h1>
          <p className="lede">{recipes.length} recipes available.</p>
        </div>
        <Link className="button" href="/recipes/new">
          Add Recipe
        </Link>
      </div>
      <form className="panel" action="/recipes">
        <label>
          Search
          <input name="q" defaultValue={params.q || ""} placeholder="Find a recipe" />
        </label>
      </form>
      <div className="grid">
        {recipes.map((recipe) => (
          <Link className="card" href={`/recipes/${recipe.id}`} key={recipe.id}>
            <h2>{recipe.title}</h2>
            <p className="muted">{recipe.ingredientCount} ingredients</p>
            {recipe.sourceUrl && <span className="badge">Imported</span>}
          </Link>
        ))}
      </div>
    </>
  );
}
