document.addEventListener("DOMContentLoaded", () => {

/* =========================
   CONFIG
========================= */

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv";

/* =========================
   PARTY DEFINITIONS (LOCKED)
========================= */

const PARTIES = {
  D: { name:"DEMOCRAT",    primary:"#1e3fd9", secondary:"#b8c6ff" },
  R: { name:"REPUBLICAN",  primary:"#dc143c", secondary:"#ffc1cc" },
  N: { name:"NPPA",        primary:"#2ecc71", secondary:"#b9f1cf" },
  I: { name:"INDEPENDENT", primary:"#bfa23a", secondary:"#e6d79c" },
  V: { name:"VACANT",      primary:"#666666", secondary:"#999999" }
};

/* =========================
   STORAGE
========================= */

const houseSeats  = {};
const senateSeats = {};

let HOUSE_WINNER = "V";
let SENATE_WINNER = "V";

/* =========================
   PARLIAMENTARY FILL ORDERS
========================= */

/* HOUSE: inner → middle → outer, left → right */
const HOUSE_FILL_ORDER = [];
for (let c = 0; c < 12; c++) {
  if (c < 8)  HOUSE_FILL_ORDER.push({ row:"inner",  col:c });
  if (c < 10) HOUSE_FILL_ORDER.push({ row:"middle", col:c });
  HOUSE_FILL_ORDER.push({ row:"outer", col:c });
}

/* SENATE: inner → outer */
const SENATE_FILL_ORDER = [];
for (let c = 0; c < 5; c++) {
  if (c < 3) SENATE_FILL_ORDER.push({ row:"inner", col:c });
  SENATE_FILL_ORDER.push({ row:"outer", col:c });
}

/* =========================
   LOAD GOOGLE SHEET
========================= */

fetch(CSV_URL)
  .then(r => r.text())
  .then(csv => {
    const rows = csv.split("\n").map(r => r.split(","));

    /* YEAR (U11) */
    const year = rows[10]?.[20]?.trim();
    if (year) {
      const y = document.getElementById("election-year");
      if (y) y.textContent = year;
    }

    /* HOUSE (U14–U18 / V) */
    for (let r = 13; r <= 17; r++) {
      const p = rows[r]?.[20]?.trim();
      const s = Number(rows[r]?.[21]);
      if (p && !isNaN(s)) houseSeats[p] = s;
    }

    /* SENATE (X14–X18 / Y) */
    for (let r = 13; r <= 17; r++) {
      const p = rows[r]?.[23]?.trim();
      const s = Number(rows[r]?.[24]);
      if (p && !isNaN(s)) senateSeats[p] = s;
    }

    determineWinners();
    applyPlaceholderBorder();
    colorHouse();
    colorSenate();
    renderComposition("house-panel", houseSeats);
    renderComposition("senate-panel", senateSeats);
  });

/* =========================
   HELPERS
========================= */

function determineWinners() {
  HOUSE_WINNER  = getTopParty(houseSeats)  || "V";
  SENATE_WINNER = getTopParty(senateSeats) || "V";
}

function getTopParty(obj) {
  let max = -1, win = null;
  Object.keys(obj).forEach(p => {
    if (obj[p] > max) { max = obj[p]; win = p; }
  });
  return win;
}

function applyPlaceholderBorder() {
  const root = document.documentElement;
  root.style.setProperty("--house-border",  PARTIES[HOUSE_WINNER].secondary);
  root.style.setProperty("--senate-border", PARTIES[SENATE_WINNER].secondary);
}

/* =========================
   DOT LOOKUPS
========================= */

function buildDotMap(selector) {
  const map = {};
  document.querySelectorAll(selector).forEach(dot => {
    const key = `${dot.dataset.row}-${dot.dataset.col}`;
    map[key] = dot;
  });
  return map;
}

/* =========================
   HOUSE COLORING (FIXED)
========================= */

function colorHouse() {
  const dots = buildDotMap(".dot.house");

  let d = houseSeats.D || 0;
  let r = houseSeats.R || 0;
  let n = houseSeats.N || 0;
  let i = houseSeats.I || 0;
  let v = houseSeats.V || 0;

  /* DEMOCRATS — LEFT */
  let idx = 0;
  while (d > 0 && idx < HOUSE_FILL_ORDER.length) {
    const s = HOUSE_FILL_ORDER[idx++];
    dots[`${s.row}-${s.col}`].style.background = PARTIES.D.primary;
    d--;
  }

  /* REPUBLICANS — RIGHT (MIRROR) */
  const RIGHT = [...HOUSE_FILL_ORDER].reverse();
  idx = 0;
  while (r > 0 && idx < RIGHT.length) {
    const s = RIGHT[idx++];
    const dot = dots[`${s.row}-${s.col}`];
    if (!dot.style.background) {
      dot.style.background = PARTIES.R.primary;
      r--;
    }
  }

  /* CENTER PARTIES */
  const center = [
    ...Array(n).fill("N"),
    ...Array(i).fill("I"),
    ...Array(v).fill("V")
  ];

  idx = 0;
  HOUSE_FILL_ORDER.forEach(s => {
    const dot = dots[`${s.row}-${s.col}`];
    if (!dot.style.background && idx < center.length) {
      dot.style.background = PARTIES[center[idx++]].primary;
    }
  });
}

/* =========================
   SENATE COLORING (SAME LOGIC)
========================= */

function colorSenate() {
  const dots = buildDotMap(".dot.senate");

  let d = senateSeats.D || 0;
  let r = senateSeats.R || 0;
  let n = senateSeats.N || 0;
  let i = senateSeats.I || 0;
  let v = senateSeats.V || 0;

  let idx = 0;
  while (d > 0 && idx < SENATE_FILL_ORDER.length) {
    const s = SENATE_FILL_ORDER[idx++];
    dots[`${s.row}-${s.col}`].style.background = PARTIES.D.primary;
    d--;
  }

  const RIGHT = [...SENATE_FILL_ORDER].reverse();
  idx = 0;
  while (r > 0 && idx < RIGHT.length) {
    const s = RIGHT[idx++];
    const dot = dots[`${s.row}-${s.col}`];
    if (!dot.style.background) {
      dot.style.background = PARTIES.R.primary;
      r--;
    }
  }

  const center = [
    ...Array(n).fill("N"),
    ...Array(i).fill("I"),
    ...Array(v).fill("V")
  ];

  idx = 0;
  SENATE_FILL_ORDER.forEach(s => {
    const dot = dots[`${s.row}-${s.col}`];
    if (!dot.style.background && idx < center.length) {
      dot.style.background = PARTIES[center[idx++]].primary;
    }
  });
}

/* =========================
   COMPOSITION PANELS
========================= */

function renderComposition(id, seats) {
  const box = document.getElementById(id);
  if (!box) return;
  box.innerHTML = "";

  Object.keys(PARTIES).forEach(code => {
    if (!seats[code]) return;

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.margin = "6px 0";
    row.style.color = PARTIES[code].secondary;

    row.innerHTML = `
      <span>${PARTIES[code].name}</span>
      <strong>${seats[code]}</strong>
    `;

    box.appendChild(row);
  });
}

});
