document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     CONFIG
  ========================= */

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
     READ REGION FROM URL
  ========================= */

  const params = new URLSearchParams(window.location.search);
  const REGION = params.get("region"); // PA / NE / DX / LN
  if (!REGION || !REGION_NAMES[REGION]) return;

  /* =========================
     LOAD DATA
  ========================= */

  fetch(CSV_URL)
    .then(r => r.text())
    .then(csv => {
      const rows = csv.split("\n").map(r => r.split(","));

      /* ---- YEAR (C58) ---- */
      const year = rows[57]?.[2]?.trim();
      if (year) document.getElementById("region-year").textContent = year;

      /* ---- REGION NAME ---- */
      document.getElementById("region-name").textContent = REGION_NAMES[REGION];

      /* ---- REGION BLOCK START ---- */
      const regionIndex = { NE:0, LN:1, PA:2, DX:3 }[REGION];
      const startRow = 65 + regionIndex * 6;

      const candidates = [];

      for (let r = startRow; r < startRow + 5; r++) {
        const row = rows[r];
        if (!row) continue;

        const name   = row[3]?.trim(); // D
        const party  = row[4]?.trim(); // E
        const img    = row[7]?.trim(); // H
        const points = Number(row[8]); // I
        const status = row[9]?.trim(); // J (A/I)

        if (
          status !== "A" ||
          !name ||
          !points ||
          !PARTIES[party]
        ) continue;

        candidates.push({ name, party, img, points });
      }

      if (!candidates.length) return;

      /* =========================
         SORT + CALCULATE
      ========================= */

      candidates.sort((a,b)=>b.points - a.points);

      const totalPoints = candidates.reduce((s,c)=>s+c.points,0);
      const population = REGION_POPULATION[REGION];

      candidates.forEach(c=>{
        c.percent = ((c.points / totalPoints) * 100).toFixed(1);
        c.votes = Math.round((c.points / totalPoints) * population)
          .toLocaleString("en-US");
      });

      renderCandidates(candidates);
    });

  /* =========================
     RENDER
  ========================= */

  function renderCandidates(list){
    const wrap = document.getElementById("candidate-list");
    wrap.innerHTML = "";

    const leaderPoints = list[0].points;

    list.forEach((c, idx)=>{
      const isLeader = c.points === leaderPoints;
      const showTrend = list.length > 1;

      const div = document.createElement("div");
      div.className = "candidate";
      div.style.setProperty("--party-secondary", PARTIES[c.party].secondary);

      div.innerHTML = `
        <div class="photo">
          ${c.img ? `<img src="${c.img}">` : ""}
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
          showTrend
            ? isLeader
              ? `<div class="trend up"></div>`
              : `<div class="trend down"></div>`
            : ``
        }
      `;

      wrap.appendChild(div);
    });
  }

});
