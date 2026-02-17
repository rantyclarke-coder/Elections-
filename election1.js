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
    short: "MCKINLEY",
    party: "DEMOCRAT",
    primaryColor: "#1e3fd9",
    secondaryColor: "#b8c6ff",
    photo: "images/mckinley.png"
  },

  C2: {
    name: "STELLA COUCH",
    short: "COUCH",
    party: "REPUBLICAN",
    primaryColor: "#dc143c",
    secondaryColor: "#ffc1cc",
    photo: "images/couch.png"
  },

  C3: {
    name: "HOWARD KENNEDY",
    short: "KENNEDY",
    party: "NPPA",
    primaryColor: "#2ecc71",
    secondaryColor: "#b9f1cf",
    photo: "images/bill.png"
  },

   C4: {
  name: "CLIVE BRIXTON",
  short: "BRIXTON",
  party: "INDEPENDENT",
  primaryColor: "#xxxxxx",
  secondaryColor: "#xxxxxx",
  photo: "images/brixton.png"
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

  for (let i = 2; i < rows.length; i++) {
    const code = rows[i][0]?.trim();
    const ev = Number(rows[i][1]);
    const c1 = Number(rows[i][11]);
    const c2 = Number(rows[i][12]);
    const c3 = Number(rows[i][13]);
    const c4 = Number(rows[i][14]);
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

    const sorted = Object.entries(votes).sort((a,b)=>b[1]-a[1]);
    const isTie = sorted[0][1] === sorted[1][1];
    const winner = isTie ? null : sorted[0][0];

    STATE_RESULTS[code] = { ev, votes, winner, isTie };

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

  document.getElementById("left-name").style.color = CANDIDATES[left].secondaryColor;
  document.getElementById("right-name").style.color = CANDIDATES[right].secondaryColor;

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
  const totalVotes = nationalVotes.C1 + nationalVotes.C2 + nationalVotes.C3;

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

    Object.keys(STATE_RESULTS).forEach(code => {
      const el = svg.getElementById(code);
      if (!el) return;

      const r = STATE_RESULTS[code];

      // ---- COLOR ----
      if (r.isTie) {
        el.style.fill = TIE_COLOR;
      } else if (r.winner) {
        el.style.fill = CANDIDATES[r.winner].primaryColor;
      }

      // ---- POPUP ----
      el.onclick = null;
      if (r.isTie || r.winner) {
        el.style.cursor = "pointer";
        el.onclick = e => {
          e.stopPropagation();
          showPopup(code, e.clientX, e.clientY);
        };
      } else {
        el.style.cursor = "default";
      }
    });
  };

  // 🔥 THIS IS THE MISSING PART
  if (map.contentDocument) {
    apply();           // <-- RUN IMMEDIATELY
  }

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
      const total = s.votes.C1+s.votes.C2+s.votes.C3;
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
