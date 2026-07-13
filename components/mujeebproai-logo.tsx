"use client"

import { motion } from "framer-motion"

interface LogoProps {
  variant?: "full" | "compact" | "icon" | "favicon"
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  animated?: boolean
  showText?: boolean
  className?: string
}

const sizeMap = {
  xs: { icon: 36, text: "text-base" },
  sm: { icon: 48, text: "text-xl" },
  md: { icon: 60, text: "text-2xl" },
  lg: { icon: 80, text: "text-3xl" },
  xl: { icon: 96, text: "text-5xl" },
}

function BrandMark({ size, animated }: { size: number; animated: boolean }) {
  return (
    <motion.div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[28%] border border-cyan-300/25 bg-slate-950/90 shadow-[0_0_28px_rgba(34,211,238,0.18)]"
      style={{ width: size, height: size }}
      animate={animated ? { y: [0, -2, 0], boxShadow: ["0 0 20px rgba(34,211,238,.14)", "0 0 34px rgba(139,92,246,.28)", "0 0 20px rgba(34,211,238,.14)"] } : undefined}
      transition={animated ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
      aria-label="786 Chat AI"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,.22),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,.24),transparent_45%)]" />
      <div className="relative flex flex-col items-center justify-center leading-none">
        <span
          className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text font-black tracking-[-0.08em] text-transparent"
          style={{ fontSize: Math.max(15, size * 0.36) }}
        >
          786
        </span>
        <span
          className="mt-1 font-semibold uppercase tracking-[0.12em] text-white/90"
          style={{ fontSize: Math.max(6, size * 0.1) }}
        >
          Chat AI
        </span>
      </div>
    </motion.div>
  )
}

function BrandText({ textClass }: { textClass: string }) {
  return (
    <span
      className={`bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text font-black tracking-[-0.06em] text-transparent drop-shadow-[0_0_12px_rgba(34,211,238,0.18)] ${textClass}`}
    >
      786
    </span>
  )
}

export function MujeebProAILogo({
  variant = "full",
  size = "md",
  animated = true,
  showText = true,
  className = "",
}: LogoProps) {
  const dims = sizeMap[size]

  if (variant === "favicon" || variant === "icon") {
    return (
      <div className={`relative shrink-0 ${className}`}>
        <BrandMark size={dims.icon} animated={animated} />
      </div>
    )
  }

  return (
    <div className={`relative z-20 flex items-center ${variant === "compact" ? "gap-2" : "gap-4"} ${className}`}>
      <BrandMark size={dims.icon} animated={variant === "compact" ? false : animated} />
      {showText && <BrandText textClass={dims.text} />}
    </div>
  )
}
