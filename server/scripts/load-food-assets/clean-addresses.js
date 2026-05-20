/**
 * clean-addresses.js
 *
 * One-time script to clean the Address and Address_KML columns
 * in Vancouver_Food_Asset_Map.csv for better Nominatim geocoding.
 *
 * Usage:
 *   node clean-addresses.js              # writes cleaned CSV in-place
 *   node clean-addresses.js --dry-run    # logs changes without writing
 */

const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const CSV_PATH = path.join(__dirname, 'Vancouver_Food_Asset_Map.csv');
const DRY_RUN = process.argv.includes('--dry-run');

// -------------------------------------------------------------------------
// Known typo fixes (original → corrected)
// -------------------------------------------------------------------------
const TYPO_FIXES = [
  // Truncated / wrong street names
  [/\b42W\b/, '42 W'],                           // Tonari Gumi: "42W 8th Ave"
  [/\b30215 Slocan\b/, '3215 Slocan'],           // Italian Cultural Centre
  [/\b2029 E Mal\b/, '2029 East Mall'],           // Oak Collegium UBC
  [/\bE\.?\s*Hasting\b(?!s)/g, 'E Hastings'],    // "E. Hasting" → "E Hastings"
  [/\bHasting\b(?!s)/g, 'Hastings'],              // "Hasting" → "Hastings"
  [/\bE3rd\b/, 'E 3rd'],                          // "54 E3rd ave" → "54 E 3rd ave"
  [/\b3512 W 7th Ave W\b/, '3512 W 7th Ave'],    // double "W"
  [/\bVancouve\b(?!r)/, 'Vancouver'],             // truncated city name
];

// -------------------------------------------------------------------------
// Address cleaning function
// -------------------------------------------------------------------------
function cleanAddress(raw) {
  if (!raw || !raw.trim()) return raw;

  let addr = raw;

  // 1. Collapse multi-line to single line
  addr = addr.replace(/\r?\n/g, ', ').replace(/,\s*,/g, ', ');

  // 2. Apply typo fixes
  for (const [pattern, replacement] of TYPO_FIXES) {
    addr = addr.replace(pattern, replacement);
  }

  // 3. Remove unit/suite/room/floor prefixes
  //    "#59 – 2357 Main Mall" → "2357 Main Mall"
  //    "Suite 220 - 145 Chadwick" → "145 Chadwick"
  //    "Room 0001C, 6138 Student Union" → "6138 Student Union"
  //    "#102–1193 Kingsway" → "1193 Kingsway"
  //    "#403-268 Keefer" → "268 Keefer"
  //    "#500 - 610 Main" → "610 Main"
  //    "604 - 1887 Crowe" → "1887 Crowe" (unit disguised as number)
  //    "100-290 E 1st Ave" → "290 E 1st Ave"
  //    "204 - 3077 Granville" → "3077 Granville"
  //    "217 – 312 Main" → "312 Main"
  addr = addr.replace(/^#\s*\d+\s*[–\-,]\s*/, '');
  addr = addr.replace(/^(?:Suite|Unit|Room)\s+[\w]+\s*[–\-,]\s*/i, '');
  addr = addr.replace(/^\d{1,4}\s*[–\-]\s*(?=\d{3,5}\s+[A-Z])/i, '');

  // "1101 Seymour St, Suite 401, 4th Floor" → "1101 Seymour St"
  addr = addr.replace(/,\s*(?:Suite|Unit|Ste|Room)\s+[\w]+(?:,\s*\d+(?:st|nd|rd|th)\s+Floor)?/gi, '');
  addr = addr.replace(/,\s*\d+(?:st|nd|rd|th)\s+floor/gi, '');

  // 4. Remove parenthetical notes
  //    "(H.R. Macmillan Building)", "(DTES)", "(South Van)", "(Mt Pleasant)"
  //    "(Blusson Spinal Cord Centre)", "(at 5th avenue)"
  //    "(other pickups available on website)"
  addr = addr.replace(/\s*\([^)]*\)\s*/g, ' ');

  // 5. Remove UBC/campus building codes at start
  //    "LIFE 0023 University Boulevard" → "University Boulevard"
  addr = addr.replace(/^[A-Z]{2,}\s+\d+\w*\s+/i, '');

  // 6. Fix capitalization for ALL-CAPS addresses
  if (addr === addr.toUpperCase() && addr.length > 10) {
    addr = addr.replace(/\b\w+/g, (word) => {
      const lower = word.toLowerCase();
      // Keep certain words uppercase
      if (['bc', 'nw', 'ne', 'sw', 'se'].includes(lower)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    // Fix "Bc" back to "BC"
    addr = addr.replace(/\bBc\b/g, 'BC');
  }

  // 7. Remove "Canada" suffix
  addr = addr.replace(/,?\s*Canada\s*$/i, '');

  // 8. Remove postal codes embedded in address
  addr = addr.replace(/,?\s*\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/g, '');

  // 9. Normalize province: "B.C." / "B.C" / "British Columbia" → "BC"
  addr = addr.replace(/\bB\.C\.?\b/g, 'BC');
  addr = addr.replace(/\bBritish Columbia\b/gi, 'BC');

  // 10. Remove neighbourhood annotations after city
  //     "Vancouver (South Van)" → "Vancouver"
  //     "Vancouver (DTES)" → "Vancouver"
  addr = addr.replace(
    /,?\s*Vancouver\s*\((?:South Van|DTES|Mt Pleasant|Main St|Kitsilano|East Van|West End)[^)]*\)/gi,
    ', Vancouver'
  );

  // 11. Clean up formatting
  addr = addr.replace(/\s+/g, ' ');             // collapse multiple spaces
  addr = addr.replace(/\s+,/g, ',');            // space before comma
  addr = addr.replace(/,\s*,/g, ',');            // double commas
  addr = addr.replace(/,\s*$/g, '');             // trailing comma
  addr = addr.replace(/\.\s*$/g, '');            // trailing period
  addr = addr.replace(/^\s*,\s*/g, '');          // leading comma
  addr = addr.replace(/Vancouver\.\s*BC/i, 'Vancouver, BC'); // "Vancouver. BC"
  addr = addr.trim();

  // 12. Skip un-geocodable addresses (phone numbers, PO Boxes only)
  if (/^\d{3}[\s-]\d{3}[\s-]\d{4}$/.test(addr.trim())) return raw;
  if (/^PO\s+Box\b/i.test(addr.trim()) && !/\d+\s+\w+\s+(?:St|Ave|Dr|Rd|Blvd|Way)/i.test(addr)) return raw;

  // 13. Ensure address ends with ", Vancouver, BC" (or valid variant)
  //     Handle cases like "601 Keefer St" with no city
  const hasVancouver = /vancouver/i.test(addr);
  const hasBC = /\bBC\b/.test(addr);

  if (!hasVancouver && !isNonVancouverAddress(addr)) {
    // Add ", Vancouver, BC"
    addr = addr.replace(/,?\s*$/, '') + ', Vancouver, BC';
  } else if (hasVancouver && !hasBC) {
    // Has Vancouver but no BC - add it
    addr = addr.replace(/,?\s*Vancouver\s*$/i, ', Vancouver, BC');
    // Handle "Vancouver BC" with no comma
    if (!/Vancouver,\s*BC/.test(addr)) {
      addr = addr.replace(/Vancouver\s+BC/i, 'Vancouver, BC');
    }
  } else if (hasVancouver) {
    // Normalize: ensure "Vancouver, BC" format
    addr = addr.replace(/Vancouver\s+BC/i, 'Vancouver, BC');
    addr = addr.replace(/Vancouver,\s*BC/i, 'Vancouver, BC');
  }

  // 14. Fix missing comma between street and city
  //     "404 Alexander St Vancouver BC" → "404 Alexander St, Vancouver, BC"
  addr = addr.replace(
    /(\d+\s+[\w\s.]+(?:St|Street|Ave|Avenue|Dr|Drive|Rd|Road|Blvd|Boulevard|Way|Mews|Pl|Place|Cres|Mall|Av)\.?)\s+Vancouver/i,
    '$1, Vancouver'
  );

  // 15. Remove trailing period from street names before city
  //     "5251 Oak Street. Vancouver" → "5251 Oak Street, Vancouver"
  addr = addr.replace(/(\b(?:Street|Avenue|Drive|Road|Boulevard|Way)\b)\.\s*,/gi, '$1,');

  // 16. Final cleanup
  addr = addr.replace(/\s+/g, ' ').trim();
  addr = addr.replace(/,\s*,/g, ',');
  addr = addr.replace(/,\s*$/g, '');

  return addr;
}

// Addresses known to be outside Vancouver — flag but don't alter city
function isNonVancouverAddress(addr) {
  return /\b(?:North Vancouver|Burnaby|Richmond|Surrey|White Rock|New Westminster|Coquitlam)\b/i.test(addr);
}


// -------------------------------------------------------------------------
// CSV writing helper (handles quoting for fields with commas/newlines/quotes)
// -------------------------------------------------------------------------
function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function recordToCSV(record) {
  return record.map(escapeCSVField).join(',');
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------
const raw = fs.readFileSync(CSV_PATH, 'utf-8');
const records = parse(raw, {
  relax_column_count: true,
  relax_quotes: true,
});

const header = records[0];
const ADDRESS_KML_COL = 2;
const ADDRESS_COL = 12;

let changeCount = 0;
const changes = [];
const nonVancouver = [];
const removedRows = [];

for (let i = 1; i < records.length; i++) {
  const record = records[i];
  const name = record[1] || '(unnamed)';

  // Skip empty rows
  if (!record[ADDRESS_COL] && !record[ADDRESS_KML_COL]) continue;

  // Clean Address column
  if (record[ADDRESS_COL]) {
    const original = record[ADDRESS_COL];
    const cleaned = cleanAddress(original);
    if (cleaned !== original) {
      changes.push({
        row: i + 1,
        name,
        column: 'Address',
        original: original.replace(/\n/g, '\\n'),
        cleaned: cleaned.replace(/\n/g, '\\n'),
      });
      record[ADDRESS_COL] = cleaned;
      changeCount++;
    }
    if (isNonVancouverAddress(cleaned)) {
      nonVancouver.push({ row: i + 1, name, address: cleaned, index: i });
    }
  }

  // Clean Address_KML column
  if (record[ADDRESS_KML_COL]) {
    const original = record[ADDRESS_KML_COL];
    const cleaned = cleanAddress(original);
    if (cleaned !== original) {
      record[ADDRESS_KML_COL] = cleaned;
    }
  }
}

// Remove non-Vancouver rows (iterate in reverse to preserve indices)
for (const nv of nonVancouver.reverse()) {
  removedRows.push({ row: nv.row, name: nv.name, address: nv.address });
  records.splice(nv.index, 1);
}

// Deduplicate: remove rows with same Name + Address + Type (columns 1, 12, 3)
const NAME_COL = 1;
const TYPE_COL = 3;
const seen = new Set();
const duplicates = [];

for (let i = records.length - 1; i >= 1; i--) {
  const rec = records[i];
  const key = [
    (rec[NAME_COL] || '').trim().toLowerCase(),
    (rec[ADDRESS_COL] || '').trim().toLowerCase(),
    (rec[TYPE_COL] || '').trim().toLowerCase(),
  ].join('|||');

  if (seen.has(key)) {
    duplicates.push({ row: i + 1, name: rec[NAME_COL], address: rec[ADDRESS_COL], type: rec[TYPE_COL] });
    records.splice(i, 1);
  } else {
    seen.add(key);
  }
}

// -------------------------------------------------------------------------
// Output
// -------------------------------------------------------------------------
console.log(`\n=== Address Cleanup Report ===\n`);
console.log(`Total records: ${records.length - 1}`);
console.log(`Addresses changed: ${changeCount}\n`);

if (changes.length > 0) {
  console.log('--- Changes ---');
  for (const c of changes) {
    console.log(`  Row ${c.row} [${c.name}]`);
    console.log(`    ${c.column}: "${c.original}"`);
    console.log(`         → "${c.cleaned}"`);
  }
}

if (removedRows.length > 0) {
  console.log(`\n--- Removed Non-Vancouver Rows (${removedRows.length}) ---`);
  for (const nv of removedRows) {
    console.log(`  Row ${nv.row} [${nv.name}]: ${nv.address}`);
  }
}

if (duplicates.length > 0) {
  console.log(`\n--- Removed Duplicates (${duplicates.length}) ---`);
  for (const d of duplicates) {
    console.log(`  Row ${d.row} [${d.name}] @ ${d.address} (${d.type})`);
  }
}

if (!DRY_RUN) {
  const csvLines = [recordToCSV(header)];
  for (let i = 1; i < records.length; i++) {
    csvLines.push(recordToCSV(records[i]));
  }
  const output = csvLines.join('\n') + '\n';
  fs.writeFileSync(CSV_PATH, output, 'utf-8');
  console.log(`\nCSV written to: ${CSV_PATH}`);
} else {
  console.log(`\n[DRY RUN] No files were modified.`);
}
