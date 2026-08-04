require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── DATABASE SETUP (Supabase vs Local Store) ──────────────────────────────────
let supabase = null;
const isSupabaseConfigured = process.env.SUPABASE_URL && 
                             process.env.SUPABASE_KEY && 
                             !process.env.SUPABASE_URL.includes('your-project');

if (isSupabaseConfigured) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('⚡ Connected to Supabase backend');
  } catch (err) {
    console.warn('⚠️ Supabase init error, falling back to Local Data Store:', err.message);
  }
} else {
  console.log('ℹ️  Supabase URL/Key not configured. Running in Local Storage Mode (data/db.json)');
}

// ── LOCAL FILE STORE ENGINE ───────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE  = path.join(DATA_DIR, 'db.json');

const INITIAL_SEED_MAP = {
  buildings: [
    { id: 1, name: "Presidency University", created_at: new Date().toISOString() }
  ],
  floors: [
    {
      id: "floor-1",
      building_id: 1,
      name: "Floor 1",
      floor_number: 1,
      map_json: {
        rooms: [
          { id: "R101", label: "Room 101",  x: 30,  y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
          { id: "R102", label: "Room 102",  x: 200, y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
          { id: "R103", label: "Lab 103",   x: 370, y: 30,  w: 130, h: 80, type: "lab",       status: "open" },
          { id: "R104", label: "Room 104",  x: 540, y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
          { id: "R105", label: "Cafeteria", x: 30,  y: 380, w: 200, h: 100, type: "canteen",   status: "open" },
          { id: "R106", label: "Library",   x: 270, y: 380, w: 180, h: 100, type: "other",     status: "open" },
          { id: "R107", label: "Office",    x: 490, y: 380, w: 180, h: 100, type: "office",    status: "open" },
          { id: "LIFT", label: "Elevator",  x: 340, y: 210, w: 55,  h: 55,  type: "elevator",  status: "open" },
          { id: "STAIR",label: "Stairs",    x: 420, y: 210, w: 55,  h: 55,  type: "staircase", status: "open" }
        ],
        nodes: [
          { id: "N_R101",  x: 95,  y: 150, roomId: "R101",  type: "room" },
          { id: "N_R102",  x: 265, y: 150, roomId: "R102",  type: "room" },
          { id: "N_R103",  x: 435, y: 150, roomId: "R103",  type: "room" },
          { id: "N_R104",  x: 605, y: 150, roomId: "R104",  type: "room" },
          { id: "N_J1",    x: 95,  y: 190,                  type: "junction" },
          { id: "N_J2",    x: 265, y: 190,                  type: "junction" },
          { id: "N_J3",    x: 435, y: 190,                  type: "junction" },
          { id: "N_J4",    x: 605, y: 190,                  type: "junction" },
          { id: "N_LIFT",  x: 367, y: 237, roomId: "LIFT",  type: "elevator" },
          { id: "N_STAIR", x: 447, y: 237, roomId: "STAIR", type: "staircase" },
          { id: "N_MID",   x: 367, y: 320,                  type: "junction" },
          { id: "N_R105",  x: 130, y: 380, roomId: "R105",  type: "room" },
          { id: "N_R106",  x: 360, y: 380, roomId: "R106",  type: "room" },
          { id: "N_R107",  x: 580, y: 380, roomId: "R107",  type: "room" }
        ],
        edges: [
          { from: "N_R101",  to: "N_J1",    weight: 40  },
          { from: "N_R102",  to: "N_J2",    weight: 40  },
          { from: "N_R103",  to: "N_J3",    weight: 40  },
          { from: "N_R104",  to: "N_J4",    weight: 40  },
          { from: "N_J1",    to: "N_J2",    weight: 170 },
          { from: "N_J2",    to: "N_J3",    weight: 170 },
          { from: "N_J3",    to: "N_J4",    weight: 170 },
          { from: "N_J3",    to: "N_LIFT",  weight: 60  },
          { from: "N_J3",    to: "N_STAIR", weight: 20  },
          { from: "N_LIFT",  to: "N_MID",   weight: 83  },
          { from: "N_STAIR", to: "N_MID",   weight: 83  },
          { from: "N_MID",   to: "N_R105",  weight: 237 },
          { from: "N_MID",   to: "N_R106",  weight: 60  },
          { from: "N_MID",   to: "N_R107",  weight: 213 }
        ]
      }
    },
    {
      id: "floor-2",
      building_id: 1,
      name: "Floor 2",
      floor_number: 2,
      map_json: {
        rooms: [
          { id: "R201", label: "Room 201",  x: 30,  y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
          { id: "R202", label: "Room 202",  x: 200, y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
          { id: "R203", label: "Lab 203",   x: 370, y: 30,  w: 130, h: 80, type: "lab",       status: "open" },
          { id: "R204", label: "Room 204",  x: 540, y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
          { id: "R205", label: "Seminar",   x: 30,  y: 380, w: 250, h: 100, type: "other",     status: "open" },
          { id: "R206", label: "Faculty",   x: 320, y: 380, w: 180, h: 100, type: "office",    status: "open" },
          { id: "R207", label: "HOD Room",  x: 540, y: 380, w: 130, h: 100, type: "office",    status: "open" },
          { id: "LIFT2",label: "Elevator",  x: 340, y: 210, w: 55,  h: 55,  type: "elevator",  status: "open" },
          { id: "ST2",  label: "Stairs",    x: 420, y: 210, w: 55,  h: 55,  type: "staircase", status: "open" }
        ],
        nodes: [
          { id: "F2_R201",  x: 95,  y: 150, roomId: "R201",  type: "room" },
          { id: "F2_R202",  x: 265, y: 150, roomId: "R202",  type: "room" },
          { id: "F2_R203",  x: 435, y: 150, roomId: "R203",  type: "room" },
          { id: "F2_R204",  x: 605, y: 150, roomId: "R204",  type: "room" },
          { id: "F2_J1",    x: 95,  y: 190,                  type: "junction" },
          { id: "F2_J2",    x: 265, y: 190,                  type: "junction" },
          { id: "F2_J3",    x: 435, y: 190,                  type: "junction" },
          { id: "F2_J4",    x: 605, y: 190,                  type: "junction" },
          { id: "F2_LIFT",  x: 367, y: 237, roomId: "LIFT2", type: "elevator" },
          { id: "F2_STAIR", x: 447, y: 237, roomId: "ST2",   type: "staircase" },
          { id: "F2_MID",   x: 367, y: 320,                  type: "junction" },
          { id: "F2_R205",  x: 155, y: 380, roomId: "R205",  type: "room" },
          { id: "F2_R206",  x: 410, y: 380, roomId: "R206",  type: "room" },
          { id: "F2_R207",  x: 605, y: 380, roomId: "R207",  type: "room" }
        ],
        edges: [
          { from: "F2_R201",  to: "F2_J1",    weight: 40  },
          { from: "F2_R202",  to: "F2_J2",    weight: 40  },
          { from: "F2_R203",  to: "F2_J3",    weight: 40  },
          { from: "F2_R204",  to: "F2_J4",    weight: 40  },
          { from: "F2_J1",    to: "F2_J2",    weight: 170 },
          { from: "F2_J2",    to: "F2_J3",    weight: 170 },
          { from: "F2_J3",    to: "F2_J4",    weight: 170 },
          { from: "F2_J3",    to: "F2_LIFT",  weight: 60  },
          { from: "F2_J3",    to: "F2_STAIR", weight: 20  },
          { from: "F2_LIFT",  to: "F2_MID",   weight: 83  },
          { from: "F2_STAIR", to: "F2_MID",   weight: 83  },
          { from: "F2_MID",   to: "F2_R205",  weight: 212 },
          { from: "F2_MID",   to: "F2_R206",  weight: 43  },
          { from: "F2_MID",   to: "F2_R207",  weight: 238 }
        ]
      }
    }
  ],
  scan_counts: {},
  room_status: {}
};

function readLocalDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_SEED_MAP, null, 2));
      return INITIAL_SEED_MAP;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading db.json:', err.message);
    return INITIAL_SEED_MAP;
  }
}

function writeLocalDb(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing db.json:', err.message);
  }
}

// ── BUILDINGS ────────────────────────────────────────────────────────────────
app.get('/api/buildings', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('buildings').select('*').order('created_at', { ascending: false });
    if (!error && data) return res.json(data);
  }
  const db = readLocalDb();
  res.json(db.buildings || []);
});

// ── FLOORS ───────────────────────────────────────────────────────────────────
app.get('/api/buildings/:id/floors', async (req, res) => {
  const buildingId = req.params.id;
  if (supabase) {
    const { data, error } = await supabase.from('floors').select('*').eq('building_id', buildingId).order('floor_number');
    if (!error && data) return res.json(data);
  }
  const db = readLocalDb();
  const floors = (db.floors || []).filter(f => String(f.building_id) === String(buildingId));
  res.json(floors);
});

app.get('/api/floors/:id/map', async (req, res) => {
  const floorId = req.params.id;
  if (supabase) {
    const { data, error } = await supabase.from('floors').select('map_json').eq('id', floorId).single();
    if (!error && data) return res.json(data.map_json);
  }
  const db = readLocalDb();
  const floor = (db.floors || []).find(f => String(f.id) === String(floorId));
  if (!floor) return res.status(404).json({ error: 'Floor not found' });
  res.json(floor.map_json);
});

app.post('/api/floors/:id/map', async (req, res) => {
  const floorId = req.params.id;
  if (supabase) {
    const { error } = await supabase.from('floors').update({ map_json: req.body }).eq('id', floorId);
    if (!error) return res.json({ success: true });
  }
  const db = readLocalDb();
  const floorIndex = (db.floors || []).findIndex(f => String(f.id) === String(floorId));
  if (floorIndex === -1) return res.status(404).json({ error: 'Floor not found' });
  db.floors[floorIndex].map_json = req.body;
  writeLocalDb(db);
  res.json({ success: true });
});

// ── UPLOAD MAP ────────────────────────────────────────────────────────────────
app.post('/api/upload-map', async (req, res) => {
  const { buildingName, floors, rooms, nodes, edges } = req.body;
  if (!buildingName || !floors) return res.status(400).json({ error: 'buildingName and floors required' });

  if (supabase) {
    try {
      const { data: bData, error: bErr } = await supabase
        .from('buildings').insert({ name: buildingName }).select('id').single();
      if (!bErr && bData) {
        const buildingId = bData.id;
        for (let i = 0; i < floors.length; i++) {
          const floorRooms = (rooms || []).filter(r => r.floor === floors[i]);
          const floorNodes = (nodes || []).filter(n => n.floor === floors[i]);
          const floorEdges = (edges || []).filter(e =>
            floorNodes.find(n => n.id === e.from) && floorNodes.find(n => n.id === e.to)
          );
          await supabase.from('floors').insert({
            building_id: buildingId, name: floors[i], floor_number: i + 1,
            map_json: { rooms: floorRooms, nodes: floorNodes, edges: floorEdges }
          });
        }
        return res.json({ success: true, buildingId });
      }
    } catch (err) {
      console.warn('Supabase map upload failed, falling back to local DB:', err.message);
    }
  }

  // Local fallback
  const db = readLocalDb();
  const newBuildingId = (db.buildings.length ? Math.max(...db.buildings.map(b => b.id)) : 0) + 1;
  const newBuilding = { id: newBuildingId, name: buildingName, created_at: new Date().toISOString() };
  db.buildings.unshift(newBuilding);

  floors.forEach((flName, i) => {
    const floorRooms = (rooms || []).filter(r => r.floor === flName);
    const floorNodes = (nodes || []).filter(n => n.floor === flName);
    const floorEdges = (edges || []).filter(e =>
      floorNodes.find(n => n.id === e.from) && floorNodes.find(n => n.id === e.to)
    );
    db.floors.push({
      id: `floor-${newBuildingId}-${i + 1}`,
      building_id: newBuildingId,
      name: flName,
      floor_number: i + 1,
      map_json: { rooms: floorRooms, nodes: floorNodes, edges: floorEdges }
    });
  });

  writeLocalDb(db);
  res.json({ success: true, buildingId: newBuildingId });
});

// ── ROUTE (Dijkstra) ──────────────────────────────────────────────────────────
app.post('/api/route', async (req, res) => {
  const { floorId, startNodeId, endNodeId } = req.body;
  if (!floorId || !startNodeId || !endNodeId)
    return res.status(400).json({ error: 'floorId, startNodeId, endNodeId required' });

  let map_json = null;

  if (supabase) {
    const { data, error } = await supabase.from('floors').select('map_json').eq('id', floorId).single();
    if (!error && data) map_json = data.map_json;
  }

  if (!map_json) {
    const db = readLocalDb();
    const floor = (db.floors || []).find(f => String(f.id) === String(floorId));
    if (floor) map_json = floor.map_json;
  }

  if (!map_json || !map_json.nodes || !map_json.edges) {
    return res.status(404).json({ error: 'Floor map not found' });
  }

  const { nodes, edges } = map_json;
  const result = dijkstra(nodes, edges, startNodeId, endNodeId);
  if (!result) return res.status(404).json({ error: 'No path found between selected nodes' });

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  res.json({ path: result.path.map(id => nodeMap[id]), distance: result.distance });
});

// ── QR NODE LOOKUP ────────────────────────────────────────────────────────────
app.get('/api/qr/:nodeId', async (req, res) => {
  const nodeId = req.params.nodeId;
  if (supabase) {
    const { data, error } = await supabase.from('nav_nodes').select('*').eq('id', nodeId).single();
    if (!error && data) return res.json(data);
  }
  const db = readLocalDb();
  for (const floor of db.floors || []) {
    const node = (floor.map_json?.nodes || []).find(n => n.id === nodeId);
    if (node) return res.json({ ...node, floorId: floor.id, floorName: floor.name });
  }
  res.status(404).json({ error: 'Node not found' });
});

// ── QR SCAN TRACKING (Heatmap) ───────────────────────────────────────────────
app.post('/api/scan', async (req, res) => {
  const { nodeId } = req.body;
  if (!nodeId) return res.status(400).json({ error: 'nodeId required' });

  if (supabase) {
    try {
      const { data: existing } = await supabase.from('scan_counts').select('*').eq('node_id', nodeId).single();
      if (existing) {
        await supabase.from('scan_counts').update({ count: existing.count + 1, last_scanned: new Date().toISOString() }).eq('node_id', nodeId);
      } else {
        await supabase.from('scan_counts').insert({ node_id: nodeId, count: 1, last_scanned: new Date().toISOString() });
      }
      return res.json({ success: true });
    } catch (err) {
      console.warn('Supabase scan insert failed, using local DB:', err.message);
    }
  }

  const db = readLocalDb();
  if (!db.scan_counts) db.scan_counts = {};
  db.scan_counts[nodeId] = (db.scan_counts[nodeId] || 0) + 1;
  writeLocalDb(db);
  res.json({ success: true, count: db.scan_counts[nodeId] });
});

// ── HEATMAP DATA ─────────────────────────────────────────────────────────────
app.get('/api/heatmap/:buildingId', async (req, res) => {
  const buildingId = req.params.buildingId;
  const db = readLocalDb();
  let floors = (db.floors || []).filter(f => String(f.building_id) === String(buildingId));

  if (supabase) {
    const { data: sbFloors } = await supabase.from('floors').select('id, name, floor_number, map_json').eq('building_id', buildingId);
    if (sbFloors && sbFloors.length) floors = sbFloors;
  }

  if (!floors.length) return res.status(404).json({ error: 'Building or floors not found' });

  const countMap = db.scan_counts || {};

  const result = floors.map(f => ({
    floorId: f.id,
    floorName: f.name,
    floorNumber: f.floor_number,
    nodes: (f.map_json?.nodes || []).map(n => ({
      ...n,
      scanCount: countMap[n.id] || 0
    }))
  }));

  res.json(result);
});

// ── ROOM STATUS ──────────────────────────────────────────────────────────────
app.get('/api/floors/:id/status', async (req, res) => {
  const floorId = req.params.id;
  if (supabase) {
    const { data, error } = await supabase.from('room_status').select('*').eq('floor_id', floorId);
    if (!error && data) return res.json(data);
  }
  const db = readLocalDb();
  const statuses = db.room_status?.[floorId] || [];
  res.json(statuses);
});

app.post('/api/rooms/status', async (req, res) => {
  const { floorId, roomId, status } = req.body;
  if (!floorId || !roomId || !status) return res.status(400).json({ error: 'floorId, roomId, status required' });

  if (supabase) {
    try {
      const { data: existing } = await supabase.from('room_status').select('*').eq('floor_id', floorId).eq('room_id', roomId).single();
      if (existing) {
        await supabase.from('room_status').update({ status, updated_at: new Date().toISOString() }).eq('floor_id', floorId).eq('room_id', roomId);
      } else {
        await supabase.from('room_status').insert({ floor_id: floorId, room_id: roomId, status, updated_at: new Date().toISOString() });
      }
      return res.json({ success: true });
    } catch (err) {
      console.warn('Supabase room status update failed, using local DB:', err.message);
    }
  }

  const db = readLocalDb();
  if (!db.room_status) db.room_status = {};
  if (!db.room_status[floorId]) db.room_status[floorId] = [];

  const existingIdx = db.room_status[floorId].findIndex(r => r.room_id === roomId);
  const entry = { floor_id: floorId, room_id: roomId, status, updated_at: new Date().toISOString() };
  if (existingIdx >= 0) {
    db.room_status[floorId][existingIdx] = entry;
  } else {
    db.room_status[floorId].push(entry);
  }

  writeLocalDb(db);
  res.json({ success: true });
});

// ── HEALTH & DIAGNOSTICS ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: isSupabaseConfigured ? 'supabase' : 'local-json',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// ── DIJKSTRA PATHFINDING ──────────────────────────────────────────────────────
function dijkstra(nodes, edges, startId, endId) {
  const dist = {}, prev = {};
  const visited = new Set();
  nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
  dist[startId] = 0;
  const queue = nodes.map(n => n.id);

  while (queue.length) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const u = queue.shift();
    if (u === endId) break;
    if (dist[u] === Infinity) break;
    visited.add(u);

    edges.filter(e => e.from === u || e.to === u).forEach(e => {
      const nb = e.from === u ? e.to : e.from;
      if (visited.has(nb)) return;
      const weight = e.weight || e.w || 1;
      const alt = dist[u] + weight;
      if (alt < dist[nb]) { dist[nb] = alt; prev[nb] = u; }
    });
  }

  const path = [];
  let cur = endId;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  if (path[0] !== startId) return null;
  return { path, distance: dist[endId] };
}

app.listen(PORT, () => {
  console.log(`🗺️  IndoorNav Server running on http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});
