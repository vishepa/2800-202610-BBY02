"""
Filter 2021 Census Profile CSV to City of Vancouver Dissemination Areas
========================================================================
Edit CHARACTERISTIC_IDS below to select which variables you want.
Set to None to keep all 2631 characteristics.
 
Requirements:  pip install pandas
Usage:
    python3 parse_da.py <census_csv> <geo_starting_row_csv> [output_csv]
"""
 
import sys
import csv
import pandas as pd
 
# =============================================================================
# CONFIGURATION
# =============================================================================
 
CENSUS_CSV       = "98-401-X2021006_English_CSV_data.csv"
GEO_STARTING_ROW = "98-401-X2021006_Geo_starting_row_BritishColumbia.CSV"
OUTPUT_CSV       = "vancouver_DA_2021_filtered.csv"
 
VANCOUVER_CSD_DGUID = "2021A00055915022"
 
# =============================================================================
# CHARACTERISTIC IDs TO EXTRACT
# Set to None to keep all 2631 characteristics.
# =============================================================================
# --- Population ---
#   1   Population, 2021
#   2   Population, 2016
#   3   Population percentage change, 2016 to 2021
#   4   Total private dwellings
#   5   Private dwellings occupied by usual residents
#   6   Population density per square kilometre
#   7   Land area in square kilometres
#
# --- Age ---
#   8   Total - Age groups of the population
#   9     0 to 14 years
#   13    15 to 64 years
#   24    65 years and over
#   39  Average age of the population
#   40  Median age of the population
#
# --- Dwelling type ---
#   41  Total - Occupied private dwellings by structural type
#   42    Single-detached house
#   43    Semi-detached house
#   44    Row house
#   45    Apartment or flat in a duplex
#   46    Apartment in a building < 5 storeys
#   47    Apartment in a building >= 5 storeys
#
# --- Household size ---
#   50  Total - Private households by household size
#   51    1 person
#   52    2 persons
#   57  Average household size
#
# --- Marital status ---
#   58  Total - Marital status (15+)
#   59    Married or living common-law
#   66    Not married and not living common-law
#
# --- Income (individual, 2020) ---
#   111 Total - Income statistics (pop 15+)
#   113   Median total income among recipients ($)
#   115   Median after-tax income among recipients ($)
#   119   Median employment income among recipients ($)
#
# --- Household income ---
#   131 Total - Household total income groups
#   143 Median total income of households ($)
#   144 Average total income of households ($)
#   145 Median after-tax income of households ($)
#   146 Average after-tax income of households ($)
#
# --- Low income ---
#   261 Prevalence of low income based on LICO-AT (%)
#   264 Prevalence of low income based on LIM-AT (%)
#
# --- Immigration & citizenship ---
#   1340 Total - Citizenship
#   1341   Canadian citizens
#   1344 Total - Immigrant status and period of immigration
#   1345   Non-immigrants
#   1346   Immigrants
#   1359   Non-permanent residents
#
# --- Visible minority ---
#   1360 Total - Visible minority
#   1361   Total visible minority population
#   1362     South Asian
#   1363     Chinese
#   1364     Black
#   1365     Filipino
#   1366     Arab
#   1367     Latin American
#   1368     Southeast Asian
#   1369     West Asian
#   1370     Korean
#   1371     Japanese
#   1372     Visible minority, n.i.e.
#   1373     Multiple visible minorities
#   1374   Not a visible minority
#
# --- Indigenous identity ---
#   1375 Total - Indigenous identity
#   1376   First Nations (North American Indian)
#   1377   Métis
#   1378   Inuk (Inuit)
#
# --- Mother tongue / language ---
#   1454 Total - Mother tongue
#   1455   English
#   1456   French
#   1457   Non-official languages
#
# --- Housing tenure ---
#   1727 Total - Private households by tenure
#   1728   Owner
#   1729   Renter
#   1730   Band housing
#
# --- Shelter cost ---
#   1731 Total - Private households by shelter-cost-to-income ratio
#   1733   Spending 30% or more of income on shelter costs
#
# --- Education (25-64) ---
#   1986 Total - Highest certificate, diploma or degree (25-64)
#   1987   No certificate, diploma or degree
#   1988   Secondary (high) school diploma or equivalency certificate
#   1993   Postsecondary certificate, diploma or degree
#   1994     Apprenticeship or trades certificate or diploma
#   1996     College, CEGEP or other non-university certificate or diploma
#   1998     University certificate, diploma or degree at bachelor level or above
#   1999       Bachelor's degree
#   2000       University certificate or diploma above bachelor level
#   2001       Degree in medicine, dentistry, veterinary medicine or optometry
#   2002       Master's degree
#   2003       Earned doctorate
#
# --- Labour force (15+) ---
#   2004 Total - Labour force status (15+)
#   2005   Employed
#   2006   Unemployed
#   2007   Not in the labour force
#   2008 Participation rate (%)
#   2009 Employment rate (%)
#   2010 Unemployment rate (%)
#
# --- Commuting ---
#   2396 Total - Main mode of commuting
#   2397   Car, truck, van - as a driver
#   2398   Car, truck, van - as a passenger
#   2399   Public transit
#   2400   Walked
#   2401   Bicycle
#   2402   Other method
 
CHARACTERISTIC_IDS = [
    # Population
    1, 2, 3, 4, 5, 6, 7,
    # Age
    9, 13, 24, 40,
    # # Dwelling type
    # 42, 43, 44, 45, 46, 47,
    # Household size
    57,
    # Income
    113, 143, 145,
    # Low income
    264,
    # Immigration
    1346, 1359,
    # Visible minority
    1361,
    # Housing tenure
    1728, 1729,
    # Shelter cost
    1733,
    # Education
    1987, 1999, 2003,
    # Labour
    2009, 2010,
    # Commuting
    2603
]
 
# Set to None to extract everything:
# CHARACTERISTIC_IDS = None

# =============================================================================
# STEP 1: Get Vancouver DA DGUIDs from Geo_starting_row file
# =============================================================================

def get_vancouver_da_dguids(geo_file: str, csd_dguid: str) -> set:
    rows = []
    with open(geo_file, encoding="latin-1") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
 
    van_idx = next(
        (i for i, r in enumerate(rows) if r["Geo Code"] == csd_dguid), None
    )
    if van_idx is None:
        raise ValueError(f"Vancouver CSD DGUID {csd_dguid} not found in {geo_file}")
 
    da_dguids = set()
    for row in rows[van_idx + 1:]:
        if row["Geo Code"].startswith("2021S0512"):
            da_dguids.add(row["Geo Code"])
        else:
            break
 
    print(f"Vancouver DAs found: {len(da_dguids)}")
    return da_dguids
 
 
# =============================================================================
# STEP 2: Filter census CSV
# =============================================================================
 
def filter_census_csv(
    census_csv: str,
    da_dguids: set,
    output_csv: str,
    characteristic_ids=None,
) -> None:
    print(f"Filtering {census_csv} ...")
 
    char_ids_str = (
        {str(x) for x in characteristic_ids} if characteristic_ids else None
    )
 
    chunks = []
    reader = pd.read_csv(
        census_csv,
        dtype=str,
        chunksize=100_000,
        encoding="latin-1",
    )
 
    for i, chunk in enumerate(reader):
        matched = chunk[chunk["DGUID"].isin(da_dguids)]
 
        if char_ids_str is not None and not matched.empty:
            matched = matched[matched["CHARACTERISTIC_ID"].isin(char_ids_str)]
 
        if not matched.empty:
            chunks.append(matched)
 
        if (i + 1) % 10 == 0:
            print(f"  ... {(i+1) * 100_000:,} rows scanned")
 
    if not chunks:
        print("No matching rows found.")
        return
 
    result = pd.concat(chunks, ignore_index=True)
 
    for col in ["C1_COUNT_TOTAL", "C2_COUNT_MEN+", "C3_COUNT_WOMEN+",
                "C10_RATE_TOTAL", "C11_RATE_MEN+", "C12_RATE_WOMEN+"]:
        if col in result.columns:
            result[col] = pd.to_numeric(result[col], errors="coerce")
 
    print(f"\nResults:")
    print(f"  Dissemination areas : {result['DGUID'].nunique()}")
    print(f"  Characteristics     : {result['CHARACTERISTIC_ID'].nunique()}")
    print(f"  Total rows          : {len(result):,}")
 
    result.to_csv(output_csv, index=False)
    print(f"  Saved -> {output_csv}")
 
 
# =============================================================================
# MAIN
# =============================================================================
 
if __name__ == "__main__":
    census_csv       = sys.argv[1] if len(sys.argv) > 1 else CENSUS_CSV
    geo_starting_row = sys.argv[2] if len(sys.argv) > 2 else GEO_STARTING_ROW
    output_csv       = sys.argv[3] if len(sys.argv) > 3 else OUTPUT_CSV
 
    da_dguids = get_vancouver_da_dguids(geo_starting_row, VANCOUVER_CSD_DGUID)
    filter_census_csv(census_csv, da_dguids, output_csv, CHARACTERISTIC_IDS)
 
