'use strict';
// =========================================================
// zmiany.js – strona „Zmiany”: które lotniska najbardziej
// wzrosły albo spadły między dwoma wybranymi latami.
//
// Porównujemy sumy roczne (4 kwartały). Lotnisko, które nie ma
// pełnych 4 kwartałów w jednym z lat, nie wchodzi do tabeli –
// jest wymienione pod tabelą. Brak danych nie jest zerem.
// =========================================================

const metrykaSelect = document.querySelector('#zmiany-metric');
const rokPoczatkowySelect = document.querySelector('#zmiany-rok-poczatkowy');
const rokKoncowySelect = document.querySelector('#zmiany-rok-koncowy');
const kierunekSelect = document.querySelector('#zmiany-kierunek');
const statusElement = document.querySelector('#zmiany-status');
const tabela = document.querySelector('#zmiany-table');
const tabelaBody = document.querySelector('#zmiany-body');
const pominieteElement = document.querySelector('#zmiany-pominiete');
const pobierzButton = document.querySelector('#zmiany-pobierz');

// Liczby z separatorami tysięcy, np. 1 234 567
const formatLiczby = new Intl.NumberFormat('pl-PL');
// Zmiana z jawnym znakiem: +1 234 albo −1 234 (znak tekstowy, nie tylko kolor)
const formatZmiany = new Intl.NumberFormat('pl-PL', { signDisplay: 'always' });
const formatProcent = new Intl.NumberFormat('pl-PL', { signDisplay: 'always', minimumFractionDigits: 1, maximumFractionDigits: 1 });

let dane = [];
let aktualneZmiany = [];
let aktualnePominiete = [];

function pokazStatus(tekst) {
  statusElement.textContent = tekst;
}

// Ten sam parser co w rankingu: czyta data/LOTY.csv (średniki, UTF-8 z BOM lub bez)
function parsujCSV(tekst) {
  const wiersze = tekst.replace(/^﻿/, '').trim().split(/\r?\n/);
  const naglowki = wiersze.shift().split(';').map(k => k.trim());
  const wymagane = ['port_lotniczy', 'rok', 'kwartal', 'liczba_pasazerow', 'liczba_operacji_pasazerskich'];
  if (!wymagane.every(n => naglowki.includes(n))) {
    throw new Error('Plik CSV nie zawiera wymaganych kolumn.');
  }

  return wiersze.filter(w => w.trim()).map(w => {
    const pola = w.split(';');
    const obiekt = Object.fromEntries(naglowki.map((n, i) => [n, (pola[i] || '').trim()]));
    return {
      lotnisko: obiekt.port_lotniczy,
      rok: Number(obiekt.rok),
      kwartal: Number(obiekt.kwartal),
      pasazerowie: obiekt.liczba_pasazerow === '' ? null : Number(obiekt.liczba_pasazerow),
      operacje: obiekt.liczba_operacji_pasazerskich === '' ? null : Number(obiekt.liczba_operacji_pasazerskich)
    };
  }).filter(w => w.lotnisko && Number.isInteger(w.rok) &&
    Number.isInteger(w.kwartal) && w.kwartal >= 1 && w.kwartal <= 4 &&
    [w.pasazerowie, w.operacje].every(v => v === null || (Number.isFinite(v) && v >= 0)));
}

// Wypełnia listy lat (wszystkie lata z pliku)
function uzupelnijLata() {
  const lata = [...new Set(dane.map(d => d.rok))].sort((a, b) => a - b);
  [rokPoczatkowySelect, rokKoncowySelect].forEach(select => {
    select.replaceChildren();
    lata.forEach(rok => {
      const opcja = document.createElement('option');
      opcja.value = String(rok);
      opcja.textContent = String(rok);
      select.append(opcja);
    });
  });
  // Domyślnie: 2019 → 2023 (rok przed pandemią i ostatni rok w danych)
  rokPoczatkowySelect.value = lata.includes(2019) ? '2019' : String(lata[0]);
  rokKoncowySelect.value = lata.includes(2023) ? '2023' : String(lata[lata.length - 1]);
}

// Suma roczna lotniska dla danego roku i rodzaju danych.
// Zwraca { suma, kompletny }. Kompletny = są wszystkie 4 kwartały z wartością.
function sumaRoczna(lotnisko, rok, metryka) {
  const kwartaly = dane.filter(w => w.lotnisko === lotnisko && w.rok === rok);
  const dostepne = new Set(kwartaly.filter(w => w[metryka] !== null).map(w => w.kwartal));
  const suma = kwartaly
    .filter(w => w[metryka] !== null)
    .reduce((acc, w) => acc + w[metryka], 0);
  return { suma, kompletny: dostepne.size === 4 };
}

function rysujZmiany() {
  const metryka = metrykaSelect.value;
  const nazwaDanych = metryka === 'operacje' ? 'operacji pasażerskich' : 'pasażerów';
  const rokA = Number(rokPoczatkowySelect.value);
  const rokB = Number(rokKoncowySelect.value);
  const kierunek = kierunekSelect.value;

  tabelaBody.replaceChildren();
  tabela.hidden = true;
  pobierzButton.disabled = true;
  pominieteElement.textContent = '';
  aktualneZmiany = [];
  aktualnePominiete = [];

  if (rokA >= rokB) {
    pokazStatus('Rok końcowy musi być późniejszy niż rok początkowy.');
    return;
  }

  const lotniska = [...new Set(dane.map(w => w.lotnisko))].sort((a, b) => a.localeCompare(b, 'pl'));

  lotniska.forEach(lotnisko => {
    const start = sumaRoczna(lotnisko, rokA, metryka);
    const koniec = sumaRoczna(lotnisko, rokB, metryka);
    if (!start.kompletny || !koniec.kompletny) {
      const brakuje = [];
      if (!start.kompletny) brakuje.push(String(rokA));
      if (!koniec.kompletny) brakuje.push(String(rokB));
      aktualnePominiete.push({ lotnisko, brakuje: brakuje.join(' i ') });
      return;
    }
    const zmiana = koniec.suma - start.suma;
    aktualneZmiany.push({
      lotnisko,
      rokA,
      rokB,
      wartoscA: start.suma,
      wartoscB: koniec.suma,
      zmiana,
      procent: start.suma === 0 ? null : (zmiana / start.suma) * 100
    });
  });

  // Filtr kierunku
  let widoczne = aktualneZmiany;
  if (kierunek === 'wzrosty') widoczne = aktualneZmiany.filter(w => w.zmiana > 0);
  if (kierunek === 'spadki') widoczne = aktualneZmiany.filter(w => w.zmiana < 0);

  // Sortowanie: największa zmiana bezwzględna na górze
  widoczne.sort((a, b) => Math.abs(b.zmiana) - Math.abs(a.zmiana) || a.lotnisko.localeCompare(b.lotnisko, 'pl'));
  aktualneZmiany = widoczne;

  // Lista pominiętych lotnisk pod tabelą
  if (aktualnePominiete.length) {
    const tekst = aktualnePominiete.map(p => `${p.lotnisko} (brak pełnych danych za ${p.brakuje})`).join('; ');
    pominieteElement.textContent = `Pominięte, bo brak pełnych 4 kwartałów: ${tekst}.`;
  }

  if (!aktualneZmiany.length) {
    pokazStatus(`Brak lotnisk z pełnymi danymi dla ${rokA} i ${rokB} roku, które spełniają wybrany kierunek.`);
    return;
  }

  aktualneZmiany.forEach((wiersz, indeks) => {
    const tr = document.createElement('tr');

    const miejsce = document.createElement('td');
    miejsce.textContent = String(indeks + 1);

    const lotnisko = document.createElement('td');
    lotnisko.textContent = wiersz.lotnisko;

    const wartoscA = document.createElement('td');
    wartoscA.className = 'ranking-liczba';
    wartoscA.textContent = formatLiczby.format(wiersz.wartoscA);

    const wartoscB = document.createElement('td');
    wartoscB.className = 'ranking-liczba';
    wartoscB.textContent = formatLiczby.format(wiersz.wartoscB);

    const zmiana = document.createElement('td');
    zmiana.className = 'ranking-liczba zmiana-liczba';
    zmiana.textContent = formatZmiany.format(wiersz.zmiana);

    const procent = document.createElement('td');
    procent.className = 'ranking-liczba';
    // Gdy baza (rok początkowy) wynosi 0, procent nie ma sensu – pokazujemy „—”
    procent.textContent = wiersz.procent === null ? '—' : formatProcent.format(wiersz.procent) + '%';

    tr.append(miejsce, lotnisko, wartoscA, wartoscB, zmiana, procent);
    tabelaBody.append(tr);
  });

  tabela.hidden = false;
  pobierzButton.disabled = false;

  const kierunekOpis = kierunek === 'wzrosty' ? 'tylko wzrosty' : kierunek === 'spadki' ? 'tylko spadki' : 'wszystkie zmiany';
  pokazStatus(`${aktualneZmiany.length} lotnisk – ${kierunekOpis} liczby ${nazwaDanych} między ${rokA} a ${rokB} rokiem, posortowane od największej zmiany.`);
}

function pobierzCSV() {
  const metryka = metrykaSelect.value;
  const naglowek = 'miejsce;port_lotniczy;rok_poczatkowy;rok_koncowy;' +
    (metryka === 'operacje' ? 'operacje_rok_poczatkowy;operacje_rok_koncowy' : 'pasazerowie_rok_poczatkowy;pasazerowie_rok_koncowy') +
    ';zmiana_bezwzgledna;zmiana_procentowa';
  const wiersze = aktualneZmiany.map((w, i) => [
    i + 1,
    w.lotnisko,
    w.rokA,
    w.rokB,
    w.wartoscA,
    w.wartoscB,
    w.zmiana,
    w.procent === null ? '' : w.procent.toFixed(1).replace('.', ',')
  ].join(';'));
  const blob = new Blob(['﻿' + [naglowek, ...wiersze].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `zmiany-${metryka}-${rokPoczatkowySelect.value}-${rokKoncowySelect.value}-${kierunekSelect.value}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function start() {
  try {
    const odpowiedz = await fetch('data/LOTY.csv');
    if (!odpowiedz.ok) throw new Error(`HTTP ${odpowiedz.status}`);
    dane = parsujCSV(await odpowiedz.text());
    if (!dane.length) throw new Error('CSV nie zawiera poprawnych danych.');
    uzupelnijLata();
    rysujZmiany();
    [metrykaSelect, rokPoczatkowySelect, rokKoncowySelect, kierunekSelect].forEach(select =>
      select.addEventListener('change', rysujZmiany));
    pobierzButton.addEventListener('click', pobierzCSV);
  } catch (blad) {
    pokazStatus('Nie udało się wczytać data/LOTY.csv. Uruchom stronę przez serwer (patrz instrukcja) i sprawdź nazwę pliku.');
    console.error('Błąd zmian:', blad);
  }
}

start();
