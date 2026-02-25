import { useState, useRef, useEffect, useCallback } from "react";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#080b0f",
  surface: "#0e1218",
  surface2: "#141a22",
  surface3: "#1a2230",
  border: "#1c2535",
  border2: "#243040",
  accent: "#00e5ff",
  accentDim: "rgba(0,229,255,0.12)",
  accentGlow: "rgba(0,229,255,0.25)",
  green: "#00d68f",
  amber: "#ffb800",
  red: "#ff4757",
  purple: "#a78bfa",
  text: "#e2eaf5",
  text2: "#8899aa",
  text3: "#3d5066",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "'Syne', sans-serif",
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const DB_SOURCES = {
  production: {
    label: "Production DB",
    type: "PostgreSQL",
    color: T.accent,
    tables: {
      users: { fields: [{ name: "id", type: "INT", pk: true }, { name: "email", type: "TEXT" }, { name: "name", type: "VARCHAR" }, { name: "created_at", type: "DATE" }] },
      orders: { fields: [{ name: "id", type: "INT", pk: true }, { name: "user_id", type: "INT", fk: true }, { name: "total", type: "DECIMAL" }, { name: "status", type: "TEXT" }, { name: "created_at", type: "DATE" }] },
      products: { fields: [{ name: "id", type: "INT", pk: true }, { name: "name", type: "TEXT" }, { name: "price", type: "DECIMAL" }, { name: "stock", type: "INT" }, { name: "category", type: "TEXT" }] },
    },
  },
  analytics: {
    label: "Analytics DB",
    type: "MySQL",
    color: T.green,
    tables: {
      events: { fields: [{ name: "id", type: "INT", pk: true }, { name: "type", type: "TEXT" }, { name: "user_id", type: "INT", fk: true }, { name: "data", type: "JSON" }, { name: "ts", type: "DATE" }] },
      sessions: { fields: [{ name: "id", type: "TEXT", pk: true }, { name: "user_id", type: "INT", fk: true }, { name: "expires", type: "DATE" }] },
    },
  },
  local: {
    label: "Local DB",
    type: "SQLite",
    color: T.amber,
    tables: {
      cache: { fields: [{ name: "key", type: "TEXT", pk: true }, { name: "value", type: "JSON" }, { name: "expires_at", type: "DATE" }] },
    },
  },
};

const INITIAL_NODES = [
  { id: "users", db: "production", x: 120, y: 100 },
  { id: "orders", db: "production", x: 480, y: 240 },
  { id: "cache", db: "local", x: 480, y: 60 },
];

const INITIAL_EDGES = [
  { id: "e1", from: "users", fromField: "id", to: "orders", toField: "user_id", type: "INNER" },
  { id: "e2", from: "users", fromField: "id", to: "cache", toField: "key", type: "LEFT" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 8); }

function getFieldPortPos(nodeEl, fieldName, side) {
  if (!nodeEl) return null;
  const portEl = nodeEl.querySelector(`[data-field="${fieldName}"][data-side="${side}"]`);
  if (!portEl) return null;
  const canvasEl = document.getElementById("qb-canvas");
  if (!canvasEl) return null;
  const pr = portEl.getBoundingClientRect();
  const cr = canvasEl.getBoundingClientRect();
  return { x: pr.left - cr.left + pr.width / 2, y: pr.top - cr.top + pr.height / 2 };
}

function bezierPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) * 0.55 + 30;
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

// ─── INLINE STYLES ───────────────────────────────────────────────────────────
const s = {
  app: { display: "grid", gridTemplateRows: "52px 1fr", gridTemplateColumns: "264px 1fr 310px", height: "100vh", background: T.bg, fontFamily: T.sans, overflow: "hidden", color: T.text },
  header: { gridColumn: "1 / -1", background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 20, zIndex: 200 },
  logo: { display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px", whiteSpace: "nowrap", flexShrink: 0 },
  logoIcon: { width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: "grid", placeItems: "center", fontSize: 13, color: "#000", fontWeight: 900 },
  headerDivider: { width: 1, height: 24, background: T.border, flexShrink: 0 },
  breadcrumb: { fontFamily: T.mono, fontSize: 12, color: T.text3, display: "flex", gap: 6, alignItems: "center" },
  headerActions: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" },
  btn: (variant = "ghost") => ({
    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: T.sans,
    display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", whiteSpace: "nowrap",
    ...(variant === "ghost" ? { background: "transparent", color: T.text2, border: `1px solid ${T.border2}` } : {}),
    ...(variant === "primary" ? { background: T.accent, color: "#000" } : {}),
    ...(variant === "run" ? { background: T.green, color: "#000" } : {}),
    ...(variant === "danger" ? { background: T.red, color: "#fff", border: "none" } : {}),
  }),
  sidebar: { background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" },
  sidebarHead: { padding: "14px 14px 10px", borderBottom: `1px solid ${T.border}` },
  sidebarLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.text3, marginBottom: 8 },
  searchBox: { display: "flex", alignItems: "center", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", gap: 8 },
  searchInput: { background: "none", border: "none", outline: "none", color: T.text, fontSize: 12, fontFamily: T.sans, width: "100%" },
  sidebarBody: { flex: 1, overflowY: "auto", padding: "6px 8px" },
  canvas: { position: "relative", overflow: "hidden", background: T.bg, cursor: "default" },
  panel: { background: T.surface, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" },
  panelTabs: { display: "flex", borderBottom: `1px solid ${T.border}` },
  panelTab: (active) => ({ flex: 1, padding: "13px 8px", fontSize: 11, fontWeight: 700, color: active ? T.accent : T.text3, cursor: "pointer", border: "none", background: "transparent", fontFamily: T.sans, letterSpacing: 1, textTransform: "uppercase", borderBottom: `2px solid ${active ? T.accent : "transparent"}`, marginBottom: -1, transition: "all 0.15s" }),
  panelBody: { flex: 1, overflowY: "auto", padding: 16 },
  panelSection: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.text3, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" },
  runBar: { display: "flex", gap: 8, padding: "12px 14px", borderTop: `1px solid ${T.border}` },
  sqlBlock: { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 18 },
  sqlHeader: { padding: "8px 12px", background: T.surface2, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 },
  sqlCode: { padding: 14, fontFamily: T.mono, fontSize: 11.5, lineHeight: 1.8, color: T.text, whiteSpace: "pre", overflowX: "auto", minHeight: 110 },
  sqlFooter: { padding: "8px 12px", background: T.surface2, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 },
};

// ─── DB GROUP ─────────────────────────────────────────────────────────────────
function DbGroup({ dbKey, db, nodes, onAddTable }) {
  const [open, setOpen] = useState(dbKey === "production");
  const tableNames = Object.keys(db.tables);
  const onCanvas = (name) => nodes.some(n => n.id === name);

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 8, cursor: "pointer", userSelect: "none", transition: "background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = T.surface2}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: db.color, flexShrink: 0, boxShadow: `0 0 6px ${db.color}` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{db.label}</div>
          <div style={{ fontSize: 10, color: T.text3, fontFamily: T.mono }}>{db.type} · {tableNames.length} tables</div>
        </div>
        <div style={{ fontSize: 9, color: T.text3, transform: open ? "rotate(90deg)" : "", transition: "transform 0.2s" }}>▶</div>
      </div>

      {open && (
        <div style={{ paddingLeft: 14 }}>
          {tableNames.map(tbl => (
            <div
              key={tbl}
              onClick={() => !onCanvas(tbl) && onAddTable(tbl, dbKey)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7,
                cursor: onCanvas(tbl) ? "default" : "pointer", margin: "2px 0",
                background: onCanvas(tbl) ? T.accentDim : "transparent",
                border: `1px solid ${onCanvas(tbl) ? T.accentGlow : "transparent"}`,
                opacity: onCanvas(tbl) ? 1 : 0.8,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!onCanvas(tbl)) e.currentTarget.style.background = T.surface2; }}
              onMouseLeave={e => { if (!onCanvas(tbl)) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 11, color: onCanvas(tbl) ? T.accent : T.text3 }}>⊞</span>
              <span style={{ fontSize: 12.5, flex: 1, color: onCanvas(tbl) ? T.accent : T.text2 }}>{tbl}</span>
              <span style={{ fontSize: 10, color: T.text3, fontFamily: T.mono }}>{db.tables[tbl].fields.length}c</span>
              {onCanvas(tbl) && <span style={{ fontSize: 9, color: T.accent }}>●</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TABLE NODE ───────────────────────────────────────────────────────────────
function TableNode({ node, db, onRemove, onDrag, onPortMouseDown, onPortMouseUp, connectingFrom }) {
  const nodeRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    node._el = nodeRef.current;
  });

  const handleHeaderMouseDown = (e) => {
    if (e.target.closest("[data-ignore]")) return;
    e.preventDefault();
    const startX = e.clientX - node.x;
    const startY = e.clientY - node.y;
    dragRef.current = { startX, startY };

    const move = (me) => {
      onDrag(node.id, me.clientX - dragRef.current.startX, me.clientY - dragRef.current.startY);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      dragRef.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const tableInfo = db.tables[node.id];
  const dbColor = db.color;
  const isConnectingSource = connectingFrom && connectingFrom.tableId === node.id;

  return (
    <div
      ref={nodeRef}
      style={{
        position: "absolute", left: node.x, top: node.y,
        minWidth: 210, background: T.surface, border: `1px solid ${isConnectingSource ? dbColor : T.border2}`,
        borderRadius: 12, boxShadow: isConnectingSource
          ? `0 0 0 1px ${dbColor}40, 0 12px 40px rgba(0,0,0,0.5)`
          : "0 8px 32px rgba(0,0,0,0.45)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        zIndex: isConnectingSource ? 50 : 10,
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleHeaderMouseDown}
        style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, cursor: "move", borderRadius: "12px 12px 0 0", background: T.surface2 }}
      >
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dbColor, boxShadow: `0 0 6px ${dbColor}` }} />
        <span style={{ fontSize: 13, fontWeight: 700, flex: 1, letterSpacing: 0.2 }}>{node.id}</span>
        <span style={{ fontSize: 10, color: T.text3, fontFamily: T.mono, background: T.bg, padding: "2px 6px", borderRadius: 4 }}>{tableInfo.fields.length} cols</span>
        <button
          data-ignore="1"
          onClick={() => onRemove(node.id)}
          style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "transparent", color: T.text3, cursor: "pointer", display: "grid", placeItems: "center", fontSize: 10, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = T.red; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.text3; }}
        >✕</button>
      </div>

      {/* Fields */}
      {tableInfo.fields.map((field) => (
        <div
          key={field.name}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", position: "relative", transition: "background 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.background = T.surface2}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {/* LEFT PORT */}
          <FieldPort
            tableId={node.id}
            fieldName={field.name}
            side="left"
            color={dbColor}
            onMouseDown={onPortMouseDown}
            onMouseUp={onPortMouseUp}
            connectingFrom={connectingFrom}
          />

          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, background: T.bg, border: `1px solid ${T.border}`, padding: "1px 5px", borderRadius: 3, minWidth: 38, textAlign: "center" }}>{field.type}</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.text2, flex: 1 }}>{field.name}</span>
          {field.pk && <span style={{ fontSize: 10, color: T.amber }} title="Primary Key">🔑</span>}
          {field.fk && <span style={{ fontSize: 10, color: T.accent }} title="Foreign Key">🔗</span>}

          {/* RIGHT PORT */}
          <FieldPort
            tableId={node.id}
            fieldName={field.name}
            side="right"
            color={dbColor}
            onMouseDown={onPortMouseDown}
            onMouseUp={onPortMouseUp}
            connectingFrom={connectingFrom}
          />
        </div>
      ))}
    </div>
  );
}

function FieldPort({ tableId, fieldName, side, color, onMouseDown, onMouseUp, connectingFrom }) {
  const isActive = connectingFrom && connectingFrom.tableId === tableId && connectingFrom.fieldName === fieldName && connectingFrom.side === side;
  const isTarget = connectingFrom && connectingFrom.tableId !== tableId;

  return (
    <div
      data-field={fieldName}
      data-side={side}
      data-table={tableId}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, tableId, fieldName, side); }}
      onMouseUp={(e) => { e.stopPropagation(); onMouseUp(e, tableId, fieldName, side); }}
      style={{
        position: "absolute",
        [side]: -6,
        top: "50%",
        transform: "translateY(-50%)",
        width: 12, height: 12,
        borderRadius: "50%",
        background: isActive ? color : isTarget ? `${color}60` : T.surface3,
        border: `2px solid ${isActive ? color : isTarget ? color : T.border2}`,
        cursor: "crosshair",
        transition: "all 0.15s",
        zIndex: 20,
        boxShadow: isActive ? `0 0 8px ${color}` : isTarget ? `0 0 6px ${color}80` : "none",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = color;
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 0 8px ${color}`;
        e.currentTarget.style.transform = "translateY(-50%) scale(1.3)";
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = isTarget ? `${color}60` : T.surface3;
          e.currentTarget.style.borderColor = isTarget ? color : T.border2;
          e.currentTarget.style.boxShadow = isTarget ? `0 0 6px ${color}80` : "none";
        }
        e.currentTarget.style.transform = "translateY(-50%)";
      }}
    />
  );
}

// ─── SQL PANEL ────────────────────────────────────────────────────────────────
function SqlPanel({ nodes, edges }) {
  const lines = [];
  if (nodes.length === 0) {
    lines.push(<span key="empty" style={{ color: T.text3 }}>-- Add tables to the canvas</span>);
  } else {
    const kw = (t) => <span style={{ color: "#c792ea" }}>{t}</span>;
    const tbl = (t) => <span style={{ color: T.accent }}>{t}</span>;
    const col = (t) => <span style={{ color: "#82aaff" }}>{t}</span>;
    const str = (t) => <span style={{ color: T.green }}>{t}</span>;
    const num = (t) => <span style={{ color: T.amber }}>{t}</span>;

    const mainTable = nodes[0];
    lines.push(<span key="sel">{kw("SELECT")}{"\n"}</span>);
    lines.push(<span key="star">  {tbl(mainTable.id)}.* {"\n"}</span>);
    lines.push(<span key="from">{kw("FROM")} {tbl(mainTable.id)}{"\n"}</span>);

    edges.forEach((edge, i) => {
      const jt = edge.type === "LEFT" ? kw("LEFT JOIN") : kw("INNER JOIN");
      lines.push(
        <span key={`join${i}`}>
          {jt} {tbl(edge.to)}{"\n"}
          {"  "}{kw("ON")} {tbl(edge.from)}.{col(edge.fromField)} = {tbl(edge.to)}.{col(edge.toField)}{"\n"}
        </span>
      );
    });
    lines.push(<span key="limit">{kw("LIMIT")} {num("100")}{kw(";")}</span>);
  }

  const sqlText = nodes.length === 0 ? "-- Add tables to the canvas" :
    `SELECT\n  ${nodes[0]?.id}.*\nFROM ${nodes[0]?.id}\n` +
    edges.map(e => `${e.type === "LEFT" ? "LEFT" : "INNER"} JOIN ${e.to}\n  ON ${e.from}.${e.fromField} = ${e.to}.${e.toField}`).join("\n") +
    "\nLIMIT 100;";

  const copy = () => { try { navigator.clipboard.writeText(sqlText); } catch (e) {} };

  return (
    <div style={s.sqlBlock}>
      <div style={s.sqlHeader}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.red }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.amber }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green }} />
        <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 10, color: T.text3, background: T.border, padding: "2px 7px", borderRadius: 3 }}>SQL</span>
      </div>
      <div style={s.sqlCode}>{lines}</div>
      <div style={s.sqlFooter}>
        <button onClick={copy} style={s.btn("ghost")}>⎘ Copy</button>
      </div>
    </div>
  );
}

// ─── JOINS PANEL ──────────────────────────────────────────────────────────────
function JoinsPanel({ edges, onChangeType, onRemoveEdge }) {
  const JOIN_TYPES = ["INNER", "LEFT", "RIGHT", "FULL"];
  if (edges.length === 0) return (
    <div style={{ color: T.text3, fontSize: 13, textAlign: "center", marginTop: 40 }}>
      Connect table fields to create joins
    </div>
  );
  return (
    <div>
      {edges.map(edge => (
        <div key={edge.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: T.accent, borderRadius: "0 2px 2px 0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.accent, background: T.accentDim, border: `1px solid ${T.accentGlow}`, padding: "2px 8px", borderRadius: 4 }}>{edge.type} JOIN</span>
            <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{edge.from} → {edge.to}</span>
            <button onClick={() => onRemoveEdge(edge.id)} style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 12, display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <span style={{ color: T.accent }}>{edge.from}</span><span style={{ color: T.text3 }}>.</span><span style={{ color: T.text2 }}>{edge.fromField}</span>
            <span style={{ color: T.text3 }}>══</span>
            <span style={{ color: T.accent }}>{edge.to}</span><span style={{ color: T.text3 }}>.</span><span style={{ color: T.text2 }}>{edge.toField}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
            {JOIN_TYPES.map(jt => (
              <button
                key={jt}
                onClick={() => onChangeType(edge.id, jt)}
                style={{
                  padding: "4px 6px", borderRadius: 6, fontSize: 10, fontFamily: T.mono,
                  border: `1px solid ${edge.type === jt ? T.accent : T.border}`,
                  background: edge.type === jt ? T.accentDim : T.surface,
                  color: edge.type === jt ? T.accent : T.text3,
                  cursor: "pointer", transition: "all 0.15s"
                }}
              >{jt}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function QueryBuilder() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [activeTab, setActiveTab] = useState("sql");
  const [connecting, setConnecting] = useState(null); // { tableId, fieldName, side, x, y }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dbOpen, setDbOpen] = useState({ production: true, analytics: false, local: true });
  const canvasRef = useRef(null);
  const nodeRefs = useRef({});
  const [, forceUpdate] = useState(0);

  // Assign node el refs
  const setNodeRef = useCallback((id, el) => {
    nodeRefs.current[id] = el;
  }, []);

  // Force re-render for SVG positions
  useEffect(() => {
    const id = setTimeout(() => forceUpdate(n => n + 1), 60);
    return () => clearTimeout(id);
  }, [nodes]);

  const handleAddTable = (tableName, dbKey) => {
    if (nodes.find(n => n.id === tableName)) return;
    const offset = nodes.length * 30;
    setNodes(prev => [...prev, { id: tableName, db: dbKey, x: 160 + offset, y: 120 + offset }]);
    setTimeout(() => forceUpdate(n => n + 1), 60);
  };

  const handleRemoveNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
  };

  const handleDrag = useCallback((id, x, y) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n));
    forceUpdate(c => c + 1);
  }, []);

  const handlePortMouseDown = (e, tableId, fieldName, side) => {
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    setConnecting({ tableId, fieldName, side, x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top });
  };

  const handlePortMouseUp = (e, tableId, fieldName, side) => {
    if (!connecting) return;
    if (connecting.tableId === tableId) { setConnecting(null); return; }
    // Create edge: from right→left or left→right
    const from = connecting.side === "right" ? connecting : { tableId, fieldName };
    const to = connecting.side === "right" ? { tableId, fieldName } : connecting;
    const alreadyExists = edges.find(ed => ed.from === from.tableId && ed.to === to.tableId && ed.fromField === from.fieldName && ed.toField === to.fieldName);
    if (!alreadyExists) {
      setEdges(prev => [...prev, { id: uid(), from: connecting.side === "right" ? connecting.tableId : tableId, fromField: connecting.side === "right" ? connecting.fieldName : fieldName, to: connecting.side === "right" ? tableId : connecting.tableId, toField: connecting.side === "right" ? fieldName : connecting.fieldName, type: "INNER" }]);
    }
    setConnecting(null);
  };

  const handleCanvasMouseMove = (e) => {
    if (!connecting) return;
    const r = canvasRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const handleCanvasMouseUp = () => { setConnecting(null); };

  // Get port positions for edges
  const getPortPos = (tableId, fieldName, side) => {
    const nodeEl = nodeRefs.current[tableId];
    if (!nodeEl) return null;
    const portEl = nodeEl.querySelector(`[data-field="${fieldName}"][data-side="${side}"]`);
    if (!portEl || !canvasRef.current) return null;
    const pr = portEl.getBoundingClientRect();
    const cr = canvasRef.current.getBoundingClientRect();
    return { x: pr.left - cr.left + pr.width / 2, y: pr.top - cr.top + pr.height / 2 };
  };

  const computedEdges = edges.map(edge => {
    const fromPos = getPortPos(edge.from, edge.fromField, "right");
    const toPos = getPortPos(edge.to, edge.toField, "left");
    return { ...edge, fromPos, toPos, valid: fromPos && toPos };
  });

  const connectingStartPos = connecting ? getPortPos(connecting.tableId, connecting.fieldName, connecting.side) : null;

  // Edge colors
  const edgeColor = (type) => type === "LEFT" ? T.green : type === "RIGHT" ? T.purple : T.accent;

  return (
    <div style={s.app}>
      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.logo}>
          <div style={s.logoIcon}>⚡</div>
          Query<span style={{ color: T.accent }}>Forge</span>
        </div>
        <div style={s.headerDivider} />
        <div style={s.breadcrumb}>
          <span style={{ color: T.text3 }}>queries /</span>
          <span style={{ color: T.text2 }}>new-query</span>
        </div>
        <div style={s.headerDivider} />
        <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 8, padding: 3 }}>
          {["Builder", "Schema", "History"].map(t => (
            <button key={t} style={{ ...s.btn("ghost"), border: "none", background: t === "Builder" ? T.surface2 : "transparent", color: t === "Builder" ? T.text : T.text3, borderRadius: 6 }}>{t}</button>
          ))}
        </div>
        <div style={s.headerActions}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text3, fontFamily: T.mono }}>
            <span>Tables:</span><strong style={{ color: T.accent }}>{nodes.length}</strong>
            <span style={{ marginLeft: 8 }}>Joins:</span><strong style={{ color: T.green }}>{edges.length}</strong>
          </div>
          <button style={s.btn("ghost")}>↩ Undo</button>
          <button style={s.btn("primary")}>💾 Save</button>
          <button style={s.btn("run")}>▶ Run</button>
        </div>
      </header>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarHead}>
          <div style={s.sidebarLabel}>Data Sources</div>
          <div style={s.searchBox}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input style={s.searchInput} placeholder="Search tables, columns…" />
          </div>
        </div>
        <div style={{ ...s.sidebarBody, scrollbarWidth: "thin", scrollbarColor: `${T.border2} transparent` }}>
          {Object.entries(DB_SOURCES).map(([key, db]) => (
            <DbGroup key={key} dbKey={key} db={db} nodes={nodes} onAddTable={handleAddTable} />
          ))}
        </div>
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
          <button style={{ ...s.btn("ghost"), width: "100%", justifyContent: "center", color: T.accent, borderColor: `${T.accent}30`, background: T.accentDim }}>+ Connect New Database</button>
        </div>
      </aside>

      {/* ── CANVAS ── */}
      <div
        id="qb-canvas"
        ref={canvasRef}
        style={{ ...s.canvas, cursor: connecting ? "crosshair" : "default" }}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, ${T.border} 1px, transparent 0)`, backgroundSize: "28px 28px", opacity: 0.6, pointerEvents: "none" }} />

        {/* Hint */}
        {nodes.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
            <div style={{ textAlign: "center", color: T.text3 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⊕</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Click a table in the sidebar to add it</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Then drag field ports to connect tables</div>
            </div>
          </div>
        )}

        {/* SVG edges */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible", zIndex: 5 }}>
          <defs>
            {["accent", "green", "purple"].map(c => (
              <marker key={c} id={`arr-${c}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 Z" fill={c === "accent" ? T.accent : c === "green" ? T.green : T.purple} opacity="0.7" />
              </marker>
            ))}
          </defs>

          {/* Committed edges */}
          {computedEdges.filter(e => e.valid).map(edge => {
            const { fromPos: fp, toPos: tp } = edge;
            const ec = edgeColor(edge.type);
            const arrowId = ec === T.green ? "arr-green" : ec === T.purple ? "arr-purple" : "arr-accent";
            return (
              <g key={edge.id}>
                {/* Glow */}
                <path d={bezierPath(fp.x, fp.y, tp.x, tp.y)} fill="none" stroke={ec} strokeWidth={6} opacity={0.08} />
                {/* Main */}
                <path
                  d={bezierPath(fp.x, fp.y, tp.x, tp.y)}
                  fill="none"
                  stroke={ec}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  opacity={0.7}
                  markerEnd={`url(#${arrowId})`}
                  style={{ animation: "dashFlow 1.2s linear infinite" }}
                />
                {/* Label */}
                <text
                  x={(fp.x + tp.x) / 2}
                  y={(fp.y + tp.y) / 2 - 8}
                  textAnchor="middle"
                  fill={ec}
                  fontSize={9}
                  fontFamily={T.mono}
                  opacity={0.8}
                >{edge.type}</text>
              </g>
            );
          })}

          {/* In-progress connection line */}
          {connecting && connectingStartPos && (
            <path
              d={bezierPath(
                connecting.side === "right" ? connectingStartPos.x : mousePos.x,
                connecting.side === "right" ? connectingStartPos.y : mousePos.y,
                connecting.side === "right" ? mousePos.x : connectingStartPos.x,
                connecting.side === "right" ? mousePos.y : connectingStartPos.y,
              )}
              fill="none"
              stroke={T.accent}
              strokeWidth={2}
              strokeDasharray="5 4"
              opacity={0.9}
              style={{ animation: "dashFlow 0.8s linear infinite" }}
            />
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const db = DB_SOURCES[node.db];
          return (
            <div key={node.id} ref={el => { nodeRefs.current[node.id] = el; }}>
              <TableNode
                node={node}
                db={db}
                onRemove={handleRemoveNode}
                onDrag={handleDrag}
                onPortMouseDown={handlePortMouseDown}
                onPortMouseUp={handlePortMouseUp}
                connectingFrom={connecting}
              />
            </div>
          );
        })}

        {/* Canvas toolbar */}
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 10, padding: 5, display: "flex", gap: 3, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          {[["↖", "Select"], ["✋", "Pan"], ["|", null], ["⊕", "Auto-Arrange"], ["🗑", "Clear"]].map((item, i) => {
            if (item[1] === null) return <div key={i} style={{ width: 1, background: T.border, margin: "4px 2px" }} />;
            return (
              <button
                key={i}
                title={item[1]}
                onClick={() => {
                  if (item[1] === "Clear") { setNodes([]); setEdges([]); }
                  if (item[1] === "Auto-Arrange") {
                    const cols = Math.ceil(Math.sqrt(nodes.length));
                    setNodes(prev => prev.map((n, i) => ({
                      ...n,
                      x: 80 + (i % cols) * 270,
                      y: 80 + Math.floor(i / cols) * 230,
                    })));
                    setTimeout(() => forceUpdate(c => c + 1), 60);
                  }
                }}
                style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 6, border: "none", background: "transparent", color: item[1] === "Clear" ? T.red : T.text2, cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = T.surface2; e.currentTarget.style.color = item[1] === "Clear" ? T.red : T.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = item[1] === "Clear" ? T.red : T.text2; }}
              >{item[0]}</button>
            );
          })}
        </div>

        {/* Status bar */}
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
          {[["Tables", nodes.length, T.accent], ["Joins", edges.length, T.green]].map(([label, val, color]) => (
            <div key={label} style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, color: T.text2, display: "flex", gap: 6, alignItems: "center", fontFamily: T.mono }}>
              {label}: <strong style={{ color }}>{val}</strong>
            </div>
          ))}
          {connecting && (
            <div style={{ background: T.accentDim, border: `1px solid ${T.accentGlow}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, color: T.accent, fontFamily: T.mono, animation: "pulse 1s ease-in-out infinite" }}>
              ⚡ Drag to a field port to connect
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <aside style={s.panel}>
        <div style={s.panelTabs}>
          {[["sql", "SQL"], ["joins", "Joins"], ["columns", "Columns"], ["filters", "Filters"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={s.panelTab(activeTab === key)}>{label}</button>
          ))}
        </div>

        <div style={s.panelBody}>
          {activeTab === "sql" && (
            <>
              <div style={s.panelSection}>Generated SQL</div>
              <SqlPanel nodes={nodes} edges={edges} />
              <div style={s.panelSection}>Options</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[["LIMIT", "100"], ["OFFSET", "0"]].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: T.text3, marginBottom: 4, fontFamily: T.mono }}>{label}</div>
                    <input defaultValue={val} style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontFamily: T.mono, fontSize: 12, outline: "none" }} />
                  </div>
                ))}
              </div>
              {["Distinct", "Explain"].map(opt => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.text2, cursor: "pointer", marginBottom: 6 }}>
                  <input type="checkbox" defaultChecked={opt === "Distinct"} style={{ accentColor: T.accent }} />
                  {opt} results
                </label>
              ))}
            </>
          )}

          {activeTab === "joins" && (
            <>
              <div style={s.panelSection}>Active Joins ({edges.length})</div>
              <JoinsPanel
                edges={edges}
                onChangeType={(id, type) => setEdges(prev => prev.map(e => e.id === id ? { ...e, type } : e))}
                onRemoveEdge={(id) => setEdges(prev => prev.filter(e => e.id !== id))}
              />
            </>
          )}

          {activeTab === "columns" && (
            <>
              <div style={s.panelSection}>Select Columns <span style={{ color: T.accent, fontSize: 10, cursor: "pointer", letterSpacing: 0, textTransform: "none", fontWeight: 400 }}>Select All</span></div>
              {nodes.map(node => {
                const db = DB_SOURCES[node.db];
                return (
                  <div key={node.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: T.text3, marginBottom: 5, fontFamily: T.mono, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: db.color }}>●</span>{node.id}
                    </div>
                    {db.tables[node.id].fields.map(f => (
                      <label key={f.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 7, cursor: "pointer", marginBottom: 2, transition: "background 0.1s" }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: T.accent }} />
                        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.text2, flex: 1 }}>{f.name}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, background: T.bg, border: `1px solid ${T.border}`, padding: "1px 5px", borderRadius: 3 }}>{f.type}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
              {nodes.length === 0 && <div style={{ color: T.text3, fontSize: 13, textAlign: "center", marginTop: 40 }}>Add tables to select columns</div>}
            </>
          )}

          {activeTab === "filters" && (
            <>
              <div style={s.panelSection}>WHERE Conditions</div>
              <FilterEditor nodes={nodes} />
            </>
          )}
        </div>

        <div style={s.runBar}>
          <button style={{ ...s.btn("run"), flex: 1, justifyContent: "center" }}>▶ Execute Query</button>
          <button style={s.btn("ghost")}>⎘ SQL</button>
        </div>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
        @keyframes dashFlow { to { stroke-dashoffset: -10; } }
        @keyframes pulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #243040; border-radius: 4px; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}

// ─── FILTER EDITOR ────────────────────────────────────────────────────────────
function FilterEditor({ nodes }) {
  const [filters, setFilters] = useState([{ id: uid(), col: "", op: "=", val: "" }]);
  const allFields = nodes.flatMap(n => {
    const db = DB_SOURCES[n.db];
    return db.tables[n.id].fields.map(f => `${n.id}.${f.name}`);
  });

  return (
    <div>
      {filters.map((f, i) => (
        <div key={f.id} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <select
            value={f.col}
            onChange={e => setFilters(prev => prev.map(x => x.id === f.id ? { ...x, col: e.target.value } : x))}
            style={{ flex: 1.5, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: f.col ? T.text : T.text3, fontFamily: T.mono, fontSize: 11, outline: "none" }}
          >
            <option value="">Column</option>
            {allFields.map(fc => <option key={fc}>{fc}</option>)}
          </select>
          <select
            value={f.op}
            onChange={e => setFilters(prev => prev.map(x => x.id === f.id ? { ...x, op: e.target.value } : x))}
            style={{ width: 50, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 4px", color: T.text, fontFamily: T.mono, fontSize: 11, outline: "none" }}
          >
            {["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"].map(o => <option key={o}>{o}</option>)}
          </select>
          <input
            value={f.val}
            onChange={e => setFilters(prev => prev.map(x => x.id === f.id ? { ...x, val: e.target.value } : x))}
            placeholder="value"
            style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontFamily: T.mono, fontSize: 11, outline: "none" }}
          />
          <button
            onClick={() => setFilters(prev => prev.filter(x => x.id !== f.id))}
            style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: `1px solid ${T.border}`, borderRadius: 6, background: "transparent", color: T.text3, cursor: "pointer", fontSize: 12, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = T.red; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = T.red; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.text3; e.currentTarget.style.borderColor = T.border; }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={() => setFilters(prev => [...prev, { id: uid(), col: "", op: "=", val: "" }])}
        style={{ ...s.btn("ghost"), width: "100%", justifyContent: "center", color: T.accent, borderColor: `${T.accent}30`, background: T.accentDim, marginTop: 4, borderStyle: "dashed" }}
      >+ Add Filter</button>
    </div>
  );
}
