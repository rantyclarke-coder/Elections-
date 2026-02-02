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
    D: { name:"DEMOCRAT",    secondary:"#b8c6ff" },
    R: { name:"REPUBLICAN",  secondary:"#ffc1cc" },
    N: { name:"NPPA",        secondary:"#b9f1cf" },
    I: { name:"INDEPENDENT", secondary:"#e6d79c" },
    V: { name:"VACANT",      secondary:"#999999" }
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
    const houseDots  = document.querySelectorAll(".dot.house");
    const senateDots = document.querySelectorAll(".dot.senate");

    const houseArr  = buildSeatArray(houseSeats);
    const senateArr = buildSeatArray(senateSeats);

    houseDots.forEach((dot, i) => {
      const party = houseArr[i] || "V";
      dot.style.background = PARTIES[party].secondary;
    });

    senateDots.forEach((dot, i) => {
      const party = senateArr[i] || "V";
      dot.style.background = PARTIES[party].secondary;
    });
  }

  /* =========================
     PARTY COMPOSITION PANELS
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
