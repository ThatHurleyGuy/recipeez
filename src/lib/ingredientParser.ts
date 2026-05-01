import type { RecipeIngredient } from "./types";

const FRACTIONS: Record<string, number> = {
  "1/8": 0.125,
  "1/4": 0.25,
  "1/3": 1 / 3,
  "1/2": 0.5,
  "2/3": 2 / 3,
  "3/4": 0.75
};

const UNITS = new Map<string, string>([
  ["teaspoon", "tsp"],
  ["teaspoons", "tsp"],
  ["tsp", "tsp"],
  ["tablespoon", "tbsp"],
  ["tablespoons", "tbsp"],
  ["tbsp", "tbsp"],
  ["cup", "cup"],
  ["cups", "cup"],
  ["ounce", "oz"],
  ["ounces", "oz"],
  ["oz", "oz"],
  ["pound", "lb"],
  ["pounds", "lb"],
  ["lb", "lb"],
  ["lbs", "lb"],
  ["gram", "g"],
  ["grams", "g"],
  ["g", "g"],
  ["kilogram", "kg"],
  ["kilograms", "kg"],
  ["kg", "kg"],
  ["clove", "clove"],
  ["cloves", "clove"],
  ["can", "can"],
  ["cans", "can"],
  ["package", "package"],
  ["packages", "package"],
  ["pinch", "pinch"],
  ["pinches", "pinch"]
]);

function parseNumberToken(token: string): number | null {
  const cleaned = token.trim();
  if (!cleaned) return null;
  if (FRACTIONS[cleaned] != null) return FRACTIONS[cleaned];
  if (/^\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned);
  const mixed = cleaned.match(/^(\d+)-(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return null;
}

function parseLeadingQuantity(text: string): { quantity: number | null; quantityText: string | null; rest: string } {
  const normalized = text.replace(/[–—]/g, "-").trim();
  const words = normalized.split(/\s+/);
  if (words.length === 0) return { quantity: null, quantityText: null, rest: text };

  const first = parseNumberToken(words[0]);
  if (first == null) return { quantity: null, quantityText: null, rest: text };

  const second = words[1] ? parseNumberToken(words[1]) : null;
  if (second != null && /^\d+\/\d+$/.test(words[1])) {
    return {
      quantity: first + second,
      quantityText: `${words[0]} ${words[1]}`,
      rest: words.slice(2).join(" ")
    };
  }

  return {
    quantity: first,
    quantityText: words[0],
    rest: words.slice(1).join(" ")
  };
}

export function normalizeItem(text: string): string {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(chopped|diced|minced|sliced|grated|fresh|dry|dried|large|small|medium|optional)\b/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseIngredientLine(originalText: string, position: number, recipeId = 0): Omit<RecipeIngredient, "id"> {
  const cleaned = originalText.replace(/^\*\s*/, "").trim();
  const parsedQuantity = parseLeadingQuantity(cleaned);
  const words = parsedQuantity.rest.split(/\s+/).filter(Boolean);
  const unitCandidate = words[0]?.toLowerCase().replace(/[.,]/g, "");
  const unit = unitCandidate ? UNITS.get(unitCandidate) ?? null : null;
  const itemText = unit ? words.slice(1).join(" ") : parsedQuantity.rest;
  const item = itemText.trim() || cleaned;
  const normalizedItem = normalizeItem(item) || item.toLowerCase();
  const parseConfidence = parsedQuantity.quantity != null ? (unit || item !== cleaned ? "parsed" : "partial") : "raw";

  return {
    recipeId,
    position,
    originalText: cleaned,
    quantity: parsedQuantity.quantity,
    quantityText: parsedQuantity.quantityText,
    unit,
    item,
    normalizedItem,
    parseConfidence
  };
}

export function formatQuantity(value: number | null): string {
  if (value == null) return "";
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(2)).toString();
}
