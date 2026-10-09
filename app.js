// ===== PART 1: Screens and the period picker =====

const $ = id => document.getElementById(id);

let currentView = "home";
let period = "month";       // "day", "week", "month" or "year"
let anchor = todayString(); // any date inside the period we are looking at

const VIEW_TITLES = { home: "My Budget", stats: "Stats", goals: "Goals", settings: "Settings" };
const PERIOD_EVERY = { day: "per day", week: "per week", month: "per month", year: "per year" };

function showView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach(s => { s.hidden = s.id !== "view-" + view; });
  document.querySelectorAll(".tabbar button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  $("view-title").textContent = VIEW_TITLES[view];
  $("period-bar").hidden = view !== "home" && view !== "stats";
  window.scrollTo(0, 0);
  render();
}

document.querySelectorAll(".tabbar button").forEach(b => {
  b.addEventListener("click", () => showView(b.dataset.view));
});

// Any button with data-goto="settings" (etc.) opens that screen
document.addEventListener("click", event => {
  const link = event.target.closest("[data-goto]");
  if (link) showView(link.dataset.goto);
});

$("period-tabs").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  period = button.dataset.period;
  render();
});
$("prev-period").addEventListener("click", () => { anchor = shiftAnchor(period, anchor, -1); render(); });
$("next-period").addEventListener("click", () => { anchor = shiftAnchor(period, anchor, 1); render(); });
$("period-label").addEventListener("click", () => { anchor = todayString(); render(); });

function renderPeriodBar() {
  document.querySelectorAll("#period-tabs button").forEach(b => b.classList.toggle("active", b.dataset.period === period));
  $("period-label").textContent = periodLabel(period, anchor);
}

// A small picture with a message, for empty lists
function emptyStateHTML(title, text) {
  return `<div class="empty">${pixelArt("sprout", 32)}<strong>${title}</strong>${text}</div>`;
}

// A short message at the top of the screen
let toastTimer;
function toast(message, kind = "info") {
  const el = $("toast");
  el.textContent = message;
  el.className = "toast " + kind;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}

// Pixel rabbits shown after a new Food, Beauty, Transport, Fun or Other expense.
// Each letter is one pixel; "." is empty.
const RABBIT_COLORS = {
  D: "#3d2b35", G: "#b6f0a8", P: "#f7a8c4", R: "#ffb8c6", p: "#ff8fab",
  K: "#2b1d24", W: "#ffffff", r: "#e34948", g: "#d8d2d6",
  N: "#f5e08a", n: "#d9b84a", C: "#8a5a3b", L: "#8fd3f0", Y: "#ffd84d",
  A: "#c8414f", a: "#8f2433", E: "#3f8f55", e: "#cfe9c6", V: "#b48ef0"
};

// Rows 0-16 (ears, eyes, nose) are the same for every rabbit
const NOODLE_RABBIT_PIXELS = [
  ".......DDDD..........DDDD.......",
  "......DGGGGD........DGGGGD......",
  "......DGPPGD........DGPPGD......",
  "......DGPPGD........DGPPGD......",
  "......DGPPGD........DGPPGD......",
  "......DGPPGD..DDD...DGPPGD......",
  "......DGGPGD.DGGGD..DGPGGD......",
  ".....DDGGGGDDDGGGDDDDGGGGDD.....",
  "....DGGGGGGGGGGGGGGGGGGGGGGD....",
  "...DGGGGGGGGGGGGGGGGGGGGGGGGD...",
  "...DGGGGGDDGGGGGGGGGGDDGGGGGD...",
  "...DGGGGDGGDGGGGGGGGDGGDGGGGD...",
  "...DGGGGGGGGGGGGGGGGGGGGGGGGD...",
  "...DGGGGKKKGGGGGGGGGGKKKGGGGD...",
  "...DGGGKKWKKGGGGGGGGKKWKKGGGD...",
  "...DGGGKKKKKGGGGGGGGKKKKKGGGD...",
  "...DGGGGKKKGGGGppGGGGKKKGGGGD...",
  "...DGRRRGGGGGGDGGDGGGGGGRRRGD...",
  "...DGRRRGGGGGDNnNNDGGGGGRRRGD...",
  "...DGGGGGGGGGGNnNNGGGGGpppGGD...",
  "....DGGGGGGGGNnNNGGGGGpWWWpD....",
  ".....DDDDDDDNnNNDDDDDDpWpWpD....",
  ".......DGGGGNnNNGGGGGGpWWWpD....",
  ".......DGGGGNnNNGGGGGGGpppCD....",
  "......DDDDDDNnNNDDDDDDDDDDDC....",
  "......DWrrWrrWrrWrrWrrWDGGGDC...",
  "....DDDDWWWWWWWWWWWWWWD.GGGD....",
  "...DGGGGDggggggggggggD..DDD.....",
  "...DDDDD.DggggggggggD...........",
  "..........DDDDDDDDDD............"
];
// The noodles: [row, first column]. Frame B moves the dark stripe so they look slurped up.
const RABBIT_NOODLES = [[18, 14], [19, 14], [20, 13], [21, 12], [22, 12], [23, 12], [24, 12]];

const BEAUTY_RABBIT_PIXELS = [
  ...NOODLE_RABBIT_PIXELS.slice(0, 17),
  "...DGRRRGGGGDGGDDGGDGGGGRRRGD...",
  "...DGRRRGGGGGDDGGDDGGGGGRRRGD...",
  "...DGGGGGGGGGGGGGGGGGGGGGGGGD...",
  "....DGGGGGGGGGGGGGGGGGGGGGGD....",
  ".....DDDDDDDDDDDDDDDDDDDDDD.....",
  "........DGGGGGGGGGGGGGGD........",
  ".......DGGDGGGGGGGGGGDGGD.......",
  ".......DGGDGGGGGGGGGGDGGD.......",
  ".......DGGGDGGGGGGGGDGGGD.......",
  ".......DGGGGGGGPPGGGGGGGD.......",
  ".......DGGGGGGGGGGGGGGGGD.......",
  ".......DGGGGDDDDDDDDGGGGD.......",
  "........DDDD........DDDD........"
];

// The car rabbit's head: eyes with lashes peeking over square sunglasses, and a sly smile
const CAR_HEAD_PIXELS = [
  ...NOODLE_RABBIT_PIXELS.slice(0, 10),
  "...DGGGGGGGGGGGGGGGGGGGGGGGGD...",
  "...DGGGKGKGKGGGGGGGGKGKGKGGGD...",
  "...DGGGGKKKGGGGGGGGGGKKKGGGGD...",
  "...DGGGGKWKGGGGGGGGGGKWKGGGGD...",
  "...DGGKKKKKKKGGGGGGKKKKKKKGGD...",
  "...DKKKKKKWKKKKKKKKKKKKWKKKKD...",
  "...DGGKKKWKKKGGppGGKKKWKKKGGD...",
  "...DGRKKKKKKKGGGGGGKKKKKKKRGD...",
  "...DGRRRGGGGGGGGGGGGGDGGRRRGD...",
  "...DGGGGGGDDDDDDDDDDDGGGGGGGD...",
  "....DGGGGGGGGGGGGGGGGGGGGGGD...."
];

// A red convertible facing left, 52 pixels wide. The head (columns 11-36) is drawn on top.
// The rabbit's shoulders show above the door and one arm rests on it, paw hanging over.
// Wheels are 9 pixels wide: front at columns 15-23, back at 39-47.
const CAR_WHEEL = ["AADKKKDAA", "ADKKKKKDA", "DKKKKKKKD", "DKKKgKKKD", "DKKKKKKKD", ".DKKKKKD.", "..DDDDD.."];
const CAR_PIXELS = [
  ...Array(21).fill(".".repeat(52)),
  ".".repeat(11) + "DG" + "D".repeat(22) + "GD" + ".".repeat(15),
  ".".repeat(9) + "DD" + "G".repeat(26) + "DD" + ".".repeat(13),
  ".".repeat(8) + "D" + "G".repeat(30) + "DDD" + ".".repeat(10),
  ".".repeat(7) + "D" + "G".repeat(28) + "D" + "G".repeat(6) + "D" + "DDDDDDD.",
  ".." + "D".repeat(34) + "D" + "G".repeat(6) + "D" + "AAaAAA" + "D.",
  ".DYYD" + "A".repeat(26) + "D" + "A".repeat(4) + "D" + "G".repeat(6) + "D" + "AAaAAA" + "D.",
  "DAYYD" + "A".repeat(23) + "ggA" + "D" + "A".repeat(4) + "D" + "G".repeat(6) + "D" + "AAaAAA" + "D.",
  "DAAA" + "g".repeat(8) + "A".repeat(19) + "D" + "A".repeat(5) + "D".repeat(6) + "A" + "AAaAAA" + "D.",
  "DAAAA" + "g".repeat(8) + "AA" + CAR_WHEEL[0] + "A".repeat(7) + "D" + "A".repeat(7) + CAR_WHEEL[0] + "AAD.",
  "D" + "A".repeat(14) + CAR_WHEEL[1] + "A".repeat(7) + "D" + "A".repeat(7) + CAR_WHEEL[1] + "AAD.",
  "D" + "A".repeat(14) + CAR_WHEEL[2] + "A".repeat(7) + "D" + "A".repeat(7) + CAR_WHEEL[2] + "AAD.",
  "." + "D".repeat(14) + CAR_WHEEL[3] + "D".repeat(15) + CAR_WHEEL[3] + "DDD.",
  ...CAR_WHEEL.slice(4).map(w => ".".repeat(15) + w + ".".repeat(15) + w + "....")
];

// A windshield leaning back from the hood (row 24) to its top bar (row 19), with see-through glass
const CAR_WINDSHIELD_FRAME = [];
const CAR_WINDSHIELD_GLASS = [];
for (let y = 20; y <= 24; y++) {
  const front = Math.round(8 + (24 - y) * 0.8);
  CAR_WINDSHIELD_FRAME.push([front, y, "D"], [front + 6, y, "D"]);
  for (let x = front + 1; x <= front + 5; x++) CAR_WINDSHIELD_GLASS.push([x, y, "L"]);
}
for (let x = 11; x <= 17; x++) CAR_WINDSHIELD_FRAME.push([x, 19, "D"]);

// Draw `top` over `base`, moved `dx` pixels to the right
function overlayPixels(base, top, dx) {
  return base.map((row, y) => [...row].map((c, x) => {
    const t = (top[y] || "")[x - dx];
    return t && t !== "." ? t : c;
  }).join(""));
}

// A star: a yellow plus with a white middle
function pixelStar(x, y) {
  return [[x, y, "W"], [x - 1, y, "Y"], [x + 1, y, "Y"], [x, y - 1, "Y"], [x, y + 1, "Y"]];
}

// A money rabbit: sunglasses, a big smile with buck teeth.
// One paw holds a stack of bills up high, the other is out to the side flicking bills away.
const MONEY_HEAD_PIXELS = [
  ...NOODLE_RABBIT_PIXELS.slice(0, 10),
  "...DGGGGGGGGGGGGGGGGGGGGGGGGD...",
  "...DGGGGGGGGGGGGGGGGGGGGGGGGD...",
  "...DGGKKKKKKKGGGGGGKKKKKKKGGD...",
  "...DKKKKKKWKKKKKKKKKKKKWKKKKD...",
  "...DGGKKKWKKKGGGGGGKKKWKKKGGD...",
  "...DGGKKKKKKKGGGGGGKKKKKKKGGD...",
  "...DGGGKKKKKGGGppGGGKKKKKGGGD...",
  "...DGRRRGGDGGGGGGGGGGDGGRRRGD...",
  "...DGRRRGGGDDDDDDDDDDGGGRRRGD...",
  "...DGGGGGGGGGGDWWDGGGGGGGGGGD...",
  "....DGGGGGGGGGDDDDGGGGGGGGGD....",
  ".....DDDDDDDDDDDDDDDDDDDDDD....."
];

// The body and arms, 40 pixels wide. The head (columns 7-32) is drawn on top.
// Extra empty rows at the bottom leave room for falling bills.
const MONEY_BODY_PIXELS = [
  ...Array(11).fill(".".repeat(40)),
  ".".repeat(34) + "DDDDD" + ".",
  ".".repeat(34) + "DEeED" + ".",
  ".".repeat(34) + "DEDED" + ".",
  ".".repeat(34) + "DWWWD" + ".",
  ".".repeat(34) + "DEDED" + ".",
  ".".repeat(34) + "DEeED" + ".",
  ".".repeat(33) + "DGGGGGD",
  "....DDD" + ".".repeat(26) + "DGGGGGD",
  "...DGGGD" + ".".repeat(24) + "DGGGGGD" + ".",
  "...DGGGD" + ".".repeat(23) + "DGGGGD" + "...",
  "....DGGGD" + ".".repeat(21) + "DGGGD" + ".....",
  ".....D" + "G".repeat(25) + "D" + ".".repeat(8),
  "......D" + "G".repeat(21) + "D" + ".".repeat(11),
  "......." + "DDDD" + "D" + "G".repeat(16) + "D" + ".".repeat(11),
  ".".repeat(11) + "D" + "G".repeat(16) + "D" + ".".repeat(11),
  ".".repeat(11) + "D" + "G".repeat(7) + "PP" + "G".repeat(7) + "D" + ".".repeat(11),
  ".".repeat(11) + "D" + "G".repeat(16) + "D" + ".".repeat(11),
  ".".repeat(11) + "DGGGGDDDDDDDDGGGGD" + ".".repeat(11),
  ".".repeat(12) + "DDDD" + ".".repeat(8) + "DDDD" + ".".repeat(12),
  ...Array(4).fill(".".repeat(40))
];

// An arm sticking out sideways: 4 pixels long, starting at column x, with its end on the `side` (-1 left, 1 right)
function pixelArm(x, y, side) {
  const end = side < 0 ? x - 1 : x + 4;
  return [x, x + 1, x + 2, x + 3].flatMap(ax => [[ax, y, "D"], [ax, y + 1, "G"], [ax, y + 2, "D"]]).concat([[end, y + 1, "D"]]);
}

// One piece of confetti: 2 pixels, lying flat (dx = 1) or standing up (dy = 1)
function pixelConfetti(x, y, color, dx, dy) {
  return [[x, y, color], [x + dx, y + dy, color]];
}

// One small bill, 3 pixels wide and 2 tall
function pixelBill(x, y) {
  return [[x, y, "E"], [x + 1, y, "W"], [x + 2, y, "E"], [x, y + 1, "E"], [x + 1, y + 1, "e"], [x + 2, y + 1, "E"]];
}

const RABBITS = {
  noodles: {
    pixels: NOODLE_RABBIT_PIXELS,
    frameA: [[1, 25, "L"], [2, 25, "L"], [1, 26, "L"], [2, 26, "L"]],
    frameB: [
      ...RABBIT_NOODLES.flatMap(([y, x]) => [[x + 1, y, "N"], [x + 2, y, "n"]]),
      [1, 17, "L"], [1, 18, "L"], [29, 21, "L"], [30, 21, "L"]
    ],
    text: "Yum!"
  },
  beauty: {
    pixels: BEAUTY_RABBIT_PIXELS,
    frameA: [...pixelStar(16, 2), ...pixelStar(1, 10), ...pixelStar(30, 15), [3, 26, "Y"], [27, 27, "p"]],
    frameB: [...pixelStar(29, 6), ...pixelStar(2, 22), ...pixelStar(29, 25), [12, 1, "Y"], [2, 4, "p"], [30, 19, "Y"]],
    text: "So pretty!"
  },
  car: {
    pixels: overlayPixels(CAR_PIXELS, CAR_HEAD_PIXELS, 8),
    // Drawn over the rabbit and car: windshield frame, steering wheel,
    // a second headlight in the grille, and a far-side wheel behind the car
    // (only its bottom, below the car body, shows)
    details: [
      ...CAR_WINDSHIELD_FRAME,
      [20, 22, "K"], [21, 22, "K"], [22, 22, "K"], [19, 23, "K"], [21, 23, "g"], [23, 23, "K"],
      [20, 24, "K"], [21, 24, "K"], [22, 24, "K"],
      [9, 26, "D"], [10, 26, "Y"], [11, 26, "Y"], [12, 26, "D"],
      [9, 27, "D"], [10, 27, "Y"], [11, 27, "Y"], [12, 27, "D"],
      ...CAR_WHEEL.slice(4).flatMap((row, i) => [...row].map((c, j) => [3 + j, 33 + i, c])).filter(p => p[2] !== ".")
    ],
    glass: CAR_WINDSHIELD_GLASS,
    // A: white headlights, wheel spokes up-down. B: a sparkle by the glasses, spokes left-right.
    // Both have a little exhaust puff behind the car.
    frameA: [
      [2, 26, "W"], [3, 26, "W"], [2, 27, "W"], [3, 27, "W"],
      [10, 26, "W"], [11, 26, "W"], [10, 27, "W"], [11, 27, "W"],
      [19, 31, "g"], [19, 33, "g"], [43, 31, "g"], [43, 33, "g"],
      [51, 28, "g"], [51, 31, "g"]
    ],
    frameB: [
      ...pixelStar(40, 13),
      [18, 32, "g"], [20, 32, "g"], [42, 32, "g"], [44, 32, "g"],
      [51, 29, "g"], [50, 33, "g"], [51, 33, "g"]
    ],
    // Shown for a moment now and then: the eyes close into a line
    blink: [
      ...[15, 16, 17, 18, 19, 28, 29, 30, 31, 32].map(x => [x, 12, "K"]),
      [16, 13, "G"], [17, 13, "G"], [18, 13, "G"], [29, 13, "G"], [30, 13, "G"], [31, 13, "G"]
    ],
    text: "Vroom!"
  },
  money: {
    pixels: overlayPixels(MONEY_BODY_PIXELS, MONEY_HEAD_PIXELS, 4),
    // A: a bill in the left paw. B: it's flicked away. Stars twinkle on both sides.
    frameA: [...pixelStar(3, 6), ...pixelBill(0, 17)],
    frameB: pixelStar(36, 6),
    // Flying bills: each falls and fades on its own loop, a little after the one before
    drops: [pixelBill(0, 13), pixelBill(4, 14), pixelBill(0, 22), pixelBill(3, 26), pixelBill(33, 24)],
    text: "Money, money!"
  },
  dance: {
    // The Beauty rabbit without stars. Its head is a separate layer that sways side to side.
    pixels: [...Array(22).fill(".".repeat(32)), ...BEAUTY_RABBIT_PIXELS.slice(22)],
    head: BEAUTY_RABBIT_PIXELS.slice(0, 22),
    // A: left arm high, right arm low. B: the other way round. Stars twinkle in different spots.
    frameA: [
      ...pixelArm(3, 22, -1), ...pixelArm(25, 25, 1),
      ...pixelStar(16, 2), ...pixelStar(1, 6), ...pixelStar(30, 19)
    ],
    frameB: [
      ...pixelArm(25, 22, 1), ...pixelArm(3, 25, -1),
      ...pixelStar(29, 3), ...pixelStar(1, 18), ...pixelStar(12, 1)
    ],
    // Confetti: each piece falls and fades on its own loop
    drops: [
      pixelConfetti(1, 2, "p", 1, 0), pixelConfetti(13, 4, "Y", 0, 1), pixelConfetti(18, 3, "L", 0, 1),
      pixelConfetti(28, 0, "V", 1, 0), pixelConfetti(0, 11, "Y", 0, 1), pixelConfetti(30, 9, "p", 0, 1),
      pixelConfetti(2, 14, "L", 1, 0), pixelConfetti(29, 14, "r", 1, 0), pixelConfetti(15, 0, "V", 1, 0),
      pixelConfetti(0, 22, "r", 0, 1), pixelConfetti(30, 25, "Y", 0, 1)
    ],
    text: "Party time!"
  }
};

function pixelRects(pixels) {
  return pixels.map(([x, y, c]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="${RABBIT_COLORS[c]}"/>`).join("");
}

function showRabbit(name) {
  const rabbit = RABBITS[name];
  document.querySelector(".rabbit-treat")?.remove();

  const rowsToPixels = rows => rows.flatMap((row, y) => [...row].map((c, x) => [x, y, c]).filter(p => p[2] !== "."));
  const base = rowsToPixels(rabbit.pixels);
  const width = Math.max(...rabbit.pixels.map(row => row.length));

  const el = document.createElement("div");
  el.className = "rabbit-treat";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${rabbit.pixels.length}" shape-rendering="crispEdges" style="width: ${width * 6}px">
      ${pixelRects(base)}
      ${pixelRects(rabbit.details || [])}
      <g opacity="0.5">${pixelRects(rabbit.glass || [])}</g>
      <g class="sway">${pixelRects(rowsToPixels(rabbit.head || []))}</g>
      <g class="frame-a">${pixelRects(rabbit.frameA)}</g>
      <g class="frame-b">${pixelRects(rabbit.frameB)}</g>
      <g class="blink">${pixelRects(rabbit.blink || [])}</g>
      ${(rabbit.drops || []).map((bill, i) => `<g class="drop" style="animation-delay: ${i * -0.3}s">${pixelRects(bill)}</g>`).join("")}
    </svg>
    <span>${rabbit.text}</span>`;
  el.addEventListener("animationend", event => { if (event.target === el) el.remove(); });
  document.body.appendChild(el);
}

// ===== PART 2: Home screen =====

function renderHome() {
  const { start, end } = periodRange(period, anchor);
  const list = transactionsBetween(start, end);
  const { income, expenses } = totals(list);
  const balance = income - expenses;

  $("total-income").textContent = formatMoney(income);
  $("total-expenses").textContent = formatMoney(expenses);
  $("balance").textContent = formatMoney(balance);
  $("balance").className = "hero-number " + (balance < 0 ? "negative" : "");

  renderBudgetProgress();
  renderTransactions(list);
}

function budgetInfo(budget) {
  if (budget.category === ALL_SPENDING) return { name: "All spending", icon: "👛" };
  return categoryInfo(budget.category, "expense");
}

// How much of a budget is used in the period that contains `date`
function budgetUsage(budget, date) {
  const { start, end } = periodRange(budget.period, date);
  const spent = spentOn(budget.category, start, end);
  const percent = Math.round((spent / budget.limit) * 100);
  let level = "ok";
  if (percent >= 100) level = "over";
  else if (percent >= 80) level = "warn";
  return { spent, percent, level };
}

function renderBudgetProgress() {
  const box = $("budget-list");
  if (state.budgets.length === 0) {
    box.innerHTML = '<p class="empty">No budgets yet. <button class="link-btn" data-goto="settings">Add one</button></p>';
    return;
  }

  box.innerHTML = state.budgets.map(b => {
    const info = budgetInfo(b);
    const { spent, percent, level } = budgetUsage(b, anchor);
    const left = b.limit - spent;
    const status = left >= 0 ? `${formatMoney(left)} left` : `${formatMoney(-left)} over!`;
    return `
      <div class="budget">
        <div class="budget-head">
          <span class="budget-icon">${escapeHTML(info.icon)}</span>
          <div class="budget-name">
            ${escapeHTML(info.name)}
            <small>${periodLabel(b.period, anchor)}</small>
          </div>
          <div class="budget-amount">
            ${formatMoney(spent)} / ${formatMoney(b.limit)}
            <small class="status ${level}">${status}</small>
          </div>
        </div>
        <div class="bar"><div class="fill ${level}" style="width: ${Math.min(percent, 100)}%"></div></div>
      </div>`;
  }).join("");
}

function renderTransactions(list) {
  const box = $("transaction-list");
  if (list.length === 0) {
    box.innerHTML = emptyStateHTML("No transactions here yet", "Tap + to add one.");
    return;
  }

  // Newest first. Reverse first so that, on the same day, the last one added is on top.
  const sorted = [...list].reverse().sort((a, b) => b.date.localeCompare(a.date));
  let html = "";
  let lastDate = "";

  sorted.forEach(t => {
    if (t.date !== lastDate) {
      lastDate = t.date;
      html += `<div class="date-head">${formatDate(t.date, { weekday: "short", day: "numeric", month: "short" })}</div>`;
    }
    const category = categoryInfo(t.category, t.type);
    const sign = t.type === "expense" ? "−" : "+";
    const tint = t.type === "income" ? "var(--green-soft)" : categoryColor(category) + "26";
    html += `
      <button class="tx" data-id="${escapeHTML(t.id)}">
        <span class="tx-icon" style="background: ${tint}">${escapeHTML(category.icon)}</span>
        <span class="tx-main">
          <strong>${escapeHTML(t.category)}</strong>
          ${t.note ? `<small>${escapeHTML(t.note)}</small>` : ""}
        </span>
        <span class="tx-amount ${t.type}-text">${sign}${formatMoney(t.amount)}</span>
      </button>`;
  });
  box.innerHTML = html;
}

$("transaction-list").addEventListener("click", event => {
  const row = event.target.closest("[data-id]");
  if (!row) return;
  const t = state.transactions.find(t => t.id === row.dataset.id);
  if (t) openTransactionDialog(t);
});

// ===== PART 3: Add / edit transaction =====

const transactionForm = $("transaction-form");
let editingTransactionId = null;

function selectedType() {
  return transactionForm.querySelector('input[name="type"]:checked').value;
}

// Show the categories as buttons with icons
function renderCategoryPicker(type, selected) {
  const categories = state.categories.filter(c => c.type === type);
  // Keep a deleted category visible when editing an old transaction
  if (selected && !categories.some(c => c.name === selected)) categories.push(categoryInfo(selected, type));
  const chosen = selected || (categories[0] && categories[0].name);

  $("category-picker").innerHTML = categories.map(c => `
    <label class="pick">
      <input type="radio" name="category" value="${escapeHTML(c.name)}" ${c.name === chosen ? "checked" : ""} required>
      <span><b>${escapeHTML(c.icon)}</b>${escapeHTML(c.name)}</span>
    </label>`).join("");
}

function openTransactionDialog(t) {
  editingTransactionId = t ? t.id : null;
  const type = t ? t.type : "expense";

  $("transaction-title").textContent = t ? "Edit transaction" : "Add transaction";
  transactionForm.querySelector(`input[name="type"][value="${type}"]`).checked = true;
  $("amount").value = t ? formatAmountInput(t.amount) : "";
  $("note").value = t ? t.note : "";
  $("delete-transaction").hidden = !t;

  if (t) {
    $("date").value = t.date;
  } else {
    // Today, unless you are looking at another period: then a day inside it
    const today = todayString();
    const { start, end } = periodRange(period, anchor);
    $("date").value = today >= start && today <= end ? today : (end < today ? end : start);
  }

  renderCategoryPicker(type, t ? t.category : null);
  $("transaction-dialog").showModal();
  if (!t) $("amount").focus();
}

$("add-button").addEventListener("click", () => openTransactionDialog(null));

transactionForm.querySelectorAll('input[name="type"]').forEach(radio => {
  radio.addEventListener("change", () => renderCategoryPicker(selectedType(), null));
});

transactionForm.addEventListener("submit", event => {
  event.preventDefault(); // stop the page from reloading

  const amount = roundMoney(parseAmount($("amount").value));
  if (!(amount > 0)) {
    toast("Please enter an amount greater than 0.", "warn");
    return;
  }

  const data = {
    type: selectedType(),
    amount,
    category: transactionForm.querySelector('input[name="category"]:checked').value,
    date: $("date").value,
    note: $("note").value.trim()
  };

  let transaction = state.transactions.find(t => t.id === editingTransactionId);
  if (transaction) {
    Object.assign(transaction, data);
  } else {
    transaction = { id: makeId(), ...data };
    state.transactions.push(transaction);
    if (transaction.type === "expense" && transaction.category === "Food") showRabbit("noodles");
    if (transaction.type === "expense" && transaction.category === "Beauty") showRabbit("beauty");
    if (transaction.type === "expense" && transaction.category === "Transport") showRabbit("car");
    if (transaction.type === "expense" && transaction.category === "Other") showRabbit("money");
    if (transaction.type === "expense" && transaction.category === "Fun") showRabbit("dance");
  }

  saveState();
  $("transaction-dialog").close();
  render();
  if (!checkBudgetAlert(transaction)) toast("Saved!", "ok");
});

$("delete-transaction").addEventListener("click", async () => {
  if (!await askConfirm("Delete this transaction?")) return;
  state.transactions = state.transactions.filter(t => t.id !== editingTransactionId);
  saveState();
  $("transaction-dialog").close();
  render();
});

// Warn when an expense pushes a budget to 80% or 100%.
// Returns true if a warning was shown.
function checkBudgetAlert(t) {
  if (t.type !== "expense") return false;

  let worst = null;
  state.budgets
    .filter(b => b.category === ALL_SPENDING || b.category === t.category)
    .forEach(b => {
      const usage = budgetUsage(b, t.date);
      if (usage.level !== "ok" && (!worst || usage.percent > worst.percent)) worst = { ...usage, budget: b };
    });

  if (!worst) return false;
  const name = budgetInfo(worst.budget).name;
  if (worst.level === "over") toast(`Over budget: you have used ${worst.percent}% of ${name}.`, "over");
  else toast(`Heads up: you have used ${worst.percent}% of ${name}.`, "warn");
  return true;
}

// ===== PART 4: Stats screen =====

function renderStats() {
  const { start, end } = periodRange(period, anchor);
  const expenses = transactionsBetween(start, end).filter(t => t.type === "expense");
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Average per day, counting only days that have already happened
  const today = todayString();
  const lastDay = end > today ? today : end;
  const days = start > today ? 0 : daysBetween(start, lastDay);
  $("stat-average").textContent = days > 0 ? formatMoney(roundMoney(total / days)) : "–";

  const biggest = expenses.reduce((best, t) => (!best || t.amount > best.amount ? t : best), null);
  $("stat-biggest").textContent = biggest ? formatMoney(biggest.amount) : "–";
  $("stat-biggest-note").textContent = biggest
    ? `${biggest.category}${biggest.note ? " · " + biggest.note : ""}`
    : " ";

  renderCategoryChart($("category-chart"), expenses);
  renderTimeChart($("time-chart"), expenses, period, start, end);
}

// ===== PART 5: Savings goals =====

function goalHint(goal) {
  const left = goal.target - goal.saved;
  if (left <= 0) return `${pixelArt("heart", 14)} Goal reached!`;
  if (!goal.deadline) return `${formatMoney(left)} to go`;

  const daysLeft = daysBetween(todayString(), goal.deadline) - 1;
  if (daysLeft < 0) return `${formatMoney(left)} to go · deadline passed`;
  if (daysLeft < 60) {
    const weeks = Math.max(1, daysLeft / 7);
    return `${daysLeft} days left · save ${formatMoney(roundMoney(left / weeks))} a week`;
  }
  const months = daysLeft / 30.44;
  return `${daysLeft} days left · save ${formatMoney(roundMoney(left / months))} a month`;
}

function renderGoals() {
  const box = $("goal-list");
  if (state.goals.length === 0) {
    box.innerHTML = `<div class="card">${emptyStateHTML("No goals yet", "What are you saving for?")}</div>`;
    return;
  }

  box.innerHTML = state.goals.map(g => {
    const percent = Math.min(100, Math.round((g.saved / g.target) * 100));
    const done = g.saved >= g.target;
    return `
      <div class="card goal ${done ? "done" : ""}" data-id="${escapeHTML(g.id)}">
        <div class="goal-head">
          <span class="goal-icon">${escapeHTML(g.icon)}</span>
          <div class="goal-name">
            <strong>${escapeHTML(g.name)}</strong>
            <small>${formatMoney(g.saved)} of ${formatMoney(g.target)}</small>
          </div>
          <button class="icon-btn" data-action="edit" aria-label="Edit goal">✎</button>
        </div>
        <div class="pixel-bar"><div class="pixel-fill" style="width: ${percent}%"></div></div>
        <div class="goal-foot">
          <span>${percent}% · ${goalHint(g)}</span>
          <button class="btn small" data-action="money">Add / take out</button>
        </div>
      </div>`;
  }).join("");
}

$("goal-list").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const goal = state.goals.find(g => g.id === button.closest("[data-id]").dataset.id);
  if (!goal) return;
  if (button.dataset.action === "edit") openGoalDialog(goal);
  else openMoneyDialog(goal);
});

let editingGoalId = null;

function openGoalDialog(goal) {
  editingGoalId = goal ? goal.id : null;
  $("goal-title").textContent = goal ? "Edit goal" : "New goal";
  $("goal-icon").value = goal ? goal.icon : "";
  $("goal-name").value = goal ? goal.name : "";
  $("goal-target").value = goal ? formatAmountInput(goal.target) : "";
  $("goal-saved").value = goal ? formatAmountInput(goal.saved) : "";
  $("goal-deadline").value = goal ? goal.deadline : "";
  $("delete-goal").hidden = !goal;
  $("goal-dialog").showModal();
}

$("new-goal").addEventListener("click", () => openGoalDialog(null));

$("goal-form").addEventListener("submit", event => {
  event.preventDefault();
  const target = roundMoney(parseAmount($("goal-target").value));
  if (!(target > 0)) {
    toast("Please enter a target greater than 0.", "warn");
    return;
  }

  const data = {
    icon: $("goal-icon").value.trim() || "⭐",
    name: $("goal-name").value.trim(),
    target,
    saved: Math.max(0, roundMoney(parseAmount($("goal-saved").value) || 0)),
    deadline: $("goal-deadline").value
  };

  const goal = state.goals.find(g => g.id === editingGoalId);
  if (goal) Object.assign(goal, data);
  else state.goals.push({ id: makeId(), ...data });

  saveState();
  $("goal-dialog").close();
  render();
});

$("delete-goal").addEventListener("click", async () => {
  if (!await askConfirm("Delete this goal?")) return;
  state.goals = state.goals.filter(g => g.id !== editingGoalId);
  saveState();
  $("goal-dialog").close();
  render();
});

let moneyGoalId = null;

function openMoneyDialog(goal) {
  moneyGoalId = goal.id;
  $("money-title").textContent = `${goal.icon} ${goal.name}`;
  $("money-hint").textContent = `Saved so far: ${formatMoney(goal.saved)} of ${formatMoney(goal.target)}`;
  $("money-amount").value = "";
  $("money-dialog").showModal();
  $("money-amount").focus();
}

$("money-form").addEventListener("submit", event => {
  event.preventDefault();
  const goal = state.goals.find(g => g.id === moneyGoalId);
  const amount = roundMoney(parseAmount($("money-amount").value));
  if (!goal || !(amount > 0)) {
    toast("Please enter an amount greater than 0.", "warn");
    return;
  }

  const wasDone = goal.saved >= goal.target;
  const takeOut = event.submitter && event.submitter.value === "take";
  goal.saved = takeOut ? Math.max(0, roundMoney(goal.saved - amount)) : roundMoney(goal.saved + amount);

  saveState();
  $("money-dialog").close();
  render();
  if (!wasDone && goal.saved >= goal.target) toast(`🎉 You reached your goal: ${goal.name}!`, "ok");
});

// ===== PART 6: Settings =====

function fillCurrencyOptions() {
  const names = new Intl.DisplayNames(["en"], { type: "currency" });
  $("currency").innerHTML = CURRENCIES
    .map(code => `<option value="${code}">${code} – ${names.of(code)}</option>`)
    .join("");
}

$("currency").addEventListener("change", event => {
  state.settings.currency = event.target.value;
  setupMoneyFormat();
  saveState();
  render();
});

function renderSettings() {
  $("currency").value = state.settings.currency;

  $("budget-settings-list").innerHTML = state.budgets.length === 0
    ? '<li class="empty">No budgets yet.</li>'
    : state.budgets.map(b => {
        const info = budgetInfo(b);
        return `
          <li data-id="${escapeHTML(b.id)}">
            <span class="budget-icon">${escapeHTML(info.icon)}</span>
            <div class="budget-name">
              ${escapeHTML(info.name)}
              <small>${formatMoney(b.limit)} ${PERIOD_EVERY[b.period]}</small>
            </div>
            <button class="btn small" data-action="edit">Edit</button>
          </li>`;
      }).join("");

  ["expense", "income"].forEach(type => {
    $(type + "-categories").innerHTML = state.categories
      .filter(c => c.type === type)
      .map(c => `
        <span class="chip ${type}">
          ${type === "expense" ? `<i class="color-dot" style="background: ${categoryColor(c)}"></i>` : ""}
          ${escapeHTML(c.icon)} ${escapeHTML(c.name)}
          <button data-id="${escapeHTML(c.id)}" aria-label="Remove ${escapeHTML(c.name)}">×</button>
        </span>`)
      .join("");
  });
}

// --- Budgets ---

let editingBudgetId = null;

function openBudgetDialog(budget) {
  editingBudgetId = budget ? budget.id : null;
  $("budget-title").textContent = budget ? "Edit budget" : "Add budget";

  const options = [{ value: ALL_SPENDING, label: "👛 All spending" }].concat(
    state.categories
      .filter(c => c.type === "expense")
      .map(c => ({ value: c.name, label: `${c.icon} ${c.name}` }))
  );
  if (budget && !options.some(o => o.value === budget.category)) {
    options.push({ value: budget.category, label: budget.category });
  }
  $("budget-category").innerHTML = options
    .map(o => `<option value="${escapeHTML(o.value)}">${escapeHTML(o.label)}</option>`)
    .join("");

  $("budget-category").value = budget ? budget.category : ALL_SPENDING;
  $("budget-period").value = budget ? budget.period : "month";
  $("budget-limit").value = budget ? formatAmountInput(budget.limit) : "";
  $("delete-budget").hidden = !budget;
  $("budget-dialog").showModal();
}

$("new-budget").addEventListener("click", () => openBudgetDialog(null));

$("budget-settings-list").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const budget = state.budgets.find(b => b.id === button.closest("[data-id]").dataset.id);
  if (budget) openBudgetDialog(budget);
});

$("budget-form").addEventListener("submit", event => {
  event.preventDefault();
  const limit = roundMoney(parseAmount($("budget-limit").value));
  if (!(limit > 0)) {
    toast("Please enter a limit greater than 0.", "warn");
    return;
  }
  const data = { category: $("budget-category").value, period: $("budget-period").value, limit };

  // Only one budget per category and period: update it if it already exists
  const budget = state.budgets.find(b => b.id === editingBudgetId)
    || state.budgets.find(b => b.category === data.category && b.period === data.period);
  if (budget) Object.assign(budget, data);
  else state.budgets.push({ id: makeId(), ...data });

  saveState();
  $("budget-dialog").close();
  render();
});

$("delete-budget").addEventListener("click", async () => {
  if (!await askConfirm("Delete this budget? Your transactions are kept.")) return;
  state.budgets = state.budgets.filter(b => b.id !== editingBudgetId);
  saveState();
  $("budget-dialog").close();
  render();
});

// --- Categories ---

$("category-form").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("category-name").value.trim();
  const type = $("category-type").value;
  const icon = $("category-icon").value.trim() || (type === "income" ? "💰" : "🏷️");
  if (!name) return;

  if (state.categories.some(c => c.type === type && c.name.toLowerCase() === name.toLowerCase())) {
    toast(`You already have a category called "${name}".`, "warn");
    return;
  }

  addCategoryTo(state, type, icon, name);
  saveState();
  $("category-form").reset();
  render();
});

["expense-categories", "income-categories"].forEach(id => {
  $(id).addEventListener("click", async event => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    const category = state.categories.find(c => c.id === button.dataset.id);
    if (!category) return;

    if (state.categories.filter(c => c.type === category.type).length === 1) {
      toast("You need at least one category of each type.", "warn");
      return;
    }
    if (!await askConfirm(`Remove the category "${category.name}"? Old transactions keep their category.`, "Remove")) return;

    state.categories = state.categories.filter(c => c.id !== category.id);
    saveState();
    render();
  });
});

// --- Backup ---

$("export-data").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `budget-backup-${todayString()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

$("import-data").addEventListener("change", async event => {
  const file = event.target.files[0];
  event.target.value = ""; // so the same file can be picked again
  if (!file) return;

  try {
    const imported = normalizeState(JSON.parse(await file.text()));
    if (!await askConfirm("Replace ALL your current data with this backup?", "Replace")) return;
    state = imported;
    saveState();
    setupMoneyFormat();
    render();
    toast("Backup loaded!", "ok");
  } catch (error) {
    console.error(error);
    toast("Could not read this file. Is it a backup from this app?", "over");
  }
});

$("reset-data").addEventListener("click", async () => {
  if (!await askConfirm("Delete ALL your transactions, budgets, goals and categories? This cannot be undone.", "Delete all")) return;
  state = normalizeState({ transactions: [] });
  saveState();
  setupMoneyFormat();
  render();
  toast("All data deleted.");
});

// ===== PART 7: Dialogs, redraw and startup =====

// Add commas to amount boxes while you type, and keep the cursor in the same place
document.querySelectorAll(".money-input").forEach(input => {
  input.addEventListener("input", () => {
    const typedBeforeCursor = input.value.slice(0, input.selectionStart).replace(/[^\d.]/g, "").length;
    input.value = formatAmountInput(input.value);

    let position = 0;
    let count = 0;
    while (position < input.value.length && count < typedBeforeCursor) {
      if (input.value[position] !== ",") count++;
      position++;
    }
    input.setSelectionRange(position, position);
  });
});

document.querySelectorAll("dialog").forEach(dialog => {
  // Close when tapping outside the box
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => dialog.close());
  });
});

// Our own "Are you sure?" box, used instead of the browser's confirm().
// Gives back true if the user pressed the red button.
function askConfirm(message, yesLabel = "Delete") {
  const dialog = $("confirm-dialog");
  $("confirm-message").textContent = message;
  $("confirm-yes").textContent = yesLabel;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise(resolve => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "yes"), { once: true });
  });
}

// Redraw the current screen from the current data
function render() {
  renderPeriodBar();
  if (currentView === "home") renderHome();
  if (currentView === "stats") renderStats();
  if (currentView === "goals") renderGoals();
  if (currentView === "settings") renderSettings();
}

// Start the app
loadState();
setupMoneyFormat();
fillCurrencyOptions();
document.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = pixelArt(el.dataset.icon, 22); });
$("title-icon").innerHTML = pixelArt("heart", 28);
$("hero-deco").innerHTML = pixelArt("sparkle", 12) + pixelArt("coin", 28);
showView("home");
