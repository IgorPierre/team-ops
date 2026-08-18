"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/styles";

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]|:;<>,.?/~";

type Cell = {
  char: string;
  activeAt: number;
  delay: number;
  duration: number;
  hidden: boolean;
  box: string;
  text: string;
};

type AsciiCursorProps = {
  cellSize?: number;
  radius?: number;
  density?: number;
  hold?: number;
  boxColor?: string;
  textColor?: string;
  className?: string;
};

function effectAllowed() {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function AsciiCursor({
  cellSize = 13,
  radius = 25,
  density = 20,
  hold = 12,
  boxColor = "#17C473",
  textColor = "#298BBC",
  className,
}: AsciiCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ radius, density, hold, boxColor, textColor });
  live.current = { radius, density, hold, boxColor, textColor };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cell = Math.max(8, cellSize);
    let w = 1;
    let h = 1;
    let cols = 1;
    let rows = 1;
    let grid: Cell[] = [];
    let activeCells = new Set<number>();

    const rebuild = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, canvas.clientWidth);
      h = Math.max(1, canvas.clientHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.max(1, Math.ceil(w / cell) + 1);
      rows = Math.max(1, Math.ceil(h / cell) + 1);
      grid = Array.from({ length: cols * rows }, () => ({
        char: " ",
        activeAt: 0,
        delay: 0.05,
        duration: 0.25,
        hidden: false,
        box: "",
        text: "",
      }));
      activeCells = new Set();
    };
    rebuild();
    const ro = new ResizeObserver(rebuild);
    ro.observe(canvas);

    let mouseX = -1e4;
    let mouseY = -1e4;
    let trailX = -1e4;
    let trailY = -1e4;

    const previousCursor = document.documentElement.style.cursor;
    let cursorHidden = false;
    const hideNativeCursor = (hide: boolean) => {
      if (hide === cursorHidden) return;
      cursorHidden = hide;
      document.documentElement.style.cursor = hide ? "none" : previousCursor;
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (inside) {
        const sx = rect.width > 0 ? canvas.clientWidth / rect.width : 1;
        const sy = rect.height > 0 ? canvas.clientHeight / rect.height : 1;
        mouseX = (e.clientX - rect.left) * sx;
        mouseY = (e.clientY - rect.top) * sy;
        canvas.style.opacity = "1";
      } else {
        mouseX = -1e4;
        mouseY = -1e4;
      }
      hideNativeCursor(inside);
    };
    const onLeave = () => {
      mouseX = -1e4;
      mouseY = -1e4;
      hideNativeCursor(false);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = (entries[0]?.isIntersecting ?? true) && !document.hidden;
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    const onVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    let raf = 0;
    let last = performance.now();
    const mono =
      getComputedStyle(document.documentElement).getPropertyValue("--font-mono-face").trim() || "ui-monospace";

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const p = live.current;
      const t = now / 1000;

      let moving = false;
      if (mouseX <= -1e4) {
        trailX = -1e4;
        trailY = -1e4;
      } else if (trailX <= -1e4) {
        trailX = mouseX;
        trailY = mouseY;
      } else {
        const dx = mouseX - trailX;
        const dy = mouseY - trailY;
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          const ease = 1 - Math.exp(-dt / 0.004);
          trailX += dx * ease;
          trailY += dy * ease;
          moving = true;
        } else {
          trailX = mouseX;
          trailY = mouseY;
        }
      }

      if (moving) {
        const box = p.boxColor;
        const text = p.textColor;
        const r = Math.max(1, p.radius);
        const rSq = r * r;
        const impact = p.density / 8;
        const holdScale = Math.max(0.1, p.hold / 10);
        const startCol = Math.max(0, Math.floor((trailX - r) / cell));
        const endCol = Math.min(cols - 1, Math.ceil((trailX + r) / cell));
        const startRow = Math.max(0, Math.floor((trailY - r) / cell));
        const endRow = Math.min(rows - 1, Math.ceil((trailY + r) / cell));

        for (let c = startCol; c <= endCol; c++) {
          for (let rw = startRow; rw <= endRow; rw++) {
            const cx = c * cell + cell / 2;
            const cy = rw * cell + cell / 2;
            const dx = trailX - cx;
            const dy = trailY - cy;
            const distSq = dx * dx + dy * dy;
            if (distSq >= rSq) continue;

            const falloff = (1 - Math.sqrt(distSq) / r) ** 1.5;
            if (Math.random() >= falloff * impact) continue;

            const idx = c * rows + rw;
            const cellData = grid[idx];
            if (!cellData) continue;
            if (cellData.activeAt === 0 || t - cellData.activeAt > 0.2) {
              cellData.delay = (0.03 + Math.random() * 0.05) * holdScale;
              cellData.duration = (0.1 + Math.random() * 0.15) * holdScale;
              cellData.hidden = Math.random() < 0.04;
            }
            cellData.activeAt = t;
            if (cellData.char === " " || Math.random() < 0.15) {
              cellData.char = POOL[Math.floor(Math.random() * POOL.length)] ?? "#";
            }
            cellData.box = box;
            cellData.text = text;
            activeCells.add(idx);
          }
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.font = `600 ${cell - 6}px ${mono}, ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const scramble = 1 - Math.exp(-7.2 * dt);

      for (const idx of activeCells) {
        const cellData = grid[idx];
        if (!cellData || cellData.activeAt === 0) {
          activeCells.delete(idx);
          continue;
        }
        const elapsed = t - cellData.activeAt;
        if (elapsed >= cellData.delay + cellData.duration) {
          cellData.char = " ";
          cellData.activeAt = 0;
          cellData.hidden = false;
          activeCells.delete(idx);
          continue;
        }
        if (cellData.hidden) continue;

        const c = Math.floor(idx / rows);
        const rw = idx % rows;
        if (elapsed >= cellData.delay && Math.random() < scramble) {
          cellData.char = POOL[Math.floor(Math.random() * POOL.length)] ?? "#";
        }
        const x = c * cell;
        const y = rw * cell;
        ctx.fillStyle = cellData.box || p.boxColor;
        ctx.fillRect(x, y, cell, cell);
        ctx.fillStyle = cellData.text || p.textColor;
        ctx.fillText(cellData.char, x + cell / 2, y + cell / 2);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      hideNativeCursor(false);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [cellSize]);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-10 overflow-hidden", className)}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block size-full opacity-0"
      />
    </div>
  );
}

export function FaqAsciiCursor() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const update = () => setOn(effectAllowed());
    update();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    motion.addEventListener("change", update);
    pointer.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      pointer.removeEventListener("change", update);
    };
  }, []);

  if (!on) return null;
  return <AsciiCursor />;
}
