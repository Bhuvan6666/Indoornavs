# 🏛️ IndoorNav — Professional Indoor Navigation System

> **Turn-by-turn indoor navigation for universities, colleges, hospitals, and airports.**  
> Self-hostable, open-source, no GPS required. Features interactive SVG floor maps, server & client Dijkstra pathfinding, multi-floor stair/elevator routing, crowd scan heatmaps, room status management, and custom backend/Supabase integration.

---

## ✨ Features & Architecture

```
                       ┌─────────────────────────┐
                       │   Admin Web Dashboard   │
                       │   (React - Port 3000)   │
                       └────────────┬────────────┘
                                    │
                                    ▼
┌─────────────────────────┐   HTTP REST    ┌─────────────────────────┐
│   Mobile App (Expo)     │ ─────────────► │   Express REST Backend  │
│  (React Native App.tsx) │ ◄───────────── │    (Node.js - Port 3001) │
└─────────────────────────┘                └────────────┬────────────┘
                                                        │
                                            ┌───────────┴───────────┐
                                            ▼                       ▼
                                   ┌─────────────────┐    ┌──────────────────┐
                                   │ Local DB Engine │    │ Supabase / Cloud │
                                   │ (server/data/)  │    │   (PostgreSQL)   │
                                   └─────────────────┘    └──────────────────┘
```

### 📱 Mobile Navigation App (`App.tsx`)
- 🗺️ **Interactive SVG Map Canvas**: Multi-floor rendering, pan & recenter controls, room status badges.
- 🔍 **Quick Room Search**: Instant search drawer for rooms across all floors.
- 🧭 **Turn-by-Turn Directions**: Visual gradient route path with animated dashed line overlays.
- 🏢 **Multi-Floor Routing**: Automatic routing through stairs & elevators with floor pill navigation.
- 📋 **Step-by-Step Instructions**: Floor-by-floor step list with distance & walking time estimates.
- ⚡ **Offline Resilience**: Automatic fallback to client-side graph pathfinding if server is offline.

### 💻 Admin Map Editor & Dashboard (`admin/`)
- ✏️ **Visual Canvas Map Editor**: Draw rooms, place corridor graph nodes, and connect edges.
- 🖼️ **Floor Plan Tracing**: Upload background floorplan images to trace maps accurately.
- 📷 **Printable QR Code Generator**: Generate room QR codes for indoor scanning & positioning.
- 🟢 **Room Status Manager**: Real-time room status updates (Open / Occupied / Maintenance).
- 🔥 **Heatmap Analytics**: Scan frequency visualizations per node and floor.
- 📄 **Export Capabilities**: Export floor maps to PNG images or IndoorGML JSON files.

### ⚡ Express REST API Backend (`server/`)
- **Zero-Config Local Data Engine**: Works 100% out of the box with local JSON file persistence (`server/data/db.json`).
- **Supabase Cloud Sync**: Seamlessly syncs with Supabase PostgreSQL when credentials are provided in `.env`.
- **Custom Backend Integration**: Connects to your own personal backend endpoint easily.
- **REST Endpoints**: `/api/buildings`, `/api/floors`, `/api/route`, `/api/scan`, `/api/heatmap`, `/api/rooms/status`, `/api/health`.

---

## 🚀 Quick Start (Windows / macOS / Linux)

### Option 1: Quick Launch Script (Windows)

Simply double-click **`START-IndoorNav.bat`** to start all three components automatically:
- 📌 **Admin Dashboard**: `http://localhost:3000`
- 📌 **Backend Server**: `http://localhost:3001`
- 📌 **Mobile App**: Metro Bundler (scan QR code with Expo Go app)

To stop all services, run **`STOP-IndoorNav.bat`**.

---

### Option 2: Manual Terminal Setup

#### 1. Backend Server (`server/`)
```bash
cd server
npm install
npm start
# Express running on http://localhost:3001
```

*(Optional)* Create `server/.env` to link Supabase or a custom backend:
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

#### 2. Admin Dashboard (`admin/`)
```bash
cd admin
npm install
npm start
# Dashboard running on http://localhost:3000
```

#### 3. Mobile App (Root)
```bash
# In the root directory:
npm install
npx expo start
# Scan QR code with Expo Go on your iOS/Android device
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health & mode (local vs supabase) |
| `GET` | `/api/buildings` | List all buildings |
| `GET` | `/api/buildings/:id/floors` | Get floors for a building |
| `GET` | `/api/floors/:id/map` | Get floor map JSON (rooms, nodes, edges) |
| `POST` | `/api/upload-map` | Save new building & floor map schema |
| `POST` | `/api/route` | Compute shortest path via Dijkstra algorithm |
| `GET` | `/api/qr/:nodeId` | Look up room/node details by QR code ID |
| `POST` | `/api/scan` | Register QR scan event for heatmap tracking |
| `GET` | `/api/heatmap/:buildingId` | Retrieve scan frequency heatmap |
| `GET` | `/api/floors/:id/status` | Get room status map for a floor |
| `POST` | `/api/rooms/status` | Update room status (open/occupied/maintenance) |

---

## 🌐 Connecting Your Own Custom Backend or Supabase

### Supabase Integration
To connect your own Supabase instance:
1. Create a Supabase project.
2. Run the SQL schema script in Supabase SQL Editor:
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
3. Add `SUPABASE_URL` and `SUPABASE_KEY` to `server/.env`.

---

## 📤 Pushing to GitHub

To push this repository to your GitHub account:

```bash
git init
git add .
git commit -m "feat: complete IndoorNav system upgrade - modernized UI/UX, offline fallback, and script fixes"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

---

## 📄 License

MIT License — free for educational, institutional, and commercial use.
