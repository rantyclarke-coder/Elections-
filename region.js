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

  const params = new URLSearchParams(window.location.search);
  const REGION = params.get("region");
  if (!REGION || !REGION_NAMES[REGION]) return;

  fetch(CSV_URL)
    .then(r => r.text())
    .then(csv => {
      const rows = csv.split("\n").map(r => r.split(","));

      const year = rows[10]?.[20]?.trim();
      if (year) document.getElementById("region-year").textContent = year;

      document.getElementById("region-name").textContent = REGION_NAMES[REGION];

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
      row.style.setProperty("--party-secondary", PARTIES[c.party].secondary);

      row.innerHTML = `
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

});
