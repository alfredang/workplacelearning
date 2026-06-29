# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-page, dependency-free static website (LEA/NACE workplace learning lead generation for Singapore enterprises). The frontend is plain HTML/CSS/JS; lead capture is delegated to an external n8n webhook. There is no build step and no package.json for the site itself.

## Commands

```bash
# Serve the site locally (no build, no install)
python3 -m http.server 8080      # then open http://localhost:8080

# Publish/update the n8n enquiry workflow (requires .env, see below)
node publish-n8n-flow.mjs
```

There are no tests, linters, or bundlers. Deployment is automatic: every push to `main` triggers `.github/workflows/deploy-pages.yml`, which uploads the repo root to GitHub Pages (served at the `CNAME` domain `workplacelearning.tertiaryinfotech.com`).

## Architecture

Three flat files at the repo root make up the entire site — there is no framework or routing:
- `index.html` — all page content and the enquiry `<form>` (its `action` attribute holds the live n8n webhook URL).
- `styles.css` — all styling.
- `script.js` — three independent concerns: (1) UTM/referrer attribution capture + async form POST to the webhook, (2) the floating WhatsApp widget, (3) submission balloon animation.

**Lead flow (spans the frontend and n8n, not visible in one file):** `script.js` reads UTM params and referrer from the URL, merges them with the form fields, and POSTs JSON to the webhook in `form.action`. The n8n side lives in `Workplace Learning Enquiry Form.json` — a "Normalize Lead" code node sanitizes/scores the lead and builds the email HTML, stores it in the "Workplace Learning Leads" n8n Data Table, emails `angch@tertiaryinfotech.com`, and returns `{ ok, message }` which `script.js` surfaces in the status element.

**Editing the n8n workflow:** edit `Workplace Learning Enquiry Form.json` (it is the source of truth, exported from n8n), then run `node publish-n8n-flow.mjs` to push it back. The script reads credentials from `.env` (copy from `.env.example`, add a real `N8N_API_KEY`). If the API key lacks update permission it creates a *new* workflow and rewrites `N8N_WORKFLOW_ID` in `.env`.

## Conventions

- **Cache-busting stylesheet link:** `index.html` references the stylesheet as `styles.css?v=<YYYYMMDD-label>`. Bump this query string whenever `styles.css` changes so returning visitors get the update (e.g. `?v=20260630-footer-copyright`).
- **Footer attribution** ("Powered by Tertiary Infotech Academy Pte Ltd") and the centered copyright line live at the bottom of the `<footer>` in `index.html` — keep both.
- Note duplicated literals to keep in sync: the WhatsApp phone number appears in both `script.js` (`phone` const) and the footer links in `index.html`; the webhook URL appears in `index.html` (`form.action`) and `.env.example`.

## SEO

This site is SEO-sensitive: it ships `robots.txt`, `sitemap.xml`, a canonical URL, hreflang tags, and JSON-LD in `index.html`. Update `sitemap.xml` and the canonical/OG/JSON-LD metadata together when URLs or page content change.
