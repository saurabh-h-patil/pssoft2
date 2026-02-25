import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── THEME (Premium FinTech & Luxury Enterprise) ─────────────────────────────
const T = {
  bg: "#080C14",          // Deep Midnight
  surface: "#111726",     // Rich Navy Surface
  surface2: "#1B243B",    // Elevated Element
  surface3: "#263351",    // Hover State
  border: "#202B44",      // Soft boundaries
  border2: "#314165",     // Active borders
  accent: "#00E5FF",      // Electric Cyan / FinTech Blue
  accentDim: "rgba(0, 229, 255, 0.12)",
  accentGlow: "rgba(0, 229, 255, 0.35)",
  green: "#00E676",       // Vibrant Market Green
  amber: "#FFC400",       // Premium Gold
  red: "#FF3D00",         // Crisp Alert Red
  purple: "#D500F9",      // Deep Neon Purple
  text: "#FFFFFF",        // Pure White for high contrast
  text2: "#94A3B8",       // Cool Slate
  text3: "#64748B",       // Dimmed Slate
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "'Inter', -apple-system, sans-serif",
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
  const dx = Math.max(Math.abs(x2-x1)*0.6, 60);
  return `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
}

const NODE_HEADER_H = 48;
const FIELD_H       = 32;
const NODE_WIDTH    = 240;

function nodeHeight(tableId, db) {
  const fields = DB_SOURCES[db]?.tables[tableId]?.fields ?? [];
  return NODE_HEADER_H + fields.length * FIELD_H + 8;
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
    <div style={{ marginBottom: 6 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex",alignItems:"center",gap:10,padding:"10px",borderRadius:8,cursor:"pointer",userSelect:"none",transition:"all 0.2s ease" }}
        onMouseEnter={e => e.currentTarget.style.background = T.surface2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width:10,height:10,borderRadius:"50%",background:db.color,boxShadow:`0 0 8px ${db.color}`,flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14,fontWeight:600, color:T.text, letterSpacing:"0.2px" }}>{db.label}</div>
          <div style={{ fontSize:11,color:T.text3,fontFamily:T.mono }}>{db.type}</div>
        </div>
        <div style={{ fontSize:10,color:T.text3,transform:open?"rotate(90deg)":"",transition:"transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>▶</div>
      </div>
      {open && (
        <div style={{ paddingLeft:18, marginTop:4 }}>
          {Object.keys(db.tables).map(tbl => {
            const active = onCanvas(tbl);
            return (
              <div key={tbl}
                onClick={() => !active && onAdd(tbl, dbKey)}
                style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,cursor:active?"default":"pointer",margin:"4px 0",
                  background:active ? T.accentDim : "transparent",
                  border:`1px solid ${active ? T.accentGlow : "transparent"}`,
                  transition:"all 0.2s ease" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surface2; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? T.accentDim : "transparent"; }}
              >
                <span style={{ fontSize:14,color:active?T.accent:T.text3 }}>⊞</span>
                <span style={{ fontSize:13,flex:1,fontWeight:500,color:active?T.text:T.text2 }}>{tbl}</span>
                <span style={{ fontSize:11,color:T.text3,fontFamily:T.mono }}>{db.tables[tbl].fields.length}c</span>
                {active && <span style={{ width:6, height:6, borderRadius:"50%", background:T.accent, boxShadow:`0 0 6px ${T.accent}` }}/>}
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
      {/* Premium Drop Shadow */}
      <rect x={0} y={10} width={NODE_WIDTH} height={nh} rx={8} fill="rgba(0,0,0,0.6)" filter="url(#premiumShadow)" />

      {/* Main Node Body */}
      <rect x={0} y={0} width={NODE_WIDTH} height={nh} rx={8}
        fill={T.surface}
        stroke={isSource ? dbColor : T.border}
        strokeWidth={isSource ? 1.5 : 1}
      />

      {/* Header with Gradient */}
      <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEADER_H} rx={8} fill="url(#headerGrad)" />
      <rect x={0} y={NODE_HEADER_H - 8} width={NODE_WIDTH} height={8} fill="url(#headerGrad)" />
      <line x1={0} y1={NODE_HEADER_H} x2={NODE_WIDTH} y2={NODE_HEADER_H} stroke={T.border2} strokeWidth={1} />

      <circle cx={18} cy={NODE_HEADER_H / 2} r={5} fill={dbColor} style={{ filter:`drop-shadow(0 0 6px ${dbColor})` }} />

      <text x={34} y={NODE_HEADER_H / 2 + 1}
        dominantBaseline="middle" fill={T.text}
        fontSize={14} fontWeight={600} fontFamily={T.sans} letterSpacing="0.5px">{node.id}</text>

      <rect x={NODE_WIDTH - 58} y={14} width={46} height={20} rx={4} fill="rgba(0,0,0,0.3)" stroke={T.border2} strokeWidth={1} />
      <text x={NODE_WIDTH - 35} y={24} textAnchor="middle" dominantBaseline="middle"
        fill={T.text2} fontSize={10} fontFamily={T.mono}>{tableInfo.fields.length} cols</text>

      <rect x={0} y={0} width={NODE_WIDTH - 30} height={NODE_HEADER_H} rx={8}
        fill="transparent" style={{ cursor:"move" }}
        onMouseDown={e => { e.stopPropagation(); onStartDrag(e, node.id); }}
      />

      <rect x={NODE_WIDTH - 28} y={NODE_HEADER_H / 2 - 12} width={24} height={24} rx={4}
        fill="transparent" style={{ cursor:"pointer", transition:"fill 0.2s" }}
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
              style={{ transition:"fill 0.2s" }}
              onMouseEnter={e => e.currentTarget.setAttribute("fill", T.surface2)}
              onMouseLeave={e => e.currentTarget.setAttribute("fill", "transparent")} />

            <rect x={14} y={fy + 6} width={46} height={20} rx={4} fill={T.bg} stroke={T.border} strokeWidth={1} />
            <text x={37} y={fy + 16} textAnchor="middle" dominantBaseline="middle"
              fill={T.accent} fontSize={10} fontFamily={T.mono}>{field.type}</text>

            <text x={70} y={cy + 1} dominantBaseline="middle"
              fill={T.text} fontSize={13} fontFamily={T.mono}>{field.name}</text>

            {field.pk && <text x={NODE_WIDTH - 28} y={cy} dominantBaseline="middle" fontSize={12} style={{filter:"drop-shadow(0 0 2px rgba(255,196,0,0.5))"}}>🔑</text>}
            {field.fk && <text x={NODE_WIDTH - 28} y={cy} dominantBaseline="middle" fontSize={12}>🔗</text>}

            <circle cx={0} cy={cy} r={6}
              fill={T.surface2} stroke={T.border2} strokeWidth={1.5}
              style={{ cursor:"crosshair", transition:"all 0.2s" }}
              onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, field.name, "left"); }}
              onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, field.name, "left"); }}
              onMouseEnter={e => { e.currentTarget.setAttribute("fill", dbColor); e.currentTarget.setAttribute("stroke", T.text); e.currentTarget.setAttribute("r", "8"); }}
              onMouseLeave={e => { e.currentTarget.setAttribute("fill", T.surface2); e.currentTarget.setAttribute("stroke", T.border2); e.currentTarget.setAttribute("r", "6"); }}
            />

            <circle cx={NODE_WIDTH} cy={cy} r={6}
              fill={T.surface2} stroke={T.border2} strokeWidth={1.5}
              style={{ cursor:"crosshair", transition:"all 0.2s" }}
              onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, field.name, "right"); }}
              onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, field.name, "right"); }}
              onMouseEnter={e => { e.currentTarget.setAttribute("fill", dbColor); e.currentTarget.setAttribute("stroke", T.text); e.currentTarget.setAttribute("r", "8"); }}
              onMouseLeave={e => { e.currentTarget.setAttribute("fill", T.surface2); e.currentTarget.setAttribute("stroke", T.border2); e.currentTarget.setAttribute("r", "6"); }}
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
  const kw = t => <span style={{ color:"#C678DD", fontWeight:600 }}>{t}</span>; // Magenta
  const tb = t => <span style={{ color:"#61AFEF" }}>{t}</span>; // Bright Blue
  const cl = t => <span style={{ color:"#E5C07B" }}>{t}</span>; // Gold
  const nm = t => <span style={{ color:"#98C379" }}>{t}</span>; // Green

  const lines = [];
  if (!nodes.length) {
    lines.push(<span key="e" style={{ color:T.text3 }}>-- Awaiting connection structure...</span>);
  } else {
    lines.push(<span key="s">{kw("SELECT")}{"\n  "}{tb(nodes[0].id)}.{cl("*")}{"\n"}</span>);
    lines.push(<span key="f">{kw("FROM")} {tb(nodes[0].id)}{"\n"}</span>);
    edges.forEach((e, i) => {
      lines.push(<span key={`j${i}`}>{kw(e.type + " JOIN")} {tb(e.to)}{"\n  "}{kw("ON")} {tb(e.from)}.{cl(e.fromField)} = {tb(e.to)}.{cl(e.toField)}{"\n"}</span>);
    });
    lines.push(<span key="l">{kw("LIMIT")} {nm("100")}{kw(";")}</span>);
  }

  const plain = !nodes.length ? "-- Awaiting connection structure..." :
    `SELECT\n  ${nodes[0].id}.*\nFROM ${nodes[0].id}\n` +
    edges.map(e => `${e.type} JOIN ${e.to}\n  ON ${e.from}.${e.fromField} = ${e.to}.${e.toField}`).join("\n") +
    "\nLIMIT 100;";

  const copy = () => {
    try { navigator.clipboard.writeText(plain); } catch (err) {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ background:"#0d1117",border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",marginBottom:20, boxShadow:"inset 0 2px 10px rgba(0,0,0,0.5)" }}>
      <div style={{ padding:"10px 14px",background:"#161b22",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center", gap:8 }}>
        <div style={{width:10,height:10,borderRadius:"50%",background:T.red}}/>
        <div style={{width:10,height:10,borderRadius:"50%",background:T.amber}}/>
        <div style={{width:10,height:10,borderRadius:"50%",background:T.green}}/>
        <span style={{ marginLeft:"auto",fontFamily:T.mono,fontSize:11,color:T.text2,fontWeight:600 }}>QUERY_COMPILED.SQL</span>
      </div>
      <div style={{ padding:16,fontFamily:T.mono,fontSize:13,lineHeight:1.7,color:T.text,whiteSpace:"pre",overflowX:"auto",minHeight:140 }}>{lines}</div>
      <div style={{ padding:"10px 14px",background:"#161b22",borderTop:`1px solid ${T.border}` }}>
        <button onClick={copy} style={{ padding:"8px 16px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${copied?T.green:T.border2}`,background:copied?"rgba(0, 230, 118, 0.1)":"transparent",color:copied?T.green:T.text,fontFamily:T.sans,transition:"all 0.2s" }}>
          {copied ? "✓ Copied to Clipboard" : "⎘ Copy Statement"}
        </button>
      </div>
    </div>
  );
}

// ─── JOINS PANEL ─────────────────────────────────────────────────────────────
function JoinsPanel({ edges, onChangeType, onRemove }) {
  if (!edges.length) return (
    <div style={{ color:T.text3,fontSize:14,textAlign:"center",marginTop:40,lineHeight:1.6, padding:"20px", border:`1px dashed ${T.border2}`, borderRadius:8 }}>
      No relationships mapped.<br/>Drag ports between tables to connect.
    </div>
  );
  return (
    <div>
      {edges.map(edge => (
        <div key={edge.id} style={{ background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:14,marginBottom:12,position:"relative",overflow:"hidden", transition:"border 0.2s", ":hover":{borderColor:edgeColor(edge.type)} }}>
          <div style={{ position:"absolute",left:0,top:0,bottom:0,width:4,background:edgeColor(edge.type), boxShadow:`0 0 10px ${edgeColor(edge.type)}` }}/>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
            <span style={{ fontSize:11,fontFamily:T.mono,color:edgeColor(edge.type),background:`${edgeColor(edge.type)}20`,border:`1px solid ${edgeColor(edge.type)}50`,padding:"4px 8px",borderRadius:4, fontWeight:600 }}>{edge.type} JOIN</span>
            <span style={{ fontSize:13,fontWeight:600,flex:1, color: T.text }}>{edge.from} → {edge.to}</span>
            <button onClick={() => onRemove(edge.id)} style={{ background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:14, transition:"color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.color=T.red} onMouseLeave={e=>e.currentTarget.style.color=T.text3}>✕</button>
          </div>
          <div style={{ fontFamily:T.mono,fontSize:13,display:"flex",gap:8,alignItems:"center",marginBottom:14, background:T.bg, padding:"8px", borderRadius:6, border:`1px solid ${T.border}` }}>
            <span style={{ color:T.accent }}>{edge.from}</span><span style={{ color:T.text3 }}>.</span><span style={{ color:T.text2 }}>{edge.fromField}</span>
            <span style={{ color:T.text3 }}>==</span>
            <span style={{ color:T.accent }}>{edge.to}</span><span style={{ color:T.text3 }}>.</span><span style={{ color:T.text2 }}>{edge.toField}</span>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
            {["INNER","LEFT","RIGHT","FULL"].map(jt => (
              <button key={jt} onClick={() => onChangeType(edge.id, jt)} style={{ padding:"6px",borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono,border:`1px solid ${edge.type===jt?edgeColor(jt):T.border}`,background:edge.type===jt?`${edgeColor(jt)}20`:T.surface,color:edge.type===jt?edgeColor(jt):T.text2,cursor:"pointer",transition:"all 0.2s", ":hover":{background:T.surface3} }}>{jt}</button>
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
            style={{ flex:1.5,background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:6,padding:"10px",color:f.col?T.text:T.text3,fontFamily:T.mono,fontSize:12,outline:"none", transition:"border 0.2s" }}>
            <option value="">Select Column...</option>
            {allFields.map(fc => <option key={fc}>{fc}</option>)}
          </select>
          <select value={f.op} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,op:e.target.value}:x))}
            style={{ width:64,background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:6,padding:"10px 6px",color:T.accent,fontFamily:T.mono,fontSize:13,fontWeight:600,outline:"none", textAlign:"center" }}>
            {["=","!=",">","<",">=","<=","LIKE","IN"].map(o => <option key={o}>{o}</option>)}
          </select>
          <input value={f.val} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,val:e.target.value}:x))} placeholder="Value"
            style={{ flex:1,background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:6,padding:"10px",color:T.text,fontFamily:T.mono,fontSize:12,outline:"none" }}/>
          <button onClick={() => setFilters(p => p.filter(x => x.id!==f.id))}
            style={{ width:36,height:36,display:"grid",placeItems:"center",border:`1px solid ${T.border2}`,borderRadius:6,background:T.surface2,color:T.text3,cursor:"pointer",fontSize:14, transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.red;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=T.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.text3;e.currentTarget.style.borderColor=T.border2;}}>✕</button>
        </div>
      ))}
      <button onClick={() => setFilters(p => [...p, { id:uid(),col:"",op:"=",val:"" }])}
        style={{ width:"100%",padding:"12px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px dashed ${T.accent}`,background:T.accentDim,color:T.accent,fontFamily:T.sans,marginTop:6, transition:"background 0.2s" }}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(0, 229, 255, 0.2)"}
        onMouseLeave={e=>e.currentTarget.style.background=T.accentDim}
      >
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
    setNodes(p => p.map((n, i) => ({ ...n, x: 80 + (i % cols) * 320, y: 80 + Math.floor(i / cols) * 280 })));
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
  const btnStyle = (color = T.text2, bg = T.surface2) => ({
    width:42, height:42, display:"grid", placeItems:"center", borderRadius:8,
    border:`1px solid ${T.border2}`, background:bg, color, cursor:"pointer",
    fontSize:22, fontWeight:300, fontFamily:T.mono,
    boxShadow:"0 4px 12px rgba(0,0,0,0.4)", transition:"all 0.2s",
  });

  return (
    <div style={{ display:"grid", gridTemplateRows:"64px 1fr", gridTemplateColumns:"280px 1fr 360px", height:"100vh", background:T.bg, fontFamily:T.sans, overflow:"hidden", color:T.text }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{ gridColumn:"1/-1", background:T.surface, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 24px", gap:24, zIndex:200, boxShadow:"0 2px 20px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,fontWeight:800,fontSize:18,letterSpacing:"1px",flexShrink:0, textTransform:"uppercase" }}>
          <div style={{ width:32,height:32,borderRadius:8,background:`linear-gradient(135deg, ${T.accent}, #007BFF)`,display:"grid",placeItems:"center",color:"#fff", boxShadow:`0 0 15px ${T.accentGlow}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          </div>
          Data<span style={{ color:T.accent, fontWeight:400 }}>Sources</span>
        </div>
        <div style={{ width:1,height:32,background:T.border,flexShrink:0 }}/>
        <div style={{ fontFamily:T.mono,fontSize:13,color:T.text3,display:"flex",gap:8, alignItems:"center" }}>
          <span style={{ color:T.text3 }}>WORKSPACE /</span><span style={{ color:T.text, fontWeight:600, letterSpacing:"0.5px" }}>GLOBAL_MARKETS_Q1</span>
        </div>
        <div style={{ width:1,height:32,background:T.border,flexShrink:0 }}/>
        
        <div style={{ display:"flex",gap:4,background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:4 }}>
          {["Architecture","Schema","Runtime Logs"].map(t => (
            <button key={t} style={{ padding:"8px 16px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",fontFamily:T.sans,background:t==="Architecture"?T.surface2:"transparent",color:t==="Architecture"?T.text:T.text3,transition:"all 0.2s" }}>{t}</button>
          ))}
        </div>

        <div style={{ marginLeft:"auto",display:"flex",gap:14,alignItems:"center" }}>
          <span style={{ fontFamily:T.mono,fontSize:13,color:T.text2, background:T.bg, padding:"8px 16px", border:`1px solid ${T.border}`, borderRadius:8 }}>
            Nodes: <strong style={{ color:T.text, fontWeight:600 }}>{nodes.length}</strong>
            <span style={{ marginLeft:16 }}>Edges: <strong style={{ color:T.accent, fontWeight:600 }}>{edges.length}</strong></span>
          </span>
          {[["ghost","Discard"],["primary","Save State"],["run","Deploy Query"]].map(([v,l]) => (
            <button key={l} style={{ padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",fontFamily:T.sans,display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap", transition:"all 0.2s",
              ...(v==="ghost"?{background:"transparent",color:T.text2,border:`1px solid ${T.border2}`, ":hover":{background:T.surface2}}:{}),
              ...(v==="primary"?{background:T.surface3,color:T.text, border:`1px solid ${T.border2}`}:{}),
              ...(v==="run"?{background:`linear-gradient(135deg, ${T.accent}, #0088FF)`,color:"#fff", boxShadow:`0 4px 15px ${T.accentGlow}`}:{}) }}>
                {l}
            </button>
          ))}
        </div>
      </header>

      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside style={{ background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden", boxShadow:"5px 0 20px rgba(0,0,0,0.3)" }}>
        <div style={{ padding:"24px 20px 16px",borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:16 }}>System Connections</div>
          <div style={{ display:"flex",alignItems:"center",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:8,padding:"12px 14px",gap:12, transition:"border 0.2s" }} onFocus={e=>e.currentTarget.style.borderColor=T.accent} onBlur={e=>e.currentTarget.style.borderColor=T.border2}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:14,fontFamily:T.sans,width:"100%" }} placeholder="Filter registries..."/>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"16px 12px",scrollbarWidth:"thin",scrollbarColor:`${T.border2} transparent` }}>
          {Object.entries(DB_SOURCES).map(([key,db]) => (
            <DbGroup key={key} dbKey={key} db={db} nodes={nodes} onAdd={addTable}/>
          ))}
        </div>
        <div style={{ padding:"20px",borderTop:`1px solid ${T.border}`, background:T.surface2 }}>
          <button style={{ width:"100%",padding:"12px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",border:`1px solid ${T.border2}`,background:T.bg,color:T.text,fontFamily:T.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:8, transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border2;e.currentTarget.style.color=T.text;}}>
            + New Integration
          </button>
        </div>
      </aside>

      {/* ─── CANVAS ─────────────────────────────────────────────────────────── */}
      <div style={{ position:"relative",overflow:"hidden",background:T.bg,cursor:conn?"crosshair":"default" }}>
        {/* Animated Premium Grid */}
        <div style={{ position:"absolute",inset:0,backgroundImage:`radial-gradient(circle at 1px 1px,${T.border2} 1px,transparent 0)`,backgroundSize:"40px 40px",opacity:0.3,pointerEvents:"none" }}/>

        {nodes.length === 0 && (
          <div style={{ position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none",zIndex:1 }}>
            <div style={{ textAlign:"center",color:T.text3, background:T.surface, padding:"40px 60px", border:`1px solid ${T.border}`, borderRadius:12, boxShadow:"0 10px 40px rgba(0,0,0,0.5)" }}>
              <div style={{ fontSize:40,marginBottom:16, color:T.border2 }}>⊞</div>
              <div style={{ fontSize:18,fontWeight:600,color:T.text }}>Canvas Unpopulated</div>
              <div style={{ fontSize:14,marginTop:10, color:T.text3 }}>Select an entity from the directory to begin structuring the query.</div>
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
            <linearGradient id="headerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B243B"/>
              <stop offset="100%" stopColor="#111726"/>
            </linearGradient>
            <filter id="premiumShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="15" floodColor="#000" floodOpacity="0.8"/>
            </filter>
            
            {[["accent",T.accent],["green",T.green],["purple",T.purple],["orange",T.amber]].map(([id,color]) => (
              <marker key={id} id={`arr-${id}`} markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                <path d="M0,0 L12,6 L0,12 Z" fill={color} opacity="1"/>
              </marker>
            ))}
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
            {edgePaths.map(ep => {
              const ak = ep.color===T.green?"green":ep.color===T.purple?"purple":ep.color===T.amber?"orange":"accent";
              return (
                <g key={ep.id}>
                  {/* Glowing backdrop path */}
                  <path d={ep.path} fill="none" stroke={ep.color} strokeWidth={12} opacity={0.08} style={{filter:`drop-shadow(0 0 8px ${ep.color})`}}/>
                  
                  {/* ANIMATED Dash Path - The "Data Flowing" effect */}
                  <path d={ep.path} fill="none" stroke={ep.color} strokeWidth={2.5}
                    strokeDasharray="8 6" opacity={0.9} markerEnd={`url(#arr-${ak})`} 
                    style={{ animation:"dashFlow 1.2s linear infinite" }} />
                  
                  {/* Join Type Badge */}
                  <rect x={ep.mx-30} y={ep.my-14} width={60} height={28} rx={6} fill={T.surface} stroke={ep.color} strokeWidth={1.5} opacity={1} style={{boxShadow:`0 0 10px ${ep.color}`}}/>
                  <text x={ep.mx} y={ep.my+1} textAnchor="middle" dominantBaseline="middle"
                    fill={T.text} fontSize={11} fontWeight="700" fontFamily={T.mono} letterSpacing="0.5px">{ep.type}</text>
                </g>
              );
            })}

            {liveConnPath && (
              <path d={liveConnPath} fill="none" stroke={T.accent} strokeWidth={3} strokeDasharray="8 6" opacity={0.9} style={{ animation:"dashFlow 0.8s linear infinite", filter:`drop-shadow(0 0 8px ${T.accent})` }} />
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

        {/* Toolbar */}
        <div style={{ position:"absolute",top:24,left:"50%",transform:"translateX(-50%)",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:6,display:"flex",gap:6,zIndex:100,boxShadow:"0 8px 30px rgba(0,0,0,0.6)" }}>
          {[
            ["⊞","Auto Arrange", autoArrange],
            ["⊡","Reset View",   () => { setScale(1); setPan({x:0,y:0}); }],
            [null],
            ["✕","Clear Canvas", () => { setNodes([]); setEdges([]); }],
          ].map((item, i) => {
            if (!item[0]) return <div key={i} style={{ width:1,background:T.border,margin:"4px" }}/>;
            return (
              <button key={i} title={item[1]} onClick={item[2]}
                style={{ width:38,height:38,display:"grid",placeItems:"center",borderRadius:6,border:"none",background:"transparent",color:item[1]==="Clear Canvas"?T.red:T.text2,cursor:"pointer",fontSize:18,fontFamily:T.sans,transition:"all 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=item[1]==="Clear Canvas"?T.red:T.text;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=item[1]==="Clear Canvas"?T.red:T.text2;}}
              >{item[0]}</button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div style={{ position:"absolute",bottom:32,right:32,display:"flex",flexDirection:"column",alignItems:"center",gap:8,zIndex:100 }}>
          <button
            onClick={() => zoomBtn(1)}
            title="Zoom In"
            style={btnStyle()}
            onMouseEnter={e=>{e.currentTarget.style.background=T.surface3;e.currentTarget.style.color=T.text;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.text2;}}
          >+</button>

          <div
            onClick={() => { setScale(1); setPan({x:0,y:0}); }}
            title="Reset zoom"
            style={{ width:42,height:42,display:"grid",placeItems:"center",borderRadius:8,border:`1px solid ${T.border2}`,background:T.surface2,color:T.text,fontWeight:600,cursor:"pointer",fontSize:12,fontFamily:T.mono,boxShadow:"0 4px 12px rgba(0,0,0,0.4)",userSelect:"none",lineHeight:1.2,textAlign:"center", transition:"background 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.background=T.surface3}
            onMouseLeave={e=>e.currentTarget.style.background=T.surface2}
          >{zoomPct}<br/>%</div>

          <button
            onClick={() => zoomBtn(-1)}
            title="Zoom Out"
            style={btnStyle()}
            onMouseEnter={e=>{e.currentTarget.style.background=T.surface3;e.currentTarget.style.color=T.text;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.text2;}}
          >−</button>
        </div>
      </div>

      {/* ─── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <aside style={{ background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden", boxShadow:"-5px 0 20px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex",borderBottom:`1px solid ${T.border}`, background: T.bg }}>
          {[["sql","Statement"],["joins","Relations"],["columns","Attributes"],["filters","Constraints"]].map(([key,label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ flex:1,padding:"18px 8px",fontSize:12,fontWeight:700,color:activeTab===key?T.accent:T.text3,cursor:"pointer",border:"none",background:activeTab===key?T.surface:"transparent",fontFamily:T.sans,letterSpacing:1,textTransform:"uppercase",borderTop:`3px solid ${activeTab===key?T.accent:"transparent"}`,transition:"all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:24,scrollbarWidth:"thin",scrollbarColor:`${T.border2} transparent` }}>
          {activeTab === "sql" && (
            <>
              <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:16 }}>Output Syntax</div>
              <SqlPanel nodes={nodes} edges={edges}/>
              <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:16 }}>Execution Parameters</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24 }}>
                {[["LIMIT","100"],["OFFSET","0"]].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:12,color:T.text3,marginBottom:8,fontFamily:T.mono }}>{l}</div>
                    <input defaultValue={v} style={{ width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:6,padding:"10px 14px",color:T.text,fontFamily:T.mono,fontSize:14,outline:"none", transition:"border 0.2s" }} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border2}/>
                  </div>
                ))}
              </div>
              {["Distinct Results", "Include Explain Plan"].map(o => (
                <label key={o} style={{ display:"flex",alignItems:"center",gap:12,fontSize:14,color:T.text2,cursor:"pointer",marginBottom:12 }}>
                  <input type="checkbox" defaultChecked={o==="Distinct Results"} style={{ width:18, height:18, accentColor:T.accent }}/> {o}
                </label>
              ))}
            </>
          )}
          {activeTab === "joins" && (
            <>
              <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:16,display:"flex",justifyContent:"space-between" }}>
                <span>Active Relations</span><span style={{ color:T.accent, textShadow:`0 0 10px ${T.accentGlow}` }}>{edges.length}</span>
              </div>
              <JoinsPanel edges={edges}
                onChangeType={(id,t) => setEdges(p => p.map(e => e.id===id?{...e,type:t}:e))}
                onRemove={(id) => setEdges(p => p.filter(e => e.id!==id))}/>
            </>
          )}
          {activeTab === "columns" && (
            <>
              <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:16 }}>Data Attributes</div>
              {nodes.map(n => {
                const db = DB_SOURCES[n.db];
                return (
                  <div key={n.id} style={{ marginBottom:24, background: T.surface2, padding: 16, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize:13,color:T.text,marginBottom:12,fontFamily:T.sans,fontWeight:700,display:"flex",alignItems:"center",gap:10 }}>
                      <span style={{ color:db.color, filter:`drop-shadow(0 0 4px ${db.color})` }}>■</span>{n.id}
                    </div>
                    {db.tables[n.id].fields.map(f => (
                      <label key={f.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",cursor:"pointer", borderBottom:`1px solid ${T.border}` }}>
                        <input type="checkbox" defaultChecked style={{ width:18, height:18, accentColor:T.accent }}/>
                        <span style={{ fontFamily:T.mono,fontSize:14,color:T.text,flex:1 }}>{f.name}</span>
                        <span style={{ fontFamily:T.mono,fontSize:12,color:T.accent, background:T.bg, padding:"4px 8px", borderRadius:4, border:`1px solid ${T.border}` }}>{f.type}</span>
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
              <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:T.text3,marginBottom:16 }}>Record Constraints</div>
              <FilterEditor nodes={nodes}/>
            </>
          )}
        </div>
        <div style={{ display:"flex",gap:16,padding:"24px",borderTop:`1px solid ${T.border}`, background: T.surface2 }}>
          <button style={{ flex:1,padding:"14px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",border:"none",background:`linear-gradient(135deg, ${T.accent}, #0088FF)`,color:"#fff",fontFamily:T.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:10, boxShadow:`0 4px 20px ${T.accentGlow}`, transition:"transform 0.1s" }} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
            ▶ Process Statement
          </button>
        </div>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes dashFlow { 
          from { stroke-dashoffset: 28; }
          to { stroke-dashoffset: 0; } 
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:8px; height:8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #314165; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475E91; }
        select option { background: #1B243B; color: #FFFFFF; }
      `}</style>
    </div>
  );
}