import { NextResponse } from "next/server";
import { deleteRecipe, getRecipe, updateRecipe } from "@/lib/recipeService";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = getRecipe(Number(id));
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  return NextResponse.json(recipe);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  updateRecipe(Number(id), await request.json());
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteRecipe(Number(id));
  return NextResponse.json({ ok: true });
}
