import { NextResponse } from "next/server";
import { addRecipeToMealPlan, removeRecipeFromMealPlan } from "@/lib/mealPlanService";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { recipeId } = await request.json();
  addRecipeToMealPlan(Number(id), Number(recipeId));
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { recipeId } = await request.json();
  removeRecipeFromMealPlan(Number(id), Number(recipeId));
  return NextResponse.json({ ok: true });
}
