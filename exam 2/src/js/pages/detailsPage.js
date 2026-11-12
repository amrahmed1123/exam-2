import { NutritionApi } from "../api/nutrition.js";
import { Components } from "../ui/components.js";
import { round } from "../utils/helpers.js";

export class DetailsPage {
  constructor({ state, mealApi, nutritionApi, logStore, layout, notifier, router }) {
    this.state = state;
    this.mealApi = mealApi;
    this.nutritionApi = nutritionApi;
    this.logStore = logStore;
    this.layout = layout;
    this.notifier = notifier;
    this.router = router;
    this.activeId = null;
  }

  init() {
    this.section = document.getElementById("meal-details");
    this.section.addEventListener("click", (event) => this.handleClick(event));
    this.section.addEventListener("change", (event) => {
      if (event.target.matches(".ingredient-checkbox")) {
        event.target.closest(".ingredient-row").classList.toggle("is-checked", event.target.checked);
      }
    });
  }

  async show({ id }) {
    this.layout.setPage("details");
    this.activeId = id;
    this.section.innerHTML = `<div class="max-w-7xl mx-auto">${Components.spinner()}</div>`;

    let meal = this.state.mealCache.get(id);
    if (!meal) {
      try {
        meal = await this.mealApi.getById(id);
      } catch (error) {
        meal = null;
      }
      if (meal) this.state.cacheMeals([meal]);
    }
    if (this.activeId !== id) return;

    if (!meal) {
      this.section.innerHTML = `
        <div class="max-w-7xl mx-auto text-center">
          ${Components.emptyState({ icon: "fa-bowl-food", title: "We couldn't find that meal", text: "It may have been removed" })}
          <button data-action="back" class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all">Back to Recipes</button>
        </div>`;
      return;
    }

    this.state.currentMeal = meal;
    this.section.innerHTML = Components.mealDetails(meal);
    this.loadNutrition(meal);
  }

  handleClick(event) {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;
    const meal = this.state.currentMeal;
    switch (trigger.dataset.action) {
      case "back":
        this.router.navigate("/home");
        break;
      case "log-meal":
        this.logMeal();
        break;
      case "retry-nutrition":
        if (meal) this.loadNutrition(meal, true);
        break;
    }
  }

  async requestKey() {
    const typed = await this.notifier.askText({
      title: "USDA API key",
      text: "Nutrition analysis needs a USDA FoodData Central key.",
      placeholder: "Paste your key here"
    });
    if (typed) NutritionApi.saveKey(typed);
    return typed || "";
  }

  paintNutrition(nutrition) {
    const container = this.section.querySelector("#nutrition-facts-container");
    if (!container) return;
    container.innerHTML = Components.nutritionFacts(nutrition);
    const servings = this.section.querySelector("#hero-servings");
    const calories = this.section.querySelector("#hero-calories");
    if (servings) servings.textContent = `${nutrition.servings} servings`;
    if (calories) calories.textContent = `${round(nutrition.perServing.calories, 0)} cal/serving`;
  }

  paintFailure(message, needsKey = false) {
    const container = this.section.querySelector("#nutrition-facts-container");
    const calories = this.section.querySelector("#hero-calories");
    if (container) container.innerHTML = Components.nutritionUnavailable(message, needsKey);
    if (calories) calories.textContent = "No calorie data";
  }

  async loadNutrition(meal, askForKey = false) {
    const container = this.section.querySelector("#nutrition-facts-container");
    if (!container) return;

    const cached = this.state.nutritionCache.get(meal.id);
    if (cached) {
      this.paintNutrition(cached);
      return;
    }

    container.innerHTML = Components.nutritionLoading();
    try {
      let key = NutritionApi.readKey();
      if (askForKey) {
        key = await this.requestKey();
        if (!key) {
          this.paintFailure("An API key is required to analyze this recipe.", true);
          return;
        }
      }
      const nutrition = await this.nutritionApi.analyze(meal, key || "DEMO_KEY");
      this.state.saveNutrition(meal.id, nutrition);
      if (this.activeId === meal.id) this.paintNutrition(nutrition);
    } catch (error) {
      const limited = error.status === 429;
      const rejected = error.status === 401 || error.status === 403;
      if (rejected) NutritionApi.forgetKey();
      const message = limited
        ? "The request limit was reached. Add your own free USDA key to keep going."
        : error.message;
      if (this.activeId === meal.id) this.paintFailure(message, limited || rejected);
    }
  }

  askServings(meal, perServing) {
    return this.notifier
      .fire({
        html: Components.logModal(meal, perServing),
        showCancelButton: true,
        reverseButtons: true,
        buttonsStyling: false,
        focusConfirm: false,
        confirmButtonText: '<i class="fa-solid fa-clipboard-list"></i> Log Meal',
        cancelButtonText: "Cancel",
        customClass: {
          popup: "log-popup",
          actions: "log-actions",
          confirmButton: "log-confirm",
          cancelButton: "log-cancel"
        },
        didOpen: (popup) => {
          const input = popup.querySelector("#servings-input");
          popup.querySelectorAll("[data-step]").forEach((button) => {
            button.addEventListener("click", () => {
              const next = Number(input.value || 0) + Number(button.dataset.step);
              input.value = Math.max(0.5, next);
            });
          });
        },
        preConfirm: () => {
          const value = Number(document.getElementById("servings-input").value);
          if (!value || value <= 0) {
            window.Swal.showValidationMessage("Enter at least half a serving");
            return false;
          }
          return value;
        }
      })
      .then((result) => (result.isConfirmed ? result.value : null));
  }

  async logMeal() {
    const meal = this.state.currentMeal;
    const nutrition = meal && this.state.nutritionCache.get(meal.id);
    if (!nutrition) {
      this.notifier.warning("Nutrition data isn't ready for this meal yet");
      return;
    }

    const per = nutrition.perServing;
    const servings = await this.askServings(meal, per);
    if (!servings) return;

    const entry = this.logStore.add({
      type: "meal",
      refId: meal.id,
      name: meal.name,
      image: meal.thumbnail,
      quantity: servings,
      calories: round(per.calories * servings, 0),
      protein: round(per.protein * servings, 1),
      carbs: round(per.carbs * servings, 1),
      fat: round(per.fat * servings, 1)
    });
    this.notifier.logged({
      title: "Meal Logged!",
      name: meal.name,
      amount: `${servings} serving${servings === 1 ? "" : "s"}`,
      calories: entry.calories
    });
  }
}
