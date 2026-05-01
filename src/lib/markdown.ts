import fs from "fs";
import path from "path";
import type { RecipeInput } from "./types";

export function parseRecipeMarkdown(markdown: string, sourceUrl?: string): RecipeInput {
  const lines = markdown.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "").trim() || "Untitled Recipe";
  const ingredients: string[] = [];
  const steps: string[] = [];
  let section: "ingredients" | "steps" | null = null;

  for (const line of lines) {
    if (/^##\s+Ingredients/i.test(line)) {
      section = "ingredients";
      continue;
    }
    if (/^##\s+Steps/i.test(line)) {
      section = "steps";
      continue;
    }
    if (line.startsWith("## ")) {
      section = null;
      continue;
    }
    if (section === "ingredients" && line.startsWith("* ")) {
      ingredients.push(line.replace(/^\*\s+/, "").trim());
    }
    if (section === "steps" && /^\d+\.\s+/.test(line)) {
      steps.push(line.replace(/^\d+\.\s+/, "").trim());
    }
  }

  return { title, sourceUrl, ingredients, steps };
}

export function findMarkdownRecipes(root = process.cwd()): Array<{ filePath: string; recipe: RecipeInput }> {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const filePath = path.join(root, entry.name);
      return { filePath, recipe: parseRecipeMarkdown(fs.readFileSync(filePath, "utf8"), `file://${entry.name}`) };
    })
    .filter(({ recipe }) => recipe.ingredients.length > 0 && recipe.steps.length > 0);
}
