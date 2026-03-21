/**
 * Senate region visualization from sheet data.
 *
 * Compatibility notes with senate.html:
 * - The sheet endpoint is published as CSV, so we parse CSV text.
 * - The map is embedded with <object id="senate-map">, so all region updates
 *   must be made inside that object's SVG document.
 */

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?gid=277732088&single=true&output=csv";

const PARTY_COLORS = {
  D: "#0015BC",
  R: "#FF0000",
  I: "#00A86B"
};

const DEFAULT_FILL = "#888";
const SVG_NS = "http://www.w3.org/2000/svg";
const MAP_OBJECT_ID = "senate-map";
const ACTIVE_STATUS = "A";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const [rows, svgDoc] = await Promise.all([fetchSheetRows(), getMapSvgDocument()]);
    const grouped = groupRowsByRegionAndClass(rows);
    const regionWinners = computeRegionWinners(grouped);
    applyRegionColors(regionWinners, svgDoc);
  } catch (error) {
    console.error("Senate map init failed:", error);
  }
}

/**
 * Fetch and parse published CSV sheet.
 */
async function fetchSheetRows() {
  const response = await fetch(SHEET_URL);
  if (!response.ok) throw new Error(`Sheet fetch failed (${response.status})`);

  const csv = await response.text();
  const rows = parseCsv(csv);

  // Data starts from row 10 in the sheet.
  return rows.slice(9);
}

/**
 * Small CSV parser with escaped quote handling.
 */
function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const ch = csv[i];
    const next = csv[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += ch;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

/**
 * Resolve the embedded Senate.svg document loaded in <object id="senate-map">.
 */
function getMapSvgDocument() {
  return new Promise((resolve, reject) => {
    const mapObject = document.getElementById(MAP_OBJECT_ID);
    if (!mapObject) {
      reject(new Error(`Missing map object element with id "${MAP_OBJECT_ID}"`));
      return;
    }

    const finish = () => {
      const svgDoc = mapObject.contentDocument;
      if (!svgDoc) {
        reject(new Error("Map SVG contentDocument is unavailable"));
        return;
      }
      resolve(svgDoc);
    };

    if (mapObject.contentDocument) {
      finish();
      return;
    }

    mapObject.addEventListener("load", finish, { once: true });

    // Guard against silent object load failures.
    setTimeout(() => {
      if (!mapObject.contentDocument) {
        reject(new Error("Timed out waiting for embedded Senate.svg to load"));
      }
    }, 10000);
  });
}

/**
 * Group candidates by region and senate class.
 * Source columns used:
 * - C (2): region-class code (e.g., NE-1)
 * - E (4): party code
 * - I (8): score/points
 * - L (11): active status
 */
function groupRowsByRegionAndClass(rows) {
  const grouped = {};

  rows.forEach((row) => {
    const code = (row[2] || "").trim();
    const party = (row[4] || "").trim();
    const points = Number(row[8]);
    const status = (row[11] || "").trim();

    if (!code || status !== ACTIVE_STATUS || Number.isNaN(points)) return;

    const [region, classNum] = code.split("-");
    if (!region || !classNum) return;

    if (!grouped[region]) grouped[region] = {};
    if (!grouped[region][classNum]) grouped[region][classNum] = [];

    grouped[region][classNum].push({ party, points });
  });

  return grouped;
}

/**
 * Pick winning party in each class and collapse to region-level winner sets.
 */
function computeRegionWinners(groupedByRegion) {
  const result = {};

  Object.entries(groupedByRegion).forEach(([region, classes]) => {
    const classWinners = [];

    Object.values(classes).forEach((candidates) => {
      const winner = candidates.reduce((max, current) =>
        current.points > max.points ? current : max
      );
      classWinners.push(winner.party);
    });

    result[region] = classWinners;
  });

  return result;
}

/**
 * Apply final fill color/pattern to each region element in the embedded SVG.
 */
function applyRegionColors(regionWinners, svgDoc) {
  Object.entries(regionWinners).forEach(([regionId, parties]) => {
    const regionElement = svgDoc.getElementById(regionId);
    if (!regionElement) return;

    const uniqueParties = [...new Set(parties.filter(Boolean))].sort();
    if (uniqueParties.length === 0) return;

    if (uniqueParties.length === 1) {
      regionElement.setAttribute("fill", getPartyColor(uniqueParties[0]));
      return;
    }

    const patternId = createStripePattern(uniqueParties, svgDoc);
    regionElement.setAttribute("fill", `url(#${patternId})`);
  });
}

function getPartyColor(partyCode) {
  return PARTY_COLORS[partyCode] || DEFAULT_FILL;
}

/**
 * Create an n-party diagonal stripe pattern.
 */
function createStripePattern(parties, svgDoc) {
  const defs = ensureDefs(svgDoc);
  const id = `pattern-${parties.join("-")}`;

  if (svgDoc.getElementById(id)) return id;

  const width = 12;
  const height = 12;
  const pattern = svgDoc.createElementNS(SVG_NS, "pattern");
  pattern.setAttribute("id", id);
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", String(width));
  pattern.setAttribute("height", String(height));

  // Base color
  const bg = svgDoc.createElementNS(SVG_NS, "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(width));
  bg.setAttribute("height", String(height));
  bg.setAttribute("fill", getPartyColor(parties[0]));
  pattern.appendChild(bg);

  // Overlay additional colors as diagonal lines.
  const overlays = parties.slice(1);
  const strokeWidth = Math.max(2, Math.floor(height / (overlays.length + 2)));

  overlays.forEach((party, index) => {
    const line = svgDoc.createElementNS(SVG_NS, "line");
    const offset = (index + 1) * (height / (overlays.length + 1));

    line.setAttribute("x1", "0");
    line.setAttribute("y1", String(offset));
    line.setAttribute("x2", String(width));
    line.setAttribute("y2", String(offset - height));
    line.setAttribute("stroke", getPartyColor(party));
    line.setAttribute("stroke-width", String(strokeWidth));
    line.setAttribute("stroke-linecap", "square");

    pattern.appendChild(line);
  });

  defs.appendChild(pattern);
  return id;
}

/**
 * Ensure <defs> exists inside the map SVG root.
 */
function ensureDefs(svgDoc) {
  const svgRoot = svgDoc.querySelector("svg");
  if (!svgRoot) {
    throw new Error("Map SVG root not found in embedded object");
  }

  let defs = svgRoot.querySelector("defs");
  if (!defs) {
    defs = svgDoc.createElementNS(SVG_NS, "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  return defs;
    }
