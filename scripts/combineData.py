"""
Combine Vancouver DA boundary and census characteristics into a single CSV.

One row per dissemination area with columns for:
  - dauid, dguid, land_area_km2, geom (WKT)
  - population, population_density_per_km2
  - median_household_income_2020
  - pct_low_income_lim_at          (% below Low-Income Measure after tax)
  - pct_shelter_cost_30pct_plus    (% spending 30%+ of income on shelter — housing stress proxy)
  - pct_commute_car                (% driving or riding as passenger)
  - pct_commute_transit            (% taking public transit)
  - pct_commute_walk               (% walking)

Note: The census does not measure homelessness at the DA level. 
      'pct_shelter_cost_30pct_plus' is the standard Statistics Canada 
      proxy for housing affordability stress.

Requirements:
    pip install pandas

Inputs:
    - vancouver_dissemination_areas.csv    : DA boundaries (WKT geometry)
    - vancouver_DA_2021_filtered.csv       : Census characteristics

Output:
    - vancouver_das_combined.csv
"""

import pandas as pd

GEO_CSV   = "vancouver_dissemination_areas.csv"
CHAR_CSV  = "vancouver_DA_2021_filtered.csv"
OUTPUT    = "vancouver_das_combined.csv"

# Characteristic IDs to extract
CHAR_IDS = {
    1:    "population",
    6:    "population_density_per_km2",
    57:   "avg_household_size",
    243:  "median_household_income_2020",
    345:  "pct_low_income_lim_at",
    1467: "pct_shelter_cost_30pct_plus",
    2603: "commute_total",
    2605: "commute_car_driver",
    2606: "commute_car_passenger",
    2607: "commute_transit",
    2608: "commute_walk",
}

# ── Load and pivot characteristics ────────────────────────────────────────────

print(f"Reading characteristics: {CHAR_CSV}")
chars = pd.read_csv(CHAR_CSV, encoding="latin1", low_memory=False)

# Keep only the rows we need
chars = chars[chars["CHARACTERISTIC_ID"].isin(CHAR_IDS)]

# Use C1_COUNT_TOTAL as the value source (rates for % fields, counts for the rest)
# For percentages (IDs 345, 1467) C10_RATE_TOTAL is the right column;
# for counts/dollar amounts C1_COUNT_TOTAL is correct.
RATE_IDS = {345, 1467}

def pick_value(row):
    if row["CHARACTERISTIC_ID"] in RATE_IDS:
        return row["C10_RATE_TOTAL"]
    return row["C1_COUNT_TOTAL"]

chars["value"] = chars.apply(pick_value, axis=1)
chars["col_name"] = chars["CHARACTERISTIC_ID"].map(CHAR_IDS)

# Pivot to one row per DA
pivoted = (
    chars
    .pivot_table(index="ALT_GEO_CODE", columns="col_name", values="value", aggfunc="first")
    .reset_index()
    .rename(columns={"ALT_GEO_CODE": "dauid"})
)
pivoted["dauid"] = pivoted["dauid"].astype(str)

# ── Derive commute percentages ────────────────────────────────────────────────

pivoted["pct_commute_car"] = (
    (pivoted["commute_car_driver"] + pivoted["commute_car_passenger"])
    / pivoted["commute_total"] * 100
).round(1)

pivoted["pct_commute_transit"] = (
    pivoted["commute_transit"] / pivoted["commute_total"] * 100
).round(1)

pivoted["pct_commute_walk"] = (
    pivoted["commute_walk"] / pivoted["commute_total"] * 100
).round(1)

# Drop intermediate commute count columns
pivoted = pivoted.drop(columns=["commute_total", "commute_car_driver",
                                "commute_car_passenger", "commute_transit",
                                "commute_walk"])

# ── Load geometry and merge ───────────────────────────────────────────────────

print(f"Reading geometry: {GEO_CSV}")
geo = pd.read_csv(GEO_CSV, dtype={"dauid": str})

merged = geo[["dauid", "geom"]].merge(
    pivoted, on="dauid", how="left"
)

# ── Reorder columns ───────────────────────────────────────────────────────────

col_order = [
    "dauid", 
    "population_density_per_km2",
    "avg_household_size",
    "median_household_income_2020",
    "pct_low_income_lim_at",
    "pct_shelter_cost_30pct_plus",
    "pct_commute_car",
    "pct_commute_transit",
    "pct_commute_walk",
    "geom",
]
merged = merged[col_order]

# ── Export ────────────────────────────────────────────────────────────────────

print(f"Writing: {OUTPUT}")
merged.to_csv(OUTPUT, index=False)

import os
size_kb = os.path.getsize(OUTPUT) / 1024
print(f"\nDone! {OUTPUT} ({size_kb:.0f} KB, {len(merged)} rows)")
print(f"\nColumn summary:")
print(merged.drop(columns="geom").describe(include="all").to_string())