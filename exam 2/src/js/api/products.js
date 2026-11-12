import { HttpClient, extractList } from "./http.js";
import { PRODUCTS_LIMIT } from "../config.js";

export class ProductApi {
  constructor(http = new HttpClient()) {
    this.http = http;
  }

  packResults(payload) {
    const items = extractList(payload);
    return { items, total: payload?.pagination?.total ?? items.length };
  }

  async search(query, limit = PRODUCTS_LIMIT) {
    return this.packResults(await this.http.get("/products/search", { q: query, page: 1, limit }));
  }

  async byCategory(category, limit = PRODUCTS_LIMIT) {
    const path = `/products/category/${encodeURIComponent(category)}`;
    return this.packResults(await this.http.get(path, { page: 1, limit }));
  }

  async byBarcode(code) {
    const payload = await this.http.get(`/products/barcode/${encodeURIComponent(code)}`);
    return payload?.result ?? null;
  }
}
