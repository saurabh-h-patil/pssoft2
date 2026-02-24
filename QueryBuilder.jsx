import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#080b0f",
  surface: "#0e1218",
  surface2: "#141a22",
  surface3: "#1a2230",
  border: "#1c2535",
  border2: "#243040",
  accent: "#00e5ff",
  accentDim: "rgba(0,229,255,0.10)",
  accentGlow: "rgba(0,229,255,0.22)",
  green: "#00d68f",
  amber: "#ffb800",
  red: "#ff4757",
  purple: "#a78bfa",
  text: "#e2eaf5",
  text2: "#8899aa",
  text3: "#3d5066",
  mono: "'JetBrains Mono','Fira Code',monospace",
  sans: "'Syne',sans-serif",
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const DB_SOURCES = {
  production: {
    label: "Production DB", type: "PostgreSQL", color: T.accent,
    tables: {
      users:    { fields: [{ name:"id",type:"INT",pk:true },{ name:"email",type:"TEXT" },{ name:"name",type:"VARCHAR" },{ name:"created_at",type:"DATE" }] },
      orders:   { fields: [{ name:"id",type:"INT",pk:true },{ name:"user_id",type:"INT",fk:true },{ name:"total",type:"DECIMAL" },{ name:"status",type:"TEXT" },{ name:"created_at",type:"DATE" }] },
      products: { fields: [{ name:"id",type:"INT",pk:true },{ name:"name",type:"TEXT" },{ name:"price",type:"DECIMAL" },{ name:"stock",type:"INT" },{ name:"category",type:"TEXT" }] },
    },
  },
  analytics: {
    label: "Analytics DB", type: "MySQL", color: T.green,
    tables: {
      events:   { fields: [{ name:"id",type:"INT",pk:true },{ name:"type",type:"TEXT" },{ name:"user_id",type:"INT",fk:true },{ name:"data",type:"JSON" },{ name:"ts",type:"DATE" }] },
      sessions: { fields: [{ name:"id",type:"TEXT",pk:true },{ name:"user_id",type:"INT",fk:true },{ name:"expires",type:"DATE" }] },
    },
  },
  local: {
    label: "Local DB", type: "SQLite", color: T.amber,
    tables: {
      cache: { fields: [{ name:"key",type:"TEXT",pk:true },{ name:"value",type:"JSON" },{ name:"expires_at",type:"DATE" }] },
    },
  },
};

const INITIAL_NODES = [
  { id:"users",   db:"production", x:100,  y:80  },
  { id:"orders",  db:"production", x:460,  y:220 },
  { id:"cache",   db:"local",      x:460,  y:40  },
];

const INITIAL_EDGES = [
  { id:"e1", from:"users", fromField:"id", to:"orders", toField:"user_id", type:"INNER" },
  { id:"e2", from:"users", fromField:"id", to:"cache",  toField:"key",     type:"LEFT"  },
];

function uid() { return Math.random().toString(36).slice(2,8); }

// Bezier path between two canvas-space points
function bez(x1,y1,x2,y2) {
  const dx = Math.max(Math.abs(x2-x1)*0.5, 60);
  return `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
}

// Node geometry constants
const NODE_HEADER_H = 44;
const FIELD_H       = 30;
const NODE_WIDTH    = 224;

function nodeHeight(tableId, db) {
  const fields = DB_SOURCES[db]?.tables[tableId]?.fields ?? [];
  return NODE_HEADER_H + fields.length * FIELD_H + 8;
}

// Port position in canvas-space — no DOM needed
function portPos(node, fieldName, side) {
  const fields = DB_SOURCES[node.db]?.tables[node.id]?.fields ?? [];
  const idx = fields.findIndex(f => f.name === fieldName);
  if (idx === -1) return null;
  return {
    x: side === "right" ? node.x + NODE_WIDTH : node.x,
    y: node.y + NODE_HEADER_H + 4 + idx * FIELD_H + FIELD_H / 2,
  };
}

const edgeColor = t =>
  t === "LEFT" ? T.green : t === "RIGHT" ? T.purple : t === "FULL" ? "#f97316" : T.accent;

// ─── DB SIDEBAR GROUP ─────────────────────────────────────────────────────────
function DbGroup({ dbKey, db, nodes, onAdd }) {
  const [open, setOpen] = useState(dbKey === "production");
  const onCanvas = name => nodes.some(n => n.id === name);
  return (
    <div style={{ marginBottom: 2 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex",alignItems:"center",gap:8,padding:"8px",borderRadius:8,cursor:"pointer",userSelect:"none",transition:"background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = T.surface2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width:8,height:8,borderRadius:"50%",background:db.color,boxShadow:`0 0 6px ${db.color}`,flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13,fontWeight:700 }}>{db.label}</div>
          <div style={{ fontSize:10,color:T.text3,fontFamily:T.mono }}>{db.type}</div>
        </div>
        <div style={{ fontSize:9,color:T.text3,transform:open?"rotate(90deg)":"",transition:"transform 0.2s" }}>▶</div>
      </div>
      {open && (
        <div style={{ paddingLeft:14 }}>
          {Object.keys(db.tables).map(tbl => {
            const active = onCanvas(tbl);
            return (
              <div key={tbl}
                onClick={() => !active && onAdd(tbl, dbKey)}
                style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,cursor:active?"default":"pointer",margin:"2px 0",
                  background:active ? T.accentDim : "transparent",
                  border:`1px solid ${active ? T.accentGlow : "transparent"}`,
                  transition:"all 0.15s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surface2; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? T.accentDim : "transparent"; }}
              >
                <span style={{ fontSize:11,color:active?T.accent:T.text3 }}>⊞</span>
                <span style={{ fontSize:12.5,flex:1,color:active?T.accent:T.text2 }}>{tbl}</span>
                <span style={{ fontSize:10,color:T.text3,fontFamily:T.mono }}>{db.tables[tbl].fields.length}c</span>
                {active && <span style={{ fontSize:8,color:T.accent }}>●</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TABLE NODE (SVG) ─────────────────────────────────────────────────────────
function TableNode({ node, db, onRemove, onStartDrag, onPortDown, onPortUp, connecting }) {
  const tableInfo = db.tables[node.id];
  const dbColor   = db.color;
  const isSource  = connecting?.tableId === node.id;
  const nh        = nodeHeight(node.id, node.db);

  return (
    <g transform={`translate(${node.x},${node.y})`}>
      {/* Drop shadow */}
      <rect x={5} y={8} width={NODE_WIDTH} height={nh} rx={13} fill="rgba(0,0,0,0.5)" />

      {/* Body */}
      <rect x={0} y={0} width={NODE_WIDTH} height={nh} rx={12}
        fill={T.surface}
        stroke={isSource ? dbColor : T.border2}
        strokeWidth={isSource ? 1.8 : 1}
      />

      {/* Header bg */}
      <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEADER_H} rx={12} fill={T.surface2} />
      <rect x={0} y={NODE_HEADER_H - 12} width={NODE_WIDTH} height={12} fill={T.surface2} />
      <line x1={0} y1={NODE_HEADER_H} x2={NODE_WIDTH} y2={NODE_HEADER_H} stroke={T.border} strokeWidth={1} />

      {/* DB color dot */}
      <circle cx={16} cy={NODE_HEADER_H / 2} r={4.5} fill={dbColor}
        style={{ filter:`drop-shadow(0 0 5px ${dbColor})` }} />

      {/* Table name */}
      <text x={30} y={NODE_HEADER_H / 2 + 1}
        dominantBaseline="middle" fill={T.text}
        fontSize={13} fontWeight={700} fontFamily={T.sans}>{node.id}</text>

      {/* Col count badge */}
      <rect x={NODE_WIDTH - 50} y={12} width={38} height={16} rx={4} fill={T.bg} />
      <text x={NODE_WIDTH - 31} y={20} textAnchor="middle" dominantBaseline="middle"
        fill={T.text3} fontSize={9.5} fontFamily={T.mono}>{tableInfo.fields.length} cols</text>

      {/* Drag handle (invisible, over header) */}
      <rect x={0} y={0} width={NODE_WIDTH - 28} height={NODE_HEADER_H} rx={12}
        fill="transparent" style={{ cursor:"move" }}
        onMouseDown={e => { e.stopPropagation(); onStartDrag(e, node.id); }}
      />

      {/* Remove button */}
      <rect x={NODE_WIDTH - 24} y={NODE_HEADER_H / 2 - 10} width={20} height={20} rx={5}
        fill="transparent" style={{ cursor:"pointer" }}
        onMouseEnter={e => e.currentTarget.setAttribute("fill", T.red)}
        onMouseLeave={e => e.currentTarget.setAttribute("fill", "transparent")}
        onClick={() => onRemove(node.id)}
      />
      <text x={NODE_WIDTH - 14} y={NODE_HEADER_H / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={T.text3} fontSize={10} style={{ pointerEvents:"none" }}>✕</text>

      {/* Fields */}
      {tableInfo.fields.map((field, i) => {
        const fy = NODE_HEADER_H + 4 + i * FIELD_H;
        const cy = fy + FIELD_H / 2;
        return (
          <g key={field.name}>
            {/* Row hover */}
            <rect x={0} y={fy} width={NODE_WIDTH} height={FIELD_H} fill="transparent"
              onMouseEnter={e => e.currentTarget.setAttribute("fill", T.surface3)}
              onMouseLeave={e => e.currentTarget.setAttribute("fill", "transparent")} />

            {/* Type tag */}
            <rect x={10} y={fy + 7} width={38} height={16} rx={3} fill={T.bg} stroke={T.border} strokeWidth={0.8} />
            <text x={29} y={fy + 15} textAnchor="middle" dominantBaseline="middle"
              fill={T.text3} fontSize={9} fontFamily={T.mono}>{field.type}</text>

            {/* Field name */}
            <text x={54} y={cy} dominantBaseline="middle"
              fill={T.text2} fontSize={12} fontFamily={T.mono}>{field.name}</text>

            {field.pk && <text x={NODE_WIDTH - 24} y={cy} dominantBaseline="middle" fontSize={11}>🔑</text>}
            {field.fk && <text x={NODE_WIDTH - 24} y={cy} dominantBaseline="middle" fontSize={11}>🔗</text>}

            {/* LEFT PORT */}
            <circle cx={0} cy={cy} r={6}
              fill={T.surface3} stroke={T.border2} strokeWidth={1.5}
              style={{ cursor:"crosshair", transition:"r 0.1s" }}
              onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, field.name, "left"); }}
              onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, field.name, "left"); }}
              onMouseEnter={e => { e.currentTarget.setAttribute("fill", dbColor); e.currentTarget.setAttribute("stroke", dbColor); e.currentTarget.setAttribute("r", "8"); }}
              onMouseLeave={e => { e.currentTarget.setAttribute("fill", T.surface3); e.currentTarget.setAttribute("stroke", T.border2); e.currentTarget.setAttribute("r", "6"); }}
            />

            {/* RIGHT PORT */}
            <circle cx={NODE_WIDTH} cy={cy} r={6}
              fill={T.surface3} stroke={T.border2} strokeWidth={1.5}
              style={{ cursor:"crosshair" }}
              onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, field.name, "right"); }}
              onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, field.name, "right"); }}
              onMouseEnter={e => { e.currentTarget.setAttribute("fill", dbColor); e.currentTarget.setAttribute("stroke", dbColor); e.currentTarget.setAttribute("r", "8"); }}
              onMouseLeave={e => { e.currentTarget.setAttribute("fill", T.surface3); e.currentTarget.setAttribute("stroke", T.border2); e.currentTarget.setAttribute("r", "6"); }}
            />
          </g>
        );
      })}
    </g>
  );
}

// ─── SQL PANEL ────────────────────────────────────────────────────────────────
function SqlPanel({ nodes, edges }) {
  const [copied, setCopied] = useState(false);
  const kw = t => <span style={{ color:"#c792ea" }}>{t}</span>;
  const tb = t => <span style={{ color:T.accent }}>{t}</span>;
  const cl = t => <span style={{ color:"#82aaff" }}>{t}</span>;
  const nm = t => <span style={{ color:T.amber }}>{t}</span>;

  const lines = [];
  if (!nodes.length) {
    lines.push(<span key="e" style={{ color:T.text3 }}>-- Add tables to canvas</span>);
  } else {
    lines.push(<span key="s">{kw("SELECT")}{"\n  "}{tb(nodes[0].id)}.{cl("*")}{"\n"}</span>);
    lines.push(<span key="f">{kw("FROM")} {tb(nodes[0].id)}{"\n"}</span>);
    edges.forEach((e, i) => {
      lines.push(<span key={`j${i}`}>{kw(e.type + " JOIN")} {tb(e.to)}{"\n  "}{kw("ON")} {tb(e.from)}.{cl(e.fromField)} = {tb(e.to)}.{cl(e.toField)}{"\n"}</span>);
    });
    lines.push(<span key="l">{kw("LIMIT")} {nm("100")}{kw(";")}</span>);
  }

  const plain = !nodes.length ? "-- Add tables to canvas" :
    `SELECT\n  ${nodes[0].id}.*\nFROM ${nodes[0].id}\n` +
    edges.map(e => `${e.type} JOIN ${e.to}\n  ON ${e.from}.${e.fromField} = ${e.to}.${e.toField}`).join("\n") +
    "\nLIMIT 100;";

  const copy = () => {
    try { navigator.clipboard.writeText(plain); } catch (err) {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",marginBottom:18 }}>
      <div style={{ padding:"8px 12px",background:T.surface2,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6 }}>
        {[T.red, T.amber, T.green].map(c => <div key={c} style={{ width:8,height:8,borderRadius:"50%",background:c }}/>)}
        <span style={{ marginLeft:"auto",fontFamily:T.mono,fontSize:10,color:T.text3,background:T.border,padding:"2px 7px",borderRadius:3 }}>SQL</span>
      </div>
      <div style={{ padding:14,fontFamily:T.mono,fontSize:11.5,lineHeight:1.85,color:T.text,whiteSpace:"pre",overflowX:"auto",minHeight:110 }}>{lines}</div>
      <div style={{ padding:"8px 12px",background:T.surface2,borderTop:`1px solid ${T.border}` }}>
        <button onClick={copy} style={{ padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${T.border2}`,background:"transparent",color:copied?T.green:T.text2,fontFamily:T.sans,transition:"all 0.15s" }}>
          {copied ? "✓ Copied" : "⎘ Copy"}
        </button>
      </div>
    </div>
  );
}

// ─── JOINS PANEL ─────────────────────────────────────────────────────────────
function JoinsPanel({ edges, onChangeType, onRemove }) {
  if (!edges.length) return (
    <div style={{ color:T.text3,fontSize:13,textAlign:"center",marginTop:40,lineHeight:1.6 }}>
      Drag from a field's port circle<br/>to another table's port to connect
    </div>
  );
  return (
    <div>
      {edges.map(edge => (
        <div key={edge.id} style={{ background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:12,marginBottom:10,position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",left:0,top:0,bottom:0,width:3,background:edgeColor(edge.type) }}/>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
            <span style={{ fontSize:10,fontFamily:T.mono,color:edgeColor(edge.type),background:`${edgeColor(edge.type)}18`,border:`1px solid ${edgeColor(edge.type)}40`,padding:"2px 8px",borderRadius:4 }}>{edge.type} JOIN</span>
            <span style={{ fontSize:12,fontWeight:600,flex:1 }}>{edge.from} → {edge.to}</span>
            <button onClick={() => onRemove(edge.id)} style={{ background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:12 }}>✕</button>
          </div>
          <div style={{ fontFamily:T.mono,fontSize:12,display:"flex",gap:6,alignItems:"center",marginBottom:10 }}>
            <span style={{ color:T.accent }}>{edge.from}</span><span style={{ color:T.text3 }}>.</span><span style={{ color:T.text2 }}>{edge.fromField}</span>
            <span style={{ color:T.text3 }}>──</span>
            <span style={{ color:T.accent }}>{edge.to}</span><span style={{ color:T.text3 }}>.</span><span style={{ color:T.text2 }}>{edge.toField}</span>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5 }}>
            {["INNER","LEFT","RIGHT","FULL"].map(jt => (
              <button key={jt} onClick={() => onChangeType(edge.id, jt)} style={{ padding:"4px",borderRadius:6,fontSize:10,fontFamily:T.mono,border:`1px solid ${edge.type===jt?edgeColor(jt):T.border}`,background:edge.type===jt?`${edgeColor(jt)}18`:T.surface,color:edge.type===jt?edgeColor(jt):T.text3,cursor:"pointer",transition:"all 0.15s" }}>{jt}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FILTER EDITOR ────────────────────────────────────────────────────────────
function FilterEditor({ nodes }) {
  const [filters, setFilters] = useState([{ id:uid(), col:"", op:"=", val:"" }]);
  const allFields = nodes.flatMap(n => DB_SOURCES[n.db].tables[n.id].fields.map(f => `${n.id}.${f.name}`));
  return (
    <div>
      {filters.map(f => (
        <div key={f.id} style={{ display:"flex",gap:6,marginBottom:8,alignItems:"center" }}>
          <select value={f.col} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,col:e.target.value}:x))}
            style={{ flex:1.5,background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 8px",color:f.col?T.text:T.text3,fontFamily:T.mono,fontSize:11,outline:"none" }}>
            <option value="">Column</option>
            {allFields.map(fc => <option key={fc}>{fc}</option>)}
          </select>
          <select value={f.op} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,op:e.target.value}:x))}
            style={{ width:52,background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 4px",color:T.text,fontFamily:T.mono,fontSize:11,outline:"none" }}>
            {["=","!=",">","<",">=","<=","LIKE","IN"].map(o => <option key={o}>{o}</option>)}
          </select>
          <input value={f.val} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,val:e.target.value}:x))} placeholder="value"
            style={{ flex:1,background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 8px",color:T.text,fontFamily:T.mono,fontSize:11,outline:"none" }}/>
          <button onClick={() => setFilters(p => p.filter(x => x.id!==f.id))}
            style={{ width:28,height:28,display:"grid",placeItems:"center",border:`1px solid ${T.border}`,borderRadius:6,background:"transparent",color:T.text3,cursor:"pointer",fontSize:12 }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.red;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=T.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.text3;e.currentTarget.style.borderColor=T.border;}}>✕</button>
        </div>
      ))}
      <button onClick={() => setFilters(p => [...p, { id:uid(),col:"",op:"=",val:"" }])}
        style={{ width:"100%",padding:"7px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px dashed ${T.accent}40`,background:T.accentDim,color:T.accent,fontFamily:T.sans,marginTop:4 }}>
        + Add Filter
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function QueryBuilder() {
  const [nodes,     setNodes]     = useState(INITIAL_NODES);
  const [edges,     setEdges]     = useState(INITIAL_EDGES);
  const [activeTab, setActiveTab] = useState("sql");

  // Viewport state
  const [scale, setScale] = useState(1);
  const [pan,   setPan]   = useState({ x: 0, y: 0 });

  // Connection dragging
  const [conn,      setConn]      = useState(null); // { tableId, fieldName, side }
  const [connMouse, setConnMouse] = useState({ x:0, y:0 });

  const svgRef  = useRef(null);
  const dragRef = useRef(null);
  // Live refs so event handlers always see fresh values
  const scaleRef = useRef(scale);
  const panRef   = useRef(pan);
  const nodesRef = useRef(nodes);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { panRef.current   = pan;   }, [pan]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // ── Screen → Canvas coords ──
  const toCanvas = useCallback((sx, sy) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (sx - rect.left - panRef.current.x) / scaleRef.current,
      y: (sy - rect.top  - panRef.current.y) / scaleRef.current,
    };
  }, []);

  // ── ZOOM ──
  const applyZoom = useCallback((factor, pivotSx, pivotSy) => {
    setScale(prev => {
      const next = Math.max(0.2, Math.min(3, prev * factor));
      const r    = next / prev;
      setPan(p => ({
        x: pivotSx - r * (pivotSx - p.x),
        y: pivotSy - r * (pivotSy - p.y),
      }));
      return next;
    });
  }, []);

  const zoomBtn = dir => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    applyZoom(dir > 0 ? 1.2 : 1/1.2, rect.width/2, rect.height/2);
  };

  // Wheel zoom
  const handleWheel = useCallback(e => {
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    applyZoom(e.deltaY < 0 ? 1.1 : 1/1.1, e.clientX - rect.left, e.clientY - rect.top);
  }, [applyZoom]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── ADD TABLE ──
  const addTable = (name, dbKey) => {
    if (nodesRef.current.find(n => n.id === name)) return;
    const rect  = svgRef.current?.getBoundingClientRect();
    const cx    = rect ? (rect.width  / 2 - panRef.current.x) / scaleRef.current : 200;
    const cy    = rect ? (rect.height / 2 - panRef.current.y) / scaleRef.current : 200;
    const off   = nodesRef.current.length * 22;
    setNodes(p => [...p, { id:name, db:dbKey, x:cx - NODE_WIDTH/2 + off, y:cy - 80 + off }]);
  };

  const removeNode = (id) => {
    setNodes(p => p.filter(n => n.id !== id));
    setEdges(p => p.filter(e => e.from !== id && e.to !== id));
  };

  // ── DRAG: NODE or PAN ──
  const handleSvgMouseDown = useCallback(e => {
    if (e.button !== 0) return;
    dragRef.current = { type:"pan", startX: e.clientX - panRef.current.x, startY: e.clientY - panRef.current.y };
  }, []);

  const startNodeDrag = useCallback((e, nodeId) => {
    e.stopPropagation();
    const cp   = toCanvas(e.clientX, e.clientY);
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    dragRef.current = { type:"node", nodeId, sx:cp.x, sy:cp.y, ox:node.x, oy:node.y };
  }, [toCanvas]);

  const handleMouseMove = useCallback(e => {
    const d = dragRef.current;
    if (d) {
      if (d.type === "pan") {
        setPan({ x: e.clientX - d.startX, y: e.clientY - d.startY });
      } else if (d.type === "node") {
        const cp = toCanvas(e.clientX, e.clientY);
        setNodes(p => p.map(n => n.id === d.nodeId ? { ...n, x: d.ox + cp.x - d.sx, y: d.oy + cp.y - d.sy } : n));
      }
    }
    if (conn) {
      setConnMouse(toCanvas(e.clientX, e.clientY));
    }
  }, [conn, toCanvas]);

  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  // ── PORT CONNECT ──
  const handlePortDown = useCallback((e, tableId, fieldName, side) => {
    e.stopPropagation();
    dragRef.current = null;
    setConn({ tableId, fieldName, side });
    setConnMouse(toCanvas(e.clientX, e.clientY));
  }, [toCanvas]);

  const handlePortUp = useCallback((e, tableId, fieldName, side) => {
    e.stopPropagation();
    setConn(prev => {
      if (!prev || prev.tableId === tableId) return null;
      const from  = prev.side === "right" ? prev.tableId  : tableId;
      const ff    = prev.side === "right" ? prev.fieldName : fieldName;
      const to    = prev.side === "right" ? tableId        : prev.tableId;
      const tf    = prev.side === "right" ? fieldName       : prev.fieldName;
      setEdges(ep => {
        if (ep.find(ed => ed.from===from && ed.to===to && ed.fromField===ff && ed.toField===tf)) return ep;
        return [...ep, { id:uid(), from, fromField:ff, to, toField:tf, type:"INNER" }];
      });
      return null;
    });
  }, []);

  const handleSvgMouseUp = useCallback(() => {
    dragRef.current = null;
    setConn(null);
  }, []);

  // ── AUTO ARRANGE ──
  const autoArrange = () => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    setNodes(p => p.map((n, i) => ({ ...n, x: 80 + (i % cols) * 280, y: 80 + Math.floor(i / cols) * 250 })));
  };

  // ── EDGE PATHS (canvas-space, no DOM) ──
  const edgePaths = useMemo(() => edges.map(e => {
    const fn = nodes.find(n => n.id === e.from);
    const tn = nodes.find(n => n.id === e.to);
    if (!fn || !tn) return null;
    const fp = portPos(fn, e.fromField, "right");
    const tp = portPos(tn, e.toField,   "left");
    if (!fp || !tp) return null;
    return { ...e, path:bez(fp.x,fp.y,tp.x,tp.y), mx:(fp.x+tp.x)/2, my:(fp.y+tp.y)/2-10, color:edgeColor(e.type) };
  }).filter(Boolean), [edges, nodes]);

  // ── LIVE CONNECTION LINE ──
  const liveConnPath = useMemo(() => {
    if (!conn) return null;
    const fn = nodes.find(n => n.id === conn.tableId);
    if (!fn) return null;
    const fp = portPos(fn, conn.fieldName, conn.side);
    if (!fp) return null;
    return conn.side === "right"
      ? bez(fp.x, fp.y, connMouse.x, connMouse.y)
      : bez(connMouse.x, connMouse.y, fp.x, fp.y);
  }, [conn, connMouse, nodes]);

  const zoomPct = Math.round(scale * 100);
  const btnStyle = (color = T.text2, bg = T.surface) => ({
    width:36, height:36, display:"grid", placeItems:"center", borderRadius:9,
    border:`1px solid ${T.border2}`, background:bg, color, cursor:"pointer",
    fontSize:18, fontWeight:300, fontFamily:"monospace",
    boxShadow:"0 2px 12px rgba(0,0,0,0.4)", transition:"all 0.15s",
  });

  return (
    <div style={{ display:"grid", gridTemplateRows:"52px 1fr", gridTemplateColumns:"264px 1fr 310px", height:"100vh", background:T.bg, fontFamily:T.sans, overflow:"hidden", color:T.text }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{ gridColumn:"1/-1", background:T.surface, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:18, zIndex:200 }}>
        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:9,fontWeight:800,fontSize:16,letterSpacing:"-0.5px",flexShrink:0 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"grid",placeItems:"center",fontSize:13,color:"#000",fontWeight:900 }}>⚡</div>
          Query<span style={{ color:T.accent }}>Forge</span>
        </div>
        <div style={{ width:1,height:24,background:T.border,flexShrink:0 }}/>
        <div style={{ fontFamily:T.mono,fontSize:12,color:T.text3,display:"flex",gap:6 }}>
          <span style={{ color:T.text3 }}>queries /</span><span style={{ color:T.text2 }}>new-query</span>
        </div>
        <div style={{ width:1,height:24,background:T.border,flexShrink:0 }}/>
        <div style={{ display:"flex",gap:3,background:T.bg,borderRadius:8,padding:3 }}>
          {["Builder","Schema","History"].map(t => (
            <button key={t} style={{ padding:"5px 13px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",fontFamily:T.sans,background:t==="Builder"?T.surface2:"transparent",color:t==="Builder"?T.text:T.text3,transition:"all 0.15s" }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft:"auto",display:"flex",gap:8,alignItems:"center" }}>
          <span style={{ fontFamily:T.mono,fontSize:12,color:T.text3 }}>
            Tables: <strong style={{ color:T.accent }}>{nodes.length}</strong>
            <span style={{ marginLeft:10 }}>Joins: <strong style={{ color:T.green }}>{edges.length}</strong></span>
          </span>
          {[["ghost","↩ Undo"],["ghost","⤴ Export"],["primary","💾 Save"],["run","▶ Run"]].map(([v,l]) => (
            <button key={l} style={{ padding:"6px 14px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",fontFamily:T.sans,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",
              ...(v==="ghost"?{background:"transparent",color:T.text2,border:`1px solid ${T.border2}`}:{}),
              ...(v==="primary"?{background:T.accent,color:"#000"}:{}),
              ...(v==="run"?{background:T.green,color:"#000"}:{}) }}>{l}</button>
          ))}
        </div>
      </header>

      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside style={{ background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:8 }}>Data Sources</div>
          <div style={{ display:"flex",alignItems:"center",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",gap:8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:12,fontFamily:T.sans,width:"100%" }} placeholder="Search tables…"/>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"6px 8px",scrollbarWidth:"thin",scrollbarColor:`${T.border2} transparent` }}>
          {Object.entries(DB_SOURCES).map(([key,db]) => (
            <DbGroup key={key} dbKey={key} db={db} nodes={nodes} onAdd={addTable}/>
          ))}
        </div>
        <div style={{ padding:"10px 14px",borderTop:`1px solid ${T.border}` }}>
          <button style={{ width:"100%",padding:"7px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${T.accent}30`,background:T.accentDim,color:T.accent,fontFamily:T.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            + Connect New Database
          </button>
        </div>
      </aside>

      {/* ─── CANVAS ─────────────────────────────────────────────────────────── */}
      <div style={{ position:"relative",overflow:"hidden",background:T.bg,cursor:conn?"crosshair":"default" }}>
        {/* Dot grid */}
        <div style={{ position:"absolute",inset:0,backgroundImage:`radial-gradient(circle at 1px 1px,${T.border} 1px,transparent 0)`,backgroundSize:"28px 28px",opacity:0.55,pointerEvents:"none" }}/>

        {/* Empty hint */}
        {nodes.length === 0 && (
          <div style={{ position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none",zIndex:1 }}>
            <div style={{ textAlign:"center",color:T.text3 }}>
              <div style={{ fontSize:36,marginBottom:10 }}>⊕</div>
              <div style={{ fontSize:14,fontWeight:600,color:T.text2 }}>Click a table in the sidebar to add it</div>
              <div style={{ fontSize:12,marginTop:4 }}>Drag header to move · Drag port dots to connect · Scroll to zoom</div>
            </div>
          </div>
        )}

        {/* Main SVG — viewport handles pan+zoom via a single <g> transform */}
        <svg ref={svgRef}
          style={{ position:"absolute",inset:0,width:"100%",height:"100%",overflow:"hidden" }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
        >
          <defs>
            {[["accent",T.accent],["green",T.green],["purple",T.purple],["orange","#f97316"]].map(([id,color]) => (
              <marker key={id} id={`arr-${id}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill={color} opacity="0.85"/>
              </marker>
            ))}
          </defs>

          {/* ── VIEWPORT GROUP ── */}
          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>

            {/* Committed edges */}
            {edgePaths.map(ep => {
              const ak = ep.color===T.green?"green":ep.color===T.purple?"purple":ep.color==="#f97316"?"orange":"accent";
              return (
                <g key={ep.id}>
                  <path d={ep.path} fill="none" stroke={ep.color} strokeWidth={9} opacity={0.06}/>
                  <path d={ep.path} fill="none" stroke={ep.color} strokeWidth={2}
                    strokeDasharray="6 4" opacity={0.8} markerEnd={`url(#arr-${ak})`}
                    style={{ animation:"dashFlow 1.2s linear infinite" }}/>
                  {/* Label */}
                  <rect x={ep.mx-20} y={ep.my-10} width={40} height={18} rx={5} fill={T.surface2} stroke={ep.color} strokeWidth={0.8} opacity={0.95}/>
                  <text x={ep.mx} y={ep.my+1} textAnchor="middle" dominantBaseline="middle"
                    fill={ep.color} fontSize={9} fontFamily={T.mono}>{ep.type}</text>
                </g>
              );
            })}

            {/* Live drag line */}
            {liveConnPath && (
              <path d={liveConnPath} fill="none" stroke={T.accent} strokeWidth={2.5}
                strokeDasharray="5 4" opacity={0.95}
                style={{ animation:"dashFlow 0.8s linear infinite" }}/>
            )}

            {/* Table nodes */}
            {nodes.map(node => (
              <TableNode key={node.id}
                node={node}
                db={DB_SOURCES[node.db]}
                onRemove={removeNode}
                onStartDrag={startNodeDrag}
                onPortDown={handlePortDown}
                onPortUp={handlePortUp}
                connecting={conn}
              />
            ))}
          </g>
        </svg>

        {/* ── CANVAS TOOLBAR (top-center, screen-space) ── */}
        <div style={{ position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",background:T.surface,border:`1px solid ${T.border2}`,borderRadius:10,padding:5,display:"flex",gap:3,zIndex:100,boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>
          {[
            ["⊕","Auto Arrange", autoArrange],
            ["⊡","Reset View",   () => { setScale(1); setPan({x:0,y:0}); }],
            [null],
            ["🗑","Clear",       () => { setNodes([]); setEdges([]); }],
          ].map((item, i) => {
            if (!item[0]) return <div key={i} style={{ width:1,background:T.border,margin:"4px 2px" }}/>;
            return (
              <button key={i} title={item[1]} onClick={item[2]}
                style={{ width:32,height:32,display:"grid",placeItems:"center",borderRadius:7,border:"none",background:"transparent",color:item[1]==="Clear"?T.red:T.text2,cursor:"pointer",fontSize:14,fontFamily:T.sans,transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=item[1]==="Clear"?T.red:T.text;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=item[1]==="Clear"?T.red:T.text2;}}
              >{item[0]}</button>
            );
          })}
        </div>

        {/* ── ZOOM CONTROLS (bottom-right, screen-space) ── */}
        <div style={{ position:"absolute",bottom:20,right:20,display:"flex",flexDirection:"column",alignItems:"center",gap:6,zIndex:100 }}>
          {/* Zoom In */}
          <button
            onClick={() => zoomBtn(1)}
            title="Zoom In"
            style={btnStyle()}
            onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.accent;e.currentTarget.style.borderColor=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.text2;e.currentTarget.style.borderColor=T.border2;}}
          >+</button>

          {/* Zoom % indicator (click to reset) */}
          <div
            onClick={() => { setScale(1); setPan({x:0,y:0}); }}
            title="Reset zoom"
            style={{ width:36,height:36,display:"grid",placeItems:"center",borderRadius:9,border:`1px solid ${T.border2}`,background:T.surface,color:T.text3,cursor:"pointer",fontSize:10,fontFamily:T.mono,boxShadow:"0 2px 12px rgba(0,0,0,0.4)",userSelect:"none",lineHeight:1.2,textAlign:"center" }}
          >{zoomPct}<br/>%</div>

          {/* Zoom Out */}
          <button
            onClick={() => zoomBtn(-1)}
            title="Zoom Out"
            style={btnStyle()}
            onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.accent;e.currentTarget.style.borderColor=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.text2;e.currentTarget.style.borderColor=T.border2;}}
          >−</button>
        </div>

        {/* ── STATUS BAR (bottom-center) ── */}
        <div style={{ position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,zIndex:100 }}>
          {[["Tables",nodes.length,T.accent],["Joins",edges.length,T.green]].map(([l,v,c]) => (
            <div key={l} style={{ background:T.surface,border:`1px solid ${T.border2}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:T.text2,display:"flex",gap:6,alignItems:"center",fontFamily:T.mono }}>
              {l}: <strong style={{ color:c }}>{v}</strong>
            </div>
          ))}
          {conn && (
            <div style={{ background:T.accentDim,border:`1px solid ${T.accentGlow}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:T.accent,fontFamily:T.mono }}>
              ⚡ Drop on a port to connect
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <aside style={{ background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ display:"flex",borderBottom:`1px solid ${T.border}` }}>
          {[["sql","SQL"],["joins","Joins"],["columns","Columns"],["filters","Filters"]].map(([key,label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ flex:1,padding:"13px 8px",fontSize:11,fontWeight:700,color:activeTab===key?T.accent:T.text3,cursor:"pointer",border:"none",background:"transparent",fontFamily:T.sans,letterSpacing:1,textTransform:"uppercase",borderBottom:`2px solid ${activeTab===key?T.accent:"transparent"}`,marginBottom:-1,transition:"all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:16,scrollbarWidth:"thin",scrollbarColor:`${T.border2} transparent` }}>
          {activeTab === "sql" && (
            <>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:8 }}>Generated SQL</div>
              <SqlPanel nodes={nodes} edges={edges}/>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:8 }}>Options</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
                {[["LIMIT","100"],["OFFSET","0"]].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:10,color:T.text3,marginBottom:4,fontFamily:T.mono }}>{l}</div>
                    <input defaultValue={v} style={{ width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:T.mono,fontSize:12,outline:"none" }}/>
                  </div>
                ))}
              </div>
              {["Distinct","Explain"].map(o => (
                <label key={o} style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,color:T.text2,cursor:"pointer",marginBottom:6 }}>
                  <input type="checkbox" defaultChecked={o==="Distinct"} style={{ accentColor:T.accent }}/>{o} results
                </label>
              ))}
            </>
          )}
          {activeTab === "joins" && (
            <>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:8,display:"flex",justifyContent:"space-between" }}>
                <span>Active Joins</span><span style={{ color:T.accent }}>{edges.length}</span>
              </div>
              <JoinsPanel edges={edges}
                onChangeType={(id,t) => setEdges(p => p.map(e => e.id===id?{...e,type:t}:e))}
                onRemove={(id) => setEdges(p => p.filter(e => e.id!==id))}/>
            </>
          )}
          {activeTab === "columns" && (
            <>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:8 }}>Select Columns</div>
              {nodes.map(n => {
                const db = DB_SOURCES[n.db];
                return (
                  <div key={n.id} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11,color:T.text3,marginBottom:5,fontFamily:T.mono,display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ color:db.color }}>●</span>{n.id}
                    </div>
                    {db.tables[n.id].fields.map(f => (
                      <label key={f.name} style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:7,cursor:"pointer",marginBottom:2 }}>
                        <input type="checkbox" defaultChecked style={{ accentColor:T.accent }}/>
                        <span style={{ fontFamily:T.mono,fontSize:12,color:T.text2,flex:1 }}>{f.name}</span>
                        <span style={{ fontFamily:T.mono,fontSize:9,color:T.text3,background:T.bg,border:`1px solid ${T.border}`,padding:"1px 5px",borderRadius:3 }}>{f.type}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
              {nodes.length === 0 && <div style={{ color:T.text3,fontSize:13,textAlign:"center",marginTop:40 }}>Add tables to canvas</div>}
            </>
          )}
          {activeTab === "filters" && (
            <>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:8 }}>WHERE Conditions</div>
              <FilterEditor nodes={nodes}/>
            </>
          )}
        </div>
        <div style={{ display:"flex",gap:8,padding:"12px 14px",borderTop:`1px solid ${T.border}` }}>
          <button style={{ flex:1,padding:"8px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:T.green,color:"#000",fontFamily:T.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>▶ Execute Query</button>
          <button style={{ padding:"8px 14px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${T.border2}`,background:"transparent",color:T.text2,fontFamily:T.sans }}>⎘ SQL</button>
        </div>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
        @keyframes dashFlow { to { stroke-dashoffset: -10; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #243040; border-radius: 4px; }
        select option { background: #0e1218; color: #e2eaf5; }
      `}</style>
    </div>
  );
}
