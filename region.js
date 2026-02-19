document.addEventListener("DOMContentLoaded", () => {

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv";

  const PARTIES = {
    D: { name:"DEMOCRAT",    primary:"#1e3fd9", secondary:"#b8c6ff" },
    R: { name:"REPUBLICAN",  primary:"#dc143c", secondary:"#ffc1cc" },
    N: { name:"NPPA",        primary:"#2ecc71", secondary:"#b9f1cf" },
    I: { name:"INDEPENDENT", primary:"#bfa23a", secondary:"#e6d79c" }
  };

  const REGION_POPULATION = {
    PA: 39000000,
    NE: 33000000,
    DX: 51000000,
    LN: 42000000
  };

  const REGION_NAMES = {
    PA: "PACIFICA",
    NE: "NEW ENGLAND",
    DX: "DIXIE",
    LN: "LINCOLN"
  };

  /* =========================
   REGION MAP FILES
========================= */

const REGION_MAPS = {
  PA: "pacifica.svg",
  NE: "newengland.svg",
  DX: "dixie.svg",
  LN: "lincoln.svg"
};
  /* =========================
   REGION MAP POSITION SETTINGS
========================= */

const REGION_MAP_TRANSFORM = {

  PA: { scale:1.16, x:0, y:-6 },
  NE: { scale:1.25, x:0, y:0 },
  DX: { scale:1.37, x:-8, y:0 },
  LN: { scale:1.55, x:6, y:0 }

};
  
  const params = new URLSearchParams(window.location.search);
  const REGION = params.get("region");
  if (!REGION || !REGION_NAMES[REGION]) return;

  fetch(CSV_URL)
    .then(r => r.text())
    .then(csv => {
      const rows = csv.split("\n").map(r => r.split(","));

      const year = rows[57]?.[2]?.trim();
      if (year) document.getElementById("region-year").textContent = year;

      document.getElementById("region-name").textContent = REGION_NAMES[REGION];
/* LOAD REGION MAP */

const mapObj = document.getElementById("region-map");

if(mapObj && REGION_MAPS[REGION]){

  mapObj.data = REGION_MAPS[REGION];

  mapObj.addEventListener("load", ()=>{

    const cfg = REGION_MAP_TRANSFORM[REGION];
    if(!cfg) return;

    const svgDoc = mapObj.contentDocument;
    if(!svgDoc) return;

    const svg = svgDoc.querySelector("svg");
    if(!svg) return;

    svg.style.transform =
      `translate(${cfg.x}px, ${cfg.y}px) scale(${cfg.scale})`;

    svg.style.transformOrigin = "center center";

  });
}
      const regionBlocks = {
        NE: { start: 66, end: 70 },
        LN: { start: 72, end: 76 },
        PA: { start: 78, end: 82 },
        DX: { start: 84, end: 88 }
      };

      const block = regionBlocks[REGION];
      if (!block) return;

      const candidates = [];

      for (let r = block.start; r <= block.end; r++) {
        const row = rows[r];
        if (!row) continue;

        const name   = row[3]?.trim();
        const party  = row[4]?.trim();
        const img    = row[7]?.trim();
        const points = Number(row[8]);
        const status = row[9]?.trim();

        if (status !== "A") continue;
        if (!name || !PARTIES[party] || !points) continue;

        candidates.push({ name, party, img, points });
      }

      if (!candidates.length) return;

      candidates.sort((a, b) => b.points - a.points);

      const totalPoints = candidates.reduce((s,c) => s + c.points, 0);
      const pop = REGION_POPULATION[REGION];

      candidates.forEach(c => {
        c.percent = ((c.points / totalPoints) * 100).toFixed(1);
        c.votes = Math.round((c.points / totalPoints) * pop).toLocaleString("en-US");
      });

      renderCandidates(candidates);
renderDistrictMap(candidates);
    })
    .catch(err => console.error("Region CSV error:", err));

  function renderCandidates(list) {
    const container = document.getElementById("candidate-list");
    container.innerHTML = "";

    const leaderPoints = list[0].points;

    list.forEach((c, idx) => {
      const isLeader = c.points === leaderPoints;
      const hasTrend = list.length > 1;

      const row = document.createElement("div");
      row.className = "candidate";
      row.style.setProperty("--party-primary", PARTIES[c.party].primary);
      row.style.setProperty("--party-secondary", PARTIES[c.party].secondary);

row.innerHTML = `
  <div class="photo">
    <img src="${c.img || "/images/default.png"}"
         onerror="this.onerror=null; this.src="/images/default.png";">
  </div>

        <div class="info">
          <div class="name-line">
            <div class="name">${c.name}</div>
            ${isLeader ? `<div class="leader-badge">✓</div>` : ``}
          </div>
          <div class="party">${PARTIES[c.party].name}</div>
          <div class="votes">${c.percent}% | ${c.votes}</div>
        </div>

        ${
          hasTrend
            ? isLeader
              ? `<div class="trend up"></div>`
              : `<div class="trend down"></div>`
            : ``
        }
      `;
      container.appendChild(row);
    });
  }
/* =========================
   PACIFICA DISTRICT MAP COLOR
========================= */

function renderDistrictMap(candidateResults){

  const map = document.getElementById("region-map");
  if(!map) return;

  const apply = () => {

    const svgDoc = map.contentDocument;
    if(!svgDoc) return;

    const svg = svgDoc.querySelector("svg");
    if(!svg) return;

    /* SELECT ALL DISTRICTS (auto-detect) */
    const districts = Array.from(svg.querySelectorAll("path"));

    if(!districts.length) return;

    /* RANDOMIZE ORDER (don't change on refresh) */ 
  //  districts.sort((a,b)=>{
//  return a.id.localeCompare(b.id);
// });
    districts.sort(()=>Math.random()-0.5);
/* SEEDED RANDOM (stable scatter) 

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
} 

districts.sort((a,b)=>{
  const seedA = seededRandom(a.id.length + a.id.charCodeAt(0));
  const seedB = seededRandom(b.id.length + b.id.charCodeAt(0));
  return seedA - seedB;
}); */
    const total = districts.length;

    /* CALCULATE HOW MANY DISTRICTS EACH GETS */
    let pointer = 0;

    candidateResults.forEach((c,index)=>{

      const amount = Math.round((c.percent/100)*total);

      for(let i=0;i<amount && pointer<districts.length;i++){

  const d = districts[pointer];

  d.style.fill = PARTIES[c.party].secondary;

  /* opacity tier (Option A) */
  if(index===0) d.style.opacity="0.9";
  else if(index===1) d.style.opacity="0.7";
  else d.style.opacity="0.5";

  pointer++;
      }

    });

  };

  if(map.contentDocument) apply();
  map.addEventListener("load",apply);

}
});
