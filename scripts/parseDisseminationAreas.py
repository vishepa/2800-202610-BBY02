"""
BC Cities Census Pipeline
=========================
Combines three steps into one pass for one or more cities:

  1. getBoundaries    – extracts DA boundaries from the national shapefile
  2. parseDissemination – filters census characteristics to target DAs
  3. combineData      – merges geometry + characteristics into one CSV

The geo lookup CSV is read once and shared across steps 1 & 2.
All cities are unioned before the combine step, so the output is one file.

Requirements:
    pip install geopandas pandas

Inputs (all in the same directory, or pass paths as CLI args):
    - lda_000b21a_e.zip
    - 98-401-X2021006_Geo_starting_row_BritishColumbia.CSV
    - 98-401-X2021006_English_CSV_data_BritishColumbia.csv

Output:
    - bc_cities_das_combined.csv      (final merged output)

Intermediate files (written so you can inspect them):
    - bc_cities_dissemination_areas.csv
    - bc_cities_DA_2021_filtered.csv

Usage:
    python3 vancouver_census_pipeline.py
    python3 vancouver_census_pipeline.py <shapefile_zip> <geo_csv> <census_csv> [output_csv]

To add or remove cities, edit the CITIES list in the CONFIGURATION section.
Each entry is a (city_name, csd_dguid) tuple.
  city_name  must match the "Geo Name" column in the geo lookup CSV exactly.
  csd_dguid  is the CSD-level DGUID from the same file (e.g. "2021A00055915022").
"""

import os
import sys
import csv
import zipfile
import tempfile
import pandas as pd
import geopandas as gpd
from pathlib import Path

# =============================================================================
# CONFIGURATION
# =============================================================================

SHAPEFILE_ZIP    = "lda_000b21a_e.zip"
GEO_CSV          = "98-401-X2021006_Geo_starting_row_BritishColumbia.CSV"
CENSUS_CSV       = "98-401-X2021006_English_CSV_data_BritishColumbia.csv"

INTERMEDIATE_BOUNDARIES = "bc_cities_dissemination_areas.csv"
INTERMEDIATE_CHARS      = "bc_cities_DA_2021_filtered.csv"
OUTPUT_CSV              = "bc_cities_das_combined.csv"

# Add or remove cities here.
# City name must match "Geo Name" in the geo lookup CSV exactly.
CITIES = [
    # "Metro Vancouver A",
    "Vancouver",
    "Musqueam 2"
]

# Characteristic IDs to extract from the census CSV.
# Set to None to keep all 2631 characteristics.
CHARACTERISTIC_IDS = [
    # Population
    1, 6, 7,
    # Household size
    57,
    # Income (individual, 100% data)
    113, 115,
    # Household income (100% data)
    243, 244,
    # Low income
    345, 360,
    # Visible minority
    1684,
    # Shelter cost
    1467,
    # Labour
    2229, 2230,
    # Commuting
    2603, 2605, 2606, 2607, 2608, 2609, 2610,
]

# Characteristic IDs used in the final combine step
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
RATE_IDS = {345, 1467}


# =============================================================================
# STEP 1 — Read geo lookup CSV once; extract DA codes and DGUIDs for all cities.
# =============================================================================

def load_geo_lookup(geo_file: str, cities: list[tuple[str, str]]):
    print(f"\n[Step 1] Reading geo lookup: {geo_file}")
    with open(geo_file, encoding="latin-1") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    df = pd.DataFrame(rows)

    all_da_codes:  list = []
    all_da_dguids: set  = set()

    for city_name in cities:
        print(f"\n  City: {city_name}")

        matches = df[df["Geo Name"] == city_name]
        if matches.empty:
            raise ValueError(f"  '{city_name}' not found in Geo Name column of {geo_file}")
        city_idx = matches.index[0]

        da_codes  = []
        da_dguids = set()
        for i in range(city_idx + 1, len(df)):
            geo_code = str(df.iloc[i]["Geo Code"])
            if geo_code.startswith("2021S"):
                all_da_codes.append(df.iloc[i]["Geo Name"])   # DAUID (e.g. "59150016")
                all_da_dguids.add(geo_code)                    # DGUID (e.g. "2021S051259150016")
            else:
                break

        print(f"    DA codes (shapefile) : {len(da_codes)}")
        print(f"    DA DGUIDs (census)   : {len(da_dguids)}")

    print(f"\n  Total DA codes  : {len(all_da_codes)}")
    print(f"  Total DA DGUIDs : {len(all_da_dguids)}")
    return all_da_codes, all_da_dguids


# =============================================================================
# STEP 2 — Extract DA boundaries from national shapefile
# =============================================================================

def extract_boundaries(shapefile_zip: str, da_codes: list, output_csv: str) -> pd.DataFrame:
    print(f"\n[Step 2] Extracting boundaries from: {shapefile_zip}")
    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(shapefile_zip, "r") as zf:
            zf.extractall(tmpdir)
        shp_path = next(Path(tmpdir).glob("*.shp"), None)
        if not shp_path:
            raise FileNotFoundError("No .shp file found inside the zip.")
        print(f"  Reading shapefile: {shp_path.name}")
        gdf = gpd.read_file(shp_path)

    print(f"  Filtering {len(gdf):,} national DAs to {len(da_codes)} target DAs...")
    van_gdf = gdf[gdf["DAUID"].isin(da_codes)].copy()
    print(f"  Matched {len(van_gdf)} DAs")

    print("  Reprojecting to WGS84 (EPSG:4326)...")
    van_gdf = van_gdf.to_crs(epsg=4326)

    geo_df = van_gdf.copy()
    geo_df["geometry"] = geo_df["geometry"].apply(lambda g: g.wkt)
    geo_df = geo_df.rename(columns={
        "DAUID":    "dauid",
        "DGUID":    "dguid",
        "LANDAREA": "land_area_km2",
        "PRUID":    "pruid",
        "geometry": "geom",
    })

    geo_df.to_csv(output_csv, index=False)
    size_mb = os.path.getsize(output_csv) / 1024 / 1024
    print(f"  Saved -> {output_csv} ({size_mb:.1f} MB, {len(geo_df)} rows)")
    return geo_df


# =============================================================================
# STEP 3 — Filter census CSV to Vancouver DAs + selected characteristics
# =============================================================================

def filter_census(census_csv: str, da_dguids: set, output_csv: str,
                  characteristic_ids=None) -> pd.DataFrame:
    print(f"\n[Step 3] Filtering census data: {census_csv}")

    char_ids_str = (
        {str(x) for x in characteristic_ids} if characteristic_ids else None
    )

    chunks = []
    sample_dguids_seen = set()  # ← ADD THIS
    reader = pd.read_csv(census_csv, dtype=str, chunksize=100_000, encoding="latin-1")

    for i, chunk in enumerate(reader):
        matched = chunk[chunk["DGUID"].isin(da_dguids)]
        if char_ids_str is not None and not matched.empty:
            matched = matched[matched["CHARACTERISTIC_ID"].isin(char_ids_str)]
        if not matched.empty:
            chunks.append(matched)
        if (i + 1) % 10 == 0:
            print(f"  ... {(i + 1) * 100_000:,} rows scanned")

    print(f"  Sample DGUIDs seen in census CSV: {list(sample_dguids_seen)[:5]}")  # ← ADD THIS
    print(f"  Sample DGUIDs we built:           {list(da_dguids)[:5]}")

    if not chunks:
        raise RuntimeError("No matching rows found in census CSV.")

    result = pd.concat(chunks, ignore_index=True)

    for col in ["C1_COUNT_TOTAL", "C2_COUNT_MEN+", "C3_COUNT_WOMEN+",
                "C10_RATE_TOTAL", "C11_RATE_MEN+", "C12_RATE_WOMEN+"]:
        if col in result.columns:
            result[col] = pd.to_numeric(result[col], errors="coerce")

    print(f"  Dissemination areas : {result['DGUID'].nunique()}")
    print(f"  Characteristics     : {result['CHARACTERISTIC_ID'].nunique()}")
    print(f"  Total rows          : {len(result):,}")

    result.to_csv(output_csv, index=False)
    print(f"  Saved -> {output_csv}")
    return result


# =============================================================================
# STEP 4 — Combine geometry + characteristics into final CSV
# =============================================================================

def combine(geo_df: pd.DataFrame, chars_df: pd.DataFrame, output_csv: str) -> pd.DataFrame:
    print(f"\n[Step 4] Combining geometry and characteristics...")

    chars_df["CHARACTERISTIC_ID"] = pd.to_numeric(chars_df["CHARACTERISTIC_ID"], errors="coerce")
    chars = chars_df[chars_df["CHARACTERISTIC_ID"].isin(CHAR_IDS)]

    def pick_value(row):
        if row["CHARACTERISTIC_ID"] in RATE_IDS:
            return row["C10_RATE_TOTAL"]
        return row["C1_COUNT_TOTAL"]

    chars = chars.copy()
    chars["value"] = chars.apply(pick_value, axis=1)
    chars["col_name"] = chars["CHARACTERISTIC_ID"].map(CHAR_IDS)

    pivoted = (
        chars
        .pivot_table(index="ALT_GEO_CODE", columns="col_name", values="value", aggfunc="first")
        .reset_index()
        .rename(columns={"ALT_GEO_CODE": "dauid"})
    )
    pivoted["dauid"] = pivoted["dauid"].astype(str)

    # Cast median income to nullable integer (pivot produces float)
    if "median_household_income_2020" in pivoted.columns:
        pivoted["median_household_income_2020"] = (
            pivoted["median_household_income_2020"].round(0).astype("Int64")
        )

    # Derive commute percentages
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
    pivoted = pivoted.drop(columns=["commute_total", "commute_car_driver",
                                    "commute_car_passenger", "commute_transit",
                                    "commute_walk"])

    geo_df["dauid"] = geo_df["dauid"].astype(str)
    merged = geo_df[["dauid", "geom"]].merge(pivoted, on="dauid", how="left")

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
    # Only include columns that exist (guards against missing characteristics)
    col_order = [c for c in col_order if c in merged.columns]
    merged = merged[col_order]

    merged.to_csv(output_csv, index=False)
    size_kb = os.path.getsize(output_csv) / 1024
    print(f"  Saved -> {output_csv} ({size_kb:.0f} KB, {len(merged)} rows)")
    print(f"\n  Column summary:")
    print(merged.drop(columns="geom").describe(include="all").to_string())
    return merged


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    shapefile_zip = sys.argv[1] if len(sys.argv) > 1 else SHAPEFILE_ZIP
    geo_csv       = sys.argv[2] if len(sys.argv) > 2 else GEO_CSV
    census_csv    = sys.argv[3] if len(sys.argv) > 3 else CENSUS_CSV
    output_csv    = sys.argv[4] if len(sys.argv) > 4 else OUTPUT_CSV

    # Step 1: read geo lookup once for all cities
    da_codes, da_dguids = load_geo_lookup(geo_csv, CITIES)

    # Step 2: boundaries (also writes intermediate CSV)
    geo_df = extract_boundaries(shapefile_zip, da_codes, INTERMEDIATE_BOUNDARIES)

    # Step 3: census characteristics (also writes intermediate CSV)
    chars_df = filter_census(census_csv, da_dguids, INTERMEDIATE_CHARS, CHARACTERISTIC_IDS)

    # Step 4: combine and write final output
    combine(geo_df, chars_df, output_csv)

    print(f"\nFinal output: {output_csv}")
