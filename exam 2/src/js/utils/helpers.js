const HTML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const escapeHtml = (value = "") =>
  String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);

export const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(toNumber(value) * factor) / factor;
};

export const dateKey = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const formatLongDate = (date = new Date()) =>
  date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const debounce = (callback, wait = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), wait);
  };
};

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const youtubeEmbedUrl = (link) => {
  if (!link) return "";
  try {
    const url = new URL(link);
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
  } catch (error) {
    return "";
  }
  return "";
};
