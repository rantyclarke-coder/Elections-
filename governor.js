document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     CONFIG
  ========================= */

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv";

  /* =========================
     STATES BY REGION
  ========================= */

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

  const regionElection = {}; // NE → true / false

  /* =========================
     LOAD GOOGLE SHEET
  ========================= */

  fetch(CSV_URL)
    .then(r => r.text())
    .then(csv => {
      const rows = csv.split("\n").map(r => r.split(","));

      /* ---- REGION FLAGS (ROWS 60–63)
         B = region code
         D = TRUE / FALSE
      ---- */
      for (let i = 60; i <= 63; i++) {
        const region = rows[i]?.[1]?.trim(); // B
        const flag   = rows[i]?.[3]?.trim(); // D

        if (region) {
          regionElection[region] = (flag === "TRUE");
        }
      }

      enableMapInteractivity();
    })
    .catch(err => console.error("Governor CSV error:", err));

  /* =========================
     MAP INTERACTIVITY ONLY
  ========================= */

  function enableMapInteractivity() {
    const map = document.getElementById("us-map");
    if (!map) return;

    const apply = () => {
      const svgDoc = map.contentDocument;
      if (!svgDoc) return;

      const svg = svgDoc.querySelector("svg");
      if (!svg) return;

      REGIONS.forEach(region => {
        if (!regionElection[region]) return; // ❌ skip FALSE regions

        const states = REGION_STATES[region];

        states.forEach(code => {
          const el = svg.querySelector(`#${code}`);
          if (!el) return;

          // 🔑 MAKE SVG PATH CLICKABLE
          el.style.pointerEvents = "all";
          el.style.cursor = "pointer";

          // optional subtle feedback
          el.addEventListener("mouseenter", () => {
            el.style.opacity = "0.7";
          });

          el.addEventListener("mouseleave", () => {
            el.style.opacity = "1";
          });

          // ✅ CLICK → REGION PAGE
          el.addEventListener("click", () => {
            window.location.href = `region.html?region=${region}`;
          });
        });
      });
    };

    // if SVG already loaded
    if (map.contentDocument) {
      apply();
    }

    // otherwise wait
    map.addEventListener("load", apply);
  }

});
