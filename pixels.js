// ===== Pixel art =====
// Each picture is a list of rows. Each letter is one pixel, "." is empty.
// "x" uses the text color around it, so tab icons change color when active.

const PIXEL_COLORS = {
  x: "currentColor",
  p: "#f48fb1", // pink
  d: "#d6588a", // dark pink
  w: "#ffffff", // white shine
  y: "#ffd54f", // yellow
  o: "#e0a100", // dark yellow
  g: "#7ccf8f", // light green
  G: "#3f9b5c", // dark green
  b: "#5fbf7a", // bunny green
  l: "#c8f0d2", // bunny shine
  k: "#1d3b2a"  // bunny outline
};

const PIXEL_ART = {
  home: [
    "....xx....",
    "...xxxx...",
    "..xxxxxx..",
    ".xxxxxxxx.",
    "xxxxxxxxxx",
    ".xxxxxxxx.",
    ".xxx..xxx.",
    ".xxx..xxx.",
    ".xxx..xxx.",
    ".xxx..xxx."
  ],
  stats: [
    "..........",
    "........xx",
    "........xx",
    "....xx..xx",
    "....xx..xx",
    "xx..xx..xx",
    "xx..xx..xx",
    "xx..xx..xx",
    "xxxxxxxxxx",
    ".........."
  ],
  goals: [
    "....xx....",
    "....xx....",
    "...xxxx...",
    "xxxxxxxxxx",
    ".xxxxxxxx.",
    "..xxxxxx..",
    "..xxxxxx..",
    ".xxx..xxx.",
    ".xx....xx.",
    "x........x"
  ],
  settings: [
    "....xx....",
    ".x.xxxx.x.",
    "..xxxxxx..",
    ".xxx..xxx.",
    "xxx....xxx",
    "xxx....xxx",
    ".xxx..xxx.",
    "..xxxxxx..",
    ".x.xxxx.x.",
    "....xx...."
  ],
  logo: [
    "....kkk....kkk....",
    "...kbbbk..kbbbk...",
    "...kbpbk..kbpbk...",
    "...kbpbk..kbpbk...",
    "...kbpbkkkkbpbk...",
    "...kbbbbbbbbbbk...",
    "..kbbbkbbbbkbbbk..",
    ".kblbpbbbbbbpbbbk.",
    ".kblbkkkkkkkkkkk..",
    ".kbbbk............",
    ".kbbbbkkkkkkk.....",
    "..kbbbbbbbbbbk....",
    "...kbbbbbbbbbbkk..",
    "....kkkkkkkkbbbbk.",
    "............kbbbk.",
    "..kkkk......kbbbk.",
    ".kbbbbkkkkkkbbbbk.",
    "..kbbbbbbbbbbbbk..",
    "...kbbbbbbbbbbk...",
    "....kbbkkkkbbk....",
    ".....kk....kk....."
  ],
  heart: [
    ".dd.dd.",
    "dwpdppd",
    "dpppppd",
    ".dpppd.",
    "..dpd..",
    "...d..."
  ],
  coin: [
    "..oooo..",
    ".oyyyyo.",
    "oywyoyyo",
    "oyyyoyyo",
    "oyyyoyyo",
    "oyyyoyyo",
    ".oyyyyo.",
    "..oooo.."
  ],
  sprout: [
    "gg....GG",
    "ggg..GGG",
    ".gggGGG.",
    "...gG...",
    "...gG...",
    ".dddddd.",
    ".pppppp.",
    "..pppp.."
  ],
  sparkle: [
    "..y..",
    "..y..",
    "yy.yy",
    "..y..",
    "..y.."
  ]
};

// Build an <svg> for one picture. `size` is the width in pixels.
function pixelArt(name, size = 24) {
  const rows = PIXEL_ART[name];
  const width = rows[0].length;
  const height = rows.length;
  let rects = "";

  rows.forEach((row, y) => {
    let x = 0;
    while (x < width) {
      const ch = row[x];
      if (ch === ".") { x++; continue; }
      // Join pixels of the same color in a row into one rectangle
      let run = 1;
      while (row[x + run] === ch) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${PIXEL_COLORS[ch]}"/>`;
      x += run;
    }
  });

  return `<svg class="pixel" viewBox="0 0 ${width} ${height}" width="${size}" height="${Math.round(size * height / width)}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
