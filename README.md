# 🌶️ Falfoul

**A tiny store manager that thinks it's a 1984 Macintosh.**

Products, stock, expiry alerts, sales & profit math for a corner store — all in
glorious 1-bit pixel art, with a menu bar, real window chrome, a boot splash,
and a six-color rainbow pepper where the apple should be.

> *System 1.0 · Total Memory: enough · Largest Unused Block: your shelf space.*
> *Made with ♥ and 1-bit pixels.*

## What it does

- 📦 **Products** — save what you bought from supplier invoices; the app
  computes cost & selling price per piece from packs, units and margin
- 🏷️ **Categories** — nested tree (sub-sub-categories welcome), searchable,
  with hand-drawn pixel icons
- 💰 **Sales** — record sales, stock updates itself
- ⏰ **Alerts** — expiry reminders and low-stock warnings
- 📊 **Analytics** — best sellers by profit, revenue and quantity
- 💾 **Excel export** & 🖨️ print view
- 📱 **PWA** — add to home screen, opens fullscreen like a real app

## The core calculation

```
total pieces      = packs × pieces per pack
cost of one piece = total price paid ÷ total pieces
sell one piece at = cost of one piece × (1 + margin% ÷ 100)
```

## Run it locally

```bash
npm install
npm run setup     # create the SQLite db + demo data
npm run dev       # → http://localhost:3000
```

## Deploy free (Vercel + Turso)

1. Create a free database at [turso.tech](https://turso.tech), note the
   `libsql://…` URL and auth token
2. Push the schema: `TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… npm run turso:push`
3. Import this repo on [vercel.com](https://vercel.com) and set the same two
   environment variables
4. Ship it 🚢

Locally the app uses a plain SQLite file; when `TURSO_DATABASE_URL` is set it
connects to Turso and stores invoice photos inline in the database (cloud
servers have no permanent disk).

## Built with

Next.js 15 · Prisma · SQLite/Turso · Tailwind 4 · hand-encoded pixel-art PNGs
and zero UI libraries — the whole classic Mac OS look is homemade CSS and SVG.
