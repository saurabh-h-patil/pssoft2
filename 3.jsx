import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── THEME (Executive Financial UI) ───────────────────────────────────────────
const T = {
  bg: "#0A111A",          // Deep Oxford Blue
  surface: "#111C2A",     // Raised Navy
  surface2: "#1A283C",    // Interactive elements
  surface3: "#263750",    // Hover states
  border: "#2D415F",      // Structural borders
  border2: "#425A80",     // Input borders
  accent: "#4A90E2",      // Classic Corporate Blue
  accentDim: "rgba(74, 144, 226, 0.15)",
  accentGlow: "rgba(74, 144, 226, 0.4)",
  green: "#2E7D32",       // Financial Forest Green
  amber: "#E67E22",       // Muted Bronze/Amber
  red: "#C62828",         // Brick Red
  purple: "#6A1B9A",      // Deep Plum
  text: "#F0F4F8",        // Soft White (reduces eye strain vs pure white)
  text2: "#A4B5CB",       // Light Slate
  text3: "#6C829F",       // Muted Slate
  mono: "'Consolas', 'Courier New', monospace", // Traditional coding fonts
  sans: "'Helvetica Neue', Arial, sans-serif",  // Classic, highly readable sans
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

function bez(x1,y1,x2,y2) {
  const dx = Math.max(Math.abs(x2-x1)*0.5, 60);
  return `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
}

const NODE_HEADER_H = 46;
const FIELD_H       = 32;
const NODE_WIDTH    = 240;

function nodeHeight(tableId, db) {
  const fields = DB_SOURCES[db]?.tables[tableId]?.fields ?? [];
  return NODE_HEADER_H + fields.length * FIELD_H + 6;
}

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
  t === "LEFT" ? T.green : t === "RIGHT" ? T.purple : t === "FULL" ? T.amber : T.accent;

// ─── DB SIDEBAR GROUP ─────────────────────────────────────────────────────────
function DbGroup({ dbKey, db, nodes, onAdd }) {
  const [open, setOpen] = useState(dbKey === "production");
  const onCanvas = name => nodes.some(n => n.id === name);
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex",alignItems:"center",gap:10,padding:"10px",borderRadius:4,cursor:"pointer",userSelect:"none",transition:"background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = T.surface2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width:10,height:10,borderRadius:"2px",background:db.color,boxShadow:`0 0 4px ${db.color}`,flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14,fontWeight:600 }}>{db.label}</div>
          <div style={{ fontSize:11,color:T.text3,fontFamily:T.mono }}>{db.type}</div>
        </div>
        <div style={{ fontSize:10,color:T.text3,transform:open?"rotate(90deg)":"",transition:"transform 0.2s" }}>▶</div>
      </div>
      {open && (
        <div style={{ paddingLeft:16 }}>
          {Object.keys(db.tables).map(tbl => {
            const active = onCanvas(tbl);
            return (
              <div key={tbl}
                onClick={() => !active && onAdd(tbl, dbKey)}
                style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:4,cursor:active?"default":"pointer",margin:"2px 0",
                  background:active ? T.accentDim : "transparent",
                  border:`1px solid ${active ? T.border : "transparent"}`,
                  transition:"all 0.15s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surface2; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? T.accentDim : "transparent"; }}
              >
                <span style={{ fontSize:12,color:active?T.accent:T.text3 }}>⊞</span>
                <span style={{ fontSize:13,flex:1,color:active?T.text:T.text2 }}>{tbl}</span>
                <span style={{ fontSize:11,color:T.text3,fontFamily:T.mono }}>{db.tables[tbl].fields.length}c</span>
                {active && <span style={{ fontSize:10,color:T.accent }}>✓</span>}
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
      <rect x={4} y={6} width={NODE_WIDTH} height={nh} rx={4} fill="rgba(0,0,0,0.4)" />

      <rect x={0} y={0} width={NODE_WIDTH} height={nh} rx={4}
        fill={T.surface}
        stroke={isSource ? dbColor : T.border2}
        strokeWidth={isSource ? 2 : 1}
      />

      <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEADER_H} rx={4} fill={T.surface2} />
      <rect x={0} y={NODE_HEADER_H - 4} width={NODE_WIDTH} height={4} fill={T.surface2} />
      <line x1={0} y1={NODE_HEADER_H} x2={NODE_WIDTH} y2={NODE_HEADER_H} stroke={T.border} strokeWidth={1} />

      <rect x={12} y={NODE_HEADER_H / 2 - 5} width={10} height={10} rx={2} fill={dbColor} />

      <text x={32} y={NODE_HEADER_H / 2 + 1}
        dominantBaseline="middle" fill={T.text}
        fontSize={14} fontWeight={600} fontFamily={T.sans}>{node.id}</text>

      <rect x={NODE_WIDTH - 54} y={12} width={42} height={20} rx={2} fill={T.bg} stroke={T.border} strokeWidth={1} />
      <text x={NODE_WIDTH - 33} y={22} textAnchor="middle" dominantBaseline="middle"
        fill={T.text2} fontSize={10} fontFamily={T.mono}>{tableInfo.fields.length} cols</text>

      <rect x={0} y={0} width={NODE_WIDTH - 30} height={NODE_HEADER_H} rx={4}
        fill="transparent" style={{ cursor:"move" }}
        onMouseDown={e => { e.stopPropagation(); onStartDrag(e, node.id); }}
      />

      <rect x={NODE_WIDTH - 28} y={NODE_HEADER_H / 2 - 12} width={24} height={24} rx={3}
        fill="transparent" style={{ cursor:"pointer" }}
        onMouseEnter={e => e.currentTarget.setAttribute("fill", T.red)}
        onMouseLeave={e => e.currentTarget.setAttribute("fill", "transparent")}
        onClick={() => onRemove(node.id)}
      />
      <text x={NODE_WIDTH - 16} y={NODE_HEADER_H / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={T.text3} fontSize={12} style={{ pointerEvents:"none" }}>✕</text>

      {tableInfo.fields.map((field, i) => {
        const fy = NODE_HEADER_H + 4 + i * FIELD_H;
        const cy = fy + FIELD_H / 2;
        return (
          <g key={field.name}>
            <rect x={0} y={fy} width={NODE_WIDTH} height={FIELD_H} fill="transparent"
              onMouseEnter={e => e.currentTarget.setAttribute("fill", T.surface3)}
              onMouseLeave={e => e.currentTarget.setAttribute("fill", "transparent")} />

            <rect x={12} y={fy + 6} width={42} height={20} rx={2} fill={T.bg} stroke={T.border} strokeWidth={1} />
            <text x={33} y={fy + 16} textAnchor="middle" dominantBaseline="middle"
              fill={T.text2} fontSize={10} fontFamily={T.mono}>{field.type}</text>

            <text x={64} y={cy + 1} dominantBaseline="middle"
              fill={T.text} fontSize={13} fontFamily={T.mono}>{field.name}</text>

            {field.pk && <text x={NODE_WIDTH - 28} y={cy} dominantBaseline="middle" fontSize={12}>🔑</text>}
            {field.fk && <text x={NODE_WIDTH - 28} y={cy} dominantBaseline="middle" fontSize={12}>🔗</text>}

            <circle cx={0} cy={cy} r={6}
              fill={T.surface3} stroke={T.border2} strokeWidth={1.5}
              style={{ cursor:"crosshair", transition:"r 0.1s" }}
              onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, field.name, "left"); }}
              onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, field.name, "left"); }}
              onMouseEnter={e => { e.currentTarget.setAttribute("fill", dbColor); e.currentTarget.setAttribute("stroke", T.text); e.currentTarget.setAttribute("r", "8"); }}
              onMouseLeave={e => { e.currentTarget.setAttribute("fill", T.surface3); e.currentTarget.setAttribute("stroke", T.border2); e.currentTarget.setAttribute("r", "6"); }}
            />

            <circle cx={NODE_WIDTH} cy={cy} r={6}
              fill={T.surface3} stroke={T.border2} strokeWidth={1.5}
              style={{ cursor:"crosshair" }}
              onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, field.name, "right"); }}
              onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, field.name, "right"); }}
              onMouseEnter={e => { e.currentTarget.setAttribute("fill", dbColor); e.currentTarget.setAttribute("stroke", T.text); e.currentTarget.setAttribute("r", "8"); }}
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
  const kw = t => <span style={{ color:"#9CDCFE" }}>{t}</span>;
  const tb = t => <span style={{ color:T.accent }}>{t}</span>;
  const cl = t => <span style={{ color:T.text }}>{t}</span>;
  const nm = t => <span style={{ color:T.amber }}>{t}</span>;

  const lines = [];
  if (!nodes.length) {
    lines.push(<span key="e" style={{ color:T.text3 }}>-- Data source required.</span>);
  } else {
    lines.push(<span key="s">{kw("SELECT")}{"\n  "}{tb(nodes[0].id)}.{cl("*")}{"\n"}</span>);
    lines.push(<span key="f">{kw("FROM")} {tb(nodes[0].id)}{"\n"}</span>);
    edges.forEach((e, i) => {
      lines.push(<span key={`j${i}`}>{kw(e.type + " JOIN")} {tb(e.to)}{"\n  "}{kw("ON")} {tb(e.from)}.{cl(e.fromField)} = {tb(e.to)}.{cl(e.toField)}{"\n"}</span>);
    });
    lines.push(<span key="l">{kw("LIMIT")} {nm("100")}{kw(";")}</span>);
  }

  const plain = !nodes.length ? "-- Data source required." :
    `SELECT\n  ${nodes[0].id}.*\nFROM ${nodes[0].id}\n` +
    edges.map(e => `${e.type} JOIN ${e.to}\n  ON ${e.from}.${e.fromField} = ${e.to}.${e.toField}`).join("\n") +
    "\nLIMIT 100;";

  const copy = () => {
    try { navigator.clipboard.writeText(plain); } catch (err) {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,overflow:"hidden",marginBottom:20 }}>
      <div style={{ padding:"10px 14px",background:T.surface2,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center" }}>
        <span style={{ fontFamily:T.mono,fontSize:11,color:T.text2,fontWeight:600 }}>QUERY.SQL</span>
      </div>
      <div style={{ padding:16,fontFamily:T.mono,fontSize:13,lineHeight:1.7,color:T.text,whiteSpace:"pre",overflowX:"auto",minHeight:120 }}>{lines}</div>
      <div style={{ padding:"10px 14px",background:T.surface2,borderTop:`1px solid ${T.border}` }}>
        <button onClick={copy} style={{ padding:"6px 14px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${T.border2}`,background:T.surface,color:copied?T.green:T.text,fontFamily:T.sans,transition:"all 0.15s" }}>
          {copied ? "✓ Copied to Clipboard" : "⎘ Copy SQL"}
        </button>
      </div>
    </div>
  );
}

// ─── JOINS PANEL ─────────────────────────────────────────────────────────────
function JoinsPanel({ edges, onChangeType, onRemove }) {
  if (!edges.length) return (
    <div style={{ color:T.text3,fontSize:14,textAlign:"center",marginTop:40,lineHeight:1.6 }}>
      No active relationships. <br/>Drag between ports to configure joins.
    </div>
  );
  return (
    <div>
      {edges.map(edge => (
        <div key={edge.id} style={{ background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,padding:14,marginBottom:12,position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",left:0,top:0,bottom:0,width:4,background:edgeColor(edge.type) }}/>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
            <span style={{ fontSize:11,fontFamily:T.mono,color:T.text,background:T.surface2,border:`1px solid ${T.border2}`,padding:"4px 8px",borderRadius:2 }}>{edge.type} JOIN</span>
            <span style={{ fontSize:13,fontWeight:600,flex:1, color: T.text }}>{edge.from} → {edge.to}</span>
            <button onClick={() => onRemove(edge.id)} style={{ background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:14 }}>✕</button>
          </div>
          <div style={{ fontFamily:T.mono,fontSize:13,display:"flex",gap:8,alignItems:"center",marginBottom:14 }}>
            <span style={{ color:T.text }}>{edge.from}</span><span style={{ color:T.text3 }}>.</span><span style={{ color:T.text2 }}>{edge.fromField}</span>
            <span style={{ color:T.text3 }}>=</span>
            <span style={{ color:T.text }}>{edge.to}</span><span style={{ color:T.text3 }}>.</span><span style={{ color:T.text2 }}>{edge.toField}</span>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
            {["INNER","LEFT","RIGHT","FULL"].map(jt => (
              <button key={jt} onClick={() => onChangeType(edge.id, jt)} style={{ padding:"6px",borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono,border:`1px solid ${edge.type===jt?edgeColor(jt):T.border}`,background:edge.type===jt?`${edgeColor(jt)}20`:T.surface,color:edge.type===jt?edgeColor(jt):T.text2,cursor:"pointer",transition:"all 0.1s" }}>{jt}</button>
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
        <div key={f.id} style={{ display:"flex",gap:8,marginBottom:10,alignItems:"center" }}>
          <select value={f.col} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,col:e.target.value}:x))}
            style={{ flex:1.5,background:T.bg,border:`1px solid ${T.border2}`,borderRadius:4,padding:"8px 10px",color:f.col?T.text:T.text3,fontFamily:T.mono,fontSize:12,outline:"none" }}>
            <option value="">Select Column...</option>
            {allFields.map(fc => <option key={fc}>{fc}</option>)}
          </select>
          <select value={f.op} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,op:e.target.value}:x))}
            style={{ width:60,background:T.bg,border:`1px solid ${T.border2}`,borderRadius:4,padding:"8px 6px",color:T.text,fontFamily:T.mono,fontSize:12,outline:"none" }}>
            {["=","!=",">","<",">=","<=","LIKE","IN"].map(o => <option key={o}>{o}</option>)}
          </select>
          <input value={f.val} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,val:e.target.value}:x))} placeholder="Value"
            style={{ flex:1,background:T.bg,border:`1px solid ${T.border2}`,borderRadius:4,padding:"8px 10px",color:T.text,fontFamily:T.mono,fontSize:12,outline:"none" }}/>
          <button onClick={() => setFilters(p => p.filter(x => x.id!==f.id))}
            style={{ width:34,height:34,display:"grid",placeItems:"center",border:`1px solid ${T.border2}`,borderRadius:4,background:T.surface,color:T.text3,cursor:"pointer",fontSize:14 }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.red;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=T.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.text3;e.currentTarget.style.borderColor=T.border2;}}>✕</button>
        </div>
      ))}
      <button onClick={() => setFilters(p => [...p, { id:uid(),col:"",op:"=",val:"" }])}
        style={{ width:"100%",padding:"10px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${T.border2}`,background:T.surface,color:T.text,fontFamily:T.sans,marginTop:6 }}>
        + Add Condition
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function QueryBuilder() {
  const [nodes,     setNodes]     = useState(INITIAL_NODES);
  const [edges,     setEdges]     = useState(INITIAL_EDGES);
  const [activeTab, setActiveTab] = useState("sql");

  const [scale, setScale] = useState(1);
  const [pan,   setPan]   = useState({ x: 0, y: 0 });

  const [conn,      setConn]      = useState(null); 
  const [connMouse, setConnMouse] = useState({ x:0, y:0 });

  const svgRef  = useRef(null);
  const dragRef = useRef(null);
  const scaleRef = useRef(scale);
  const panRef   = useRef(pan);
  const nodesRef = useRef(nodes);
  
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { panRef.current   = pan;   }, [pan]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const toCanvas = useCallback((sx, sy) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (sx - rect.left - panRef.current.x) / scaleRef.current,
      y: (sy - rect.top  - panRef.current.y) / scaleRef.current,
    };
  }, []);

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

  const addTable = (name, dbKey) => {
    if (nodesRef.current.find(n => n.id === name)) return;
    const rect  = svgRef.current?.getBoundingClientRect();
    const cx    = rect ? (rect.width  / 2 - panRef.current.x) / scaleRef.current : 200;
    const cy    = rect ? (rect.height / 2 - panRef.current.y) / scaleRef.current : 200;
    const off   = nodesRef.current.length * 24;
    setNodes(p => [...p, { id:name, db:dbKey, x:cx - NODE_WIDTH/2 + off, y:cy - 80 + off }]);
  };

  const removeNode = (id) => {
    setNodes(p => p.filter(n => n.id !== id));
    setEdges(p => p.filter(e => e.from !== id && e.to !== id));
  };

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

  const autoArrange = () => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    setNodes(p => p.map((n, i) => ({ ...n, x: 80 + (i % cols) * 300, y: 80 + Math.floor(i / cols) * 260 })));
  };

  const edgePaths = useMemo(() => edges.map(e => {
    const fn = nodes.find(n => n.id === e.from);
    const tn = nodes.find(n => n.id === e.to);
    if (!fn || !tn) return null;
    const fp = portPos(fn, e.fromField, "right");
    const tp = portPos(tn, e.toField,   "left");
    if (!fp || !tp) return null;
    return { ...e, path:bez(fp.x,fp.y,tp.x,tp.y), mx:(fp.x+tp.x)/2, my:(fp.y+tp.y)/2-10, color:edgeColor(e.type) };
  }).filter(Boolean), [edges, nodes]);

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
    width:40, height:40, display:"grid", placeItems:"center", borderRadius:4,
    border:`1px solid ${T.border2}`, background:bg, color, cursor:"pointer",
    fontSize:20, fontWeight:300, fontFamily:T.mono,
    boxShadow:"0 2px 8px rgba(0,0,0,0.15)", transition:"all 0.15s",
  });

  return (
    <div style={{ display:"grid", gridTemplateRows:"60px 1fr", gridTemplateColumns:"280px 1fr 340px", height:"100vh", background:T.bg, fontFamily:T.sans, overflow:"hidden", color:T.text }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{ gridColumn:"1/-1", background:T.surface, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 24px", gap:24, zIndex:200 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,fontWeight:700,fontSize:16,letterSpacing:"0.5px",flexShrink:0, textTransform:"uppercase" }}>
          <div style={{ width:24,height:24,background:T.accent,display:"grid",placeItems:"center",color:"#fff" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          Data<span style={{ color:T.accent, fontWeight:700 }}>Forge</span>
        </div>
        <div style={{ width:1,height:24,background:T.border,flexShrink:0 }}/>
        <div style={{ fontFamily:T.mono,fontSize:13,color:T.text3,display:"flex",gap:8 }}>
          <span style={{ color:T.text3 }}>WORKSPACE /</span><span style={{ color:T.text }}>Q1_REPORT_DRAFT</span>
        </div>
        <div style={{ width:1,height:24,background:T.border,flexShrink:0 }}/>
        <div style={{ display:"flex",gap:2,background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,padding:4 }}>
          {["Query Builder","Schema","Execution History"].map(t => (
            <button key={t} style={{ padding:"6px 14px",borderRadius:2,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",fontFamily:T.sans,background:t==="Query Builder"?T.surface2:"transparent",color:t==="Query Builder"?T.text:T.text3,transition:"all 0.15s" }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft:"auto",display:"flex",gap:12,alignItems:"center" }}>
          <span style={{ fontFamily:T.mono,fontSize:13,color:T.text3, background:T.surface2, padding:"6px 12px", border:`1px solid ${T.border}`, borderRadius:4 }}>
            Tables: <strong style={{ color:T.text, fontWeight:600 }}>{nodes.length}</strong>
            <span style={{ marginLeft:16 }}>Joins: <strong style={{ color:T.text, fontWeight:600 }}>{edges.length}</strong></span>
          </span>
          {[["ghost","Reset"],["primary","Save Configuration"],["run","Execute Request"]].map(([v,l]) => (
            <button key={l} style={{ padding:"8px 16px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",fontFamily:T.sans,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",
              ...(v==="ghost"?{background:"transparent",color:T.text2,border:`1px solid ${T.border2}`}:{}),
              ...(v==="primary"?{background:T.surface3,color:T.text, border:`1px solid ${T.border2}`}:{}),
              ...(v==="run"?{background:T.accent,color:"#fff"}:{}) }}>{l}</button>
          ))}
        </div>
      </header>

      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside style={{ background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ padding:"20px 16px 12px",borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.text3,marginBottom:12 }}>Available Data Sources</div>
          <div style={{ display:"flex",alignItems:"center",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:4,padding:"10px 12px",gap:10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:13,fontFamily:T.sans,width:"100%" }} placeholder="Filter directories..."/>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"12px 8px",scrollbarWidth:"thin",scrollbarColor:`${T.border2} transparent` }}>
          {Object.entries(DB_SOURCES).map(([key,db]) => (
            <DbGroup key={key} dbKey={key} db={db} nodes={nodes} onAdd={addTable}/>
          ))}
        </div>
        <div style={{ padding:"16px",borderTop:`1px solid ${T.border}` }}>
          <button style={{ width:"100%",padding:"10px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${T.border2}`,background:T.surface2,color:T.text,fontFamily:T.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            Add Connection
          </button>
        </div>
      </aside>

      {/* ─── CANVAS ─────────────────────────────────────────────────────────── */}
      <div style={{ position:"relative",overflow:"hidden",background:T.bg,cursor:conn?"crosshair":"default" }}>
        <div style={{ position:"absolute",inset:0,backgroundImage:`radial-gradient(circle at 1px 1px,${T.border2} 1px,transparent 0)`,backgroundSize:"32px 32px",opacity:0.3,pointerEvents:"none" }}/>

        {nodes.length === 0 && (
          <div style={{ position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none",zIndex:1 }}>
            <div style={{ textAlign:"center",color:T.text3, background:T.surface, padding:"32px 48px", border:`1px solid ${T.border}`, borderRadius:4 }}>
              <div style={{ fontSize:16,fontWeight:600,color:T.text }}>Canvas is Empty</div>
              <div style={{ fontSize:13,marginTop:8, color:T.text3 }}>Select an entity from the directory to begin structuring the query.</div>
            </div>
          </div>
        )}

        <svg ref={svgRef}
          style={{ position:"absolute",inset:0,width:"100%",height:"100%",overflow:"hidden" }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
        >
          <defs>
            {[["accent",T.accent],["green",T.green],["purple",T.purple],["orange",T.amber]].map(([id,color]) => (
              <marker key={id} id={`arr-${id}`} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill={color} opacity="0.9"/>
              </marker>
            ))}
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
            {edgePaths.map(ep => {
              const ak = ep.color===T.green?"green":ep.color===T.purple?"purple":ep.color===T.amber?"orange":"accent";
              return (
                <g key={ep.id}>
                  <path d={ep.path} fill="none" stroke={ep.color} strokeWidth={10} opacity={0.05}/>
                  <path d={ep.path} fill="none" stroke={ep.color} strokeWidth={2}
                    strokeDasharray="6 4" opacity={0.8} markerEnd={`url(#arr-${ak})`} />
                  <rect x={ep.mx-26} y={ep.my-12} width={52} height={24} rx={2} fill={T.surface} stroke={ep.color} strokeWidth={1} opacity={0.95}/>
                  <text x={ep.mx} y={ep.my+1} textAnchor="middle" dominantBaseline="middle"
                    fill={T.text} fontSize={10} fontWeight="700" fontFamily={T.mono}>{ep.type}</text>
                </g>
              );
            })}

            {liveConnPath && (
              <path d={liveConnPath} fill="none" stroke={T.accent} strokeWidth={2} strokeDasharray="6 4" opacity={0.9} />
            )}

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

        <div style={{ position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",background:T.surface,border:`1px solid ${T.border}`,borderRadius:4,padding:4,display:"flex",gap:4,zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,0.2)" }}>
          {[
            ["⊞","Auto Arrange", autoArrange],
            ["⊡","Reset View",   () => { setScale(1); setPan({x:0,y:0}); }],
            [null],
            ["✕","Clear Canvas", () => { setNodes([]); setEdges([]); }],
          ].map((item, i) => {
            if (!item[0]) return <div key={i} style={{ width:1,background:T.border,margin:"4px" }}/>;
            return (
              <button key={i} title={item[1]} onClick={item[2]}
                style={{ width:34,height:34,display:"grid",placeItems:"center",borderRadius:2,border:"none",background:"transparent",color:item[1]==="Clear Canvas"?T.red:T.text2,cursor:"pointer",fontSize:16,fontFamily:T.sans,transition:"all 0.1s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=item[1]==="Clear Canvas"?T.red:T.text;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=item[1]==="Clear Canvas"?T.red:T.text2;}}
              >{item[0]}</button>
            );
          })}
        </div>

        <div style={{ position:"absolute",bottom:24,right:24,display:"flex",flexDirection:"column",alignItems:"center",gap:8,zIndex:100 }}>
          <button
            onClick={() => zoomBtn(1)}
            title="Zoom In"
            style={btnStyle()}
            onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.text;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.text2;}}
          >+</button>

          <div
            onClick={() => { setScale(1); setPan({x:0,y:0}); }}
            title="Reset zoom"
            style={{ width:40,height:40,display:"grid",placeItems:"center",borderRadius:4,border:`1px solid ${T.border2}`,background:T.surface,color:T.text3,cursor:"pointer",fontSize:11,fontFamily:T.mono,boxShadow:"0 2px 8px rgba(0,0,0,0.15)",userSelect:"none",lineHeight:1.2,textAlign:"center" }}
          >{zoomPct}<br/>%</div>

          <button
            onClick={() => zoomBtn(-1)}
            title="Zoom Out"
            style={btnStyle()}
            onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.text;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.text2;}}
          >−</button>
        </div>
      </div>

      {/* ─── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <aside style={{ background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ display:"flex",borderBottom:`1px solid ${T.border}`, background: T.bg }}>
          {[["sql","Statement"],["joins","Relations"],["columns","Attributes"],["filters","Constraints"]].map(([key,label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ flex:1,padding:"16px 8px",fontSize:12,fontWeight:700,color:activeTab===key?T.text:T.text3,cursor:"pointer",border:"none",background:activeTab===key?T.surface:"transparent",fontFamily:T.sans,letterSpacing:0.5,textTransform:"uppercase",borderTop:`3px solid ${activeTab===key?T.accent:"transparent"}`,transition:"all 0.1s" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:24,scrollbarWidth:"thin",scrollbarColor:`${T.border2} transparent` }}>
          {activeTab === "sql" && (
            <>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.text3,marginBottom:12 }}>Output Syntax</div>
              <SqlPanel nodes={nodes} edges={edges}/>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.text3,marginBottom:12 }}>Execution Parameters</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
                {[["LIMIT","100"],["OFFSET","0"]].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:11,color:T.text3,marginBottom:6,fontFamily:T.mono }}>{l}</div>
                    <input defaultValue={v} style={{ width:"100%",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:4,padding:"8px 12px",color:T.text,fontFamily:T.mono,fontSize:13,outline:"none" }}/>
                  </div>
                ))}
              </div>
              {["Distinct Results", "Include Explain Plan"].map(o => (
                <label key={o} style={{ display:"flex",alignItems:"center",gap:10,fontSize:13,color:T.text2,cursor:"pointer",marginBottom:10 }}>
                  <input type="checkbox" defaultChecked={o==="Distinct Results"} style={{ width:16, height:16, accentColor:T.accent }}/> {o}
                </label>
              ))}
            </>
          )}
          {activeTab === "joins" && (
            <>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.text3,marginBottom:12,display:"flex",justifyContent:"space-between" }}>
                <span>Active Relations</span><span style={{ color:T.text }}>{edges.length}</span>
              </div>
              <JoinsPanel edges={edges}
                onChangeType={(id,t) => setEdges(p => p.map(e => e.id===id?{...e,type:t}:e))}
                onRemove={(id) => setEdges(p => p.filter(e => e.id!==id))}/>
            </>
          )}
          {activeTab === "columns" && (
            <>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.text3,marginBottom:12 }}>Data Attributes</div>
              {nodes.map(n => {
                const db = DB_SOURCES[n.db];
                return (
                  <div key={n.id} style={{ marginBottom:20, background: T.bg, padding: 12, borderRadius: 4, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize:12,color:T.text,marginBottom:10,fontFamily:T.sans,fontWeight:600,display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ color:db.color }}>■</span>{n.id}
                    </div>
                    {db.tables[n.id].fields.map(f => (
                      <label key={f.name} style={{ display:"flex",alignItems:"center",gap:10,padding:"6px 0",cursor:"pointer" }}>
                        <input type="checkbox" defaultChecked style={{ width:16, height:16, accentColor:T.accent }}/>
                        <span style={{ fontFamily:T.mono,fontSize:13,color:T.text,flex:1 }}>{f.name}</span>
                        <span style={{ fontFamily:T.mono,fontSize:11,color:T.text3 }}>{f.type}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
              {nodes.length === 0 && <div style={{ color:T.text3,fontSize:14,textAlign:"center",marginTop:40 }}>No attributes loaded.</div>}
            </>
          )}
          {activeTab === "filters" && (
            <>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.text3,marginBottom:12 }}>Record Constraints</div>
              <FilterEditor nodes={nodes}/>
            </>
          )}
        </div>
        <div style={{ display:"flex",gap:12,padding:"20px 24px",borderTop:`1px solid ${T.border}`, background: T.surface2 }}>
          <button style={{ flex:1,padding:"12px",borderRadius:4,fontSize:14,fontWeight:600,cursor:"pointer",border:"none",background:T.accent,color:"#fff",fontFamily:T.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            ▶ Process Statement
          </button>
        </div>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:8px; height:8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2D415F; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #425A80; }
        select option { background: #111C2A; color: #F0F4F8; }
      `}</style>
    </div>
  );
}