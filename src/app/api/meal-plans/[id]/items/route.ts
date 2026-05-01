import { NextResponse } from "next/server";
import { setShoppingItemSelected } from "@/lib/mealPlanService";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { itemKey, selected } = await request.json();
  setShoppingItemSelected(Number(id), itemKey, Boolean(selected));
  return NextResponse.json({ ok: true });
}
