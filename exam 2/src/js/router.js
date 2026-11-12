export class Router {
  constructor() {
    this.routes = [];
  }

  add(pattern, handler) {
    const keys = [];
    const source = pattern.replace(/:([a-zA-Z]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });
    this.routes.push({ regex: new RegExp(`^${source}$`), keys, handler });
    return this;
  }

  start() {
    window.addEventListener("hashchange", () => this.resolve());
    this.resolve();
  }

  navigate(path) {
    if (window.location.hash === `#${path}`) {
      this.resolve();
    } else {
      window.location.hash = path;
    }
  }

  resolve() {
    const path = window.location.hash.replace(/^#/, "");
    if (!path) {
      history.replaceState(null, "", "#/home");
    }
    const target = path || "/home";
    for (const route of this.routes) {
      const match = target.match(route.regex);
      if (match) {
        const params = {};
        route.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });
        route.handler(params);
        return;
      }
    }
    this.navigate("/home");
  }
}
