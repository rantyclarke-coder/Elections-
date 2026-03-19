document.addEventListener("DOMContentLoaded", async () => {

// ================== CONFIG ==================

// 🔗 Google Sheet CSV
const SHEET_URL = "PASTE_YOUR_WORKING_LINK";

// 🎨 PARTY COLORS
const PARTIES = {
  DEM: { primary: "#2B4C93" },
  REP: { primary: "#C91F2E" },
  IND: { primary: "#7f8c8d" }
};

// 🗺️ SVG REGION → DISTRICT
const REGION_TO_DISTRICT = {
  ok: "DX-1", ar: "DX-2", tn: "DX-3", fl: "DX-4", sc: "DX-5",
  nd: "LN-1", mn: "LN-2", il: "LN-3",
  wa: "PA-1", hi: "PA-1", ak: "PA-1", id: "PA-2",
  wv: "NE-1", pa: "NE-2", ny: "NE-3", ma: "NE-4", me: "NE-5"
};

// ================== DOM ==================

const mapObject = document.getElementById("house-map");
const yearEl = document.getElementById("election-year");

// ================== LOAD SHEET ==================

async function loadSheet() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();

  const rows = text.trim().split("\n");

  // 🟡 B1 → Year
  const firstRow = rows[0].split(",");
  const year = firstRow[1]?.trim() || "XXXX";

  // Skip first 5 rows (data starts from row 6)
  const dataRows = rows.slice(5);

  const data = dataRows.map(row => {
    const cols = row.split(",");

    return {
      code: cols[2]?.trim(),     // C
      party: cols[4]?.trim(),    // E
      points: parseFloat(cols[8]) || 0, // I
      status: cols[11]?.trim()   // L
    };
  }).filter(c => c.code && c.status !== "Withdrawn");

  return { data, year };
}

// ================== LOGIC ==================

function getDistrict(code) {
  const [region, rest] = code.split("-");
  return region + "-" + rest[0];
}

function getLeader(data, district) {
  return data
    .filter(c => getDistrict(c.code) === district)
    .sort((a, b) => b.points - a.points)[0];
}

// ================== INIT ==================

const { data: allData, year } = await loadSheet();

// Set year
yearEl.textContent = year;

// Wait for SVG
mapObject.addEventListener("load", () => {
  const svgDoc = mapObject.contentDocument;
  const paths = svgDoc.querySelectorAll("path[region]");

  paths.forEach(p => {
    const regionCode = p.getAttribute("region");
    const district = REGION_TO_DISTRICT[regionCode];

    if (!district) return;

    const leader = getLeader(allData, district);

    if (leader) {
      const color = PARTIES[leader.party]?.primary || "#ccc";
      p.style.fill = color;
    } else {
      p.style.fill = "#ccc";
    }
  });
});

});
