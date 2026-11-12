const PAGES = {
  home: { sections: ["search-filters-section", "meal-categories-section", "all-recipes-section"], nav: 0, title: "Meals & Recipes", text: "Discover delicious and nutritious recipes tailored for you" },
  details: { sections: ["meal-details"], nav: 0, title: "Recipe Details", text: "View full recipe information and nutrition facts" },
  products: { sections: ["products-section"], nav: 1, title: "Product Scanner", text: "Search packaged foods and check what is inside them" },
  foodlog: { sections: ["foodlog-section"], nav: 2, title: "Food Log", text: "Track your daily nutrition and food intake" }
};

const NAV_PATHS = ["#/home", "#/products", "#/foodlog"];
const NAV_ACTIVE = ["bg-emerald-50", "text-emerald-700"];
const NAV_IDLE = ["text-gray-600", "hover:bg-gray-50"];

export class Layout {
  constructor() {
    this.sidebar = document.getElementById("sidebar");
    this.overlay = document.getElementById("sidebar-overlay");
    this.menuButton = document.getElementById("header-menu-btn");
    this.closeButton = document.getElementById("sidebar-close-btn");
    this.loader = document.getElementById("app-loading-overlay");
    this.headerTitle = document.querySelector("#header h1");
    this.headerText = document.querySelector("#header p");
    this.navLinks = Array.from(document.querySelectorAll(".nav-link"));
    this.allSections = Object.values(PAGES).flatMap((page) => page.sections);
  }

  init() {
    this.navLinks.forEach((link, index) => {
      link.setAttribute("href", NAV_PATHS[index]);
      link.addEventListener("click", () => this.closeSidebar());
    });
    this.menuButton.addEventListener("click", () => this.toggleSidebar());
    this.closeButton.addEventListener("click", () => this.closeSidebar());
    this.overlay.addEventListener("click", () => this.closeSidebar());
  }

  toggleSidebar() {
    const open = this.sidebar.classList.toggle("open");
    this.overlay.classList.toggle("active", open);
  }

  closeSidebar() {
    this.sidebar.classList.remove("open");
    this.overlay.classList.remove("active");
  }

  setPage(name) {
    const page = PAGES[name];
    this.allSections.forEach((id) => {
      const section = document.getElementById(id);
      if (section) section.style.display = page.sections.includes(id) ? "" : "none";
    });
    this.headerTitle.textContent = page.title;
    this.headerText.textContent = page.text;
    this.navLinks.forEach((link, index) => {
      const active = index === page.nav;
      const label = link.querySelector("span");
      link.classList.remove(...(active ? NAV_IDLE : NAV_ACTIVE));
      link.classList.add(...(active ? NAV_ACTIVE : NAV_IDLE));
      label.classList.toggle("font-semibold", active);
      label.classList.toggle("font-medium", !active);
    });
    window.scrollTo({ top: 0 });
  }

  showLoader() {
    this.loader.classList.remove("loading");
    this.loader.style.opacity = "1";
  }

  hideLoader() {
    this.loader.style.opacity = "0";
    setTimeout(() => {
      this.loader.classList.add("loading");
      this.loader.style.opacity = "";
    }, 500);
  }
}
