document.addEventListener("DOMContentLoaded", () => {

/* =========================
   CONFIG
========================= */

const CSV_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv";

/* PARTY DEFINITIONS */
const PARTIES = {
  D: { name:"DEMOCRAT",    color:"#1e3fd9" },
  R: { name:"REPUBLICAN",  color:"#dc143c" },
  N: { name:"NPPA",        color:"#2ecc71" },
  I: { name:"INDEPENDENT", color:"#bfa23a" }
};

/* STATES BY REGION */
const REGION_STATES = {
  NE: ["ME","NH","VT","MA","RI","CT","NY","NJ","PA","DE","MD","WV"],
  DX: ["VA","NC","SC","GA","FL","AL","TN","MS","LA","AR","OK","TX"],
  LN: ["OH","KY","IN","MI","WI","IL","MO","IA","MN","ND","SD","NE","KS"],
  PA: ["MT","WY","CO","NM","AZ","UT","ID","WA","OR","NV","CA","AK","HI"]
};

const REGIONS = ["NE","DX","LN","PA"];

/* =========================
   STORAGE
========================= */

const regionElection   = {}; // NE → true/false
const regionFixedParty = {}; // NE → party if FALSE
const regionResults    = {}; // NE → winning party if TRUE

/* =========================
   LOAD GOOGLE SHEET
========================= */

fetch(CSV_URL)
.then(r => r.text())
.then(csv => {
  const rows = csv.split("\n").map(r => r.split(","));

  /* ---- REGION FLAGS (ROWS 60–63) ---- */
  for(let i=60;i<=63;i++){
    const region = rows[i]?.[1]?.trim(); // B
    const flag   = rows[i]?.[3]?.trim(); // D
    const party  = rows[i]?.[4]?.trim(); // E

    if(region){
      regionElection[region] = (flag === "TRUE");
      if(flag === "FALSE" && party){
        regionFixedParty[region] = party;
      }
    }
  }

  /* ---- DYNAMIC RESULTS FOR TRUE REGIONS ---- */
  REGIONS.forEach((region, idx)=>{
    if(!regionElection[region]) return;

    const start = 65 + idx*6;
    const candidates = [];

    for(let r=start; r<start+5; r++){
      const row = rows[r];
      if(!row) continue;

      const party  = row[4]?.trim();           // E
      const active = row[5]?.trim() === "TRUE"; // F
      const points = Number(row[6]);            // G

      if(active && points > 0 && PARTIES[party]){
        candidates.push({ party, points });
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
  if(!bar) return;

  bar.innerHTML = "";
  const counts = {};

  REGIONS.forEach(region=>{
    let party = null;

    if(regionElection[region]){
      party = regionResults[region];
    } else {
      party = regionFixedParty[region];
    }

    if(party && PARTIES[party]){
      counts[party] = (counts[party] || 0) + 1;
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
   MAP COLORING + INTERACTION
========================= */

function colorMap(){
  const map = document.getElementById("us-map");
  if(!map) return;

  const apply = ()=>{
    const svgDoc = map.contentDocument;
    if(!svgDoc) return;

    const svg = svgDoc.querySelector("svg");
    if(!svg) return;

    REGIONS.forEach(region=>{
      const states = REGION_STATES[region];

      let color = "#8a8a8a";
      let dynamic = false;

      if(regionElection[region]){
        const p = regionResults[region];
        if(p && PARTIES[p]){
          color = PARTIES[p].color;
          dynamic = true;
        }
      } else {
        const p = regionFixedParty[region];
        if(p && PARTIES[p]){
          color = PARTIES[p].color;
        }
      }

      states.forEach(code=>{
        const el = svg.querySelector(`#${code}`);
        if(!el) return;

        el.style.fill = color;
        el.style.stroke = "#000";
        el.style.strokeWidth = "2";

        if(dynamic){
          el.style.filter = "drop-shadow(0 0 6px white)";
          el.style.cursor = "pointer";

          el.addEventListener("click", ()=>{
            window.location.href = `region.html?region=${region}`;
          });
        } else {
          el.style.filter = "none";
          el.style.cursor = "default";
        }
      });
    });
  };

  if(map.contentDocument){
    apply();
  }
  map.addEventListener("load", apply);
}

});
