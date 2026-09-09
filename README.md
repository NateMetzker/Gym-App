# Nutrition + Lifting Tracker

A personal-use Progressive Web App for tracking nutrition (via a pantry/combo
system) and gym progress (lifts, volume, PRs). Single-user, no login. All data
lives locally in the browser (IndexedDB) — there is no backend.

## Features

- **Pantry & Nutrition**: build a reusable pantry of foods (with USDA
  FoodData Central lookup, editable AI-style estimate fallback), combine
  items into saved combos with live macro totals, log what you eat, and
  browse daily history.
- **Lifting Tracker**: define your split (Push/Pull/Legs, etc.) with custom
  exercises, log sets as weight × reps, and track volume, PRs, and trend
  charts per exercise.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL on your phone (same network) or in a desktop
browser, then "Add to Home Screen" to install it as a standalone app.

## Configuration

Nutrition lookups use the [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup)
API. By default the app uses the shared `DEMO_KEY`, which has a low daily
rate limit. Get a free personal key and set it in the app's Settings tab for
higher limits. If a lookup finds no match, the item is flagged "Estimated"
and every field stays editable.

## Tech stack

Vite, React, TypeScript, Tailwind CSS, Dexie (IndexedDB), Recharts, and
`vite-plugin-pwa` for installability and the service worker.

## Build

```bash
npm run build
npm run preview
```
