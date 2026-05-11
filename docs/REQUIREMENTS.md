# Indoor Navigation System — Requirements Document
**Project:** indoor-nav-india  
**Version:** 2.0  
**Last Updated:** 2025  
**Status:** Active Development

---

## 1. Project Overview

An open-source, self-hostable indoor navigation system for Indian institutions (colleges, airports, hospitals). Provides turn-by-turn directions inside buildings using custom floor maps, QR-code positioning, and an admin dashboard for map management.

---

## 2. Functional Requirements

### 2.1 Mobile App (React Native / Expo)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Display interactive SVG floor plan with pinch-zoom and pan | Must Have |
| FR-02 | Each room shows label; tap reveals room name and type | Must Have |
| FR-03 | Dijkstra pathfinding between any two rooms/nodes | Must Have |
| FR-04 | Highlight shortest path on the floor map | Must Have |
| FR-05 | Step-by-step text navigation instructions below map | Must Have |
| FR-06 | Multi-floor support with staircase/elevator routing | Must Have |
| FR-07 | Floor switcher UI (tabs or dropdown) | Must Have |
| FR-08 | QR code scanning sets user's current location | Must Have |
| FR-09 | Search destination by room name | Should Have |
| FR-10 | Estimated walking distance and time display | Should Have |
| FR-11 | Accessibility mode (high contrast, larger text) | Could Have |
| FR-12 | Offline map caching | Could Have |

### 2.2 Admin Dashboard (React Web)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-20 | Draw rooms as rectangles on an SVG canvas | Must Have |
| FR-21 | Assign room type (classroom, lab, canteen, etc.) | Must Have |
| FR-22 | Edit room name, dimensions, floor | Must Have |
| FR-23 | Place QR nodes at corridor junctions | Must Have |
| FR-24 | Connect QR nodes with weighted edges | Must Have |
| FR-25 | Dijkstra path preview on canvas | Must Have |
| FR-26 | Multi-floor management (add/switch floors) | Must Have |
| FR-27 | Export floor plan as IndoorGML XML | Must Have |
| FR-28 | Export floor plan as JSON | Must Have |
| FR-29 | Export QR node payload data as JSON | Must Have |
| FR-30 | Import previously saved JSON map | Must Have |
| FR-31 | Delete rooms/nodes/edges | Must Have |
| FR-32 | Grid snapping (20px grid) | Must Have |
| FR-33 | Zoom and pan canvas (scroll + Alt+drag) | Must Have |
| FR-34 | Keyboard shortcuts (Delete key, Escape) | Should Have |
| FR-35 | Upload floor plan image as background reference | Could Have |

### 2.3 Backend API (Node.js / Express)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-40 | REST API to serve floor plan JSON data | Must Have |
| FR-41 | POST endpoint to save floor plan from admin | Must Have |
| FR-42 | GET endpoint for mobile app to fetch map | Must Have |
| FR-43 | QR node resolution endpoint | Must Have |
| FR-44 | Multi-building support (by building ID) | Should Have |
| FR-45 | Authentication for admin API routes | Should Have |
| FR-46 | PostgreSQL storage for floor plans and graph | Should Have |

---

## 3. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Mobile app first load time | < 3 seconds |
| NFR-02 | Pathfinding computation time | < 200ms for graphs up to 500 nodes |
| NFR-03 | Admin dashboard browser support | Chrome 90+, Firefox 90+, Edge 90+ |
| NFR-04 | Mobile app platform support | Android 8+ (Expo Go), iOS 13+ |
| NFR-05 | API response time (floor plan fetch) | < 500ms |
| NFR-06 | Admin canvas frame rate | 60 FPS at 1x zoom, 200+ rooms |
| NFR-07 | IndoorGML export compliance | OGC IndoorGML 1.0 spec |
| NFR-08 | Offline capability | Mobile app must work with cached map data |

---

## 4. Tech Stack

### Mobile App
| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~52.0.0 | App framework and build tooling |
| react-native | 0.76.9 | Mobile UI framework |
| react-native-svg | ^15.0.0 | SVG floor plan rendering |
| expo-camera | ~16.0.0 | QR code scanning |
| expo-barcode-scanner | ~13.0.0 | Barcode/QR decoding |
| graphlib | ^2.1.8 | Graph data structure + Dijkstra |
| @react-navigation/native | ^6.0.0 | Screen navigation |
| @react-navigation/bottom-tabs | ^6.0.0 | Tab bar for map/search/settings |
| axios | ^1.6.0 | HTTP client for API calls |
| @react-native-async-storage/async-storage | ^2.0.0 | Offline map caching |

### Admin Dashboard
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | DOM rendering |
| react-scripts | 5.0.1 | CRA build system |

> **Note:** The admin dashboard uses zero external dependencies beyond React. All canvas drawing, pathfinding (Dijkstra), and IndoorGML export are implemented from scratch.

### Backend Server
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.0 | HTTP server |
| cors | ^2.8.5 | Cross-origin requests |
| pg | ^8.11.0 | PostgreSQL client |
| multer | ^1.4.5 | File upload handling |
| jsonwebtoken | ^9.0.0 | Admin authentication |
| nodemon | ^3.0.0 | Dev auto-reload |
| dotenv | ^16.0.0 | Environment variables |

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Mobile App (Expo)                 │
│  SVG Floor Map → Dijkstra → Step Instructions       │
│  QR Scanner → Set Location → Route to Destination  │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────┐
│              Backend (Node.js / Express)             │
│  /api/buildings  /api/floors  /api/nodes  /api/qr   │
└──────────────────────┬──────────────────────────────┘
                       │ pg (node-postgres)
┌──────────────────────▼──────────────────────────────┐
│               PostgreSQL / Supabase                  │
│  buildings | floors | rooms | nodes | edges          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Admin Dashboard (React)                 │
│  Draw Rooms → Place QR Nodes → Connect Edges        │
│  Preview Path → Export IndoorGML / JSON / QR Data   │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/upload-map
                       └── → Backend → PostgreSQL
```

---

## 6. Database Schema

```sql
-- Buildings
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Floors
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id),
  name TEXT NOT NULL,
  floor_number INT NOT NULL,
  map_json JSONB -- full floor map stored as JSON
);

-- Navigation Nodes (QR positions)
CREATE TABLE nav_nodes (
  id TEXT PRIMARY KEY,
  floor_id UUID REFERENCES floors(id),
  label TEXT,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  room_id TEXT
);

-- Navigation Edges
CREATE TABLE nav_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID REFERENCES floors(id),
  from_node TEXT REFERENCES nav_nodes(id),
  to_node TEXT REFERENCES nav_nodes(id),
  weight FLOAT NOT NULL
);
```

---

## 7. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/buildings | List all buildings |
| GET | /api/buildings/:id/floors | Get all floors for a building |
| GET | /api/floors/:id/map | Get full floor map JSON |
| POST | /api/floors/:id/map | Save/update floor map |
| GET | /api/qr/:nodeId | Resolve QR node to location |
| POST | /api/buildings | Create new building |
| DELETE | /api/buildings/:id | Delete building |

---

## 8. Deployment Targets

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| Mobile App (dev) | Expo Go | ✅ Yes |
| Mobile App (prod) | EAS Build → APK | ✅ Free builds |
| Admin Dashboard | Vercel / Netlify | ✅ Yes |
| Backend API | Railway.app / Render.com | ✅ Yes |
| Database | Supabase | ✅ 500MB free |

---

## 9. Constraints & Assumptions

- No Google Maps API dependency — fully open-source
- All floor plans are manually drawn (no auto-import from CAD)
- QR codes are static and printed; no BLE/WiFi positioning
- Internet connection required for initial map load; offline caching optional
- Supports single building per admin session (multi-building in v3)
- IndoorGML export follows OGC IndoorGML 1.0 (not 2.0) for compatibility

---

## 10. Future Scope (v3+)

- BLE beacon positioning for real-time location
- AR navigation overlay using device camera
- Crowdsourced map corrections
- Integration with institute ERP (room timetables → live occupancy)
- Accessibility routing (wheelchair-friendly paths)
- IndoorGML 2.0 support
