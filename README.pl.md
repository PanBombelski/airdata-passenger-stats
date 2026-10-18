# airtraffic-anomalies

Aplikacja internetowa do analizy ruchu pasażerskiego na polskich lotniskach, oparta na publicznych statystykach z lat 2007–2023 (ruch krajowy, regularny i czarterowy).

> Nazwa repozytorium pochodzi z pierwszego pomysłu projektu (wykrywanie anomalii). Zakres zmienił się po konsultacjach z prowadzącym; patrz „Zakres projektu”.

## Zakres projektu

Pierwszy pomysł polegał na wykrywaniu nietypowych tras lotniczych na podstawie danych OpenSky. Po konsultacjach z prowadzącym projekt został zmieniony na prostszą aplikację opartą na kwartalnych statystykach lotnisk.

Główne funkcje:
- **Ranking:** top 10 lotnisk według liczby obsłużonych pasażerów, dla wybranego roku i kwartału.
- **Porównywarka:** dwa lotniska na jednym wykresie liniowym, pokazującym liczbę pasażerów w czasie.
- **Zmiany:** lotniska z największym wzrostem lub spadkiem między dwoma wybranymi latami (np. 2019 i 2023).
- **Sezonowość:** udział każdego kwartału w roku dla wybranego lotniska.
- **Pasażerów na operację:** `pasażerowie / operacje pasażerskie`, z wyjaśnieniem wskaźnika.
- **Eksport CSV:** każda tabela może zostać pobrana jako plik z aktualnie wybranymi filtrami.

## Dane

- **Plik:** `LOTY.csv` (rozdzielany średnikami, UTF-8)
- **Kolumny:** `nazwa_zmiennej`, `port_lotniczy`, `rok`, `kwartal`, `liczba_pasazerow`, `liczba_operacji_pasazerskich`
- **Zakres:** 15 polskich lotnisk, lata 2007–2023, kwartały 1–4
- **Liczba wierszy:** 829 (pełna siatka miałaby 1020, więc część kombinacji lotnisko–kwartał nie występuje)

**Ważne:** pasażer na trasie krajowej jest liczony dwukrotnie (na lotnisku odlotu i przylotu). Suma dla wszystkich lotnisk zawyża więc liczbę pasażerów krajowych. Porównania między lotniskami są uczciwe, bo każde liczy pasażerów w ten sam sposób.

## Aktualny etap

**Etap 1: Makiety (w toku)**
- Mapa strony z pięcioma sekcjami (Start, Ranking, Porównywarka, Zmiany, Sezonowość) i Kontaktem
- Makieta desktopowa (1200 px)
- Makieta mobilna (390 px)
- Opis interakcji użytkownika

## Planowane etapy

2. Implementacja: prototyp w HTML, CSS i JavaScript, z danymi wczytanymi z CSV
3. Analiza: obliczenia dla rankingu, porównywarki, zmian i sezonowości
4. Eksport: pobieranie przefiltrowanych danych jako CSV
5. Weryfikacja: scenariusze testowe i raport PRZED/PO
6. Wdrożenie: instrukcja uruchomienia

## Kontekst

Projekt studencki (Politechnika Rzeszowska). Luki bezpieczeństwa są w pierwszej wersji celowo i zostaną poprawione w późniejszym etapie.

## English version

See [in English](README.pl.md).