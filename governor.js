document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     CONFIG
  ========================= */

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv";

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

      /* REGION FLAGS (ROWS 60–63)
         B = region code
         D = TRUE/FALSE
      */

      for (let i = 60; i <= 63; i++) {

        const region = rows[i]?.[1]?.trim();
        const flag   = rows[i]?.[3]?.trim();

        if(region){
          regionElection[region] = (flag === "TRUE");
        }

      }

      enableMapInteractivity();

    })
    .catch(err => console.error("Governor CSV error:", err));

  /* =========================
     MAP INTERACTIVITY (REGION SVG)
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

        // 🔥 now selecting REGION path directly
        const el = svg.querySelector(`#${region}`);
        if (!el) return;

        if(regionElection[region]){

          // clickable only if TRUE
          el.style.pointerEvents = "all";
          el.style.cursor = "pointer";

          // hover feedback
          el.addEventListener("mouseenter", () => {
            el.style.opacity = "0.75";
          });

          el.addEventListener("mouseleave", () => {
            el.style.opacity = "1";
          });

          // click → region page
          el.addEventListener("click", () => {
            window.location.href = `region.html?region=${region}`;
          });

        } else {

          // disable interaction
          el.style.pointerEvents = "none";
          el.style.cursor = "default";

        }

      });

    };

    // run if already loaded
    if(map.contentDocument){
      apply();
    }

    // otherwise wait for SVG load
    map.addEventListener("load", apply);

  }

});
