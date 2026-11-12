import { NUTRITION_STORAGE } from "../config.js";

export class AppState {
  constructor() {
    this.categories = [];
    this.areas = [];
    this.starterMeals = [];
    this.meals = [];
    this.filters = { query: "", category: "", area: "" };
    this.viewMode = "grid";
    this.mealCache = new Map();
    this.nutritionCache = this.loadNutrition();
    this.currentMeal = null;
    this.products = [];
    this.productTotal = 0;
    this.productGrade = "";
  }

  loadNutrition() {
    try {
      const saved = JSON.parse(localStorage.getItem(NUTRITION_STORAGE));
      return new Map(Array.isArray(saved) ? saved : []);
    } catch (error) {
      return new Map();
    }
  }

  saveNutrition(id, nutrition) {
    this.nutritionCache.set(id, nutrition);
    try {
      localStorage.setItem(NUTRITION_STORAGE, JSON.stringify(Array.from(this.nutritionCache)));
    } catch (error) {
      console.warn("Nutrition cache could not be saved");
    }
  }

  cacheMeals(list = []) {
    list.forEach((meal) => {
      if (meal && meal.id) this.mealCache.set(String(meal.id), meal);
    });
  }
}
