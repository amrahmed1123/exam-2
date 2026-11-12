import { dateKey, round, toNumber, uid } from "../utils/helpers.js";

const emptyTotals = () => ({ calories: 0, protein: 0, carbs: 0, fat: 0 });

export class FoodLogStore {
  constructor(storageKey, goals) {
    this.storageKey = storageKey;
    this.goals = goals;
    this.entries = this.load();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey));
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
    } catch (error) {
      console.warn("Food log could not be saved");
    }
  }

  add(entry) {
    const item = {
      id: uid(),
      date: dateKey(),
      loggedAt: new Date().toISOString(),
      ...entry
    };
    this.entries.push(item);
    this.persist();
    return item;
  }

  remove(id) {
    this.entries = this.entries.filter((entry) => entry.id !== id);
    this.persist();
  }

  clearDay(key = dateKey()) {
    this.entries = this.entries.filter((entry) => entry.date !== key);
    this.persist();
  }

  forDay(key = dateKey()) {
    return this.entries
      .filter((entry) => entry.date === key)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  }

  totalsFor(key = dateKey()) {
    const sums = this.forDay(key).reduce((acc, entry) => {
      acc.calories += toNumber(entry.calories);
      acc.protein += toNumber(entry.protein);
      acc.carbs += toNumber(entry.carbs);
      acc.fat += toNumber(entry.fat);
      return acc;
    }, emptyTotals());
    return {
      calories: round(sums.calories, 0),
      protein: round(sums.protein, 1),
      carbs: round(sums.carbs, 1),
      fat: round(sums.fat, 1)
    };
  }

  lastDays(count = 7) {
    const days = [];
    const today = dateKey();
    for (let offset = count - 1; offset >= 0; offset--) {
      const day = new Date();
      day.setDate(day.getDate() - offset);
      const key = dateKey(day);
      days.push({
        key,
        weekday: day.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: day.getDate(),
        isToday: key === today,
        items: this.forDay(key).length,
        ...this.totalsFor(key)
      });
    }
    return days;
  }
}
