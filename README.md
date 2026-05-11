# IndoorNav — Delivery Package

## Contents

```
indoor-nav-package/
├── admin/
│   ├── public/
│   │   └── index.html          ← HTML entry point (unchanged)
│   ├── src/
│   │   ├── App.js              ← ⭐ ADVANCED admin dashboard (REPLACE THIS)
│   │   └── index.js            ← Entry point with global styles (REPLACE THIS)
│   └── package.json            ← Updated dependencies
│
└── docs/
    ├── REQUIREMENTS.md         ← Full requirements spec
    └── USAGE.md                ← Complete usage & setup guide
```

## Quick Start

1. **Copy** `admin/src/App.js` and `admin/src/index.js` into your project's `admin/src/` folder (replace existing files)
2. Run `npm install` in the `admin/` folder
3. Run `$env:HOST="localhost"; npm start` in PowerShell from the `admin/` folder
4. Open http://localhost:3000

## What's New in App.js v2

- Full floor plan editor with multi-floor support
- 10 room types (classroom, lab, canteen, staircase, elevator, etc.)
- QR node placement and weighted edge connection
- Live Dijkstra pathfinding preview on canvas
- IndoorGML XML export (OGC standard)
- JSON import/export (save/load your maps)
- QR payload export (ready for printing)
- Zoom + pan canvas (scroll wheel, Alt+drag)
- Grid snapping (20px)
- Keyboard shortcuts (Delete, Escape)
- Right panel properties editor for rooms and nodes
- Zero additional npm dependencies

## Read the Docs

- `docs/REQUIREMENTS.md` — full tech spec, DB schema, API endpoints
- `docs/USAGE.md` — step-by-step setup, workflow guide, deployment, troubleshooting
