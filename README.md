# MR.DIY Inventory System — Vercel + Google Apps Script

## Architecture

- **Frontend:** HTML + CSS + JavaScript
- **Hosting/domain:** Vercel
- **Database:** Google Sheets through Google Apps Script
- **Authentication:** salted SHA-256 password hashes + Apps Script CacheService sessions
- **Repository:** GitHub

## 1. Create the Google Sheet

Create one Google Sheet and copy its ID from the URL.

Example:
`https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`

Create an Apps Script project and paste `appsscript/Code.gs`.

In Apps Script:
1. Project Settings → Script Properties.
2. Add `SHEET_ID` with your spreadsheet ID.
3. Run `setupDatabase()` once and authorize it.
4. Deploy → New deployment → Web app.
5. Execute as **Me**.
6. Who has access: **Anyone**.
7. Copy the `/exec` URL.

The setup creates:
- Users
- Products
- Movements

Default account:
- Username: `admin`
- Password: `Admin@12345`

**Change the default password immediately after signing in by creating a new admin and deleting the default account.**

## 2. Connect Vercel frontend

Open `script.js` and replace:

`PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`

with your Apps Script `/exec` URL.

For a school project, the frontend can then be deployed directly to Vercel.

## 3. GitHub

Recommended repository:

```text
mr-diy-inventory/
├── index.html
├── style.css
├── script.js
├── README.md
└── appsscript/
    └── Code.gs
```

Do NOT commit:
- `.env` files containing secrets
- Google service-account JSON files
- spreadsheet credentials
- private API keys

## 4. Vercel

Import the GitHub repository into Vercel.

Framework preset: **Other**

Build command: leave empty.

Output directory: `.`

The site will be available at your Vercel domain.

## Security notes

This project includes basic application security suitable for a student/demo inventory system:
- passwords are never stored as plain text
- salted SHA-256 password hashes
- expiring server-side session tokens
- role-based admin checks
- server-side input validation
- escaped HTML output in the frontend
- no database credentials in frontend code

For a real commercial inventory system, Google Sheets + public Apps Script should not be treated as a high-security production backend. A production deployment should use a proper database, HTTPS-only authentication, rate limiting, audit logging, secure cookies, CSRF protection, and a dedicated backend/API.

## Changing the visual style

The UI uses MR.DIY-inspired red/yellow/black retail styling without copying proprietary website code or assets. Edit the CSS variables at the top of `style.css` to change the theme.
