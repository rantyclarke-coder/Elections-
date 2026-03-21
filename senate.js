/**
 * Senate region visualization from sheet data
 */

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?gid=277732088&single=true&output=csv";

const PARTY_COLORS = {
    D: "#0015BC",
    R: "#FF0000",
    I: "#00A86B"
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
    try {
        const rows = await fetchSheet();
        const structured = processRows(rows);
        const winners = computeWinners(structured);
        applyRegionColors(winners);
    } catch (err) {
        console.error("Init failed:", err);
    }
}

/**
 * Fetch sheet (expects array of rows)
 */
async function fetchSheet() {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error("Sheet fetch failed");

    const data = await res.json();
    return data.values.slice(9); // start from row 10
}

/**
 * Convert rows → region/class grouping
 */
function processRows(rows) {
    const map = {};

    rows.forEach(row => {
        const code = row[2];     // C
        const party = row[4];    // E
        const points = Number(row[8]); // I
        const status = row[11];  // L

        if (!code || status !== "A") return;

        const [region, classNum] = code.split("-");

        if (!map[region]) map[region] = {};
        if (!map[region][classNum]) map[region][classNum] = [];

        map[region][classNum].push({ party, points });
    });

    return map;
}

/**
 * Pick winning party per class
 */
function computeWinners(map) {
    const result = {};

    Object.entries(map).forEach(([region, classes]) => {
        result[region] = [];

        Object.values(classes).forEach(candidates => {
            const winner = candidates.reduce((max, curr) =>
                curr.points > max.points ? curr : max
            );

            result[region].push(winner.party);
        });
    });

    return result;
}

/**
 * Apply coloring logic
 */
function applyRegionColors(regionWinners) {
    Object.entries(regionWinners).forEach(([region, parties]) => {
        const el = document.getElementById(region);
        if (!el) return;

        const unique = [...new Set(parties)];

        if (unique.length === 1) {
            el.setAttribute("fill", PARTY_COLORS[unique[0]]);
        } else {
            const patternId = createStripePattern(unique);
            el.setAttribute("fill", `url(#${patternId})`);
        }
    });
}

/**
 * Create stripe pattern
 */
function createStripePattern(parties) {
    const defs = ensureDefs();
    const id = `pattern-${parties.join("-")}`;

    if (document.getElementById(id)) return id;

    const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", id);
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", 10);
    pattern.setAttribute("height", 10);

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", 10);
    bg.setAttribute("height", 10);
    bg.setAttribute("fill", PARTY_COLORS[parties[0]]);

    const stripe = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stripe.setAttribute("d", "M0,10 l10,-10");
    stripe.setAttribute("stroke", PARTY_COLORS[parties[1]]);
    stripe.setAttribute("stroke-width", 4);

    pattern.appendChild(bg);
    pattern.appendChild(stripe);
    defs.appendChild(pattern);

    return id;
}

/**
 * Ensure <defs> exists
 */
function ensureDefs() {
    const svg = document.querySelector("svg");
    let defs = svg.querySelector("defs");

    if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.appendChild(defs);
    }

    return defs;
      }
