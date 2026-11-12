import { HttpClient, extractList } from "./http.js";
import { RECIPES_LIMIT } from "../config.js";

export class MealApi {
  constructor(http = new HttpClient()) {
    this.http = http;
  }

  async getCategories() {
    return extractList(await this.http.get("/meals/categories"));
  }

  async getAreas() {
    const areas = extractList(await this.http.get("/meals/areas"));
    const seen = new Set();
    return areas
      .map((area) => area.name)
      .filter((name) => name && !seen.has(name) && seen.add(name));
  }

  async search(query, limit = RECIPES_LIMIT) {
    return extractList(await this.http.get("/meals/search", { q: query, page: 1, limit }));
  }

  async filter({ category, area }, limit = RECIPES_LIMIT) {
    return extractList(await this.http.get("/meals/filter", { category, area, page: 1, limit }));
  }

  async getById(id) {
    const payload = await this.http.get(`/meals/${encodeURIComponent(id)}`);
    return payload?.result ?? null;
  }

  async getRandom(count = RECIPES_LIMIT) {
    return extractList(await this.http.get("/meals/random", { count }));
  }

  async getStarterList() {
    const attempts = [
      () => this.search("", RECIPES_LIMIT),
      () => this.getRandom(RECIPES_LIMIT),
      () => this.search("chicken", RECIPES_LIMIT)
    ];
    for (const attempt of attempts) {
      try {
        const meals = await attempt();
        if (meals.length) return meals;
      } catch (error) {
        console.warn(error.message);
      }
    }
    return [];
  }
}
