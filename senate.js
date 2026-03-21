document.addEventListener("DOMContentLoaded", () => {

// ================== CONFIG ==================

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv&gid=277732088";
const YEAR_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?output=csv&gid=0";

const PARTIES = {
  D: { primary: "#0015BC" },
  R: { primary: "#FF0000" },
  I: { primary: "#00A86B" }
};

const DEFAULT_COLOR = "#888";
const SVG_NS = "http://www.w3.org/2000/svg";

// ================== DOM ==================

const mapObject = document.getElementById("senate-map");
const yearEl = document.getElementById("election-year");

if (!mapObject || !yearEl) {
  console.error("Senate page missing required #senate-map or #election-year.");
  return;
}

// ================== CSV HELPERS ==================

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i += 1;
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
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
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

function normalizeCode(code) {
  if (!code) return null;

  const clean = String(code).trim().toUpperCase();
  const match = clean.match(/^([A-Z]{2})-(\d+)$/);
  if (!match) return null;

  // region: NE, classKey: 1 / 2 / 3 / etc
  return { region: match[1], classKey: match[2] };
}

function isActive(status) {
  return String(status || "").trim().toUpperCase() === "A";
}

function parseYearFromB1(rows) {
  const raw = rows?.[0]?.[1]?.trim() || "";
  const match = raw.match(/\b\d{4}\b/);
  return match ? match[0] : raw || "XXXX";
}

// ================== DATA LOAD ==================

async function loadSenateData() {
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Senate sheet request failed (${response.status})`);
  }

  const text = await response.text();
  const rows = parseCSV(text).slice(9); // starts at row 10

  const candidates = rows.map((cols) => {
    const parsed = normalizeCode(cols[2]); // C
    const partyRaw = cols[4]?.trim();      // E
    const points = Number(cols[8]);        // I
    const status = cols[11]?.trim();       // L

    return {
      parsed,
      party: partyRaw ? partyRaw.toUpperCase().charAt(0) : "",
      points: Number.isFinite(points) ? points : 0,
      status
    };
  }).filter((candidate) => candidate.parsed && isActive(candidate.status));

  return candidates;
}

async function loadElectionYear() {
  const response = await fetch(YEAR_SHEET_URL);
  if (!response.ok) return "XXXX";

  const text = await response.text();
  const rows = parseCSV(text);
  return parseYearFromB1(rows);
}

// ================== WINNER / COLOR LOGIC ==================

function getRegionClassWinners(candidates) {
  const grouped = {};

  candidates.forEach((candidate) => {
    const { region, classKey } = candidate.parsed;

    if (!grouped[region]) grouped[region] = {};
    if (!grouped[region][classKey]) grouped[region][classKey] = [];

    grouped[region][classKey].push(candidate);
  });

  const winnersByRegion = {};

  Object.entries(grouped).forEach(([region, classes]) => {
    winnersByRegion[region] = [];

    Object.values(classes).forEach((classCandidates) => {
      const winner = classCandidates.reduce((max, current) =>
        current.points > max.points ? current : max
      );

      winnersByRegion[region].push(winner.party);
    });
  });

  return winnersByRegion;
}

function getPartyColor(partyCode) {
  return PARTIES[partyCode]?.primary || DEFAULT_COLOR;
}

function ensureDefs(svgDoc) {
  const svgRoot = svgDoc.querySelector("svg");
  if (!svgRoot) throw new Error("Senate SVG root not found.");

  let defs = svgRoot.querySelector("defs");
  if (!defs) {
    defs = svgDoc.createElementNS(SVG_NS, "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  return defs;
}

function createStripePattern(svgDoc, parties) {
  const normalized = [...new Set(parties.filter(Boolean))].sort();
  const id = `pattern-${normalized.join("-")}`;

  if (svgDoc.getElementById(id)) return id;

  const defs = ensureDefs(svgDoc);
  const size = 12;

  const pattern = svgDoc.createElementNS(SVG_NS, "pattern");
  pattern.setAttribute("id", id);
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", String(size));
  pattern.setAttribute("height", String(size));

  const bg = svgDoc.createElementNS(SVG_NS, "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(size));
  bg.setAttribute("height", String(size));
  bg.setAttribute("fill", getPartyColor(normalized[0]));
  pattern.appendChild(bg);

  const overlays = normalized.slice(1);
  const strokeWidth = Math.max(2, Math.floor(size / (overlays.length + 2)));

  overlays.forEach((party, index) => {
    const line = svgDoc.createElementNS(SVG_NS, "line");
    const offset = (index + 1) * (size / (overlays.length + 1));

    line.setAttribute("x1", "0");
    line.setAttribute("y1", String(offset));
    line.setAttribute("x2", String(size));
    line.setAttribute("y2", String(offset - size));
    line.setAttribute("stroke", getPartyColor(party));
    line.setAttribute("stroke-width", String(strokeWidth));
    line.setAttribute("stroke-linecap", "square");

    pattern.appendChild(line);
  });

  defs.appendChild(pattern);
  return id;
}

function applyMapColors(candidates) {
  const svgDoc = mapObject.contentDocument;
  if (!svgDoc) return;

  const winnersByRegion = getRegionClassWinners(candidates);

  Object.entries(winnersByRegion).forEach(([region, parties]) => {
    const el = svgDoc.getElementById(region);
    if (!el) return;

    const unique = [...new Set(parties.filter(Boolean))].sort();
    if (unique.length === 0) return;

    if (unique.length === 1) {
      el.setAttribute("fill", getPartyColor(unique[0]));
    } else {
      const patternId = createStripePattern(svgDoc, unique);
      el.setAttribute("fill", `url(#${patternId})`);
    }
  });
}

// ================== INIT ==================

Promise.all([loadSenateData(), loadElectionYear()])
  .then(([candidates, year]) => {
    yearEl.textContent = year;

    if (mapObject.contentDocument) {
      applyMapColors(candidates);
    }

    mapObject.addEventListener("load", () => applyMapColors(candidates), { once: true });
  })
  .catch((err) => {
    console.error("Senate CSV error:", err);
    yearEl.textContent = String(new Date().getUTCFullYear());
  });

});
