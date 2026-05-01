import { NextResponse } from "next/server";
import { sendSelectedItemsToVikunja } from "@/lib/mealPlanService";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sent = await sendSelectedItemsToVikunja(Number(id));
  return NextResponse.json({ sent });
}
