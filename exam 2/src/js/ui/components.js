import { DAILY_GOALS } from "../config.js";
import { escapeHtml, formatTime, round, youtubeEmbedUrl } from "../utils/helpers.js";

const CATEGORY_LOOK = {
  Beef: { icon: "fa-drumstick-bite", accent: "#ef4444", accent2: "#f43f5e" },
  Chicken: { icon: "fa-drumstick-bite", accent: "#f59e0b", accent2: "#f97316" },
  Dessert: { icon: "fa-cake-candles", accent: "#ec4899", accent2: "#f43f5e" },
  Lamb: { icon: "fa-drumstick-bite", accent: "#f97316", accent2: "#ea580c" },
  Miscellaneous: { icon: "fa-bowl-food", accent: "#64748b", accent2: "#94a3b8" },
  Pasta: { icon: "fa-bowl-food", accent: "#eab308", accent2: "#f59e0b" },
  Pork: { icon: "fa-bacon", accent: "#ef4444", accent2: "#dc2626" },
  Seafood: { icon: "fa-fish", accent: "#0ea5e9", accent2: "#3b82f6" },
  Side: { icon: "fa-bowl-rice", accent: "#10b981", accent2: "#22c55e" },
  Starter: { icon: "fa-utensils", accent: "#14b8a6", accent2: "#06b6d4" },
  Vegan: { icon: "fa-leaf", accent: "#22c55e", accent2: "#16a34a" },
  Vegetarian: { icon: "fa-seedling", accent: "#84cc16", accent2: "#65a30d" },
  Breakfast: { icon: "fa-egg", accent: "#f59e0b", accent2: "#fbbf24" },
  Goat: { icon: "fa-drumstick-bite", accent: "#a16207", accent2: "#ca8a04" }
};

const FALLBACK_LOOK = { icon: "fa-utensils", accent: "#10b981", accent2: "#14b8a6" };

const TYPE_ICONS = { meal: "fa-utensils", product: "fa-barcode", custom: "fa-pencil" };

const percentOf = (value, goal) => (goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0);

export class Components {
  static spinner() {
    return `
      <div class="span-all flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>`;
  }

  static emptyState({ icon = "fa-search", title, text = "" }) {
    return `
      <div class="span-all flex flex-col items-center justify-center py-12 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i class="fa-solid ${icon} text-gray-400 text-2xl"></i>
        </div>
        <p class="text-gray-500 text-lg">${escapeHtml(title)}</p>
        <p class="text-gray-400 text-sm mt-2">${escapeHtml(text)}</p>
      </div>`;
  }

  static areaChip(label, value, active) {
    const tone = active
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200";
    return `
      <button class="area-filter-btn px-4 py-2 ${tone} rounded-full font-medium text-sm whitespace-nowrap transition-all" data-area="${escapeHtml(value)}">
        ${escapeHtml(label)}
      </button>`;
  }

  static categoryCard(category, selected = false) {
    const look = CATEGORY_LOOK[category.name] ?? FALLBACK_LOOK;
    return `
      <div class="category-card rounded-xl p-3 cursor-pointer group ${selected ? "is-selected" : ""}"
        data-category="${escapeHtml(category.name)}"
        style="--accent:${look.accent};--accent-2:${look.accent2}">
        <div class="flex items-center gap-2.5">
          <div class="category-icon text-white w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <i class="fa-solid ${look.icon}"></i>
          </div>
          <h3 class="text-sm font-bold text-gray-900">${escapeHtml(category.name)}</h3>
        </div>
      </div>`;
  }

  static summary(meal) {
    const first = (meal.instructions ?? []).find((line) => line && line.length > 30);
    if (!first) return "A delicious recipe worth trying.";
    return first.length > 110 ? `${first.slice(0, 107).trim()}...` : first;
  }

  static recipeCard(meal) {
    const area = meal.area || "International";
    return `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal-id="${escapeHtml(meal.id)}">
        <div class="card-media relative h-48 overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src="${escapeHtml(meal.thumbnail)}" alt="${escapeHtml(meal.name)}" loading="lazy" />
          <div class="absolute bottom-3 left-3 flex gap-2">
            <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">${escapeHtml(meal.category)}</span>
            <span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">${escapeHtml(area)}</span>
          </div>
        </div>
        <div class="card-body p-4">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${escapeHtml(meal.name)}</h3>
          <p class="text-xs text-gray-600 mb-3 line-clamp-2">${escapeHtml(Components.summary(meal))}</p>
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-gray-900"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHtml(meal.category)}</span>
            <span class="font-semibold text-gray-500"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(area)}</span>
          </div>
        </div>
      </div>`;
  }

  static mealDetails(meal) {
    const ingredients = meal.ingredients ?? [];
    const steps = (meal.instructions ?? []).filter((line) => line && line.trim().length > 1);
    const embed = youtubeEmbedUrl(meal.youtube);
    const tag = (meal.tags ?? [])[0];

    const ingredientRows = ingredients
      .map(
        ({ ingredient, measure }) => `
        <label class="ingredient-row flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
          <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
          <span class="text-gray-700"><span class="font-medium text-gray-900">${escapeHtml(measure)}</span> ${escapeHtml(ingredient)}</span>
        </label>`
      )
      .join("");

    const stepRows = steps
      .map(
        (step, index) => `
        <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${index + 1}</div>
          <p class="text-gray-700 leading-relaxed pt-2">${escapeHtml(step)}</p>
        </div>`
      )
      .join("");

    const video = embed
      ? `
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i class="fa-solid fa-video text-red-500"></i>
            Video Tutorial
          </h2>
          <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
            <iframe src="${escapeHtml(embed)}" class="absolute inset-0 w-full h-full" frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>`
      : "";

    return `
      <div class="max-w-7xl mx-auto">
        <button data-action="back" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back to Recipes</span>
        </button>

        <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div class="relative h-80 md:h-96">
            <img src="${escapeHtml(meal.thumbnail)}" alt="${escapeHtml(meal.name)}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-8">
              <div class="flex items-center gap-3 mb-3">
                <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${escapeHtml(meal.category)}</span>
                ${meal.area ? `<span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${escapeHtml(meal.area)}</span>` : ""}
                ${tag ? `<span class="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">${escapeHtml(tag)}</span>` : ""}
              </div>
              <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">${escapeHtml(meal.name)}</h1>
              <div class="flex items-center gap-6 text-white/90">
                <span class="flex items-center gap-2"><i class="fa-solid fa-list-check"></i><span>${ingredients.length} ingredients</span></span>
                <span class="flex items-center gap-2"><i class="fa-solid fa-utensils"></i><span id="hero-servings">-- servings</span></span>
                <span class="flex items-center gap-2"><i class="fa-solid fa-fire"></i><span id="hero-calories">Calculating...</span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 mb-8">
          <button id="log-meal-btn" data-action="log-meal" data-meal-id="${escapeHtml(meal.id)}"
            class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all">
            <i class="fa-solid fa-clipboard-list"></i>
            <span>Log This Meal</span>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-list-check text-emerald-600"></i>
                Ingredients
                <span class="text-sm font-normal text-gray-500 ml-auto">${ingredients.length} items</span>
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${ingredientRows}</div>
            </div>

            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-shoe-prints text-emerald-600"></i>
                Instructions
              </h2>
              <div class="space-y-4">${stepRows}</div>
            </div>

            ${video}
          </div>

          <div class="space-y-6">
            <div class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-chart-pie text-emerald-600"></i>
                Nutrition Facts
              </h2>
              <div id="nutrition-facts-container"></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  static nutritionLoading() {
    return `
      <div class="flex flex-col items-center justify-center py-10 text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        <p class="text-sm text-gray-500 mt-4">Analyzing ingredients...</p>
      </div>`;
  }

  static nutritionUnavailable(message, needsKey = false) {
    return `
      <div class="text-center py-6">
        <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <i class="fa-solid fa-triangle-exclamation text-gray-400 text-xl"></i>
        </div>
        <p class="font-semibold text-gray-700">Nutrition data isn't available</p>
        <p class="text-sm text-gray-500 mt-1">${escapeHtml(message)}</p>
        <button data-action="retry-nutrition" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all">
          ${needsKey ? "Enter API key" : "Try again"}
        </button>
      </div>`;
  }

  static nutritionFacts({ perServing: per, total, servings }) {
    const rows = [
      ["Protein", "bg-emerald-500", per.protein, DAILY_GOALS.protein],
      ["Carbs", "bg-blue-500", per.carbs, DAILY_GOALS.carbs],
      ["Fat", "bg-purple-500", per.fat, DAILY_GOALS.fat],
      ["Fiber", "bg-orange-500", per.fiber, 28],
      ["Sugar", "bg-pink-500", per.sugar, 50]
    ];
    const bars = rows
      .map(
        ([label, tone, value, goal]) => `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full ${tone}"></div>
            <span class="text-gray-700">${label}</span>
          </div>
          <span class="font-bold text-gray-900">${round(value, 1)}g</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2">
          <div class="${tone} h-2 rounded-full" style="width: ${percentOf(value, goal)}%"></div>
        </div>`
      )
      .join("");

    return `
      <p class="text-sm text-gray-500 mb-4">Per serving</p>
      <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
        <p class="text-sm text-gray-600">Calories per serving</p>
        <p class="text-4xl font-bold text-emerald-600">${round(per.calories, 0)}</p>
        <p class="text-xs text-gray-500 mt-1">Total: ${round(total.calories, 0)} cal</p>
      </div>
      <div class="space-y-4">${bars}</div>`;
  }

  static productCard(product) {
    const nutrients = product.nutrients ?? {};
    const grade = (product.nutritionGrade || "unknown").toLowerCase();
    const gradeText = grade === "unknown" ? "No Score" : `Nutri-Score ${grade.toUpperCase()}`;
    const image = product.image
      ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
      : `<i class="fa-solid fa-box-open text-gray-300 text-4xl"></i>`;
    const nova = product.novaGroup
      ? `<div class="nova-badge nova-${product.novaGroup}" title="NOVA ${product.novaGroup}">${product.novaGroup}</div>`
      : "";

    return `
      <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${escapeHtml(product.barcode)}">
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          ${image}
          <div class="score-badge grade-${grade}">${gradeText}</div>
          ${nova}
        </div>
        <div class="p-4">
          <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(product.brand || "Unknown brand")}</p>
          <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${escapeHtml(product.name)}</h3>
          <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span><i class="fa-solid fa-fire mr-1"></i>${round(nutrients.calories, 0)} kcal/100g</span>
          </div>
          <div class="grid grid-cols-4 gap-1 text-center">
            <div class="bg-emerald-50 rounded p-1.5">
              <p class="text-xs font-bold text-emerald-700">${round(nutrients.protein, 1)}g</p>
              <p class="text-[10px] text-gray-500">Protein</p>
            </div>
            <div class="bg-blue-50 rounded p-1.5">
              <p class="text-xs font-bold text-blue-700">${round(nutrients.carbs, 1)}g</p>
              <p class="text-[10px] text-gray-500">Carbs</p>
            </div>
            <div class="bg-purple-50 rounded p-1.5">
              <p class="text-xs font-bold text-purple-700">${round(nutrients.fat, 1)}g</p>
              <p class="text-[10px] text-gray-500">Fat</p>
            </div>
            <div class="bg-orange-50 rounded p-1.5">
              <p class="text-xs font-bold text-orange-700">${round(nutrients.sugar, 1)}g</p>
              <p class="text-[10px] text-gray-500">Sugar</p>
            </div>
          </div>
          <button data-action="log-product" class="product-log-btn mt-3 w-full py-2 rounded-lg text-sm font-semibold">
            <i class="fa-solid fa-plus mr-1"></i>Add to Food Log
          </button>
        </div>
      </div>`;
  }

  static productSheet(product) {
    const n = product.nutrients ?? {};
    const hasData = ["calories", "protein", "carbs", "fat"].some((key) => Number(n[key]) > 0);
    const tile = (label, value, unit) => `
      <div class="sheet-tile"><strong>${round(value, unit === "kcal" ? 0 : 1)}<small>${unit}</small></strong><span>${label}</span></div>`;
    return `
      <div class="sheet">
        <p class="sheet-brand">${escapeHtml(product.brand || "Unknown brand")}</p>
        <p class="sheet-hint">Nutrition per 100 g</p>
        <div class="sheet-grid">
          ${tile("Calories", n.calories, "kcal")}
          ${tile("Protein", n.protein, "g")}
          ${tile("Carbs", n.carbs, "g")}
          ${tile("Fat", n.fat, "g")}
          ${tile("Sugar", n.sugar, "g")}
          ${tile("Fiber", n.fiber, "g")}
        </div>
        ${hasData ? "" : `<p class="sheet-warning">This product has no nutrition values on record.</p>`}
        <label class="sheet-label" for="product-grams">How many grams did you have?</label>
        <input id="product-grams" type="number" min="1" step="1" value="100" class="swal2-input sheet-input" />
      </div>`;
  }

  static progressCard({ label, value, goal, unit, tint, bar, tone }) {
    const percent = percentOf(value, goal);
    const exceeded = value > goal && label !== "Protein";
    const digits = unit === "kcal" ? 0 : 1;
    const color = exceeded ? "tone-red" : tone;
    return `
      <div class="${tint} rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-gray-700">${label}</span>
          <span class="text-xs font-semibold ${color}">${percent}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="${exceeded ? "bg-red-500" : bar} h-2.5 rounded-full progress-fill" style="width: ${percent}%"></div>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-sm font-bold ${color}">${round(value, digits)} ${unit}</span>
          <span class="text-xs text-gray-500">/ ${goal} ${unit}</span>
        </div>
      </div>`;
  }

  static loggedItem(item) {
    const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.custom;
    const thumb = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="" class="log-thumb" />`
      : `<div class="log-thumb log-thumb-icon"><i class="fa-solid ${icon}"></i></div>`;
    let amount = "Custom entry";
    if (item.type === "meal") amount = `${item.quantity} serving${item.quantity === 1 ? "" : "s"}`;
    if (item.type === "product") amount = `${item.quantity} g`;
    return `
      <div class="log-item">
        ${thumb}
        <div class="log-info">
          <p class="log-name">${escapeHtml(item.name)}</p>
          <p class="log-meta">${amount} &middot; ${formatTime(item.loggedAt)}</p>
        </div>
        <div class="log-macros">
          <span class="macro-protein">${round(item.protein, 0)}g P</span>
          <span class="macro-carbs">${round(item.carbs, 0)}g C</span>
          <span class="macro-fat">${round(item.fat, 0)}g F</span>
        </div>
        <div class="log-calories"><strong>${round(item.calories, 0)}</strong><span>kcal</span></div>
        <button class="log-remove" data-action="remove-entry" data-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>`;
  }

  static todaySummary(entries, totals, goals) {
    const cards = [
      { label: "Calories", value: totals.calories, goal: goals.calories, unit: "kcal", tint: "bg-emerald-50", bar: "bg-emerald-500", tone: "tone-green" },
      { label: "Protein", value: totals.protein, goal: goals.protein, unit: "g", tint: "bg-blue-50", bar: "bg-blue-500", tone: "tone-blue" },
      { label: "Carbs", value: totals.carbs, goal: goals.carbs, unit: "g", tint: "bg-amber-50", bar: "bg-amber-500", tone: "tone-amber" },
      { label: "Fat", value: totals.fat, goal: goals.fat, unit: "g", tint: "bg-purple-50", bar: "bg-purple-500", tone: "tone-purple" }
    ];
    const banner =
      totals.calories > goals.calories
        ? `<div class="over-banner"><i class="fa-solid fa-triangle-exclamation"></i> You're ${round(totals.calories - goals.calories, 0)} kcal over today's limit.</div>`
        : "";
    const list = entries.length
      ? entries.map((entry) => Components.loggedItem(entry)).join("")
      : `
        <div class="log-empty">
          <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
          <p class="font-medium text-gray-700">No food logged today</p>
          <p class="text-sm text-gray-500">Start tracking your nutrition by logging meals or scanning products</p>
          <div class="log-empty-actions">
            <button data-action="goto-meals" class="btn-green"><i class="fa-solid fa-plus"></i> Browse Recipes</button>
            <button data-action="goto-products" class="btn-blue"><i class="fa-solid fa-barcode"></i> Scan Product</button>
          </div>
        </div>`;

    return `
      <h3 class="text-lg font-bold text-gray-900 mb-4">
        <i class="fa-solid fa-fire text-orange-500 mr-2"></i>
        Today's Nutrition
      </h3>
      ${banner}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${cards.map((card) => Components.progressCard(card)).join("")}
      </div>
      <div class="border-t border-gray-200 pt-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-gray-700">Logged Items (${entries.length})</h4>
          <button id="clear-foodlog" class="text-red-500 hover:text-red-600 text-sm font-medium" style="display: ${entries.length ? "" : "none"}">
            <i class="fa-solid fa-trash mr-1"></i>Clear All
          </button>
        </div>
        <div id="logged-items-list" class="space-y-2">${list}</div>
      </div>`;
  }

  static weeklyTiles(days, goal) {
    return days
      .map((day) => {
        const state = day.calories > goal ? "is-over" : day.calories > 0 ? "has-data" : "";
        const count = day.items ? `<span class="week-items">${day.items} item${day.items === 1 ? "" : "s"}</span>` : "";
        return `
          <div class="week-tile ${day.isToday ? "is-today" : ""}">
            <span class="week-day">${day.weekday}</span>
            <span class="week-date">${day.dayNumber}</span>
            <strong class="week-cal ${state}">${day.calories}</strong>
            <span class="week-unit">kcal</span>
            ${count}
          </div>`;
      })
      .join("");
  }

  static logModal(meal, perServing) {
    const stat = (value, label, tone) => `<div><strong class="${tone}">${value}</strong><span>${label}</span></div>`;
    return `
      <div class="log-modal">
        <div class="log-modal-head">
          <img src="${escapeHtml(meal.thumbnail)}" alt="" />
          <div>
            <h3>Log This Meal</h3>
            <p>${escapeHtml(meal.name)}</p>
          </div>
        </div>
        <label class="log-modal-label" for="servings-input">Number of Servings</label>
        <div class="stepper">
          <button type="button" data-step="-0.5" aria-label="Fewer servings"><i class="fa-solid fa-minus"></i></button>
          <input id="servings-input" type="number" min="0.5" step="0.5" value="1" />
          <button type="button" data-step="0.5" aria-label="More servings"><i class="fa-solid fa-plus"></i></button>
        </div>
        <div class="estimate">
          <p>Estimated nutrition per serving:</p>
          <div class="estimate-grid">
            ${stat(round(perServing.calories, 0), "Calories", "tone-green")}
            ${stat(`${round(perServing.protein, 0)}g`, "Protein", "tone-blue")}
            ${stat(`${round(perServing.carbs, 0)}g`, "Carbs", "tone-amber")}
            ${stat(`${round(perServing.fat, 0)}g`, "Fat", "tone-purple")}
          </div>
        </div>
      </div>`;
  }
}
