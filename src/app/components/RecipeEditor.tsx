"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Recipe } from "@/lib/types";

type Draft = {
  title: string;
  sourceUrl: string;
  notes: string;
  ingredients: string;
  steps: string;
};

export default function RecipeEditor({ recipe }: { recipe?: Recipe }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({
    title: recipe?.title || "",
    sourceUrl: recipe?.sourceUrl || "",
    notes: recipe?.notes || "",
    ingredients: recipe?.ingredients.map((ingredient) => ingredient.originalText).join("\n") || "",
    steps: recipe?.steps.map((step) => step.instruction).join("\n") || ""
  });
  const [importUrl, setImportUrl] = useState("");
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("Saving...");
    const response = await fetch(recipe ? `/api/recipes/${recipe.id}` : "/api/recipes", {
      method: recipe ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        sourceUrl: draft.sourceUrl || null,
        notes: draft.notes || null,
        ingredients: draft.ingredients.split("\n"),
        steps: draft.steps.split("\n")
      })
    });
    if (!response.ok) {
      setStatus(await response.text());
      return;
    }
    const payload = await response.json();
    router.push(`/recipes/${recipe?.id || payload.id}`);
    router.refresh();
  }

  async function importRecipe() {
    if (!importUrl) return;
    setStatus("Importing...");
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: importUrl })
    });
    if (!response.ok) {
      setStatus(await response.text());
      return;
    }
    const imported = await response.json();
    setDraft({
      title: imported.title || "",
      sourceUrl: imported.sourceUrl || importUrl,
      notes: imported.notes || "",
      ingredients: (imported.ingredients || []).join("\n"),
      steps: (imported.steps || []).join("\n")
    });
    setStatus(`Imported using ${imported.importMethod}; review before saving.`);
  }

  return (
    <div className="form-grid">
      {!recipe && (
        <section className="panel">
          <h2>Import From Link</h2>
          <p className="lede">Structured recipe metadata is used first; the configured LLM fallback handles messy pages.</p>
          <div className="row" style={{ marginTop: 14 }}>
            <input value={importUrl} onChange={(event) => setImportUrl(event.target.value)} placeholder="https://..." />
            <button type="button" onClick={importRecipe}>
              Import
            </button>
          </div>
        </section>
      )}

      <section className="panel form-grid">
        <label>
          Title
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </label>
        <label>
          Source URL
          <input value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} />
        </label>
        <label>
          Notes
          <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        </label>
        <label>
          Ingredients
          <textarea
            value={draft.ingredients}
            onChange={(event) => setDraft({ ...draft, ingredients: event.target.value })}
            placeholder={"1 cup flour\n2 eggs"}
          />
        </label>
        <label>
          Steps
          <textarea
            value={draft.steps}
            onChange={(event) => setDraft({ ...draft, steps: event.target.value })}
            placeholder={"Mix ingredients\nBake until done"}
          />
        </label>
        <div className="row">
          <button type="button" onClick={save}>
            Save Recipe
          </button>
          {status && <span className="muted">{status}</span>}
        </div>
      </section>
    </div>
  );
}
