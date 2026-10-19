// =========================================================
// menu.js – rozwijane menu na telefonie (przycisk ☰)
// Na komputerze menu jest zawsze widoczne, więc ten skrypt
// ma znaczenie tylko na wąskim ekranie.
// =========================================================

// Szukamy na stronie przycisku ☰ i nagłówka
const menuButton = document.querySelector('.menu-btn');
const siteHeader = document.querySelector('.site-header');

// Kliknięcie ☰ dodaje albo usuwa klasę "menu-open".
// Styl w css/style.css pokazuje menu tylko wtedy, gdy ta klasa jest dodana.
menuButton.addEventListener('click', function () {
  const isOpen = siteHeader.classList.toggle('menu-open');

  // Informacja dla czytników ekranu, czy menu jest otwarte
  menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});
