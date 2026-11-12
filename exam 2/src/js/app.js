import { MealApi } from "./api/mealdb.js";
import { NutritionApi } from "./api/nutrition.js";
import { ProductApi } from "./api/products.js";
import { DAILY_GOALS, LOG_STORAGE } from "./config.js";
import { DetailsPage } from "./pages/detailsPage.js";
import { FoodLogPage } from "./pages/foodLogPage.js";
import { HomePage } from "./pages/homePage.js";
import { ProductsPage } from "./pages/productsPage.js";
import { Router } from "./router.js";
import { AppState } from "./state/appState.js";
import { FoodLogStore } from "./state/foodLogStore.js";
import { Layout } from "./ui/layout.js";
import { Notifier } from "./ui/notifier.js";

export class App {
  constructor() {
    const shared = {
      state: new AppState(),
      logStore: new FoodLogStore(LOG_STORAGE, DAILY_GOALS),
      layout: new Layout(),
      notifier: new Notifier(),
      router: new Router(),
      mealApi: new MealApi(),
      productApi: new ProductApi(),
      nutritionApi: new NutritionApi()
    };
    this.layout = shared.layout;
    this.router = shared.router;
    this.pages = {
      home: new HomePage(shared),
      details: new DetailsPage(shared),
      products: new ProductsPage(shared),
      foodLog: new FoodLogPage(shared)
    };
  }

  async start() {
    this.layout.showLoader();
    this.layout.init();
    Object.values(this.pages).forEach((page) => page.init());

    this.router
      .add("/home", () => this.pages.home.show())
      .add("/meal/:id", (params) => this.pages.details.show(params))
      .add("/products", () => this.pages.products.show())
      .add("/foodlog", () => this.pages.foodLog.show());

    await Promise.all([Notifier.ensureLoaded(), this.pages.home.preload()]);
    this.router.start();
    this.layout.hideLoader();
  }
}
