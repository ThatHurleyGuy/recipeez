import { NextResponse } from "next/server";
import { createRecipe, listRecipes } from "@/lib/recipeService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json(listRecipes(searchParams.get("q") || ""));
}

export async function POST(request: Request) {
  const input = await request.json();
  const id = createRecipe(input);
  return NextResponse.json({ id }, { status: 201 });
}
