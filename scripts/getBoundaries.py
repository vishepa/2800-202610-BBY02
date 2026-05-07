"""
Extract dissemination area boundaries for the City of Vancouver and export
as a CSV with a WKT geometry column, ready to import into Supabase.

Requirements:
    pip install geopandas pandas

Inputs:
    - lda_000b21a_e.zip         : Statistics Canada national DA shapefile
    - 98-401-X2021006_Geo_starting_row_BritishColumbia.CSV : BC geo lookup CSV

Output:
    - vancouver_dissemination_areas.csv
"""

import os
import zipfile
import tempfile
import pandas as pd
import geopandas as gpd
from pathlib import Path

# ── Configuration ─────────────────────────────────────────────────────────────

SHAPEFILE_ZIP = "lda_000b21a_e.zip"
GEO_CSV       = "98-401-X2021006_Geo_starting_row_BritishColumbia.CSV"
CITY_NAME     = "Vancouver"
OUTPUT_CSV    = "vancouver_dissemination_areas.csv"

# ── Step 1: Load the geo lookup CSV and extract Vancouver DA codes ─────────────

print(f"Reading geo lookup CSV: {GEO_CSV}")
df = pd.read_csv(GEO_CSV, encoding="latin1")

matches = df[df["Geo Name"] == CITY_NAME]
if matches.empty:
    raise ValueError(f"'{CITY_NAME}' not found in the Geo Name column.")

city_idx = matches.index[0]
print(f"Found '{CITY_NAME}' at row index {city_idx}")

da_codes = []
for i in range(city_idx + 1, len(df)):
    geo_code = str(df.iloc[i]["Geo Code"])
    if geo_code.startswith("2021S"):
        da_codes.append(df.iloc[i]["Geo Name"])
    else:
        break

print(f"Found {len(da_codes)} dissemination areas for {CITY_NAME}")

# ── Step 2: Extract shapefile and filter to Vancouver ─────────────────────────

print(f"\nExtracting shapefile from: {SHAPEFILE_ZIP}")
with tempfile.TemporaryDirectory() as tmpdir:
    with zipfile.ZipFile(SHAPEFILE_ZIP, "r") as zf:
        zf.extractall(tmpdir)

    shp_path = next(Path(tmpdir).glob("*.shp"), None)
    if not shp_path:
        raise FileNotFoundError("No .shp file found inside the zip.")
    print(f"Reading shapefile: {shp_path.name}")
    gdf = gpd.read_file(shp_path)

print(f"Filtering {len(gdf):,} national DAs down to {CITY_NAME}...")
van_gdf = gdf[gdf["DAUID"].isin(da_codes)].copy()
print(f"Matched {len(van_gdf)} DAs")

# ── Step 3: Reproject and export CSV ──────────────────────────────────────────

print("\nReprojecting to WGS84 (EPSG:4326)...")
van_gdf = van_gdf.to_crs(epsg=4326)

csv_df = van_gdf.copy()
csv_df["geometry"] = csv_df["geometry"].apply(lambda g: g.wkt)
csv_df = csv_df.rename(columns={
    "DAUID":    "dauid",
    "DGUID":    "dguid",
    "LANDAREA": "land_area_km2",
    "PRUID":    "pruid",
    "geometry": "geom",
})

print(f"Writing: {OUTPUT_CSV}")
csv_df.to_csv(OUTPUT_CSV, index=False)

size_mb = os.path.getsize(OUTPUT_CSV) / 1024 / 1024
print(f"\nDone! {OUTPUT_CSV} ({size_mb:.1f} MB, {len(csv_df)} rows)")