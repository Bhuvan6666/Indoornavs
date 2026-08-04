import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, Alert, Dimensions, PanResponder,
  TextInput, Modal,
} from "react-native";
import Svg, {
  Rect, Text as SvgText, Circle, Path, G, Line, Defs,
  LinearGradient, Stop, Filter, FeDropShadow
} from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");
const MAP_H = SCREEN_W * (560 / 720);

// Default backend server URL (configurable for LAN IP or localhost)
const SERVER_URL = "http://localhost:3001";

interface Room {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type?: string;
  status?: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  roomId?: string;
  floor?: number;
  type?: string;
}

interface Edge {
  from: string;
  to: string;
  w: number;
}

interface Floor {
  id: string;
  label: string;
  number: number;
  rooms: Room[];
  nodes: Node[];
  edges: Edge[];
}

const FLOORS: Floor[] = [
  {
    id: "F1", label: "Floor 1", number: 1,
    rooms: [
      { id: "R101", label: "Room 101",  x: 30,  y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
      { id: "R102", label: "Room 102",  x: 200, y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
      { id: "R103", label: "Lab 103",   x: 370, y: 30,  w: 130, h: 80, type: "lab",       status: "open" },
      { id: "R104", label: "Room 104",  x: 540, y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
      { id: "R105", label: "Cafeteria", x: 30,  y: 380, w: 200, h: 100, type: "canteen",   status: "open" },
      { id: "R106", label: "Library",   x: 270, y: 380, w: 180, h: 100, type: "other",     status: "open" },
      { id: "R107", label: "Office",    x: 490, y: 380, w: 180, h: 100, type: "office",    status: "open" },
      { id: "LIFT", label: "Elevator",  x: 340, y: 210, w: 55,  h: 55,  type: "elevator",  status: "open" },
      { id: "STAIR",label: "Stairs",    x: 420, y: 210, w: 55,  h: 55,  type: "staircase", status: "open" },
    ],
    nodes: [
      { id: "N_R101",  x: 95,  y: 150, roomId: "R101"  },
      { id: "N_R102",  x: 265, y: 150, roomId: "R102"  },
      { id: "N_R103",  x: 435, y: 150, roomId: "R103"  },
      { id: "N_R104",  x: 605, y: 150, roomId: "R104"  },
      { id: "N_J1",    x: 95,  y: 190                  },
      { id: "N_J2",    x: 265, y: 190                  },
      { id: "N_J3",    x: 435, y: 190                  },
      { id: "N_J4",    x: 605, y: 190                  },
      { id: "N_LIFT",  x: 367, y: 237, roomId: "LIFT"  },
      { id: "N_STAIR", x: 447, y: 237, roomId: "STAIR" },
      { id: "N_MID",   x: 367, y: 320                  },
      { id: "N_R105",  x: 130, y: 380, roomId: "R105"  },
      { id: "N_R106",  x: 360, y: 380, roomId: "R106"  },
      { id: "N_R107",  x: 580, y: 380, roomId: "R107"  },
    ],
    edges: [
      { from: "N_R101",  to: "N_J1",    w: 40  },
      { from: "N_R102",  to: "N_J2",    w: 40  },
      { from: "N_R103",  to: "N_J3",    w: 40  },
      { from: "N_R104",  to: "N_J4",    w: 40  },
      { from: "N_J1",    to: "N_J2",    w: 170 },
      { from: "N_J2",    to: "N_J3",    w: 170 },
      { from: "N_J3",    to: "N_J4",    w: 170 },
      { from: "N_J3",    to: "N_LIFT",  w: 60  },
      { from: "N_J3",    to: "N_STAIR", w: 20  },
      { from: "N_LIFT",  to: "N_MID",   w: 83  },
      { from: "N_STAIR", to: "N_MID",   w: 83  },
      { from: "N_MID",   to: "N_R105",  w: 237 },
      { from: "N_MID",   to: "N_R106",  w: 60  },
      { from: "N_MID",   to: "N_R107",  w: 213 },
    ],
  },
  {
    id: "F2", label: "Floor 2", number: 2,
    rooms: [
      { id: "R201", label: "Room 201",  x: 30,  y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
      { id: "R202", label: "Room 202",  x: 200, y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
      { id: "R203", label: "Lab 203",   x: 370, y: 30,  w: 130, h: 80, type: "lab",       status: "open" },
      { id: "R204", label: "Room 204",  x: 540, y: 30,  w: 130, h: 80, type: "classroom", status: "open" },
      { id: "R205", label: "Seminar",   x: 30,  y: 380, w: 250, h: 100, type: "other",     status: "open" },
      { id: "R206", label: "Faculty",   x: 320, y: 380, w: 180, h: 100, type: "office",    status: "open" },
      { id: "R207", label: "HOD Room",  x: 540, y: 380, w: 130, h: 100, type: "office",    status: "open" },
      { id: "LIFT2",label: "Elevator",  x: 340, y: 210, w: 55,  h: 55,  type: "elevator",  status: "open" },
      { id: "ST2",  label: "Stairs",    x: 420, y: 210, w: 55,  h: 55,  type: "staircase", status: "open" },
    ],
    nodes: [
      { id: "F2_R201",  x: 95,  y: 150, roomId: "R201"  },
      { id: "F2_R202",  x: 265, y: 150, roomId: "R202"  },
      { id: "F2_R203",  x: 435, y: 150, roomId: "R203"  },
      { id: "F2_R204",  x: 605, y: 150, roomId: "R204"  },
      { id: "F2_J1",    x: 95,  y: 190                  },
      { id: "F2_J2",    x: 265, y: 190                  },
      { id: "F2_J3",    x: 435, y: 190                  },
      { id: "F2_J4",    x: 605, y: 190                  },
      { id: "F2_LIFT",  x: 367, y: 237, roomId: "LIFT2" },
      { id: "F2_STAIR", x: 447, y: 237, roomId: "ST2"   },
      { id: "F2_MID",   x: 367, y: 320                  },
      { id: "F2_R205",  x: 155, y: 380, roomId: "R205"  },
      { id: "F2_R206",  x: 410, y: 380, roomId: "R206"  },
      { id: "F2_R207",  x: 605, y: 380, roomId: "R207"  },
    ],
    edges: [
      { from: "F2_R201",  to: "F2_J1",    w: 40  },
      { from: "F2_R202",  to: "F2_J2",    w: 40  },
      { from: "F2_R203",  to: "F2_J3",    w: 40  },
      { from: "F2_R204",  to: "F2_J4",    w: 40  },
      { from: "F2_J1",    to: "F2_J2",    w: 170 },
      { from: "F2_J2",    to: "F2_J3",    w: 170 },
      { from: "F2_J3",    to: "F2_J4",    w: 170 },
      { from: "F2_J3",    to: "F2_LIFT",  w: 60  },
      { from: "F2_J3",    to: "F2_STAIR", w: 20  },
      { from: "F2_LIFT",  to: "F2_MID",   w: 83  },
      { from: "F2_STAIR", to: "F2_MID",   w: 83  },
      { from: "F2_MID",   to: "F2_R205",  w: 212 },
      { from: "F2_MID",   to: "F2_R206",  w: 43  },
      { from: "F2_MID",   to: "F2_R207",  w: 238 },
    ],
  },
];

const CROSS_EDGES: Edge[] = [
  { from: "N_LIFT",  to: "F2_LIFT",  w: 50 },
  { from: "N_STAIR", to: "F2_STAIR", w: 40 },
  { from: "F2_LIFT",  to: "N_LIFT",  w: 50 },
  { from: "F2_STAIR", to: "N_STAIR", w: 40 },
];

function findRoute(startId: string, endId: string) {
  const allNodes = FLOORS.flatMap(f => f.nodes.map(n => ({ ...n, floor: f.number })));
  const allEdges = [
    ...FLOORS.flatMap(f => f.edges.map(e => ({ from: e.from, to: e.to, w: e.w }))),
    ...CROSS_EDGES,
  ];
  const nodeMap = Object.fromEntries(allNodes.map(n => [n.id, n]));
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  allNodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
  if (dist[startId] === undefined || dist[endId] === undefined) return null;
  dist[startId] = 0;

  const queue = allNodes.map(n => n.id);
  while (queue.length) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const u = queue.shift()!;
    if (u === endId) break;
    if (dist[u] === Infinity) break;
    visited.add(u);

    allEdges.filter(e => e.from === u || e.to === u).forEach(e => {
      const nb = e.from === u ? e.to : e.from;
      if (visited.has(nb)) return;
      const alt = dist[u] + e.w;
      if (alt < dist[nb]) { dist[nb] = alt; prev[nb] = u; }
    });
  }

  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  if (path[0] !== startId) return null;
  return { path: path.map(id => nodeMap[id]), dist: Math.round(dist[endId]) };
}

function pathD(nodes: Node[]) {
  return nodes.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x} ${n.y}`).join(" ");
}

export default function App() {
  const [floorIdx, setFloorIdx]   = useState(0);
  const [startRoom, setStartRoom] = useState<{ room: Room; floorIdx: number } | null>(null);
  const [endRoom, setEndRoom]     = useState<{ room: Room; floorIdx: number } | null>(null);
  const [mode, setMode]           = useState<"start" | "end" | null>(null);
  const [routePath, setRoutePath] = useState<Node[]>([]);
  const [routeDist, setRouteDist] = useState<number | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTarget, setSearchTarget] = useState<"start" | "end">("start");
  const [pan, setPan]             = useState({ x: 0, y: 0 });
  const lastPan = useRef({ x: 0, y: 0 });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
    onPanResponderGrant: () => { lastPan.current = { x: pan.x, y: pan.y }; },
    onPanResponderMove: (_, g) => setPan({ x: lastPan.current.x + g.dx, y: lastPan.current.y + g.dy }),
  });

  const floor = FLOORS[floorIdx];

  const resetPan = () => setPan({ x: 0, y: 0 });

  const doRoute = async (sRoom: Room, sFloorIdx: number, eRoom: Room, eFloorIdx: number) => {
    const sf = FLOORS[sFloorIdx];
    const ef = FLOORS[eFloorIdx];
    const sn = sf.nodes.find(n => n.roomId === sRoom.id);
    const en = ef.nodes.find(n => n.roomId === eRoom.id);
    if (!sn || !en) { Alert.alert("No Path", "Selected rooms lack graph navigation nodes."); return; }

    // Client-side local calculation fallback
    const localResult = findRoute(sn.id, en.id);
    if (localResult) {
      setRoutePath(localResult.path);
      setRouteDist(localResult.dist);
      setFloorIdx(sFloorIdx);
    } else {
      Alert.alert("Route Unavailable", "Could not calculate a path between these rooms.");
    }
  };

  const handleRoomTap = (room: Room) => {
    if (mode === "start") {
      setStartRoom({ room, floorIdx });
      setMode("end");
      setRoutePath([]);
      setRouteDist(null);
    } else if (mode === "end") {
      setEndRoom({ room, floorIdx });
      setMode(null);
      if (startRoom) {
        doRoute(startRoom.room, startRoom.floorIdx, room, floorIdx);
      }
    } else {
      Alert.alert(room.label, `Floor ${floor.number} · Status: ${room.status?.toUpperCase() || 'OPEN'}`, [
        {
          text: "📍 Set as Start",
          onPress: () => {
            setStartRoom({ room, floorIdx });
            setMode("end");
            setRoutePath([]);
            setRouteDist(null);
          }
        },
        {
          text: "🏁 Set as End",
          onPress: () => {
            if (!startRoom) { Alert.alert("Select Start First", "Please pick a starting point first."); return; }
            setEndRoom({ room, floorIdx });
            setMode(null);
            doRoute(startRoom.room, startRoom.floorIdx, room, floorIdx);
          }
        },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const openSearch = (target: "start" | "end") => {
    setSearchTarget(target);
    setSearchQuery("");
    setSearchModalOpen(true);
  };

  const selectRoomFromSearch = (room: Room, fIdx: number) => {
    setSearchModalOpen(false);
    if (searchTarget === "start") {
      setStartRoom({ room, floorIdx: fIdx });
      setFloorIdx(fIdx);
      if (endRoom) {
        doRoute(room, fIdx, endRoom.room, endRoom.floorIdx);
      } else {
        setMode("end");
      }
    } else {
      setEndRoom({ room, floorIdx: fIdx });
      setFloorIdx(fIdx);
      if (startRoom) {
        doRoute(startRoom.room, startRoom.floorIdx, room, fIdx);
      }
    }
  };

  const clearRoute = () => {
    setStartRoom(null);
    setEndRoom(null);
    setRoutePath([]);
    setRouteDist(null);
    setMode(null);
    setShowSteps(false);
  };

  const floorPathNodes = routePath.filter(n => n.floor === floor.number);
  const routeFloors    = [...new Set(routePath.map(n => n.floor))];

  const allRoomsWithFloor = FLOORS.flatMap((fl, idx) => fl.rooms.map(r => ({ room: r, floorLabel: fl.label, floorIdx: idx })));
  const filteredRooms = allRoomsWithFloor.filter(r => r.room.label.toLowerCase().includes(searchQuery.toLowerCase()) || r.room.id.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#070c18" />

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>🏛️ IndoorNav</Text>
          <Text style={s.sub}>Presidency University · {floor.label}</Text>
        </View>
        <TouchableOpacity style={s.searchChip} onPress={() => openSearch(startRoom ? "end" : "start")}>
          <Text style={s.searchChipText}>🔍 Search Room</Text>
        </TouchableOpacity>
      </View>

      {/* FLOOR TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabsScroll} contentContainerStyle={s.tabsContent}>
        {FLOORS.map((f, idx) => (
          <TouchableOpacity key={f.id}
            style={[s.floorTab, floorIdx === idx && s.floorTabActive]}
            onPress={() => setFloorIdx(idx)}>
            <Text style={[s.floorTabText, floorIdx === idx && s.floorTabTextActive]}>{f.label}</Text>
            {routeFloors.includes(f.number) && <View style={s.floorDot} />}
          </TouchableOpacity>
        ))}
        {pan.x !== 0 || pan.y !== 0 ? (
          <TouchableOpacity style={s.resetPanBtn} onPress={resetPan}>
            <Text style={s.resetPanText}>🎯 Recenter Map</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* MAP CANVAS */}
      <View style={s.mapWrap} {...panResponder.panHandlers}>
        <Svg width={SCREEN_W} height={MAP_H} viewBox={`${-pan.x} ${-pan.y} 720 560`}>
          <Defs>
            <LinearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0"   stopColor="#00f5c4" stopOpacity="1" />
              <Stop offset="0.5" stopColor="#007fff" stopOpacity="1" />
              <Stop offset="1"   stopColor="#f04a6a" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Corridors */}
          <Rect x={30}  y={150} width={660} height={50} fill="#0d192d" rx={6} />
          <Rect x={30}  y={310} width={660} height={50} fill="#0d192d" rx={6} />
          <Rect x={340} y={150} width={40}  height={180} fill="#0d192d" rx={6} />

          {/* Rooms */}
          {floor.rooms.map(room => {
            const isStart = startRoom?.room.id === room.id && startRoom.floorIdx === floorIdx;
            const isEnd   = endRoom?.room.id === room.id && endRoom.floorIdx === floorIdx;
            const onRoute = floorPathNodes.some(n => n.roomId === room.id);
            return (
              <G key={room.id} onPress={() => handleRoomTap(room)}>
                <Rect x={room.x} y={room.y} width={room.w} height={room.h}
                  fill={isStart ? "#092e1e" : isEnd ? "#330e16" : "#0d1b2e"}
                  stroke={isStart ? "#00f5c4" : isEnd ? "#f04a6a" : onRoute ? "#007fff" : "#1a2c4a"}
                  strokeWidth={isStart || isEnd ? 3 : onRoute ? 2 : 1} rx={8} />
                <SvgText x={room.x + room.w / 2} y={room.y + room.h / 2 + 5}
                  textAnchor="middle" fontSize={11}
                  fill={isStart || isEnd ? "#ffffff" : "#7b9bb5"}
                  fontWeight={isStart || isEnd ? "700" : "500"}>
                  {room.label}
                </SvgText>
                {isStart && <SvgText x={room.x + room.w / 2} y={room.y + 14}
                  textAnchor="middle" fontSize={9} fill="#00f5c4" fontWeight="800">START</SvgText>}
                {isEnd && <SvgText x={room.x + room.w / 2} y={room.y + 14}
                  textAnchor="middle" fontSize={9} fill="#f04a6a" fontWeight="800">DEST</SvgText>}
              </G>
            );
          })}

          {/* Edges */}
          {floor.edges.map((e, i) => {
            const a = floor.nodes.find(n => n.id === e.from);
            const b = floor.nodes.find(n => n.id === e.to);
            if (!a || !b) return null;
            return <Line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#13233a" strokeWidth={1.5} />;
          })}

          {/* Active Path */}
          {floorPathNodes.length > 1 && (
            <>
              <Path d={pathD(floorPathNodes)} stroke="url(#rg)"
                strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
                fill="none" strokeDasharray="12 6" />
              {floorPathNodes.map((n, i) => (
                <Circle key={n.id} cx={n.x} cy={n.y}
                  r={i === 0 || i === floorPathNodes.length - 1 ? 10 : 5}
                  fill={i === 0 ? "#00f5c4" : i === floorPathNodes.length - 1 ? "#f04a6a" : "#007fff"}
                  stroke="#070c18" strokeWidth={2} />
              ))}
            </>
          )}

          {/* Nodes */}
          {floor.nodes.map(n => (
            <Circle key={n.id} cx={n.x} cy={n.y} r={3} fill="#1a2f4c" stroke="#070c18" strokeWidth={0.5} />
          ))}
        </Svg>
      </View>

      {/* BOTTOM CONTROLS & NAVIGATION PANEL */}
      <View style={s.panel}>
        {routeDist !== null && (
          <View style={s.routeBox}>
            <Text style={s.routeText}>📍 {startRoom?.room.label}  →  🏁 {endRoom?.room.label}</Text>
            <Text style={s.routeMeta}>Est. Distance: ~{routeDist}m  ·  Time: ~{Math.ceil(routeDist / 1.4 / 60)} min{routeFloors.length > 1 ? `  ·  Floors: ${routeFloors.join(" → ")}` : ""}</Text>
            {routeFloors.length > 1 && (
              <View style={s.floorPills}>
                {routeFloors.map(f => (
                  <TouchableOpacity key={f}
                    style={[s.floorPill, floorIdx + 1 === f && s.floorPillActive]}
                    onPress={() => setFloorIdx(f - 1)}>
                    <Text style={[s.floorPillText, floorIdx + 1 === f && s.floorPillTextActive]}>Floor {f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {mode && (
          <Text style={s.instruction}>
            {mode === "start" ? "👆 Tap a room on map or search to set START" : "👆 Tap a room on map to set DESTINATION"}
          </Text>
        )}

        <View style={s.buttonRow}>
          <TouchableOpacity style={[s.btn, s.btnPrimary, { flex: 2, marginRight: 8 }]}
            onPress={() => { clearRoute(); setMode("start"); }}>
            <Text style={s.btnText}>🧭 Get Directions</Text>
          </TouchableOpacity>
          {routePath.length > 0 && (
            <TouchableOpacity style={[s.btn, s.btnSecondary, { marginRight: 8 }]}
              onPress={() => setShowSteps(!showSteps)}>
              <Text style={s.btnText}>{showSteps ? "🗺 Map" : "📋 Steps"}</Text>
            </TouchableOpacity>
          )}
          {routePath.length > 0 && (
            <TouchableOpacity style={[s.btn, s.btnDanger]} onPress={clearRoute}>
              <Text style={s.btnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {showSteps && routePath.length > 0 && (
          <ScrollView style={s.stepsScroll} showsVerticalScrollIndicator={false}>
            {routePath.map((n, i) => {
              const fl   = FLOORS.find(f => f.number === n.floor);
              const room = fl?.rooms.find(r => r.id === n.roomId);
              return (
                <TouchableOpacity key={n.id} style={s.stepRow} onPress={() => setFloorIdx(n.floor - 1)}>
                  <View style={[s.stepDot, { backgroundColor: i === 0 ? "#00f5c4" : i === routePath.length - 1 ? "#f04a6a" : "#007fff" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.stepAction}>
                      {i === 0 ? "📍 Start at " + (startRoom?.room.label || "Start") : i === routePath.length - 1 ? "🏁 Arrive at " + (endRoom?.room.label || "Destination") : "➡ Walk through corridor"}
                      {room ? ` (${room.label})` : ""}
                    </Text>
                    <Text style={s.stepSub}>Floor {n.floor}</Text>
                  </View>
                  <Text style={s.stepBadge}>F{n.floor}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* SEARCH MODAL */}
      <Modal visible={searchModalOpen} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select {searchTarget === "start" ? "Starting Room" : "Destination Room"}</Text>
              <TouchableOpacity onPress={() => setSearchModalOpen(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={s.searchInput}
              placeholder="Search by room name or ID..."
              placeholderTextColor="#3a5a7a"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 300 }}>
              {filteredRooms.map((item, idx) => (
                <TouchableOpacity key={idx} style={s.searchItem} onPress={() => selectRoomFromSearch(item.room, item.floorIdx)}>
                  <View>
                    <Text style={s.searchItemLabel}>{item.room.label}</Text>
                    <Text style={s.searchItemSub}>{item.floorLabel} · {item.room.type || 'Room'}</Text>
                  </View>
                  <Text style={s.searchItemBadge}>{item.room.status ? item.room.status.toUpperCase() : 'OPEN'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: "#070c18" },
  header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#0e1c33" },
  title:         { color: "#e0f0ff", fontSize: 20, fontWeight: "800" },
  sub:           { color: "#486b8f", fontSize: 12, marginTop: 2 },
  searchChip:    { backgroundColor: "#0e203c", borderWidth: 1, borderColor: "#007fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  searchChipText:{ color: "#00f5c4", fontSize: 12, fontWeight: "700" },
  tabsScroll:    { maxHeight: 46, borderBottomWidth: 1, borderBottomColor: "#0e1c33" },
  tabsContent:   { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 7, alignItems: "center" },
  floorTab:      { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: "#0d182b", borderWidth: 1, borderColor: "#182c47", marginRight: 8, position: "relative" },
  floorTabActive:{ backgroundColor: "#0d264a", borderColor: "#00f5c4" },
  floorTabText:  { color: "#486b8f", fontSize: 13, fontWeight: "600" },
  floorTabTextActive: { color: "#00f5c4", fontWeight: "700" },
  floorDot:      { position: "absolute", top: 4, right: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: "#007fff" },
  resetPanBtn:   { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#1c2c44", borderRadius: 8, marginLeft: 8 },
  resetPanText:  { color: "#f0c44a", fontSize: 11, fontWeight: "600" },
  mapWrap:       { width: SCREEN_W, height: MAP_H, backgroundColor: "#070c18", overflow: "hidden" },
  panel:         { flex: 1, paddingHorizontal: 16, paddingTop: 10, backgroundColor: "#070c18" },
  routeBox:      { backgroundColor: "#0d1c33", borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: "#00f5c4", marginBottom: 8 },
  routeText:     { color: "#e0f0ff", fontSize: 14, fontWeight: "700" },
  routeMeta:     { color: "#00f5c4", fontSize: 12, marginTop: 4, fontWeight: "500" },
  floorPills:    { flexDirection: "row", marginTop: 8 },
  floorPill:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: "#0e1829", borderWidth: 1, borderColor: "#1a2c47", marginRight: 6 },
  floorPillActive:    { backgroundColor: "#0d264a", borderColor: "#007fff" },
  floorPillText:      { color: "#486b8f", fontSize: 11, fontWeight: "700" },
  floorPillTextActive:{ color: "#00f5c4" },
  instruction:   { color: "#f0c44a", fontSize: 13, textAlign: "center", fontWeight: "600", paddingVertical: 6 },
  buttonRow:     { flexDirection: "row", marginTop: 6, paddingBottom: 8 },
  btn:           { paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnPrimary:    { backgroundColor: "#0d284f", borderWidth: 1, borderColor: "#007fff" },
  btnSecondary:  { paddingHorizontal: 16, backgroundColor: "#0d1a2d", borderWidth: 1, borderColor: "#182c47" },
  btnDanger:     { paddingHorizontal: 16, backgroundColor: "#2d0d12", borderWidth: 1, borderColor: "#5e1823" },
  btnText:       { color: "#e0f0ff", fontSize: 13, fontWeight: "700" },
  stepsScroll:   { maxHeight: 160 },
  stepRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#0e1c33" },
  stepDot:       { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  stepAction:    { color: "#c8deee", fontSize: 13, fontWeight: "600" },
  stepSub:       { color: "#486b8f", fontSize: 11, marginTop: 1 },
  stepBadge:     { color: "#486b8f", fontSize: 11, fontWeight: "700", backgroundColor: "#0d1a2d", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalContent:  { backgroundColor: "#0c1626", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, borderWidth: 1, borderColor: "#182c47" },
  modalHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle:    { color: "#e0f0ff", fontSize: 16, fontWeight: "700" },
  modalClose:    { color: "#f04a6a", fontSize: 18, fontWeight: "700" },
  searchInput:   { backgroundColor: "#070d17", borderWidth: 1, borderColor: "#182c47", borderRadius: 10, padding: 10, color: "#e0f0ff", fontSize: 14, marginBottom: 12 },
  searchItem:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#0e1c33" },
  searchItemLabel:{ color: "#e0f0ff", fontSize: 14, fontWeight: "600" },
  searchItemSub: { color: "#486b8f", fontSize: 12, marginTop: 2 },
  searchItemBadge:{ color: "#00f5c4", fontSize: 10, fontWeight: "700", backgroundColor: "#09241b", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});