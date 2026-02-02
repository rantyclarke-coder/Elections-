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
      primary: "#1e3fd9",
      secondary: "#b8c6ff"
    },
    R: {
      name: "REPUBLICAN",
      primary: "#dc143c",
      secondary: "#ffc1cc"
    },
    N: {
      name: "NPPA",
      primary: "#2ecc71",
      secondary: "#b9f1cf"
    },
    I: {
      name: "INDEPENDENT",
      primary: "#bfa23a",
      secondary: "#e6d79c"
    },
    V: {
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
        const party = rows[r]?.[20]?.trim(); // U
        const seats = Number(rows[r]?.[21]); // V
        if (party && !isNaN(seats)) {
          houseSeats[party] = seats;
        }
      }

      /* ---- SENATE COMPOSITION (X14–X18 / Y) ---- */
      for (let r = 13; r <= 17; r++) {
        const party = rows[r]?.[23]?.trim(); // X
        const seats = Number(rows[r]?.[24]); // Y
        if (party && !isNaN(seats)) {
          senateSeats[party] = seats;
        }
      }

      determineWinners();
      applyPlaceholderBorder();
    })
    .catch(err => {
      console.error("Midterms CSV error:", err);
    });

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

    /* Set CSS variables ON ELEMENT */
    capitol.style.setProperty("--house-border", houseColor);
    capitol.style.setProperty("--senate-border", senateColor);
  }

});
