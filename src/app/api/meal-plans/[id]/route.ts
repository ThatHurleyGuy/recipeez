import { NextResponse } from "next/server";
import { deleteMealPlan, getMealPlan } from "@/lib/mealPlanService";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = getMealPlan(Number(id));
  if (!plan) return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteMealPlan(Number(id));
  return NextResponse.json({ ok: true });
}
