require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3001;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_KEY in .env'); process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

supabase.from('buildings').select('count').then(({ error }) => {
  if (error) console.warn('DB warn:', error.message);
  else console.log('✅ Supabase connected');
});

// ── BUILDINGS ────────────────────────────────────────────────────────────────
app.get('/api/buildings', async (req, res) => {
  const { data, error } = await supabase.from('buildings').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── FLOORS ───────────────────────────────────────────────────────────────────
app.get('/api/buildings/:id/floors', async (req, res) => {
  const { data, error } = await supabase.from('floors').select('*').eq('building_id', req.params.id).order('floor_number');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/floors/:id/map', async (req, res) => {
  const { data, error } = await supabase.from('floors').select('map_json').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Floor not found' });
  res.json(data.map_json);
});

app.post('/api/floors/:id/map', async (req, res) => {
  const { error } = await supabase.from('floors').update({ map_json: req.body }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── UPLOAD MAP ────────────────────────────────────────────────────────────────
app.post('/api/upload-map', async (req, res) => {
  const { buildingName, floors, rooms, nodes, edges } = req.body;
  const { data: bData, error: bErr } = await supabase
    .from('buildings').insert({ name: buildingName }).select('id').single();
  if (bErr) return res.status(500).json({ error: bErr.message });
  const buildingId = bData.id;
  for (let i = 0; i < floors.length; i++) {
    const floorRooms = rooms.filter(r => r.floor === floors[i]);
    const floorNodes = nodes.filter(n => n.floor === floors[i]);
    const floorEdges = edges.filter(e =>
      floorNodes.find(n => n.id === e.from) && floorNodes.find(n => n.id === e.to)
    );
    const { error: fErr } = await supabase.from('floors').insert({
      building_id: buildingId, name: floors[i], floor_number: i,
      map_json: { rooms: floorRooms, nodes: floorNodes, edges: floorEdges }
    });
    if (fErr) return res.status(500).json({ error: fErr.message });
  }
  res.json({ success: true, buildingId });
});

// ── ROUTE ─────────────────────────────────────────────────────────────────────
app.post('/api/route', async (req, res) => {
  const { floorId, startNodeId, endNodeId } = req.body;
  if (!floorId || !startNodeId || !endNodeId)
    return res.status(400).json({ error: 'floorId, startNodeId, endNodeId required' });
  const { data, error } = await supabase.from('floors').select('map_json').eq('id', floorId).single();
  if (error) return res.status(404).json({ error: 'Floor not found' });
  const { nodes, edges } = data.map_json;
  const result = dijkstra(nodes, edges, startNodeId, endNodeId);
  if (!result) return res.status(404).json({ error: 'No path found' });
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  res.json({ path: result.path.map(id => nodeMap[id]), distance: result.distance });
});

// ── QR NODE LOOKUP ────────────────────────────────────────────────────────────
app.get('/api/qr/:nodeId', async (req, res) => {
  const { data, error } = await supabase.from('nav_nodes').select('*').eq('id', req.params.nodeId).single();
  if (error) return res.status(404).json({ error: 'Node not found' });
  res.json(data);
});

// ── QR SCAN TRACKING (Phase 6 — heatmap) ─────────────────────────────────────
app.post('/api/scan', async (req, res) => {
  const { nodeId } = req.body;
  if (!nodeId) return res.status(400).json({ error: 'nodeId required' });
  // Upsert scan count
  const { data: existing } = await supabase.from('scan_counts').select('*').eq('node_id', nodeId).single();
  if (existing) {
    await supabase.from('scan_counts').update({ count: existing.count + 1, last_scanned: new Date().toISOString() }).eq('node_id', nodeId);
  } else {
    await supabase.from('scan_counts').insert({ node_id: nodeId, count: 1, last_scanned: new Date().toISOString() });
  }
  res.json({ success: true });
});

// GET heatmap data for a building
app.get('/api/heatmap/:buildingId', async (req, res) => {
  // Get all floor IDs for this building
  const { data: floors } = await supabase.from('floors').select('id, name, floor_number, map_json').eq('building_id', req.params.buildingId);
  if (!floors) return res.status(404).json({ error: 'Building not found' });
  // Get all scan counts
  const allNodeIds = floors.flatMap(f => (f.map_json?.nodes || []).map(n => n.id));
  const { data: counts } = await supabase.from('scan_counts').select('*').in('node_id', allNodeIds);
  const countMap = Object.fromEntries((counts || []).map(c => [c.node_id, c.count]));
  const result = floors.map(f => ({
    floorId: f.id, floorName: f.name, floorNumber: f.floor_number,
    nodes: (f.map_json?.nodes || []).map(n => ({ ...n, scanCount: countMap[n.id] || 0 })),
  }));
  res.json(result);
});

// ── ROOM STATUS (Phase 6) ─────────────────────────────────────────────────────
// GET room statuses for a floor
app.get('/api/floors/:id/status', async (req, res) => {
  const { data, error } = await supabase.from('room_status').select('*').eq('floor_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST update room status
app.post('/api/rooms/status', async (req, res) => {
  const { floorId, roomId, status } = req.body;
  if (!floorId || !roomId || !status) return res.status(400).json({ error: 'floorId, roomId, status required' });
  const { data: existing } = await supabase.from('room_status').select('*').eq('floor_id', floorId).eq('room_id', roomId).single();
  if (existing) {
    await supabase.from('room_status').update({ status, updated_at: new Date().toISOString() }).eq('floor_id', floorId).eq('room_id', roomId);
  } else {
    await supabase.from('room_status').insert({ floor_id: floorId, room_id: roomId, status, updated_at: new Date().toISOString() });
  }
  res.json({ success: true });
});

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', port: PORT }));

// ── DIJKSTRA ──────────────────────────────────────────────────────────────────
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
      const alt = dist[u] + e.weight;
      if (alt < dist[nb]) { dist[nb] = alt; prev[nb] = u; }
    });
  }
  const path = [];
  let cur = endId;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  if (path[0] !== startId) return null;
  return { path, distance: dist[endId] };
}

app.listen(PORT, () => console.log(`🗺  Indoor Nav Server running on port ${PORT}`));
