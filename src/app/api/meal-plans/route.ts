import { NextResponse } from "next/server";
import { createMealPlan, listMealPlans } from "@/lib/mealPlanService";

export async function GET() {
  return NextResponse.json(listMealPlans());
}

export async function POST(request: Request) {
  const { name } = await request.json();
  const id = createMealPlan(name);
  return NextResponse.json({ id }, { status: 201 });
}
