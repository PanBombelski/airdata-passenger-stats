# airdata-passenger-stats

A web application for exploring passenger traffic at Polish airports, based on public statistics from 2007 to 2023 (domestic traffic, regular and charter flights).

> Formerly called `airtraffic-anomalies`. The scope changed after consultation with the course instructor (see [Project scope](#project-scope)).

## Project scope

The first idea was to detect unusual flight routes using OpenSky data. After consultation with the course instructor, the project was changed to a simpler, data-based application built on quarterly airport statistics.

### Features

- **Ranking:** top 10 airports by passengers served, for a selected year and quarter.
- **Comparison:** two airports on one line chart, showing passengers over time.
- **Changes:** airports with the largest growth or decline between two selected years (e.g. 2019 vs 2023).
- **Seasonality:** share of each quarter in the yearly total for a selected airport.
- **Passengers per operation:** `passengers / passenger operations`, with an explanation of the indicator.
- **CSV export:** each table can be downloaded with the currently selected filters.
- **Theme switch:** light, dark or system setting, opened from the „Motyw” button.

## Wireframes

Desktop (1200 px) and mobile (390 px) wireframes, including the theme panel:

![Desktop wireframe](design/desktop-1200.svg)
![Mobile wireframe](design/mobile-390.svg)
![Desktop with theme panel](design/desktop-theme-open.svg)
![Mobile with theme panel](design/mobile-theme-open.svg)

## Data

- **File:** [`data/LOTY.csv`](data/LOTY.csv) (semicolon-separated, UTF-8)
- **Columns:** `nazwa_zmiennej`, `port_lotniczy`, `rok`, `kwartal`, `liczba_pasazerow`, `liczba_operacji_pasazerskich`
- **Scope:** 15 Polish airports, years 2007–2023, quarters 1–4
- **Rows:** 829 (a full grid would have 1020, so some airport–quarter combinations are missing)
- **Source:** *https://dane.gov.pl/pl/dataset/3791,ruch-lotniczy-w-polsce-przewozy-pasazerskie-operac/resource/55624/table?page=1&per_page=20&q=&sort=*

**Important:** passengers on domestic routes are counted twice (once at the departure airport and once at the arrival airport). Totals for all airports therefore overstate the number of domestic passengers. Comparisons between airports are fair, because each airport counts in the same way.

## Repository structure

airdata-passenger-stats/
├── README.md
├── README.pl.md
├── data/
│ └── LOTY.csv
└── design/
├── desktop-1200.svg
├── mobile-390.svg
├── desktop-theme-open.svg
└── mobile-theme-open.svg


## Current status

**Stage 1: Wireframes (done)**
- Site map: Start, Ranking, Comparison, Changes, Seasonality, plus Contact
- Desktop and mobile wireframes, approved by the instructor
- Theme panel shown after clicking „Motyw”
- Description of user interactions

## Planned stages

2. **Build (next):** static HTML, CSS and JavaScript prototype, with data loaded from the CSV file
3. **Analysis:** calculations for ranking, comparison, changes and seasonality
4. **Export:** CSV download of filtered data
5. **Verification:** test scenarios and a before/after report
6. **Delivery:** deployment instructions

## Context

University project (Politechnika Rzeszowska). Security weaknesses are kept on purpose in the first version and will be addressed in a later stage.

## Polish version

See [README.pl.md](README.pl.md).