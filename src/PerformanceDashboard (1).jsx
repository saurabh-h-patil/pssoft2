import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ── Data ────────────────────────────────────────────────────────────────────
const quarterlyData = [
  { label: "Q1'24", value: 43 },
  { label: "Q2'24", value: 31 },
  { label: "Q3'24", value: 29 },
  { label: "Q4'24", value: 68 },
  { label: "Q1'25", value: 78 },
  { label: "Q2'25", value: 47 },
  { label: "Q3'25", value: 63 },
  { label: "QTD", value: 54 },
];
const trendData = [
  { month: "Jan", product: 65, ux: 58, engineering: 72 },
  { month: "Feb", product: 71, ux: 62, engineering: 68 },
  { month: "Mar", product: 68, ux: 75, engineering: 74 },
  { month: "Apr", product: 80, ux: 78, engineering: 77 },
  { month: "May", product: 76, ux: 82, engineering: 80 },
  { month: "Jun", product: 85, ux: 79, engineering: 85 },
];
const teams = [
  { name: "Front-end", value: 91, color: "#10b981", trend: "+3%" },
  { name: "UX Design", value: 84, color: "#0ea5e9", trend: "+7%" },
  { name: "QA", value: 72, color: "#f59e0b", trend: "-1%" },
  { name: "Product", value: 65, color: "#ef4444", trend: "+2%" },
  { name: "Big Data", value: 53, color: "#ef4444", trend: "-5%" },
  { name: "Analytics", value: 47, color: "#ef4444", trend: "-8%" },
];
const navItems = [
  {
    label: "Analytics",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: "Home",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Reports",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Teams",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Configure",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M20.49 12H22M2 12h1.51M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M12 20.49V22M12 2v1.51" />
      </svg>
    ),
  },
  {
    label: "History",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

// ── Theme tokens ─────────────────────────────────────────────────────────────
const themes = {
  dark: {
    bg: "#070b1a",
    bgSidebar: "rgba(255,255,255,0.02)",
    bgCard: "rgba(255,255,255,0.03)",
    bgInput: "rgba(255,255,255,0.05)",
    bgActive: "rgba(99,102,241,0.18)",
    border: "rgba(255,255,255,0.07)",
    borderActive: "rgba(99,102,241,0.45)",
    text: "#f1f5f9",
    textSub: "rgba(255,255,255,0.45)",
    textMuted: "rgba(255,255,255,0.25)",
    navActive: "#818cf8",
    navInactive: "rgba(255,255,255,0.28)",
    positive: "#34d399",
    negative: "#f87171",
    accent1: "#818cf8",
    accent2: "#38bdf8",
    accent3: "#fbbf24",
    gridLine: "rgba(255,255,255,0.04)",
    tooltipBg: "rgba(10,12,28,0.96)",
    badgeBg: "rgba(255,255,255,0.06)",
    shadow: "0 8px 32px rgba(0,0,0,0.35)",
    trackColor: "rgba(255,255,255,0.06)",
    logoGrad: "linear-gradient(135deg,#818cf8,#38bdf8)",
    logoGlow: "0 0 20px rgba(129,140,248,0.4)",
    barLabel: "rgba(255,255,255,0.55)",
    divider: "rgba(255,255,255,0.07)",
  },
  light: {
    bg: "#eef2fb",
    bgSidebar: "#ffffff",
    bgCard: "#ffffff",
    bgInput: "#f1f5f9",
    bgActive: "rgba(99,102,241,0.08)",
    border: "#e2e8f0",
    borderActive: "rgba(99,102,241,0.5)",
    text: "#0f172a",
    textSub: "#64748b",
    textMuted: "#94a3b8",
    navActive: "#6366f1",
    navInactive: "#94a3b8",
    positive: "#059669",
    negative: "#dc2626",
    accent1: "#6366f1",
    accent2: "#0284c7",
    accent3: "#d97706",
    gridLine: "#f1f5f9",
    tooltipBg: "#ffffff",
    badgeBg: "#f1f5f9",
    shadow: "0 2px 16px rgba(15,23,42,0.07)",
    trackColor: "#e2e8f0",
    logoGrad: "linear-gradient(135deg,#6366f1,#0284c7)",
    logoGlow: "0 0 16px rgba(99,102,241,0.2)",
    barLabel: "rgba(0,0,0,0.45)",
    divider: "#e2e8f0",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function AnimatedNumber({ target, duration = 1400 }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      v += step;
      if (v >= target) {
        setCur(target);
        clearInterval(id);
      } else setCur(Math.floor(v));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return <span>{cur}</span>;
}

function CircularProgress({
  value,
  size = 126,
  sw = 10,
  color,
  trackColor,
  textColor,
}) {
  const r = (size - sw) / 2;
  const circ = r * 2 * Math.PI;
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setP(value), 250);
    return () => clearTimeout(id);
  }, [value]);
  const offset = circ - (p / 100) * circ;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)",
            filter: `drop-shadow(0 0 5px ${color}55)`,
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: textColor,
            fontFamily: "'DM Mono',monospace",
            lineHeight: 1,
          }}
        >
          {value}%
        </span>
      </div>
    </div>
  );
}

function TeamBar({ team, t, delay }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(team.value), 150 + delay);
    return () => clearTimeout(id);
  }, [team.value, delay]);
  const isPos = team.trend.startsWith("+");
  return (
    <div style={{ marginBottom: "0.7rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.3rem",
        }}
      >
        <span
          style={{ fontSize: "0.72rem", color: t.textSub, fontWeight: 500 }}
        >
          {team.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.62rem",
              color: isPos ? t.positive : t.negative,
              fontFamily: "'DM Mono',monospace",
              fontWeight: 600,
            }}
          >
            {team.trend}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: t.text,
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {team.value}%
          </span>
        </div>
      </div>
      <div
        style={{
          height: "5px",
          background: t.trackColor,
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${w}%`,
            background: team.color,
            borderRadius: "99px",
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
            boxShadow: `0 0 6px ${team.color}55`,
          }}
        />
      </div>
    </div>
  );
}

function makeTooltip(t) {
  return function CT({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: t.tooltipBg,
          border: `1px solid ${t.border}`,
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: t.shadow,
        }}
      >
        <p
          style={{
            color: t.textMuted,
            fontSize: "0.68rem",
            marginBottom: "4px",
          }}
        >
          {label}
        </p>
        {payload.map((e, i) => (
          <p
            key={i}
            style={{
              color: e.color,
              fontSize: "0.78rem",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {e.name}: {e.value}%
          </p>
        ))}
      </div>
    );
  };
}

// ── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ t, delay = 0, span = 1, children, glow = null }) {
  return (
    <div
      className="card fade-up"
      style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: "16px",
        padding: "18px",
        boxShadow: t.shadow,
        animationDelay: `${delay}s`,
        gridColumn: `span ${span}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            width: glow.size,
            height: glow.size,
            borderRadius: "50%",
            background: glow.color,
            filter: `blur(${glow.size / 2}px)`,
            opacity: glow.op || 0.1,
            top: glow.top || -30,
            left: glow.left || -30,
            pointerEvents: "none",
          }}
        />
      )}
      {children}
    </div>
  );
}

function CardLabel({ t, children, right }) {
  return (
    <div
      style={{
        fontSize: "0.6rem",
        color: t.textMuted,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{children}</span>
      {right || <span style={{ cursor: "pointer" }}>•••</span>}
    </div>
  );
}

function TabBar({ tabs, active, setActive, t }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        marginBottom: "14px",
        flexWrap: "wrap",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          style={{
            fontSize: "0.6rem",
            padding: "4px 10px",
            borderRadius: "7px",
            background: active === tab ? t.bgActive : t.bgInput,
            color: active === tab ? t.navActive : t.textMuted,
            border: `1px solid ${active === tab ? t.borderActive : t.border}`,
            fontWeight: active === tab ? 600 : 400,
            letterSpacing: "0.07em",
            transition: "all .15s ease",
            cursor: "pointer",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [isDark, setIsDark] = useState(true);
  const [activeNav, setActiveNav] = useState("Home");
  const [activeTab, setActiveTab] = useState("PRODUCT");
  const [engTab, setEngTab] = useState("SYDNEY");
  const [meetTab, setMeetTab] = useState("UX DESIGN");
  const navigate = useNavigate();

  const T = isDark ? themes.dark : themes.light;
  const CT = makeTooltip(T);

  const logo = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
    </svg>
  );

  const handleNavClick = (label) => {
    if (label === "Analytics") {
      navigate("/analytics");
    } else {
      setActiveNav(label);
    }
  };

  const tabAccent =
    activeTab === "PRODUCT"
      ? T.positive
      : activeTab === "UX DESIGN"
        ? T.accent2
        : T.accent1;
  const meetColor =
    meetTab === "PRODUCT"
      ? T.positive
      : meetTab === "UX DESIGN"
        ? T.accent2
        : T.accent1;
  const engColor =
    engTab === "NEW YORK"
      ? T.accent3
      : engTab === "PUNE"
        ? T.accent1
        : T.accent2;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.trackColor};border-radius:2px}
        .card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
        .card:hover{transform:translateY(-2px)}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{opacity:.5}50%{opacity:1}}
        .fade-up{animation:fadeUp .45s ease both}
        .live-dot{animation:pulseGlow 2s ease-in-out infinite}
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: T.bg,
          fontFamily: "'DM Sans',sans-serif",
          color: T.text,
          overflow: "hidden",
          transition: "background .3s ease",
        }}
      >
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <Sidebar
          navItems={navItems}
          onNavClick={handleNavClick}
          activeNav={activeNav}
          theme={T}
          logo={logo}
        />

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 24px",
              borderBottom: `1px solid ${T.border}`,
              background: isDark ? "rgba(255,255,255,0.01)" : T.bgCard,
              transition: "background .3s ease, border-color .3s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 700 }}>
                The Trade Desk
              </span>
              <span style={{ color: T.textMuted, fontWeight: 300 }}>—</span>
              <span
                style={{
                  fontSize: "0.88rem",
                  color: T.textSub,
                  fontWeight: 400,
                }}
              >
                Performance Management
              </span>
              <span
                style={{
                  fontSize: "0.58rem",
                  color: T.textSub,
                  background: T.badgeBg,
                  padding: "2px 8px",
                  borderRadius: "99px",
                  border: `1px solid ${T.border}`,
                  letterSpacing: "0.1em",
                }}
              >
                LIVE
              </span>
              <div
                className="live-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: T.positive,
                  boxShadow: `0 0 6px ${T.positive}`,
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Toggle */}
              <div
                onClick={() => setIsDark(!isDark)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  background: T.bgInput,
                  borderRadius: "99px",
                  padding: "5px 10px",
                  border: `1px solid ${T.border}`,
                  transition: "all .2s ease",
                }}
              >
                <span style={{ fontSize: "0.75rem" }}>
                  {isDark ? "🌙" : "☀️"}
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "18px",
                    borderRadius: "99px",
                    background: isDark ? T.accent1 : "#cbd5e1",
                    position: "relative",
                    transition: "background .25s ease",
                    border: `1px solid ${isDark ? T.borderActive : T.border}`,
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: "2px",
                      transform: isDark
                        ? "translateX(16px)"
                        : "translateX(2px)",
                      transition: "transform .25s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: T.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {isDark ? "Dark" : "Light"}
                </span>
              </div>

              {[
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>,
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>,
              ].map((icon, i) => (
                <div
                  key={i}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "9px",
                    background: T.bgInput,
                    border: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: T.textSub,
                    transition: "all .2s ease",
                  }}
                >
                  {icon}
                </div>
              ))}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "9px",
                  background: "linear-gradient(135deg,#667eea,#764ba2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                TD
              </div>
            </div>
          </div>

          {/* Grid */}
          <div
            style={{
              flex: 1,
              padding: "18px 22px",
              overflow: "auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.55fr",
              gap: "13px",
            }}
          >
            {/* Card 1 – All teams QTD */}
            <Card
              T={T}
              t={T}
              delay={0.05}
              glow={isDark ? { color: T.positive, size: 80, op: 0.12 } : null}
            >
              <CardLabel t={T}>All teams · Quarter-to-quarter</CardLabel>
              <div
                style={{ display: "flex", alignItems: "flex-end", gap: "18px" }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "2.3rem",
                      fontWeight: 800,
                      fontFamily: "'DM Mono',monospace",
                      lineHeight: 1,
                      color: T.positive,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    +<AnimatedNumber target={14} />%
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      color: T.textMuted,
                      marginTop: "3px",
                    }}
                  >
                    QTD Performance
                  </div>
                </div>
                <div style={{ flex: 1, height: 46 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData.slice(-5)}>
                      <defs>
                        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={T.positive}
                            stopOpacity={isDark ? 0.28 : 0.18}
                          />
                          <stop
                            offset="95%"
                            stopColor={T.positive}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="product"
                        stroke={T.positive}
                        strokeWidth={2}
                        fill="url(#lg1)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "12px",
                  paddingTop: "10px",
                  borderTop: `1px solid ${T.divider}`,
                }}
              >
                {[
                  ["Monthly Trend", "↑ 3.2%"],
                  ["vs Last Qtr", "↑ 14%"],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: "0.58rem", color: T.textMuted }}>
                      {lbl}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: T.positive,
                        fontFamily: "'DM Mono',monospace",
                        fontWeight: 700,
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Card 2 – Product YOY */}
            <Card
              T={T}
              t={T}
              delay={0.09}
              glow={isDark ? { color: T.negative, size: 80, op: 0.1 } : null}
            >
              <CardLabel t={T}>Product team · Year-over-year</CardLabel>
              <div
                style={{ display: "flex", alignItems: "flex-end", gap: "18px" }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "2.3rem",
                      fontWeight: 800,
                      fontFamily: "'DM Mono',monospace",
                      lineHeight: 1,
                      color: T.negative,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    -<AnimatedNumber target={6} />%
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      color: T.textMuted,
                      marginTop: "3px",
                    }}
                  >
                    QTD Performance
                  </div>
                </div>
                <div style={{ flex: 1, height: 46 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData.slice(-5)}>
                      <defs>
                        <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={T.negative}
                            stopOpacity={isDark ? 0.28 : 0.18}
                          />
                          <stop
                            offset="95%"
                            stopColor={T.negative}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="engineering"
                        stroke={T.negative}
                        strokeWidth={2}
                        fill="url(#lg2)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "12px",
                  paddingTop: "10px",
                  borderTop: `1px solid ${T.divider}`,
                }}
              >
                {[
                  ["Yearly Trend", "↓ 2.8%"],
                  ["3yr Average", "-6%"],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: "0.58rem", color: T.textMuted }}>
                      {lbl}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: T.negative,
                        fontFamily: "'DM Mono',monospace",
                        fontWeight: 700,
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Card 3 – Team bars */}
            <Card T={T} t={T} delay={0.13}>
              <CardLabel t={T}>
                Top &amp; bottom 3 teams · % of goals (YTD)
              </CardLabel>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 20px",
                }}
              >
                {teams.map((team, i) => (
                  <TeamBar key={team.name} team={team} t={T} delay={i * 90} />
                ))}
              </div>
            </Card>

            {/* Card 4 – Bar chart */}
            <Card
              T={T}
              t={T}
              delay={0.17}
              span={2}
              glow={
                isDark
                  ? {
                      color: T.accent2,
                      size: 120,
                      op: 0.05,
                      top: -40,
                      left: "45%",
                    }
                  : null
              }
            >
              <CardLabel t={T}>
                Quarterly team performance · last 2 years (% of goal)
              </CardLabel>
              <TabBar
                tabs={["PRODUCT", "UX DESIGN", "ENGINEERING"]}
                active={activeTab}
                setActive={setActiveTab}
                t={T}
              />
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={quarterlyData} barSize={25}>
                  <CartesianGrid vertical={false} stroke={T.gridLine} />
                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: T.textMuted,
                      fontSize: 10,
                      fontFamily: "'DM Mono',monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={<CT />}
                    cursor={{
                      fill: isDark
                        ? "rgba(255,255,255,0.025)"
                        : "rgba(0,0,0,0.025)",
                    }}
                  />
                  <defs>
                    <linearGradient id="bgrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={tabAccent}
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor={tabAccent}
                        stopOpacity={isDark ? 0.35 : 0.5}
                      />
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey="value"
                    fill="url(#bgrad)"
                    radius={[5, 5, 0, 0]}
                    label={{
                      position: "insideBottom",
                      offset: 8,
                      fill: T.barLabel,
                      fontSize: 10,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div
                style={{
                  fontSize: "0.58rem",
                  color: T.textMuted,
                  marginTop: "6px",
                  letterSpacing: "0.08em",
                }}
              >
                LAST UPDATED 2 DAYS AGO
              </div>
            </Card>

            {/* Card 5 – Meetings */}
            <Card T={T} t={T} delay={0.21}>
              <CardLabel t={T}>Meetings attended · QTD</CardLabel>
              <TabBar
                tabs={["PRODUCT", "UX DESIGN", "ENGINEERING"]}
                active={meetTab}
                setActive={setMeetTab}
                t={T}
              />
              <CircularProgress
                value={
                  meetTab === "PRODUCT" ? 62 : meetTab === "UX DESIGN" ? 73 : 81
                }
                size={120}
                sw={10}
                color={meetColor}
                trackColor={T.trackColor}
                textColor={T.text}
              />
              <div
                style={{
                  marginTop: "14px",
                  display: "flex",
                  justifyContent: "center",
                  gap: "0",
                }}
              >
                {[
                  ["48", "TOTAL", T.text],
                  ["35", "JOINED", T.positive],
                  ["13", "MISSED", T.negative],
                ].map(([val, lbl, col], i) => (
                  <div
                    key={lbl}
                    style={{ display: "flex", alignItems: "stretch" }}
                  >
                    {i > 0 && (
                      <div
                        style={{
                          width: "1px",
                          background: T.divider,
                          margin: "0 14px",
                        }}
                      />
                    )}
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 800,
                          fontFamily: "'DM Mono',monospace",
                          color: col,
                        }}
                      >
                        {val}
                      </div>
                      <div
                        style={{
                          fontSize: "0.57rem",
                          color: T.textMuted,
                          letterSpacing: "0.1em",
                          marginTop: 2,
                        }}
                      >
                        {lbl}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Card 6 – Engineering */}
            <Card T={T} t={T} delay={0.25}>
              <CardLabel t={T}>Engineering performance · QTD</CardLabel>
              <TabBar
                tabs={["NEW YORK", "PUNE", "SYDNEY"]}
                active={engTab}
                setActive={setEngTab}
                t={T}
              />
              <CircularProgress
                value={engTab === "NEW YORK" ? 71 : engTab === "PUNE" ? 79 : 85}
                size={120}
                sw={10}
                color={engColor}
                trackColor={T.trackColor}
                textColor={T.text}
              />
              <div
                style={{
                  marginTop: "14px",
                  display: "flex",
                  gap: "7px",
                  justifyContent: "center",
                }}
              >
                {[
                  ["VELOCITY", "92", T.positive],
                  ["QUALITY", "88", T.accent2],
                  ["DELIVERY", "76", T.accent3],
                ].map(([lbl, val, col]) => (
                  <div
                    key={lbl}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      background: T.bgInput,
                      borderRadius: "10px",
                      padding: "7px 6px",
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        fontFamily: "'DM Mono',monospace",
                        color: col,
                      }}
                    >
                      {val}%
                    </div>
                    <div
                      style={{
                        fontSize: "0.54rem",
                        color: T.textMuted,
                        letterSpacing: "0.1em",
                        marginTop: 2,
                      }}
                    >
                      {lbl}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Card 7 – Trend */}
            <Card
              T={T}
              t={T}
              delay={0.29}
              span={2}
              glow={
                isDark
                  ? {
                      color: T.accent1,
                      size: 160,
                      op: 0.04,
                      top: -60,
                      left: "35%",
                    }
                  : null
              }
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: T.textMuted,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Cross-team trend · 6 months
                </div>
                <div
                  style={{ display: "flex", gap: "14px", alignItems: "center" }}
                >
                  {[
                    ["Product", T.positive],
                    ["UX Design", T.accent2],
                    ["Engineering", T.accent1],
                  ].map(([lbl, col]) => (
                    <div
                      key={lbl}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 2,
                          background: col,
                          borderRadius: 1,
                        }}
                      />
                      <span style={{ fontSize: "0.65rem", color: T.textMuted }}>
                        {lbl}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={94}>
                <AreaChart data={trendData}>
                  <defs>
                    {[
                      ["ag1", T.positive],
                      ["ag2", T.accent2],
                      ["ag3", T.accent1],
                    ].map(([id, col]) => (
                      <linearGradient
                        key={id}
                        id={id}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={col}
                          stopOpacity={isDark ? 0.2 : 0.12}
                        />
                        <stop offset="95%" stopColor={col} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{
                      fill: T.textMuted,
                      fontSize: 10,
                      fontFamily: "'DM Mono',monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <CartesianGrid stroke={T.gridLine} />
                  <Tooltip content={<CT />} />
                  <Area
                    type="monotone"
                    dataKey="product"
                    stroke={T.positive}
                    strokeWidth={2}
                    fill="url(#ag1)"
                    dot={false}
                    name="Product"
                  />
                  <Area
                    type="monotone"
                    dataKey="ux"
                    stroke={T.accent2}
                    strokeWidth={2}
                    fill="url(#ag2)"
                    dot={false}
                    name="UX Design"
                  />
                  <Area
                    type="monotone"
                    dataKey="engineering"
                    stroke={T.accent1}
                    strokeWidth={2}
                    fill="url(#ag3)"
                    dot={false}
                    name="Engineering"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
