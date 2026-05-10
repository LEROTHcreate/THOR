"use client";

import { useEffect, useState } from "react";

const LS_KEY = "thor_dark_mode";

export function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    const isDark = stored === "1";
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  function toggle() {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem(LS_KEY, next ? "1" : "0");
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      return next;
    });
  }

  return { dark, toggle };
}

export default function DarkModeToggle({ accent = "#2D8CFF" }: { accent?: string }) {
  const { dark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      title={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        background: dark ? "rgba(15,23,42,0.65)" : "var(--glass-subtle-bg)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "var(--glass-subtle-border)"}`,
        borderRadius: 10,
        padding: "7px 12px",
        fontSize: 12,
        fontWeight: 500,
        color: dark ? "#94a3b8" : "#64748b",
        cursor: "pointer",
        marginTop: 6,
        transition: "all 0.2s",
      }}
    >
      {/* Icon */}
      {dark ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      <span>{dark ? "Mode clair" : "Mode sombre"}</span>
      {/* Toggle pill */}
      <span style={{
        marginLeft: "auto",
        width: 32,
        height: 18,
        borderRadius: 9,
        background: dark ? accent : "rgba(148,163,184,0.3)",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s",
      }}>
        <span style={{
          position: "absolute",
          top: 2,
          left: dark ? 16 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }} />
      </span>
    </button>
  );
}
