import { NextResponse } from "next/server";
import { sendErrorNotification } from "@/lib/errorNotifications";
import { importRecipeFromUrl } from "@/lib/recipeImport";

export async function POST(request: Request) {
  let url: unknown;
  try {
    ({ url } = await request.json());
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
    const recipe = await importRecipeFromUrl(String(url));
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe import failed", {
      error: error instanceof Error ? error.stack || error.message : error,
      request: { method: request.method, path: new URL(request.url).pathname },
      importUrl: typeof url === "string" ? url : null
    });
    await sendErrorNotification(error, {
      source: "api.import",
      request: { method: request.method, path: new URL(request.url).pathname }
    });
    const message = error instanceof Error ? error.message : "Could not import recipe";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
