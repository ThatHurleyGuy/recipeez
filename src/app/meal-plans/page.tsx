import Link from "next/link";
import { NewMealPlanForm } from "@/app/components/MealPlanControls";
import { listMealPlans } from "@/lib/mealPlanService";

export const dynamic = "force-dynamic";

export default function MealPlansPage() {
  const plans = listMealPlans();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Meal Plans</h1>
          <p className="lede">Ad hoc recipe groups with aggregated shopping items.</p>
        </div>
      </div>
      <section className="panel">
        <NewMealPlanForm />
      </section>
      <div className="grid">
        {plans.map((plan) => (
          <Link className="card" href={`/meal-plans/${plan.id}`} key={plan.id}>
            <h2>{plan.name}</h2>
            <p className="muted">{plan.recipe_count} recipes</p>
          </Link>
        ))}
      </div>
    </>
  );
}
