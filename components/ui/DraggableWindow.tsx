"use client";

import { useState, useRef, useCallback, useEffect, type CSSProperties, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";

/* ─── Global z-index counter ──────────────────────────────────────────────── */
let zCounter = 1000;

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface DraggableWindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
  minWidth?: number;
  minHeight?: number;
  badge?: string;
  actions?: ReactNode;
}

interface Pos { x: number; y: number; }
interface Size { w: number; h: number; }

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function DraggableWindow({
  title,
  onClose,
  children,
  defaultWidth = 720,
  defaultHeight = 600,
  defaultX,
  defaultY,
  minWidth = 400,
  minHeight = 300,
  badge,
  actions,
}: DraggableWindowProps) {

  /* Initial position — lazy initializer avoids SSR issues */
  const [pos, setPos] = useState<Pos>(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    return {
      x: defaultX ?? (window.innerWidth - defaultWidth) / 2,
      y: defaultY ?? (window.innerHeight - defaultHeight) / 2,
    };
  });

  const [size, setSize] = useState<Size>({ w: defaultWidth, h: defaultHeight });
  const [zIndex, setZIndex] = useState<number>(() => ++zCounter);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const windowRef = useRef<HTMLDivElement>(null);

  /* Offset at the moment drag / resize starts */
  const dragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
  const resizeStart = useRef<{ mouseX: number; mouseY: number; w: number; h: number } | null>(null);

  /* Bring to front */
  const bringToFront = useCallback(() => {
    setZIndex(++zCounter);
  }, []);

  /* ── Drag handlers ────────────────────────────────────────────────────── */
  const handleDragMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    bringToFront();
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, posX: pos.x, posY: pos.y };
    setIsDragging(true);
  }, [pos, bringToFront]);

  const handleDragMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;

    const maxX = typeof window !== "undefined" ? window.innerWidth - size.w : 9999;
    const maxY = typeof window !== "undefined" ? window.innerHeight - 44 : 9999;

    setPos({
      x: clamp(dragStart.current.posX + dx, 0, maxX),
      y: clamp(dragStart.current.posY + dy, 0, maxY),
    });
  }, [size.w]);

  const handleDragMouseUp = useCallback(() => {
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  /* ── Resize handlers ──────────────────────────────────────────────────── */
  const handleResizeMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: size.w, h: size.h };
    setIsResizing(true);
  }, [size]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeStart.current) return;
    const dx = e.clientX - resizeStart.current.mouseX;
    const dy = e.clientY - resizeStart.current.mouseY;

    const maxW = typeof window !== "undefined" ? window.innerWidth - pos.x : 9999;
    const maxH = typeof window !== "undefined" ? window.innerHeight - pos.y : 9999;

    setSize({
      w: clamp(resizeStart.current.w + dx, minWidth, maxW),
      h: clamp(resizeStart.current.h + dy, minHeight, maxH),
    });
  }, [pos.x, pos.y, minWidth, minHeight]);

  const handleResizeMouseUp = useCallback(() => {
    resizeStart.current = null;
    setIsResizing(false);
  }, []);

  /* ── Attach / detach document listeners ──────────────────────────────── */
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDragMouseMove);
      document.addEventListener("mouseup", handleDragMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleDragMouseMove);
        document.removeEventListener("mouseup", handleDragMouseUp);
      };
    }
  }, [isDragging, handleDragMouseMove, handleDragMouseUp]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleResizeMouseMove);
        document.removeEventListener("mouseup", handleResizeMouseUp);
      };
    }
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  /* ── Styles ───────────────────────────────────────────────────────────── */
  const windowStyle: CSSProperties = {
    position: "fixed",
    left: pos.x,
    top: pos.y,
    width: size.w,
    height: size.h,
    zIndex,
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid var(--glass-strong-border)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
    borderRadius: 16,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    userSelect: isDragging || isResizing ? "none" : "auto",
  };

  const titleBarStyle: CSSProperties = {
    height: 44,
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 10px 0 12px",
    background: "var(--glass-strong-bg)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    cursor: isDragging ? "grabbing" : "grab",
    flexShrink: 0,
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: 0,
  };

  const resizeHandleStyle: CSSProperties = {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    cursor: "se-resize",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.4,
    zIndex: 2,
  };

  return (
    <div
      ref={windowRef}
      style={windowStyle}
      onMouseDown={() => bringToFront()}
    >
      {/* Title bar */}
      <div style={titleBarStyle} onMouseDown={handleDragMouseDown}>
        {/* Drag icon */}
        <span style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1, flexShrink: 0, pointerEvents: "none" }}>
          ⠿
        </span>

        {/* Badge */}
        {badge && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#475569",
            background: "rgba(148,163,184,0.15)",
            border: "1px solid rgba(148,163,184,0.25)",
            borderRadius: 99,
            padding: "2px 8px",
            letterSpacing: 0.3,
            flexShrink: 0,
            pointerEvents: "none",
          }}>
            {badge}
          </span>
        )}

        {/* Title */}
        <span style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: "#1e293b",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {title}
        </span>

        {/* Actions */}
        {actions && (
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
            onMouseDown={e => e.stopPropagation()}
          >
            {actions}
          </div>
        )}

        {/* Close button */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            flexShrink: 0,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
          }}
          aria-label="Fermer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        {children}
      </div>

      {/* Resize handle */}
      <div style={resizeHandleStyle} onMouseDown={handleResizeMouseDown}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M9 1L1 9M9 5L5 9M9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}
