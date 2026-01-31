document.addEventListener("DOMContentLoaded", () => {

/* =========================
   CONFIG
========================= */

const CSV_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv";

/* PARTY DEFINITIONS (CODE-ONLY) */
const PARTIES = {
  D: { name:"DEMOCRAT",   color:"#1e3fd9" },
  R: { name:"REPUBLICAN", color:"#dc143c" },
  I: { name:"INDEPENDENT",color:"#888888" },
  G: { name:"GREEN",      color:"#2ecc71" }
};

/* HARD CODED STATES IN REGIONS */
const REGION_STATES = {
  NE: ["ME","NH","VT","MA","RI","CT","NY","NJ","PA","DE","MD","WV"],
  DX: ["VA","NC","SC","GA","FL","AL","TN","MS","LA","AR","OK","TX"],
  LN: ["OH","KY","IN","MI","WI","IL","MO","IA","MN","ND","SD","NE","KS"],
  PA: ["MT","WY","CO","NM","AZ","UT","ID","WA","OR","NV","CA","AK","HI"]
};

const REGIONS = ["NE","DX","LN","PA"];

/* STORAGE */
const regionElection = {};   // NE → true/false
const regionFixedParty = {}; // NE → "R" or "D" when FALSE
const regionResults = {};    // NE → winning party when TRUE

/* =========================
   LOAD SHEET
========================= */
fetch(CSV_URL)
.then(r => r.text())
.then(csv => {
  const rows = csv.split("\n").map(r=>r.split(","));

  /* ---- REGION FLAGS (ROW 60–63) ----
     B = region
     D = TRUE/FALSE
     E = party if FALSE
  */
  for(let i=60;i<=63;i++){
    const region = rows[i][1]?.trim(); // B
    const flag   = rows[i][3]?.trim(); // D
    const party  = rows[i][4]?.trim(); // E

    if(region){
      regionElection[region] = (flag === "TRUE");
      if(flag === "FALSE" && party){
        regionFixedParty[region] = party; // R/D/etc
      }
    }
  }

  /* ---- DYNAMIC RESULTS FOR TRUE REGIONS ----
     5 candidates per region
     start at row 65, then +6 each region block
     E = party code
     F = active TRUE/FALSE
     G = points
  */
  REGIONS.forEach((region, idx)=>{
    if(!regionElection[region]) return;

    const start = 65 + idx*6;
    const candidates = [];

    for(let r=start; r<start+5; r++){
      const row = rows[r];
      if(!row) continue;

      const party  = row[4]?.trim();      // E
      const active = row[5]?.trim()==="TRUE"; // F
      const points = Number(row[6]);      // G

      if(active && points>0 && PARTIES[party]){
        candidates.push({party, points});
      }
    }

    if(candidates.length){
      candidates.sort((a,b)=>b.points-a.points);
      regionResults[region] = candidates[0].party;
    }
  });

  renderBar();
  colorMap();
});

/* =========================
   TOP PARTY BAR
========================= */
function renderBar(){
  const bar = document.getElementById("party-bar");
  bar.innerHTML = "";

  const counts = {};

  REGIONS.forEach(region=>{
    let party = null;

    if(regionElection[region]){
      party = regionResults[region];       // dynamic
    } else {
      party = regionFixedParty[region];    // fixed from sheet
    }

    if(party){
      counts[party] = (counts[party]||0)+1;
    }
  });

  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  if(!total) return;

  Object.keys(counts).forEach(p=>{
    const seg = document.createElement("div");
    seg.className = "seg";
    seg.style.width = (counts[p]/total*100)+"%";
    seg.style.background = PARTIES[p].color;
    bar.appendChild(seg);
  });
}

/* =========================
   MAP COLORING
========================= */
function colorMap(){
  const map = document.getElementById("us-map");

  const apply = ()=>{
    const svgDoc = map.contentDocument;
    if(!svgDoc) return;

    const svg = svgDoc.querySelector("svg");
    if(!svg) return;

    REGIONS.forEach(region=>{
      const states = REGION_STATES[region];

      let party = null;
      if(regionElection[region]){
        party = regionResults[region];        // dynamic winner
      } else {
        party = regionFixedParty[region];     // fixed ruling party
      }

      if(!party || !PARTIES[party]) return;

      states.forEach(code=>{
        // 🔑 this is the important change
        const el = svg.querySelector(`#${code}`);
        if(!el) return;

        // fill colour
        el.style.fill = PARTIES[party].color;

        // dark regional borders (always)
        el.style.stroke = "#000";
        el.style.strokeWidth = "2";

        // glow only if election TRUE
        if(regionElection[region]){
          el.style.filter = "drop-shadow(0 0 5px white)";
        } else {
          el.style.filter = "none";
        }
      });
    });
  };

  // run immediately if already loaded
  if(map.contentDocument){
    apply();
  }

  // also run when SVG finishes loading
  map.addEventListener("load", apply);
}

});
