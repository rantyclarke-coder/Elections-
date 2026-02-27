document.addEventListener("DOMContentLoaded", () => {

/* =========================
   1. CONSTANTS
========================= */
const CONSTANTS = {
  TOTAL_EV: 538,
  WIN_EV: 270,
  VOTES_PER_EV: 300000
};
// Popup visibility control
const SHOW_C3_IN_POPUP = true;
const SHOW_C4_IN_POPUP = true;
const TIE_COLOR = "#8a8a8a";

/* =========================
   STATE FULL NAMES
========================= */
const STATE_NAMES = {
  AL:"ALABAMA", AK:"ALASKA", AZ:"ARIZONA", AR:"ARKANSAS", CA:"CALIFORNIA",
  CO:"COLORADO", CT:"CONNECTICUT", DE:"DELAWARE", FL:"FLORIDA", GA:"GEORGIA",
  HI:"HAWAII", ID:"IDAHO", IL:"ILLINOIS", IN:"INDIANA", IA:"IOWA",
  KS:"KANSAS", KY:"KENTUCKY", LA:"LOUISIANA", ME:"MAINE", MD:"MARYLAND",
  MA:"MASSACHUSETTS", MI:"MICHIGAN", MN:"MINNESOTA", MS:"MISSISSIPPI",
  MO:"MISSOURI", MT:"MONTANA", NE:"NEBRASKA", NV:"NEVADA", NH:"NEW HAMPSHIRE",
  NJ:"NEW JERSEY", NM:"NEW MEXICO", NY:"NEW YORK", NC:"NORTH CAROLINA",
  ND:"NORTH DAKOTA", OH:"OHIO", OK:"OKLAHOMA", OR:"OREGON",
  PA:"PENNSYLVANIA", RI:"RHODE ISLAND", SC:"SOUTH CAROLINA",
  SD:"SOUTH DAKOTA", TN:"TENNESSEE", TX:"TEXAS", UT:"UTAH",
  VT:"VERMONT", VA:"VIRGINIA", WA:"WASHINGTON", WV:"WEST VIRGINIA",
  WI:"WISCONSIN", WY:"WYOMING", DC:"WASHINGTON D.C."
};

/* =========================
   2. CANDIDATES
========================= */
const CANDIDATES = {
  C1: {
    name: "KEITLYN MCKINLEY",
    short: "KEITLYN",
    party: "INDEPENDENT",
    primaryColor: "#1e3fd9",
    secondaryColor: "#b8c6ff",
     colorGroup: "DEM",
    photo: "images/mckinley.png"
  },

  C2: {
    name: "MARK KELLY",
    short: "KELLY",
    party: "DEMOCRAT",
    primaryColor: "#dc143c",
    secondaryColor: "#ffc1cc",
    colorGroup: "REP",
    photo: "images/walz.png"
  },

  C3: {
    name: "HOWARD KENNEDY",
    short: "KENNEDY",
    party: "NPPA",
    primaryColor: "#2ecc71",
    secondaryColor: "#b9f1cf",
    colorGroup: "C3",
    photo: "images/howard.png"
  },

   C4: {
  name: "CLIVE BRIXTON",
  short: "BRIXTON",
  party: "INDEPENDENT",
  primaryColor: "#bfa23a",
  secondaryColor: "#e6d79c",
  colorGroup: "C4",
  photo: "images/brixton.png"
   }
};

/* COLOR GROUPS */

const PARTY_SHADES = {
  DEM: {
    safe:  "#2B4C93",
    lean:  "#5F7FC1",
    swing: "#7FA2E0",
    solid: "#2B4C93"
  },
  REP: {
    safe:  "#C91F2E",
    lean:  "#FF5A66",
    swing: "#EE7C85",
    solid: "#C91F2E"
  },

  C3: {
    safe:  "#1E9E52",
    lean:  "#2ECC71",
    swing: "#8FE5B5",
    solid: "#27AE60"
  },

  C4: {
    safe:  "#8C7A21",
    lean:  "#BFA23A",
    swing: "#E6D79C",
    solid: "#A8892C"
  }
};

/* =========================
   3. STORAGE
========================= */
const STATE_RESULTS = {};
const nationalEV = { C1:0, C2:0, C3:0, C4:0 };
const nationalVotes = { C1:1, C2:1, C3:1, C4:1 };
/* =========================
   4. LOAD GOOGLE SHEET
========================= */
fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?gid=0&single=true&output=csv")
.then(r => r.text())
.then(csv => {
  const rows = csv.trim().split("\n").map(r => r.split(","));

   /* ===== GET ELECTION YEAR FROM SHEET ===== */

const electionYear = rows[57]?.[2]?.trim(); // C58

if (electionYear) {

  // Update browser tab title
  document.title = `US ${electionYear} ELECTIONS`;

  // Update heading text
  const titleEl = document.querySelector(".title");
  if (titleEl) {
    titleEl.textContent = `US ${electionYear} ELECTIONS`;
  }
}

  for (let i = 2; i < rows.length; i++) {
    const code = rows[i][0]?.trim();
    const ev = Number(rows[i][1]);
    const c1 = Number(rows[i][14]);
    const c2 = Number(rows[i][15]);
    const c3 = Number(rows[i][16]);
    const c4 = Number(rows[i][17]);
    if (!code || !ev) continue;

    if (c1 + c2 + c3 + c4 === 0) {
      STATE_RESULTS[code] = { ev, votes:{C1:0,C2:0,C3:0,C4:0}, winner:null, isTie:false };
      continue;
    }

    const total = c1 + c2 + c3 + c4;
    const votes = {
      C1: Math.round(ev * CONSTANTS.VOTES_PER_EV * c1 / total),
      C2: Math.round(ev * CONSTANTS.VOTES_PER_EV * c2 / total),
      C3: Math.round(ev * CONSTANTS.VOTES_PER_EV * c3 / total),
      C4: Math.round(ev * CONSTANTS.VOTES_PER_EV * c4 / total)
    };

    // Determine winner using RAW sheet points
     
const raw = { C1:c1, C2:c2, C3:c3, C4:c4 };
const sortedRaw = Object.entries(raw).sort((a,b)=>b[1]-a[1]);

const isTie = sortedRaw[0][1] === sortedRaw[1][1];
const winner = isTie ? null : sortedRaw[0][0];

let tier = null;

if (!isTie && winner) {
  const margin = sortedRaw[0][1] - sortedRaw[1][1];

  if (margin >= 5) tier = "safe";
  else if (margin >= 3) tier = "lean";
  else if (margin >= 1) tier = "swing";
}

    STATE_RESULTS[code] = { ev, votes, winner, isTie, tier };

    if (winner) nationalEV[winner] += ev;
    Object.keys(votes).forEach(k => nationalVotes[k] += votes[k]);
  }

  renderTop();
  colorMap();
});

/* =========================
   5. TOP BAR (SAFE)
========================= */

  function renderTop() {
  const order = Object.keys(nationalEV).sort((a,b)=>nationalEV[b]-nationalEV[a]);
  const left = order[0];
  const right = order[1];

  // ---- NAMES ----
  document.getElementById("left-name").textContent = CANDIDATES[left].short;
  document.getElementById("right-name").textContent = CANDIDATES[right].short;

  document.getElementById("left-name").style.color = CANDIDATES[left].primaryColor;
  document.getElementById("right-name").style.color = CANDIDATES[right].primaryColor;

  // ---- EVs ----
  document.getElementById("left-ev").textContent = nationalEV[left];
  document.getElementById("right-ev").textContent = nationalEV[right];

  // ---- BAR WIDTHS ----
  document.getElementById("seg-left").style.width =
    (nationalEV[left] / 538 * 100) + "%";
  document.getElementById("seg-right").style.width =
    (nationalEV[right] / 538 * 100) + "%";
  document.getElementById("seg-unc").style.width =
    (1 - (nationalEV[left] + nationalEV[right]) / 538) * 100 + "%";

  // ---- BAR COLORS ----
  document.getElementById("seg-left").style.background =
    CANDIDATES[left].primaryColor;
  document.getElementById("seg-right").style.background =
    CANDIDATES[right].primaryColor;

  // ---- STATS ----
  const totalVotes = nationalVotes.C1 + nationalVotes.C2 + nationalVotes.C3 + nationalVotes.C4;

  document.getElementById("left-stats").textContent =
    `${((nationalVotes[left] / totalVotes) * 100).toFixed(1)}% |\n${nationalVotes[left].toLocaleString()}`;

  document.getElementById("right-stats").textContent =
    `| ${((nationalVotes[right] / totalVotes) * 100).toFixed(1)}%\n${nationalVotes[right].toLocaleString()}`;

  // ---- STATUS ----
  document.getElementById("status").textContent =
    nationalEV[left] >= 270
      ? `PROJECTED WINNER — ${CANDIDATES[left].name}`
      : "LIVE ELECTION NIGHT";

  // ==================================================
  // 🟢 HEADER PHOTOS (THIS WAS MISSING)
  // ==================================================

  ["left","right"].forEach((side, i) => {
    const cid = i === 0 ? left : right;
    const photoBox = document.querySelector(
      side === "left" ? ".candidate:first-child .photo"
                      : ".candidate:last-child .photo"
    );

    // Secondary color background ALWAYS
    photoBox.style.background = CANDIDATES[cid].secondaryColor;

    // Reset any old image
    photoBox.innerHTML = "";

    // Inject image only if present
    if (CANDIDATES[cid].photo) {
      const img = document.createElement("img");
      img.src = CANDIDATES[cid].photo;
      img.alt = CANDIDATES[cid].name;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.borderRadius = "50%";
      photoBox.appendChild(img);
    }
  });
  }

/* =========================
   6. MAP + POPUP
========================= */
function colorMap() {
  const map = document.getElementById("us-map");
  if (!map) return;

  const apply = () => {
    const svg = map.contentDocument;
    if (!svg) return;

    const els = svg.querySelectorAll("[region]");

    els.forEach(el => {
      const region = el.getAttribute("region");
      if (!region) return;

      const state = region.split("-")[0].toUpperCase();
      const r = STATE_RESULTS[state];
      if (!r) return;

      // ---- COLOR ----
      if (r.isTie) {
  el.style.fill = TIE_COLOR;
}
else if (r.winner) {

  const group = CANDIDATES[r.winner].colorGroup;
  const shades = PARTY_SHADES[group];

  el.style.fill = shades[r.tier] || shades.safe;
}

      // ---- POPUP ----
      el.onclick = null;

      if (r.isTie || r.winner) {
        el.style.cursor = "pointer";
        el.onclick = e => {
          e.stopPropagation();
          showPopup(state, e.clientX, e.clientY);
        };
      } else {
        el.style.cursor = "default";
      }
    });
  };

  if (map.contentDocument) apply();
  map.addEventListener("load", apply);
}

/* =========================
   7. POPUP
========================= */
function showPopup(code, x, y) {
  const p = document.getElementById("state-popup");
  const s = STATE_RESULTS[code];
  if (!s) return;

  const rows = Object.entries(s.votes)
     .filter(([cid]) => {
  if (cid === "C3" && !SHOW_C3_IN_POPUP) return false;
  if (cid === "C4" && !SHOW_C4_IN_POPUP) return false;
  return true;
})
 
.sort((a,b)=>b[1]-a[1]);
  const top = rows[0][0];
  const status = s.isTie ? "TIED" : "WON";
  const statusColor = s.isTie ? TIE_COLOR : CANDIDATES[top].secondaryColor;

  p.innerHTML = `
    <div class="popup-header">
      <div class="popup-header-left-top">${STATE_NAMES[code]}</div>
      <div class="popup-header-right-top" style="color:${statusColor}">
        ${CANDIDATES[top].short}
      </div>
      <div class="popup-header-left-bottom">${s.ev} EVs</div>
      <div class="popup-header-right-bottom" style="color:${statusColor}">
        ${status}
      </div>
    </div>
    ${rows.map((r,i)=>{
      const c = CANDIDATES[r[0]];
      const total = s.votes.C1+s.votes.C2+s.votes.C3+s.votes.C4;
      const pct = total ? ((r[1]/total)*100).toFixed(1) : "0.0";
      const ind = s.isTie ? "—" : (i===0?"▲":"▼");
      const indColor = s.isTie ? TIE_COLOR : (i===0?"#2ecc71":"#dc143c");
      return `
        <div class="popup-row">
          <div class="popup-photo" style="background:${c.secondaryColor}">
  ${c.photo ? `<img src="${c.photo}" alt="${c.name}">` : ``}
</div>
          <div class="popup-text">
            <div class="popup-name">${c.name}</div>
            <div class="popup-party" style="color:${c.secondaryColor}">${c.party}</div>
            <div class="popup-votes">${pct}% | ${r[1].toLocaleString()}</div>
          </div>
          <div class="popup-indicator" style="color:${indColor}">${ind}</div>
        </div>`;
    }).join("")}
  `;

  p.style.left = Math.min(x, window.innerWidth-280)+"px";
  p.style.top = Math.min(y, window.innerHeight-200)+"px";
  p.classList.remove("hidden");
}

/* =========================
   8. CLOSE POPUP
========================= */
document.addEventListener("click", () => {
  document.getElementById("state-popup").classList.add("hidden");
});

});
