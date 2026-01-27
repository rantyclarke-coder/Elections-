document.addEventListener("DOMContentLoaded", () => {

/* =========================
   1. CONSTANTS
========================= */
const CONSTANTS = {
  TOTAL_EV: 538,
  WIN_EV: 270,
  VOTES_PER_EV: 500000
};
const TIE_COLOR = "#8a8a8a";
   const STATE_NAMES = {
  AL: "ALABAMA",
  AK: "ALASKA",
  AZ: "ARIZONA",
  AR: "ARKANSAS",
  CA: "CALIFORNIA",
  CO: "COLORADO",
  CT: "CONNECTICUT",
  DE: "DELAWARE",
  FL: "FLORIDA",
  GA: "GEORGIA",
  HI: "HAWAII",
  ID: "IDAHO",
  IL: "ILLINOIS",
  IN: "INDIANA",
  IA: "IOWA",
  KS: "KANSAS",
  KY: "KENTUCKY",
  LA: "LOUISIANA",
  ME: "MAINE",
  MD: "MARYLAND",
  MA: "MASSACHUSETTS",
  MI: "MICHIGAN",
  MN: "MINNESOTA",
  MS: "MISSISSIPPI",
  MO: "MISSOURI",
  MT: "MONTANA",
  NE: "NEBRASKA",
  NV: "NEVADA",
  NH: "NEW HAMPSHIRE",
  NJ: "NEW JERSEY",
  NM: "NEW MEXICO",
  NY: "NEW YORK",
  NC: "NORTH CAROLINA",
  ND: "NORTH DAKOTA",
  OH: "OHIO",
  OK: "OKLAHOMA",
  OR: "OREGON",
  PA: "PENNSYLVANIA",
  RI: "RHODE ISLAND",
  SC: "SOUTH CAROLINA",
  SD: "SOUTH DAKOTA",
  TN: "TENNESSEE",
  TX: "TEXAS",
  UT: "UTAH",
  VT: "VERMONT",
  VA: "VIRGINIA",
  WA: "WASHINGTON",
  WV: "WEST VIRGINIA",
  WI: "WISCONSIN",
  WY: "WYOMING",
  DC: "WASHINGTON D.C."
};

/* =========================
   2. CANDIDATES
========================= */
const CANDIDATES = {
  C1: {
    name: "TIM WALZ",
    short: "WALZ",
    party: "DEMOCRAT",
    primaryColor: "#1e3fd9",
    secondaryColor: "#b8c6ff"
  },
  C2: {
    name: "STELLA COUCH",
    short: "COUCH",
    party: "REPUBLICAN",
    primaryColor: "#dc143c",
    secondaryColor: "#ffc1cc"
  },
  C3: {
    name: "BILL CLINTON",
    short: "BILL",
    party: "NPPA",
    primaryColor: "#2ecc71",
    secondaryColor: "#b9f1cf"
  }
};

/* =========================
   3. STORAGE
========================= */
const STATE_RESULTS = {};
const nationalEV = { C1: 0, C2: 0, C3: 0 };
const nationalVotes = { C1: 1, C2: 1, C3: 1 };

/* =========================
   4. LOAD GOOGLE SHEET
========================= */
fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?gid=0&single=true&output=csv")
.then(r => r.text())
.then(csv => {
  const rows = csv.trim().split("\n").map(r => r.split(","));

  for (let i = 2; i < rows.length; i++) {
    const state = rows[i][0]?.trim();
    const ev = Number(rows[i][1]);
    const c1 = Number(rows[i][11]);
    const c2 = Number(rows[i][12]);
    const c3 = Number(rows[i][13]);

    if (!state || !ev) continue;

    if ((c1 + c2 + c3) === 0) {
      STATE_RESULTS[state] = { ev, votes:{C1:0,C2:0,C3:0}, winner:null, isTie:false };
      continue;
    }

    const total = c1 + c2 + c3;
    const votes = {
      C1: Math.round(ev * CONSTANTS.VOTES_PER_EV * c1 / total),
      C2: Math.round(ev * CONSTANTS.VOTES_PER_EV * c2 / total),
      C3: Math.round(ev * CONSTANTS.VOTES_PER_EV * c3 / total)
    };

    const sorted = Object.entries(votes).sort((a,b)=>b[1]-a[1]);
    const isTie = sorted[0][1] === sorted[1][1];
    const winner = isTie ? null : sorted[0][0];

    STATE_RESULTS[state] = { ev, votes, winner, isTie };

    if (winner) nationalEV[winner] += ev;
    nationalVotes.C1 += votes.C1;
    nationalVotes.C2 += votes.C2;
    nationalVotes.C3 += votes.C3;
  }

  renderTop();
  colorMap();
});

/* =========================
   5. TOP BAR
========================= */
function renderTop() {
  const order = Object.keys(nationalEV).sort((a,b)=>nationalEV[b]-nationalEV[a]);
  const left = order[0];
  const right = order[1];

  document.getElementById("left-name").textContent = CANDIDATES[left].short;
  document.getElementById("right-name").textContent = CANDIDATES[right].short;

  document.getElementById("left-name").style.color = CANDIDATES[left].secondaryColor;
  document.getElementById("right-name").style.color = CANDIDATES[right].secondaryColor;

  document.getElementById("left-ev").textContent = nationalEV[left];
  document.getElementById("right-ev").textContent = nationalEV[right];

  document.getElementById("seg-left").style.width =
    (nationalEV[left]/CONSTANTS.TOTAL_EV)*100+"%";
  document.getElementById("seg-right").style.width =
    (nationalEV[right]/CONSTANTS.TOTAL_EV)*100+"%";
  document.getElementById("seg-unc").style.width =
    (1-(nationalEV[left]+nationalEV[right])/CONSTANTS.TOTAL_EV)*100+"%";

  document.getElementById("seg-left").style.background = CANDIDATES[left].primaryColor;
  document.getElementById("seg-right").style.background = CANDIDATES[right].primaryColor;

  const totalVotes = nationalVotes.C1 + nationalVotes.C2 + nationalVotes.C3;

  document.getElementById("left-stats").textContent =
    `${((nationalVotes[left]/totalVotes)*100).toFixed(1)}% | ${nationalVotes[left].toLocaleString()}`;
  document.getElementById("right-stats").textContent =
    `| ${((nationalVotes[right]/totalVotes)*100).toFixed(1)}%\n${nationalVotes[right].toLocaleString()}`;

  document.getElementById("status").textContent =
    nationalEV[left] >= CONSTANTS.WIN_EV
    ? `PROJECTED WINNER — ${CANDIDATES[left].name}`
    : "LIVE ELECTION NIGHT";
   document.querySelector("#left-cand .photo").style.background =
  CANDIDATES[left].secondaryColor;

document.querySelector("#right-cand .photo").style.background =
  CANDIDATES[right].secondaryColor;
}

/* =========================
   6. MAP + POPUPS
========================= */
function colorMap() {
  const map = document.getElementById("us-map");
  if (!map) return;

  const apply = () => {
    const svg = map.contentDocument;
    if (!svg) return;

    Object.keys(STATE_RESULTS).forEach(code => {
      const el = svg.getElementById(code);
      if (!el) return;

      const r = STATE_RESULTS[code];
      el.onclick = null;

      if (r.isTie) el.style.fill = TIE_COLOR;
      else if (r.winner) el.style.fill = CANDIDATES[r.winner].primaryColor;

      if (r.isTie || r.winner) {
        el.style.cursor = "pointer";
        el.addEventListener("click", e => {
          e.stopPropagation();
          showPopup(code, e.clientX, e.clientY);
        });
      }
    });
  };

  if (map.contentDocument) apply();
  map.addEventListener("load", apply);
}

/* =========================
   7. POPUP
========================= */
function showPopup(stateCode, x, y) {
  const popup = document.getElementById("state-popup");
  const s = STATE_RESULTS[stateCode];
  if (!s || (!s.isTie && !s.winner)) return;

  const rows = Object.entries(s.votes)
    .map(([id,v])=>({id,v}))
    .sort((a,b)=>b.v-a.v);

  let headerRightName = "";
let headerRightStatus = "";
let headerStatusColor = "";

if (state.isTie) {
  // TIE CASE
  headerRightName = rows[0].id
    ? CANDIDATES[rows[0].id].short
    : "";

  headerRightStatus = "TIED";
  headerStatusColor = "#8a8a8a"; // neutral grey
} else {
  // WINNER CASE
  const winnerId = state.winner;

  headerRightName = CANDIDATES[winnerId].short;
  headerRightStatus = "WON";
  headerStatusColor = CANDIDATES[winnerId].secondaryColor;
}
  const total = rows.reduce((a,b)=>a+b.v,0);

  popup.innerHTML = `
  <div class="popup-header">
    <div class="popup-header-left-top">
      ${STATE_NAMES[stateCode]}
    </div>

    <div class="popup-header-right-top"
         style="color:${headerStatusColor}">
      ${headerRightName}
    </div>

    <div class="popup-header-left-bottom">
      ${state.ev} EVs
    </div>

    <div class="popup-header-right-bottom"
         style="color:${headerStatusColor}">
      ${headerRightStatus}
    </div>
  </div>
`;
    ${rows.map((r,i)=>`
      <div class="popup-row">
        <div class="popup-photo" style="background:${CANDIDATES[r.id].secondaryColor}"></div>
        <div class="popup-text">
          <div class="popup-name">${CANDIDATES[r.id].name}</div>
          <div class="popup-party" style="color:${CANDIDATES[r.id].secondaryColor}">
            ${CANDIDATES[r.id].party}
          </div>
          <div class="popup-votes">
            ${((r.v/total)*100).toFixed(1)}% | ${r.v.toLocaleString()}
          </div>
        </div>
        <div class="popup-indicator">
          ${s.isTie ? "—" : i===0 ? "▲" : "▼"}
        </div>
      </div>
    `).join("")}
  `;

  popup.style.left = Math.min(x, window.innerWidth-280)+"px";
  popup.style.top = Math.min(y, window.innerHeight-220)+"px";
  popup.classList.remove("hidden");
}

/* =========================
   8. CLOSE POPUP
========================= */
document.addEventListener("click", () => {
  document.getElementById("state-popup").classList.add("hidden");
});

});
