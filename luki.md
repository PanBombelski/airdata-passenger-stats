# Security gaps (luki.md)

This file lists the security weaknesses noticed in the airdata prototype.
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

## Planned deliberate vulnerabilities

### P1. Accounts stored in the browser with plaintext passwords

- **Stage:** 9 (Konto / logowanie)
- **Status:** planned
- **Description:** Login and registration will work only in the browser. Accounts, including
  passwords in plain text, will be saved in `localStorage`. "Logged-in" state will also be
  kept in `localStorage`, so it can be faked from the browser console. Restricting CSV export
  to logged-in users will therefore only be a client-side check.
- **Possible fix:** A real backend with hashed passwords (e.g. bcrypt/argon2), server-side
  sessions and server-side permission checks.
