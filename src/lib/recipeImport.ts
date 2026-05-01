import type { RecipeInput } from "./types";

export async function importRecipeFromUrl(url: string): Promise<RecipeInput & { importMethod: string }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "recipeez/0.1 recipe importer"
    }
  });
  if (!response.ok) throw new Error(`Could not fetch recipe page: ${response.status}`);
  const html = await response.text();
  const structured = parseStructuredRecipe(html, url);
  if (structured) return { ...structured, importMethod: "structured" };
  const llm = await importWithLlm(html, url);
  return { ...llm, importMethod: "llm" };
}

function parseStructuredRecipe(html: string, sourceUrl: string): RecipeInput | null {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    try {
      const json = JSON.parse(stripHtmlEntities(script[1].trim()));
      const recipe = findRecipeObject(json);
      if (!recipe) continue;
      const ingredients = arrayOfStrings(recipe.recipeIngredient);
      const steps = parseInstructions(recipe.recipeInstructions);
      if (recipe.name && ingredients.length && steps.length) {
        return {
          title: String(recipe.name).trim(),
          sourceUrl,
          notes: recipe.description ? String(recipe.description).replace(/<[^>]+>/g, "").trim() : null,
          ingredients,
          steps
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function findRecipeObject(value: any): any | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipeObject(item);
      if (found) return found;
    }
  }
  if (typeof value === "object") {
    const type = value["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.some((candidate) => String(candidate).toLowerCase() === "recipe")) return value;
    if (value["@graph"]) return findRecipeObject(value["@graph"]);
  }
  return null;
}

function parseInstructions(value: any): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value.replace(/<[^>]+>/g, "").trim()].filter(Boolean);
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return item;
        if (item.itemListElement) return parseInstructions(item.itemListElement);
        return item.text || item.name || "";
      })
      .map((item) => String(item).replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
  }
  return [];
}

function arrayOfStrings(value: any): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function stripHtmlEntities(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
}

async function importWithLlm(html: string, sourceUrl: string): Promise<RecipeInput> {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!baseUrl || !apiKey || !model) {
    throw new Error("No structured recipe metadata found and LLM_BASE_URL, LLM_API_KEY, or LLM_MODEL is not configured");
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 24000);
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract a cooking recipe as JSON with title, notes, ingredients array, and steps array. Return only JSON."
        },
        { role: "user", content: `Source URL: ${sourceUrl}\n\nPage text:\n${text}` }
      ]
    })
  });
  if (!response.ok) throw new Error(`LLM import failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM response did not include recipe JSON");
  const parsed = JSON.parse(content);
  return {
    title: String(parsed.title || "Imported Recipe"),
    sourceUrl,
    notes: parsed.notes || null,
    ingredients: arrayOfStrings(parsed.ingredients),
    steps: arrayOfStrings(parsed.steps)
  };
}
