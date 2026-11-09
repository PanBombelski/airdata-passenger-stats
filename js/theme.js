// =========================================================
// theme.js – panel „Motyw”: kolory, wielkość liter, czytanie na głos
//
// Ten plik ładujemy w <head> BEZ słowa defer. Dzięki temu motyw
// i wielkość liter ustawiają się od razu, zanim strona się pokaże
// (inaczej przez chwilę widać jasne tło przy ciemnym motywie).
// Elementy panelu szukamy dopiero po wczytaniu strony (DOMContentLoaded).
// =========================================================

// Nazwy wpisów w localStorage (pamięć przeglądarki na tym komputerze)
const KLUCZ_MOTYW = 'aerostat-motyw';   // wartości: 'light', 'dark', 'system'
const KLUCZ_LITERY = 'aerostat-litery'; // wartość: numer poziomu 0–3

// Wielkość liter w procentach. Poziom 1 to normalna wielkość (100%).
const POZIOMY_LITER = [87.5, 100, 118, 137];

// Obserwator zmian ustawień systemu (jasny / ciemny)
const mediaCiemny = window.matchMedia('(prefers-color-scheme: dark)');

// Odczyt z localStorage. Przeglądarka może zablokować dostęp
// (np. w trybie prywatnym), więc wszystko jest w try/catch.
function odczytaj(klucz, domyslna) {
  try {
    return localStorage.getItem(klucz) || domyslna;
  } catch (blad) {
    return domyslna;
  }
}

// Zapis do localStorage, z tym samym zabezpieczeniem.
function zapisz(klucz, wartosc) {
  try {
    localStorage.setItem(klucz, wartosc);
  } catch (blad) {
    // Brak zapisu nie psuje strony, ustawienie działa do odświeżenia.
  }
}

// Ustawia atrybut data-theme na <html>. Style w css/style.css
// dla :root[data-theme="dark"] zmieniają wtedy kolory.
function zastosujMotyw(wybor) {
  const ciemny = wybor === 'dark' || (wybor === 'system' && mediaCiemny.matches);
  document.documentElement.dataset.theme = ciemny ? 'dark' : 'light';
}

// Ustawia wielkość liter dla całej strony (procent od domyślnej).
function zastosujLitery(poziom) {
  document.documentElement.style.fontSize = POZIOMY_LITER[poziom] + '%';
}

// Od razu po wczytaniu skryptu (przed pokazaniem strony)
zastosujMotyw(odczytaj(KLUCZ_MOTYW, 'system'));
let poziomLiter = Number(odczytaj(KLUCZ_LITERY, '1'));
if (!Number.isInteger(poziomLiter) || poziomLiter < 0 || poziomLiter > 3) {
  poziomLiter = 1;
}
zastosujLitery(poziomLiter);

// Gdy użytkownik zmieni motyw systemu, a my mamy „Jak system”, dopasowujemy się
mediaCiemny.addEventListener('change', function () {
  if (odczytaj(KLUCZ_MOTYW, 'system') === 'system') {
    zastosujMotyw('system');
  }
});

// Wszystko, co dotyczy samego panelu, uruchamiamy po wczytaniu HTML
document.addEventListener('DOMContentLoaded', function () {
  const przyciskMotyw = document.querySelector('.theme-btn');
  const panel = document.getElementById('theme-panel');
  if (!przyciskMotyw || !panel) {
    return; // strona bez panelu – nic nie robimy
  }

  const opcje = panel.querySelectorAll('.theme-option');
  const przyciskMniej = document.getElementById('litery-mniej');
  const przyciskDomyslne = document.getElementById('litery-reset');
  const przyciskWiecej = document.getElementById('litery-wiecej');
  const przyciskCzytnik = document.getElementById('czytnik-btn');
  const statusCzytnik = document.getElementById('czytnik-status');

  // --- Otwieranie i zamykanie panelu ---
  function ustawPanel(otwarty) {
    panel.hidden = !otwarty;
    przyciskMotyw.setAttribute('aria-expanded', otwarty ? 'true' : 'false');
  }

  przyciskMotyw.addEventListener('click', function () {
    ustawPanel(panel.hidden); // jeśli był zamknięty, otwórz; jeśli otwarty, zamknij
  });

  // Klawisz Escape zamyka panel i wraca do przycisku
  document.addEventListener('keydown', function (zdarzenie) {
    if (zdarzenie.key === 'Escape' && !panel.hidden) {
      ustawPanel(false);
      przyciskMotyw.focus();
    }
  });

  // Kliknięcie poza panelem też zamyka go
  document.addEventListener('click', function (zdarzenie) {
    const klikniecieWPanelu = panel.contains(zdarzenie.target);
    const klikniecieWPrzycisku = przyciskMotyw.contains(zdarzenie.target);
    if (!panel.hidden && !klikniecieWPanelu && !klikniecieWPrzycisku) {
      ustawPanel(false);
    }
  });

  // --- Wybór motywu: Jasny / Ciemny / Jak system ---
  function zaznaczOpcje(wybor) {
    opcje.forEach(function (przycisk) {
      const aktywny = przycisk.dataset.motyw === wybor;
      przycisk.setAttribute('aria-pressed', aktywny ? 'true' : 'false');
    });
  }

  opcje.forEach(function (przycisk) {
    przycisk.addEventListener('click', function () {
      const wybor = przycisk.dataset.motyw;
      zapisz(KLUCZ_MOTYW, wybor);
      zastosujMotyw(wybor);
      zaznaczOpcje(wybor);
    });
  });
  zaznaczOpcje(odczytaj(KLUCZ_MOTYW, 'system'));

  // --- Wielkość liter ---
  function zmienLitery(zmiana) {
    if (zmiana === 0) {
      poziomLiter = 1; // przycisk „A” wraca do normalnej wielkości
    } else {
      poziomLiter = Math.min(POZIOMY_LITER.length - 1, Math.max(0, poziomLiter + zmiana));
    }
    zastosujLitery(poziomLiter);
    zapisz(KLUCZ_LITERY, String(poziomLiter));
  }

  przyciskMniej.addEventListener('click', function () { zmienLitery(-1); });
  przyciskDomyslne.addEventListener('click', function () { zmienLitery(0); });
  przyciskWiecej.addEventListener('click', function () { zmienLitery(1); });

  // --- Czytanie strony na głos (wbudowana funkcja przeglądarki) ---
  // Nie używamy żadnej biblioteki: speechSynthesis jest w przeglądarce.
  if (!('speechSynthesis' in window)) {
    przyciskCzytnik.disabled = true;
    statusCzytnik.textContent = 'Ta przeglądarka nie potrafi czytać na głos.';
    return;
  }

  let czyta = false;

  function ustawCzytanie(trwa) {
    czyta = trwa;
    przyciskCzytnik.textContent = trwa ? 'Zatrzymaj czytanie' : 'Czytaj stronę na głos';
    przyciskCzytnik.setAttribute('aria-pressed', trwa ? 'true' : 'false');
  }

  przyciskCzytnik.addEventListener('click', function () {
    if (czyta) {
      window.speechSynthesis.cancel();
      ustawCzytanie(false);
      return;
    }

    // Czytamy tytuł strony i treść z elementu <main> (bez menu i stopki)
    const glowna = document.querySelector('main');
    const tekst = document.title + '. ' + (glowna ? glowna.innerText : '');

    const wypowiedz = new SpeechSynthesisUtterance(tekst);
    wypowiedz.lang = 'pl-PL';
    wypowiedz.onend = function () { ustawCzytanie(false); };
    wypowiedz.onerror = function () {
      ustawCzytanie(false);
      statusCzytnik.textContent = 'Nie udało się przeczytać strony.';
    };

    window.speechSynthesis.speak(wypowiedz);
    ustawCzytanie(true);
    statusCzytnik.textContent = 'Czytam treść strony po polsku.';
  });

  // Gdy użytkownik opuszcza stronę, zatrzymujemy czytanie
  window.addEventListener('pagehide', function () {
    window.speechSynthesis.cancel();
  });
});
