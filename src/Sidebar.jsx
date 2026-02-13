import { useState } from "react";

// ── Icon component ─────────────────────────────────────
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
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
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

export default function Sidebar({
  navItems,
  onNavClick,
  activeNav,
  theme,
  logo,
  minimized: initialMinimized = false,
}) {
  const [minimized, setMinimized] = useState(initialMinimized);
  const T = theme;

  return (
    <div
      style={{
        width: minimized ? "64px" : "240px",
        background: T.bgSidebar,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        padding: minimized ? "18px 0" : "0",
        flexShrink: 0,
        transition: "width 0.3s ease",
        boxShadow:
          T.bg === "#070b1a" ? "none" : "2px 0 16px rgba(15,23,42,0.05)",
        position: "relative",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: minimized ? "0 0 20px 0" : "22px 20px 18px",
          display: "flex",
          alignItems: minimized ? "center" : "center",
          justifyContent: minimized ? "center" : "flex-start",
          gap: minimized ? "0" : "12px",
          borderBottom: minimized ? "none" : `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: minimized ? "36px" : "38px",
            height: minimized ? "36px" : "38px",
            background: T.logoGrad,
            borderRadius: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: T.logoGlow,
            flexShrink: 0,
          }}
        >
          {logo}
        </div>
        {!minimized && (
          <div>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 800,
                color: T.text,
                letterSpacing: "-0.01em",
              }}
            >
              PCSoft
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                color: T.textMuted,
                letterSpacing: "0.06em",
              }}
            >
              ANALYTICS
            </div>
          </div>
        )}
      </div>

      {/* Minimize Button */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: minimized ? "-12px" : "-12px",
          transform: "translateY(-50%)",
          width: "24px",
          height: "24px",
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          boxShadow: T.shadow,
        }}
        onClick={() => setMinimized(!minimized)}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.textMuted}
          strokeWidth="2"
        >
          {minimized ? (
            <polyline points="9 18 15 12 9 6" />
          ) : (
            <polyline points="15 18 9 12 15 6" />
          )}
        </svg>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: minimized ? "6px 10px" : "6px 10px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: minimized ? "center" : "stretch",
        }}
      >
        {navItems.map((item) => {
          const active = activeNav === item.label;
          return (
            <div
              key={item.label}
              onClick={() => onNavClick(item.label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: minimized ? "0" : "10px",
                padding: minimized ? "9px" : "9px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                marginBottom: "2px",
                background: active ? T.bgActive : "transparent",
                color: active ? T.navActive : T.navInactive,
                border: `1px solid ${active ? T.borderActive : "transparent"}`,
                justifyContent: minimized ? "center" : "flex-start",
                transition: "all 0.2s ease",
              }}
              title={minimized ? item.label : ""}
            >
              {typeof item.icon === "string" ? (
                <Icon
                  name={item.icon}
                  size={17}
                  color={active ? T.navActive : T.navInactive}
                />
              ) : (
                item.icon
              )}
              {!minimized && (
                <>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: active ? 600 : 400,
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        fontFamily: "'DM Mono', monospace",
                        background: active ? T.borderActive : T.badgeBg,
                        color: active ? "#fff" : T.textMuted,
                        padding: "1px 7px",
                        borderRadius: "99px",
                        border: `1px solid ${active ? "transparent" : T.border}`,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* User (only for expanded) */}
      {!minimized && (
        <div
          style={{
            padding: "14px 16px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              flexShrink: 0,
              background: "linear-gradient(135deg,#667eea,#764ba2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            JD
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: T.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              John Doe
            </div>
            <div style={{ fontSize: "0.62rem", color: T.textMuted }}>Admin</div>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.textMuted}
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
    </div>
  );
}
