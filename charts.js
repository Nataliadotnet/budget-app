// ===== Charts =====

// One bar per category, biggest first
function renderCategoryChart(box, expenses) {
  const sums = {};
  expenses.forEach(t => { sums[t.category] = (sums[t.category] || 0) + t.amount; });
  const rows = Object.entries(sums).sort((a, b) => b[1] - a[1]);

  if (rows.length === 0) {
    box.innerHTML = emptyStateHTML("Nothing spent here", "Your spending by category will show up here.");
    return;
  }

  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  const biggest = rows[0][1];

  box.innerHTML = rows.map(([name, amount]) => {
    const category = categoryInfo(name, "expense");
    const percent = Math.round((amount / total) * 100);
    return `
      <div class="cat-row">
        <span class="cat-icon">${escapeHTML(category.icon)}</span>
        <div class="cat-main">
          <div class="cat-top">
            <span>${escapeHTML(name)}</span>
            <span>${formatMoney(amount)} · ${percent}%</span>
          </div>
          <div class="hbar">
            <div class="hbar-fill" style="width: ${(amount / biggest) * 100}%; background: ${categoryColor(category)}"></div>
          </div>
        </div>
      </div>`;
  }).join("") + '<div class="chart pie-chart"></div>';

  renderPieChart(box.querySelector(".pie-chart"), rows, total);
}

// Ring-shaped pie chart: one slice per category, total in the middle
function renderPieChart(box, rows, total) {
  const size = 200, center = size / 2, radius = 70, thickness = 34, gap = 2;
  const length = 2 * Math.PI * radius;

  let used = 0;
  const slices = rows.map(([name, amount]) => {
    const category = categoryInfo(name, "expense");
    const share = amount / total;
    const slice = { name, amount, category, start: used, share };
    used += share;
    return slice;
  });

  // Each slice is a dash on one circle; a small gap keeps neighbors apart
  const marks = slices.map((s, i) => {
    const dash = rows.length === 1 ? length : Math.max(0.5, s.share * length - gap);
    return `<circle class="pie-slice" data-i="${i}" cx="${center}" cy="${center}" r="${radius}"
      stroke="${categoryColor(s.category)}" stroke-width="${thickness}"
      stroke-dasharray="${dash} ${length}" stroke-dashoffset="${-s.start * length}"/>`;
  }).join("");

  // Percent in the middle of each slice; slices under 5% are too thin for text
  const labels = slices.filter(s => s.share >= 0.05).map(s => {
    const angle = (s.start + s.share / 2) * 2 * Math.PI - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return `<text class="pie-percent" x="${x}" y="${y + 4}" text-anchor="middle">${Math.round(s.share * 100)}%</text>`;
  }).join("");

  box.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending by category, pie chart">
      <g transform="rotate(-90 ${center} ${center})">${marks}</g>
      ${labels}
      <text class="pie-label" x="${center}" y="${center - 4}" text-anchor="middle">Total</text>
      <text class="pie-total" x="${center}" y="${center + 14}" text-anchor="middle">${formatCompactMoney(total)}</text>
    </svg>
    <div class="chart-tip" hidden></div>`;

  const tip = box.querySelector(".chart-tip");

  function showTip(mark) {
    const s = slices[Number(mark.dataset.i)];
    box.querySelectorAll(".pie-slice").forEach(m => m.classList.toggle("dim", m !== mark));
    tip.textContent = `${s.category.icon} ${s.name}: ${formatMoney(s.amount)} · ${Math.round(s.share * 100)}%`;
    tip.style.left = "50%";
    tip.hidden = false;
  }

  function hideTip() {
    box.querySelectorAll(".pie-slice").forEach(m => m.classList.remove("dim"));
    tip.hidden = true;
  }

  box.querySelectorAll(".pie-slice").forEach(mark => {
    mark.addEventListener("pointerenter", () => showTip(mark));
    mark.addEventListener("click", () => showTip(mark));
  });
  box.querySelector("svg").addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse") hideTip();
  });
}

// Split a period into bars: days for a week or month, months for a year
function timeBuckets(period, start, end) {
  if (period === "week" || period === "month") {
    return Array.from({ length: daysBetween(start, end) }, (_, i) => {
      const day = addDays(start, i);
      return {
        start: day,
        end: day,
        short: period === "week" ? formatDate(day, { weekday: "short" }) : String(parseDate(day).getDate()),
        long: formatDate(day, { weekday: "short", day: "numeric", month: "short" })
      };
    });
  }
  if (period === "year") {
    const year = Number(start.slice(0, 4));
    return Array.from({ length: 12 }, (_, m) => {
      const first = `${year}-${pad(m + 1)}-01`;
      return {
        start: first,
        end: toDateString(new Date(year, m + 1, 0)),
        short: formatDate(first, { month: "short" }),
        long: formatDate(first, { month: "long", year: "numeric" })
      };
    });
  }
  return []; // a single day has nothing to split
}

// A round number just above `value`, used as the top of the chart
function niceMax(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * magnitude >= value) return step * magnitude;
  }
  return 10 * magnitude;
}

// A bar with rounded top corners, sitting on the baseline
function barPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

// Bar chart of spending over time, with a tooltip on hover or tap
function renderTimeChart(box, expenses, period, start, end) {
  const buckets = timeBuckets(period, start, end);
  if (buckets.length === 0) {
    box.innerHTML = '<p class="empty">Pick Week, Month or Year to see this chart.</p>';
    return;
  }

  const values = buckets.map(b =>
    expenses.filter(t => t.date >= b.start && t.date <= b.end).reduce((sum, t) => sum + t.amount, 0)
  );
  if (values.every(v => v === 0)) {
    box.innerHTML = emptyStateHTML("Nothing spent here", "Your spending over time will show up here.");
    return;
  }

  const W = 340, H = 170;
  const left = 50, right = 4, top = 10, bottom = 22;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const max = niceMax(Math.max(...values));
  const slot = plotW / buckets.length;
  const gap = Math.max(2, slot * 0.25);
  const barW = slot - gap;

  let svg = "";

  // Grid lines and money labels on the left
  [0, 0.5, 1].forEach(f => {
    const y = top + plotH - f * plotH;
    svg += `<line class="${f === 0 ? "base-line" : "grid-line"}" x1="${left}" x2="${W - right}" y1="${y}" y2="${y}"/>`;
    svg += `<text class="axis-text" x="${left - 6}" y="${y + 3}" text-anchor="end">${formatCompactMoney(max * f)}</text>`;
  });

  buckets.forEach((b, i) => {
    const x = left + i * slot + gap / 2;
    const h = (values[i] / max) * plotH;
    const y = top + plotH - h;
    const day = i + 1;
    const showLabel = period !== "month" || day === 1 || day % 5 === 0;

    svg += `<g class="bar-group" data-i="${i}">`;
    if (h > 0) svg += `<path class="bar-mark" d="${barPath(x, y, barW, h, 4)}"/>`;
    // A wide, invisible target so small bars are easy to hover or tap
    svg += `<rect class="bar-hit" x="${left + i * slot}" y="${top}" width="${slot}" height="${plotH}"/></g>`;
    if (showLabel) {
      svg += `<text class="axis-text" x="${x + barW / 2}" y="${H - 6}" text-anchor="middle">${b.short}</text>`;
    }
  });

  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Spending over time">${svg}</svg>
    <div class="chart-tip" hidden></div>`;

  const tip = box.querySelector(".chart-tip");

  function showTip(group) {
    const i = Number(group.dataset.i);
    box.querySelectorAll(".bar-group.active").forEach(g => g.classList.remove("active"));
    group.classList.add("active");
    tip.textContent = `${buckets[i].long}: ${formatMoney(values[i])}`;
    const center = ((left + i * slot + slot / 2) / W) * 100;
    tip.style.left = Math.min(78, Math.max(22, center)) + "%";
    tip.hidden = false;
  }

  function hideTip() {
    box.querySelectorAll(".bar-group.active").forEach(g => g.classList.remove("active"));
    tip.hidden = true;
  }

  box.querySelectorAll(".bar-group").forEach(group => {
    group.addEventListener("pointerenter", () => showTip(group));
    group.addEventListener("click", () => showTip(group));
  });
  box.querySelector("svg").addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse") hideTip();
  });
}
