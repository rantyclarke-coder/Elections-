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
      code: "D",
      name: "DEMOCRAT",
      primary: "#1e3fd9",
      secondary: "#b8c6ff"
    },
    R: {
      code: "R",
      name: "REPUBLICAN",
      primary: "#dc143c",
      secondary: "#ffc1cc"
    },
    N: {
      code: "N",
      name: "NPPA",
      primary: "#2ecc71",
      secondary: "#b9f1cf"
    },
    I: {
      code: "I",
      name: "INDEPENDENT",
      primary: "#bfa23a",
      secondary: "#e6d79c"
    },
    V: {
      code: "V",
      name: "VACANT",
      primary: "#666666",
      secondary: "#999999"
    }
  };

  /* =========================
     STORAGE
  ========================= */

  let electionYear = "";
  const houseSeats = {};
  const senateSeats = {};

  let HOUSE_WINNER = null;
  let SENATE_WINNER = null;

  /* =========================
     LOAD SHEET
  ========================= */

  fetch(CSV_URL)
    .then(r => r.text())
    .then(csv => {
      const rows = csv.split("\n").map(r => r.split(","));

      /* ---- ELECTION YEAR ---- */
      electionYear = rows[10]?.[20]?.trim(); // U11

      /* ---- HOUSE COMPOSITION ---- */
      for (let r = 13; r <= 17; r++) {        // U14–U18
        const party = rows[r]?.[20]?.trim(); // U
        const seats = Number(rows[r]?.[21]); // V
        if (party && !isNaN(seats)) {
          houseSeats[party] = seats;
        }
      }

      /* ---- SENATE COMPOSITION ---- */
      for (let r = 13; r <= 17; r++) {        // X14–X18
        const party = rows[r]?.[23]?.trim(); // X
        const seats = Number(rows[r]?.[24]); // Y
        if (party && !isNaN(seats)) {
          senateSeats[party] = seats;
        }
      }

      determineWinners();
      applyPlaceholderBorder();
    });

  /* =========================
     DETERMINE WINNERS
  ========================= */

  function determineWinners() {
    HOUSE_WINNER = getTopParty(houseSeats);
    SENATE_WINNER = getTopParty(senateSeats);
  }

  function getTopParty(obj) {
    let max = -1;
    let winner = null;

    Object.keys(obj).forEach(party => {
      if (obj[party] > max) {
        max = obj[party];
        winner = party;
      }
    });

    return winner;
  }

  /* =========================
     PLACEHOLDER BORDER COLOR
  ========================= */

  function applyPlaceholderBorder() {
  const capitol = document.querySelector(".capitol");
  if (!capitol) return;

  const houseColor =
    PARTIES[HOUSE_WINNER]?.secondary || PARTIES.V.secondary;

  const senateColor =
    PARTIES[SENATE_WINNER]?.secondary || PARTIES.V.secondary;

  // Apply variables DIRECTLY on the element that uses border-image
  capitol.style.setProperty("--house-border", houseColor);
  capitol.style.setProperty("--senate-border", senateColor);
  }

});
