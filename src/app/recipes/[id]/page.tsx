import Link from "next/link";
import { notFound } from "next/navigation";
import IngredientChecklist from "@/app/components/IngredientChecklist";
import RecipeEditor from "@/app/components/RecipeEditor";
import { getRecipe } from "@/lib/recipeService";

export const dynamic = "force-dynamic";

export default async function RecipePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const recipe = getRecipe(Number(id));
  if (!recipe) notFound();

  if (query.edit === "1") {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>Edit Recipe</h1>
            <p className="lede">{recipe.title}</p>
          </div>
          <Link className="button secondary" href={`/recipes/${recipe.id}`}>
            Cancel
          </Link>
        </div>
        <RecipeEditor recipe={recipe} />
      </>
    );
  }

  return (
    <>
      <div className="recipe-hero">
        <div>
          <p className="eyebrow">Recipe</p>
          <h1>{recipe.title}</h1>
          {recipe.sourceUrl && (
            <p className="lede">
              Source: <a href={recipe.sourceUrl}>{recipe.sourceUrl}</a>
            </p>
          )}
        </div>
        <div className="recipe-meta">
          <span className="badge">{recipe.ingredients.length} ingredients</span>
          <span className="badge">{recipe.steps.length} steps</span>
          <Link className="button secondary" href={`/recipes/${recipe.id}?edit=1`}>
            Edit
          </Link>
        </div>
      </div>
      {recipe.notes && (
        <section className="panel note-panel">
          <div className="section-heading">
            <p className="eyebrow">Notes</p>
            <h2>Before You Start</h2>
          </div>
          <p>{recipe.notes}</p>
        </section>
      )}
      <div className="recipe-body">
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Prep</p>
            <h2>Ingredients</h2>
          </div>
          <IngredientChecklist ingredients={recipe.ingredients} recipeId={recipe.id} />
        </section>
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Method</p>
            <h2>Steps</h2>
          </div>
          <ol className="steps-list">
            {recipe.steps.map((step) => (
              <li key={step.id}>{step.instruction}</li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
