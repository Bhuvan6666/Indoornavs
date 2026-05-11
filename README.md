# 🏛 IndoorNav — Indoor Navigation System

> Turn-by-turn indoor navigation for colleges, airports & hospitals. Open-source, self-hostable, no GPS needed.

---

## 🎯 Problem Statement

Millions of people get lost inside large buildings every day. Google Maps stops at the entrance. There is no free, open-source indoor navigation solution for Indian institutions. IndoorNav solves this with custom SVG floor maps, graph-based pathfinding, and QR-based positioning — all self-hostable with zero licensing cost.

---

## ✨ Features

### Mobile App (React Native + Expo)
- 🗺 **Interactive SVG floor map** — pan, zoom, tap rooms
- 🧭 **Turn-by-turn directions** — tap start + end room, route draws instantly
- 🏢 **Multi-floor routing** — automatically routes through stairs or elevators
- 📋 **Step-by-step directions** — floor-by-floor instruction list
- ↕ **Cross-floor navigation** — elevator and staircase bridging between floors
- 🕐 **Walking time estimate** — based on average walking speed

### Admin Dashboard (React Web)
- ✏️ **Map Editor** — draw rooms and nodes on canvas, drag to reposition
- ⚫ **Node Manager** — manage graph nodes and corridor connections
- 📷 **QR Code Generator** — auto-generates printable QR codes for each room
- 🟢 **Room Status Manager** — mark rooms as Open / Occupied / Maintenance
- 🔥 **Crowd Heatmap** — visualize QR scan frequency across floors
- 📄 **Export floor plan** — download as PNG or IndoorGML JSON
- 🖼 **Background image upload** — trace over real floor plan scans
- ☁ **Save to Supabase** — persist maps to PostgreSQL database

### Backend (Node.js + Express)
- REST API for buildings, floors, routes, QR lookup
- Server-side Dijkstra pathfinding
- QR scan tracking for heatmap analytics
- Room availability status sync
- Supabase (PostgreSQL) integration

---

## 🏗 Architecture

```
Indoor_maps/
├── App.tsx              ← React Native mobile app (Expo)
├── server/
│   └── index.js         ← Express REST API + Dijkstra
├── admin/
│   └── src/App.js       ← React web admin dashboard
└── assets/              ← App icons and splash screen
```

```
Phone (Expo Go)
     ↕ HTTP
Express Server (port 3001)
     ↕ REST
Supabase (PostgreSQL)
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native · Expo · react-native-svg |
| Pathfinding | Dijkstra's Algorithm (client + server) |
| Backend | Node.js · Express.js |
| Database | Supabase (PostgreSQL) |
| Admin Panel | React 18 · CSS-in-JS |
| Deployment | Railway (server) · Vercel (admin) · EAS (APK) |

---

## 📱 Phases Built

| Phase | Feature |
|-------|---------|
| ✅ Phase 1 | SVG floor map renderer — pan, zoom, room tap |
| ✅ Phase 2 | Dijkstra pathfinding — shortest route highlight |
| ✅ Phase 3 | Multi-floor support — stair/elevator routing |
| ✅ Phase 4 | QR-based positioning — scan to set location |
| ✅ Phase 5 | Admin dashboard — draw rooms, export IndoorGML |
| ✅ Phase 6 | Heatmap, room status, offline mode, voice directions |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo Go app on your phone
- Supabase account (free tier)

### 1. Clone the repo

```bash
git clone https://github.com/AbhyasKathuria/indoor-nav-india.git
cd indoor-nav-india
```

### 2. Setup Server

```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

```bash
npm start
```

### 3. Setup Admin Panel

```bash
cd admin
npm install
set HOST=127.0.0.1
npm start
# Admin at http://127.0.0.1:3000
```

### 4. Setup Mobile App

```bash
cd ..
npm install
```

Update `App.tsx` line 11:
```ts
const SERVER = "http://YOUR_LAN_IP:3001";
```

```bash
npx expo start --clear
# Scan QR with Expo Go
```

### 5. Create Supabase Tables

Go to Supabase Dashboard → SQL Editor → run:

```sql
CREATE TABLE IF NOT EXISTS buildings (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS floors (
  id SERIAL PRIMARY KEY,
  building_id INT REFERENCES buildings(id),
  name TEXT,
  floor_number INT,
  map_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS scan_counts (
  id SERIAL PRIMARY KEY,
  node_id TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 1,
  last_scanned TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS room_status (
  id SERIAL PRIMARY KEY,
  floor_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(floor_id, room_id)
);
```

---

## 📖 How to Use

### Mobile App

1. Tap **🧭 Get Directions**
2. Tap a **start room** — turns green with "YOU"
3. Tap an **end room** — turns red with "DEST"
4. Route draws with dashed gradient line + distance + time
5. Tap **📋** for step-by-step directions
6. Switch floors with tabs — blue dot shows floors with route segments

### Admin Dashboard

1. Enter building name → click **Add Room** → click canvas
2. Click rooms to rename and set type
3. Click **Add Node** → place nodes on corridors
4. Click **Add Edge** → connect nodes with weighted edges
5. Click **☁ Save to DB** → saves to Supabase
6. **QR Codes** tab → download printable QR for each room
7. **Room Status** tab → mark rooms open/occupied/maintenance
8. **Heatmap** tab → see which areas get scanned most

---

## 🗺 Pathfinding Algorithm

Dijkstra's algorithm on a weighted graph:

- **Nodes** = corridor junctions and room entrances
- **Edges** = corridor segments with distance weights
- **Cross-floor edges** = elevator/stair connections with floor-change penalty

```
Start Node → [Dijkstra] → Shortest Path → SVG route highlight
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buildings` | List all buildings |
| GET | `/api/buildings/:id/floors` | Get floors for a building |
| GET | `/api/floors/:id/map` | Get floor map JSON |
| POST | `/api/upload-map` | Create building from admin export |
| POST | `/api/route` | Compute shortest path |
| POST | `/api/scan` | Track QR scan (heatmap) |
| GET | `/api/heatmap/:buildingId` | Get scan counts per node |
| POST | `/api/rooms/status` | Update room availability |
| GET | `/api/health` | Health check |

---

## 🚢 Deployment

### Backend → Railway
1. Push to GitHub
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set root to `server/`
4. Add env vars: `SUPABASE_URL`, `SUPABASE_KEY`

### Admin → Vercel
1. [vercel.com](https://vercel.com) → Import from GitHub
2. Set root to `admin/`

### Mobile → Expo EAS
```bash
npm install -g eas-cli
eas login
eas build --platform android
```

---

## 🙋 Author

**Abhyas Kathuria**
- GitHub: [@AbhyasKathuria](https://github.com/AbhyasKathuria)
- LinkedIn: [linkedin.com/in/abhyas-kathuria](https://linkedin.com/in/abhyas-kathuria)

---

## 📄 License

MIT License — free to use, modify and distribute.

---

*Built as Project 01/16 of a full-stack developer portfolio series.*
