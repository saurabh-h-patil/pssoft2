import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:         "#0a0814",
  surface:    "#110f1e",
  surface2:   "#19162c",
  surface3:   "#221e38",
  border:     "#2a2445",
  border2:    "#352e54",
  accent:     "#a78bfa",       // violet
  accentHot:  "#7c3aed",
  accentDim:  "rgba(167,139,250,0.10)",
  accentGlow: "rgba(167,139,250,0.22)",
  gold:       "#f59e0b",       // amber gold
  goldDim:    "rgba(245,158,11,0.12)",
  green:      "#10b981",
  pink:       "#ec4899",
  red:        "#f43f5e",
  cyan:       "#06b6d4",
  text:       "#ede9fe",
  text2:      "#9d8ec7",
  text3:      "#4b4270",
  mono:       "'JetBrains Mono','Cascadia Code',monospace",
  sans:       "'Outfit',sans-serif",
  display:    "'Playfair Display',serif",
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
    label: "Local Dev", type: "SQLite", color: T.gold,
    tables: {
      cache: { fields: [{ name:"key",type:"TEXT",pk:true },{ name:"value",type:"JSON" },{ name:"expires_at",type:"DATE" }] },
    },
  },
};

const INITIAL_NODES = [
  { id:"users",   db:"production", x:80,  y:80  },
  { id:"orders",  db:"production", x:460, y:200 },
  { id:"cache",   db:"local",      x:460, y:40  },
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
const NODE_WIDTH    = 230;

function nodeHeight(tableId, db) {
  const fields = DB_SOURCES[db]?.tables[tableId]?.fields ?? [];
  return NODE_HEADER_H + fields.length * FIELD_H + 10;
}

function portPos(node, fieldName, side) {
  const fields = DB_SOURCES[node.db]?.tables[node.id]?.fields ?? [];
  const idx = fields.findIndex(f => f.name === fieldName);
  if (idx === -1) return null;
  return {
    x: side === "right" ? node.x + NODE_WIDTH : node.x,
    y: node.y + NODE_HEADER_H + 5 + idx * FIELD_H + FIELD_H / 2,
  };
}

const edgeColor = t =>
  t === "LEFT" ? T.green : t === "RIGHT" ? T.pink : t === "FULL" ? T.gold : T.cyan;

// ─── DB SIDEBAR GROUP ─────────────────────────────────────────────────────────
function DbGroup({ dbKey, db, nodes, onAdd }) {
  const [open, setOpen] = useState(dbKey === "production");
  const onCanvas = name => nodes.some(n => n.id === name);
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,cursor:"pointer",userSelect:"none",transition:"background 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.background = T.surface2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width:9,height:9,borderRadius:"50%",background:db.color,boxShadow:`0 0 10px ${db.color}66`,flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12,fontWeight:700,letterSpacing:"0.02em",color:T.text }}>{db.label}</div>
          <div style={{ fontSize:10,color:T.text3,fontFamily:T.mono,marginTop:1 }}>{db.type}</div>
        </div>
        <div style={{ fontSize:9,color:T.text3,transform:open?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.25s" }}>▶</div>
      </div>
      {open && (
        <div style={{ paddingLeft:18,paddingBottom:4 }}>
          {Object.keys(db.tables).map(tbl => {
            const active = onCanvas(tbl);
            return (
              <div key={tbl}
                onClick={() => !active && onAdd(tbl, dbKey)}
                style={{
                  display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:8,
                  cursor:active?"default":"pointer",margin:"2px 0",
                  background:active ? T.accentDim : "transparent",
                  border:`1px solid ${active ? T.accent+"44" : "transparent"}`,
                  transition:"all 0.18s"
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surface2; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? T.accentDim : "transparent"; }}
              >
                <div style={{ width:5,height:5,borderRadius:"50%",background:active?T.accent:T.text3,transition:"background 0.15s",flexShrink:0 }}/>
                <span style={{ fontSize:12.5,flex:1,fontWeight:active?600:400,color:active?T.accent:T.text2,fontFamily:T.mono }}>{tbl}</span>
                <span style={{ fontSize:10,color:T.text3,fontFamily:T.mono,background:T.bg,padding:"1px 6px",borderRadius:4,border:`1px solid ${T.border}` }}>{db.tables[tbl].fields.length}f</span>
                {active && <div style={{ width:5,height:5,borderRadius:"50%",background:T.gold,boxShadow:`0 0 6px ${T.gold}` }}/>}
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
      {/* Outer glow */}
      <rect x={-2} y={-2} width={NODE_WIDTH+4} height={nh+4} rx={15}
        fill="none" stroke={isSource ? dbColor : T.border2}
        strokeWidth={isSource ? 2 : 0} opacity={0.5}/>
      {/* Drop shadow */}
      <rect x={6} y={10} width={NODE_WIDTH} height={nh} rx={13} fill="rgba(0,0,0,0.6)" />
      {/* Body */}
      <rect x={0} y={0} width={NODE_WIDTH} height={nh} rx={13}
        fill={T.surface} stroke={isSource ? dbColor : T.border2}
        strokeWidth={isSource ? 1.5 : 1}/>
      {/* Header gradient bg */}
      <defs>
        <linearGradient id={`hg-${node.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={dbColor} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={dbColor} stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={NODE_WIDTH} height={NODE_HEADER_H} rx={13} fill={`url(#hg-${node.id})`}/>
      <rect x={0} y={NODE_HEADER_H - 12} width={NODE_WIDTH} height={12} fill={T.surface}/>
      <line x1={0} y1={NODE_HEADER_H} x2={NODE_WIDTH} y2={NODE_HEADER_H} stroke={T.border} strokeWidth={1}/>

      {/* Left accent bar */}
      <rect x={0} y={0} width={3} height={nh} rx={2} fill={dbColor} opacity={0.9}/>

      {/* Table name */}
      <text x={22} y={NODE_HEADER_H / 2 + 1}
        dominantBaseline="middle" fill={T.text}
        fontSize={13.5} fontWeight={700} fontFamily={T.sans}>{node.id}</text>

      {/* Col count badge */}
      <rect x={NODE_WIDTH - 46} y={13} width={36} height={18} rx={6}
        fill={T.bg} stroke={T.border} strokeWidth={0.8}/>
      <text x={NODE_WIDTH - 28} y={22} textAnchor="middle" dominantBaseline="middle"
        fill={T.text3} fontSize={9.5} fontFamily={T.mono}>{tableInfo.fields.length} cols</text>

      {/* Drag handle */}
      <rect x={0} y={0} width={NODE_WIDTH - 30} height={NODE_HEADER_H} rx={13}
        fill="transparent" style={{ cursor:"move" }}
        onMouseDown={e => { e.stopPropagation(); onStartDrag(e, node.id); }}/>

      {/* Remove button */}
      <rect x={NODE_WIDTH - 26} y={NODE_HEADER_H / 2 - 11} width={22} height={22} rx={6}
        fill="transparent" style={{ cursor:"pointer" }}
        onMouseEnter={e => { e.currentTarget.setAttribute("fill","rgba(244,63,94,0.2)"); e.currentTarget.nextElementSibling.setAttribute("fill", T.red); }}
        onMouseLeave={e => { e.currentTarget.setAttribute("fill","transparent"); e.currentTarget.nextElementSibling.setAttribute("fill", T.text3); }}
        onClick={() => onRemove(node.id)}/>
      <text x={NODE_WIDTH - 15} y={NODE_HEADER_H / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={T.text3} fontSize={10} style={{ pointerEvents:"none" }}>✕</text>

      {/* Fields */}
      {tableInfo.fields.map((field, i) => {
        const fy = NODE_HEADER_H + 5 + i * FIELD_H;
        const cy = fy + FIELD_H / 2;
        const typeColor = field.pk ? T.gold : field.fk ? T.pink : T.text3;
        return (
          <g key={field.name}>
            <rect x={4} y={fy+2} width={NODE_WIDTH-8} height={FIELD_H-4} rx={6} fill="transparent"
              onMouseEnter={e => e.currentTarget.setAttribute("fill", T.surface3)}
              onMouseLeave={e => e.currentTarget.setAttribute("fill", "transparent")}/>

            {/* Type tag */}
            <rect x={12} y={fy+9} width={36} height={15} rx={4}
              fill={typeColor+"18"} stroke={typeColor+"44"} strokeWidth={0.8}/>
            <text x={30} y={fy+16.5} textAnchor="middle" dominantBaseline="middle"
              fill={typeColor} fontSize={8.5} fontFamily={T.mono} fontWeight={500}>{field.type}</text>

            {/* Field name */}
            <text x={54} y={cy} dominantBaseline="middle"
              fill={field.pk || field.fk ? T.text : T.text2}
              fontSize={12} fontFamily={T.mono} fontWeight={field.pk ? 600 : 400}>{field.name}</text>

            {field.pk && <text x={NODE_WIDTH - 26} y={cy} dominantBaseline="middle" fontSize={11} textAnchor="middle">🔑</text>}
            {field.fk && <text x={NODE_WIDTH - 26} y={cy} dominantBaseline="middle" fontSize={11} textAnchor="middle">🔗</text>}

            {/* LEFT PORT */}
            <circle cx={0} cy={cy} r={6}
              fill={T.surface2} stroke={T.border2} strokeWidth={1.5}
              style={{ cursor:"crosshair", transition:"r 0.1s" }}
              onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, field.name, "left"); }}
              onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, field.name, "left"); }}
              onMouseEnter={e => { e.currentTarget.setAttribute("fill", dbColor); e.currentTarget.setAttribute("stroke", dbColor); e.currentTarget.setAttribute("r", "8"); }}
              onMouseLeave={e => { e.currentTarget.setAttribute("fill", T.surface2); e.currentTarget.setAttribute("stroke", T.border2); e.currentTarget.setAttribute("r", "6"); }}/>

            {/* RIGHT PORT */}
            <circle cx={NODE_WIDTH} cy={cy} r={6}
              fill={T.surface2} stroke={T.border2} strokeWidth={1.5}
              style={{ cursor:"crosshair" }}
              onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, field.name, "right"); }}
              onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, field.name, "right"); }}
              onMouseEnter={e => { e.currentTarget.setAttribute("fill", dbColor); e.currentTarget.setAttribute("stroke", dbColor); e.currentTarget.setAttribute("r", "8"); }}
              onMouseLeave={e => { e.currentTarget.setAttribute("fill", T.surface2); e.currentTarget.setAttribute("stroke", T.border2); e.currentTarget.setAttribute("r", "6"); }}/>
          </g>
        );
      })}
    </g>
  );
}

// ─── SQL PANEL ────────────────────────────────────────────────────────────────
function SqlPanel({ nodes, edges }) {
  const [copied, setCopied] = useState(false);
  const kw = t => <span style={{ color:"#a78bfa" }}>{t}</span>;
  const tb = t => <span style={{ color:T.cyan }}>{t}</span>;
  const cl = t => <span style={{ color:"#34d399" }}>{t}</span>;
  const nm = t => <span style={{ color:T.gold }}>{t}</span>;

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
    try { navigator.clipboard.writeText(plain); } catch (_) {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ background:T.bg,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",marginBottom:18 }}>
      <div style={{ padding:"9px 14px",background:`linear-gradient(90deg,${T.surface2},${T.surface})`,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6 }}>
        {[T.red, T.gold, T.green].map(c => <div key={c} style={{ width:8,height:8,borderRadius:"50%",background:c,boxShadow:`0 0 4px ${c}` }}/>)}
        <span style={{ marginLeft:"auto",fontFamily:T.mono,fontSize:10,color:T.accent,background:T.accentDim,border:`1px solid ${T.accent}30`,padding:"2px 8px",borderRadius:4,letterSpacing:"0.08em" }}>SQL</span>
      </div>
      <div style={{ padding:"14px 16px",fontFamily:T.mono,fontSize:11.5,lineHeight:1.9,color:T.text,whiteSpace:"pre",overflowX:"auto",minHeight:120 }}>{lines}</div>
      <div style={{ padding:"9px 14px",background:T.surface2,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end" }}>
        <button onClick={copy} style={{ padding:"5px 14px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",border:`1px solid ${copied?T.green+"60":T.border2}`,background:copied?T.green+"18":"transparent",color:copied?T.green:T.text2,fontFamily:T.sans,transition:"all 0.2s" }}>
          {copied ? "✓ Copied!" : "⎘ Copy SQL"}
        </button>
      </div>
    </div>
  );
}

// ─── JOINS PANEL ─────────────────────────────────────────────────────────────
function JoinsPanel({ edges, onChangeType, onRemove }) {
  if (!edges.length) return (
    <div style={{ color:T.text3,fontSize:13,textAlign:"center",marginTop:50,lineHeight:1.8,padding:"0 20px" }}>
      <div style={{ fontSize:28,marginBottom:12 }}>⟷</div>
      Drag from a field port to another table's port to connect
    </div>
  );
  return (
    <div>
      {edges.map(edge => (
        <div key={edge.id} style={{ background:T.bg,border:`1px solid ${T.border}`,borderRadius:11,padding:14,marginBottom:10,position:"relative",overflow:"hidden",transition:"border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = edgeColor(edge.type)+"55"}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
          <div style={{ position:"absolute",left:0,top:0,bottom:0,width:3,background:edgeColor(edge.type),borderRadius:"2px 0 0 2px" }}/>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
            <span style={{ fontSize:10,fontFamily:T.mono,color:edgeColor(edge.type),background:`${edgeColor(edge.type)}18`,border:`1px solid ${edgeColor(edge.type)}44`,padding:"2px 8px",borderRadius:5,fontWeight:600 }}>{edge.type} JOIN</span>
            <span style={{ fontSize:12,fontWeight:600,flex:1,color:T.text }}>{edge.from} → {edge.to}</span>
            <button onClick={() => onRemove(edge.id)} style={{ background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:12,width:24,height:24,display:"grid",placeItems:"center",borderRadius:5,transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.background=T.red+"22";e.currentTarget.style.color=T.red;}}
              onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=T.text3;}}>✕</button>
          </div>
          <div style={{ fontFamily:T.mono,fontSize:11.5,display:"flex",gap:6,alignItems:"center",marginBottom:12 }}>
            <span style={{ color:T.cyan }}>{edge.from}</span><span style={{ color:T.text3 }}>.</span><span style={{ color:T.text2 }}>{edge.fromField}</span>
            <span style={{ color:T.text3,padding:"0 2px" }}>══</span>
            <span style={{ color:T.cyan }}>{edge.to}</span><span style={{ color:T.text3 }}>.</span><span style={{ color:T.text2 }}>{edge.toField}</span>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5 }}>
            {["INNER","LEFT","RIGHT","FULL"].map(jt => (
              <button key={jt} onClick={() => onChangeType(edge.id, jt)} style={{ padding:"5px 4px",borderRadius:7,fontSize:10,fontFamily:T.mono,fontWeight:600,border:`1px solid ${edge.type===jt?edgeColor(jt):T.border}`,background:edge.type===jt?`${edgeColor(jt)}18`:T.surface,color:edge.type===jt?edgeColor(jt):T.text3,cursor:"pointer",transition:"all 0.15s" }}
                onMouseEnter={e=>{ if(edge.type!==jt){e.currentTarget.style.borderColor=edgeColor(jt)+"55";e.currentTarget.style.color=edgeColor(jt);} }}
                onMouseLeave={e=>{ if(edge.type!==jt){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.text3;} }}
              >{jt}</button>
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
  const inputStyle = { background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",color:T.text,fontFamily:T.mono,fontSize:11,outline:"none",width:"100%",transition:"border-color 0.15s" };
  return (
    <div>
      {filters.map(f => (
        <div key={f.id} style={{ display:"grid",gridTemplateColumns:"1fr 70px 1fr 32px",gap:6,marginBottom:8,alignItems:"center" }}>
          <select value={f.col} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,col:e.target.value}:x))}
            style={inputStyle}>
            <option value="">Column</option>
            {allFields.map(fc => <option key={fc}>{fc}</option>)}
          </select>
          <select value={f.op} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,op:e.target.value}:x))}
            style={{...inputStyle,textAlign:"center",padding:"7px 4px"}}>
            {["=","!=",">","<",">=","<=","LIKE","IN"].map(o => <option key={o}>{o}</option>)}
          </select>
          <input value={f.val} onChange={e => setFilters(p => p.map(x => x.id===f.id?{...x,val:e.target.value}:x))} placeholder="value"
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor=T.accent}
            onBlur={e=>e.target.style.borderColor=T.border}/>
          <button onClick={() => setFilters(p => p.filter(x => x.id!==f.id))}
            style={{ height:32,display:"grid",placeItems:"center",border:`1px solid ${T.border}`,borderRadius:8,background:"transparent",color:T.text3,cursor:"pointer",fontSize:12,transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.red+"22";e.currentTarget.style.color=T.red;e.currentTarget.style.borderColor=T.red+"44";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.text3;e.currentTarget.style.borderColor=T.border;}}>✕</button>
        </div>
      ))}
      <button onClick={() => setFilters(p => [...p, { id:uid(),col:"",op:"=",val:"" }])}
        style={{ width:"100%",padding:"8px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px dashed ${T.accent}40`,background:T.accentDim,color:T.accent,fontFamily:T.sans,marginTop:4,transition:"all 0.15s" }}
        onMouseEnter={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.borderColor=T.accent+"80";}}
        onMouseLeave={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.borderColor=T.accent+"40";}}>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    const off   = nodesRef.current.length * 22;
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
    if (conn) setConnMouse(toCanvas(e.clientX, e.clientY));
  }, [conn, toCanvas]);

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
    setNodes(p => p.map((n, i) => ({ ...n, x: 80 + (i % cols) * 290, y: 80 + Math.floor(i / cols) * 260 })));
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

  const TAB_ICONS = { sql:"⌨", joins:"⟷", columns:"◫", filters:"⊜" };

  return (
    <div style={{ display:"grid", gridTemplateRows:"56px 1fr", gridTemplateColumns:`${sidebarOpen?260:0}px 1fr 320px`, height:"100vh", background:T.bg, fontFamily:T.sans, overflow:"hidden", color:T.text, transition:"grid-template-columns 0.3s ease" }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{ gridColumn:"1/-1", background:T.surface, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 16px", gap:14, zIndex:200 }}>

        {/* Sidebar Toggle */}
        <button onClick={() => setSidebarOpen(o => !o)}
          style={{ width:32,height:32,display:"grid",placeItems:"center",borderRadius:8,border:`1px solid ${T.border2}`,background:"transparent",color:T.text2,cursor:"pointer",fontSize:14,flexShrink:0,transition:"all 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.text2;}}>
          {sidebarOpen ? "◁" : "▷"}
        </button>

        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:9,flexShrink:0 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${T.accentHot},${T.accent})`,display:"grid",placeItems:"center",fontSize:14,boxShadow:`0 0 18px ${T.accent}44` }}>⚡</div>
          <span style={{ fontSize:16,fontWeight:800,letterSpacing:"-0.5px",fontFamily:T.display }}>Query<span style={{ color:T.gold }}>Forge</span></span>
        </div>

        <div style={{ width:1,height:24,background:T.border }}/>

        {/* Breadcrumb */}
        <div style={{ fontFamily:T.mono,fontSize:11,color:T.text3,display:"flex",gap:5,alignItems:"center" }}>
          <span>queries</span><span style={{ color:T.border2 }}>/</span>
          <span style={{ color:T.accent,background:T.accentDim,padding:"2px 8px",borderRadius:5 }}>new-query</span>
        </div>

        <div style={{ width:1,height:24,background:T.border }}/>

        {/* Mode tabs */}
        <div style={{ display:"flex",gap:2,background:T.bg,borderRadius:9,padding:3,border:`1px solid ${T.border}` }}>
          {["Builder","Schema","History"].map(t => (
            <button key={t} style={{ padding:"5px 14px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",border:"none",fontFamily:T.sans,background:t==="Builder"?T.surface2:"transparent",color:t==="Builder"?T.text:T.text3,transition:"all 0.15s",letterSpacing:"0.02em" }}
              onMouseEnter={e=>{ if(t!=="Builder") e.currentTarget.style.color=T.text; }}
              onMouseLeave={e=>{ if(t!=="Builder") e.currentTarget.style.color=T.text3; }}
            >{t}</button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex:1 }}/>

        {/* Stats */}
        <div style={{ display:"flex",gap:6,alignItems:"center",fontFamily:T.mono,fontSize:11 }}>
          <div style={{ background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:20,padding:"4px 12px",display:"flex",gap:6,alignItems:"center" }}>
            <span style={{ color:T.text3 }}>Tables</span>
            <strong style={{ color:T.accent }}>{nodes.length}</strong>
          </div>
          <div style={{ background:T.green+"18",border:`1px solid ${T.green}33`,borderRadius:20,padding:"4px 12px",display:"flex",gap:6,alignItems:"center" }}>
            <span style={{ color:T.text3 }}>Joins</span>
            <strong style={{ color:T.green }}>{edges.length}</strong>
          </div>
        </div>

        <div style={{ width:1,height:24,background:T.border }}/>

        {/* Action buttons */}
        <div style={{ display:"flex",gap:6 }}>
          {[["transparent","↩ Undo",T.text2],["transparent","⤴ Export",T.text2]].map(([bg,l,c]) => (
            <button key={l} style={{ padding:"7px 13px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${T.border2}`,background:"transparent",color:c,fontFamily:T.sans,letterSpacing:"0.02em",transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"55";e.currentTarget.style.color=T.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border2;e.currentTarget.style.color=c;}}
            >{l}</button>
          ))}
          <button style={{ padding:"7px 13px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",border:`1px solid ${T.accent}`,background:T.accentDim,color:T.accent,fontFamily:T.sans,letterSpacing:"0.02em",transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.accent;e.currentTarget.style.color=T.bg;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.color=T.accent;}}>
            💾 Save
          </button>
          <button style={{ padding:"7px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:`linear-gradient(135deg,${T.green},#059669)`,color:"#fff",fontFamily:T.sans,boxShadow:`0 2px 14px ${T.green}44`,letterSpacing:"0.02em",transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 20px ${T.green}66`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 2px 14px ${T.green}44`;}}>
            ▶ Run Query
          </button>
        </div>
      </header>

      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside style={{ background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden",opacity:sidebarOpen?1:0,transition:"opacity 0.3s" }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
            <span style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.text3 }}>Data Sources</span>
            <span style={{ fontSize:10,color:T.text3,fontFamily:T.mono }}>{Object.keys(DB_SOURCES).length} DBs</span>
          </div>
          <div style={{ display:"flex",alignItems:"center",background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"8px 11px",gap:8,transition:"border-color 0.15s" }}
            onFocus={e=>e.currentTarget.style.borderColor=T.accent}
            onBlur={e=>e.currentTarget.style.borderColor=T.border}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input style={{ background:"none",border:"none",outline:"none",color:T.text,fontSize:12,fontFamily:T.sans,width:"100%" }} placeholder="Search tables…"/>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"8px 8px",scrollbarWidth:"thin",scrollbarColor:`${T.border2} transparent` }}>
          {Object.entries(DB_SOURCES).map(([key,db]) => (
            <DbGroup key={key} dbKey={key} db={db} nodes={nodes} onAdd={addTable}/>
          ))}
        </div>
        <div style={{ padding:"12px 14px",borderTop:`1px solid ${T.border}` }}>
          <button style={{ width:"100%",padding:"9px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px dashed ${T.gold}55`,background:T.goldDim,color:T.gold,fontFamily:T.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:7,letterSpacing:"0.02em",transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold+"99";e.currentTarget.style.background=T.goldDim;e.currentTarget.style.boxShadow=`0 0 12px ${T.gold}22`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.gold+"55";e.currentTarget.style.background=T.goldDim;e.currentTarget.style.boxShadow="none";}}>
            ⊕ Connect New Database
          </button>
        </div>
      </aside>

      {/* ─── CANVAS ─────────────────────────────────────────────────────────── */}
      <div style={{ position:"relative",overflow:"hidden",background:T.bg,cursor:conn?"crosshair":"default" }}>
        {/* Subtle grid pattern */}
        <div style={{ position:"absolute",inset:0,backgroundImage:`radial-gradient(circle at 1px 1px,${T.border} 1px,transparent 0)`,backgroundSize:"30px 30px",opacity:0.45,pointerEvents:"none" }}/>
        {/* Vignette overlay */}
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at center,transparent 60%,rgba(10,8,20,0.7) 100%)",pointerEvents:"none",zIndex:1 }}/>

        {/* Empty hint */}
        {nodes.length === 0 && (
          <div style={{ position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none",zIndex:2 }}>
            <div style={{ textAlign:"center",color:T.text3 }}>
              <div style={{ fontSize:42,marginBottom:12,filter:`drop-shadow(0 0 12px ${T.accent}44)` }}>⊕</div>
              <div style={{ fontSize:15,fontWeight:700,color:T.text2,marginBottom:6 }}>Add tables to start building</div>
              <div style={{ fontSize:12,color:T.text3,lineHeight:1.6 }}>Click a table in the sidebar · Drag to move · Connect ports</div>
            </div>
          </div>
        )}

        <svg ref={svgRef}
          style={{ position:"absolute",inset:0,width:"100%",height:"100%",overflow:"hidden",zIndex:2 }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}>
          <defs>
            {[["accent",T.accent],["green",T.green],["pink",T.pink],["gold",T.gold],["cyan",T.cyan]].map(([id,color]) => (
              <marker key={id} id={`arr-${id}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill={color} opacity="0.9"/>
              </marker>
            ))}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>

            {edgePaths.map(ep => {
              const ak = ep.color===T.green?"green":ep.color===T.pink?"pink":ep.color===T.gold?"gold":ep.color===T.cyan?"cyan":"accent";
              return (
                <g key={ep.id}>
                  <path d={ep.path} fill="none" stroke={ep.color} strokeWidth={12} opacity={0.04}/>
                  <path d={ep.path} fill="none" stroke={ep.color} strokeWidth={1.8}
                    strokeDasharray="6 4" opacity={0.85} markerEnd={`url(#arr-${ak})`}
                    style={{ animation:"dashFlow 1.4s linear infinite" }}/>
                  <rect x={ep.mx-22} y={ep.my-10} width={44} height={19} rx={6} fill={T.surface2} stroke={ep.color} strokeWidth={0.8} opacity={0.95}/>
                  <text x={ep.mx} y={ep.my+1} textAnchor="middle" dominantBaseline="middle"
                    fill={ep.color} fontSize={9} fontFamily={T.mono} fontWeight={600}>{ep.type}</text>
                </g>
              );
            })}

            {liveConnPath && (
              <path d={liveConnPath} fill="none" stroke={T.accent} strokeWidth={2}
                strokeDasharray="5 4" opacity={0.9}
                style={{ animation:"dashFlow 0.8s linear infinite" }} filter="url(#glow)"/>
            )}

            {nodes.map(node => (
              <TableNode key={node.id}
                node={node}
                db={DB_SOURCES[node.db]}
                onRemove={removeNode}
                onStartDrag={startNodeDrag}
                onPortDown={handlePortDown}
                onPortUp={handlePortUp}
                connecting={conn}/>
            ))}
          </g>
        </svg>

        {/* ── CANVAS TOOLBAR (top-center) ── */}
        <div style={{ position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",background:T.surface,border:`1px solid ${T.border2}`,borderRadius:12,padding:"5px 6px",display:"flex",gap:3,zIndex:100,boxShadow:`0 4px 24px rgba(0,0,0,0.6),0 0 0 1px ${T.border}` }}>
          {[
            ["⊕","Auto Arrange", autoArrange],
            ["⊡","Reset View",   () => { setScale(1); setPan({x:0,y:0}); }],
            [null],
            ["🗑","Clear Canvas",() => { setNodes([]); setEdges([]); }],
          ].map((item, i) => {
            if (!item[0]) return <div key={i} style={{ width:1,background:T.border,margin:"4px 3px" }}/>;
            const isRed = item[1]==="Clear Canvas";
            return (
              <button key={i} title={item[1]} onClick={item[2]}
                style={{ width:34,height:34,display:"grid",placeItems:"center",borderRadius:8,border:"none",background:"transparent",color:isRed?T.red:T.text2,cursor:"pointer",fontSize:14,fontFamily:T.sans,transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=isRed?T.red+"22":T.surface2;e.currentTarget.style.color=isRed?T.red:T.accent;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=isRed?T.red:T.text2;}}>
                {item[0]}
              </button>
            );
          })}
        </div>

        {/* ── ZOOM CONTROLS (bottom-right) ── */}
        <div style={{ position:"absolute",bottom:20,right:20,display:"flex",flexDirection:"column",alignItems:"center",gap:5,zIndex:100 }}>
          {[["Zoom In",1,"+"],["",0,""],["Zoom Out",-1,"−"]].map(([title,dir,label],i) => {
            if (!label) return (
              <div key={i} onClick={() => { setScale(1); setPan({x:0,y:0}); }}
                title="Reset zoom"
                style={{ width:38,height:38,display:"grid",placeItems:"center",borderRadius:9,border:`1px solid ${T.border2}`,background:T.surface,color:T.accent,cursor:"pointer",fontSize:10,fontFamily:T.mono,boxShadow:"0 2px 12px rgba(0,0,0,0.5)",userSelect:"none",lineHeight:1.2,textAlign:"center",fontWeight:700 }}>
                {zoomPct}%
              </div>
            );
            return (
              <button key={i} onClick={() => zoomBtn(dir)} title={title}
                style={{ width:38,height:38,display:"grid",placeItems:"center",borderRadius:9,border:`1px solid ${T.border2}`,background:T.surface,color:T.text2,cursor:"pointer",fontSize:18,fontFamily:"monospace",boxShadow:"0 2px 12px rgba(0,0,0,0.4)",transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=T.accent;e.currentTarget.style.borderColor=T.accent+"66";}}
                onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.text2;e.currentTarget.style.borderColor=T.border2;}}>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── STATUS BAR (bottom-center) ── */}
        <div style={{ position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,zIndex:100 }}>
          {[["Tables",nodes.length,T.accent,T.accentDim],["Joins",edges.length,T.green,T.green+"18"]].map(([l,v,c,bg]) => (
            <div key={l} style={{ background:bg,border:`1px solid ${c}33`,borderRadius:20,padding:"5px 16px",fontSize:11.5,color:T.text2,display:"flex",gap:8,alignItems:"center",fontFamily:T.mono,backdropFilter:"blur(8px)" }}>
              <span style={{ color:T.text3 }}>{l}</span>
              <strong style={{ color:c,fontSize:13 }}>{v}</strong>
            </div>
          ))}
          {conn && (
            <div style={{ background:T.accentDim,border:`1px solid ${T.accent}55`,borderRadius:20,padding:"5px 16px",fontSize:11.5,color:T.accent,fontFamily:T.mono,backdropFilter:"blur(8px)",animation:"pulse 1s ease-in-out infinite" }}>
              ⚡ Drop on a port to connect
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <aside style={{ background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        {/* Tab bar */}
        <div style={{ display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 4px" }}>
          {[["sql","SQL"],["joins","Joins"],["columns","Cols"],["filters","Where"]].map(([key,label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ flex:1,padding:"14px 6px",fontSize:11,fontWeight:700,color:activeTab===key?T.accent:T.text3,cursor:"pointer",border:"none",background:"transparent",fontFamily:T.sans,letterSpacing:"0.08em",textTransform:"uppercase",borderBottom:`2px solid ${activeTab===key?T.accent:"transparent"}`,marginBottom:-1,transition:"all 0.2s",display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
              <span style={{ fontSize:14 }}>{TAB_ICONS[key]}</span>
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"16px",scrollbarWidth:"thin",scrollbarColor:`${T.border2} transparent` }}>
          {activeTab === "sql" && (
            <>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.text3,marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:T.accent,boxShadow:`0 0 6px ${T.accent}` }}/>
                Generated SQL
              </div>
              <SqlPanel nodes={nodes} edges={edges}/>

              <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.text3,marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:T.gold,boxShadow:`0 0 6px ${T.gold}` }}/>
                Options
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
                {[["LIMIT","100"],["OFFSET","0"]].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:10,color:T.text3,marginBottom:5,fontFamily:T.mono,letterSpacing:"0.08em" }}>{l}</div>
                    <input defaultValue={v} style={{ width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",color:T.text,fontFamily:T.mono,fontSize:12,outline:"none",transition:"border-color 0.15s" }}
                      onFocus={e=>e.target.style.borderColor=T.accent}
                      onBlur={e=>e.target.style.borderColor=T.border}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {["Distinct","Explain"].map(o => (
                  <label key={o} style={{ display:"flex",alignItems:"center",gap:10,fontSize:12,color:T.text2,cursor:"pointer",padding:"6px 10px",borderRadius:8,transition:"background 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <input type="checkbox" defaultChecked={o==="Distinct"} style={{ accentColor:T.accent,width:14,height:14 }}/>{o} results
                  </label>
                ))}
              </div>
            </>
          )}

          {activeTab === "joins" && (
            <>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.text3,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <div style={{ width:6,height:6,borderRadius:"50%",background:T.cyan,boxShadow:`0 0 6px ${T.cyan}` }}/>
                  Active Joins
                </div>
                <span style={{ color:T.cyan,background:T.cyan+"18",border:`1px solid ${T.cyan}33`,padding:"2px 8px",borderRadius:10,fontFamily:T.mono }}>{edges.length}</span>
              </div>
              <JoinsPanel edges={edges}
                onChangeType={(id,t) => setEdges(p => p.map(e => e.id===id?{...e,type:t}:e))}
                onRemove={(id) => setEdges(p => p.filter(e => e.id!==id))}/>
            </>
          )}

          {activeTab === "columns" && (
            <>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.text3,marginBottom:12,display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:T.pink,boxShadow:`0 0 6px ${T.pink}` }}/>
                Select Columns
              </div>
              {nodes.map(n => {
                const db = DB_SOURCES[n.db];
                return (
                  <div key={n.id} style={{ marginBottom:16,background:T.bg,borderRadius:10,border:`1px solid ${T.border}`,overflow:"hidden" }}>
                    <div style={{ padding:"9px 12px",background:`${db.color}12`,borderBottom:`1px solid ${db.color}22`,display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:6,height:6,borderRadius:"50%",background:db.color,boxShadow:`0 0 6px ${db.color}` }}/>
                      <span style={{ fontFamily:T.mono,fontSize:12,color:db.color,fontWeight:600 }}>{n.id}</span>
                    </div>
                    {db.tables[n.id].fields.map(f => (
                      <label key={f.name} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 12px",cursor:"pointer",borderBottom:`1px solid ${T.border}40`,transition:"background 0.1s" }}
                        onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <input type="checkbox" defaultChecked style={{ accentColor:T.accent,width:13,height:13 }}/>
                        <span style={{ fontFamily:T.mono,fontSize:12,color:T.text2,flex:1 }}>{f.name}</span>
                        <span style={{ fontFamily:T.mono,fontSize:9,color:T.text3,background:T.surface,border:`1px solid ${T.border}`,padding:"1px 6px",borderRadius:4 }}>{f.type}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
              {nodes.length === 0 && <div style={{ color:T.text3,fontSize:13,textAlign:"center",marginTop:50 }}>Add tables to canvas</div>}
            </>
          )}

          {activeTab === "filters" && (
            <>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.text3,marginBottom:12,display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:T.gold,boxShadow:`0 0 6px ${T.gold}` }}/>
                WHERE Conditions
              </div>
              <FilterEditor nodes={nodes}/>
            </>
          )}
        </div>

        {/* Bottom action bar */}
        <div style={{ display:"flex",gap:8,padding:"12px 14px",borderTop:`1px solid ${T.border}`,background:T.surface2 }}>
          <button style={{ flex:1,padding:"9px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:`linear-gradient(135deg,${T.green},#059669)`,color:"#fff",fontFamily:T.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:`0 2px 14px ${T.green}33`,transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 20px ${T.green}55`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 2px 14px ${T.green}33`;}}>
            ▶ Execute Query
          </button>
          <button style={{ padding:"9px 14px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${T.border2}`,background:"transparent",color:T.text2,fontFamily:T.sans,transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"66";e.currentTarget.style.color=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border2;e.currentTarget.style.color=T.text2;}}>
            ⎘ SQL
          </button>
        </div>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&family=Playfair+Display:wght@700;800&display=swap');
        @keyframes dashFlow { to { stroke-dashoffset: -10; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #352e54; border-radius: 4px; }
        select option { background: #110f1e; color: #ede9fe; }
        input::placeholder { color: #4b4270; }
      `}</style>
    </div>
  );
}
