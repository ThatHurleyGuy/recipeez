import { NextResponse } from "next/server";
import { sendErrorNotification } from "@/lib/errorNotifications";
import { importRecipeFromUrl } from "@/lib/recipeImport";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
    const recipe = await importRecipeFromUrl(url);
    return NextResponse.json(recipe);
  } catch (error) {
    await sendErrorNotification(error, {
      source: "api.import",
      request: { method: request.method, path: new URL(request.url).pathname }
    });
    const message = error instanceof Error ? error.message : "Could not import recipe";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
