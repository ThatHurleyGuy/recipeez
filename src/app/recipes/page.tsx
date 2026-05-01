import RecipeIndex from "@/app/components/RecipeIndex";
import { listRecipes } from "@/lib/recipeService";

export const dynamic = "force-dynamic";

export default async function RecipesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const recipes = listRecipes();

  return <RecipeIndex initialQuery={params.q || ""} recipes={recipes} />;
}
