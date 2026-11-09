// =========================================================
// konto.js – panel „Konto”: logowanie, wylogowanie, ulubione
// lotniska, strona rejestracji oraz blokada pobierania CSV
// dla osób niezalogowanych.
//
// UWAGA (celowa luka, zapisana w luki.md, pozycja P1):
// konta i hasła są zapisane jako zwykły tekst w localStorage
// przeglądarki. Nie ma serwera, więc logowanie działa tylko
// w tej przeglądarce i nie jest prawdziwym zabezpieczeniem.
// Nie dodajemy tu szyfrowania – to ma być widoczne i poprawione
// w późniejszym etapie.
// =========================================================

// Nazwy wpisów w localStorage
const KLUCZ_KONTA = 'aerostat-konta';       // lista: [{ login, haslo }]
const KLUCZ_SESJA = 'aerostat-sesja';       // login zalogowanej osoby albo null
const KLUCZ_ULUBIONE = 'aerostat-ulubione'; // obiekt: { login: [nazwy lotnisk] }

// Lotniska z pliku data/LOTY.csv (kolumna port_lotniczy), w kolejności alfabetycznej
const LOTNISKA = [
  'Bydgoszcz',
  'Gdańsk im. Lecha Wałęsy',
  'Katowice - Pyrzowice',
  'Kraków - Balice',
  'Lotnisko Chopina w Warszawie',
  'Lotnisko Warszawa - Radom',
  'Lublin',
  'Olsztyn-Mazury',
  'Poznań - Ławica',
  'Rzeszów - Jasionka',
  'Szczecin - Goleniów',
  'Warszawa/Modlin',
  'Wrocław - Strachowice',
  'Zielona Góra - Babimost',
  'Łódź',
];

// Funkcje panelu Konto, z których korzystają gwiazdki ulubionych.
// Właściwą treść dostają w uruchomPanelKonta(); do tego czasu nic nie robią.
let otworzPanelKonta = function () {};
let odswiezPanelKonta = function () {};

// --- Odczyt i zapis z localStorage (zawsze w try/catch) ---
function odczytaj(klucz, domyslna) {
  try {
    const tekst = localStorage.getItem(klucz);
    return tekst === null ? domyslna : JSON.parse(tekst);
  } catch (blad) {
    return domyslna;
  }
}

function zapisz(klucz, wartosc) {
  try {
    localStorage.setItem(klucz, JSON.stringify(wartosc));
  } catch (blad) {
    // Brak zapisu nie psuje strony.
  }
}

// --- Dane konta ---
function pobierzKonta() {
  const lista = odczytaj(KLUCZ_KONTA, []);
  return Array.isArray(lista) ? lista : [];
}

function pobierzZalogowanego() {
  return odczytaj(KLUCZ_SESJA, null);
}

function pobierzUlubione(login) {
  const wszystkie = odczytaj(KLUCZ_ULUBIONE, {});
  const lista = wszystkie[login];
  return Array.isArray(lista) ? lista : [];
}

function zapiszUlubione(login, lista) {
  const wszystkie = odczytaj(KLUCZ_ULUBIONE, {});
  wszystkie[login] = lista;
  zapisz(KLUCZ_ULUBIONE, wszystkie);
}

// Dodaje konto do listy i od razu loguje. Zwraca komunikat błędu albo null.
function zarejestruj(login, haslo) {
  const konta = pobierzKonta();
  if (konta.some(function (konto) { return konto.login === login; })) {
    return 'Taka nazwa użytkownika jest już zajęta.';
  }
  konta.push({ login: login, haslo: haslo });
  zapisz(KLUCZ_KONTA, konta);
  zapisz(KLUCZ_SESJA, login);
  return null;
}

// Sprawdza dane logowania. Zwraca true, gdy pasują do konta.
function zaloguj(login, haslo) {
  const pasuje = pobierzKonta().some(function (konto) {
    return konto.login === login && konto.haslo === haslo;
  });
  if (pasuje) {
    zapisz(KLUCZ_SESJA, login);
  }
  return pasuje;
}

function wyloguj() {
  zapisz(KLUCZ_SESJA, null);
}

// ---------------------------------------------------------
// Strona rejestracja.html: obsługa formularza
// ---------------------------------------------------------
function obsluzRejestracje() {
  const formularz = document.getElementById('rejestracja-form');
  if (!formularz) {
    return; // to nie jest strona rejestracji
  }

  const komunikat = document.getElementById('rejestracja-komunikat');
  const sukces = document.getElementById('rejestracja-sukces');

  formularz.addEventListener('submit', function (zdarzenie) {
    zdarzenie.preventDefault();

    const login = formularz.elements['login'].value.trim();
    const haslo = formularz.elements['haslo'].value;
    const haslo2 = formularz.elements['haslo2'].value;

    // Proste sprawdzenie formularza (pola są wymagane)
    if (login === '' || haslo === '') {
      komunikat.textContent = 'Wpisz nazwę użytkownika i hasło.';
      return;
    }
    if (haslo !== haslo2) {
      komunikat.textContent = 'Hasła nie są takie same.';
      return;
    }

    const blad = zarejestruj(login, haslo);
    if (blad) {
      komunikat.textContent = blad;
      return;
    }

    // Konto utworzone i zalogowane – pokazujemy potwierdzenie
    komunikat.textContent = '';
    formularz.hidden = true;
    sukces.hidden = false;
    document.getElementById('rejestracja-login-info').textContent = login;
  });
}

// ---------------------------------------------------------
// Panel Konto w nagłówku
// ---------------------------------------------------------
function uruchomPanelKonta() {
  const przycisk = document.querySelector('.account-btn');
  const panel = document.getElementById('konto-panel');
  if (!przycisk || !panel) {
    return;
  }

  const widokLogowania = document.getElementById('konto-logowanie');
  const widokZalogowany = document.getElementById('konto-zalogowany');
  const formLogowania = document.getElementById('login-form');
  const bladLogowania = document.getElementById('login-blad');
  const komunikatKonta = document.getElementById('konto-komunikat');
  const nazwaZalogowanego = document.getElementById('konto-nazwa');
  const wybor = document.getElementById('ulubione-wybor');
  const formUlubione = document.getElementById('ulubione-form');
  const listaUlubionych = document.getElementById('ulubione-lista');
  const przyciskWyloguj = document.getElementById('wyloguj-btn');

  // Lista do wyboru uzupełniana z tej samej tablicy co wyżej
  LOTNISKA.forEach(function (nazwa) {
    const opcja = document.createElement('option');
    opcja.value = nazwa;
    opcja.textContent = nazwa;
    wybor.appendChild(opcja);
  });

  // --- Otwieranie i zamykanie ---
  function ustawPanel(otwarty) {
    panel.hidden = !otwarty;
    przycisk.setAttribute('aria-expanded', otwarty ? 'true' : 'false');
  }

  przycisk.addEventListener('click', function () {
    ustawPanel(panel.hidden);
  });

  document.addEventListener('keydown', function (zdarzenie) {
    if (zdarzenie.key === 'Escape' && !panel.hidden) {
      ustawPanel(false);
      przycisk.focus();
    }
  });

  // Uwaga: używamy composedPath(), bo po kliknięciu „Usuń” lista się odświeża
  // i kliknięty przycisk znika z dokumentu – zwykłe panel.contains() by go nie znalazło.
  document.addEventListener('click', function (zdarzenie) {
    const sciezka = zdarzenie.composedPath();
    if (!panel.hidden && sciezka.indexOf(panel) === -1 && sciezka.indexOf(przycisk) === -1) {
      ustawPanel(false);
    }
  });

  // --- Widok: logowanie albo zalogowana osoba ---
  function odswiezWidokPanelu() {
    const login = pobierzZalogowanego();
    if (!login) {
      widokLogowania.hidden = false;
      widokZalogowany.hidden = true;
      przycisk.setAttribute('aria-label', 'Konto – zaloguj się');
      return;
    }

    widokLogowania.hidden = true;
    widokZalogowany.hidden = false;
    nazwaZalogowanego.textContent = login;
    przycisk.setAttribute('aria-label', 'Konto – zalogowano jako ' + login);

    // Lista ulubionych lotnisk tej osoby
    listaUlubionych.textContent = '';
    const ulubione = pobierzUlubione(login);
    if (ulubione.length === 0) {
      const pusta = document.createElement('li');
      pusta.className = 'konto-pusta';
      pusta.textContent = 'Nie masz jeszcze ulubionych lotnisk.';
      listaUlubionych.appendChild(pusta);
    }
    ulubione.forEach(function (nazwa) {
      const pozycja = document.createElement('li');
      const tekst = document.createElement('span');
      tekst.textContent = nazwa;
      const usun = document.createElement('button');
      usun.type = 'button';
      usun.className = 'konto-usun';
      usun.textContent = 'Usuń';
      usun.setAttribute('aria-label', 'Usuń z ulubionych: ' + nazwa);
      usun.addEventListener('click', function () {
        zapiszUlubione(login, pobierzUlubione(login).filter(function (n) { return n !== nazwa; }));
        odswiezWidok();
      });
      pozycja.appendChild(tekst);
      pozycja.appendChild(usun);
      listaUlubionych.appendChild(pozycja);
    });
  }

  // Pełne odświeżenie: panel oraz wszystkie gwiazdki na stronie
  function odswiezWidok() {
    odswiezWidokPanelu();
    odswiezGwiazdki();
  }

  // Udostępniamy te funkcje gwiazdkom ulubionych (są poza panelem)
  otworzPanelKonta = function (komunikat) {
    ustawPanel(true);
    komunikatKonta.textContent = komunikat || '';
  };
  odswiezPanelKonta = odswiezWidok;

  // --- Logowanie ---
  formLogowania.addEventListener('submit', function (zdarzenie) {
    zdarzenie.preventDefault();
    const login = formLogowania.elements['login'].value.trim();
    const haslo = formLogowania.elements['haslo'].value;

    if (login === '' || haslo === '') {
      bladLogowania.textContent = 'Wpisz nazwę użytkownika i hasło.';
      return;
    }
    if (!zaloguj(login, haslo)) {
      bladLogowania.textContent = 'Nieprawidłowa nazwa użytkownika lub hasło.';
      return;
    }

    bladLogowania.textContent = '';
    formLogowania.reset();
    komunikatKonta.textContent = '';
    odswiezWidok();
  });

  // --- Wylogowanie ---
  przyciskWyloguj.addEventListener('click', function () {
    wyloguj();
    komunikatKonta.textContent = '';
    odswiezWidok();
  });

  // --- Dodawanie ulubionego lotniska ---
  formUlubione.addEventListener('submit', function (zdarzenie) {
    zdarzenie.preventDefault();
    const login = pobierzZalogowanego();
    if (!login) {
      return;
    }
    const nazwa = wybor.value;
    const ulubione = pobierzUlubione(login);
    if (ulubione.indexOf(nazwa) !== -1) {
      komunikatKonta.textContent = 'To lotnisko już jest na liście.';
      return;
    }
    ulubione.push(nazwa);
    zapiszUlubione(login, ulubione);
    komunikatKonta.textContent = '';
    odswiezWidok();
  });

  // --- Blokada pobierania CSV dla niezalogowanych ---
  // Przyciski „Pobierz CSV” działają tylko po zalogowaniu.
  // Ta kontrola działa w przeglądarce, więc da się ją obejść (patrz luki.md, P1).
  document.addEventListener('click', function (zdarzenie) {
    const przyciskCsv = zdarzenie.target.closest ? zdarzenie.target.closest('button') : null;
    if (!przyciskCsv || przyciskCsv.textContent.trim() !== 'Pobierz CSV') {
      return;
    }
    if (pobierzZalogowanego()) {
      return; // zalogowany – pobieranie działa normalnie
    }
    // Niezalogowany: nie pozwalamy na zdarzenie kliknięcia i otwieramy panel
    zdarzenie.preventDefault();
    zdarzenie.stopImmediatePropagation();
    ustawPanel(true);
    komunikatKonta.textContent = 'Pobieranie CSV jest dostępne tylko dla zalogowanych.';
  }, true); // true = faza przechwytywania, działa przed skryptami stron

  odswiezWidok();
}

// ---------------------------------------------------------
// Gwiazdki ulubionych lotnisk (☆ = nie ma w ulubionych, ★ = jest)
// - w tabelach Rankingu i Zmian: gwiazdka przed nazwą lotniska,
// - w Porównywarce i Sezonowości: gwiazdka obok listy wyboru lotniska.
// Ulubione zapisują się tylko po zalogowaniu.
// ---------------------------------------------------------

// Tabele, w których wiersze zawierają nazwę lotniska
const TABELE_Z_LOTNISKAMI = ['ranking-body', 'zmiany-body'];
// Listy wyboru lotniska, przy których stawiamy gwiazdkę
const LISTY_LOTNISK = ['por-airport-1', 'por-airport-2', 'por-airport-3', 'season-airport'];

function czyUlubione(nazwa) {
  const login = pobierzZalogowanego();
  return login ? pobierzUlubione(login).indexOf(nazwa) !== -1 : false;
}

// Dodaje lotnisko do ulubionych albo je usuwa
function przelaczUlubione(nazwa) {
  const login = pobierzZalogowanego();
  if (!login) {
    otworzPanelKonta('Zaloguj się, aby zapisywać ulubione lotniska.');
    return;
  }
  const lista = pobierzUlubione(login);
  const nowaLista = lista.indexOf(nazwa) === -1
    ? lista.concat([nazwa])
    : lista.filter(function (n) { return n !== nazwa; });
  zapiszUlubione(login, nowaLista);
  odswiezPanelKonta(); // odświeża listę w panelu i wszystkie gwiazdki
}

// Ustawia wygląd i opis gwiazdki dla danego lotniska
function ustawGwiazdke(przycisk, nazwa) {
  const ulubione = czyUlubione(nazwa);
  przycisk.textContent = ulubione ? '★' : '☆';
  przycisk.setAttribute('aria-pressed', ulubione ? 'true' : 'false');
  przycisk.setAttribute('aria-label', 'Ulubione lotnisko: ' + nazwa);
  przycisk.title = ulubione ? 'Usuń z ulubionych' : 'Dodaj do ulubionych';
}

function utworzGwiazdke(nazwa) {
  const przycisk = document.createElement('button');
  przycisk.type = 'button';
  przycisk.className = 'fav-star';
  przycisk.dataset.lotnisko = nazwa;
  przycisk.addEventListener('click', function (zdarzenie) {
    // Bez tego kliknięcie „dotarłoby” do dokumentu i od razu zamknęło otwarty panel
    if (!pobierzZalogowanego()) {
      zdarzenie.stopPropagation();
    }
    przelaczUlubione(przycisk.dataset.lotnisko);
  });
  ustawGwiazdke(przycisk, nazwa);
  return przycisk;
}

// Dodaje gwiazdkę do wiersza tabeli (do komórki, która zaczyna się nazwą lotniska)
function udekorujWiersz(wiersz) {
  if (wiersz.querySelector('.fav-star')) {
    return;
  }
  const komorki = wiersz.querySelectorAll('td');
  for (let i = 0; i < komorki.length; i++) {
    const pierwszy = komorki[i].firstChild;
    const tekst = pierwszy && pierwszy.nodeType === Node.TEXT_NODE ? pierwszy.textContent.trim() : '';
    if (LOTNISKA.indexOf(tekst) !== -1) {
      komorki[i].classList.add('fav-cell');
      komorki[i].insertBefore(utworzGwiazdke(tekst), pierwszy);
      wiersz.classList.toggle('fav-row', czyUlubione(tekst));
      return;
    }
  }
}

// Gwiazdka obok listy wyboru lotniska
function dodajGwiazdkeDoListy(id) {
  const lista = document.getElementById(id);
  if (!lista) {
    return;
  }
  // Lista i gwiazdka w jednej linii
  const obudowa = document.createElement('span');
  obudowa.className = 'fav-select';
  lista.parentNode.insertBefore(obudowa, lista);
  obudowa.appendChild(lista);

  const gwiazdka = utworzGwiazdke(lista.value);
  obudowa.appendChild(gwiazdka);

  function aktualizuj() {
    const nazwa = lista.value;
    gwiazdka.dataset.lotnisko = nazwa;
    gwiazdka.hidden = LOTNISKA.indexOf(nazwa) === -1; // np. pusta opcja „brak”
    if (!gwiazdka.hidden) {
      ustawGwiazdke(gwiazdka, nazwa);
    }
  }

  lista.addEventListener('change', aktualizuj);
  // Opcje dochodzą dopiero po wczytaniu CSV – wtedy też odświeżamy gwiazdkę
  new MutationObserver(aktualizuj).observe(lista, { childList: true });
  aktualizuj();
}

// Odświeża wszystkie gwiazdki i podświetlenie wierszy (np. po zalogowaniu)
function odswiezGwiazdki() {
  document.querySelectorAll('.fav-star').forEach(function (przycisk) {
    const nazwa = przycisk.dataset.lotnisko;
    if (LOTNISKA.indexOf(nazwa) === -1) {
      return;
    }
    ustawGwiazdke(przycisk, nazwa);
    const wiersz = przycisk.closest('tr');
    if (wiersz) {
      wiersz.classList.toggle('fav-row', czyUlubione(nazwa));
    }
  });
}

function uruchomGwiazdki() {
  TABELE_Z_LOTNISKAMI.forEach(function (id) {
    const tbody = document.getElementById(id);
    if (!tbody) {
      return;
    }
    // Skrypty stron rysują tabele na nowo po każdej zmianie filtrów,
    // więc obserwujemy dodawanie wierszy i za każdym razem dokładamy gwiazdki.
    const obserwator = new MutationObserver(function () {
      tbody.querySelectorAll('tr').forEach(udekorujWiersz);
    });
    obserwator.observe(tbody, { childList: true });
    tbody.querySelectorAll('tr').forEach(udekorujWiersz);
  });

  LISTY_LOTNISK.forEach(dodajGwiazdkeDoListy);
}

// Uruchamiamy po wczytaniu HTML
document.addEventListener('DOMContentLoaded', function () {
  uruchomPanelKonta();
  obsluzRejestracje();
  uruchomGwiazdki();
});
