document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     1. CONSTANTS (LOCKED)
     ========================= */
  const CONSTANTS = {
    TOTAL_EV: 538,
    WIN_EV: 270,
    VOTES_PER_EV: 500000
  };

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?gid=0&single=true&output=csv";


  /* =========================
     2. CANDIDATE CONFIG
     ========================= */
const CANDIDATES = {
  C1: {
    id: "C1",

    // Text
    name: "TIM WALZ",
    short: "WALZ",

    // Colors
    primaryColor: "#1e3fd9",     // states + bar
    secondaryColor: "#b8c6ff",   // name, accents, photo ring
    partyColor: "#1e3fd9",       // future use (party label)

    // Media (optional, safe if empty)
    photo: null
  },

  C2: {
    id: "C2",
    name: "STELLA COUCH",
    short: "COUCH",
    primaryColor: "#dc143c",
    secondaryColor: "#ffc1cc",
    partyColor: "#dc143c",
    photo: null
  },

  C3: {
    id: "C3",
    name: "BILL CLINTON",
    short: "BILL",
    primaryColor: "#2ecc71",
    secondaryColor: "#b9f1cf",
    partyColor: "#2ecc71",
    photo: null
  }
};


  /* =========================
     3. STORAGE
     ========================= */
  const STATE_RESULTS = {};

  const nationalEV = { C1: 0, C2: 0, C3: 0 };
  const nationalVotes = { C1: 0, C2: 0, C3: 0 };

// ---- SAFE DEFAULTS (prevents dashes) ----
nationalEV.C1 = 0;
nationalEV.C2 = 0;
nationalEV.C3 = 0;

nationalVotes.C1 = 1;
nationalVotes.C2 = 1;
nationalVotes.C3 = 1;
  
  /* =========================
     4. LOAD GOOGLE SHEET
     ========================= */
  fetch(CSV_URL)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.trim().split("\n").map(r => r.split(","));

      // Loop states (A3–A53)
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];

        const stateCode = row[0]?.trim();   // A
        const ev = Number(row[1]);          // B

        const c1 = Number(row[11]);         // L
        const c2 = Number(row[12]);         // M
        const c3 = Number(row[13]);         // N

        if (!stateCode || !ev || (c1 + c2 + c3) === 0) continue;

        const totalPoints = c1 + c2 + c3;
        const stateVotes = ev * CONSTANTS.VOTES_PER_EV;

        const votes = {
          C1: Math.round(stateVotes * (c1 / totalPoints)),
          C2: Math.round(stateVotes * (c2 / totalPoints)),
          C3: Math.round(stateVotes * (c3 / totalPoints))
        };
        
        // Determine winner
        const winner = Object.keys(votes).reduce((a, b) =>
          votes[a] > votes[b] ? a : b
        );

        // Store state result
        STATE_RESULTS[stateCode] = {
          ev,
          votes,
          winner
        };

        // National totals
        nationalEV[winner] += ev;
        nationalVotes.C1 += votes.C1;
        nationalVotes.C2 += votes.C2;
        nationalVotes.C3 += votes.C3;
      }

      renderResults();
colorMapSafe();
    })
.catch(err => {
    console.error("CSV load failed:", err);

    // Fallback render so UI does not stay '-'
    renderResults();
  });

  /* =========================
     5. RENDER TOP TWO
     ========================= */
  function renderResults() {

    // Sort candidates by EV
    const sorted = Object.keys(nationalEV)
      .sort((a, b) => nationalEV[b] - nationalEV[a]);

    const left = sorted[0];
    const right = sorted[1];
    // ===== DYNAMIC BAR COLORS (CRITICAL FIX) =====
const leftSeg = document.getElementById("seg-left");
const rightSeg = document.getElementById("seg-right");

leftSeg.style.backgroundColor = CANDIDATES[left].primaryColor;
rightSeg.style.backgroundColor = CANDIDATES[right].primaryColor;
    
const leftVotes = nationalVotes[left];
const rightVotes = nationalVotes[right];
const totalVotes = nationalVotes.C1 + nationalVotes.C2 + nationalVotes.C3;

    document.getElementById("left-stats").textContent =
  `${((leftVotes / totalVotes) * 100).toFixed(1)}% | ${leftVotes.toLocaleString()}`;

document.getElementById("right-stats").textContent =
  `| ${((rightVotes / totalVotes) * 100).toFixed(1)}%\n${rightVotes.toLocaleString()}`;
    
    // Names
    const leftNameEl = document.getElementById("left-name");
const rightNameEl = document.getElementById("right-name");

leftNameEl.textContent = CANDIDATES[left].short;
rightNameEl.textContent = CANDIDATES[right].short;

leftNameEl.style.color = CANDIDATES[left].secondaryColor;
rightNameEl.style.color = CANDIDATES[right].secondaryColor;

    // EVs
    document.getElementById("left-ev").textContent = nationalEV[left];
    document.getElementById("right-ev").textContent = nationalEV[right];

    // Bar widths
    document.getElementById("seg-left").style.width =
      (nationalEV[left] / CONSTANTS.TOTAL_EV) * 100 + "%";

    document.getElementById("seg-right").style.width =
      (nationalEV[right] / CONSTANTS.TOTAL_EV) * 100 + "%";

    document.getElementById("seg-unc").style.width =
      (1 - (nationalEV[left] + nationalEV[right]) / CONSTANTS.TOTAL_EV) * 100 + "%";

    // Status
    const status = document.getElementById("status");
    if (nationalEV[left] >= CONSTANTS.WIN_EV) {
      status.textContent = "PROJECTED WINNER — " + CANDIDATES[left].name;
    } else if (nationalEV[right] >= CONSTANTS.WIN_EV) {
      status.textContent = "PROJECTED WINNER — " + CANDIDATES[right].name;
    } else {
      status.textContent = "LIVE ELECTION NIGHT";
    }
  }
  function showStatePopup(stateCode, x, y) {
  const popup = document.getElementById("state-popup");
  if (!STATE_RESULTS[stateCode]) return;

  const state = STATE_RESULTS[stateCode];

  const rows = Object.keys(state.votes)
    .map(cid => ({
      id: cid,
      votes: state.votes[cid]
    }))
    .sort((a, b) => b.votes - a.votes);

  popup.innerHTML = rows.map((row, index) => {
    const cand = CANDIDATES[row.id];
    const pct = ((row.votes / (
      nationalVotes.C1 +
      nationalVotes.C2 +
      nationalVotes.C3
    )) * 100).toFixed(1);

    const indicator = index === 0
      ? `<span style="color:#2ecc71">▲</span>`
      : `<span style="color:#dc143c">▼</span>`;

    return `
      <div class="popup-row">
        <div class="popup-photo"></div>
        <div class="popup-text">
          <div class="popup-name">${cand.name}</div>
          <div class="popup-party" style="color:${cand.secondaryColor}">
            ${cand.partyColor ? "" : ""}
          </div>
          <div class="popup-votes">${pct}% | ${row.votes.toLocaleString()}</div>
        </div>
        <div class="popup-indicator">${indicator}</div>
      </div>
    `;
  }).join("");

  popup.style.left = x + "px";
  popup.style.top = y + "px";
  popup.classList.remove("hidden");
    }


  /* =========================
     6. COLOR THE MAP
     ========================= */
  
function colorMapSafe() {
  const mapObject = document.getElementById("us-map");
  if (!mapObject) return;

  const applyColors = () => {
    const svg = mapObject.contentDocument;
    if (!svg) return;

    Object.keys(STATE_RESULTS).forEach(stateCode => {
      const stateEl =
        svg.getElementById(stateCode) ||
        svg.querySelector(`[id="${stateCode}"]`);

      if (!stateEl) return;

      const winner = STATE_RESULTS[stateCode]?.winner;
      if (!winner || !CANDIDATES[winner]) return;

      stateEl.style.fill = CANDIDATES[winner].primaryColor;
      stateEl.style.stroke = "#000";
      stateEl.style.strokeWidth = "0.5";
      stateEl.style.cursor = "pointer";
      stateEl.addEventListener("click", e => {
  e.stopPropagation();
  showStatePopup(stateCode, e.pageX + 10, e.pageY + 10);
});
    });
  };

  // run immediately if already loaded
  if (mapObject.contentDocument) {
    applyColors();
  }

  // also bind load event (covers all cases)
  mapObject.addEventListener("load", applyColors);
}
  document.addEventListener("click", () => {
  document.getElementById("state-popup").classList.add("hidden");
});
  });
