// ===== Data, storage and helpers =====

const STORAGE_KEY = "budget-app-data";

// Chart colors for spending categories. Each category keeps its color for life,
// so adding or removing a category never repaints the others.
const CATEGORY_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const NO_COLOR = "#898781"; // used after all 8 colors are taken

const ALL_SPENDING = "__all__"; // a budget with this category covers every expense

const PERIODS = ["day", "week", "month", "year"];

const CURRENCIES = ["VND", "USD", "EUR", "GBP", "RUB", "UAH", "KZT", "JPY", "CNY", "KRW", "THB", "INR", "TRY", "PLN"];

// Money is always written like 1,000,000.00, whatever the currency
const MONEY_LOCALE = "en-US";

const DEFAULT_CATEGORIES = [
  ["expense", "🍜", "Food"],
  ["expense", "🚌", "Transport"],
  ["expense", "🛍️", "Shopping"],
  ["expense", "💡", "Bills"],
  ["expense", "🎮", "Fun"],
  ["expense", "💊", "Health"],
  ["expense", "💅", "Beauty"],
  ["expense", "✨", "Other"],
  ["income", "💼", "Salary"],
  ["income", "🎁", "Gift"],
  ["income", "💰", "Other income"]
];

// All app data lives here
let state = emptyState();

function emptyState() {
  return {
    settings: { currency: "VND" },
    categories: [],   // { id, type, icon, name, color }
    transactions: [], // { id, type, amount, category, date, note }
    budgets: [],      // { id, category, limit, period }
    goals: []         // { id, icon, name, target, saved, deadline }
  };
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Add a category. Spending categories get the first free chart color.
function addCategoryTo(data, type, icon, name) {
  let color = null;
  if (type === "expense") {
    const used = data.categories.map(c => c.color);
    const free = CATEGORY_COLORS.findIndex((_, i) => !used.includes(i));
    color = free === -1 ? null : free;
  }
  const category = { id: makeId(), type, icon, name, color };
  data.categories.push(category);
  return category;
}

// Turn saved or imported data into the current format.
// This also upgrades data saved by the first version of the app.
function normalizeState(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.transactions)) {
    throw new Error("This file is not budget app data.");
  }
  const data = emptyState();

  data.settings = { ...data.settings, ...(raw.settings || {}) };
  if (!CURRENCIES.includes(data.settings.currency)) data.settings.currency = "VND";

  data.transactions = raw.transactions
    .filter(t => t && typeof t.date === "string" && Number(t.amount) > 0)
    .map(t => ({
      id: String(t.id || makeId()),
      type: t.type === "income" ? "income" : "expense",
      amount: Number(t.amount),
      category: String(t.category || "Other"),
      date: t.date,
      note: String(t.note || "")
    }));

  if (Array.isArray(raw.budgets)) {
    data.budgets = raw.budgets.map(b => ({
      id: String(b.id || makeId()),
      category: String(b.category),
      limit: Number(b.limit),
      period: PERIODS.includes(b.period) ? b.period : "month"
    }));
  } else if (raw.budgets && typeof raw.budgets === "object") {
    // Old format: { "Food": 3000000 } meant a monthly budget
    data.budgets = Object.entries(raw.budgets).map(([category, limit]) => ({
      id: makeId(), category, limit: Number(limit), period: "month"
    }));
  }
  data.budgets = data.budgets.filter(b => b.limit > 0);

  if (Array.isArray(raw.goals)) {
    data.goals = raw.goals
      .map(g => ({
        id: String(g.id || makeId()),
        icon: String(g.icon || "⭐"),
        name: String(g.name || "Goal"),
        target: Number(g.target),
        saved: Math.max(0, Number(g.saved) || 0),
        deadline: typeof g.deadline === "string" ? g.deadline : ""
      }))
      .filter(g => g.target > 0);
  }

  if (Array.isArray(raw.categories) && raw.categories.length > 0) {
    data.categories = raw.categories.map(c => ({
      id: String(c.id || makeId()),
      type: c.type === "income" ? "income" : "expense",
      icon: String(c.icon || "🏷️"),
      name: String(c.name),
      color: Number.isInteger(c.color) ? c.color : null
    }));
  } else {
    DEFAULT_CATEGORIES.forEach(([type, icon, name]) => addCategoryTo(data, type, icon, name));
  }

  // Every category used by a transaction or budget must exist
  const exists = (name, type) => data.categories.some(c => c.name === name && c.type === type);

  // Beauty was added to the defaults later. Give it to older data once,
  // so it does not come back if the user deletes it.
  if (!data.settings.beautyAdded) {
    if (!exists("Beauty", "expense")) addCategoryTo(data, "expense", "💅", "Beauty");
    data.settings.beautyAdded = true;
  }

  data.transactions.forEach(t => {
    if (!exists(t.category, t.type)) addCategoryTo(data, t.type, t.type === "income" ? "💰" : "🏷️", t.category);
  });
  data.budgets.forEach(b => {
    if (b.category !== ALL_SPENDING && !exists(b.category, "expense")) addCategoryTo(data, "expense", "🏷️", b.category);
  });

  return data;
}

// Load saved data when the app starts
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  try {
    state = normalizeState(saved ? JSON.parse(saved) : { transactions: [] });
  } catch (error) {
    console.error("Could not load saved data:", error);
    // Keep a copy of the broken data so it is not lost
    if (saved) localStorage.setItem(STORAGE_KEY + "-broken", saved);
    state = normalizeState({ transactions: [] });
  }
}

// Save data after every change
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Could not save data:", error);
    toast("Could not save your data!", "over");
  }
}

// ----- Money -----

let moneyFormat, compactMoneyFormat, moneyDigits;

// Call again after the currency changes
function setupMoneyFormat() {
  const currency = state.settings.currency;
  moneyFormat = new Intl.NumberFormat(MONEY_LOCALE, { style: "currency", currency });
  compactMoneyFormat = new Intl.NumberFormat(MONEY_LOCALE, {
    style: "currency", currency, notation: "compact", maximumFractionDigits: 1
  });
  moneyDigits = moneyFormat.resolvedOptions().maximumFractionDigits;
}

function formatMoney(amount) {
  return moneyFormat.format(amount);
}

function formatCompactMoney(amount) {
  return compactMoneyFormat.format(amount);
}

// Round to what the currency allows, e.g. no cents for VND, 2 digits for USD
function roundMoney(amount) {
  const factor = 10 ** moneyDigits;
  return Math.round(amount * factor) / factor;
}

// Clean up what is typed in an amount box and add commas,
// e.g. "1234567.5" -> "1,234,567.5". Keeps only as many decimals as the currency allows.
function formatAmountInput(text) {
  const clean = String(text).replace(/[^\d.]/g, "");
  const dot = clean.indexOf(".");
  const whole = (dot === -1 ? clean : clean.slice(0, dot)).replace(/^0+(?=\d)/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (dot === -1 || moneyDigits === 0) return grouped;
  const decimals = clean.slice(dot + 1).replace(/\./g, "").slice(0, moneyDigits);
  return (grouped || "0") + "." + decimals;
}

// Read a number back from an amount box: "1,234,567.5" -> 1234567.5
function parseAmount(text) {
  return Number(String(text).replace(/,/g, ""));
}

// ----- Dates (always "YYYY-MM-DD" strings in local time) -----

const pad = n => String(n).padStart(2, "0");

function toDateString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayString() {
  return toDateString(new Date());
}

function parseDate(text) {
  const [y, m, d] = text.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(text, days) {
  const d = parseDate(text);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

// Number of days from start to end, counting both
function daysBetween(start, end) {
  return Math.round((parseDate(end) - parseDate(start)) / 86400000) + 1;
}

function formatDate(text, options) {
  return parseDate(text).toLocaleDateString("en-GB", options);
}

// First and last day of the day/week/month/year that contains `anchor`.
// Weeks start on Monday.
function periodRange(period, anchor) {
  const d = parseDate(anchor);
  if (period === "day") return { start: anchor, end: anchor };
  if (period === "week") {
    const start = addDays(anchor, -((d.getDay() + 6) % 7));
    return { start, end: addDays(start, 6) };
  }
  if (period === "month") {
    return {
      start: toDateString(new Date(d.getFullYear(), d.getMonth(), 1)),
      end: toDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    };
  }
  return { start: `${d.getFullYear()}-01-01`, end: `${d.getFullYear()}-12-31` };
}

// Move `anchor` one period back (step = -1) or forward (step = 1)
function shiftAnchor(period, anchor, step) {
  const d = parseDate(anchor);
  if (period === "day") return addDays(anchor, step);
  if (period === "week") return addDays(anchor, 7 * step);
  if (period === "month") return toDateString(new Date(d.getFullYear(), d.getMonth() + step, 1));
  return toDateString(new Date(d.getFullYear() + step, 0, 1));
}

function periodLabel(period, anchor) {
  const { start, end } = periodRange(period, anchor);
  const today = todayString();
  if (period === "day") {
    if (start === today) return "Today";
    if (start === addDays(today, -1)) return "Yesterday";
    return formatDate(start, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  if (period === "week") {
    const short = { day: "numeric", month: "short" };
    return `${formatDate(start, short)} – ${formatDate(end, short)} ${end.slice(0, 4)}`;
  }
  if (period === "month") return formatDate(start, { month: "long", year: "numeric" });
  return start.slice(0, 4);
}

// ----- Lookups -----

function transactionsBetween(start, end) {
  return state.transactions.filter(t => t.date >= start && t.date <= end);
}

function totals(list) {
  let income = 0;
  let expenses = 0;
  list.forEach(t => {
    if (t.type === "income") income += t.amount;
    else expenses += t.amount;
  });
  return { income, expenses };
}

// Money spent in one category (or ALL_SPENDING) between two dates
function spentOn(category, start, end) {
  return transactionsBetween(start, end)
    .filter(t => t.type === "expense" && (category === ALL_SPENDING || t.category === category))
    .reduce((sum, t) => sum + t.amount, 0);
}

function categoryInfo(name, type) {
  return state.categories.find(c => c.name === name && c.type === type)
    || { name, type, icon: "🏷️", color: null };
}

function categoryColor(category) {
  return category.color === null ? NO_COLOR : CATEGORY_COLORS[category.color];
}

// Make user-typed text safe to put inside HTML (also inside attributes)
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, ch => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}
