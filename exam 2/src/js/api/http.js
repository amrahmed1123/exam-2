import { API_BASE_URL } from "../config.js";

export const extractList = (payload) => {
  const data = payload?.results ?? payload?.result;
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

export class HttpClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  buildUrl(path, params = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  async request(path, { params, ...options } = {}) {
    const response = await fetch(this.buildUrl(path, params), options);
    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }
    if (!response.ok) {
      const failure = new Error(payload?.error?.message || payload?.message || `Request failed (${response.status})`);
      failure.status = response.status;
      throw failure;
    }
    return payload;
  }

  get(path, params) {
    return this.request(path, { params });
  }

  post(path, body, headers = {}) {
    return this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body)
    });
  }
}
