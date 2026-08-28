"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Factory,
  Truck,
  Boxes,
  Package,
  Wheat,
  Snowflake,
  SprayCan,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  ChevronRight,
  FolderOpen,
} from "lucide-react";

const apps = [
  { name: "Opening Checks", href: "/opening-checks", icon: ClipboardCheck, color: "bg-teal-500" },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "bg-sky-500" },
  { name: "Production", href: "/production", icon: Factory, color: "bg-emerald-500" },
  { name: "Delivery", href: "/delivery", icon: Truck, color: "bg-amber-500" },
  { name: "Ready Stock", href: "/inventory", icon: Boxes, color: "bg-violet-500" },
  { name: "Stock", href: "/stock", icon: Package, color: "bg-blue-500" },
  { name: "Products", href: "/products", icon: Package, color: "bg-pink-500" },
  { name: "Ingredients", href: "/ingredients", icon: Wheat, color: "bg-green-500" },
  { name: "Freezers", href: "/freezers", icon: Snowflake, color: "bg-cyan-500" },
  { name: "Cleaning", href: "/cleaning", icon: SprayCan, color: "bg-indigo-500" },
  { name: "HACCP", href: "/haccp", icon: ShieldCheck, color: "bg-red-500" },
  { name: "Documents", href: "/documents", icon: FileText, color: "bg-slate-500" },
  { name: "My Documents", href: "/my-documents", icon: FolderOpen, color: "bg-purple-500" },
  { name: "Closing Checks", href: "/closing-checks", icon: ClipboardCheck, color: "bg-orange-500" },
  { name: "Process Flow", href: "/process-flow", icon: Factory, color: "bg-fuchsia-500" },
];

const STORAGE_KEY = "raja-catering-launcher-order";

function loadOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {}
  return null;
}

function saveOrder(order: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {}
}

export default function MobileLauncher() {
  const [isMobile, setIsMobile] = useState(false);
  const [orderedApps, setOrderedApps] = useState(apps);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStarted = useRef(false);
  const dragItemRef = useRef<HTMLAnchorElement | null>(null);
  const dragOverItemRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const saved = loadOrder();
    if (saved) {
      const valid = saved.filter((name) => apps.some((app) => app.name === name));
      const missing = apps.filter((app) => !valid.includes(app.name)).map((app) => app.name);
      const fullOrder = [...valid, ...missing];
      const reordered = fullOrder
        .map((name) => apps.find((app) => app.name === name))
        .filter((app): app is typeof apps[number] => Boolean(app));
      setOrderedApps(reordered);
    }
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragStarted.current = true;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    if (dragItemRef.current) {
      dragItemRef.current.style.opacity = "0.5";
      dragItemRef.current.style.transform = "scale(1.05)";
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      setOrderedApps((prev) => {
        const next = [...prev];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);
        saveOrder(next.map((app) => app.name));
        return next;
      });
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragStarted.current = false;
    if (dragItemRef.current) {
      dragItemRef.current.style.opacity = "";
      dragItemRef.current.style.transform = "";
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragStarted.current = false;
    if (dragItemRef.current) {
      dragItemRef.current.style.opacity = "";
      dragItemRef.current.style.transform = "";
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    dragStarted.current = false;
    setDraggingIndex(index);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, index: number) => {
    if (draggingIndex !== index) return;
    const touch = e.touches[0];
    const start = dragStartPos.current;
    if (!start) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (!dragStarted.current && Math.abs(dx) + Math.abs(dy) > 10) {
      dragStarted.current = true;
    }
    if (!dragStarted.current) return;
    e.preventDefault();

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const link = element?.closest?.("a[data-launcher-index]");
    if (link) {
      const targetIndex = Number(link.getAttribute("data-launcher-index"));
      if (!Number.isNaN(targetIndex) && targetIndex !== index) {
        setDragOverIndex(targetIndex);
      }
    }
  }, [draggingIndex]);

  const handleTouchEnd = useCallback((e: React.TouchEvent, index: number) => {
    if (!dragStarted.current) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      dragStartPos.current = null;
      return;
    }
    e.preventDefault();
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const link = element?.closest?.("a[data-launcher-index]");
    if (link) {
      const targetIndex = Number(link.getAttribute("data-launcher-index"));
      if (!Number.isNaN(targetIndex) && targetIndex !== index) {
        setOrderedApps((prev) => {
          const next = [...prev];
          const [moved] = next.splice(index, 1);
          next.splice(targetIndex, 0, moved);
          saveOrder(next.map((app) => app.name));
          return next;
        });
      }
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragStartPos.current = null;
    dragStarted.current = false;
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="mx-auto min-h-full w-full max-w-md px-4 pb-8 pt-6">
        <div className="relative mb-8 flex items-center justify-center pt-4">
          <div className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-sky-500 text-lg font-bold text-slate-950">
            RC
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Raja Catering
            </h1>
            <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              Operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {orderedApps.map((app, index) => (
            <Link
              key={app.name}
              href={app.href}
              data-launcher-index={index}
              ref={index === draggingIndex ? dragItemRef : index === dragOverIndex ? dragOverItemRef : undefined}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={(e) => handleTouchMove(e, index)}
              onTouchEnd={(e) => handleTouchEnd(e, index)}
              className={`flex flex-col items-center gap-2 rounded-2xl p-2 transition active:scale-95 ${
                draggingIndex === index
                  ? "scale-105 shadow-xl opacity-80"
                  : dragOverIndex === index && draggingIndex !== null
                  ? "scale-95 opacity-60"
                  : ""
              }`}
              style={{
                transition: "transform 0.2s ease, opacity 0.2s ease",
                touchAction: "none",
              }}
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${app.color}`}
              >
                <app.icon className="h-8 w-8 text-white" />
              </span>
              <span className="text-center text-xs font-medium leading-tight text-slate-200">
                {app.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-1 text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>
  );
}
