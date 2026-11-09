# Security gaps (luki.md)

This file lists the security weaknesses noticed in the AeroStat prototype.
Following the project rules, these gaps are **documented, not fixed**.
Each entry says where the gap is, why it matters and how it could be fixed later.

Status values: **open** (present in the code), **planned** (will be added on purpose in a later stage).

---

## L1. Development server is reachable from the local network

- **Stage:** 1
- **Where:** running the site with `python -m http.server`
- **Status:** open
- **Description:** By default `http.server` listens on all network interfaces, not only on `localhost`.
  Anyone on the same Wi-Fi network (e.g. at the university or in a dormitory) can open the site
  using the computer's IP address and port 8000.
- **Risk:** Other people can browse every file in the project folder while the server is running.
- **Possible fix:** Start the server bound to the local machine only:
  `python -m http.server --bind 127.0.0.1`.

## L2. Directory listing and the `.git` folder are served

- **Stage:** 1
- **Where:** running the site with `python -m http.server` in the repository folder
- **Status:** open
- **Description:** `http.server` shows a list of files for every folder without an `index.html`
  (e.g. `/data/`, `/js/`, `/img/`). It also serves hidden folders, so the whole `.git` folder
  (commit history, `.git/config` with the remote URL) can be downloaded.
- **Risk:** Information disclosure. If a token or password were ever stored in `.git/config`
  or committed by mistake, it could be downloaded from the running server.
- **Possible fix:** Serve only a separate build/public folder, or use a server configured
  to block hidden files and disable directory listing.

## L3. No security headers (CSP, clickjacking protection)

- **Stage:** 1
- **Where:** all HTML pages
- **Status:** open
- **Description:** The pages do not set a Content-Security-Policy, `X-Content-Type-Options`,
  or `frame-ancestors` / `X-Frame-Options`. A static server like `http.server` does not add them either.
- **Risk:** Any other website can embed the pages in an `<iframe>` (clickjacking). If an
  injection bug appears later (e.g. with user input in stage 9), nothing limits which scripts can run.
- **Possible fix:** Add a CSP (e.g. `default-src 'self'`) and `frame-ancestors 'none'`
  as HTTP headers on a real server (or a CSP `<meta>` tag as a partial measure).

---

## Deliberate vulnerabilities (stage 9: Konto)

These gaps were added on purpose, as agreed with the project owner.
They are not fixed in this version and are kept visible for the course.

### P1. Accounts stored in the browser with plaintext passwords

- **Stage:** 9 (Konto / logowanie)
- **Status:** open (deliberate)
- **Where:** `js/konto.js`, `localStorage` keys `aerostat-konta`, `aerostat-sesja`, `aerostat-ulubione`
- **Description:** Registration saves every account as `{ login, haslo }` in plain text inside
  the browser's `localStorage`. There is no server and no hashing. Anyone who can open the browser
  developer tools on the same computer can read all passwords.
- **Possible fix:** A real backend with hashed passwords (e.g. bcrypt or argon2), server-side sessions
  and server-side permission checks.

### P2. Login state can be forged in the browser

- **Stage:** 9
- **Status:** open (deliberate)
- **Where:** `js/konto.js`, key `aerostat-sesja`
- **Description:** The "logged in" state is only a plain login name stored in `localStorage`.
  A person can type any existing login into the console (`localStorage.setItem(...)`) and appear
  logged in without knowing the password. The check is done only in the page's JavaScript.
- **Possible fix:** Server-side sessions with secure, HTTP-only cookies, checked on every request.

### P3. CSV download restriction is client-side only

- **Stage:** 9 (CSV export from stage 7)
- **Status:** open (deliberate)
- **Where:** `js/konto.js`, the capture-phase click listener for "Pobierz CSV" buttons
- **Description:** Downloads are blocked for people who are not logged in only by JavaScript
  in the same page. Turning off JavaScript, or running the code again in the console, removes
  the restriction. The data itself (`data/LOTY.csv`) is public anyway.
- **Possible fix:** Serve restricted files only from a backend that checks the session first.

### P4. No limits on login attempts and no password rules

- **Stage:** 9
- **Status:** open (deliberate)
- **Where:** `js/konto.js`, functions `zaloguj()` and `zarejestruj()`
- **Description:** There is no limit on wrong password attempts, no delay and no minimum password length.
  Passwords like `a` are accepted. A script can try thousands of passwords per second.
- **Possible fix:** Rate limiting on the server, password length and strength rules,
  and a short lock after several failed attempts.

### P5. Account data readable by any script on the same site

- **Stage:** 9
- **Status:** open (deliberate)
- **Where:** all pages (`localStorage` is shared by the whole site)
- **Description:** Any script running on this site, including a future injected script, can read
  `aerostat-konta` and change the stored data. The site has no Content-Security-Policy (see L3).
- **Possible fix:** Store nothing secret in the browser, and add a CSP header.

### P6. Form input is not sanitized

- **Stage:** 9
- **Status:** open (deliberate)
- **Where:** `js/konto.js`, login and registration forms
- **Description:** Login and registration only check that the fields are not empty. Names are saved
  exactly as typed, with no length limit. Values are shown with `textContent`, so they are not run as
  HTML here, but nothing stops very long or odd values from being stored.
- **Possible fix:** Length and character rules on the server, and a server-side check of every value.
