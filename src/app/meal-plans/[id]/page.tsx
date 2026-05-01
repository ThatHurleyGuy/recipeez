import { notFound } from "next/navigation";
import {
  DeleteMealPlanButton,
  MealPlanRecipePicker,
  SendToVikunjaButton,
  ShoppingItemToggle
} from "@/app/components/MealPlanControls";
import { getMealPlan } from "@/lib/mealPlanService";
import { listRecipes } from "@/lib/recipeService";

export const dynamic = "force-dynamic";

export default async function MealPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = getMealPlan(Number(id));
  if (!plan) notFound();
  const recipes = listRecipes();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{plan.name}</h1>
          <p className="lede">{plan.recipes.length} recipes selected.</p>
        </div>
        <div className="row">
          <SendToVikunjaButton mealPlanId={plan.id} />
          <DeleteMealPlanButton mealPlanId={plan.id} />
        </div>
      </div>
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Plan Recipes</p>
          <h2>Choose Recipes</h2>
        </div>
        <MealPlanRecipePicker mealPlanId={plan.id} recipes={recipes} selectedRecipes={plan.recipes} />
      </section>
      <section className="panel">
        <h2>Shopping Items</h2>
        {plan.items.length === 0 && <p className="muted">Add recipes to see aggregated ingredients.</p>}
        {plan.items.map((item) => (
          <div className="ingredient-row" key={item.key}>
            <ShoppingItemToggle mealPlanId={plan.id} item={item} />
            <div>
              <strong>
                {[item.displayQuantity, item.unit, item.item].filter(Boolean).join(" ") || item.item}
              </strong>
              <p className="muted">{item.recipeTitles.join(", ")}</p>
              <p className="muted">{item.originals.join(" / ")}</p>
            </div>
            {item.vikunjaTaskId ? <span className="badge">Sent #{item.vikunjaTaskId}</span> : <span className="badge">Needed</span>}
          </div>
        ))}
      </section>
    </>
  );
}
