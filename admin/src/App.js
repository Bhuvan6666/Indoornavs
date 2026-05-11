import React, { useState, useRef, useEffect } from "react";

const SERVER = "http://127.0.0.1:3001";

const ROOM_TYPES = {
  classroom: { color:"#0d1e38", border:"#1a3a6a", label:"Classroom" },
  lab:       { color:"#0a1e14", border:"#1a4a2a", label:"Lab"       },
  elevator:  { color:"#1a0838", border:"#3a1a6a", label:"Elevator"  },
  staircase: { color:"#1e1408", border:"#4a2a10", label:"Staircase" },
  restroom:  { color:"#08181e", border:"#1a3a4a", label:"Restroom"  },
  entry:     { color:"#1e0808", border:"#4a1a1a", label:"Entry"     },
  office:    { color:"#181408", border:"#3a3010", label:"Office"    },
  canteen:   { color:"#081808", border:"#1a4a1a", label:"Canteen"   },
  other:     { color:"#0d1525", border:"#1a2a4a", label:"Other"     },
};
const NODE_TYPES  = ["room","junction","elevator","staircase","stair","entry","poi"];
const STATUS_OPTS = ["open","occupied","maintenance"];

let _uid = 1;
const uid = (p) => `${p}_${Date.now()}_${_uid++}`;

export default function App() {
  const [tab, setTab]             = useState("map");
  const [floors, setFloors]       = useState([{ id:"F1", label:"Floor 1", number:1, rooms:[], nodes:[], edges:[] }]);
  const [activeFloor, setActiveFloor] = useState(0);
  const [tool, setTool]           = useState("select");
  const [selectedItem, setSelectedItem] = useState(null);
  const [edgeStart, setEdgeStart] = useState(null);
  const [editingRoom, setEditingRoom]   = useState(null);
  const [editingNode, setEditingNode]   = useState(null);
  const [buildingName, setBuildingName] = useState("My Building");
  const [status, setStatus]       = useState(null);
  const [savedBuildings, setSavedBuildings] = useState([]);
  const [expandedBuilding, setExpandedBuilding] = useState(null);
  const [buildingFloors, setBuildingFloors]     = useState({});
  const [qrModalNode, setQrModalNode] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [bgImage, setBgImage]     = useState(null); // floor plan background
  const [exportingPDF, setExportingPDF] = useState(false);
  const svgRef  = useRef(null);
  const fileRef = useRef(null);

  const floor = floors[activeFloor] || floors[0];

  const showStatus = (msg, type="info") => {
    setStatus({ msg, type });
    setTimeout(() => setStatus(null), 3500);
  };
  const updateFloor = (idx, fn) => setFloors(prev => prev.map((f,i) => i===idx ? fn(f) : f));

  const addFloor = () => {
    const n = floors.length + 1;
    setFloors(prev => [...prev, { id:uid("F"), label:`Floor ${n}`, number:n, rooms:[], nodes:[], edges:[] }]);
    setActiveFloor(floors.length);
  };
  const removeFloor = (idx) => {
    if (floors.length===1) return showStatus("Need at least one floor","error");
    setFloors(prev => prev.filter((_,i) => i!==idx));
    setActiveFloor(prev => Math.max(0, prev>=idx ? prev-1 : prev));
  };

  const getSVGCoords = (e) => {
    const svg = svgRef.current;
    if (!svg) return {x:0,y:0};
    const rect = svg.getBoundingClientRect();
    return { x:Math.round(((e.clientX-rect.left)/rect.width)*800), y:Math.round(((e.clientY-rect.top)/rect.height)*600) };
  };

  const handleSVGClick = (e) => {
    const tag  = e.target.tagName;
    const fill = e.target.getAttribute && e.target.getAttribute("fill");
    const isBg = e.target===svgRef.current || tag==="svg" ||
      (tag==="rect" && (fill==="url(#grid100)"||fill==="url(#grid20)"||fill==="url(#bgimg)")) ||
      (tag==="image") || (tag==="path" && e.target.closest && e.target.closest("pattern"));
    if (!isBg) return;
    const {x,y} = getSVGCoords(e);
    if (tool==="addRoom") {
      const r = { id:uid("RM"), label:"New Room", x:x-60, y:y-40, w:120, h:80, type:"classroom", status:"open" };
      updateFloor(activeFloor, f => ({...f, rooms:[...f.rooms,r]}));
      setEditingRoom({...r}); setSelectedItem({kind:"room",id:r.id});
    } else if (tool==="addNode") {
      const n = { id:uid("N"), x, y, type:"junction", floor:floor.number, label:"" };
      updateFloor(activeFloor, f => ({...f, nodes:[...f.nodes,n]}));
      setSelectedItem({kind:"node",id:n.id}); setEditingNode({...n});
    }
  };

  const handleNodeClick = (e, node) => {
    e.stopPropagation();
    if (tool==="addEdge") {
      if (!edgeStart) { setEdgeStart(node.id); showStatus(`Start: ${node.id} — click destination`,"info"); }
      else if (edgeStart!==node.id) {
        const from = floor.nodes.find(n => n.id===edgeStart);
        if (from) {
          const dist = Math.round(Math.hypot(node.x-from.x, node.y-from.y));
          const exists = floor.edges.find(ed => (ed.from===edgeStart&&ed.to===node.id)||(ed.from===node.id&&ed.to===edgeStart));
          if (!exists) { updateFloor(activeFloor, f => ({...f, edges:[...f.edges,{from:edgeStart,to:node.id,weight:dist}]})); showStatus(`Edge added (${dist}px)`,"success"); }
          else showStatus("Edge already exists","error");
        }
        setEdgeStart(null);
      }
      return;
    }
    if (tool==="delete") {
      updateFloor(activeFloor, f => ({...f, nodes:f.nodes.filter(n=>n.id!==node.id), edges:f.edges.filter(ed=>ed.from!==node.id&&ed.to!==node.id)}));
      setSelectedItem(null); return;
    }
    setSelectedItem({kind:"node",id:node.id}); setEditingNode({...node}); setEditingRoom(null);
  };

  const handleRoomClick = (e, room) => {
    e.stopPropagation();
    if (tool==="delete") { updateFloor(activeFloor, f => ({...f, rooms:f.rooms.filter(r=>r.id!==room.id)})); setSelectedItem(null); return; }
    if (tool==="select") { setSelectedItem({kind:"room",id:room.id}); setEditingRoom({...room}); setEditingNode(null); }
  };

  const handleEdgeClick = (e, edge) => {
    e.stopPropagation();
    if (tool==="delete") updateFloor(activeFloor, f => ({...f, edges:f.edges.filter(ed=>!(ed.from===edge.from&&ed.to===edge.to))}));
  };

  const handleNodeMouseDown = (e, node) => {
    if (tool!=="select") return;
    e.preventDefault(); e.stopPropagation();
    const start = getSVGCoords(e); const ox=node.x, oy=node.y;
    const onMove = (me) => { const {x,y}=getSVGCoords(me); updateFloor(activeFloor, f => ({...f, nodes:f.nodes.map(n=>n.id===node.id?{...n,x:ox+x-start.x,y:oy+y-start.y}:n)})); };
    const onUp = () => { window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); };
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
  };

  const handleRoomMouseDown = (e, room) => {
    if (tool!=="select") return;
    e.preventDefault(); e.stopPropagation();
    const start = getSVGCoords(e); const ox=room.x, oy=room.y;
    const onMove = (me) => { const {x,y}=getSVGCoords(me); updateFloor(activeFloor, f => ({...f, rooms:f.rooms.map(r=>r.id===room.id?{...r,x:ox+x-start.x,y:oy+y-start.y}:r)})); };
    const onUp = () => { window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); };
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
  };

  const saveRoomEdit = () => {
    if (!editingRoom) return;
    updateFloor(activeFloor, f => ({...f, rooms:f.rooms.map(r=>r.id===editingRoom.id?editingRoom:r)}));
    setEditingRoom(null); showStatus("Room saved","success");
  };
  const saveNodeEdit = () => {
    if (!editingNode) return;
    updateFloor(activeFloor, f => ({...f, nodes:f.nodes.map(n=>n.id===editingNode.id?editingNode:n)}));
    setEditingNode(null); showStatus("Node saved","success");
  };

  // ── BACKGROUND IMAGE ────────────────────────────────────────────────────────
  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgImage(ev.target.result);
    reader.readAsDataURL(file);
    showStatus("Floor plan image loaded","success");
  };

  // ── PDF EXPORT ──────────────────────────────────────────────────────────────
  const exportPDF = () => {
    setExportingPDF(true);
    const svg = svgRef.current;
    if (!svg) return;
    // Serialize SVG to string
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type:"image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    // Create canvas to rasterize
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800; canvas.height = 600;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#070c18";
      ctx.fillRect(0,0,800,600);
      ctx.drawImage(img,0,0,800,600);
      // Add title
      ctx.fillStyle = "#e0f0ff";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`${buildingName} — ${floor.label}`, 20, 30);
      ctx.font = "12px monospace";
      ctx.fillStyle = "#3a5a7a";
      ctx.fillText(`Rooms: ${floor.rooms.length}  Nodes: ${floor.nodes.length}  Edges: ${floor.edges.length}`, 20, 52);
      ctx.fillText(`Generated by IndoorNav Admin — ${new Date().toLocaleDateString()}`, 20, 580);
      // Download as PNG (high quality)
      const a = document.createElement("a");
      a.download = `${buildingName}_${floor.label}.png`.replace(/\s+/g,"_");
      a.href = canvas.toDataURL("image/png",1.0);
      a.click();
      URL.revokeObjectURL(url);
      setExportingPDF(false);
      showStatus("Floor plan exported as PNG","success");
    };
    img.onerror = () => {
      // Fallback: just download SVG
      const a = document.createElement("a");
      a.download = `${buildingName}_${floor.label}.svg`.replace(/\s+/g,"_");
      a.href = url; a.click();
      setExportingPDF(false);
      showStatus("Exported as SVG","success");
    };
    img.src = url;
  };

  // ── SAVE / LOAD ─────────────────────────────────────────────────────────────
  const saveToServer = async () => {
    const allRooms = floors.flatMap(f => f.rooms.map(r => ({...r, floor:f.id})));
    const allNodes = floors.flatMap(f => f.nodes);
    const allEdges = floors.flatMap(f => f.edges);
    try {
      const r = await fetch(`${SERVER}/api/upload-map`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ buildingName, floors:floors.map(f=>f.id), rooms:allRooms, nodes:allNodes, edges:allEdges }) });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      showStatus(`Saved! Building ID: ${j.buildingId}`,"success");
      loadBuildings();
    } catch(e) { showStatus(`Save failed: ${e.message}`,"error"); }
  };

  const loadBuildings = async () => {
    try {
      const r = await fetch(`${SERVER}/api/buildings`);
      setSavedBuildings(await r.json());
    } catch { showStatus("Cannot reach server","error"); }
  };

  const loadBuildingFloors = async (buildingId) => {
    try {
      const r = await fetch(`${SERVER}/api/buildings/${buildingId}/floors`);
      const data = await r.json();
      setBuildingFloors(prev => ({...prev, [buildingId]: data}));
      setExpandedBuilding(expandedBuilding===buildingId ? null : buildingId);
    } catch { showStatus("Failed to load floors","error"); }
  };

  const loadHeatmap = async (buildingId) => {
    try {
      const r = await fetch(`${SERVER}/api/heatmap/${buildingId}`);
      const data = await r.json();
      setHeatmapData(data);
      showStatus("Heatmap loaded","success");
    } catch { showStatus("Heatmap unavailable","error"); }
  };

  const updateRoomStatus = async (floorId, roomId, newStatus) => {
    try {
      const r = await fetch(`${SERVER}/api/rooms/status`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ floorId, roomId, status: newStatus }) });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      showStatus(`Room status → ${newStatus}`,"success");
      // Update local state too
      updateFloor(activeFloor, f => ({...f, rooms:f.rooms.map(r=>r.id===roomId?{...r,status:newStatus}:r)}));
      if (editingRoom?.id===roomId) setEditingRoom(prev => ({...prev, status:newStatus}));
    } catch(e) { showStatus(`Status update failed: ${e.message}`,"error"); }
  };

  const exportJSON = () => {
    const data = { buildingName, exportedAt:new Date().toISOString(), floors:floors.map(f=>({...f})) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download = `${buildingName.replace(/\s+/g,"_")}.indoorgml.json`; a.click();
    showStatus("IndoorGML JSON exported","success");
  };

  useEffect(() => { loadBuildings(); }, []);

  const getQRValue = (nodeId) => `QR_${nodeId}`;

  const TABS = [
    {id:"map",    icon:"🗺",  label:"Map Editor"},
    {id:"nodes",  icon:"⚫", label:"Node Manager"},
    {id:"status", icon:"🟢", label:"Room Status"},
    {id:"qr",     icon:"📷", label:"QR Codes"},
    {id:"heatmap",icon:"🔥", label:"Heatmap"},
    {id:"export", icon:"⬇",  label:"Export"},
    {id:"saved",  icon:"☁",  label:"Saved Maps"},
  ];
  const TOOLS = [
    {id:"select",  icon:"↖", label:"Select/Move"},
    {id:"addRoom", icon:"⬜",label:"Add Room"},
    {id:"addNode", icon:"⚫",label:"Add Node"},
    {id:"addEdge", icon:"—", label:"Add Edge"},
    {id:"delete",  icon:"🗑",label:"Delete"},
  ];

  return (
    <div style={S.root}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <span style={{fontSize:24}}>🗺</span>
          <div><div style={S.logoTitle}>IndoorNav</div><div style={S.logoSub}>Admin Console</div></div>
        </div>
        <nav style={S.nav}>
          {TABS.map(t => (
            <button key={t.id} style={{...S.navBtn,...(tab===t.id?S.navBtnActive:{})}} onClick={()=>setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div style={{padding:"0 12px 12px"}}>
          <div style={S.fieldLabel}>Building Name</div>
          <input style={S.input} value={buildingName} onChange={e=>setBuildingName(e.target.value)} />
        </div>
        <div style={{padding:"0 12px"}}>
          <div style={S.fieldLabel}>Floors ({floors.length})</div>
          {floors.map((f,idx) => (
            <div key={f.id} style={{display:"flex",gap:4,marginBottom:4}}>
              <button style={{...S.floorBtn,...(activeFloor===idx?S.floorBtnActive:{})}} onClick={()=>setActiveFloor(idx)}>
                {f.label} <span style={{color:"#3a5a7a",fontSize:10}}>{f.rooms.length}r {f.nodes.length}n</span>
              </button>
              <button style={S.floorRemove} onClick={()=>removeFloor(idx)}>×</button>
            </div>
          ))}
          <button style={S.addFloorBtn} onClick={addFloor}>+ Add Floor</button>
        </div>

        {/* Stats */}
        <div style={S.sideStats}>
          <div style={S.statRow}><span>Rooms</span><span style={{color:"#c0d8f0"}}>{floors.reduce((s,f)=>s+f.rooms.length,0)}</span></div>
          <div style={S.statRow}><span>Nodes</span><span style={{color:"#c0d8f0"}}>{floors.reduce((s,f)=>s+f.nodes.length,0)}</span></div>
          <div style={S.statRow}><span>Edges</span><span style={{color:"#c0d8f0"}}>{floors.reduce((s,f)=>s+f.edges.length,0)}</span></div>
        </div>

        <div style={{marginTop:"auto",padding:12,display:"flex",flexDirection:"column",gap:8}}>
          <button style={{...S.actionBtn,background:"#0d2040",borderColor:"#007fff"}} onClick={saveToServer}>☁ Save to DB</button>
          <button style={{...S.actionBtn,background:"#0a2a10",borderColor:"#1a7a2a"}} onClick={exportJSON}>⬇ Export JSON</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        {status && (
          <div style={{...S.toast, background:status.type==="error"?"#1a0808":status.type==="success"?"#081a08":"#081018",
            borderColor:status.type==="error"?"#f04a6a":status.type==="success"?"#00f5c4":"#007fff"}}>
            {status.msg}
          </div>
        )}

        {/* ── MAP EDITOR ── */}
        {tab==="map" && (
          <div style={S.editorLayout}>
            <div style={S.toolbar}>
              {TOOLS.map(t => (
                <button key={t.id} style={{...S.toolBtn,...(tool===t.id?S.toolBtnActive:{})}}
                  onClick={()=>{setTool(t.id);setEdgeStart(null);setSelectedItem(null);}} title={t.label}>
                  {t.icon} {t.label}
                </button>
              ))}
              <div style={{width:1,background:"#1a2a4a",margin:"0 6px"}} />
              {/* BG Image upload */}
              <button style={S.toolBtn} onClick={()=>fileRef.current?.click()} title="Upload floor plan image">
                🖼 BG Image
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload} />
              {bgImage && <button style={{...S.toolBtn,color:"#f04a6a"}} onClick={()=>setBgImage(null)}>✕ BG</button>}
              <button style={{...S.toolBtn,marginLeft:"auto"}} onClick={exportPDF} disabled={exportingPDF}>
                {exportingPDF?"⏳ Exporting...":"📄 Export PNG"}
              </button>
              <span style={{color:"#3a5a7a",fontSize:11,marginLeft:8}}>{floor.label} · {floor.rooms.length}r {floor.nodes.length}n {floor.edges.length}e</span>
            </div>
            <div style={S.canvasWrap}>
              <svg ref={svgRef} viewBox="0 0 800 600" style={S.svg} onClick={handleSVGClick}
                cursor={tool==="addRoom"||tool==="addNode"?"crosshair":tool==="delete"?"not-allowed":"default"}>
                <defs>
                  <pattern id="grid100" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#0d1a2e" strokeWidth="1"/>
                  </pattern>
                  <pattern id="grid20" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#080f1a" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="800" height="600" fill="url(#grid20)" />
                <rect width="800" height="600" fill="url(#grid100)" fillOpacity="0.5" />

                {/* Background floor plan image */}
                {bgImage && <image href={bgImage} x="0" y="0" width="800" height="600" opacity="0.25" preserveAspectRatio="xMidYMid meet" />}

                {/* Edges */}
                {floor.edges.map((edge,i) => {
                  const a=floor.nodes.find(n=>n.id===edge.from), b=floor.nodes.find(n=>n.id===edge.to);
                  if (!a||!b) return null;
                  return (
                    <g key={i} onClick={ev=>handleEdgeClick(ev,edge)} style={{cursor:tool==="delete"?"pointer":"default"}}>
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={tool==="delete"?"#f04a6a44":"#1a3a5a"} strokeWidth={tool==="delete"?5:2} />
                      <text x={(a.x+b.x)/2} y={(a.y+b.y)/2-5} textAnchor="middle" fontSize="9" fill="#2a4a6a">{edge.weight}px</text>
                    </g>
                  );
                })}
                {edgeStart && (()=>{const n=floor.nodes.find(nd=>nd.id===edgeStart);return n?<circle cx={n.x} cy={n.y} r={16} fill="none" stroke="#f0c44a" strokeWidth="2" strokeDasharray="4 2"/>:null;})()}

                {/* Rooms */}
                {floor.rooms.map(room => {
                  const cfg = ROOM_TYPES[room.type]??ROOM_TYPES.other;
                  const isSel = selectedItem?.kind==="room"&&selectedItem.id===room.id;
                  const sc = room.status==="occupied"?"#f04a6a":room.status==="maintenance"?"#f0c44a":"transparent";
                  return (
                    <g key={room.id} onClick={ev=>handleRoomClick(ev,room)} onMouseDown={ev=>handleRoomMouseDown(ev,room)}
                      style={{cursor:tool==="select"?"move":tool==="delete"?"pointer":"default"}}>
                      <rect x={room.x} y={room.y} width={room.w} height={room.h}
                        fill={cfg.color} stroke={isSel?"#00f5c4":cfg.border} strokeWidth={isSel?2.5:1} rx={5} />
                      {/* Status indicator */}
                      <circle cx={room.x+room.w-7} cy={room.y+7} r={5}
                        fill={room.status==="open"?"#00f5c4":room.status==="occupied"?"#f04a6a":"#f0c44a"} />
                      <text x={room.x+room.w/2} y={room.y+room.h/2+4} textAnchor="middle" fontSize="11" fill={isSel?"#fff":"#7a9ab0"}>{room.label}</text>
                      <text x={room.x+4} y={room.y+12} fontSize="8" fill="#3a5a6a">{room.type}</text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {floor.nodes.map(node => {
                  const isSel = selectedItem?.kind==="node"&&selectedItem.id===node.id;
                  const isES  = edgeStart===node.id;
                  return (
                    <g key={node.id} onClick={ev=>handleNodeClick(ev,node)} onMouseDown={ev=>handleNodeMouseDown(ev,node)}
                      style={{cursor:tool==="select"?"move":"pointer"}}>
                      <circle cx={node.x} cy={node.y} r={isSel?11:7}
                        fill={isES?"#f0c44a":node.type==="elevator"?"#6a2aaa":["stair","staircase"].includes(node.type)?"#aa4a00":node.type==="entry"?"#aa2a2a":node.type==="room"?"#1a3a2a":"#0d2040"}
                        stroke={isSel?"#00f5c4":"#0a1a2e"} strokeWidth={isSel?2:1} />
                      <text x={node.x} y={node.y+20} textAnchor="middle" fontSize="8" fill="#3a5a7a">{node.id.split("_").pop()}</text>
                    </g>
                  );
                })}
              </svg>

              {/* Room editor panel */}
              {editingRoom && (
                <div style={S.inlineEdit}>
                  <div style={S.inlineEditTitle}>✏️ Edit Room</div>
                  <div style={S.fieldLabel}>Label</div>
                  <input style={S.input} value={editingRoom.label} onChange={e=>setEditingRoom(r=>({...r,label:e.target.value}))} />
                  <div style={S.fieldLabel}>Type</div>
                  <select style={S.select} value={editingRoom.type??""} onChange={e=>setEditingRoom(r=>({...r,type:e.target.value}))}>
                    {Object.entries(ROOM_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <div style={S.fieldLabel}>Status</div>
                  <select style={S.select} value={editingRoom.status??"open"} onChange={e=>setEditingRoom(r=>({...r,status:e.target.value}))}>
                    {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    <div><div style={S.fieldLabel}>W</div><input style={{...S.input,width:55}} type="number" value={editingRoom.w} onChange={e=>setEditingRoom(r=>({...r,w:+e.target.value}))} /></div>
                    <div><div style={S.fieldLabel}>H</div><input style={{...S.input,width:55}} type="number" value={editingRoom.h} onChange={e=>setEditingRoom(r=>({...r,h:+e.target.value}))} /></div>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:10}}>
                    <button style={{...S.actionBtn,flex:1,background:"#0a2a10",borderColor:"#1a7a2a"}} onClick={saveRoomEdit}>Save</button>
                    <button style={{...S.actionBtn,flex:1}} onClick={()=>setEditingRoom(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {editingNode && (
                <div style={{...S.inlineEdit,top:editingRoom?280:10}}>
                  <div style={S.inlineEditTitle}>⚫ Edit Node</div>
                  <div style={S.fieldLabel}>ID</div>
                  <input style={S.input} value={editingNode.id} readOnly />
                  <div style={S.fieldLabel}>Type</div>
                  <select style={S.select} value={editingNode.type} onChange={e=>setEditingNode(n=>({...n,type:e.target.value}))}>
                    {NODE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={S.fieldLabel}>Label (for cross-floor matching)</div>
                  <input style={S.input} value={editingNode.label??""} onChange={e=>setEditingNode(n=>({...n,label:e.target.value}))} placeholder="e.g. Elevator A" />
                  <div style={S.fieldLabel}>Linked Room ID</div>
                  <input style={S.input} value={editingNode.roomId??""} onChange={e=>setEditingNode(n=>({...n,roomId:e.target.value}))} placeholder="e.g. RM_123" />
                  <div style={{display:"flex",gap:6,marginTop:10}}>
                    <button style={{...S.actionBtn,flex:1,background:"#0a2a10",borderColor:"#1a7a2a"}} onClick={saveNodeEdit}>Save</button>
                    <button style={{...S.actionBtn,flex:1}} onClick={()=>setEditingNode(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NODE MANAGER ── */}
        {tab==="nodes" && (
          <div style={S.scrollSection}>
            <div style={S.tabTitle}>Node Manager — {floor.label}</div>
            <table style={S.table}>
              <thead><tr>{["Node ID","Type","Label","Room","X","Y","Edges","QR"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {floor.nodes.map((node,i) => {
                  const ec = floor.edges.filter(e=>e.from===node.id||e.to===node.id).length;
                  return (
                    <tr key={node.id} style={{background:i%2===0?"transparent":"#07101e"}}>
                      <td style={S.td}><code style={S.code}>{node.id}</code></td>
                      <td style={S.td}><span style={S.typeBadge}>{node.type}</span></td>
                      <td style={S.td}>{node.label||"—"}</td>
                      <td style={S.td}>{node.roomId||"—"}</td>
                      <td style={S.td}>{node.x}</td>
                      <td style={S.td}>{node.y}</td>
                      <td style={S.td}>{ec}</td>
                      <td style={S.td}><button style={S.miniBtn} onClick={()=>setQrModalNode(node)}>📷 QR</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ROOM STATUS ── */}
        {tab==="status" && (
          <div style={S.scrollSection}>
            <div style={S.tabTitle}>Room Status Manager</div>
            <div style={{color:"#3a5a7a",fontSize:12,marginBottom:16}}>
              Set each room as Open, Occupied, or Under Maintenance. Changes sync to mobile app in real time.
            </div>
            {/* Floor selector */}
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {floors.map((f,idx)=>(
                <button key={f.id} style={{...S.toolBtn,...(activeFloor===idx?S.toolBtnActive:{})}} onClick={()=>setActiveFloor(idx)}>{f.label}</button>
              ))}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
              {floor.rooms.map(room => (
                <div key={room.id} style={{...S.statusCard, borderColor:room.status==="open"?"#1a4a2a":room.status==="occupied"?"#4a1a2a":"#4a3a0a"}}>
                  <div>
                    <div style={{color:"#e0f0ff",fontWeight:700,fontSize:13}}>{room.label}</div>
                    <div style={{color:"#3a5a7a",fontSize:11,marginTop:2}}>{room.type} · {room.id}</div>
                  </div>
                  <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
                    {STATUS_OPTS.map(s=>(
                      <button key={s} onClick={()=>updateRoomStatus(floor.id, room.id, s)}
                        style={{...S.statusBtn, background:room.status===s?(s==="open"?"#0a3a1a":s==="occupied"?"#3a0a1a":"#3a2a08"):"transparent",
                          borderColor:s==="open"?"#1a7a2a":s==="occupied"?"#7a1a2a":"#7a5a0a",
                          color:room.status===s?"#e0f0ff":"#3a5a7a"}}>
                        {s==="open"?"🟢":s==="occupied"?"🔴":"🟡"} {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {floor.rooms.length===0 && <div style={{color:"#3a5a7a"}}>No rooms on this floor yet. Add them in Map Editor.</div>}
            </div>
          </div>
        )}

        {/* ── QR CODES ── */}
        {tab==="qr" && (
          <div style={S.scrollSection}>
            <div style={S.tabTitle}>QR Code Generator</div>
            <div style={{color:"#3a5a7a",fontSize:12,marginBottom:16}}>Print and place at each room entrance. The mobile app scans to set user location.</div>
            <div style={S.qrGrid}>
              {floors.flatMap(f => f.nodes).map(node => {
                const room = floors.flatMap(f=>f.rooms).find(r=>r.id===node.roomId);
                const qrVal = getQRValue(node.id);
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrVal)}`;
                return (
                  <div key={node.id} style={S.qrCard}>
                    <img src={qrUrl} alt={qrVal} style={{width:120,height:120,borderRadius:8}} />
                    <div style={S.qrCardLabel}>{room?.label??node.id}</div>
                    <div style={S.qrCardSub}>Floor {node.floor} · {node.type}</div>
                    <code style={{...S.code,fontSize:9,marginTop:4,wordBreak:"break-all",textAlign:"center"}}>{qrVal}</code>
                    <a href={qrUrl} download={`${qrVal}.png`} style={S.qrDownload}>⬇ Download</a>
                  </div>
                );
              })}
              {floors.flatMap(f=>f.nodes).length===0 && <div style={{color:"#3a5a7a"}}>No nodes yet. Add them in Map Editor first.</div>}
            </div>
          </div>
        )}

        {/* ── HEATMAP ── */}
        {tab==="heatmap" && (
          <div style={S.scrollSection}>
            <div style={S.tabTitle}>Crowd Heatmap</div>
            <div style={{color:"#3a5a7a",fontSize:12,marginBottom:16}}>Shows which areas are scanned most. Based on QR scan tracking from the mobile app.</div>
            {savedBuildings.length>0 && !heatmapData && (
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                {savedBuildings.map(b=>(
                  <button key={b.id} style={S.toolBtn} onClick={()=>loadHeatmap(b.id)}>🔥 Load heatmap: {b.name}</button>
                ))}
              </div>
            )}
            {heatmapData && heatmapData.map(floorH => (
              <div key={floorH.floorId} style={{marginBottom:24}}>
                <div style={{color:"#e0f0ff",fontWeight:700,marginBottom:8}}>{floorH.floorName}</div>
                <svg viewBox="0 0 800 600" style={{width:"100%",maxWidth:700,background:"#070c18",borderRadius:8,border:"1px solid #0d1a2e"}}>
                  {floorH.nodes.map(node => {
                    const max = Math.max(...floorH.nodes.map(n=>n.scanCount),1);
                    const intensity = node.scanCount/max;
                    const r = 10+intensity*30;
                    const alpha = 0.15+intensity*0.7;
                    return (
                      <g key={node.id}>
                        <circle cx={node.x} cy={node.y} r={r}
                          fill={`rgba(${Math.round(255*intensity)},${Math.round(80*(1-intensity))},0,${alpha})`} />
                        <text x={node.x} y={node.y+4} textAnchor="middle" fontSize="9" fill="#fff" opacity="0.8">{node.scanCount}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ))}
            {!heatmapData && savedBuildings.length===0 && <div style={{color:"#3a5a7a"}}>Save a building first, then load its heatmap.</div>}
          </div>
        )}

        {/* ── EXPORT ── */}
        {tab==="export" && (
          <div style={S.scrollSection}>
            <div style={S.tabTitle}>Export</div>
            <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
              <button style={{...S.actionBtn,background:"#0a2a10",borderColor:"#1a7a2a"}} onClick={exportJSON}>⬇ Download IndoorGML JSON</button>
              <button style={{...S.actionBtn,background:"#0a1a30",borderColor:"#1a3a7a"}} onClick={exportPDF} disabled={exportingPDF}>
                {exportingPDF?"⏳...":"📄 Export Floor Plan PNG"}
              </button>
              <button style={{...S.actionBtn,background:"#0d2040",borderColor:"#007fff"}} onClick={saveToServer}>☁ Save to Supabase</button>
            </div>
            <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
              {[["Building",buildingName],["Floors",floors.length],["Rooms",floors.reduce((s,f)=>s+f.rooms.length,0)],["Nodes",floors.reduce((s,f)=>s+f.nodes.length,0)],["Edges",floors.reduce((s,f)=>s+f.edges.length,0)]].map(([k,v])=>(
                <div key={k} style={S.exportMetaItem}><span style={{color:"#3a5a7a",fontSize:11}}>{k}</span><span style={{color:"#e0f0ff",fontWeight:700,fontSize:16}}>{v}</span></div>
              ))}
            </div>
            <pre style={S.jsonPre}>{JSON.stringify({buildingName,floors:floors.map(f=>({...f}))},null,2)}</pre>
          </div>
        )}

        {/* ── SAVED MAPS ── */}
        {tab==="saved" && (
          <div style={S.scrollSection}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={S.tabTitle}>Saved Buildings</div>
              <button style={S.actionBtn} onClick={loadBuildings}>↺ Refresh</button>
            </div>
            {savedBuildings.length===0 && <div style={{color:"#3a5a7a",textAlign:"center",marginTop:40}}>No buildings saved yet.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {savedBuildings.map(b=>(
                <div key={b.id} style={S.savedCard}>
                  <div style={S.savedCardHeader}>
                    <div>
                      <div style={{color:"#e0f0ff",fontWeight:700}}>{b.name}</div>
                      <div style={{color:"#3a5a7a",fontSize:11,marginTop:2}}>{b.id} · {new Date(b.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button style={S.miniBtn} onClick={()=>loadBuildingFloors(b.id)}>
                        {expandedBuilding===b.id?"▲ Hide":"▼ Floors"}
                      </button>
                      <button style={S.miniBtn} onClick={()=>loadHeatmap(b.id)}>🔥 Heatmap</button>
                    </div>
                  </div>
                  {expandedBuilding===b.id && buildingFloors[b.id] && (
                    <div style={S.savedFloors}>
                      {buildingFloors[b.id].map(f=>(
                        <div key={f.id} style={S.floorRow}>
                          <span style={{color:"#c0d8f0"}}>{f.name}</span>
                          <span style={{color:"#3a5a7a",fontSize:11}}>{f.map_json?.rooms?.length??0}r {f.map_json?.nodes?.length??0}n</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* QR MODAL */}
      {qrModalNode && (
        <div style={S.modalOverlay} onClick={()=>setQrModalNode(null)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>QR Code</div>
            <div style={{color:"#3a5a7a",fontSize:11,marginBottom:12}}>{qrModalNode.id}</div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getQRValue(qrModalNode.id))}`}
              alt="QR" style={{width:200,height:200,borderRadius:10,display:"block",margin:"0 auto"}} />
            <code style={{...S.code,display:"block",textAlign:"center",marginTop:12,wordBreak:"break-all"}}>
              {getQRValue(qrModalNode.id)}
            </code>
            <button style={{...S.actionBtn,width:"100%",marginTop:14,justifyContent:"center"}} onClick={()=>setQrModalNode(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  root:      {display:"flex",minHeight:"100vh",background:"#070c18",color:"#c0d8f0",fontFamily:"'IBM Plex Mono','Fira Code',monospace"},
  sidebar:   {width:230,background:"#050a14",borderRight:"1px solid #0d1a2e",display:"flex",flexDirection:"column",paddingTop:14},
  logo:      {display:"flex",alignItems:"center",gap:10,padding:"0 14px 14px",borderBottom:"1px solid #0d1a2e"},
  logoTitle: {color:"#e0f0ff",fontWeight:800,fontSize:14,letterSpacing:1},
  logoSub:   {color:"#3a5a7a",fontSize:10},
  nav:       {display:"flex",flexDirection:"column",gap:1,padding:"10px 8px"},
  navBtn:    {display:"flex",alignItems:"center",gap:7,padding:"8px 10px",border:"none",background:"transparent",color:"#3a5a7a",borderRadius:6,cursor:"pointer",fontSize:12,textAlign:"left"},
  navBtnActive:{background:"#0a1525",color:"#c0d8f0",borderLeft:"3px solid #00f5c4"},
  fieldLabel:{color:"#3a5a7a",fontSize:10,fontWeight:700,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5},
  input:     {background:"#080f1e",border:"1px solid #1a2a4a",color:"#c0d8f0",borderRadius:5,padding:"6px 9px",fontSize:12,width:"100%",boxSizing:"border-box"},
  select:    {background:"#080f1e",border:"1px solid #1a2a4a",color:"#c0d8f0",borderRadius:5,padding:"6px 9px",fontSize:12,width:"100%",cursor:"pointer"},
  floorBtn:  {flex:1,padding:"5px 8px",border:"1px solid #1a2a4a",background:"#080f1e",color:"#3a5a7a",borderRadius:5,cursor:"pointer",fontSize:11,textAlign:"left"},
  floorBtnActive:{background:"#0a1e34",color:"#c0d8f0",borderColor:"#007fff"},
  floorRemove:{padding:"3px 7px",border:"1px solid #2a1010",background:"#100808",color:"#f04a6a",borderRadius:4,cursor:"pointer",fontSize:12},
  addFloorBtn:{width:"100%",padding:"6px",border:"1px dashed #1a2a4a",background:"transparent",color:"#3a5a7a",borderRadius:6,cursor:"pointer",fontSize:11,marginTop:5},
  actionBtn: {padding:"8px 12px",border:"1px solid #1a2a4a",background:"#080f1e",color:"#c0d8f0",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700},
  sideStats: {padding:"12px 14px",borderTop:"1px solid #0d1a2e",marginTop:12,display:"flex",flexDirection:"column",gap:5},
  statRow:   {display:"flex",justifyContent:"space-between",fontSize:11,color:"#3a5a7a"},
  main:      {flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},
  toast:     {padding:"9px 14px",borderLeft:"3px solid",fontSize:12,color:"#c0d8f0",margin:"8px 14px",borderRadius:6},
  editorLayout:{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"},
  toolbar:   {display:"flex",gap:5,padding:"9px 12px",borderBottom:"1px solid #0d1a2e",alignItems:"center",background:"#050a14",flexWrap:"wrap"},
  toolBtn:   {padding:"5px 10px",border:"1px solid #1a2a4a",background:"#080f1e",color:"#3a5a7a",borderRadius:6,cursor:"pointer",fontSize:12},
  toolBtnActive:{background:"#0a2040",color:"#00f5c4",borderColor:"#007fff"},
  canvasWrap:{flex:1,position:"relative",overflow:"auto",background:"#060b16"},
  svg:       {width:"100%",maxWidth:900,display:"block",background:"#070c18",border:"1px solid #0d1a2e"},
  inlineEdit:{position:"absolute",top:10,right:10,width:220,background:"#050a14",border:"1px solid #1a3a5a",borderRadius:9,padding:14,boxShadow:"0 8px 32px #000c",zIndex:10},
  inlineEditTitle:{color:"#e0f0ff",fontWeight:700,fontSize:12,marginBottom:10},
  scrollSection:{flex:1,padding:20,overflowY:"auto"},
  tabTitle:  {color:"#e0f0ff",fontSize:17,fontWeight:800,marginBottom:16,letterSpacing:0.5},
  table:     {width:"100%",borderCollapse:"collapse",fontSize:12},
  th:        {padding:"8px 12px",textAlign:"left",color:"#2a4a6a",fontWeight:700,borderBottom:"1px solid #0d1a2e",whiteSpace:"nowrap",textTransform:"uppercase",fontSize:10,letterSpacing:1},
  td:        {padding:"8px 12px",color:"#7a9ab0",borderBottom:"1px solid #08101e"},
  code:      {background:"#080f1e",border:"1px solid #1a2a4a",borderRadius:4,padding:"2px 5px",fontSize:10,color:"#00f5c4"},
  typeBadge: {background:"#0a1a2e",border:"1px solid #1a3a5a",borderRadius:4,padding:"2px 6px",fontSize:10,color:"#4a8ab0"},
  miniBtn:   {padding:"3px 8px",border:"1px solid #1a2a4a",background:"#080f1e",color:"#7a9ab0",borderRadius:4,cursor:"pointer",fontSize:11},
  statusCard:{background:"#080f1e",border:"1px solid #1a2a4a",borderRadius:10,padding:14,width:200},
  statusBtn: {padding:"4px 8px",borderWidth:1,borderStyle:"solid",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600},
  qrGrid:    {display:"flex",flexWrap:"wrap",gap:14},
  qrCard:    {background:"#080f1e",border:"1px solid #1a2a4a",borderRadius:10,padding:14,display:"flex",flexDirection:"column",alignItems:"center",width:160},
  qrCardLabel:{color:"#c0d8f0",fontWeight:700,fontSize:11,marginTop:8,textAlign:"center"},
  qrCardSub: {color:"#3a5a7a",fontSize:10,marginTop:2},
  qrDownload:{color:"#007fff",fontSize:11,marginTop:7,textDecoration:"none"},
  exportMetaItem:{display:"flex",flexDirection:"column",background:"#080f1e",padding:"12px 18px",borderRadius:8,border:"1px solid #0d1a2e"},
  jsonPre:   {background:"#050a14",border:"1px solid #0d1a2e",borderRadius:8,padding:14,fontSize:11,color:"#3a7a5a",overflowX:"auto",maxHeight:320,overflowY:"auto",lineHeight:1.5},
  savedCard: {background:"#080f1e",border:"1px solid #1a2a4a",borderRadius:10,overflow:"hidden"},
  savedCardHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",gap:12},
  savedFloors:{borderTop:"1px solid #0d1a2e",background:"#05090f"},
  floorRow:  {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px",borderBottom:"1px solid #0a1020"},
  modalOverlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100},
  modal:     {background:"#080f1e",border:"1px solid #1a2a4a",borderRadius:14,padding:22,width:280,maxWidth:"90vw"},
  modalTitle:{color:"#e0f0ff",fontWeight:800,fontSize:14,marginBottom:4},
};
