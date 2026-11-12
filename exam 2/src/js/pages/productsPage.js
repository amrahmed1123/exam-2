import { Components } from "../ui/components.js";
import { round } from "../utils/helpers.js";

const CATEGORY_SLUGS = {
  snacks: "snacks",
  beverages: "beverages",
  breakfast: "breakfast-cereals",
  desserts: "desserts",
  dairy: "dairies"
};

export class ProductsPage {
  constructor({ state, productApi, logStore, layout, notifier }) {
    this.state = state;
    this.productApi = productApi;
    this.logStore = logStore;
    this.layout = layout;
    this.notifier = notifier;
    this.ticket = 0;
  }

  init() {
    this.nameInput = document.getElementById("product-search-input");
    this.barcodeInput = document.getElementById("barcode-input");
    this.searchButton = document.getElementById("search-product-btn");
    this.barcodeButton = document.getElementById("lookup-barcode-btn");
    this.grid = document.getElementById("products-grid");
    this.count = document.getElementById("products-count");
    this.gradeButtons = Array.from(document.querySelectorAll(".nutri-score-filter"));
    this.categoryButtons = Array.from(document.querySelectorAll(".product-category-btn"));

    this.showIntro();

    this.searchButton.addEventListener("click", () => this.searchByName());
    this.nameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.searchByName();
    });
    this.barcodeButton.addEventListener("click", () => this.lookupBarcode());
    this.barcodeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.lookupBarcode();
    });
    this.gradeButtons.forEach((button) =>
      button.addEventListener("click", () => this.setGrade(button.dataset.grade))
    );
    this.categoryButtons.forEach((button) =>
      button.addEventListener("click", () => this.searchByCategory(button))
    );
    this.grid.addEventListener("click", (event) => {
      const card = event.target.closest(".product-card");
      if (card) this.openSheet(card.dataset.barcode);
    });
  }

  show() {
    this.layout.setPage("products");
  }

  showIntro() {
    this.grid.innerHTML = Components.emptyState({
      icon: "fa-barcode",
      title: "Search for products to see results",
      text: "Type a name, enter a barcode, or pick a category"
    });
    this.count.textContent = "Search for products to see results";
  }

  async load(loader, emptyTitle) {
    const ticket = ++this.ticket;
    this.grid.innerHTML = Components.spinner();
    this.count.textContent = "Searching...";
    try {
      const { items, total } = await loader();
      if (ticket !== this.ticket) return;
      this.state.products = items;
      this.state.productTotal = total;
      this.renderProducts(emptyTitle);
    } catch (error) {
      if (ticket !== this.ticket) return;
      this.state.products = [];
      if (error.status === 404) {
        this.renderProducts(emptyTitle);
        return;
      }
      this.grid.innerHTML = Components.emptyState({
        icon: "fa-triangle-exclamation",
        title: "Couldn't load products",
        text: error.message
      });
      this.count.textContent = "Something went wrong";
      this.notifier.error("Product request failed");
    }
  }

  renderProducts(emptyTitle = "No products found") {
    const grade = this.state.productGrade;
    const visible = this.state.products.filter((product) =>
      grade ? (product.nutritionGrade || "").toLowerCase() === grade : true
    );
    if (!visible.length) {
      this.grid.innerHTML = Components.emptyState({
        title: grade ? `No products with Nutri-Score ${grade.toUpperCase()}` : emptyTitle,
        text: grade ? "Try another grade or clear the filter" : "Try a different name or barcode"
      });
      this.count.textContent = "0 products";
      return;
    }
    this.grid.innerHTML = visible.map((product) => Components.productCard(product)).join("");
    const total = this.state.productTotal;
    this.count.textContent =
      total > visible.length && !grade
        ? `Showing ${visible.length} of ${total} products`
        : `${visible.length} product${visible.length === 1 ? "" : "s"} found`;
  }

  setGrade(grade) {
    this.state.productGrade = grade;
    this.gradeButtons.forEach((button) => {
      const active = button.dataset.grade === grade;
      button.classList.toggle("is-active", active);
      if (button.dataset.grade === "") {
        button.classList.toggle("bg-emerald-600", active);
        button.classList.toggle("text-white", active);
        button.classList.toggle("bg-gray-100", !active);
        button.classList.toggle("text-gray-700", !active);
      }
    });
    if (this.state.products.length) this.renderProducts();
  }

  clearCategory() {
    this.categoryButtons.forEach((button) => button.classList.remove("is-picked"));
  }

  searchByName() {
    const query = this.nameInput.value.trim();
    if (!query) {
      this.notifier.warning("Type a product name first");
      return;
    }
    this.clearCategory();
    this.load(() => this.productApi.search(query), `No products matched "${query}"`);
  }

  lookupBarcode() {
    const code = this.barcodeInput.value.replace(/\D/g, "");
    if (!code) {
      this.notifier.warning("Enter a barcode number first");
      return;
    }
    this.clearCategory();
    this.load(async () => {
      const product = await this.productApi.byBarcode(code);
      return { items: product ? [product] : [], total: product ? 1 : 0 };
    }, "No product found for that barcode");
  }

  searchByCategory(button) {
    const label = button.textContent.trim().toLowerCase();
    this.clearCategory();
    button.classList.add("is-picked");
    this.nameInput.value = "";
    this.load(async () => {
      const first = await this.productApi.byCategory(CATEGORY_SLUGS[label] ?? label);
      if (first.items.length) return first;
      return this.productApi.byCategory(label);
    }, `No products in ${label}`);
  }

  async openSheet(barcode) {
    const product = this.state.products.find((item) => String(item.barcode) === String(barcode));
    if (!product) return;

    const result = await this.notifier.fire({
      title: product.name,
      imageUrl: product.image || undefined,
      imageHeight: 120,
      html: Components.productSheet(product),
      showCancelButton: true,
      confirmButtonText: "Add to Food Log",
      focusConfirm: false,
      preConfirm: () => {
        const grams = Number(document.getElementById("product-grams").value);
        if (!grams || grams <= 0) {
          window.Swal.showValidationMessage("Enter the amount in grams");
          return false;
        }
        return grams;
      }
    });
    if (!result.isConfirmed) return;

    const grams = result.value;
    const factor = grams / 100;
    const n = product.nutrients ?? {};
    const entry = this.logStore.add({
      type: "product",
      refId: product.barcode,
      name: product.name,
      image: product.image || "",
      quantity: grams,
      calories: round((n.calories ?? 0) * factor, 0),
      protein: round((n.protein ?? 0) * factor, 1),
      carbs: round((n.carbs ?? 0) * factor, 1),
      fat: round((n.fat ?? 0) * factor, 1)
    });
    this.notifier.logged({
      title: "Product Logged!",
      name: product.name,
      amount: `${grams} g`,
      calories: entry.calories
    });
  }
}
