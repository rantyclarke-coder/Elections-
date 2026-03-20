document.addEventListener("DOMContentLoaded", () => {

// ================== CONFIG ==================

// 🔗 Google Sheet CSV
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv&gid=616046635";

// 🎨 PARTY COLORS
const PARTIES = {
  D: { primary: "#2B4C93" },
  R: { primary: "#C91F2E" },
  I: { primary: "#7f8c8d" }
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

if (!mapObject || !yearEl) {
  console.error("House page missing required #house-map or #election-year.");
  return;
}

// ================== CSV HELPERS ==================

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

function normalizeDistrict(code) {
  if (!code) return "";
  const clean = String(code).trim().toUpperCase();

  // Unique code format: NE-13 => district NE-1 and candidate #3
  const match = clean.match(/^([A-Z]{2})-(\d)(\d+)$/);
  if (!match) return "";

  return `${match[1]}-${match[2]}`;
}

function isWithdrawn(status) {
  const s = String(status || "").trim().toUpperCase();
  return s === "WITHDRAWN" || s === "W";
}

// ================== LOAD SHEET ==================

async function loadSheet() {
  const res = await fetch(SHEET_URL);
  if (!res.ok) {
    throw new Error(`Sheet request failed (${res.status})`);
  }

  const text = await res.text();
  const rows = parseCSV(text);

  // Keep old behavior: year from first row, second column
  const year = rows[0]?.[1]?.trim() || "XXXX";

  // No predefined rows: auto-read any row that has unique code in col C
  const data = rows.map(cols => {
    const code = cols[2]?.trim();   // C
    const party = cols[4]?.trim();  // E (R/D/I)
    const points = Number(cols[8]); // I
    const status = cols[11]?.trim(); // L

    return {
      code,
      district: normalizeDistrict(code),
      party: party ? party.trim().toUpperCase().charAt(0) : "",
      points: Number.isFinite(points) ? points : 0,
      status
    };
  }).filter(c => c.district && !isWithdrawn(c.status));

  return { data, year };
}

function getDistrictLeaders(data) {
  const sorted = [...data].sort((a, b) => {
    const districtOrder = a.district.localeCompare(b.district);
    if (districtOrder !== 0) return districtOrder;
    return b.points - a.points;
  });

  const leaders = {};

  sorted.forEach(candidate => {
    if (!leaders[candidate.district]) {
      leaders[candidate.district] = candidate;
    }
  });

  return leaders;
}

function applyMapColors(allData) {
  const svgDoc = mapObject.contentDocument;
  if (!svgDoc) return;

  const paths = svgDoc.querySelectorAll("path[region]");
  const districtLeaders = getDistrictLeaders(allData);

  paths.forEach(p => {
    const regionCode = p.getAttribute("region");
    const district = REGION_TO_DISTRICT[regionCode];

    if (!district) return;

    const leader = districtLeaders[district];
    const color = leader ? (PARTIES[leader.party]?.primary || "#ccc") : "#ccc";
    p.style.fill = color;
  });
}

// ================== INIT ==================

loadSheet()
  .then(({ data: allData, year }) => {
    yearEl.textContent = year;

    if (mapObject.contentDocument) {
      applyMapColors(allData);
    }

    mapObject.addEventListener("load", () => applyMapColors(allData));
  })
  .catch(err => {
    console.error("House CSV error:", err);
    yearEl.textContent = "XXXX";
  });

});
