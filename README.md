# airtraffic-anomalies

A web application for exploring passenger traffic at Polish airports, based on public statistics from 2007 to 2023 (domestic traffic, regular and charter flights).

> The repository name is kept from the first project idea (anomaly detection). The scope has changed after course consultations; see "Project scope" below.

## Project scope

The first idea was to detect unusual flight routes using OpenSky data. After consultation with the course instructor, the project was changed to a simpler, data-based application built on quarterly airport statistics.

Main features:
- **Ranking:** top 10 airports by passengers served, for a selected year and quarter.
- **Comparison:** two airports on one line chart, showing passengers over time.
- **Changes:** airports with the largest growth or decline between two selected years (e.g. 2019 vs 2023).
- **Seasonality:** share of each quarter in the yearly total for a selected airport.
- **Passengers per operation:** `passengers / passenger operations`, with an explanation of the indicator.
- **CSV export:** each table can be downloaded as a file with the currently selected filters.

## Data

- **File:** `LOTY.csv` (semicolon-separated, UTF-8)
- **Columns:** `nazwa_zmiennej`, `port_lotniczy`, `rok`, `kwartal`, `liczba_pasazerow`, `liczba_operacji_pasazerskich`
- **Scope:** 15 Polish airports, years 2007–2023, quarters 1–4
- **Size:** 829 rows (a full grid would have 1020, so some airport-quarter combinations are missing)

**Important:** passengers on domestic routes are counted twice (once at the departure airport and once at the arrival airport). Totals for all airports therefore overstate the number of domestic passengers. Comparisons between airports are fair, because each airport counts in the same way.

## Current status

**Stage 1: Wireframes (in progress)**
- Site map with five sections (Start, Ranking, Comparison, Changes, Seasonality) plus Contact
- Desktop wireframe (1200 px)
- Mobile wireframe (390 px)
- Description of user interactions

## Planned stages

2. Build: static HTML, CSS and JavaScript prototype with the data loaded from CSV
3. Analysis: calculations for ranking, comparison, changes and seasonality
4. Export: CSV download of filtered data
5. Verification: test scenarios and a before/after report
6. Delivery: deployment instructions

## Context

University project (Politechnika Rzeszowska). Security weaknesses are kept on purpose in the first version and will be addressed in a later stage.

## Polska wersja

Zobacz [po polsku](README.pl.md).