# Indoor Navigation System — Usage Guide
**Project:** indoor-nav-india | **Version:** 2.0

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Running the Admin Dashboard](#running-the-admin-dashboard)
5. [Running the Backend Server](#running-the-backend-server)
6. [Running the Mobile App](#running-the-mobile-app)
7. [Using the Admin Dashboard](#using-the-admin-dashboard)
8. [Workflow: Build a Complete Map](#workflow-build-a-complete-map)
9. [QR Code Setup](#qr-code-setup)
10. [Deployment](#deployment)
11. [Common Errors & Fixes](#common-errors--fixes)
12. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Prerequisites

Install these before anything else:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ (LTS) | https://nodejs.org |
| npm | 9+ (comes with Node) | — |
| Git | Any | https://git-scm.com |
| Expo Go (mobile) | Latest | Play Store / App Store |
| VS Code (recommended) | Any | https://code.visualstudio.com |

Verify your setup:
```bash
node --version    # Should print v18.x.x or higher
npm --version     # Should print 9.x.x or higher
```

---

## Project Structure

```
Indoor_maps/
├── admin/              ← React web admin dashboard (YOU ARE EDITING THIS)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js      ← Main admin UI (floor plan editor)
│   │   └── index.js    ← React entry point
│   └── package.json
│
├── server/             ← Node.js + Express backend API
│   ├── index.js        ← Server entry point
│   └── package.json
│
├── App.tsx             ← React Native mobile app root
├── app.json            ← Expo config
├── package.json        ← Mobile app dependencies
└── tsconfig.json
```

---

## Step-by-Step Setup

### Step 1 — Fix React Native version mismatch

You saw this warning: `react-native@0.76.0 — expected version: 0.76.9`

Fix it by running in your project root:
```bash
cd C:\Users\kathu\Desktop\projects\Indoor_maps
npx expo install react-native@0.76.9
```

### Step 2 — Install admin dependencies

```bash
cd C:\Users\kathu\Desktop\projects\Indoor_maps\admin
npm install
```

### Step 3 — Install server dependencies

```bash
cd C:\Users\kathu\Desktop\projects\Indoor_maps\server
npm install
```

### Step 4 — Replace admin source files

Copy the new `App.js` and `index.js` from this package into:
```
Indoor_maps\admin\src\App.js      (replace existing)
Indoor_maps\admin\src\index.js    (replace existing)
```

---

## Running the Admin Dashboard

Open a terminal in the `admin` folder:

```bash
cd C:\Users\kathu\Desktop\projects\Indoor_maps\admin
$env:HOST="localhost"     # PowerShell
npm start
```

> Opens at **http://localhost:3000**

**Important:** Always set `$env:HOST=localhost` in PowerShell before `npm start`, otherwise it may open on 0.0.0.0 which causes issues on Windows.

If port 3000 is busy:
```bash
$env:PORT=3001
$env:HOST="localhost"
npm start
```

---

## Running the Backend Server

Open a **second terminal** in the `server` folder:

```bash
cd C:\Users\kathu\Desktop\projects\Indoor_maps\server
npm start
```

> Runs on **http://localhost:3001**

For auto-reload during development (if nodemon is installed):
```bash
npm run dev
```

---

## Running the Mobile App

Open a **third terminal** in the project root:

```bash
cd C:\Users\kathu\Desktop\projects\Indoor_maps
npx expo start
```

Then:
- **Android device/emulator:** Press `a` in the terminal, OR scan the QR code with Expo Go app
- **Web browser:** Press `w`
- **iOS:** Scan QR code with Camera app (iOS 12+)

If port 8081 is busy, Expo will ask you to use 8082 — just type `yes`.

---

## Using the Admin Dashboard

### Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│  🗺️ IndoorNav Admin  [Building Name]  [Floor Tabs]  [...] │  ← Header
├──────────────┬──────────────────────────────┬────────────┤
│              │                              │            │
│  LEFT        │         SVG CANVAS           │  RIGHT     │
│  SIDEBAR     │   (draw rooms & nodes here)  │  PANEL     │
│              │                              │            │
│  Tools       │                              │  Properties│
│  Room Types  │                              │  (selected │
│  Pathfinding │                              │   item)    │
│              │                              │            │
└──────────────┴──────────────────────────────┴────────────┘
```

### Tools (Left Sidebar)

| Tool | What it does |
|------|-------------|
| **↖️ Select / Connect** | Click a room to select it. Click a QR node to start connecting; click another node to create an edge. |
| **⬛ Draw Room** | Click and drag on the canvas to draw a room rectangle. Choose room type first. |
| **📍 Add QR Node** | Click anywhere on the canvas to place a QR navigation node. |
| **🗑️ Delete** | Click any room or node to delete it immediately. |

### Floors

- Click floor tabs in the header to switch between floors.
- Click **+ Floor** to add a new floor (type the name in the prompt).
- Each floor has its own set of rooms and nodes.

### Export Buttons (Header, top-right)

| Button | Output | Use For |
|--------|--------|---------|
| 💾 JSON | `.json` file | Save/load your map later |
| 📄 GML | `.gml` IndoorGML | Standard format for navigation systems |
| 📱 QR Data | `.json` with QR payloads | Print QR codes from this data |
| 📂 Import | Load `.json` | Resume editing a saved map |

---

## Workflow: Build a Complete Map

Follow these steps in order to create a navigation-ready floor map:

### Phase 1 — Draw Rooms

1. Select **⬛ Draw Room** tool
2. Choose room type (e.g., Classroom)
3. Click and drag on the canvas to draw the room
4. Edit the room name in the **Right Panel**
5. Repeat for all rooms on this floor

### Phase 2 — Place QR Nodes

1. Select **📍 Add QR Node** tool
2. Click at corridor junctions, room entrances, and staircase landings
3. A blue circle with "QR" appears at each click
4. Tip: Place nodes every ~10 meters of corridor

### Phase 3 — Connect Nodes with Edges

1. Select **↖️ Select / Connect** tool
2. Click any QR node — it turns highlighted and a notification appears
3. Click another QR node to create an edge between them
4. The edge weight is automatically calculated from pixel distance
5. Repeat until all adjacent nodes are connected

### Phase 4 — Link Nodes to Rooms

1. Select a QR node
2. In the Right Panel, use the **Linked Room** dropdown
3. Select the room this node is inside/at the entrance of
4. This allows the mobile app to say "You are in Room 101"

### Phase 5 — Test Pathfinding

1. In the Left Sidebar, under **Pathfinding Preview**
2. Select a **From Node** and **To Node**
3. Click **🔍 Find Path**
4. The shortest path highlights in cyan on the canvas
5. The step sequence appears below the button

### Phase 6 — Export

1. Click **💾 JSON** to save your work
2. Click **📄 GML** to export IndoorGML for the mobile app
3. Click **📱 QR Data** to get node payloads for printing QR codes

---

## QR Code Setup

### What's in a QR Code?

Each QR node generates a payload like:
```json
{
  "nodeId": "node_1234567_1",
  "label": "Node 3",
  "building": "RVCE Main Block",
  "floor": "Ground Floor",
  "x": 240,
  "y": 160
}
```

### How to Print QR Codes

1. Export QR Data (📱 button) — you get a `.json` file
2. Use a free QR generator like [qr-code-generator.com](https://www.qr-code-generator.com) or [goqr.me](https://goqr.me)
3. For each node, create a QR code from its `qrPayload` string
4. Print and laminate; stick at the physical location in the building

### In the Mobile App

When a user scans a QR code:
- The app reads the `nodeId`
- Fetches the node's location from the backend
- Sets the user's current position on the map
- The user can then search a destination to get directions

---

## Deployment

### Deploy Admin Dashboard (Vercel)

```bash
cd admin
npm run build
# Then drag the 'build' folder to vercel.com/new
# Or use Vercel CLI:
npx vercel --prod
```

### Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Point to your `server/` folder
3. Set environment variables:
   ```
   PORT=3001
   DATABASE_URL=postgresql://...   (from Supabase)
   ```

### Deploy Database (Supabase)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your connection string
3. Run the SQL schema from the Requirements doc
4. Paste the connection string as `DATABASE_URL` in Railway

### Build Mobile APK (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## Common Errors & Fixes

### Error: Port 3000 already in use
```bash
# PowerShell
$env:PORT=3001; $env:HOST="localhost"; npm start
```

### Error: react-native version mismatch
```bash
npx expo install react-native@0.76.9
```

### Error: Cannot find module 'react-scripts'
```bash
cd admin
npm install
```

### Admin canvas is blank / rooms not showing
- Check you're on the correct floor tab
- Try **Reset View** button in sidebar (sets zoom back to 1x)

### Pathfinding returns "No path found"
- Ensure all nodes are connected with edges
- Make sure From and To nodes are both on the **same floor**
- Check edge list in Right Panel — delete and reconnect broken edges

### Expo QR code doesn't scan on phone
- Ensure phone and PC are on the **same Wi-Fi network**
- Try switching from Expo Go to development build: press `s` in Expo terminal

### Server not reachable from mobile app
- Update your API base URL in the mobile app to use your PC's local IP (not localhost):
```javascript
const API_BASE = "http://172.17.15.122:3001"; // use your IP from Expo terminal
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` | Delete selected room or node |
| `Escape` | Cancel current drawing / cancel node connection |
| `Scroll wheel` | Zoom in/out |
| `Alt + drag` | Pan the canvas |
| `Middle mouse drag` | Pan the canvas |

---

## Tips for Best Results

- **Grid snapping:** All rooms and nodes snap to a 20px grid — keep this on for clean alignment.
- **Node density:** Place QR nodes every 10–15 meters of real-world corridor distance.
- **Edge weights:** Weights are auto-calculated in pixels — they're proportional to real distance if you draw your map to scale.
- **Save often:** Use **💾 JSON** export frequently. There is no auto-save.
- **Floor continuity:** For multi-floor routing, place a staircase/elevator node on each floor with the same label (e.g., "Staircase A") and mark its type as `staircase`. The mobile app handles cross-floor routing automatically.

---

*For issues, open a GitHub issue at: https://github.com/your-username/indoor-nav-india*
