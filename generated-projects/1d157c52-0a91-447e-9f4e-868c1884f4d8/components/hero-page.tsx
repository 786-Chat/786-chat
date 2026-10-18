"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function HeroPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-slate-950"
    >
      {/* Animated background gradient */}
      <div className="animated-gradient absolute inset-0 opacity-30" />

      {/* Mouse glow effect */}
      {isHovering && (
        <div
          className="pointer-events-none absolute z-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl transition-transform duration-300"
          style={{
            left: mousePos.x - 128,
            top: mousePos.y - 128,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-20 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-200">
          <ShieldCheck className="h-4 w-4" />
          Trusted by 10,000+ businesses
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Secure Banking for the Modern World
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Experience a new level of financial security with our advanced
          platform. Manage your accounts, track transactions, and grow your
          wealth with confidence.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur">
            <TrendingUp className="mb-2 h-8 w-8 text-blue-400" />
            <div className="text-3xl font-bold">$2.5B+</div>
            <div className="text-sm text-slate-400">Assets managed</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur">
            <Users className="mb-2 h-8 w-8 text-blue-400" />
            <div className="text-3xl font-bold">10K+</div>
            <div className="text-sm text-slate-400">Active clients</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur">
            <ShieldCheck className="mb-2 h-8 w-8 text-blue-400" />
            <div className="text-3xl font-bold">99.9%</div>
            <div className="text-sm text-slate-400">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
}
