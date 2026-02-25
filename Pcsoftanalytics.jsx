import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

// ── Theme tokens (identical system as PerformanceDashboard) ──────────────────
const themes = {
  dark: {
    bg: "#070b1a",
    bgSidebar: "rgba(255,255,255,0.02)",
    bgCard: "rgba(255,255,255,0.03)",
    bgCardAlt: "rgba(255,255,255,0.05)",
    bgInput: "rgba(255,255,255,0.05)",
    bgActive: "rgba(99,102,241,0.18)",
    bgHover: "rgba(255,255,255,0.055)",
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
    accent4: "#f472b6",
    shadow: "0 8px 32px rgba(0,0,0,0.35)",
    shadowSm: "0 2px 12px rgba(0,0,0,0.25)",
    trackColor: "rgba(255,255,255,0.06)",
    badgeBg: "rgba(255,255,255,0.06)",
    divider: "rgba(255,255,255,0.07)",
    logoGrad: "linear-gradient(135deg,#818cf8,#38bdf8)",
    logoGlow: "0 0 20px rgba(129,140,248,0.4)",
    scrollbar: "rgba(255,255,255,0.1)",
    tooltipBg: "rgba(10,12,28,0.96)",
  },
  light: {
    bg: "#eef2fb",
    bgSidebar: "#ffffff",
    bgCard: "#ffffff",
    bgCardAlt: "#f8f9ff",
    bgInput: "#f1f5f9",
    bgActive: "rgba(99,102,241,0.08)",
    bgHover: "#f8f9ff",
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
    accent4: "#db2777",
    shadow: "0 2px 16px rgba(15,23,42,0.07)",
    shadowSm: "0 1px 6px rgba(15,23,42,0.06)",
    trackColor: "#e2e8f0",
    badgeBg: "#f1f5f9",
    divider: "#e2e8f0",
    logoGrad: "linear-gradient(135deg,#6366f1,#0284c7)",
    logoGlow: "0 0 16px rgba(99,102,241,0.2)",
    scrollbar: "#cbd5e1",
    tooltipBg: "#ffffff",
  },
};

// ── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  {
    label: "Total Data Sources",
    value: 24,
    change: "+12%",
    icon: "db",
    accent: "accent2",
  },
  {
    label: "Active Data Sets",
    value: 156,
    change: "+8%",
    icon: "layers",
    accent: "accent1",
  },
  {
    label: "Reports Generated",
    value: 1234,
    change: "+23%",
    icon: "trend",
    accent: "accent3",
  },
  {
    label: "Active Users",
    value: 89,
    change: "+5%",
    icon: "users",
    accent: "positive",
  },
];

const quickActions = [
  {
    label: "Data Sources",
    desc: "Connect and manage your data sources",
    icon: "db",
    accent: "accent2",
    grad: ["#38bdf8", "#818cf8"],
  },
  {
    label: "Data Sets",
    desc: "Create and manage your data sets",
    icon: "layers",
    accent: "accent1",
    grad: ["#818cf8", "#f472b6"],
  },
  {
    label: "Get Started",
    desc: "Learn how to use PCSoft Analytics",
    icon: "star",
    accent: "accent4",
    grad: ["#f472b6", "#fbbf24"],
  },
];

const activity = [
  {
    icon: "report",
    title: "New report generated",
    sub: "by Sarah Johnson",
    time: "5 minutes ago",
    color: "#818cf8",
  },
  {
    icon: "db",
    title: "Data source connected",
    sub: "PostgreSQL DB added",
    time: "23 minutes ago",
    color: "#38bdf8",
  },
  {
    icon: "layers",
    title: "Data set updated",
    sub: "Q4 Sales Dataset",
    time: "1 hour ago",
    color: "#34d399",
  },
  {
    icon: "alert",
    title: "Scheduled report failed",
    sub: "Monthly Summary",
    time: "2 hours ago",
    color: "#f87171",
  },
  {
    icon: "user",
    title: "New user joined",
    sub: "mike@company.com",
    time: "3 hours ago",
    color: "#fbbf24",
  },
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
    label: "DATASOURCEPOINT",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
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

// ── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ name, size = 18, color = "currentColor" }) {
  const s = { width: size, height: size };
  const icons = {
    home: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    db: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    layers: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    report: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    question: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    dash: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    sub: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
    trend: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    users: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    bell: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    chat: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    search: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    star: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    alert: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    user: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    arrow: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
    moon: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    sun: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    chevron: (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
  };
  return icons[name] || null;
}

// ── Animated number ───────────────────────────────────────────────────────────
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
  return <span>{cur.toLocaleString()}</span>;
}

// ── Stat card icon box ────────────────────────────────────────────────────────
function IconBox({ icon, grad, size = 44 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "12px",
        background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 4px 12px ${grad[0]}44`,
      }}
    >
      <Icon name={icon} size={size * 0.45} color="#fff" />
    </div>
  );
}

const iconGrads = {
  accent2: ["#38bdf8", "#818cf8"],
  accent1: ["#818cf8", "#f472b6"],
  accent3: ["#fbbf24", "#f97316"],
  positive: ["#34d399", "#0ea5e9"],
};
const iconGradsLight = {
  accent2: ["#0284c7", "#6366f1"],
  accent1: ["#6366f1", "#db2777"],
  accent3: ["#d97706", "#ea580c"],
  positive: ["#059669", "#0284c7"],
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PCSoftAnalytics() {
  const [isDark, setIsDark] = useState(true);
  const [activeNav, setActiveNav] = useState("Home");
  const [searchVal, setSearchVal] = useState("");
  const navigate = useNavigate();

  const T = isDark ? themes.dark : themes.light;
  const grads = isDark ? iconGrads : iconGradsLight;

  const logo = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );

  const handleNavClick = (label) => {
    if (label === "Performance") {
      navigate("/dashboard");
    }
    if (label === "Data Sources") {
      navigate("/datasource");
    } else {
      setActiveNav(label);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.scrollbar};border-radius:2px}
        button,input{font-family:inherit;outline:none;border:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{opacity:.5}50%{opacity:1}}
        .fade-up{animation:fadeUp .45s ease both}
        .live-dot{animation:pulseGlow 2s ease-in-out infinite}
        .stat-card{transition:transform .2s ease,box-shadow .2s ease}
        .stat-card:hover{transform:translateY(-3px)}
        .qa-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
        .qa-card:hover{transform:translateY(-3px)}
        .nav-item{transition:all .18s ease}
        .activity-row{transition:background .15s ease}
        .activity-row:hover{background:${T.bgHover}}
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: T.bg,
          fontFamily: "'DM Sans',sans-serif",
          color: T.text,
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

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 28px",
              borderBottom: `1px solid ${T.border}`,
              background: isDark ? "rgba(255,255,255,0.01)" : T.bgSidebar,
              transition: "background .3s ease",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: T.text,
                  letterSpacing: "-0.01em",
                }}
              >
                Welcome back, John! 👋
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: T.textSub,
                  marginTop: "2px",
                }}
              >
                Here's what's happening with your analytics today
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Theme toggle */}
              <div
                onClick={() => setIsDark(!isDark)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  background: T.bgInput,
                  borderRadius: "99px",
                  padding: "5px 12px",
                  border: `1px solid ${T.border}`,
                  transition: "all .2s ease",
                }}
              >
                <Icon
                  name={isDark ? "moon" : "sun"}
                  size={13}
                  color={T.textSub}
                />
                <div
                  style={{
                    width: "30px",
                    height: "16px",
                    borderRadius: "99px",
                    background: isDark ? T.accent1 : "#cbd5e1",
                    position: "relative",
                    transition: "background .25s ease",
                  }}
                >
                  <div
                    style={{
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: "2.5px",
                      transform: isDark
                        ? "translateX(16px)"
                        : "translateX(2.5px)",
                      transition: "transform .25s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
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

              {/* Icon buttons */}
              {[
                { icon: "moon", label: "theme" },
                { icon: "bell", label: "notif", dot: true },
                { icon: "chat", label: "chat" },
              ]
                .slice(1)
                .map(({ icon, label, dot }) => (
                  <div
                    key={label}
                    style={{
                      position: "relative",
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
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
                    <Icon name={icon} size={15} color={T.textSub} />
                    {dot && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-3px",
                          right: "-3px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#ef4444",
                          border: `2px solid ${T.bg}`,
                        }}
                      />
                    )}
                  </div>
                ))}
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg,#667eea,#764ba2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                JD
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
            {/* ── Stat cards ──────────────────────────────────────────────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "14px",
                marginBottom: "28px",
              }}
            >
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="stat-card fade-up"
                  style={{
                    background: T.bgCard,
                    border: `1px solid ${T.border}`,
                    borderRadius: "16px",
                    padding: "18px 20px",
                    boxShadow: T.shadow,
                    animationDelay: `${0.05 + i * 0.07}s`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isDark && (
                    <div
                      style={{
                        position: "absolute",
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        background: grads[s.accent][0],
                        filter: "blur(35px)",
                        opacity: 0.12,
                        top: -15,
                        right: -15,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: T.textMuted,
                        fontWeight: 500,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s.label}
                    </div>
                    <IconBox icon={s.icon} grad={grads[s.accent]} size={40} />
                  </div>
                  <div
                    style={{
                      fontSize: "1.9rem",
                      fontWeight: 800,
                      fontFamily: "'DM Mono',monospace",
                      color: T.text,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      marginBottom: "8px",
                    }}
                  >
                    <AnimatedNumber target={s.value} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: T.positive,
                        fontFamily: "'DM Mono',monospace",
                        fontWeight: 600,
                      }}
                    >
                      ↑ {s.change}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: T.textMuted }}>
                      vs last month
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Quick Actions ────────────────────────────────────────────── */}
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  fontSize: "0.98rem",
                  fontWeight: 700,
                  color: T.text,
                  marginBottom: "14px",
                  letterSpacing: "-0.01em",
                }}
              >
                Quick Actions
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: "14px",
                }}
              >
                {quickActions.map((qa, i) => {
                  const isDarkGrad = isDark;
                  return (
                    <div
                      key={qa.label}
                      className="qa-card fade-up"
                      style={{
                        background: T.bgCard,
                        border: `1px solid ${T.border}`,
                        borderRadius: "16px",
                        padding: "22px",
                        boxShadow: T.shadow,
                        cursor: "pointer",
                        animationDelay: `${0.25 + i * 0.07}s`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Soft gradient background blob */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: isDark ? 0.06 : 0.04,
                          background: `radial-gradient(circle at 80% 20%, ${qa.grad[0]}, transparent 60%)`,
                          pointerEvents: "none",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: isDark ? 0.04 : 0.03,
                          background: `radial-gradient(circle at 20% 80%, ${qa.grad[1]}, transparent 60%)`,
                          pointerEvents: "none",
                        }}
                      />
                      <IconBox icon={qa.icon} grad={qa.grad} size={48} />
                      <div
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 700,
                          color: T.text,
                          marginTop: "14px",
                          marginBottom: "6px",
                        }}
                      >
                        {qa.label}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: T.textSub,
                          lineHeight: 1.5,
                          marginBottom: "16px",
                        }}
                      >
                        {qa.desc}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: T.navActive,
                          cursor: "pointer",
                        }}
                      >
                        Explore
                        <Icon name="arrow" size={14} color={T.navActive} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Recent Activity ──────────────────────────────────────────── */}
            <div className="fade-up" style={{ animationDelay: "0.45s" }}>
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
                    fontSize: "0.98rem",
                    fontWeight: 700,
                    color: T.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Recent Activity
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: T.navActive,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View all →
                </span>
              </div>
              <div
                style={{
                  background: T.bgCard,
                  border: `1px solid ${T.border}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: T.shadow,
                }}
              >
                {activity.map((a, i) => (
                  <div
                    key={i}
                    className="activity-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      borderBottom:
                        i < activity.length - 1
                          ? `1px solid ${T.divider}`
                          : "none",
                    }}
                  >
                    {/* Icon circle */}
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "11px",
                        flexShrink: 0,
                        background: isDark ? `${a.color}18` : `${a.color}12`,
                        border: `1px solid ${a.color}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name={a.icon} size={16} color={a.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: T.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {a.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: T.textMuted,
                          marginTop: "2px",
                        }}
                      >
                        {a.sub}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: T.textMuted,
                        fontFamily: "'DM Mono',monospace",
                        flexShrink: 0,
                      }}
                    >
                      {a.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
