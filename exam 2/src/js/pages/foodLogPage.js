import { Components } from "../ui/components.js";
import { DAILY_GOALS } from "../config.js";
import { formatLongDate, toNumber } from "../utils/helpers.js";

const CUSTOM_FORM = `
  <div class="custom-form">
    <input id="custom-name" class="swal2-input" placeholder="Food name" />
    <input id="custom-calories" type="number" min="0" class="swal2-input" placeholder="Calories (kcal)" />
    <input id="custom-protein" type="number" min="0" class="swal2-input" placeholder="Protein (g)" />
    <input id="custom-carbs" type="number" min="0" class="swal2-input" placeholder="Carbs (g)" />
    <input id="custom-fat" type="number" min="0" class="swal2-input" placeholder="Fat (g)" />
  </div>`;

export class FoodLogPage {
  constructor({ logStore, layout, notifier, router }) {
    this.logStore = logStore;
    this.layout = layout;
    this.notifier = notifier;
    this.router = router;
  }

  init() {
    this.dateLabel = document.getElementById("foodlog-date");
    this.todaySection = document.getElementById("foodlog-today-section");
    this.week = document.getElementById("weekly-chart");
    this.quickButtons = Array.from(document.querySelectorAll(".quick-log-btn"));

    this.week.className = "weekly-grid";

    this.todaySection.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-action]");
      if (trigger) {
        const { action, id } = trigger.dataset;
        if (action === "remove-entry") this.removeEntry(id);
        if (action === "goto-meals") this.router.navigate("/home");
        if (action === "goto-products") this.router.navigate("/products");
        return;
      }
      if (event.target.closest("#clear-foodlog")) this.clearToday();
    });

    this.quickButtons[0].addEventListener("click", () => this.router.navigate("/home"));
    this.quickButtons[1].addEventListener("click", () => this.router.navigate("/products"));
    this.quickButtons[2].addEventListener("click", () => this.addCustomEntry());
  }

  show() {
    this.layout.setPage("foodlog");
    this.render();
  }

  render() {
    this.dateLabel.textContent = formatLongDate();
    this.todaySection.innerHTML = Components.todaySummary(
      this.logStore.forDay(),
      this.logStore.totalsFor(),
      DAILY_GOALS
    );
    this.week.innerHTML = Components.weeklyTiles(this.logStore.lastDays(7), DAILY_GOALS.calories);
  }

  removeEntry(id) {
    this.logStore.remove(id);
    this.render();
    this.notifier.success("Item removed");
  }

  async clearToday() {
    const agreed = await this.notifier.confirmClear();
    if (!agreed) return;
    this.logStore.clearDay();
    this.render();
    await this.notifier.fire({
      icon: "success",
      title: "Cleared!",
      text: "Your food log has been cleared.",
      showConfirmButton: false,
      timer: 1600
    });
    this.notifier.banner("Today's log cleared");
  }

  async addCustomEntry() {
    const result = await this.notifier.fire({
      title: "Custom entry",
      html: CUSTOM_FORM,
      showCancelButton: true,
      confirmButtonText: "Add to log",
      focusConfirm: false,
      preConfirm: () => {
        const read = (id) => document.getElementById(id).value;
        const name = read("custom-name").trim();
        const calories = toNumber(read("custom-calories"));
        if (!name) {
          window.Swal.showValidationMessage("Give the food a name");
          return false;
        }
        if (calories <= 0) {
          window.Swal.showValidationMessage("Calories must be greater than zero");
          return false;
        }
        return {
          name,
          calories,
          protein: toNumber(read("custom-protein")),
          carbs: toNumber(read("custom-carbs")),
          fat: toNumber(read("custom-fat"))
        };
      }
    });
    if (!result.isConfirmed) return;

    const entry = this.logStore.add({ type: "custom", quantity: 1, ...result.value });
    this.render();
    this.notifier.logged({
      title: "Entry Added!",
      name: entry.name,
      amount: "custom entry",
      calories: entry.calories
    });
  }
}
