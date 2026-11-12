import { HttpClient } from "./http.js";
import { DEFAULT_SERVINGS, KEY_STORAGE, USDA_API_KEY } from "../config.js";
import { round, toNumber } from "../utils/helpers.js";

const MACRO_KEYS = ["calories", "energy", "kcal"];

const readMacros = (source = {}) => ({
  calories: toNumber(source.calories ?? source.energy ?? source.kcal),
  protein: toNumber(source.protein),
  carbs: toNumber(source.carbs ?? source.carbohydrates),
  fat: toNumber(source.fat ?? source.totalFat),
  fiber: toNumber(source.fiber),
  sugar: toNumber(source.sugar ?? source.sugars)
});

const mapMacros = (macros, convert) =>
  Object.fromEntries(Object.entries(macros).map(([key, value]) => [key, round(convert(value), 1)]));

const collectMacroNodes = (node, path = "", found = []) => {
  if (!node || typeof node !== "object" || Array.isArray(node)) return found;
  if (MACRO_KEYS.some((key) => key in node)) found.push({ path: path.toLowerCase(), node });
  Object.entries(node).forEach(([key, child]) => collectMacroNodes(child, `${path}.${key}`, found));
  return found;
};

const findServings = (node) => {
  if (!node || typeof node !== "object" || Array.isArray(node)) return 0;
  const direct = toNumber(node.servings);
  if (direct > 0) return direct;
  for (const child of Object.values(node)) {
    const nested = findServings(child);
    if (nested > 0) return nested;
  }
  return 0;
};

export class NutritionApi {
  constructor(http = new HttpClient()) {
    this.http = http;
  }

  static readKey() {
    if (USDA_API_KEY) return USDA_API_KEY;
    try {
      return localStorage.getItem(KEY_STORAGE) || "";
    } catch (error) {
      return "";
    }
  }

  static saveKey(key) {
    try {
      localStorage.setItem(KEY_STORAGE, key);
    } catch (error) {
      console.warn("Could not store the API key");
    }
  }

  static forgetKey() {
    try {
      localStorage.removeItem(KEY_STORAGE);
    } catch (error) {
      console.warn("Could not clear the API key");
    }
  }

  buildBodies(meal) {
    const ingredients = (meal.ingredients ?? []).map(({ ingredient, measure }) =>
      `${measure || ""} ${ingredient}`.trim()
    );
    return [
      { recipeName: meal.name, ingredients },
      { name: meal.name, ingredients },
      { ingredients },
      { recipe: { name: meal.name, ingredients } },
      { recipeName: meal.name, ingredients: meal.ingredients }
    ];
  }

  async analyze(meal, apiKey) {
    const headers = apiKey ? { "x-api-key": apiKey } : {};
    let lastError = null;
    for (const body of this.buildBodies(meal)) {
      try {
        const payload = await this.http.post("/nutrition/analyze", body, headers);
        return this.normalize(payload);
      } catch (error) {
        lastError = error;
        if (error.status !== 400 && error.status !== 422) throw error;
      }
    }
    throw lastError;
  }

  normalize(payload) {
    const found = collectMacroNodes(payload?.data ?? payload?.result ?? payload);
    const servings = findServings(payload) || DEFAULT_SERVINGS;
    const perHit = found.find((hit) => /serving/.test(hit.path));
    const totalHit =
      found.find((hit) => /total/.test(hit.path) && !/serving/.test(hit.path)) ??
      found.find((hit) => !/serving/.test(hit.path));

    let total = totalHit ? readMacros(totalHit.node) : null;
    let perServing = perHit ? readMacros(perHit.node) : null;
    if (!total && !perServing) throw new Error("The analysis response had no calorie data");

    if (!perServing) perServing = mapMacros(total, (value) => value / servings);
    if (!total) total = mapMacros(perServing, (value) => value * servings);
    if (!total.calories && !perServing.calories) throw new Error("No nutrition data came back for this recipe");

    return { servings, total, perServing };
  }
}
