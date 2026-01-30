document.addEventListener("DOMContentLoaded", () => {

/* =========================
   CONFIG
========================= */

const CSV_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv";

/* PARTY DEFINITIONS (CODE-ONLY) */
const PARTIES = {
  D: { name:"DEMOCRAT", color:"#1e3fd9" },
  R: { name:"REPUBLICAN", color:"#dc143c" },
  I: { name:"INDEPENDENT", color:"#888" },
  G: { name:"GREEN", color:"#2ecc71" }
};

/* REGIONS */
const REGIONS = ["NE","PA","DX","LN"];
/* STATES INSIDE EACH REGION (HARDCODED) */
const REGION_STATES = {
  NE: ["ME","NH","VT","MA","RI","CT"],

  PA: ["CA","OR","WA","NV","AZ"],       // Pacifica (example)

  DX: ["TX","OK","LA","AR","MS","AL"],  // Dixie (example)

  LN: ["IL","IN","OH","MI","WI","MN"]   // Lincoln (example)
};
   
/* STORAGE */
const regionElection = {};     // NE → true/false
const regionResults = {};      // NE → winner party

/* =========================
   LOAD SHEET
========================= */
fetch(CSV_URL)
.then(r => r.text())
.then(csv => {
  const rows = csv.split("\n").map(r=>r.split(","));

  /* ---- REGION ELECTION FLAGS (ROW 60–63) ---- */
  for(let i=60;i<=63;i++){
    const region = rows[i][1]?.trim();
    const flag = rows[i][2]?.trim();
    if(region){
      regionElection[region] = flag === "TRUE";
    }
  }

  /* ---- CANDIDATES (ROW 65+) ---- */
  REGIONS.forEach(region=>{
    if(!regionElection[region]) return;

    const start = 65 + REGIONS.indexOf(region)*6;
    const candidates = [];

    for(let r=start;r<start+5;r++){
      const row = rows[r];
      if(!row) continue;

      const party = row[4]?.trim();
      const active = row[5]?.trim() === "TRUE";
      const points = Number(row[6]);

      if(active && points > 0){
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
   BAR
========================= */
function renderBar(){
  const bar = document.getElementById("party-bar");
  bar.innerHTML = "";

  const counts = {};
  Object.values(regionResults).forEach(p=>{
    counts[p] = (counts[p]||0)+1;
  });

  const total = Object.values(counts).reduce((a,b)=>a+b,0);

  Object.keys(counts).forEach(p=>{
    const seg = document.createElement("div");
    seg.className = "seg";
    seg.style.width = (counts[p]/total*100)+"%";
    seg.style.background = PARTIES[p].color;
    bar.appendChild(seg);
  });
}

/* =========================
   MAP
========================= */
function colorMap(){
  const map = document.getElementById("us-map");

  map.addEventListener("load", ()=>{
    const svg = map.contentDocument;
    if(!svg) return;

    REGIONS.forEach(region=>{
      const el = svg.getElementById(region);
      if(!el) return;

      if(regionElection[region]){
        const party = regionResults[region];
        if(party){
          el.style.fill = PARTIES[party].color;
          el.style.filter = "drop-shadow(0 0 4px white)";
        }
      }
    });
  });
}

});
