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
const KLUCZ_KONTA = 'airdata-konta';       // lista: [{ login, haslo }]
const KLUCZ_SESJA = 'airdata-sesja';       // login zalogowanej osoby albo null
const KLUCZ_ULUBIONE = 'airdata-ulubione'; // obiekt: { login: [nazwy lotnisk] }

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
  function odswiezWidok() {
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

// Uruchamiamy po wczytaniu HTML
document.addEventListener('DOMContentLoaded', function () {
  uruchomPanelKonta();
  obsluzRejestracje();
});
