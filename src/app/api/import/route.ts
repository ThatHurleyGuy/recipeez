import { NextResponse } from "next/server";
import { importRecipeFromUrl } from "@/lib/recipeImport";

export async function POST(request: Request) {
  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  const recipe = await importRecipeFromUrl(url);
  return NextResponse.json(recipe);
}
