'use strict';

const metricSelect = document.querySelector('#ranking-metric');
const valueLabel = document.querySelector('#ranking-value-label');
const rokSelect = document.querySelector('#ranking-rok');
const kwartalSelect = document.querySelector('#ranking-kwartal');
const statusElement = document.querySelector('#ranking-status');
const tabelaBody = document.querySelector('#ranking-body');
const tabela = document.querySelector('#ranking-table');
const pobierzButton = document.querySelector('#ranking-pobierz');
const formatLiczby = new Intl.NumberFormat('pl-PL');
let dane = [];
let aktualnyRanking = [];

function pokazStatus(tekst) {
  statusElement.textContent = tekst;
}

function parsujCSV(tekst) {
  const wiersze = tekst.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
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
    [w.pasazerowie,w.operacje].every(v => v === null || (Number.isFinite(v) && v >= 0)));
}

function uzupelnijLata() {
  const lata = [...new Set(dane.map(d => d.rok))].sort((a, b) => b - a);
  rokSelect.replaceChildren();
  lata.forEach(rok => {
    const opcja = document.createElement('option');
    opcja.value = String(rok);
    opcja.textContent = String(rok);
    rokSelect.append(opcja);
  });
}

function dodajOpcjeCaloroczna() {
  if (kwartalSelect.querySelector('option[value="all"]')) return;
  const opcja = document.createElement('option');
  opcja.value = 'all';
  opcja.textContent = 'Cały rok (I–IV)';
  kwartalSelect.prepend(opcja);
  // Zachowujemy dotychczasowe domyślne wyświetlanie pierwszego kwartału.
  kwartalSelect.value = '1';
}

function rysujRanking() {
  const metric = metricSelect.value;
  const name = metric === 'operacje' ? 'operacji pasażerskich' : 'pasażerów';
  valueLabel.textContent = metric === 'operacje' ? 'Operacje pasażerskie' : 'Pasażerowie';
  const rok = Number(rokSelect.value);
  const calyRok = kwartalSelect.value === 'all';
  const kwartal = Number(kwartalSelect.value);
  const pasujace = dane.filter(w => w.rok === rok && (calyRok || w.kwartal === kwartal));

  // Sumujemy kwartały dla każdego lotniska. Brakujący kwartał nie staje się zerem.
  const grupy = new Map();
  pasujace.filter(w => w[metric] !== null).forEach(w => {
    if (!grupy.has(w.lotnisko)) {
      grupy.set(w.lotnisko, { lotnisko: w.lotnisko, rok, wartosc: 0, kwartaly: new Set() });
    }
    const g = grupy.get(w.lotnisko);
    g.wartosc += w[metric];
    g.kwartaly.add(w.kwartal);
  });

  aktualnyRanking = [...grupy.values()]
    .map(g => ({ lotnisko: g.lotnisko, rok: g.rok, wartosc: g.wartosc,
      liczbaKwartalow: g.kwartaly.size }))
    .sort((a, b) => b.wartosc - a.wartosc || a.lotnisko.localeCompare(b.lotnisko, 'pl'))
    .slice(0, 10);

  tabelaBody.replaceChildren();
  tabela.hidden = aktualnyRanking.length === 0;
  pobierzButton.disabled = aktualnyRanking.length === 0;

  if (!aktualnyRanking.length) {
    pokazStatus(calyRok ? `Brak danych dla ${rok} roku.` : `Brak danych dla ${rok} roku, ${kwartal}. kwartału.`);
    return;
  }

  const maksimum = Math.max(...aktualnyRanking.map(w => w.wartosc));
  aktualnyRanking.forEach((wiersz, indeks) => {
    const tr = document.createElement('tr');
    const pozycja = document.createElement('td');
    pozycja.textContent = String(indeks + 1);
    const lotnisko = document.createElement('td');
    lotnisko.textContent = wiersz.lotnisko;
    if (calyRok && wiersz.liczbaKwartalow < 4) {
      const uwaga = document.createElement('small');
      uwaga.style.display = 'block';
      uwaga.textContent = `Niepełny rok: ${wiersz.liczbaKwartalow}/4 kwartały`;
      lotnisko.append(uwaga);
    }
    const liczba = document.createElement('td');
    liczba.className = 'ranking-liczba';
    liczba.textContent = formatLiczby.format(wiersz.wartosc);
    const wykres = document.createElement('td');
    const slupek = document.createElement('div');
    slupek.className = 'ranking-slupek';
    slupek.style.width = `${maksimum ? (wiersz.wartosc / maksimum) * 100 : 0}%`;
    slupek.setAttribute('aria-label', `${wiersz.wartosc} ${name}`);
    wykres.append(slupek);
    tr.append(pozycja, lotnisko, liczba, wykres);
    tabelaBody.append(tr);
  });

  if (calyRok) {
    const niepelne = aktualnyRanking.filter(w => w.liczbaKwartalow < 4).length;
    pokazStatus(`TOP ${aktualnyRanking.length} lotnisk według liczby ${name} — cały ${rok} rok (suma dostępnych kwartałów).` +
      (niepelne ? ` Uwaga: ${niepelne} z TOP ${aktualnyRanking.length} lotnisk ma niepełne dane roczne — oznaczono je w tabeli.` : ''));
  } else {
    pokazStatus(`TOP ${aktualnyRanking.length} lotnisk według liczby ${name} — ${rok}, ${kwartal}. kwartał. Brakujące lotniska nie są traktowane jako 0.`);
  }
}

function pobierzCSV() {
  const calyRok = kwartalSelect.value === 'all';
  const metric = metricSelect.value;
  const naglowek = `miejsce;port_lotniczy;rok;kwartal;${metric === 'operacje' ? 'liczba_operacji_pasazerskich' : 'liczba_pasazerow'};liczba_dostepnych_kwartalow`;
  const wiersze = aktualnyRanking.map((w, i) =>
    [i + 1, w.lotnisko, w.rok, calyRok ? 'caly_rok' : kwartalSelect.value,
      w.wartosc, w.liczbaKwartalow].join(';'));
  const blob = new Blob(['\uFEFF' + [naglowek, ...wiersze].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = calyRok ? `ranking-${metric}-${rokSelect.value}-caly-rok.csv` : `ranking-${metric}-${rokSelect.value}-Q${kwartalSelect.value}.csv`;
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
    dodajOpcjeCaloroczna();
    rysujRanking();
    metricSelect.addEventListener('change', rysujRanking);
    rokSelect.addEventListener('change', rysujRanking);
    kwartalSelect.addEventListener('change', rysujRanking);
    pobierzButton.addEventListener('click', pobierzCSV);
  } catch (blad) {
    pokazStatus('Nie udało się wczytać data/LOTY.csv. Uruchom stronę przez Live Server i sprawdź nazwę pliku.');
    console.error('Błąd rankingu:', blad);
  }
}

start();
