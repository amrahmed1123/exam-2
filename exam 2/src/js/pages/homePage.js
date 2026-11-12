import { Components } from "../ui/components.js";
import { debounce } from "../utils/helpers.js";

const ACTIVE_CHIP = ["bg-emerald-600", "text-white", "hover:bg-emerald-700"];
const IDLE_CHIP = ["bg-gray-100", "text-gray-700", "hover:bg-gray-200"];

export class HomePage {
  constructor({ state, mealApi, layout, notifier, router }) {
    this.state = state;
    this.mealApi = mealApi;
    this.layout = layout;
    this.notifier = notifier;
    this.router = router;
    this.ticket = 0;
  }

  init() {
    this.searchInput = document.getElementById("search-input");
    this.areaBar = document.querySelector("#search-filters-section .overflow-x-auto");
    this.categoriesGrid = document.getElementById("categories-grid");
    this.recipesGrid = document.getElementById("recipes-grid");
    this.recipesCount = document.getElementById("recipes-count");
    this.gridButton = document.getElementById("grid-view-btn");
    this.listButton = document.getElementById("list-view-btn");
    this.viewAllButton = document.querySelector("#meal-categories-section button");

    this.searchInput.addEventListener("input", debounce(() => this.handleSearch(), 450));
    this.searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.handleSearch();
    });
    this.areaBar.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-area]");
      if (chip) this.selectArea(chip.dataset.area);
    });
    this.categoriesGrid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-category]");
      if (card) this.selectCategory(card.dataset.category);
    });
    this.viewAllButton.addEventListener("click", () => this.resetFilters());
    this.recipesGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".recipe-card");
      if (card) this.router.navigate(`/meal/${card.dataset.mealId}`);
    });
    this.gridButton.addEventListener("click", () => this.setView("grid"));
    this.listButton.addEventListener("click", () => this.setView("list"));
  }

  async preload() {
    this.recipesGrid.innerHTML = Components.spinner();
    const [categories, areas, meals] = await Promise.allSettled([
      this.mealApi.getCategories(),
      this.mealApi.getAreas(),
      this.mealApi.getStarterList()
    ]);
    this.state.categories = categories.status === "fulfilled" ? categories.value : [];
    this.state.areas = areas.status === "fulfilled" ? areas.value : [];
    this.state.starterMeals = meals.status === "fulfilled" ? meals.value : [];
    this.state.cacheMeals(this.state.starterMeals);

    this.renderAreas();
    this.renderCategories();
    this.showMeals(this.state.starterMeals);

    if ([categories, areas, meals].some((result) => result.status === "rejected")) {
      this.notifier.error("Some data could not be loaded");
    }
  }

  show() {
    this.layout.setPage("home");
  }

  renderAreas() {
    const chips = [Components.areaChip("All Cuisines", "", true)];
    this.state.areas.forEach((area) => chips.push(Components.areaChip(area, area, false)));
    this.areaBar.innerHTML = chips.join("");
  }

  renderCategories() {
    this.categoriesGrid.innerHTML = this.state.categories
      .map((category) => Components.categoryCard(category))
      .join("");
  }

  describe(count) {
    const { query, category, area } = this.state.filters;
    if (query) return `Showing ${count} results for "${query}"`;
    const label = [area, category].filter(Boolean).join(" ");
    return label ? `Showing ${count} ${label} recipes` : `Showing ${count} recipes`;
  }

  showMeals(meals) {
    this.state.meals = meals;
    this.recipesGrid.innerHTML = meals.length
      ? meals.map((meal) => Components.recipeCard(meal)).join("")
      : Components.emptyState({
          title: "No recipes found",
          text: "Try a different cuisine, category or search"
        });
    this.recipesCount.textContent = this.describe(meals.length);
  }

  markSelection() {
    const { category, area, query } = this.state.filters;
    this.categoriesGrid.querySelectorAll("[data-category]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.category === category);
    });
    this.areaBar.querySelectorAll("[data-area]").forEach((chip) => {
      const active = !query && chip.dataset.area === area;
      chip.classList.remove(...(active ? IDLE_CHIP : ACTIVE_CHIP));
      chip.classList.add(...(active ? ACTIVE_CHIP : IDLE_CHIP));
    });
  }

  async refresh() {
    const { query, category, area } = this.state.filters;
    const ticket = ++this.ticket;
    this.markSelection();

    if (!query && !category && !area) {
      this.showMeals(this.state.starterMeals);
      return;
    }

    this.recipesGrid.innerHTML = Components.spinner();
    try {
      const meals = query
        ? await this.mealApi.search(query)
        : await this.loadFiltered(category, area);
      if (ticket !== this.ticket) return;
      this.state.cacheMeals(meals);
      this.showMeals(meals);
    } catch (error) {
      if (ticket !== this.ticket) return;
      this.recipesGrid.innerHTML = Components.emptyState({
        icon: "fa-triangle-exclamation",
        title: "Couldn't load recipes",
        text: error.message
      });
      this.notifier.error("Something went wrong while loading recipes");
    }
  }

  async loadFiltered(category, area) {
    const matches = (meal) =>
      (!category || meal.category === category) && (!area || meal.area === area);
    let meals = (await this.mealApi.filter({ category, area })).filter(matches);
    if (!meals.length && category && area) {
      meals = (await this.mealApi.filter({ category }, 100)).filter(matches);
    }
    return meals;
  }

  handleSearch() {
    const query = this.searchInput.value.trim();
    if (query === this.state.filters.query) return;
    this.state.filters = { query, category: "", area: "" };
    this.refresh();
  }

  selectCategory(name) {
    const next = this.state.filters.category === name ? "" : name;
    this.searchInput.value = "";
    this.state.filters = { query: "", category: next, area: this.state.filters.area };
    this.refresh();
  }

  selectArea(name) {
    this.searchInput.value = "";
    this.state.filters = { query: "", category: this.state.filters.category, area: name };
    this.refresh();
  }

  resetFilters() {
    this.searchInput.value = "";
    this.state.filters = { query: "", category: "", area: "" };
    this.refresh();
  }

  setView(mode) {
    this.state.viewMode = mode;
    this.recipesGrid.classList.toggle("list-mode", mode === "list");
    [
      [this.gridButton, mode === "grid"],
      [this.listButton, mode === "list"]
    ].forEach(([button, active]) => {
      button.classList.toggle("bg-white", active);
      button.classList.toggle("shadow-sm", active);
      button.classList.toggle("rounded-md", true);
      const icon = button.querySelector("i");
      icon.classList.toggle("text-gray-700", active);
      icon.classList.toggle("text-gray-500", !active);
    });
  }
}
