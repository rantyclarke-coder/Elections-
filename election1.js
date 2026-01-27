/* =========================================
   ELECTION 1 — INPUT CONFIGURATION
   ========================================= */

/* -------- Election Metadata -------- */
const ELECTION = {
  title: "US XXXX ELECTIONS",
  subtitle: "LIVE ELECTION NIGHT"
};

/* -------- Constants -------- */
const CONSTANTS = {
  TOTAL_EV: 538,
  WIN_EV: 270,
  VOTES_PER_EV: 500000
};

/* -------- Candidates --------
   Order matters: C1, C2, C3
*/
const CANDIDATES = [
  {
    id: "C1",
    name: "Candidate One",
    shortName: "C1",
    primaryColor: "#1e3fd9",
    secondaryColor: "#9fb3ff",
    party: "Party One",
    photo: "images/c1.jpg"
  },
  {
    id: "C2",
    name: "Candidate Two",
    shortName: "C2",
    primaryColor: "#dc143c",
    secondaryColor: "#ff9aa5",
    party: "Party Two",
    photo: "images/c2.jpg"
  },
  {
    id: "C3",
    name: "Candidate Three",
    shortName: "C3",
    primaryColor: "#2e8b57",
    secondaryColor: "#9fe0c3",
    party: "Party Three",
    photo: "images/c3.jpg"
  }
];

/* -------- Live Data Source -------- */
const DATA_SOURCE = {
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?gid=0&single=true&output=csv",

  // Column mapping (0-based after CSV parsing)
  columns: {
    state: 0,   // Column A
    ev: 1,      // Column B
    c1: 11,     // Column L
    c2: 12,     // Column M
    c3: 13      // Column N
  },

  startRowIndex: 2 // A3 = index 2
};
document.getElementById("left-ev").textContent = "TEST";
