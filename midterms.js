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
  D: {
    name: "DEMOCRAT",
    primary: "#1e3fd9",      // strong blue
    secondary: "#b8c6ff"     // pastel blue
  },
  R: {
    name: "REPUBLICAN",
    primary: "#dc143c",      // strong red
    secondary: "#ffc1cc"     // pastel red
  },
  N: {
    name: "NPPA",
    primary: "#2ecc71",      // strong green
    secondary: "#b9f1cf"     // pastel green
  },
  I: {
    name: "INDEPENDENT",
    primary: "#bfa23a",      // muted gold
    secondary: "#e6d79c"     // light gold
  },
  V: {
    name: "VACANT",
    primary: "#666666",      // dark gray
    secondary: "#999999"     // light gray
  }
};

  /* =========================
     STORAGE
  ========================= */

  let electionYear = "";
  const houseSeats = {};
  const senateSeats = {};

  let HOUSE_WINNER = "V";
  let SENATE_WINNER = "V";

  /* =========================
     LOAD GOOGLE SHEET
  ========================= */

  fetch(CSV_URL)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.split("\n").map(r => r.split(","));

      /* ---- ELECTION YEAR (U11) ---- */
      electionYear = rows[10]?.[20]?.trim();
      const yearSpan = document.getElementById("election-year");
      if (yearSpan && electionYear) {
        yearSpan.textContent = electionYear;
      }

      /* ---- HOUSE COMPOSITION (U14–U18 / V) ---- */
      for (let r = 13; r <= 17; r++) {
        const party = rows[r]?.[20]?.trim();
        const seats = Number(rows[r]?.[21]);
        if (party && !isNaN(seats)) {
          houseSeats[party] = seats;
        }
      }

      /* ---- SENATE COMPOSITION (X14–X18 / Y) ---- */
      for (let r = 13; r <= 17; r++) {
        const party = rows[r]?.[23]?.trim();
        const seats = Number(rows[r]?.[24]);
        if (party && !isNaN(seats)) {
          senateSeats[party] = seats;
        }
      }

      determineWinners();
      applyPlaceholderBorder();
      colorHemicycles();
      renderComposition("house-panel", houseSeats);
      renderComposition("senate-panel", senateSeats);
    })
    .catch(err => console.error("Midterms CSV error:", err));

  /* =========================
     DETERMINE WINNERS
  ========================= */

  function determineWinners() {
    HOUSE_WINNER = getTopParty(houseSeats) || "V";
    SENATE_WINNER = getTopParty(senateSeats) || "V";
  }

  function getTopParty(obj) {
    let max = -1;
    let winner = null;
    Object.keys(obj).forEach(p => {
      if (obj[p] > max) {
        max = obj[p];
        winner = p;
      }
    });
    return winner;
  }

  /* =========================
     PLACEHOLDER BORDER COLOR
  ========================= */

  function applyPlaceholderBorder() {
    const root = document.documentElement;

    root.style.setProperty(
      "--house-border",
      PARTIES[HOUSE_WINNER]?.secondary || PARTIES.V.secondary
    );

    root.style.setProperty(
      "--senate-border",
      PARTIES[SENATE_WINNER]?.secondary || PARTIES.V.secondary
    );
  }

  /* =========================
     BUILD ORDERED SEAT ARRAYS
  ========================= */

  function buildSeatArray(seatObj) {
    const order = ["D","N","I","R","V"];
    const arr = [];
    order.forEach(p => {
      const n = seatObj[p] || 0;
      for (let i = 0; i < n; i++) arr.push(p);
    });
    return arr;
  }

  /* =========================
     COLOR HEMICYCLES
  ========================= */

  function colorHemicycles() {
  const dots = Array.from(document.querySelectorAll(".dot.house"));

  /* ---- SPLIT ROWS BY Y POSITION ---- */
  const rows = {};
  dots.forEach(dot => {
    const y = dot.offsetTop;
    if (!rows[y]) rows[y] = [];
    rows[y].push(dot);
  });

  /* ---- SORT ROWS INNER → OUTER ---- */
  const sortedRows = Object.values(rows)
    .sort((a, b) => a[0].offsetTop - b[0].offsetTop);

  /* ---- SORT EACH ROW LEFT → RIGHT ---- */
  sortedRows.forEach(row =>
    row.sort((a, b) => a.offsetLeft - b.offsetLeft)
  );

  /* ---- BUILD VISUAL COLUMNS ---- */
  const maxCols = Math.max(...sortedRows.map(r => r.length));
  const columns = [];

  for (let c = 0; c < maxCols; c++) {
    const col = [];
    sortedRows.forEach(r => {
      if (r[c]) col.push(r[c]);
    });
    columns.push(col);
  }

  /* ---- SEAT COUNTS ---- */
  let d = houseSeats.D || 0;
  let r = houseSeats.R || 0;
  let n = houseSeats.N || 0;
  let i = houseSeats.I || 0;
  let v = houseSeats.V || 0;

  /* ---- DEMOCRATS: LEFT → RIGHT ---- */
  let L = 0;
  while (d > 0 && L < columns.length) {
    columns[L].forEach(dot => {
      if (d > 0) {
        dot.style.background = PARTIES.D.primary;
        d--;
      }
    });
    L++;
  }

  /* ---- REPUBLICANS: RIGHT → LEFT ---- */
  let R = columns.length - 1;
  while (r > 0 && R >= L) {
    columns[R].forEach(dot => {
      if (r > 0) {
        dot.style.background = PARTIES.R.primary;
        r--;
      }
    });
    R--;
  }

  /* ---- CENTER PARTIES ---- */
  const center = [];
  for (let k = 0; k < n; k++) center.push("N");
  for (let k = 0; k < i; k++) center.push("I");
  for (let k = 0; k < v; k++) center.push("V");

  let idx = 0;
  for (let c = L; c <= R; c++) {
    columns[c].forEach(dot => {
      if (idx < center.length) {
        dot.style.background = PARTIES[center[idx]].primary;
        idx++;
      }
    });
  }

  /* ---- SENATE SIMPLE FILL ---- */
  const senateDots = document.querySelectorAll(".dot.senate");
  const senateArr = buildSeatArray(senateSeats);

  senateDots.forEach((dot, i) => {
    dot.style.background = PARTIES[senateArr[i] || "V"].primary;
  });
  }
  
      //     PARTY COMPOSITION PANELS
  ========================= */

  function renderComposition(id, seats) {
    const box = document.getElementById(id);
    if (!box) return;

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
